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

  const formatter = (value: number) => {
    if (Math.abs(value) < 0.99) return '0.00';
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const fechaActual = new Date().toLocaleDateString('es-AR');

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const saldoInicial = saldo ? saldo.Monto : 0;

  const sortedMovimientos = [...movimientos].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  let saldoAcumulado = saldoInicial;
  const movimientosConSaldoParcial = sortedMovimientos.map((mov, index) => {
    if ([
      'FA',
      'FB',
      'FC',
      'FE',
      'FD',
      'N/C A',
      'N/C B',
      'N/C C',
      'N/C E',
      'Mov. Cli.',
    ].includes(mov.nombre_comprobante)) {
      saldoAcumulado += mov.importe_total;
    } else if (mov.nombre_comprobante.startsWith('RB')) {
      saldoAcumulado -= mov.importe_total;
    }
    return {
      ...mov,
      saldo_parcial: saldoAcumulado,
      índice: index + 2,
      efectivo: mov.efectivo ?? null,
      cod_cli_prov: mov.cod_cli_prov,
      tipo_comprobante: mov.tipo_comprobante,
      importe_neto: mov.importe_neto,
      fecha_vto: mov.fecha_vto,
      fecha_comprobante: mov.fecha_comprobante,
      comentario: mov.comentario,
      estado: Number(mov.estado), // Asegurarse de que 'estado' sea un número
      codigo: Number(mov.codigo), // Asegurarse de que 'codigo' sea un número
      numero: Number(mov.numero), // Asegurarse de que 'numero' sea un número
    } as Movimiento;
  });

  const movimientosConSaldoInicial = [
    {
      codigo: 0, // Asegurarse de que 'codigo' sea un número
      nombre_comprobante: 'Saldo Inicial',
      importe_total: saldoInicial,
      saldo_parcial: saldoInicial,
      fecha: '',
      numero: 0, // Asegurarse de que 'numero' sea un número
      índice: 1,
      efectivo: null,
      cod_cli_prov: 0,
      tipo_comprobante: 0,
      importe_neto: 0,
      fecha_vto: '',
      fecha_comprobante: '',
      comentario: '',
      estado: 0, // Asegurarse de que 'estado' sea un número
    } as Movimiento,
    ...movimientosConSaldoParcial,
  ];

  const saldoFinal =
    movimientosConSaldoInicial.length > 0
      ? movimientosConSaldoInicial[movimientosConSaldoInicial.length - 1].saldo_parcial
      : saldoInicial;

  const detallesPorMovimiento = movDetalles.reduce((acc, detalle) => {
    const { Codigo_Movimiento } = detalle;
    if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
    acc[Codigo_Movimiento].push(detalle);
    return acc;
  }, {} as Record<number, Mov_Detalle[]>);

  const movimientosPorMes = movimientosConSaldoInicial.reduce((acc, mov) => {
    const [year, month] = mov.fecha.split('-');
    const mesYAnio = `${year}-${month}`;
    if (!acc[mesYAnio]) acc[mesYAnio] = [];
    acc[mesYAnio].push(mov);
    return acc;
  }, {} as Record<string, typeof movimientosConSaldoInicial>);

  const esNotaDeCredito = (nombreComprobante: string): boolean => {
    const comprobanteLimpio = nombreComprobante.trim().toUpperCase();
    return (
      comprobanteLimpio.includes('N/C') ||
      comprobanteLimpio.startsWith('N') ||
      comprobanteLimpio.includes('NOTA DE CRÉDITO')
    );
  };

  const aplicarEstilosDinamicos = (mov: Movimiento) => {
    if (esNotaDeCredito(mov.nombre_comprobante)) {
      return { backgroundColor: '#A9A9A9cc' }; // Estilo para notas de crédito
    }
    if (mov.nombre_comprobante.startsWith('R')) {
      return { backgroundColor: '#c8e6c9' }; // Estilo para recibos (verde claro)
    }
    if (['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante) && saldoFinal > 0) {
      return { backgroundColor: '#f0f0f0' }; // Estilo para facturas (gris claro)
    }
    return {};
  };

  return (
    <div className="container m-0 p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          Movimientos de {cliente?.Nombre} {cliente?.Apellido}
          <span className="text-muted ms-2">
            ({cliente?.Número.toString().padStart(3, '0')})
          </span>
        </h2>
        <div>
          <h4 className="mb-0">
            Saldo: <span className="text-success">${formatter(saldoFinal)}</span>
          </h4>
          <small className="text-muted">({fechaActual})</small>
        </div>
      </div>

      <button className="btn btn-secondary mb-4 no-print" onClick={onBack}>
        Volver
      </button>

      {isLoading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: '200px' }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          {Object.entries(movimientosPorMes)
            .reverse()
            .map(([mesYAnio, movimientos]) => (
              <div key={mesYAnio} className="mb-4">
                <h4 className="text-secondary mb-3">
                  {capitalizeFirstLetter(
                    new Date(movimientos[0].fecha).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                    })
                  )}
                </h4>

                {movimientos.reverse().map((mov) => {
                  const estiloInline = aplicarEstilosDinamicos(mov);

                  return (
                    <div key={mov.codigo} className="mb-4" style={estiloInline}>
                      <div className="border p-3 rounded">
                        <div className="justify-content-between d-flex">
                          <h5>
                            {comprobanteMap[mov.nombre_comprobante] || mov.nombre_comprobante}{' '}
                            <span className="text-success">
                              ${formatter(mov.importe_total)}
                              {mov.nombre_comprobante.startsWith('RB') &&
                              typeof mov.efectivo === 'string'
                                ? ` (${mov.efectivo})`
                                : ''}
                            </span>
                          </h5>
                          <p>
                            <strong>Número:</strong>{' '}
                            {formatNumeroFactura(
                              detallesPorMovimiento[mov.codigo]?.[0]?.Punto_Venta_Detalle,
                              mov.numero
                            )}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{' '}
                            {mov.fecha
                              ? new Date(mov.fecha).toLocaleDateString('es-AR')
                              : '-'}
                          </p>
                          <p>
                            <strong>Índice:</strong> {mov.índice}
                          </p>
                          <p>
                            <strong>Saldo Parcial:</strong> ${formatter(mov.saldo_parcial)}
                          </p>
                        </div>
                        {[
                          'FA',
                          'FB',
                          'FC',
                          'FE',
                          'FD',
                          'N/C A',
                          'N/C B',
                          'N/C C',
                          'N/C E',
                        ].includes(mov.nombre_comprobante) && (
                          <div>
                            <table
                              className="table table-bordered mt-3"
                              style={{
                                width: '45%',
                                marginLeft: '0',
                                marginRight: 'auto',
                              }}
                            >
                              <thead>
                                <tr>
                                  <th style={{ width: '10%', textAlign: 'left' }}>Artículo</th>
                                  <th style={{ width: '65%', textAlign: 'left' }}>
                                    Descripción
                                  </th>
                                  <th style={{ width: '10%', textAlign: 'left' }}>Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detallesPorMovimiento[mov.codigo]?.map((detalle) => (
                                  <tr key={detalle.Numero_Movimiento}>
                                    <td style={{ textAlign: 'left' }}>
                                      {detalle.Articulo_Detalle}
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                      {detalle.Descripcion_Detalle}
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                      {detalle.Cantidad_Detalle}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </>
      )}
    </div>
  );
};

export default InformeCliente;