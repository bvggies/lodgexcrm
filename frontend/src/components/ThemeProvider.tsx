import React, { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { useAppSelector } from '../store/hooks';
import { getThemeConfig } from '../utils/theme';
import { useTranslation } from 'react-i18next';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useAppSelector((state) => state.theme.mode);
  const themeConfig = getThemeConfig(themeMode);
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    // Set document direction based on language
    const currentLang = i18n.language || 'en';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  return (
    <ConfigProvider
      theme={themeConfig}
      direction={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      getPopupContainer={(trigger): HTMLElement => {
        // Find the closest scrollable container or modal
        // This ensures dropdowns are visible and can properly detect click-outside events
        if (!trigger) return document.body;

        // Check if trigger is inside a modal
        const modal = trigger.closest('.ant-modal') as HTMLElement;
        if (modal) return modal;

        // Find closest scrollable container
        let parent = trigger.parentElement;
        while (parent && parent !== document.body) {
          const overflow = window.getComputedStyle(parent).overflow;
          if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden') {
            // If it's a clipped container, use body instead
            if (overflow === 'hidden') {
              return document.body;
            }
            return parent;
          }
          parent = parent.parentElement;
        }

        // Default to body for maximum compatibility
        return document.body;
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;
