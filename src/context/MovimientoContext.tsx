import { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api'; // Reutiliza la instancia de axios
import { Movimiento } from '../types/movimiento';

type MovimientoContextType = {
  movimientos: Movimiento[];
  setMovimientos: (movimientos: Movimiento[]) => void;
  isLoadingMov: boolean;
  fetchMovimientos: (id: number) => Promise<Movimiento[]>;
};

const MovimientoContext = createContext<MovimientoContextType | undefined>(undefined);

export const MovimientoProvider = ({ children }: { children?: ReactNode }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoadingMov, setIsLoadingMov] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);

  const fetchMovimientos = async (id: number): Promise<Movimiento[]> => {
    try {
      setIsLoadingMov(true);
      setError(null);
      const response = await api.get<Movimiento[]>(`/movimientos?clienteId=${id}`); // Usa tu instancia configurada

      // Normalizamos los datos para garantizar que todos los movimientos tengan la propiedad `efectivo`
      const movimientosNormalizados = response.data.map((mov) => ({
        ...mov,
        efectivo: mov.efectivo ?? null, // Si `efectivo` está ausente, se asigna `null`
      }));

      setMovimientos(movimientosNormalizados);
      return movimientosNormalizados;
    } catch (error) {
      setError('Error al obtener los movimientos');
      console.error('Error al obtener los movimientos:', error);
      return [];
    } finally {
      setIsLoadingMov(false);
    }
  };

  return (
    <MovimientoContext.Provider value={{ movimientos, setMovimientos, isLoadingMov, fetchMovimientos }}>
      {children}
    </MovimientoContext.Provider>
  );
};

export const useMovimientos = () => {
  const context = useContext(MovimientoContext);
  if (!context) throw new Error('useMovimientos debe usarse dentro de MovimientoProvider');
  return context;
};
