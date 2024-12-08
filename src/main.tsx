import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClienteProvider } from './context/ClientesContext';
import { MovimientoProvider } from './context/MovimientoContext';
import { MovimientoDetalleProvider } from './context/MovimientoDetalleContext';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClienteProvider>
      <MovimientoProvider>
        <MovimientoDetalleProvider>
          <App />
        </MovimientoDetalleProvider>
      </MovimientoProvider>
    </ClienteProvider>
  </StrictMode>
)
