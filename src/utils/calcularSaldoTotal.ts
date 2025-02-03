import { Movimiento } from '../types/movimiento';

const calcularSaldoTotal = (saldoInicial: number, movimientos: Movimiento[]): number => {
  let saldoAcumulado = saldoInicial || 0;

  movimientos.forEach((mov: Movimiento) => {
    // Usamos el nombre del comprobante para determinar si el movimiento es crédito o débito
    if (
      [
        'FA',
        'FB',
        'FC',
        'FE',
        'FD',
        'N/C A',
        'N/C B',
        'N/C C',
        'N/C E',
        'Mov. Cli.'
      ].includes(mov.nombre_comprobante)
    ) {
      // Movimiento de crédito: se suma el importe
      saldoAcumulado += mov.importe_total;
    } else if (mov.nombre_comprobante.startsWith('RB')) {
      // Movimiento de débito: se resta el importe
      saldoAcumulado -= mov.importe_total;
    }
  });

  // Si el saldo acumulado es cercano a cero (entre -0,99 y 0,99), lo consideramos 0
  if (saldoAcumulado >= -0.99 && saldoAcumulado <= 0.99) {
    saldoAcumulado = 0;
  }

  return saldoAcumulado;
};

export default calcularSaldoTotal;
