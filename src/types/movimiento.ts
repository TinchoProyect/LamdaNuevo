export type Movimiento = {
    codigo: number;
    cod_cli_prov: number;
    tipo_comprobante: number;
    nombre_comprobante: string;
    numero: number;
    fecha: string | null; // ISO 8601 date string

    importe_neto: number;
    fecha_vto: string; // ISO 8601 date string
    fecha_comprobante: string; // ISO 8601 date string
    importe_total: number;
    comentario: string;
    estado: number;
    efectivo: string | null;
    índice: number; // Nuevo campo agregado para numerar los movimientos
    saldo_parcial: number; // Nuevo campo para el saldo parcial acumulativo
};
