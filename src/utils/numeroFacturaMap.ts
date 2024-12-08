export function formatNumeroFactura(serie: number | null, numero: number | null): string {
    if (serie === null || serie === undefined || numero === null || numero === undefined) {
      return '0000 - 00000000'; // Valor por defecto en caso de parámetros inválidos
    }
  
    const serieStr = serie.toString().padStart(4, '0');
    const numeroStr = numero.toString().padStart(8, '0');
    return `${serieStr} - ${numeroStr}`;
  }