import React, { useState } from 'react';
import { useClientes } from '../context/ClientesContext';
import { Cliente } from '../types/cliente';

const BusquedaCliente = () => {
  const { clientes } = useClientes(); // Obtener los clientes del contexto
  const [searchTerm, setSearchTerm] = useState<string>(''); // Estado local para la búsqueda

  // Función para filtrar clientes según el término de búsqueda
  const filteredClientes = clientes.filter((cliente: Cliente) =>
    cliente.Numero.toString().includes(searchTerm) || // Busca por el número
    cliente.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) || // Busca por el nombre
    cliente.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) // Busca por el apellido
  );

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Buscar Clientes</h2>
      <input
        type="text"
        placeholder="Buscar por número, nombre o apellido"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el término de búsqueda
        style={{
          width: '100%',
          padding: '0.5rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />
      {filteredClientes.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredClientes.map((cliente) => (
            <li
              key={cliente.Numero}
              style={{
                borderBottom: '1px solid #ddd',
                padding: '0.5rem 0',
              }}
            >
              <strong>{cliente.Nombre} {cliente.Apellido}</strong> - #{cliente.Numero}
            </li>
          ))}
        </ul>
      ) : (
        <p>No se encontraron clientes</p>
      )}
    </div>
  );
};

export default BusquedaCliente;
