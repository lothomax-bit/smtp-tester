package smtp

import (
	"net"
)

type TracingConn struct {
	net.Conn
	logFn    func(direction, data string)
	redactor Redactor
}

func NewTracingConn(conn net.Conn, logFn func(direction, data string)) *TracingConn {
	return &TracingConn{
		Conn:  conn,
		logFn: logFn,
	}
}

func (t *TracingConn) Read(b []byte) (int, error) {
	n, err := t.Conn.Read(b)
	if n > 0 {
		t.logFn("<<<", string(b[:n]))
	}
	return n, err
}

func (t *TracingConn) Write(b []byte) (int, error) {
	t.logFn(">>>", t.redactor.AuthLine(string(b)))
	return t.Conn.Write(b)
}
