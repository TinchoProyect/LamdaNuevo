import { Movimiento } from '../types/movimiento';

export const calcularSaldoTotal = (movimientos: Movimiento[], saldoInicial: number): number => {
    const saldoTotal = saldoInicial + movimientos.reduce((total, mov) => total + mov.importe_total, 0);
    return saldoTotal;
};
