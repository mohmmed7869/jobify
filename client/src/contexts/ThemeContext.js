import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_DETAILS, applyTheme, getAppliedTheme } from '../utils/themeConfig';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const themes = Object.values(THEME_DETAILS).map(theme => ({
  id: theme.class,
  name: theme.name,
  primary: theme.colors[0]
}));

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(getAppliedTheme());

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
