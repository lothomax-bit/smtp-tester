# SMTP Tester — Export Spezifikation

## Verhalten
- Export-Button erscheint erst nach Abschluss mindestens eines Tests
- Nutzer waehlt Format: `.json` oder `.txt` (Dialog mit zwei Optionen)
- Windows Save-Dialog via `runtime.SaveFileDialog(ctx, runtime.SaveDialogOptions{...})`
- Dateiname-Vorschlag: `smtp-test_<hostname>_<YYYYMMDD-HHMMSS>.<ext>`

## JSON-Format

```json
{
  "exported_at": "2026-06-17T22:04:01Z",
  "smtp_server": "mail.example.com",
  "email": "user@example.com",
  "username": "user@example.com",
  "results": [
    {
      "port": 587,
      "tls_mode": "starttls",
      "label": "Submission STARTTLS",
      "success": true,
      "latency_ms": 342,
      "server_banner": "Postfix ESMTP",
      "ehlo_caps": ["SIZE 52428800", "STARTTLS", "AUTH LOGIN PLAIN"],
      "tls_version": "TLSv1.3",
      "cert_expiry": "2027-03-14",
      "error": "",
      "trace": []
    },
    {
      "port": 465,
      "tls_mode": "tls",
      "label": "SMTPS SSL",
      "success": false,
      "latency_ms": 10001,
      "server_banner": "",
      "ehlo_caps": [],
      "tls_version": "",
      "cert_expiry": "",
      "error": "connection refused",
      "trace": [
        {"timestamp": "2026-06-17T22:04:01.413Z", "level": "INFO",  "direction": "",    "message": "Verbinde zu mail.example.com:465..."},
        {"timestamp": "2026-06-17T22:04:01.501Z", "level": "ERROR", "direction": "",    "message": "Connection refused"}
      ]
    }
  ]
}
```

### Redaction-Regeln im Export
- `email` und `username` werden exportiert (kein Geheimnis)
- `password` wird **niemals** exportiert -- Feld existiert nicht im Export-Struct
- AUTH-Pakete im `trace`-Array: Credential-Zeilen enthalten `[PASSWORD - REDACTED]`

## TXT-Format (menschenlesbar)

```
SMTP Tester -- Exportbericht
Erstellt:     2026-06-17 22:04:01
SMTP-Server:  mail.example.com
E-Mail:       user@example.com
Benutzername: user@example.com

==========================================
Port 587 -- Submission STARTTLS
Status:   OK
Latenz:   342ms
Banner:   Postfix ESMTP
TLS:      TLSv1.3
Zertifikat gueltig bis: 2027-03-14
EHLO:     SIZE 52428800 | STARTTLS | AUTH LOGIN PLAIN
==========================================
Port 465 -- SMTPS SSL
Status:   FEHLER
Fehler:   connection refused

--- SMTP Trace ---
[22:04:01.413] INFO  Verbinde zu mail.example.com:465...
[22:04:01.501] ERROR Connection refused
==========================================
```

## Go Export-Logik (`smtp/exporter.go`)

```go
// ExportConfig enthaelt bewusst kein Password-Feld
type ExportConfig struct {
    SMTPServer string
    Email      string
    Username   string
}

func ExportJSON(results []TestResult, cfg ExportConfig) ([]byte, error)
func ExportTXT(results []TestResult, cfg ExportConfig) ([]byte, error)
```

## app.go Binding

```go
// Wird von React aufgerufen, oeffnet Windows Save-Dialog
func (a *App) ExportResults(results []smtp.TestResult, email, username, server, format string) string {
    // format: "json" oder "txt"
    // Rueckgabe: Pfad der gespeicherten Datei oder Fehlermeldung
}
```
