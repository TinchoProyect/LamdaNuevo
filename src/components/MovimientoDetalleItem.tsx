import React from 'react';
import { Mov_Detalle } from '../types/movimiento_detalle';
import { formatNumeroFactura } from '../utils/numeroFacturaMap';

type MovimientoDetalleItemProps = {
  detalle: Mov_Detalle;
};

const MovimientoDetalleItem = ({ detalle }: MovimientoDetalleItemProps) => {
  return (
    <li className="list-group-item">
      <h5>Detalle de Movimiento #{detalle.Numero_Movimiento}</h5>
      <p><strong>Tipo Comprobante:</strong> {detalle.Tipo_Comprobante}</p>
      <p><strong>Nombre Comprobante:</strong> {detalle.Nombre_Comprobante}</p>
      <p><strong>Fecha:</strong> {detalle.Fecha_Movimiento}</p>
      <p><strong>Numero Factura:</strong> {formatNumeroFactura(detalle.Punto_Venta_Detalle, detalle.Numero_Movimiento)}</p>
      <p><strong>Importe Neto:</strong> {detalle.Importe_Neto_Movimiento}</p>
      <p><strong>Importe Total:</strong> {detalle.Importe_Total_Movimiento}</p>
      <p><strong>Artículo:</strong> {detalle.Articulo_Detalle}</p>
      <p><strong>Descripción:</strong> {detalle.Descripcion_Detalle}</p>
      <p><strong>Cantidad:</strong> {detalle.Cantidad_Detalle}</p>
      <p><strong>Punto de Venta:</strong> {detalle.Punto_Venta_Detalle}</p>
      <p><strong>Efectivo:</strong> {detalle.Efectivo}</p>
    </li>
  );
};

export default MovimientoDetalleItem;