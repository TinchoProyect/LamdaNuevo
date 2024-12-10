import { Header } from './components/Header'
import BusquedaCliente from './components/BusquedaCliente';

function App() {

  return (
    <>
      <Header />
      <div className="container">
        <BusquedaCliente />
      </div>
    </>
  )
}

export default App
