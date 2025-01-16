import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useMovimientos } from '../context/MovimientoContext';
import { useSaldos } from '../context/SaldoContext';
import { Mov_Detalle } from '../types/movimiento_detalle';
import { comprobanteMap } from '../utils/comprobanteMap';
import { formatNumeroFactura } from '../utils/numeroFacturaMap';
import { Cliente } from '../types/cliente';
import './InformeCliente.css';
import { Movimiento } from '../types/movimiento';

type InformeClienteProps = {
  onBack: () => void;
  cliente: Cliente | null;
};

const InformeCliente = ({ onBack, cliente }: InformeClienteProps) => {
  const { movDetalles, isLoadingMovDetalles } = useMovimientoDetalles();
  const { movimientos, isLoadingMov } = useMovimientos();
  const { saldo, isLoadingSaldo } = useSaldos();

  const isLoading = isLoadingMovDetalles || isLoadingMov || isLoadingSaldo;

  // Formateador para números en formato regional argentino
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Obtener la fecha actual
  const fechaActual = new Date().toLocaleDateString('es-AR');

  // Función auxiliar para capitalizar la primera letra
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Obtener el saldo inicial del contexto o establecerlo en 0 si no está disponible
  const saldoInicial = saldo ? saldo.Monto : 0;

  // Ordenar movimientos por fecha (más recientes primero)
  const sortedMovimientos = [...movimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Asignar un índice a cada movimiento en el orden correcto (invertido)
  const movimientosConIndice = sortedMovimientos.map((mov, index, array) => ({
    ...mov,
    indice: array.length - index + 1,
  }));

  // Agrupar detalles por movimiento
  const detallesPorMovimiento = movDetalles.reduce((acc, detalle) => {
    const { Codigo_Movimiento } = detalle;
    if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
    acc[Codigo_Movimiento].push(detalle);
    return acc;
  }, {} as Record<number, Mov_Detalle[]>);

  // Función para agrupar movimientos por mes y año
  const agruparPorMes = () => {
    return movimientosConIndice.reduce((acc, mov) => {
      const [year, month] = mov.fecha.split('-');
      const mesYAnio = `${year}-${month}`;
      if (!acc[mesYAnio]) acc[mesYAnio] = [];
      acc[mesYAnio].push(mov);
      return acc;
    }, {} as Record<string, typeof movimientosConIndice>);
  };

  const movimientosPorMes = agruparPorMes();
  const saldoFinal = calcularSaldo(movimientosConIndice, saldoInicial);

  return (
    <div className="container m-0 p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          Movimientos de {cliente?.Nombre} {cliente?.Apellido} 
          <span className="text-muted ms-2">({cliente?.Número.toString().padStart(3, '0')})</span>
        </h2>
        <div>
          <h4 className="mb-0">
            Saldo: <span className="text-success">${formatter.format(saldoFinal)}</span>
          </h4>
          <small className="text-muted">({fechaActual})</small>
        </div>
      </div>
      
      <button className="btn btn-secondary mb-4 no-print" onClick={onBack}>
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
              <h4 className="text-secondary mb-3">
                {capitalizeFirstLetter(new Date(movimientos[0].fecha).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }))}
              </h4>

              {movimientos.map((mov) => (
                <div key={mov.codigo} className="mb-4">
                  <div className="border p-3 rounded bg-light">
                    <div className="justify-content-between d-flex">
                      <h5>
                        {comprobanteMap[mov.nombre_comprobante] || mov.nombre_comprobante}{' '}
                        <span className="text-success">${formatter.format(mov.importe_total)}</span>
                      </h5>
                      <p>
                        <strong>Número:</strong>{' '}
                        {formatNumeroFactura(detallesPorMovimiento[mov.codigo]?.[0]?.Punto_Venta_Detalle, mov.numero)}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {new Date(mov.fecha).toLocaleDateString('es-AR')}
                      </p>
                      <p>
                        <strong>Índice:</strong> {mov.indice}
                      </p>
                    </div>
                    {['FA', 'FB', 'FC','FE' ,'FD'].includes(mov.nombre_comprobante) && (
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
          {/* Renderizar saldo inicial al final del formulario */}
          <div className="mb-4">
            <div className="border p-3 rounded bg-light">
              <h5>
                <strong>Saldo Inicial:</strong>{' '}
                <span className="text-success">${formatter.format(saldoInicial)}</span>
              </h5>
              <p>
                <strong>Índice:</strong> 1
              </p>
              {saldo?.Fecha ? ( // Mostrar la fecha correcta del saldo inicial con ajuste manual para zona horaria
                <p>
                  <strong>Fecha:</strong>{' '}
                  {(() => {
                    const fecha = new Date(saldo.Fecha); // Convertir a objeto Date
                    fecha.setHours(fecha.getHours() + 3); // Ajustar manualmente a UTC-3
                    return fecha.toLocaleDateString('es-AR');
                  })()}
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const calcularSaldo = (movimientos: Movimiento[], saldoInicial: number) => {
  return movimientos.reduce((saldo, mov) => {
    if (['FA', 'FB','FE','FC', 'FD', 'N/C A', 'N/C B', 'N/C C', 'N/C E', 'Mov. Cli.'].includes(mov.nombre_comprobante)) {
      return saldo + mov.importe_total;
    } else if (['RB A', 'RB B', 'Mov. Cli.'].includes(mov.nombre_comprobante)) {
      return saldo - mov.importe_total;
    }
    return saldo;
  }, saldoInicial);
};

export default InformeCliente;