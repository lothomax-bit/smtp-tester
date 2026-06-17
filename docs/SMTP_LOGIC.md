# SMTP Tester — Backend Logik

## Test-Matrix

Folgende Port/TLS-Kombinationen werden bei jedem Test automatisch und parallel geprueft:

| Port | TLS-Modus | Label |
|------|-----------|-------|
| 587  | STARTTLS  | Submission (Standard) |
| 465  | SSL/TLS   | SMTPS (Legacy SSL) |
| 25   | STARTTLS  | SMTP (Classic MTA) |
| 2525 | STARTTLS  | Submission (Fallback) |

Timeout pro Versuch: **10 Sekunden**.

## Datentypen (`smtp/types.go`)

```go
type SMTPConfig struct {
    Host     string
    Username string
    Password string
    Email    string  // Absender-Adresse
    TestTo   string  // Empfaenger fuer Test-Mail (optional)
    SendMail bool    // Checkbox: Test-Mail senden?
}

type SMTPTarget struct {
    Port  int
    TLS   string // "starttls" | "tls" | "none"
    Label string
}

type LogEntry struct {
    Timestamp string // ISO 8601
    Level     string // "TRACE" | "INFO" | "OK" | "WARN" | "ERROR"
    Direction string // ">>>" | "<<<" | "" (nur bei TRACE)
    Message   string
}

type TestResult struct {
    Target       SMTPTarget
    Success      bool
    LatencyMs    int64
    ServerBanner string
    EHLOCaps     []string
    TLSVersion   string    // z.B. "TLSv1.3"
    CertExpiry   string    // z.B. "2027-03-14"
    Error        string    // leer wenn erfolgreich
    Trace        []LogEntry // SMTP-Pakettrace (immer befuellt bei Fehler)
}
```

## TracingConn (`smtp/tracer.go`)

Wrapper um `net.Conn` der alle gesendeten und empfangenen Bytes mitloggt:

```go
type TracingConn struct {
    net.Conn
    logFn func(direction, data string)
}

func (t *TracingConn) Read(b []byte) (int, error) {
    n, err := t.Conn.Read(b)
    if n > 0 {
        t.logFn("<<<", string(b[:n]))
    }
    return n, err
}

func (t *TracingConn) Write(b []byte) (int, error) {
    t.logFn(">>>", redact.AuthLine(string(b)))
    return t.Conn.Write(b)
}
```

Die `TracingConn` wird als `net.Conn` an `smtp.NewClient()` uebergeben.

## Redaction (`smtp/redact.go`)

Das Passwort darf **niemals** im Klartext oder als Base64 in den Logs erscheinen.

Regeln:
- Jede Write-Operation nach `AUTH LOGIN` oder `AUTH PLAIN` bei der es sich um eine einzelne Base64-Zeile handelt wird ersetzt durch `[REDACTED]`
- Erkennung erfolgt ueber State-Machine: nach AUTH-Befehl werden die naechsten 1-2 Writes als Credentials behandelt
- Username wird **nicht** redacted

```go
// redact/redact.go
type Redactor struct {
    state      int // 0=normal, 1=expect-user, 2=expect-pass, 3=expect-plain-cred
}

func (r *Redactor) AuthLine(data string) string {
    // State-Machine prueft ob aktuelles Paket ein Credential ist
    // gibt "[PASSWORD - REDACTED]\n" zurueck wenn ja
}
```

## Parallele Test-Logik (`smtp/tester.go`)

```go
var TestMatrix = []SMTPTarget{
    {Port: 587,  TLS: "starttls", Label: "Submission STARTTLS"},
    {Port: 465,  TLS: "tls",      Label: "SMTPS SSL"},
    {Port: 25,   TLS: "starttls", Label: "SMTP STARTTLS"},
    {Port: 2525, TLS: "starttls", Label: "Alt-Submission"},
}

func RunAllTests(cfg SMTPConfig, emit func(LogEntry)) []TestResult {
    var wg sync.WaitGroup
    results := make([]TestResult, len(TestMatrix))
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
```

### testSinglePort Ablauf
1. TCP-Verbindung mit Timeout aufbauen
2. Bei TLS=`"tls"`: sofort TLS wrappen (`tls.Client(conn, &tls.Config{ServerName: host})`)
3. `TracingConn` um Verbindung legen
4. `smtp.NewClient(tracingConn, host)`
5. Bei TLS=`"starttls"`: `client.StartTLS(&tls.Config{ServerName: host})`
6. TLS-Verbindungsstatus auslesen: Version + Zertifikat-Ablaufdatum
7. `client.Auth(smtp.PlainAuth(...))` oder LOGIN-Fallback
8. EHLO-Capabilities aus `client.Extension()` auslesen
9. Wenn `cfg.SendMail && cfg.TestTo != ""`: Test-Mail via `client.SendMail()` senden
10. Latenz messen (Startzeit vor TCP-Connect, Endzeit nach Auth)
11. Bei jedem Fehler: `TestResult.Error` setzen; Trace ist bereits als `[]LogEntry` vorhanden
