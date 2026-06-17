package smtp

type SMTPConfig struct {
	Host     string `json:"host"`
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	TestTo   string `json:"testTo"`
	SendMail bool   `json:"sendMail"`
}

type SMTPTarget struct {
	Port  int    `json:"port"`
	TLS   string `json:"tls"` // "starttls" | "tls" | "none"
	Label string `json:"label"`
}

type LogEntry struct {
	Timestamp string `json:"timestamp"` // ISO 8601
	Level     string `json:"level"`     // "TRACE" | "INFO" | "OK" | "WARN" | "ERROR"
	Direction string `json:"direction"` // ">>>" | "<<<" | "" (nur bei TRACE)
	Message   string `json:"message"`
}

type TestResult struct {
	Target       SMTPTarget `json:"target"`
	Success      bool       `json:"success"`
	LatencyMs    int64      `json:"latencyMs"`
	ServerBanner string     `json:"serverBanner"`
	EHLOCaps     []string   `json:"ehloCaps"`
	TLSVersion   string     `json:"tlsVersion"` // z.B. "TLSv1.3"
	CertExpiry   string     `json:"certExpiry"` // z.B. "2027-03-14"
	Error        string     `json:"error"`      // leer wenn erfolgreich
	Trace        []LogEntry `json:"trace"`      // SMTP-Pakettrace (immer befuellt bei Fehler)
}
