import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi' | 'bn' | 'mr' | 'ta' | 'te' | 'kn' | 'gu' | 'pa' | 'ml';

type TranslationKey =
  | 'language'
  | 'hire'
  | 'worker'
  | 'register'
  | 'login'
  | 'location'
  | 'locating'
  | 'distance'
  | 'notifications'
  | 'logout'
  | 'findWorkers'
  | 'feed'
  | 'leads'
  | 'bookings'
  | 'chat'
  | 'verifiedMarketplace'
  | 'nearbyCertified'
  | 'heroDescription'
  | 'skillTrust'
  | 'registeredProfessionals'
  | 'verifiedOnly'
  | 'noWorkers'
  | 'noWorkersDescription'
  | 'searchPlaceholder';

const english: Record<TranslationKey, string> = {
  language: 'Language',
  hire: 'Hire a worker',
  worker: 'Join as a worker',
  register: 'Register',
  login: 'Log in',
  location: 'Use my live location',
  locating: 'Getting your live location...',
  distance: 'Results are sorted by distance.',
  notifications: 'Notifications',
  logout: 'Log Out',
  findWorkers: 'Find Workers',
  feed: 'Karmyogi Feed',
  leads: 'Contractor Leads',
  bookings: 'My Bookings',
  chat: 'Live Chat',
  verifiedMarketplace: "Bharat's Verified Skilled Labor & Contractor Marketplace",
  nearbyCertified: 'Find Nearby Certified Carpenters, Electricians & Teachers',
  heroDescription: 'Live GPS distance calculation, verified Aadhaar background certificates, transparent hourly/monthly rates, and unlocked real-time communication upon hire.',
  skillTrust: 'Skill. Trust. Opportunity.',
  registeredProfessionals: 'Registered Verified Professionals',
  verifiedOnly: 'Aadhaar Verified Only',
  noWorkers: 'No Workers Found in this Category',
  noWorkersDescription: 'Try changing your search or filters to find verified professionals nearby.',
  searchPlaceholder: 'Search by occupation, skill or name...',
};

const languageNames: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  mr: 'Marathi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ml: 'Malayalam',
};

declare global {
  interface Window {
    google?: { translate?: { TranslateElement?: new (options: object, elementId: string) => unknown } };
    karmyogiGoogleTranslateInit?: () => void;
    karmyogiRequestedLanguage?: Language;
  }
}

const applyWholePageTranslation = (language: Language) => {
  // Google Translate's banner is disabled; the app language selector is the only control.
  document.cookie = `googtrans=/en/${language}; path=/; max-age=31536000; SameSite=Lax`;
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (!combo) return false;
  combo.value = language;
  combo.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

const scheduleTranslation = (language: Language) => {
  const retryDelays = [0, 100, 300, 750, 1500, 3000];
  retryDelays.forEach((delay) => {
    window.setTimeout(() => applyWholePageTranslation(language), delay);
  });
};

const LanguageContext = createContext({
  language: 'en' as Language,
  setLanguage: (_: Language) => {},
  t: (key: TranslationKey) => english[key],
});

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('karmyogi-language') as Language;
    return saved in languageNames ? saved : 'en';
  });

  useEffect(() => {
    window.karmyogiGoogleTranslateInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      if (!document.getElementById('google_translate_element')?.childElementCount) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: Object.keys(languageNames).join(','),
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
      scheduleTranslation(window.karmyogiRequestedLanguage || 'en');
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=karmyogiGoogleTranslateInit';
      script.async = true;
      document.head.appendChild(script);
    } else {
      window.karmyogiGoogleTranslateInit();
    }
  }, []);

  useEffect(() => {
    window.karmyogiRequestedLanguage = language;
    localStorage.setItem('karmyogi-language', language);
    document.documentElement.lang = language;

    scheduleTranslation(language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: (key) => english[key] }}>
      {children}
      <div id="google_translate_element" className="notranslate" aria-hidden="true" />
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <label className="notranslate text-xs text-[#423E3B] font-semibold flex items-center gap-1" translate="no">
      <span className="hidden sm:inline" translate="no">Language</span>
      <select
        aria-label="Choose language"
        value={language}
        onChange={(event) => {
          setLanguage(event.target.value as Language);
          event.currentTarget.blur();
        }}
        className="notranslate rounded-lg border border-[#E5E1D8] bg-white px-2 py-1 text-xs"
        translate="no"
      >
        {Object.entries(languageNames).map(([code, name]) => (
          <option key={code} value={code} translate="no">{name}</option>
        ))}
      </select>
    </label>
  );
};
