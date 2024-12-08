import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useMovimientos } from '../context/MovimientoContext';
import { Mov_Detalle } from '../types/movimiento_detalle';
import { comprobanteMap } from '../utils/comprobanteMap';
import { formatNumeroFactura } from '../utils/numeroFacturaMap';
import './InformeCliente.css';

type InformeClienteProps = {
  onBack: () => void; // Prop para manejar la acción de volver
};

const InformeCliente = ({ onBack }: InformeClienteProps) => {
  const { movDetalles, isLoadingMovDetalles } = useMovimientoDetalles();
  const { movimientos, isLoadingMov } = useMovimientos();

  const isLoading = isLoadingMovDetalles || isLoadingMov;

  // Ordenar movimientos por fecha (más recientes primero)
  const sortedMovimientos = [...movimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Agrupar detalles por movimiento
  const detallesPorMovimiento = movDetalles.reduce((acc, detalle) => {
    const { Codigo_Movimiento } = detalle;
    if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
    acc[Codigo_Movimiento].push(detalle);
    return acc;
  }, {} as Record<number, Mov_Detalle[]>);

  // Función para agrupar movimientos por mes y año
  const agruparPorMes = () => {
    return sortedMovimientos.reduce((acc, mov) => {
      const [year, month] = mov.fecha.split('-');
      const mesYAnio = `${year}-${month}`;
      if (!acc[mesYAnio]) acc[mesYAnio] = [];
      acc[mesYAnio].push(mov);
      return acc;
    }, {} as Record<string, typeof movimientos>);
  };

  const movimientosPorMes = agruparPorMes();

  return (
    <div className="container">
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
          {Object.entries(movimientosPorMes).map(([mesYAnio, movimientos]) => (
            <div key={mesYAnio} className="mb-4">
              {/* Título del mes */}
              <h4 className="text-secondary mb-3">
                {new Date(movimientos[0].fecha).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
              </h4>

              {/* Listado de movimientos */}
              {movimientos.map((mov) => (
                <div key={mov.codigo} className="mb-4">
                  <div className="border p-3 rounded bg-light">
                    <div className="justify-content-between d-flex">
                      <h5>
                        {comprobanteMap[mov.nombre_comprobante] || mov.nombre_comprobante}{' '}
                        <span className="text-success">${mov.importe_total.toFixed(2)}</span>
                      </h5>
                      <p>
                        <strong>Número Factura:</strong>{' '}
                        {formatNumeroFactura(detallesPorMovimiento[mov.codigo]?.[0]?.Punto_Venta_Detalle, mov.numero)}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {new Date(mov.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    {['FA', 'FB', 'FC', 'FD'].includes(mov.nombre_comprobante) && (
                      <div>
                        <table className="table table-bordered mt-3">
                          <thead>
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default InformeCliente;
