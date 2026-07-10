import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  largeTextMode: boolean;
  highContrastMode: boolean;
  familyView: 'amma' | 'caregiver';
  toggleDarkMode: () => void;
  toggleLargeTextMode: () => void;
  toggleHighContrastMode: () => void;
  setFamilyView: (view: 'amma' | 'caregiver') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme-dark') === 'true';
  });
  const [largeTextMode, setLargeTextMode] = useState(() => {
    return localStorage.getItem('theme-large-text') === 'true';
  });
  const [highContrastMode, setHighContrastMode] = useState(() => {
    return localStorage.getItem('theme-high-contrast') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Manage dark class
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme-dark', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme-dark', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Manage large-text class
    if (largeTextMode) {
      root.classList.add('accessibility-large-text');
      localStorage.setItem('theme-large-text', 'true');
    } else {
      root.classList.remove('accessibility-large-text');
      localStorage.setItem('theme-large-text', 'false');
    }
  }, [largeTextMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Manage high-contrast class
    if (highContrastMode) {
      root.classList.add('high-contrast');
      localStorage.setItem('theme-high-contrast', 'true');
    } else {
      root.classList.remove('high-contrast');
      localStorage.setItem('theme-high-contrast', 'false');
    }
  }, [highContrastMode]);

  const [familyView, setFamilyViewInternal] = useState<'amma' | 'caregiver'>(() => {
    return (localStorage.getItem('family_view') as 'amma' | 'caregiver') || 'amma';
  });

  const setFamilyView = (view: 'amma' | 'caregiver') => {
    setFamilyViewInternal(view);
    localStorage.setItem('family_view', view);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleLargeTextMode = () => setLargeTextMode(!largeTextMode);
  const toggleHighContrastMode = () => setHighContrastMode(!highContrastMode);

  return (
    <ThemeContext.Provider value={{
      darkMode,
      largeTextMode,
      highContrastMode,
      familyView,
      toggleDarkMode,
      toggleLargeTextMode,
      toggleHighContrastMode,
      setFamilyView
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
