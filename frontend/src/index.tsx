import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import App from './App';
import { store } from './store/store';
import ThemeProvider from './components/ThemeProvider';
import './index.css';

// Initialize theme attribute on document
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const initialTheme = getInitialTheme();
document.documentElement.setAttribute('data-theme', initialTheme);

// Initialize AOS with optimized settings for performance
AOS.init({
  duration: 400,
  easing: 'ease-out',
  once: true,
  offset: 50,
  delay: 0,
  disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
