import './style.css';
import { ConnectionForm } from './components/ConnectionForm';
import { LogViewer } from './components/LogViewer';
import { ResultPanel } from './components/ResultPanel';
import { LanguageToggle } from './components/LanguageToggle';
import { useSmtpTest } from './hooks/useSmtpTest';
import { Server } from 'lucide-react';

function App() {
    const { logs, results, isRunning, startTest } = useSmtpTest();

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
                    <LogViewer logs={logs} />
                </div>

                {/* Results */}
                <ResultPanel results={results} />

            </div>
        </div>
    );
}

export default App;
