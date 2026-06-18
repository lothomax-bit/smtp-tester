package smtp

import (
	"net"
	"strings"
)

type TracingConn struct {
	net.Conn
	logFn    func(direction, data string)
	redactor Redactor
	muted    bool
}

func NewTracingConn(conn net.Conn, logFn func(direction, data string)) *TracingConn {
	return &TracingConn{
		Conn:  conn,
		logFn: logFn,
	}
}

func (t *TracingConn) Read(b []byte) (int, error) {
	n, err := t.Conn.Read(b)
	if n > 0 && !t.muted {
		lines := strings.Split(string(b[:n]), "\r\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" {
				t.logFn("<<<", line)
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

	prevState := t.redactor.state
	authLine := t.redactor.AuthLine(strB)
	newState := t.redactor.state

	if prevState > 0 && newState == 0 {
		t.muted = true
	}

	t.logFn(">>>", authLine)
	return t.Conn.Write(b)
}
