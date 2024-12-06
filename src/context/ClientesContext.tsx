import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../services/api'; // Reutiliza la instancia de axios
import { Cliente } from '../types/cliente';

type ClienteContextType = {
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  isLoading: boolean;
  fetchClientes: () => Promise<void>;
};

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

export const ClienteProvider = ({ children }: { children?: ReactNode }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);


  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<Cliente[]>('/consulta'); // Usa tu instancia configurada
      setClientes(response.data);
    } catch (error) {
      setError('Error al obtener los clientes');
      console.error('Error al obtener los clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes(); // Llama automáticamente al cargar el contexto
  }, []);

  return (
    <ClienteContext.Provider value={{ clientes, setClientes, isLoading, fetchClientes }}>
      {children}
    </ClienteContext.Provider>
  );
};

export const useClientes = () => {
  const context = useContext(ClienteContext);
  if (!context) throw new Error('useClientes debe usarse dentro de ClienteProvider');
  return context;
};