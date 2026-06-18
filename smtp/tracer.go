package smtp

import (
	"net"
	"strings"
)

type TracingConn struct {
	net.Conn
	logFn         func(direction, data string)
	redactor      Redactor
	muted         bool
	postAuthMuted bool
}

func NewTracingConn(conn net.Conn, logFn func(direction, data string)) *TracingConn {
	return &TracingConn{
		Conn:  conn,
		logFn: logFn,
	}
}

func (t *TracingConn) Read(b []byte) (int, error) {
	n, err := t.Conn.Read(b)
	if n > 0 && !t.muted && !t.postAuthMuted {
		lines := strings.Split(string(b[:n]), "\r\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed != "" {
				// Check for garbage
				garbageCount := 0
				for _, r := range line {
					if r != '\r' && r != '\n' && r != '\t' {
						if r < 32 || r > 126 {
							garbageCount++
						}
					}
				}
				if len(line) > 0 && float64(garbageCount)/float64(len(line)) > 0.2 {
					continue
				}
				t.logFn("<<<", trimmed)
			}
		}
	}
	return n, err
}

func (t *TracingConn) Write(b []byte) (int, error) {
	strB := string(b)
	upperStr := strings.ToUpper(strB)

	if strings.Contains(upperStr, "EHLO ") || strings.Contains(upperStr, "STARTTLS") {
		t.muted = false
	}

	if strings.HasPrefix(upperStr, "MAIL ") || strings.HasPrefix(upperStr, "RCPT ") || strings.HasPrefix(upperStr, "DATA") {
		t.postAuthMuted = false
	}

	prevState := t.redactor.state
	authLine := t.redactor.AuthLine(strB)
	newState := t.redactor.state

	if prevState > 0 && newState == 0 {
		t.muted = true
		t.postAuthMuted = true
	}

	t.logFn(">>>", authLine)
	return t.Conn.Write(b)
}
