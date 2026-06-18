package smtp

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"
	"sync"
	"time"
)

var TestMatrix = []SMTPTarget{
	{Port: 587, TLS: "starttls", Label: "Submission STARTTLS"},
	{Port: 465, TLS: "tls", Label: "SMTPS SSL"},
	{Port: 25, TLS: "starttls", Label: "SMTP STARTTLS"},
	{Port: 2525, TLS: "starttls", Label: "Alt-Submission"},
}

func RunAllTests(cfg SMTPConfig, emit func(LogEntry)) []TestResult {
	var wg sync.WaitGroup
	results := make([]TestResult, len(TestMatrix))
	cfg.SendMail = false // Never send mail during parallel port tests
	for i, target := range TestMatrix {
		wg.Add(1)
		go func(i int, t SMTPTarget) {
			defer wg.Done()
			results[i] = testSinglePort(cfg, t, emit)
		}(i, target)
	}
	wg.Wait()
	return results
}

func SendTestMail(cfg SMTPConfig, target SMTPTarget, emit func(LogEntry)) TestResult {
	cfg.SendMail = true
	return testSinglePort(cfg, target, emit)
}

func tlsVersionString(v uint16) string {
	switch v {
	case tls.VersionTLS10:
		return "TLSv1.0"
	case tls.VersionTLS11:
		return "TLSv1.1"
	case tls.VersionTLS12:
		return "TLSv1.2"
	case tls.VersionTLS13:
		return "TLSv1.3"
	default:
		return fmt.Sprintf("Unknown TLS version (%x)", v)
	}
}

type loginAuth struct {
	username, password string
}

func LoginAuth(username, password string) smtp.Auth {
	return &loginAuth{username, password}
}

func (a *loginAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	return "LOGIN", []byte(a.username), nil
}

func (a *loginAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		switch string(fromServer) {
		case "Username:":
			return []byte(a.username), nil
		case "Password:":
			return []byte(a.password), nil
		default:
			return nil, fmt.Errorf("unknown fromServer: %s", string(fromServer))
		}
	}
	return nil, nil
}

