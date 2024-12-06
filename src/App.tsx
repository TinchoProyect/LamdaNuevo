import { Header } from './components/Header'
import BusquedaCliente from './components/BusquedaCliente';

function App() {

  return (
    <>
      <Header />
      <div className="container mt-5 pt-5">
        <BusquedaCliente />
      </div>
    </>
  )
}

export default App
