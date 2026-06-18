import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogEntry } from '../types';

interface LogViewerProps {
    logs: LogEntry[];
    testMailLogs: LogEntry[];
}

export function LogViewer({ logs, testMailLogs }: LogViewerProps) {
    const { t } = useTranslation();
    const [showTrace, setShowTrace] = useState(false);
    const [activeTab, setActiveTab] = useState<'tests' | 'testMail'>('tests');
    const bottomRef = useRef<HTMLDivElement>(null);

    const currentLogs = activeTab === 'tests' ? logs : testMailLogs;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentLogs, showTrace, activeTab]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'TRACE': return 'text-gray-400';
            case 'INFO': return 'text-blue-300';
            case 'OK': return 'text-green-400';
            case 'WARN': return 'text-yellow-400';
            case 'ERROR': return 'text-red-400';
            default: return 'text-gray-300';
        }
    };

    const getDirectionMarker = (dir: string) => {
        if (dir === 'IN') return <span className="text-blue-400 font-bold mr-2">&lt;&lt;&lt;</span>;
        if (dir === 'OUT') return <span className="text-pink-400 font-bold mr-2">&gt;&gt;&gt;</span>;
        return null;
    };

    const filteredLogs = showTrace ? currentLogs : currentLogs.filter(l => l.level !== 'TRACE');

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 flex flex-col h-[300px]">
            <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('tests')}
                        className={`font-bold tracking-wider transition-colors ${activeTab === 'tests' ? 'text-gray-300 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        Test-Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('testMail')}
                        className={`font-bold tracking-wider transition-colors ${activeTab === 'testMail' ? 'text-gray-300 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        Test-Mail-Log
                    </button>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
                    <input
                        type="checkbox"
                        checked={showTrace}
                        onChange={(e) => setShowTrace(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-900"
                    />
                    <span className="text-sm">{t('log.showTrace')}</span>
                </label>
            </div>

            <div className="flex-1 bg-gray-900 rounded p-3 overflow-y-auto font-mono text-sm text-left shadow-inner border border-gray-700">
                {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 italic">Waiting for tests...</div>
                ) : (
                    filteredLogs.map((log, i) => (
                        <div key={i} className={`mb-1 ${getLevelColor(log.level)}`}>
                            <span className="text-gray-500 mr-2">{log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}</span>
                            <span className="font-bold w-12 inline-block mr-2">{log.level}</span>
                            {getDirectionMarker(log.direction)}
                            <span className="whitespace-pre-wrap">{log.message}</span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
