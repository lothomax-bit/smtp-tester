# SMTP Tester — Architektur

## Ordnerstruktur

```
smtp-tester/
├── main.go                    # Wails App Entry Point
├── app.go                     # Wails Backend-Bindings (Go-Methoden → JS)
├── smtp/
│   ├── tester.go              # Parallele Test-Logik, goroutines
│   ├── tracer.go              # TracingConn Wrapper (Packet Capture)
│   ├── redact.go              # Passwort-Redaction Logik
│   ├── types.go               # SMTPConfig, TestResult, LogEntry, SMTPTarget
│   └── exporter.go            # Export als JSON und TXT
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── i18n/
│   │   │   ├── de.json        # Deutsche Uebersetzungen
│   │   │   └── en.json        # Englische Uebersetzungen
│   │   ├── components/
│   │   │   ├── ConnectionForm.tsx   # Eingabeformular
│   │   │   ├── LogViewer.tsx        # Echtzeit-Log mit Farbcodierung
│   │   │   ├── ResultPanel.tsx      # Ergebnis-Karten pro Port
│   │   │   └── LanguageToggle.tsx   # DE/EN Umschalter
│   │   └── hooks/
│   │       └── useSmtpTest.ts       # Wails Event Listener Hook
│   └── wailsjs/               # Auto-generiert von Wails
├── build/
│   └── windows/
│       ├── icon.ico
│       └── wails.exe.manifest
└── docs/                      # Planungsdokumente
```

## Datenfluss

```
[User Input: React Form]
        |
        v
[app.go: RunTest(SMTPConfig)]   <- Wails Binding
        |
        v
[smtp/tester.go: RunAllTests()]
        |
        |-- goroutine: testSinglePort(587, STARTTLS)
        |-- goroutine: testSinglePort(465, SSL)
        |-- goroutine: testSinglePort(25, STARTTLS)
        +-- goroutine: testSinglePort(2525, STARTTLS)
                |
                v
        [TracingConn -- liest alle Bytes]
                |
                |-- Echtzeit: runtime.EventsEmit("smtp:log", LogEntry)
                +-- Final:    []TestResult zurueck an app.go
                                    |
                                    v
                        [React: LogViewer + ResultPanel]
```

## Wails Bindings (app.go)

```go
type App struct{ ctx context.Context }

// Wird von React aufgerufen
func (a *App) RunTest(config smtp.SMTPConfig) []smtp.TestResult
func (a *App) ExportResults(results []smtp.TestResult, format string) string // gibt Pfad zurueck
func (a *App) SendTestMail(config smtp.SMTPConfig, to string) smtp.TestResult
```

Logs werden via `runtime.EventsEmit(a.ctx, "smtp:log", entry)` gestreamt.  
React lauscht mit `EventsOn("smtp:log", callback)`.
