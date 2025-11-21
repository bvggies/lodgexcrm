import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AOS from 'aos';
import 'aos/dist/aos.css';
import App from './App';
import { store } from './store/store';
import './index.css';

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  offset: 100,
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider
          theme={{
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
              },
              Menu: {
                colorItemBg: 'transparent',
                colorItemBgHover: '#334155',
                colorItemBgSelected: '#6366f1',
                colorItemText: '#cbd5e1',
                colorItemTextSelected: '#ffffff',
              },
            },
          }}
        >
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
