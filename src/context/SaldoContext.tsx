import { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api'; // Reutiliza la instancia de axios
import { Saldo } from '../types/saldo';

type SaldoContextType = {
    saldo: Saldo | null;
    setSaldo: (saldo: Saldo | null) => void;
    isLoadingSaldo: boolean;
    fetchSaldo: (id: number) => Promise<number>; // Cambiado para devolver el saldo como número
};

const SaldoContext = createContext<SaldoContextType | undefined>(undefined);

export const SaldoProvider = ({ children }: { children?: ReactNode }) => {
    const [saldo, setSaldo] = useState<Saldo | null>(null);
    const [isLoadingSaldo, setIsLoadingSaldo] = useState<boolean>(false);
    const [, setError] = useState<string | null>(null);

    const fetchSaldo = async (id: number): Promise<number> => {
        try {
            setIsLoadingSaldo(true);
            setError(null);

            // Realizar la solicitud a la API
            const response = await api.get<Saldo>(`/saldos-iniciales/${id}`);

            // Actualizar el estado del saldo
            setSaldo(response.data);

            // Validar y devolver el monto como número
            const monto = response.data?.Monto;
            if (typeof monto !== 'number') {
                throw new Error(`El formato del saldo no es válido. Se esperaba un número, pero se obtuvo: ${typeof monto}`);
            }

            return monto;
        } catch (error) {
            setError('Error al obtener el saldo');
            console.error('Error al obtener el saldo:', error);
            throw error; // Relanzar el error para manejo externo
        } finally {
            setIsLoadingSaldo(false);
        }
    };

    return (
        <SaldoContext.Provider value={{ saldo, setSaldo, isLoadingSaldo, fetchSaldo }}>
            {children}
        </SaldoContext.Provider>
    );
};

export const useSaldos = () => {
    const context = useContext(SaldoContext);
    if (!context) throw new Error('useSaldos debe usarse dentro de SaldoProvider');
    return context;
};