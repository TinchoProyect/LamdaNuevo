import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClienteProvider } from './context/ClientesContext';
import { MovimientoDetalleProvider } from './context/MovimientoDetalleContext';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClienteProvider>
      <MovimientoDetalleProvider>
        <App />
      </MovimientoDetalleProvider>
    </ClienteProvider>
  </StrictMode>
)
