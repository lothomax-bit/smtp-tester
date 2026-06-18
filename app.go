package main

import (
	"context"
	"fmt"
	"os"
	"smtp-tester/smtp"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// RunTest starts the SMTP test for the given config
func (a *App) RunTest(config smtp.SMTPConfig) []smtp.TestResult {
	emitFunc := func(entry smtp.LogEntry) {
		runtime.EventsEmit(a.ctx, "smtp:log", entry)
	}
	return smtp.RunAllTests(config, emitFunc)
}

// ExportResults exports the results and returns the path
func (a *App) ExportResults(results []smtp.TestResult, email, username, server, format string) string {
	cfg := smtp.ExportConfig{
		SMTPServer: server,
		Email:      email,
		Username:   username,
	}

	var data []byte
	var err error
	var ext string

	if format == "json" {
		data, err = smtp.ExportJSON(results, cfg)
		ext = "json"
	} else if format == "txt" {
		data, err = smtp.ExportTXT(results, cfg)
		ext = "txt"
	} else {
		return "Fehler: Unbekanntes Format"
	}

	if err != nil {
		return fmt.Sprintf("Fehler beim Erstellen der Exportdaten: %v", err)
	}

	defaultFilename := fmt.Sprintf("smtp-test_%s_%s.%s", server, time.Now().Format("20060102-150405"), ext)

	filepath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{
				DisplayName: fmt.Sprintf("%s Files", ext),
				Pattern:     fmt.Sprintf("*.%s", ext),
			},
		},
	})

	if err != nil {
		return fmt.Sprintf("Fehler beim Öffnen des Speicherdialogs: %v", err)
	}

	if filepath == "" {
		return "" // User cancelled
	}

	err = os.WriteFile(filepath, data, 0644)
	if err != nil {
		return fmt.Sprintf("Fehler beim Speichern der Datei: %v", err)
	}

	return filepath
}

// SendTestMailOnPort sends a test email on a specific port
func (a *App) SendTestMailOnPort(config smtp.SMTPConfig, port int) smtp.TestResult {
	var target smtp.SMTPTarget
	found := false
	for _, t := range smtp.TestMatrix {
		if t.Port == port {
			target = t
			found = true
			break
		}
	}

	if !found {
		return smtp.TestResult{
			Error: fmt.Sprintf("Port %d not found in test matrix", port),
			Trace: []smtp.LogEntry{},
		}
	}

	emitFunc := func(entry smtp.LogEntry) {
		runtime.EventsEmit(a.ctx, "smtp:log:testmail", entry)
	}

	return smtp.SendTestMail(config, target, emitFunc)
}
