import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../api/api";

const TranslationContext = createContext(null);

const STORAGE_KEY = "dashboard_lang";
const DEFAULT_LOCALE = "en";

export function TranslationProvider({ children }) {
  const [locale, setLocale] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE,
  );
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);
  const loadedLocale = useRef(null);

  const loadTranslations = useCallback(async (lang) => {
    if (loadedLocale.current === lang) return;
    setLoading(true);
    try {
      const data = await api.getTranslations(lang);
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setTranslations(data);
        loadedLocale.current = lang;
      }
    } catch {
      // silently fall back to keys if translation service is unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  // Load translations when locale changes
  useEffect(() => {
    loadedLocale.current = null; // force reload on locale change
    loadTranslations(locale);
  }, [locale, loadTranslations]);

  const changeLocale = useCallback(
    async (newLocale) => {
      if (newLocale === locale) return;
      localStorage.setItem(STORAGE_KEY, newLocale);
      setLocale(newLocale);
    },
    [locale],
  );

  /** Translate a key, returning the value or the key itself as fallback */
  const t = useCallback(
    (key, fallback) => {
      if (translations[key] !== undefined) return translations[key];
      return fallback !== undefined ? fallback : key;
    },
    [translations],
  );

  return (
    <TranslationContext.Provider
      value={{ locale, changeLocale, t, loading, translations }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx)
    throw new Error("useTranslation must be used inside <TranslationProvider>");
  return ctx;
}
