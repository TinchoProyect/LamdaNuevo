import { Movimiento } from '../types/movimiento';

  const calcularSaldoTotal = (saldoInicial: number, movimientos: Movimiento[]): number => {
  let saldoAcumulado = saldoInicial || 0;

 
  

  movimientos.forEach((mov: Movimiento) => {
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
      saldoAcumulado += mov.importe_total;
    } else if (mov.nombre_comprobante.startsWith('RB')) {
      saldoAcumulado -= mov.importe_total;
    }
  });

  if (saldoAcumulado >= -0.99 && saldoAcumulado <= 0.99) {
    saldoAcumulado = 0;
  }

  return saldoAcumulado;
};

export default calcularSaldoTotal;