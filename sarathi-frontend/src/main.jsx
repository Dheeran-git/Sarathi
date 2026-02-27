import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CitizenProvider } from './context/CitizenContext';
import { ToastProvider } from './components/ui/Toast';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CitizenProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CitizenProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
