package main

import (
	"context"
	"smtp-tester/smtp"
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
	// Stub implementation
	return []smtp.TestResult{}
}

// ExportResults exports the results and returns the path
func (a *App) ExportResults(results []smtp.TestResult, format string) string {
	// Stub implementation
	return ""
}

// SendTestMail sends a test email
func (a *App) SendTestMail(config smtp.SMTPConfig, to string) smtp.TestResult {
	// Stub implementation
	return smtp.TestResult{}
}
