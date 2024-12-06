export type Mov_Detalle = {
    Codigo_Movimiento: number;
    Numero_Movimiento: number;
    Tipo_Comprobante: number;
    Nombre_Comprobante: string;
    Fecha_Movimiento: string; // ISO 8601 date string
    Importe_Neto_Movimiento: number;
    Importe_Total_Movimiento: number;
    Articulo_Detalle: string;
    Descripcion_Detalle: string;
    Cantidad_Detalle: number;
    Punto_Venta_Detalle: number;
    Efectivo: number | null;
}