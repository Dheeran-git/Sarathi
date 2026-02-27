import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Bug fix: persist language preference across page refreshes via localStorage
  const [language, setLanguage] = useState(
    () => localStorage.getItem('sarathi-lang') || 'en'
  );

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      localStorage.setItem('sarathi-lang', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
