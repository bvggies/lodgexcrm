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

  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
};

export default ThemeProvider;
