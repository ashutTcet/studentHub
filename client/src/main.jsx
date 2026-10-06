import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SyncStatusProvider } from './context/SyncStatusContext';

registerSW({
  immediate: true,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SyncStatusProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SyncStatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);
