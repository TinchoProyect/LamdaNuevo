import React from 'react';
import { Movimiento } from '../types/movimiento';
import { formatNumeroFactura } from '../utils/numeroFacturaMap';

type MovimientoItemProps = {
  movimiento: Movimiento;
};

const MovimientoItem = ({ movimiento }: MovimientoItemProps) => {
  return (
    <li className="list-group-item">
      <h5>Movimiento #{movimiento.numero}</h5>
      <p><strong>Tipo Comprobante:</strong> {movimiento.nombre_comprobante}</p>
      <p><strong>Fecha:</strong> {movimiento.fecha}</p>
      <p><strong>Importe Neto:</strong> {movimiento.importe_neto}</p>
      <p><strong>Importe Total:</strong> {movimiento.importe_total}</p>
      <p><strong>Comentario:</strong> {movimiento.comentario}</p>
      <p><strong>Estado:</strong> {movimiento.estado}</p>
      <p><strong>Efectivo:</strong> {movimiento.efectivo}</p>
    </li>
  );
};

export default MovimientoItem;