package smtp

import (
	"fmt"
	"net"
	"strings"
	"testing"
	"time"
)

// A dummy SMTP server to test testSinglePort
func startDummySMTPServer(t *testing.T, port int, tlsMode string) net.Listener {
	l, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
	if err != nil {
		t.Fatalf("Listen failed: %v", err)
	}

	go func() {
		for {
			conn, err := l.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				c.Write([]byte("220 dummy.server ESMTP\r\n"))

				buf := make([]byte, 1024)
				for {
					n, err := c.Read(buf)
					if err != nil {
						return
					}
					msg := string(buf[:n])
					upper := strings.ToUpper(msg)
					if strings.HasPrefix(upper, "EHLO") || strings.HasPrefix(upper, "HELO") {
						c.Write([]byte("250-dummy.server\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n"))
					} else if strings.HasPrefix(upper, "AUTH") {
						if strings.Contains(upper, "PLAIN") {
							c.Write([]byte("235 2.7.0 Authentication successful\r\n"))
						} else {
							// For Login
							c.Write([]byte("334 VXNlcm5hbWU6\r\n")) // Username:
						}
					} else if upper == "QUIT\r\n" {
						c.Write([]byte("221 2.0.0 Bye\r\n"))
						return
					} else if strings.HasPrefix(upper, "MAIL FROM") || strings.HasPrefix(upper, "RCPT TO") {
						c.Write([]byte("250 2.1.0 Ok\r\n"))
					} else if strings.HasPrefix(upper, "DATA") {
						c.Write([]byte("354 End data with <CR><LF>.<CR><LF>\r\n"))
					} else if strings.HasSuffix(msg, "\r\n.\r\n") {
						c.Write([]byte("250 2.0.0 Ok: queued\r\n"))
					} else {
						// For Auth Login's username/password steps
						if len(msg) > 0 {
							c.Write([]byte("235 2.7.0 Authentication successful\r\n"))
						}
					}
				}
			}(conn)
		}
	}()

	return l
}

func TestTester_Basic(t *testing.T) {
	port := 25252
	l := startDummySMTPServer(t, port, "none")
	defer l.Close()

	// Wait briefly for server to start
	time.Sleep(100 * time.Millisecond)

	cfg := SMTPConfig{
		Host:     "127.0.0.1",
		Username: "user",
		Password: "password",
	}

	target := SMTPTarget{
		Port:  port,
		TLS:   "none", // using plain text dummy server
		Label: "Plain",
	}

	res := testSinglePort(cfg, target, func(le LogEntry) {})
	if !res.Success {
		t.Errorf("expected success, got error: %v", res.Error)
	}

	if res.ServerBanner != "dummy.server ESMTP" {
		t.Errorf("unexpected banner: %v", res.ServerBanner)
	}
}
