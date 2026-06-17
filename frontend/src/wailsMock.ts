// Mocking Wails runtime and bindings for standalone Vite development

if (typeof window !== 'undefined') {
    if (!(window as any).runtime) {
        (window as any).runtime = {
            EventsOn: (eventName: string, callback: any) => {
                console.log(`[Mock] EventsOn registered for: ${eventName}`);
                return () => console.log(`[Mock] Unsubscribed from: ${eventName}`);
            },
            EventsOff: () => {},
            EventsEmit: () => {},
            LogInfo: (msg: string) => console.log(`[Mock LogInfo] ${msg}`),
            LogError: (msg: string) => console.error(`[Mock LogError] ${msg}`),
            SaveFileDialog: async () => ''
        };
    }

    if (!(window as any).go) {
        (window as any).go = {
            main: {
                App: {
                    RunTest: async (config: any) => {
                        console.log(`[Mock] RunTest called with`, config);

                        // Simulate delay
                        await new Promise(resolve => setTimeout(resolve, 800));

                        // Emit some fake logs before returning results
                        if ((window as any).runtime && (window as any).runtime.EventsEmit) {
                            // In our mock we don't have a full event bus to trigger the React hook,
                            // but in standalone we can just return the results.
                        }

                        return [
                            {
                                target: { port: 587, tls: "STARTTLS", label: "" },
                                success: true,
                                latencyMs: 342,
                                serverBanner: "220 mail.example.com ESMTP Postfix",
                                ehloCaps: ["STARTTLS", "AUTH LOGIN PLAIN"],
                                tlsVersion: "TLSv1.3",
                                certExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                                error: "",
                                trace: []
                            },
                            {
                                target: { port: 465, tls: "SSL/TLS", label: "" },
                                success: false,
                                latencyMs: 0,
                                serverBanner: "",
                                ehloCaps: [],
                                tlsVersion: "",
                                certExpiry: "",
                                error: "Connection refused",
                                trace: []
                            },
                            {
                                target: { port: 25, tls: "STARTTLS", label: "" },
                                success: false,
                                latencyMs: 0,
                                serverBanner: "",
                                ehloCaps: [],
                                tlsVersion: "",
                                certExpiry: "",
                                error: "Connection blocked",
                                trace: []
                            },
                            {
                                target: { port: 2525, tls: "STARTTLS", label: "" },
                                success: false,
                                latencyMs: 0,
                                serverBanner: "",
                                ehloCaps: [],
                                tlsVersion: "",
                                certExpiry: "",
                                error: "Connection timeout",
                                trace: []
                            }
                        ];
                    },
                    ExportResults: async () => {
                        console.log("[Mock] ExportResults called");
                        return "";
                    },
                    SendTestMail: async () => {
                        console.log("[Mock] SendTestMail called");
                    }
                }
            }
        };
    }
}

export {};
