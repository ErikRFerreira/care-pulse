'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: 'class' | `data-${string}`;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

const prefersDarkQuery = '(prefers-color-scheme: dark)';

function resolveTheme(theme: Theme, enableSystem: boolean) {
  if (theme !== 'system') {
    return theme;
  }

  if (!enableSystem || !window.matchMedia) {
    return 'light';
  }

  return window.matchMedia(prefersDarkQuery).matches ? 'dark' : 'light';
}

function applyTheme(attribute: NonNullable<ThemeProviderProps['attribute']>, theme: 'light' | 'dark') {
  const root = document.documentElement;

  if (attribute === 'class') {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } else {
    root.setAttribute(attribute, theme);
  }

  root.style.colorScheme = theme;
}

export function ThemeProvider({
  children,
  attribute = 'data-theme',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
}: ThemeProviderProps) {
  React.useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    const theme = storedTheme ?? defaultTheme;

    applyTheme(attribute, resolveTheme(theme, enableSystem));

    if (theme !== 'system' || !enableSystem || !window.matchMedia) {
      return;
    }

    const media = window.matchMedia(prefersDarkQuery);
    const handleChange = () => applyTheme(attribute, resolveTheme('system', true));

    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, [attribute, defaultTheme, enableSystem, storageKey]);

  return children;
}
