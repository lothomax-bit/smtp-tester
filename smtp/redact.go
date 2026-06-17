package smtp

import (
	"strings"
)

type Redactor struct {
	state int // 0=normal, 1=expect-user, 2=expect-pass, 3=expect-plain-cred
}

func (r *Redactor) AuthLine(data string) string {
	upperData := strings.ToUpper(data)
	trimmedUpper := strings.TrimSpace(upperData)

	if r.state == 1 { // expect-user
		r.state = 2
		return data
	} else if r.state == 2 { // expect-pass
		r.state = 0
		if strings.HasSuffix(data, "\r\n") {
			return "[PASSWORD - REDACTED]\r\n"
		} else if strings.HasSuffix(data, "\n") {
			return "[PASSWORD - REDACTED]\n"
		}
		return "[PASSWORD - REDACTED]"
	} else if r.state == 3 { // expect-plain-cred
		r.state = 0
		if strings.HasSuffix(data, "\r\n") {
			return "[PASSWORD - REDACTED]\r\n"
		} else if strings.HasSuffix(data, "\n") {
			return "[PASSWORD - REDACTED]\n"
		}
		return "[PASSWORD - REDACTED]"
	}

	if strings.HasPrefix(upperData, "AUTH LOGIN") {
		if trimmedUpper == "AUTH LOGIN" {
			r.state = 1
		} else {
			r.state = 2
		}
		return data
	}

	if strings.HasPrefix(upperData, "AUTH PLAIN") {
		if trimmedUpper == "AUTH PLAIN" {
			r.state = 3
			return data
		} else {
			suffix := "\n"
			if strings.HasSuffix(data, "\r\n") {
				suffix = "\r\n"
			} else if !strings.HasSuffix(data, "\n") {
				suffix = ""
			}
			return data[:11] + "[PASSWORD - REDACTED]" + suffix
		}
	}

	return data
}
