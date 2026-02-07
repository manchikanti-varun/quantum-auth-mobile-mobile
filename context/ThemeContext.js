/**
 * Theme context – light/dark/system preference, persisted to SecureStore.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { themeDark, themeLight } from '../constants/themes';
import { THEME_PREFERENCE_KEY } from '../constants/config';

export const ThemeContext = createContext({ theme: themeDark, isDark: true });

export function ThemeProvider({ children }) {
  const systemDark = useColorScheme() === 'dark';
  const [preference, setPreference] = useState('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') setPreference(saved);
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const setThemePreference = async (value) => {
    if (value !== 'light' && value !== 'dark' && value !== 'system') return;
    setPreference(value);
    try {
      await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, value);
    } catch (e) {}
  };

  const isDark = preference === 'system' ? systemDark : preference === 'dark';
  const theme = isDark ? themeDark : themeLight;

  if (!loaded) return children;

  return (
    <ThemeContext.Provider value={{ theme, isDark, preference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeContext);
  return c.theme ? c : { theme: themeDark, isDark: true, preference: 'system', setThemePreference: () => {} };
}
