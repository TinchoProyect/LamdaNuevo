import React from 'react';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useMovimientos } from '../context/MovimientoContext';
import { Mov_Detalle } from '../types/movimiento_detalle';
import { comprobanteMap } from '../utils/comprobanteMap';
import { formatNumeroFactura } from '../utils/numeroFacturaMap';

type InformeClienteProps = {
    onBack: () => void; // Prop para manejar la acción de volver
  };

const InformeCliente = ({ onBack }: InformeClienteProps) => {
  const { movDetalles, isLoadingMovDetalles } = useMovimientoDetalles(); // Obtener los detalles de movimientos del contexto
  const { movimientos, isLoadingMov } = useMovimientos(); // Obtener los movimientos del contexto

  const isLoading = isLoadingMovDetalles || isLoadingMov; // Combinar los estados de carga

  return (
    <div className="container mt-5 pt-5" style={{ maxWidth: '800px' }}>
      <h2 className="text-center mb-4">Movimientos del Cliente</h2>
      <button className="btn btn-secondary mb-4" onClick={onBack}>
        Volver
      </button>
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-center mb-3">Movimientos</h3>
          <ul className="list-group mb-4">
            {movimientos.length > 0 ? (
              movimientos.map((mov) => (
                <li key={mov.codigo} className="list-group-item">
                  <h5>Movimiento #{mov.numero}</h5>
                  <p><strong>Tipo Comprobante:</strong> {mov.tipo_comprobante}</p>
                  <p><strong>Nombre Comprobante:</strong> {comprobanteMap[mov.nombre_comprobante] || mov.nombre_comprobante}</p>
                  <p><strong>Fecha:</strong> {mov.fecha}</p>
                  <p><strong>Importe Neto:</strong> {mov.importe_neto}</p>
                  <p><strong>Importe Total:</strong> {mov.importe_total}</p>
                  <p><strong>Comentario:</strong> {mov.comentario}</p>
                  <p><strong>Estado:</strong> {mov.estado}</p>
                  <p><strong>Efectivo:</strong> {mov.efectivo}</p>
                </li>
              ))
            ) : (
              <p className="text-center">No se encontraron movimientos</p>
            )}
          </ul>

          <h3 className="text-center mb-3">Detalles de Movimientos</h3>
          <ul className="list-group">
            {movDetalles.length > 0 ? (
              movDetalles.map((mov: Mov_Detalle) => (
                <li key={mov.Codigo_Movimiento} className="list-group-item">
                  <h5>Detalle de Movimiento #{mov.Numero_Movimiento}</h5>
                  <p><strong>Tipo Comprobante:</strong> {mov.Tipo_Comprobante}</p>
                  <p><strong>Nombre Comprobante:</strong> {comprobanteMap[mov.Nombre_Comprobante] || mov.Nombre_Comprobante}</p>
                  <p><strong>Fecha:</strong> {mov.Fecha_Movimiento}</p>
                  <p><strong>Numero Factura:</strong>{formatNumeroFactura(mov.Punto_Venta_Detalle, mov.Numero_Movimiento)}</p>
                  <p><strong>Importe Neto:</strong> {mov.Importe_Neto_Movimiento}</p>
                  <p><strong>Importe Total:</strong> {mov.Importe_Total_Movimiento}</p>
                  <p><strong>Artículo:</strong> {mov.Articulo_Detalle}</p>
                  <p><strong>Descripción:</strong> {mov.Descripcion_Detalle}</p>
                  <p><strong>Cantidad:</strong> {mov.Cantidad_Detalle}</p>
                  <p><strong>Punto de Venta:</strong> {mov.Punto_Venta_Detalle}</p>
                  <p><strong>Efectivo:</strong> {mov.Efectivo}</p>
                </li>
              ))
            ) : (
              <p className="text-center">No se encontraron detalles de movimientos</p>
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default InformeCliente;