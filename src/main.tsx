import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClienteProvider } from './context/ClientesContext';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClienteProvider>
      <App />
    </ClienteProvider>
  </StrictMode>,
)
