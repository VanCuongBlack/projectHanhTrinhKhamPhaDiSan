import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import HydrateGate from './components/HydrateGate';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HydrateGate>
      <App />
      <Toaster position="top-right" />
    </HydrateGate>
  </StrictMode>,
);
