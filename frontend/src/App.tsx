import './style.css';
import { ConnectionForm } from './components/ConnectionForm';
import { LogViewer } from './components/LogViewer';
import { ResultPanel } from './components/ResultPanel';
import { LanguageToggle } from './components/LanguageToggle';
import { useSmtpTest } from './hooks/useSmtpTest';
import { Server, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
    const { t } = useTranslation();
    const { logs, testMailLogs, results, isRunning, currentConfig, testMailStatus, testMailError, startTest, sendTestMail } = useSmtpTest();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 min-w-[900px]">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <Server className="text-blue-500" size={28} />
                        <h1 className="text-2xl font-bold tracking-wide">SMTP Tester</h1>
                    </div>
                    <LanguageToggle />
                </header>

                {/* Form & Logs Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ConnectionForm onSubmit={startTest} isRunning={isRunning} />
                    <LogViewer logs={logs} testMailLogs={testMailLogs} />
                </div>

                {/* Results */}
                <ResultPanel results={results} onSendTestMail={sendTestMail} config={currentConfig} />

            </div>

            {/* Toast Notification */}
            <div
                className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ${
                    testMailStatus !== 'idle' && testMailStatus !== 'sending'
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-10 opacity-0 pointer-events-none'
                }`}
            >
                {testMailStatus === 'success' && (
                    <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
                        <CheckCircle2 size={24} />
                        <span className="font-medium">{t('testmail.success')}</span>
                    </div>
                )}

                {testMailStatus === 'error' && (
                    <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
                        <XCircle size={24} className="shrink-0" />
                        <div>
                            <span className="font-medium block">{t('testmail.error')}</span>
                            <span className="text-sm opacity-90">{testMailError}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
