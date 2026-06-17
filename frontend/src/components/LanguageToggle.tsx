import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
    const { i18n } = useTranslation();

    const currentLang = i18n.language;

    const toggleLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <div className="flex space-x-2">
            <button
                className={currentLang === 'de' ? 'font-bold text-white' : 'text-gray-400 hover:text-white'}
                onClick={() => toggleLanguage('de')}
            >
                DE
            </button>
            <span className="text-gray-400">|</span>
            <button
                className={currentLang === 'en' ? 'font-bold text-white' : 'text-gray-400 hover:text-white'}
                onClick={() => toggleLanguage('en')}
            >
                EN
            </button>
        </div>
    );
}
