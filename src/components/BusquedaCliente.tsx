import React, { useState } from 'react';
import { useClientes } from '../context/ClientesContext';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { Cliente } from '../types/cliente';

const MAX_RESULTS = 10; // Límite de clientes visibles

const BusquedaCliente = () => {
  const { clientes, isLoading } = useClientes(); // Obtener los clientes y el estado de carga del contexto
  const { fetchMovDetalles } = useMovimientoDetalles(); // Obtener la función para obtener los detalles de movimientos
  const [searchTerm, setSearchTerm] = useState<string>(''); // Estado local para la búsqueda
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null); // Cliente seleccionado

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
      // Lógica para navegar o mostrar los movimientos del cliente
      console.log(`Ver movimientos para el cliente:`, selectedCliente);
      alert(`Movimientos del cliente ${selectedCliente.Nombre}`);
    }
  };

  return (
    <div className="container mt-5 pt-5" style={{ maxWidth: '600px' }}>
      <h2 className="text-center">Buscar Clientes</h2>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar por número, nombre o apellido"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el término de búsqueda
      />
      {isLoading ? (
        <p className="text-center">Cargando clientes...</p>
      ) : (
        <>
          <ul className="list-group mb-3">
            {limitedClientes.length > 0 ? (
              <>
                {limitedClientes.map((cliente: Cliente) => (
                  <li
                    key={cliente.Número}
                    className={`list-group-item ${
                      selectedCliente?.Número === cliente.Número ? 'active' : ''
                    }`}
                    onClick={() => handleSelectCliente(cliente)}
                    style={{ cursor: 'pointer' }}
                  >
                    <strong>{cliente.Nombre}</strong> - #{cliente.Número}
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
    </div>
  );
};

export default BusquedaCliente;
