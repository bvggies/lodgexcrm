import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
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
              colorPrimary: '#1890ff',
            },
          }}
        >
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
