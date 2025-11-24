import { theme } from 'antd';
import { ThemeMode } from '../store/slices/themeSlice';

export const getThemeConfig = (mode: ThemeMode) => {
  if (mode === 'light') {
    return {
      token: {
        colorPrimary: '#6366f1',
        borderRadius: 12,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 14,
        colorSuccess: '#10b981',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#3b82f6',
        wireframe: false,
        // Light theme colors
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f5f7fa',
        colorText: '#1e293b',
        colorTextSecondary: '#64748b',
        colorBorder: '#e2e8f0',
        colorBorderSecondary: '#cbd5e1',
      },
      algorithm: theme.defaultAlgorithm,
      components: {
        Card: {
          borderRadius: 16,
          paddingLG: 24,
          colorBgContainer: '#ffffff',
          colorBorderSecondary: '#e2e8f0',
        },
        Button: {
          borderRadius: 8,
          fontWeight: 500,
          primaryShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        },
        Input: {
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          colorBorder: '#e2e8f0',
          activeBorderColor: '#6366f1',
        },
        Select: {
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          colorBorder: '#e2e8f0',
        },
        Table: {
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          colorBorderSecondary: '#e2e8f0',
          colorTextHeading: '#1e293b',
          colorText: '#334155',
        },
        Layout: {
          colorBgHeader: '#ffffff',
          colorBgBody: '#f5f7fa',
          colorBgTrigger: '#e2e8f0',
          colorBgSider: '#ffffff',
        },
        Menu: {
          colorItemBg: 'transparent',
          colorItemBgHover: '#f1f5f9',
          colorItemBgSelected: '#6366f1',
          colorItemText: '#475569',
          colorItemTextSelected: '#ffffff',
        },
      },
    };
  }

  // Dark theme (default)
  return {
    token: {
      colorPrimary: '#6366f1',
      borderRadius: 12,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorInfo: '#3b82f6',
      wireframe: false,
      // Dark theme colors
      colorBgContainer: '#1e293b',
      colorBgElevated: '#1e293b',
      colorBgLayout: '#0f172a',
      colorText: '#e2e8f0',
      colorTextSecondary: '#94a3b8',
      colorBorder: '#334155',
      colorBorderSecondary: '#475569',
    },
    algorithm: theme.darkAlgorithm,
    components: {
      Card: {
        borderRadius: 16,
        paddingLG: 24,
        colorBgContainer: '#1e293b',
        colorBorderSecondary: '#334155',
      },
      Button: {
        borderRadius: 8,
        fontWeight: 500,
        primaryShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
      },
      Input: {
        borderRadius: 8,
        colorBgContainer: '#0f172a',
        colorBorder: '#334155',
        activeBorderColor: '#6366f1',
      },
      Select: {
        borderRadius: 8,
        colorBgContainer: '#0f172a',
        colorBorder: '#334155',
      },
      Table: {
        borderRadius: 8,
        colorBgContainer: '#1e293b',
        colorBorderSecondary: '#334155',
        colorTextHeading: '#e2e8f0',
        colorText: '#cbd5e1',
      },
      Layout: {
        colorBgHeader: '#1e293b',
        colorBgBody: '#0f172a',
        colorBgTrigger: '#334155',
        colorBgSider: '#1e293b',
      },
      Menu: {
        colorItemBg: 'transparent',
        colorItemBgHover: '#334155',
        colorItemBgSelected: '#6366f1',
        colorItemText: '#cbd5e1',
        colorItemTextSelected: '#ffffff',
      },
    },
  };
};
