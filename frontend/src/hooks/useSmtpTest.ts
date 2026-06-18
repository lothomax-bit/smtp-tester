import { useState, useEffect } from 'react';
import { SMTPConfig, LogEntry, TestResult } from '../types';

export function useSmtpTest() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [testMailLogs, setTestMailLogs] = useState<LogEntry[]>([]);
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentConfig, setCurrentConfig] = useState<SMTPConfig | null>(null);
    const [testMailStatus, setTestMailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [testMailError, setTestMailError] = useState<string>('');

    useEffect(() => {
        let unsubscribeLog: (() => void) | undefined;
        let unsubscribeTestMail: (() => void) | undefined;

        if ((window as any).runtime && (window as any).runtime.EventsOn) {
            unsubscribeLog = (window as any).runtime.EventsOn("smtp:log", (entry: LogEntry) => {
                setLogs(prev => [...prev, entry]);
            });
            unsubscribeTestMail = (window as any).runtime.EventsOn("smtp:log:testmail", (entry: LogEntry) => {
                setTestMailLogs(prev => [...prev, entry]);
            });
        }

        return () => {
            if (unsubscribeLog) unsubscribeLog();
            if (unsubscribeTestMail) unsubscribeTestMail();
        };
    }, []);

    const startTest = async (config: SMTPConfig) => {
        setLogs([]);
        setResults([]);
        setIsRunning(true);
        setCurrentConfig(config);
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

    const sendTestMail = async (port: number, testTo: string) => {
        if (!currentConfig) return;
        setTestMailLogs([]);
        setTestMailStatus('sending');

        const mailConfig = { ...currentConfig, testTo, sendMail: true };

        try {
            if ((window as any).go?.main?.App?.SendTestMailOnPort) {
                const result = await (window as any).go.main.App.SendTestMailOnPort(mailConfig, port);
                if (result && result.success === true) {
                    setTestMailStatus('success');
                } else {
                    setTestMailStatus('error');
                    setTestMailError(result?.error || 'Unknown error');
                }
                setTimeout(() => {
                    setTestMailStatus('idle');
                    setTestMailError('');
                }, 4000);
            }
        } catch (error) {
            console.error("Failed to send test mail:", error);
            setTestMailStatus('error');
            setTestMailError(String(error));
            setTimeout(() => {
                setTestMailStatus('idle');
                setTestMailError('');
            }, 4000);
        }
    };

    return {
        logs,
        testMailLogs,
        results,
        isRunning,
        currentConfig,
        testMailStatus,
        testMailError,
        startTest,
        sendTestMail,
    };
}
