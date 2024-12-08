import React, { useState } from 'react';
import { useClientes } from '../context/ClientesContext';
import { useMovimientos } from '../context/MovimientoContext';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { Cliente } from '../types/cliente';
import InformeCliente from './InformeCliente';

const MAX_RESULTS = 10; // Límite de clientes visibles

const BusquedaCliente = () => {
  const { clientes, isLoading } = useClientes(); // Obtener los clientes y el estado de carga del contexto
  const { fetchMovDetalles } = useMovimientoDetalles(); // Obtener la función para obtener los detalles de movimientos
  const { fetchMovimientos } = useMovimientos(); // Obtener la función para obtener los movimientos
  const [searchTerm, setSearchTerm] = useState<string>(''); // Estado local para la búsqueda
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null); // Cliente seleccionado
  const [showInforme, setShowInforme] = useState<boolean>(false); // Estado para mostrar los movimientos

  // Función para filtrar clientes según el término de búsqueda
  const filteredClientes = clientes.filter((cliente: Cliente) => {
    const numero = cliente.Número ? cliente.Número.toString() : '';
    const nombre = cliente.Nombre ? cliente.Nombre.toLowerCase() : '';
    const apellido = cliente.Apellido ? cliente.Apellido.toLowerCase() : '';
    return (
      numero.includes(searchTerm) || // Busca por el número
      nombre.includes(searchTerm.toLowerCase()) || // Busca por el nombre
      apellido.includes(searchTerm.toLowerCase()) // Busca por el apellido
    );
  });

  // Limitar los resultados mostrados
  const limitedClientes = filteredClientes.slice(0, MAX_RESULTS);

  // Función para manejar la selección de un cliente
  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
  };

  // Función para manejar el botón "Ver movimientos"
  const handleVerMovimientos = () => {
    if (selectedCliente) {
      fetchMovDetalles(selectedCliente.Número); // Llama a la función para obtener los detalles de movimientos
      fetchMovimientos(selectedCliente.Número); // Llama a la función para obtener los movimientos
      setShowInforme(true); // Muestra el componente de movimientos
    }
  };

  const handleBack = () => {
    setShowInforme(false); // Vuelve a mostrar el componente de búsqueda de clientes
  };

  return (
    <div className="container mt-5 pt-5">
      {showInforme ? (
        <InformeCliente onBack={handleBack} />
      ) : (
        <>
          <h2 className="text-center mb-4">Buscar Clientes</h2>
          <input
            type="text"
            className="form-control mb-4"
            placeholder="Buscar por número, nombre o apellido"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el término de búsqueda
          />
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <>
              <ul className="list-group mb-3">
                {limitedClientes.length > 0 ? (
                  <>
                    {limitedClientes.map((cliente: Cliente) => (
                      <li
                        key={cliente.Número}
                        className={`list-group-item list-group-item-action ${
                          selectedCliente?.Número === cliente.Número ? 'active' : ''
                        }`}
                        onClick={() => handleSelectCliente(cliente)}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>{cliente.Número}</strong> - {cliente.Nombre} {cliente.Apellido}
                      </li>
                    ))}
                    {filteredClientes.length > MAX_RESULTS && (
                      <li className="list-group-item text-muted text-center">
                        Hay más resultados, refine su búsqueda.
                      </li>
                    )}
                  </>
                ) : (
                  <p className="text-center">No se encontraron clientes</p>
                )}
              </ul>
              <button
                className="btn btn-primary w-100"
                onClick={handleVerMovimientos}
                disabled={!selectedCliente} // Desactiva si no hay un cliente seleccionado
              >
                Ver Movimientos
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BusquedaCliente;