package smtp

import (
	"testing"
)

func TestRedactor_AuthLogin(t *testing.T) {
	r := &Redactor{}
	if got := r.AuthLine("AUTH LOGIN\r\n"); got != "AUTH LOGIN\r\n" {
		t.Errorf("got %q", got)
	}
	if got := r.AuthLine("dXNlcg==\r\n"); got != "dXNlcg==\r\n" {
		t.Errorf("got %q", got)
	}
	if got := r.AuthLine("cGFzcw==\r\n"); got != "[PASSWORD - REDACTED]\r\n" {
		t.Errorf("got %q", got)
	}
}

func TestRedactor_AuthLoginInline(t *testing.T) {
	r := &Redactor{}
	if got := r.AuthLine("AUTH LOGIN dXNlcg==\r\n"); got != "AUTH LOGIN dXNlcg==\r\n" {
		t.Errorf("got %q", got)
	}
	if got := r.AuthLine("cGFzcw==\r\n"); got != "[PASSWORD - REDACTED]\r\n" {
		t.Errorf("got %q", got)
	}
}

func TestRedactor_AuthPlain(t *testing.T) {
	r := &Redactor{}
	if got := r.AuthLine("AUTH PLAIN\r\n"); got != "AUTH PLAIN\r\n" {
		t.Errorf("got %q", got)
	}
	if got := r.AuthLine("YmFzZTY0Y3JlZHM=\r\n"); got != "[PASSWORD - REDACTED]\r\n" {
		t.Errorf("got %q", got)
	}
}

func TestRedactor_AuthPlainInline(t *testing.T) {
	r := &Redactor{}
	if got := r.AuthLine("AUTH PLAIN YmFzZTY0Y3JlZHM=\r\n"); got != "AUTH PLAIN [PASSWORD - REDACTED]\r\n" {
		t.Errorf("got %q", got)
	}
}
