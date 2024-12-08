export function formatNumeroCliente(numero: number): string {
  return numero.toString().padStart(3, '0');
}