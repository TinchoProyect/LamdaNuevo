import { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api'; // Reutiliza la instancia de axios
import { Mov_Detalle } from '../types/movimiento_detalle';

type MovimientoDetalleContextType = {
  movDetalles: Mov_Detalle[];
  setMovDetalles: (movDetalles: Mov_Detalle[]) => void;
  isLoadingMovDetalles: boolean;
  fetchMovDetalles: (id: number) => Promise<void>;
};

const MovimientoDetalleContext = createContext<MovimientoDetalleContextType | undefined>(undefined);

export const MovimientoDetalleProvider = ({ children }: { children?: ReactNode }) => {
  const [movDetalles, setMovDetalles] = useState<Mov_Detalle[]>([]);
  const [isLoadingMovDetalles, setIsLoadingMovDetalles] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);

  const fetchMovDetalles = async (id: number) => {
    try {
      setIsLoadingMovDetalles(true);
      setError(null);
      const response = await api.get<Mov_Detalle[]>(`/movimientos_detalles?clienteId=${id}`); // Usa tu instancia configurada
      setMovDetalles(response.data);
    } catch (error) {
      setError('Error al obtener los detalles de movimientos');
      console.error('Error al obtener los detalles de movimientos:', error);
    } finally {
      setIsLoadingMovDetalles(false);
    }
  };

  return (
    <MovimientoDetalleContext.Provider value={{ movDetalles, setMovDetalles, isLoadingMovDetalles, fetchMovDetalles }}>
      {children}
    </MovimientoDetalleContext.Provider>
  );
};

export const useMovimientoDetalles = () => {
  const context = useContext(MovimientoDetalleContext);
  if (!context) throw new Error('useMovimientoDetalles debe usarse dentro de MovimientoDetalleProvider');
  return context;
};
