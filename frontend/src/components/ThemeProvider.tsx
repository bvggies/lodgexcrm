import React, { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { useAppSelector } from '../store/hooks';
import { getThemeConfig } from '../utils/theme';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useAppSelector((state) => state.theme.mode);
  const themeConfig = getThemeConfig(themeMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return (
    <ConfigProvider
      theme={themeConfig}
      getPopupContainer={(trigger) => {
        // Try to find the closest scrollable container or modal
        let element = trigger?.parentElement;
        while (element) {
          const style = window.getComputedStyle(element);
          if (
            element.classList.contains('ant-modal-content') ||
            element.classList.contains('ant-modal-wrap') ||
            style.position === 'fixed' ||
            style.position === 'absolute'
          ) {
            return element;
          }
          if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
            // If we hit a hidden overflow container, use body
            return document.body;
          }
          element = element.parentElement;
        }
        return document.body;
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;
