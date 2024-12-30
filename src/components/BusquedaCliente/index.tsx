import { useState } from 'react';
import { useClientes } from '../../context/ClientesContext';
import { useMovimientos } from '../../context/MovimientoContext';
import { useMovimientoDetalles } from '../../context/MovimientoDetalleContext';
import { useSaldos } from '../../context/SaldoContext';
import { Cliente } from '../../types/cliente';
import { useClienteSearch } from './hooks/useClienteSearch';
import SearchInput from './components/SearchInput';
import ClientesList from './components/ClientesList';
import SelectedClient from './components/SelectedClient';
import InformeCliente from '../InformeCliente';

const BusquedaCliente = () => {
  const { clientes, isLoading } = useClientes();
  const { fetchMovDetalles } = useMovimientoDetalles();
  const { fetchMovimientos } = useMovimientos();
  const { fetchSaldo, setSaldo } = useSaldos();
  
  const { searchTerm, setSearchTerm, filteredClientes } = useClienteSearch(clientes);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showInforme, setShowInforme] = useState<boolean>(false);

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setSearchTerm('');
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

  if (showInforme) {
    return <InformeCliente onBack={handleBack} cliente={selectedCliente} />;
  }

  return (
    <div className="container mt-5 pt-5">
      <div className="search-container">
        <h2 className="text-center mb-4">Buscar Clientes</h2>
        
        <div className="search-section">
          <SearchInput 
            value={searchTerm}
            onChange={setSearchTerm}
          />

          {!isLoading && searchTerm && (
            <ClientesList
              clientes={filteredClientes}
              selectedCliente={selectedCliente}
              onSelectCliente={handleSelectCliente}
            />
          )}
        </div>

        {selectedCliente && (
          <SelectedClient cliente={selectedCliente} />
        )}

        <button
          className="btn btn-primary w-100 mt-3"
          onClick={handleVerMovimientos}
          disabled={!selectedCliente}
        >
          Ver Movimientos
        </button>
      </div>
    </div>
  );
};

export default BusquedaCliente;