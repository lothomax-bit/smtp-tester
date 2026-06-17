package smtp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type ExportConfig struct {
	SMTPServer string
	Email      string
	Username   string
}

type exportJSONFormat struct {
	ExportedAt string       `json:"exported_at"`
	SMTPServer string       `json:"smtp_server"`
	Email      string       `json:"email"`
	Username   string       `json:"username"`
	Results    []TestResult `json:"results"`
}

func ExportJSON(results []TestResult, cfg ExportConfig) ([]byte, error) {
	// Redact logs using Redactor
	// The results from testers already have [PASSWORD - REDACTED] from TracingConn but let's make sure if needed.
	// Actually, the TracingConn redactor handles AUTH PLAIN and AUTH LOGIN.

	exportData := exportJSONFormat{
		ExportedAt: time.Now().UTC().Format(time.RFC3339),
		SMTPServer: cfg.SMTPServer,
		Email:      cfg.Email,
		Username:   cfg.Username,
		Results:    results,
	}

	return json.MarshalIndent(exportData, "", "  ")
}

func ExportTXT(results []TestResult, cfg ExportConfig) ([]byte, error) {
	var buf bytes.Buffer

	now := time.Now().UTC()

	buf.WriteString("SMTP Tester -- Exportbericht\n")
	buf.WriteString(fmt.Sprintf("Erstellt:     %s\n", now.Format("2006-01-02 15:04:05")))
	buf.WriteString(fmt.Sprintf("SMTP-Server:  %s\n", cfg.SMTPServer))
	buf.WriteString(fmt.Sprintf("E-Mail:       %s\n", cfg.Email))
	buf.WriteString(fmt.Sprintf("Benutzername: %s\n", cfg.Username))
	buf.WriteString("\n")

	for _, r := range results {
		buf.WriteString("==========================================\n")
		buf.WriteString(fmt.Sprintf("Port %d -- %s\n", r.Target.Port, r.Target.Label))

		status := "FEHLER"
		if r.Success {
			status = "OK"
		}
		buf.WriteString(fmt.Sprintf("Status:   %s\n", status))

		if r.Success {
			buf.WriteString(fmt.Sprintf("Latenz:   %dms\n", r.LatencyMs))
			buf.WriteString(fmt.Sprintf("Banner:   %s\n", r.ServerBanner))
			if r.TLSVersion != "" {
				buf.WriteString(fmt.Sprintf("TLS:      %s\n", r.TLSVersion))
				if r.CertExpiry != "" {
					buf.WriteString(fmt.Sprintf("Zertifikat gueltig bis: %s\n", r.CertExpiry))
				}
			}
			if len(r.EHLOCaps) > 0 {
				buf.WriteString(fmt.Sprintf("EHLO:     %s\n", strings.Join(r.EHLOCaps, " | ")))
			}
		} else {
			buf.WriteString(fmt.Sprintf("Fehler:   %s\n", r.Error))
			buf.WriteString("\n--- SMTP Trace ---\n")
			for _, trace := range r.Trace {
				// Parse RFC3339 timestamp
				ts, err := time.Parse(time.RFC3339Nano, trace.Timestamp)
				tsStr := trace.Timestamp
				if err == nil {
					tsStr = ts.Format("15:04:05.000")
				}

				// [22:04:01.413] INFO  Verbinde zu mail.example.com:465...
				if trace.Direction != "" {
					buf.WriteString(fmt.Sprintf("[%s] %-5s %s %s\n", tsStr, trace.Level, trace.Direction, trace.Message))
				} else {
					buf.WriteString(fmt.Sprintf("[%s] %-5s %s\n", tsStr, trace.Level, trace.Message))
				}
			}
		}
	}
	buf.WriteString("==========================================\n")

	return buf.Bytes(), nil
}
