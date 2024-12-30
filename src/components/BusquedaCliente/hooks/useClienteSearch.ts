import { useState, useMemo } from 'react';
import { Cliente } from '../../../types/cliente';
import { formatNumeroCliente } from '../../../utils/numeroClienteMap';

export const useClienteSearch = (clientes: Cliente[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClientes = useMemo(() => {
    if (!searchTerm) return [];

    return clientes.filter((cliente) => {
      const numero = formatNumeroCliente(cliente.Número);
      const nombre = cliente.Nombre?.toLowerCase() || '';
      const apellido = cliente.Apellido?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return numero.includes(searchTerm) || 
             nombre.includes(searchLower) || 
             apellido.includes(searchLower);
    });
  }, [clientes, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredClientes
  };
};