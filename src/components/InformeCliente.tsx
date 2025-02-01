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

  // Formateador de números
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

  // Función auxiliar para obtener el nombre del color según la cantidad de días transcurridos (para mostrar en el encabezado de cada factura)
  const getColorNameByDays = (dias: number) => {
    if (dias <= 7) return 'Verde';
    else if (dias >= 8 && dias <= 14) return 'Amarillo';
    else if (dias >= 15 && dias <= 21) return 'Naranja';
    else if (dias >= 22 && dias <= 28) return 'Rojo';
    else return 'Bordeaux';
  };

  const saldoInicial = saldo ? saldo.Monto : 0;

  // Ordenar movimientos por fecha (ascendente)
  const sortedMovimientos = [...movimientos].sort(
    (a, b) => new Date(a.fecha || '').getTime() - new Date(b.fecha || '').getTime()
  );

  let saldoAcumulado = saldoInicial;
  const movimientosConSaldoParcial = sortedMovimientos.map((mov, index) => {
    if (
      [
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
      ].includes(mov.nombre_comprobante)
    ) {
      saldoAcumulado += mov.importe_total;
    } else if (mov.nombre_comprobante.startsWith('RB')) {
      saldoAcumulado -= mov.importe_total;
    }
    return {
      ...mov,
      saldo_parcial: saldoAcumulado,
      índice: index + 2, // El índice 1 corresponde al saldo inicial
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

  // Agregar el movimiento de Saldo Inicial con índice 1
  const movimientosConSaldoInicial = [
    {
      codigo: 0, // Asegurarse de que 'codigo' sea un número
      nombre_comprobante: 'Saldo Inicial',
      importe_total: saldoInicial,
      saldo_parcial: saldoInicial,
      fecha: null, // Cambiado de '' a null
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
    if (mov.fecha) {
      const fecha = new Date(mov.fecha);
      const fechaUTC = new Date(
        fecha.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
      );
      const year = fechaUTC.getFullYear();
      const month = (fechaUTC.getMonth() + 1).toString().padStart(2, '0');
      const mesYAnio = `${year}-${month}`;
      if (!acc[mesYAnio]) acc[mesYAnio] = [];
      acc[mesYAnio].push(mov);
    }
    return acc;
  }, {} as Record<string, Movimiento[]>);

  // Función para identificar si un comprobante es Nota de Crédito
  const esNotaDeCredito = (nombreComprobante: string): boolean => {
    const comprobanteLimpio = nombreComprobante.trim().toUpperCase();
    return (
      comprobanteLimpio.includes('N/C') ||
      comprobanteLimpio.startsWith('N') ||
      comprobanteLimpio.includes('NOTA DE CRÉDITO')
    );
  };

  // Cálculo de facturas involucradas en el saldo pendiente (solo para clientes con saldo positivo)
  // Se seleccionan las facturas más recientes (según el valor del índice) hasta completar el saldo pendiente.
  // Si una factura supera el saldo restante, solo se toma la parte necesaria.
  const facturasInvolucradasMap: Record<
    number,
    { montoInvolucrado: number; porcentaje: number; diasTranscurridos: number; color: string }
  > = {};

  if (saldoFinal > 0) {
    let saldoPendiente = saldoFinal;
    // Filtrar movimientos que sean facturas (excluyendo el movimiento "Saldo Inicial")
    const facturas = movimientosConSaldoInicial.filter((mov) =>
      ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)
    );
    // Ordenar de más recientes a más antiguas utilizando el valor del índice (mayor índice = más reciente)
    const facturasDesc = facturas.sort((a, b) => b.índice - a.índice);
    for (const factura of facturasDesc) {
      if (saldoPendiente <= 0) break;
      const montoFactura = factura.importe_total;
      const montoInvolucrado = Math.min(montoFactura, saldoPendiente);
      const porcentaje = (montoInvolucrado / saldoFinal) * 100;
      let diasTranscurridos = 0;
      if (factura.fecha) {
        const fechaFactura = new Date(factura.fecha);
        const hoy = new Date();
        diasTranscurridos = Math.floor(
          (hoy.getTime() - fechaFactura.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      // Asignar color según la antigüedad de la factura
      let color = '#f0f0f0';
      if (diasTranscurridos <= 7) {
        color = '#d4edda'; // Verde
      } else if (diasTranscurridos >= 8 && diasTranscurridos <= 14) {
        color = '#fff3cd'; // Amarillo
      } else if (diasTranscurridos >= 15 && diasTranscurridos <= 21) {
        color = '#ffe5b4'; // Naranja
      } else if (diasTranscurridos >= 22 && diasTranscurridos <= 28) {
        color = '#f8d7da'; // Rojo
      } else if (diasTranscurridos >= 29) {
        color = '#800020'; // Bordeaux
      }
      facturasInvolucradasMap[factura.codigo] = {
        montoInvolucrado,
        porcentaje,
        diasTranscurridos,
        color,
      };
      saldoPendiente -= montoInvolucrado;
    }
  }

  // Agrupar las facturas involucradas por color para el encabezado de "Análisis de Saldo"
  const analysisGroups = Object.values(facturasInvolucradasMap).reduce(
    (acc, factura) => {
      const { color, montoInvolucrado, porcentaje } = factura;
      if (!acc[color]) {
        acc[color] = { totalMonto: 0, totalPercentage: 0 };
      }
      acc[color].totalMonto += montoInvolucrado;
      acc[color].totalPercentage += porcentaje;
      return acc;
    },
    {} as Record<string, { totalMonto: number; totalPercentage: number }>
  );

  // Orden de colores: de más recientes a menos recientes (Verde, Amarillo, Naranja, Rojo, Bordeaux)
  const orderColors = ['#d4edda', '#fff3cd', '#ffe5b4', '#f8d7da', '#800020'];

  // Mapeo para la columna "Estado"
  const estadoMapping: Record<string, string> = {
    '#d4edda': '0-7 Días',
    '#fff3cd': '8-14 Días',
    '#ffe5b4': '15-21 Días',
    '#f8d7da': 'Mas de 28 Días',
    '#800020': 'Pendiente Vencida',
  };

  // Función para aplicar estilos dinámicos a cada movimiento
  const aplicarEstilosDinamicos = (mov: Movimiento) => {
    if (esNotaDeCredito(mov.nombre_comprobante)) {
      return { backgroundColor: '#A9A9A9cc' }; // Estilo para notas de crédito
    }
    if (mov.nombre_comprobante.startsWith('R')) {
      return { backgroundColor: '#c8e6c9' }; // Estilo para recibos (verde claro)
    }
    if (['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)) {
      // Si el cliente tiene saldo positivo y la factura está involucrada, se asigna el color según los días
      if (saldoFinal > 0 && facturasInvolucradasMap[mov.codigo]) {
        return { backgroundColor: facturasInvolucradasMap[mov.codigo].color };
      }
      return { backgroundColor: '#f0f0f0' }; // Estilo por defecto para facturas
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

      {/* Encabezado de Análisis de Saldo: se agrupan los totales por color en formato de tabla */}
      {!isLoading && saldoFinal > 0 && Object.keys(analysisGroups).length > 0 && (
        <div
          className="analisis-saldo mb-4"
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '5px',
            background: '#f8f9fa',
          }}
        >
          <h5 className="mb-2">Análisis de Saldo:</h5>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>Color</th>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>Monto</th>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>Porcentaje</th>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orderColors
                .filter(color => analysisGroups[color])
                .map(color => {
                  const group = analysisGroups[color];
                  return (
                    <tr key={color}>
                      <td style={{ padding: '5px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: color,
                            display: 'inline-block',
                          }}
                        ></div>
                      </td>
                      <td style={{ padding: '5px', fontWeight: 'bold', color: 'black' }}>
                        $ {formatter(group.totalMonto)}
                      </td>
                      <td style={{ padding: '5px', fontWeight: 'bold', color: 'black' }}>
                        {group.totalPercentage.toFixed(1)}%
                      </td>
                      <td style={{ padding: '5px', fontWeight: 'bold', color: 'black' }}>
                        {estadoMapping[color]}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

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
                  {movimientos[0].fecha
                    ? capitalizeFirstLetter(
                        new Date(movimientos[0].fecha).toLocaleString('es-AR', {
                          timeZone: 'America/Argentina/Buenos_Aires',
                          year: 'numeric',
                          month: 'long',
                        })
                      )
                    : '-'}
                </h4>

                {movimientos.reverse().map((mov, movIndex) => {
                  const estiloInline = aplicarEstilosDinamicos(mov);

                  return (
                    <div key={`${mov.codigo}-${movIndex}`} className="mb-4" style={estiloInline}>
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
                        {/* Si la factura está involucrada en el saldo pendiente, se muestra la información adicional */}
                        {['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante) &&
                          facturasInvolucradasMap[mov.codigo] && (
                            <p className="mt-2">
                              <strong>Involucrado:</strong> $
                              {formatter(facturasInvolucradasMap[mov.codigo].montoInvolucrado)} (
                              {facturasInvolucradasMap[mov.codigo].porcentaje.toFixed(1)}%, hace{' '}
                              {facturasInvolucradasMap[mov.codigo].diasTranscurridos} días) -{' '}
                              {getColorNameByDays(facturasInvolucradasMap[mov.codigo].diasTranscurridos)}
                            </p>
                          )}

                        {[
                          'FA',
                          'FB',
                          'FC',
                          'FD',
                          'FE',
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
                                  <th style={{ width: '65%', textAlign: 'left' }}>Descripción</th>
                                  <th style={{ width: '10%', textAlign: 'left' }}>Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detallesPorMovimiento[mov.codigo]?.map((detalle, detalleIndex) => (
                                  <tr key={`${detalle.Numero_Movimiento}-${detalleIndex}`}>
                                    <td style={{ textAlign: 'left' }}>{detalle.Articulo_Detalle}</td>
                                    <td style={{ textAlign: 'left' }}>{detalle.Descripcion_Detalle}</td>
                                    <td style={{ textAlign: 'left' }}>{detalle.Cantidad_Detalle}</td>
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
          {/* Saldo inicial colocado en la base del informe */}
          <div className="mb-4">
            <h4 className="text-secondary mb-3">Saldo Inicial</h4>
            <div className="border p-3 rounded">
              <div className="justify-content-between d-flex">
                <h5>
                  Saldo Inicial{' '}
                  <span className="text-success">${formatter(saldoInicial)}</span>
                </h5>
                <p>
                  <strong>Fecha:</strong> -
                </p>
                <p>
                  <strong>Índice:</strong> 1
                </p>
                <p>
                  <strong>Saldo Parcial:</strong> ${formatter(saldoInicial)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InformeCliente;