import { useState, useEffect } from 'react';
import { SMTPConfig, LogEntry, TestResult } from '../types';

export function useSmtpTest() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if ((window as any).runtime && (window as any).runtime.EventsOn) {
            unsubscribe = (window as any).runtime.EventsOn("smtp:log", (entry: LogEntry) => {
                setLogs(prev => [...prev, entry]);
            });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const startTest = async (config: SMTPConfig) => {
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
