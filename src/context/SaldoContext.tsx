import { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api'; // Reutiliza la instancia de axios
import { Saldo } from '../types/saldo';

type SaldoContextType = {
    saldo: Saldo | null;
    setSaldo: (saldo: Saldo | null) => void;
    isLoadingSaldo: boolean;
    fetchSaldo: (id: number) => Promise<void>;
};

const SaldoContext = createContext<SaldoContextType | undefined>(undefined);

export const SaldoProvider = ({ children }: { children?: ReactNode }) => {
    const [saldo, setSaldo] = useState<Saldo | null>(null);
    const [isLoadingSaldo, setIsLoadingSaldo] = useState<boolean>(false);
    const [, setError] = useState<string | null>(null);

    const fetchSaldo = async (id: number) => {
        try {
            setIsLoadingSaldo(true);
            setError(null);
            const response = await api.get<Saldo>(`/saldos-iniciales/${id}`); // Usa tu instancia configurada
            setSaldo(response.data);
        } catch (error) {
            setError('Error al obtener el saldo');
            console.error('Error al obtener el saldo:', error);
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