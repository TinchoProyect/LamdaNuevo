export function formatNumeroFactura(serie: number | null, numero: number): string {
  const serieStr = (serie === null || serie === undefined) ? '0000' : serie.toString().padStart(4, '0');
  const numeroStr = numero.toString().padStart(8, '0');
  return `${serieStr} - ${numeroStr}`;
}