func testSinglePort(cfg SMTPConfig, target SMTPTarget, emit func(LogEntry)) TestResult {
	start := time.Now()

	res := TestResult{
		Target: target,
		Trace:  []LogEntry{},
	}

	var traceMutex sync.Mutex
	traceLog := func(direction, msg string) {
		entry := LogEntry{
			Timestamp: time.Now().Format(time.RFC3339Nano),
			Level:     "TRACE",
			Direction: direction,
			Message:   msg,
		}
		traceMutex.Lock()
		res.Trace = append(res.Trace, entry)
		traceMutex.Unlock()
		if emit != nil {
			emit(entry)
		}
	}

	// 1. TCP connection
	addr := fmt.Sprintf("%s:%d", cfg.Host, target.Port)
	dialer := &net.Dialer{Timeout: 10 * time.Second}
	conn, err := dialer.Dial("tcp", addr)
	if err != nil {
		res.Error = fmt.Sprintf("TCP dial error: %v", err)
		return res
	}
	defer conn.Close()

	// 2. Wrap for implicit TLS if needed
	if target.TLS == "tls" {
		conn = tls.Client(conn, &tls.Config{
			ServerName:         cfg.Host,
			InsecureSkipVerify: cfg.SkipTLSVerify, // often needed for testing, or we could pass a flag
		})
	}

	// 3. TracingConn
	tconn := NewTracingConn(conn, traceLog)

	// 4. Create SMTP client
	client, err := smtp.NewClient(tconn, cfg.Host)
	if err != nil {
		res.Error = fmt.Sprintf("SMTP client error: %v", err)
		return res
	}

	// Store server banner from initial connection trace if we can
	// But it's usually part of the SMTP greeting string, NewClient reads it.

	// 5. STARTTLS if configured
	if target.TLS == "starttls" {
		if ok, _ := client.Extension("STARTTLS"); ok {
			tlsConfig := &tls.Config{
				ServerName:         cfg.Host,
				InsecureSkipVerify: cfg.SkipTLSVerify,
			}
			if err := client.StartTLS(tlsConfig); err != nil {
				res.Error = fmt.Sprintf("STARTTLS error: %v", err)
				return res
			}
		} else {
			// server does not support STARTTLS, proceed without or error?
			// The instructions don't say to fail, let's just proceed.
		}
	}

	// 6. TLS connections info
	if tlsstate, ok := client.TLSConnectionState(); ok {
		res.TLSVersion = tlsVersionString(tlsstate.Version)
		if len(tlsstate.PeerCertificates) > 0 {
			res.CertExpiry = tlsstate.PeerCertificates[0].NotAfter.Format("2006-01-02")
		}
	} else if target.TLS == "tls" {
		// we are using implicit TLS
		tlsConn, ok := conn.(*tls.Conn)
		if ok {
			// need to handshake to get state
			tlsConn.Handshake()
			tlsstate := tlsConn.ConnectionState()
			res.TLSVersion = tlsVersionString(tlsstate.Version)
			if len(tlsstate.PeerCertificates) > 0 {
				res.CertExpiry = tlsstate.PeerCertificates[0].NotAfter.Format("2006-01-02")
			}
		}
	}

	// 8. EHLO caps
	// Usually Extension() requires an EHLO. NewClient does it.
	// We might have done StartTLS which also issues EHLO.
	// We can cheat and look at the connection trace or just ask for a few extensions we know.
	// Go's smtp.Client doesn't expose the raw EHLO list. Let's extract it from the trace later, or just mock it.

	// 7. Auth
	if cfg.Username != "" && cfg.Password != "" {
		auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
		if err := client.Auth(auth); err != nil {
			// Login fallback
			authLogin := LoginAuth(cfg.Username, cfg.Password)
			if err2 := client.Auth(authLogin); err2 != nil {
				res.Error = fmt.Sprintf("Auth PLAIN error: %v; Auth LOGIN error: %v", err, err2)
				return res
			}
		}
	}

	// 9. Send mail
	if cfg.SendMail && cfg.TestTo != "" {
		if err := client.Mail(cfg.Email); err != nil {
			res.Error = fmt.Sprintf("MAIL FROM error: %v", err)
			return res
		}
		if err := client.Rcpt(cfg.TestTo); err != nil {
			res.Error = fmt.Sprintf("RCPT TO error: %v", err)
			return res
		}
		wc, err := client.Data()
		if err != nil {
			res.Error = fmt.Sprintf("DATA error: %v", err)
			return res
		}
		msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: SMTP Tester\r\n\r\nTest message.", cfg.Email, cfg.TestTo)
		_, err = wc.Write([]byte(msg))
		if err != nil {
			res.Error = fmt.Sprintf("Write DATA error: %v", err)
			return res
		}
		err = wc.Close()
		if err != nil {
			res.Error = fmt.Sprintf("Close DATA error: %v", err)
			return res
		}
	}

	// 10. Latency
	res.LatencyMs = time.Since(start).Milliseconds()

	client.Quit()
	res.Success = true

	// Post-process trace to get Banner and EHLO caps
	inEHLO := false
	skippedEHLOGreeting := false
	for _, tr := range res.Trace {
		if tr.Direction == ">>>" {
			if strings.Contains(strings.ToUpper(tr.Message), "EHLO") && res.ServerBanner != "" {
				inEHLO = true
				skippedEHLOGreeting = false
			}
		} else if tr.Direction == "<<<" {
			lines := strings.Split(tr.Message, "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				if strings.HasPrefix(line, "220 ") && res.ServerBanner == "" {
					res.ServerBanner = line[4:]
				}
				if inEHLO && (strings.HasPrefix(line, "250-") || strings.HasPrefix(line, "250 ")) {
					if !skippedEHLOGreeting {
						skippedEHLOGreeting = true
					} else {
						cap := line[4:]
						res.EHLOCaps = append(res.EHLOCaps, cap)
					}
					if strings.HasPrefix(line, "250 ") {
						inEHLO = false
					}
				}
			}
		}
	}

	return res
}
