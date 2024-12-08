import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClienteProvider } from './context/ClientesContext';
import { MovimientoProvider } from './context/MovimientoContext';
import { MovimientoDetalleProvider } from './context/MovimientoDetalleContext';
import { SaldoProvider } from './context/SaldoContext.tsx';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClienteProvider>
      <MovimientoProvider>
        <MovimientoDetalleProvider>
          <SaldoProvider>
            <App />
          </SaldoProvider>
        </MovimientoDetalleProvider>
      </MovimientoProvider>
    </ClienteProvider>
  </StrictMode>
)
