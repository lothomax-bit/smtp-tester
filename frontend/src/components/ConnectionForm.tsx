import { useState, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { smtp } from '../../wailsjs/go/models';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface ConnectionFormProps {
    onSubmit: (config: smtp.SMTPConfig) => void;
    isRunning: boolean;
}

export function ConnectionForm({ onSubmit, isRunning }: ConnectionFormProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [smtpServer, setSmtpServer] = useState('');
    const [sendTestMail, setSendTestMail] = useState(false);
    const [testTo, setTestTo] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usernamePristine, setUsernamePristine] = useState(true);
    const [skipTLSVerify, setSkipTLSVerify] = useState(false);

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEmail(val);

        if (usernamePristine) {
            setUsername(val);
        }

        if (val.includes('@') && smtpServer === '') {
            const domain = val.split('@')[1];
            if (domain) {
                setSmtpServer(`mail.${domain}`);
            }
        }
    };

    const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        setUsernamePristine(false);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const config = new smtp.SMTPConfig({
            email,
            username,
            password,
            host: smtpServer,
            sendMail: sendTestMail,
            testTo: sendTestMail ? testTo : '',
            skipTLSVerify: skipTLSVerify
        });

        onSubmit(config);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4 text-left border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-gray-300 font-medium">{t('form.email')}</label>
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className="bg-gray-900 border border-gray-700 rounded p-2 text-white w-full focus:outline-none focus:border-blue-500"
                    placeholder="user@example.com"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-gray-300 font-medium">{t('form.username')}</label>
                <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className="bg-gray-900 border border-gray-700 rounded p-2 text-white w-full focus:outline-none focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-gray-300 font-medium">{t('form.password')}</label>
                <div className="relative w-full">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded p-2 text-white w-full pr-10 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-gray-300 font-medium">{t('form.smtpServer')}</label>
                <input
                    type="text"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded p-2 text-white w-full focus:outline-none focus:border-blue-500"
                    placeholder="mail.example.com"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4 pt-1">
                <div></div>
                <label className="flex items-center space-x-2 cursor-pointer text-gray-300 text-sm">
                    <input
                        type="checkbox"
                        checked={skipTLSVerify}
                        onChange={(e) => setSkipTLSVerify(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-900"
                    />
                    <span>{t('form.skipTLSVerify')}</span>
                </label>
            </div>

            <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-300">
                    <input
                        type="checkbox"
                        checked={sendTestMail}
                        onChange={(e) => setSendTestMail(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-900"
                    />
                    <span>{t('form.sendTestMail')}</span>
                </label>

                {sendTestMail && (
                    <div className="mt-2 ml-6">
                        <input
                            type="email"
                            value={testTo}
                            onChange={(e) => setTestTo(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded p-2 text-white w-full focus:outline-none focus:border-blue-500"
                            placeholder="recipient@example.com"
                            required={sendTestMail}
                        />
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-center">
                <button
                    type="submit"
                    disabled={isRunning}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isRunning && <Loader2 className="animate-spin" size={18} />}
                    <span>{t('form.startTest')}</span>
                </button>
            </div>
        </form>
    );
}
