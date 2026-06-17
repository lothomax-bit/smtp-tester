import { useTranslation } from 'react-i18next';
import { smtp } from '../../wailsjs/go/models';
import { CheckCircle2, XCircle, Download } from 'lucide-react';

interface ResultPanelProps {
    results: smtp.TestResult[];
}

export function ResultPanel({ results }: ResultPanelProps) {
    const { t, i18n } = useTranslation();

    if (!results || results.length === 0) {
        return null;
    }

    const successfulResults = results.filter(r => r.success);
    const bestResult = successfulResults.length > 0 ? successfulResults[0] : null;

    const handleExport = async () => {
        try {
            if ((window as any).go?.main?.App?.ExportResults) {
                await (window as any).go.main.App.ExportResults(results, "", "", "", i18n.language);
            }
        } catch (e) {
            console.error("Export failed", e);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4 border border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h2 className="text-gray-300 font-bold tracking-wider">{t('results.title').toUpperCase()}</h2>
                <button
                    onClick={handleExport}
                    className="flex items-center space-x-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
                >
                    <Download size={16} />
                    <span>{t('results.export')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.map((result, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded-lg border-2 ${result.success ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-bold text-lg">Port {result.target.port}</div>
                                <div className="text-xs text-gray-400">{result.target.tls}</div>
                            </div>
                            {result.success ? (
                                <CheckCircle2 className="text-green-500" size={24} />
                            ) : (
                                <XCircle className="text-red-500" size={24} />
                            )}
                        </div>

                        <div className="mt-3 text-sm">
                            {result.success ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('results.latency')}:</span>
                                        <span className="font-mono text-green-400">{result.latencyMs}ms</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">TLS:</span>
                                        <span className="font-mono">{result.tlsVersion || 'N/A'}</span>
                                    </div>
                                    {result.certExpiry && (
                                        <div className="text-xs text-gray-400 mt-2 truncate" title={result.certExpiry}>
                                            {t('results.certExpiry')}: {new Date(result.certExpiry).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-red-400 break-words line-clamp-3" title={result.error}>
                                    {result.error}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {bestResult && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg text-left">
                    <span className="font-bold text-blue-400">{t('results.recommendation')}: </span>
                    <span className="text-gray-200">
                        Port {bestResult.target.port} ({bestResult.target.tls})
                    </span>
                </div>
            )}
        </div>
    );
}
