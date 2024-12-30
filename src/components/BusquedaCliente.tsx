import { useState } from 'react';
import { useClientes } from '../context/ClientesContext';
import { useMovimientos } from '../context/MovimientoContext';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useSaldos } from '../context/SaldoContext';
import { formatNumeroCliente } from '../utils/numeroClienteMap';
import { Cliente } from '../types/cliente';
import InformeCliente from './InformeCliente';
import './BusquedaCliente.css';

const MAX_RESULTS = 10;

const BusquedaCliente = () => {
  const { clientes, isLoading } = useClientes();
  const { fetchMovDetalles } = useMovimientoDetalles();
  const { fetchMovimientos } = useMovimientos();
  const { fetchSaldo, setSaldo } = useSaldos();
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showInforme, setShowInforme] = useState<boolean>(false);

  // Filtrar clientes basado en el término de búsqueda
  const filteredClientes = searchTerm ? clientes.filter((cliente: Cliente) => {
    const numero = formatNumeroCliente(cliente.Número);
    const nombre = cliente.Nombre?.toLowerCase() || '';
    const apellido = cliente.Apellido?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return numero.includes(searchTerm) || 
           nombre.includes(searchLower) || 
           apellido.includes(searchLower);
  }) : [];

  const limitedClientes = filteredClientes.slice(0, MAX_RESULTS);

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setSearchTerm(''); // Limpiar el campo de búsqueda al seleccionar
  };

  const handleVerMovimientos = () => {
    if (selectedCliente) {
      fetchMovDetalles(selectedCliente.Número);
      fetchMovimientos(selectedCliente.Número);
      fetchSaldo(selectedCliente.Número);
      setShowInforme(true);
    }
  };

  const handleBack = () => {
    setShowInforme(false);
    setSaldo(null);
  };

  return (
    <div className="container mt-5 pt-5">
      {showInforme ? (
        <InformeCliente onBack={handleBack} cliente={selectedCliente} />
      ) : (
        <div className="search-container">
          <h2 className="text-center mb-4">Buscar Clientes</h2>
          
          <div className="search-wrapper">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Buscar por número, nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && !isLoading && (
              <div className="clientes-list-container">
                {limitedClientes.length > 0 ? (
                  <ul className="list-group">
                    {limitedClientes.map((cliente: Cliente) => (
                      <li
                        key={cliente.Número}
                        className={`list-group-item list-group-item-action ${
                          selectedCliente?.Número === cliente.Número ? 'active' : ''
                        }`}
                        onClick={() => handleSelectCliente(cliente)}
                      >
                        <strong>{formatNumeroCliente(cliente.Número)}</strong> - {cliente.Nombre} {cliente.Apellido}
                      </li>
                    ))}
                    {filteredClientes.length > MAX_RESULTS && (
                      <li className="list-group-item text-muted text-center">
                        Hay más resultados, refine su búsqueda.
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-center no-results">No se encontraron clientes</p>
                )}
              </div>
            )}
          </div>

          {selectedCliente && (
            <div className="selected-client mt-3 mb-3">
              <h5>Cliente seleccionado:</h5>
              <p>
                <strong>{formatNumeroCliente(selectedCliente.Número)}</strong> - {selectedCliente.Nombre} {selectedCliente.Apellido}
              </p>
            </div>
          )}

          <button
            className="btn btn-primary w-100 mt-3"
            onClick={handleVerMovimientos}
            disabled={!selectedCliente}
          >
            Ver Movimientos
          </button>
        </div>
      )}
    </div>
  );
};

export default BusquedaCliente;