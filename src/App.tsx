import { Header } from './components/Header'
import { ClienteProvider } from './context/ClientesContext';
import BusquedaCliente from './components/BusquedaCliente';

function App() {

  return (
    <>
      <Header />
      <ClienteProvider>
        {/* <BuscadorClientes /> */}
        <BusquedaCliente />
      </ClienteProvider>
    </>
  )
}

export default App
