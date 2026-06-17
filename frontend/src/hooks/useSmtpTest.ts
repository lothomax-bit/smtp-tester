import { useState, useEffect } from 'react';
import { smtp } from '../../wailsjs/go/models';

export function useSmtpTest() {
    const [logs, setLogs] = useState<smtp.LogEntry[]>([]);
    const [results, setResults] = useState<smtp.TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if ((window as any).runtime && (window as any).runtime.EventsOn) {
            unsubscribe = (window as any).runtime.EventsOn("smtp:log", (entry: smtp.LogEntry) => {
                setLogs(prev => [...prev, entry]);
            });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const startTest = async (config: smtp.SMTPConfig) => {
        setLogs([]);
        setResults([]);
        setIsRunning(true);
        try {
            if ((window as any).go?.main?.App?.RunTest) {
                const testResults = await (window as any).go.main.App.RunTest(config);
                setResults(testResults || []);
            }
        } catch (error) {
            console.error("Failed to run test:", error);
        } finally {
            setIsRunning(false);
        }
    };

    return {
        logs,
        results,
        isRunning,
        startTest,
    };
}
