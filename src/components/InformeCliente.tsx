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

  const sortedMovimientos = [...movimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Ordenar los movimientos por fecha

  const detallesPorMovimiento = movDetalles.reduce((acc, detalle) => {
    const { Codigo_Movimiento } = detalle;
    if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
    acc[Codigo_Movimiento].push(detalle);
    return acc;
  }, {} as Record<number, Mov_Detalle[]>);

  return (
    <div className="container mt-5 pt-5">
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
            {sortedMovimientos.length > 0 ? (
              sortedMovimientos.map((mov) => (
                <li key={mov.codigo} className="list-group-item">
                  <p>{comprobanteMap[mov.nombre_comprobante] || mov.nombre_comprobante} ${mov.importe_total}</p>
                  <p><strong>Numero Factura:</strong> {formatNumeroFactura(detallesPorMovimiento[mov.codigo]?.[0]?.Punto_Venta_Detalle, mov.numero)}</p>
                  <p><strong>Fecha:</strong> {mov.fecha.split("T", 1)}</p>
                  <p><strong>Importe Total:</strong> {mov.importe_total}</p>
                  {['FA', 'FB', 'FC', 'FD'].includes(mov.nombre_comprobante) && (
                  <div className="mt-3">
                    <h6>Detalles de Movimiento</h6>
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered">
                        <thead className="table-dark">
                          <tr>
                            <th>Artículo</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detallesPorMovimiento[mov.codigo]?.map((detalle) => (
                            <tr key={detalle.Numero_Movimiento}>
                              <td>{detalle.Articulo_Detalle}</td>
                              <td>{detalle.Descripcion_Detalle}</td>
                              <td>{detalle.Cantidad_Detalle}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
              ))
            ) : (
              <li className="list-group-item">No hay movimientos disponibles.</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default InformeCliente;