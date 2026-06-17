export interface SMTPConfig {
    host: string;
    username: string;
    password: string;
    email: string;
    testTo: string;
    sendMail: boolean;
    skipTLSVerify: boolean;
}

export interface LogEntry {
    timestamp: string;
    level: string;
    direction: string;
    message: string;
}

export interface SMTPTarget {
    port: number;
    tls: string;
    label: string;
}

export interface TestResult {
    target: SMTPTarget;
    success: boolean;
    latencyMs: number;
    serverBanner: string;
    ehloCaps: string[];
    tlsVersion: string;
    certExpiry: string;
    error: string;
    trace: LogEntry[];
}
