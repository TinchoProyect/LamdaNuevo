import React, { useState } from 'react';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useMovimientos } from '../context/MovimientoContext';
import { useSaldos } from '../context/SaldoContext';
import { Mov_Detalle } from '../types/movimiento_detalle';
import { comprobanteMap } from '../utils/comprobanteMap';
import { formatNumeroFactura } from '../utils/numeroFacturaMap';
import { Cliente } from '../types/cliente';
import './InformeCliente.css';
import { Movimiento } from '../types/movimiento';
import { generarInformePDF } from '../utils/generarPDF';

// Se extienden las props para incluir los valores iniciales de filtro
type InformeClienteProps = {
  onBack: () => void;
  cliente: Cliente | null;
  initialFiltroSaldoCero?: boolean;
  initialFiltroDesdeHasta?: boolean;
  initialFiltroFacturasInvolucradas?: boolean;
  initialFechaDesde?: string;
  initialFechaHasta?: string;
  // MOD: Nuevas props para recibir datos específicos del cliente seleccionado
  movimientosProp?: Movimiento[];
  movDetallesProp?: Mov_Detalle[];
  saldoInicialProp?: number;
};

const InformeCliente = ({
  onBack,
  cliente,
  initialFiltroSaldoCero,
  initialFiltroDesdeHasta,
  initialFiltroFacturasInvolucradas,
  initialFechaDesde,
  initialFechaHasta,
  movimientosProp,    // MOD:
  movDetallesProp,    // MOD:
  saldoInicialProp,   // MOD:
}: InformeClienteProps) => {
   // MOD: Si se reciben los datos por props, se usan; de lo contrario se obtienen del contexto.
   const { movDetalles: movDetallesCtx, isLoadingMovDetalles } = useMovimientoDetalles();
   const { movimientos: movimientosCtx, isLoadingMov } = useMovimientos();
   const { saldo, isLoadingSaldo } = useSaldos();
 
   const movimientosData: Movimiento[] =
    movimientosProp !== undefined ? movimientosProp : movimientosCtx;
  const movDetallesData: Mov_Detalle[] =
    (movDetallesProp !== undefined && movDetallesProp.length > 0)
      ? movDetallesProp
      : movDetallesCtx; // MOD: Se agregó la comprobación de longitud para evitar sobreescribir datos del contexto con arreglo vacío.
   const isLoading = isLoadingMovDetalles || isLoadingMov || isLoadingSaldo;

  // Función para normalizar valores cercanos a 0
  const normalize = (value: number): number => {
    return Math.abs(value) < 0.99 ? 0 : value;
  };

  // Función auxiliar para formatear fecha en DD-MM-YYYY
  const formatFecha = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Se inicializan los estados de filtro con los valores recibidos (o por defecto)
  const [saldoCero, setSaldoCero] = useState<boolean>(initialFiltroSaldoCero || false);
  const [desdeHasta, setDesdeHasta] = useState<boolean>(initialFiltroDesdeHasta || false);
  const [facturasInvolucradas, setFacturasInvolucradas] = useState<boolean>(initialFiltroFacturasInvolucradas || false);
  const [fechaDesde, setFechaDesde] = useState<string>(initialFechaDesde || '');
  const [fechaHasta, setFechaHasta] = useState<string>(
    initialFechaHasta ||
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
  );

  const generarPDFEnabled = true;

  // Menú desplegable para PDF
  const [showPDFOptions, setShowPDFOptions] = useState<boolean>(false);
  const togglePDFOptions = () => {
    setShowPDFOptions(!showPDFOptions);
  };

  const handleCheckboxChange = (checkbox: string) => {
    if (checkbox === 'saldoCero') {
      setSaldoCero(!saldoCero);
      setDesdeHasta(false);
      setFacturasInvolucradas(false);
    } else if (checkbox === 'desdeHasta') {
      setDesdeHasta(!desdeHasta);
      setSaldoCero(false);
      setFacturasInvolucradas(false);
    } else if (checkbox === 'facturasInvolucradas') {
      setFacturasInvolucradas(!facturasInvolucradas);
      setSaldoCero(false);
      setDesdeHasta(false);
    }
  };

  const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFechaDesde = e.target.value;
    const dateDesde = new Date(nuevaFechaDesde);
    const dateHasta = new Date(fechaHasta);

    if (dateDesde > dateHasta) {
      alert("La fecha 'Desde' debe ser igual o anterior a 'Hasta'.");
      return;
    }
    setFechaDesde(nuevaFechaDesde);
  };

  const handleFechaHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFechaHasta = e.target.value;
    const dateHasta = new Date(nuevaFechaHasta);
    const dateDesde = new Date(fechaDesde);

    if (fechaDesde && dateHasta < dateDesde) {
      alert("La fecha 'Hasta' debe ser igual o posterior a 'Desde'.");
      return;
    }
    setFechaHasta(nuevaFechaHasta);
  };

  const formatter = (value: number) => {
    if (Math.abs(value) < 0.99) return '0.00';
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Se obtiene la fecha actual para la cabecera
  const fechaActual = new Date().toLocaleDateString('es-AR');

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Se obtiene el saldo inicial normalizado
  //const saldoInicial = saldo ? normalize(saldo.Monto) : 0;

   // MOD: Si se recibió saldoInicialProp, se usa; sino, se extrae de saldo (del contexto) si existe.
   const saldoInicial = saldoInicialProp !== undefined
   ? normalize(saldoInicialProp)
   : (saldo ? normalize(saldo.Monto) : 0);

 // MOD: Usamos los movimientos recibidos por props (movimientosData) en lugar de los del contexto.
 const sortedMovimientos = [...movimientosData].sort(
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
    saldoAcumulado = normalize(saldoAcumulado);
    return {
      ...mov,
      saldo_parcial: saldoAcumulado,
      índice: index + 2,
    } as Movimiento;
  });

  // Agregar el movimiento de Saldo Inicial con índice 1
  const movimientosConSaldoInicial = [
    {
      codigo: 0,
      nombre_comprobante: 'Saldo Inicial',
      importe_total: saldoInicial,
      saldo_parcial: saldoInicial,
      fecha: null,
      numero: 0,
      índice: 1,
      efectivo: null,
      cod_cli_prov: 0,
      tipo_comprobante: 0,
      importe_neto: 0,
      fecha_vto: '',
      fecha_comprobante: '',
      comentario: '',
      estado: 0,
    } as Movimiento,
    ...movimientosConSaldoParcial,
  ];

  // ***** Aplicar filtros a los movimientos para mostrarlos en pantalla y para PDF *****
  let movimientosFiltrados: Movimiento[] = movimientosConSaldoInicial;

  if (saldoCero) {
    // Buscar el último movimiento con saldo cercano a 0 (excluyendo el Saldo Inicial)
    let indexCero = -1;
    for (let i = movimientosFiltrados.length - 1; i >= 0; i--) {
      if (Math.abs(movimientosFiltrados[i].saldo_parcial) < 1 && movimientosFiltrados[i].codigo !== 0) {
        indexCero = i;
        break;
      }
    }
    if (indexCero !== -1) {
      movimientosFiltrados = movimientosFiltrados.slice(indexCero);
    }
  } else if (desdeHasta) {
    const dDesde = fechaDesde ? new Date(fechaDesde) : null;
    const dHasta = new Date(fechaHasta);
    movimientosFiltrados = movimientosFiltrados.filter((mov) => {
      if (!mov.fecha) return false;
      const fMov = new Date(mov.fecha);
      return (!dDesde || fMov >= dDesde) && fMov <= dHasta;
    });
  } else if (facturasInvolucradas) {
    // Filtro: Facturas involucradas
    const saldoFinalComputed = movimientosConSaldoInicial[movimientosConSaldoInicial.length - 1].saldo_parcial;
    if (saldoFinalComputed > 0) {
      let saldoPendiente = saldoFinalComputed;
      const facturas = movimientosConSaldoInicial.filter((mov) =>
        ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)
      );
      const facturasDesc = facturas.sort((a, b) => b.índice - a.índice);
      let minIndexInvolucrada = Infinity;
      for (const factura of facturasDesc) {
        if (saldoPendiente <= 0) break;
        const montoFactura = factura.importe_total;
        const montoInvolucrado = Math.min(montoFactura, saldoPendiente);
        if (Math.abs(montoInvolucrado) < 0.99) continue;
        if (factura.índice < minIndexInvolucrada) {
          minIndexInvolucrada = factura.índice;
        }
        saldoPendiente -= montoInvolucrado;
      }
      if (minIndexInvolucrada !== Infinity) {
        movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.índice >= minIndexInvolucrada);
      }
    }
  }

  // Eliminar el movimiento de Saldo Inicial si se aplicó alguno de los filtros
  if (saldoCero || desdeHasta || facturasInvolucradas) {
    movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.codigo !== 0);
  }

  // Se recalcula el saldo final a partir de los movimientos filtrados
  const saldoFinal =
    movimientosFiltrados.length > 0
      ? movimientosFiltrados[movimientosFiltrados.length - 1].saldo_parcial
      : saldoInicial;

  const detallesPorMovimiento = movDetallesData.reduce((acc, detalle) => {
    const { Codigo_Movimiento } = detalle;
    if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
    acc[Codigo_Movimiento].push(detalle);
    return acc;
  }, {} as Record<number, Mov_Detalle[]>);

  // Agrupar movimientos filtrados por mes
  const movimientosPorMes = movimientosFiltrados.reduce((acc, mov) => {
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

  const esNotaDeCredito = (nombreComprobante: string): boolean => {
    const c = nombreComprobante.trim().toUpperCase();
    return c.includes('N/C') || c.startsWith('N') || c.includes('NOTA DE CRÉDITO');
  };

  const facturasInvolucradasMap: Record<
    number,
    { montoInvolucrado: number; porcentaje: number; diasTranscurridos: number; color: string }
  > = {};

  if (saldoFinal > 0) {
    let saldoPendiente = saldoFinal;
    const facturas = movimientosConSaldoInicial.filter((mov) =>
      ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)
    );
    const facturasDesc = facturas.sort((a, b) => b.índice - a.índice);
    for (const factura of facturasDesc) {
      if (saldoPendiente <= 0) break;
      const montoFactura = factura.importe_total;
      const montoInvolucrado = Math.min(montoFactura, saldoPendiente);
      if (Math.abs(montoInvolucrado) < 0.99) continue;
      const porcentaje = (montoInvolucrado / saldoFinal) * 100;
      let diasTranscurridos = 0;
      if (factura.fecha) {
        const fechaFactura = new Date(factura.fecha);
        const hoy = new Date();
        diasTranscurridos = Math.floor(
          (hoy.getTime() - fechaFactura.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      let color = '#f0f0f0';
        if (diasTranscurridos <= 7) {
          color = '#d4edda';
        } else if (diasTranscurridos >= 8 && diasTranscurridos <= 14) {
          color = '#fff3cd';
        } else if (diasTranscurridos >= 15 && diasTranscurridos <= 21) {
          color = '#ffe5b4';
        } else if (diasTranscurridos >= 22 && diasTranscurridos <= 28) {
          color = '#f8d7da';
        } else if (diasTranscurridos >= 29 && diasTranscurridos <=90) {
          color = '#f1948a';
        }else if (diasTranscurridos >= 91) {
          color = '#800020';
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

  const orderColors = ['#d4edda', '#fff3cd', '#ffe5b4', '#f8d7da','#f1948a' ,'#800020'];
  const estadoMapping: Record<string, string> = {
    '#d4edda': '0-7 Días',
    '#fff3cd': '8-14 Días',
    '#ffe5b4': '15-21 Días',
    '#f8d7da': '22-28 Días',
    '#f1948a': 'Mas de 28 Días',
    '#800020': 'Pendiente Vencida',
  };

  /**
   * Generar PDF utilizando los movimientos filtrados
   */
  const handleGenerarPDF = () => {
    if (!cliente) return;

    // Se hace una copia de los movimientos filtrados
    let arrayConSaldo = [...movimientosFiltrados];

    // En caso de que se hayan modificado los filtros desde el menú, se aplican nuevamente
    if (saldoCero) {
      let indexCero = -1;
      for (let i = arrayConSaldo.length - 1; i >= 0; i--) {
        if (Math.abs(arrayConSaldo[i].saldo_parcial) < 0.99 && arrayConSaldo[i].codigo !== 0) {
          indexCero = i;
          break;
        }
      }
      if (indexCero !== -1) {
        arrayConSaldo = arrayConSaldo.slice(indexCero);
      }
    }

    if (desdeHasta) {
      const dDesde = fechaDesde ? new Date(fechaDesde) : null;
      const dHasta = new Date(fechaHasta);
      arrayConSaldo = arrayConSaldo.filter((mov) => {
        if (!mov.fecha) return false;
        const fMov = new Date(mov.fecha);
        if (dDesde && fMov < dDesde) return false;
        if (fMov > dHasta) return false;
        return true;
      });
    }

    if (facturasInvolucradas) {
      const saldoFinalComputed = movimientosConSaldoInicial[movimientosConSaldoInicial.length - 1].saldo_parcial;
      if (saldoFinalComputed > 0) {
        let saldoPendiente = saldoFinalComputed;
        const facturas = movimientosConSaldoInicial.filter((mov) =>
          ['FA','FB','FC','FD','FE'].includes(mov.nombre_comprobante)
        );
        const facturasDesc = facturas.sort((a, b) => b.índice - a.índice);
        let minIndexInvolucrada = Infinity;
        for (const factura of facturasDesc) {
          if (saldoPendiente <= 0) break;
          const montoFactura = factura.importe_total;
          const montoInvolucrado = Math.min(montoFactura, saldoPendiente);
          if (Math.abs(montoInvolucrado) < 0.99) continue;
          if (factura.índice < minIndexInvolucrada) {
            minIndexInvolucrada = factura.índice;
          }
          saldoPendiente -= montoInvolucrado;
        }
        if (minIndexInvolucrada !== Infinity) {
          arrayConSaldo = arrayConSaldo.filter((mov) => mov.índice >= minIndexInvolucrada);
        }
      }
    }

    // Revertir el orden para que el movimiento con índice 1 quede al final
    const movimientosFiltradosReversed = arrayConSaldo.slice().reverse();

    // Formatear la fecha actual en DD-MM-YYYY para el nombre del archivo
    const fechaActualFormatted = formatFecha(new Date());
    const nombreArchivo = `${cliente?.Número}_${cliente?.Nombre}_Resumen de Cuenta_${fechaActualFormatted}.pdf`;
    
    generarInformePDF({
      nombreArchivo, // Nombre de archivo personalizado
      cliente,
      saldoFinal,
      filtroSaldoCero: saldoCero,
      filtroDesdeHasta: desdeHasta,
      filtroFacturasInvolucradas: facturasInvolucradas,
      fechaDesde,
      fechaHasta,
      movimientosFiltrados: movimientosFiltradosReversed,
      detallesPorMovimiento,
      analysisGroups,
      orderColors,
      estadoMapping,
    });
  };

  /**
   * Función para imprimir usando la función nativa del navegador.
   * Se cambia temporalmente el document.title para sugerir un nombre dinámico.
   */
  const handleImprimir = () => {
    if (!cliente) return;
    const fechaActualFormatted = formatFecha(new Date());
    const nombreDinamico = `${cliente?.Número}_${cliente?.Nombre}_Resumen de Cuenta_${fechaActualFormatted}`;
    const tituloOriginal = document.title;
    document.title = nombreDinamico;
    window.print();
    setTimeout(() => {
      document.title = tituloOriginal;
    }, 1000);
  };

  return (
    <div className="container m-0 p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
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

        {/* Botones para opciones de PDF e impresión nativa */}
        <div style={{ position: 'relative' }} className="no-print">
          <button className="btn btn-primary" onClick={togglePDFOptions}>
            Generar Informe PDF
          </button>

          {showPDFOptions && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: '280px',
                marginTop: '0.5rem',
                padding: '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fff',
                zIndex: 999,
              }}
            >
              <div className="form-check mb-1">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="saldoCero"
                  checked={saldoCero}
                  onChange={() => handleCheckboxChange('saldoCero')}
                />
                <label className="form-check-label" htmlFor="saldoCero">
                  Desde Saldo Cero
                </label>
              </div>
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="desdeHasta"
                  checked={desdeHasta}
                  onChange={() => handleCheckboxChange('desdeHasta')}
                />
                <label className="form-check-label" htmlFor="desdeHasta">
                  Desde y Hasta
                </label>
              </div>
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="facturasInvolucradas"
                  checked={facturasInvolucradas}
                  onChange={() => handleCheckboxChange('facturasInvolucradas')}
                />
                <label className="form-check-label" htmlFor="facturasInvolucradas">
                  Facturas involucradas
                </label>
              </div>

              {desdeHasta && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label htmlFor="fechaDesde">Desde:</label>
                  <input
                    type="date"
                    id="fechaDesde"
                    value={fechaDesde}
                    onChange={handleFechaDesdeChange}
                    max={fechaHasta}
                    className="form-control mb-2"
                  />
                  <label htmlFor="fechaHasta">Hasta:</label>
                  <input
                    type="date"
                    id="fechaHasta"
                    value={fechaHasta}
                    onChange={handleFechaHastaChange}
                    min={fechaDesde || undefined}
                    className="form-control"
                  />
                </div>
              )}

              <button
                className="btn btn-success w-100 mt-3"
                onClick={handleGenerarPDF}
                disabled={!generarPDFEnabled}
              >
                Generar PDF
              </button>
            </div>
          )}

          {/* Botón para imprimir usando la función nativa del navegador */}
          <div style={{ marginTop: '10px' }}>
            <button className="btn btn-info w-100" onClick={handleImprimir}>
              Imprimir (Nativo)
            </button>
          </div>
        </div>
      </div>

      <button className="btn btn-secondary mb-4 no-print" onClick={onBack}>
        Volver
      </button>

      {/* Tabla de análisis de saldo */}
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
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>
                  Color
                </th>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>
                  Monto
                </th>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>
                  Porcentaje
                </th>
                <th style={{ textAlign: 'left', padding: '5px', borderBottom: '1px solid #ccc' }}>
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {orderColors
                .filter((color) => analysisGroups[color])
                .map((color) => {
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
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Mostrar movimientos filtrados por mes */}
          {Object.entries(movimientosPorMes)
            .reverse()
            .map(([mesYAnio, movs]) => (
              <div key={mesYAnio} className="mb-4">
                <h4 className="text-secondary mb-3">
                  {movs[0].fecha
                    ? capitalizeFirstLetter(
                        new Date(movs[0].fecha).toLocaleString('es-AR', {
                          timeZone: 'America/Argentina/Buenos_Aires',
                          year: 'numeric',
                          month: 'long',
                        })
                      )
                    : '-'}
                </h4>

                {movs.reverse().map((mov, movIndex) => {
                  const estiloInline = (() => {
                    if (esNotaDeCredito(mov.nombre_comprobante)) {
                      return { backgroundColor: '#A9A9A9cc' };
                    }
                    if (mov.nombre_comprobante.startsWith('R')) {
                      return { backgroundColor: '#c8e6c9' };
                    }
                    if (['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)) {
                      return { backgroundColor: '#f0f0f0' };
                    }
                    return {};
                  })();

                  const esFacturaConSaldoPositivo =
                    ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante) &&
                    facturasInvolucradasMap[mov.codigo];

                  return (
                    <div key={`${mov.codigo}-${movIndex}`} className="mb-4" style={estiloInline}>
                      {esFacturaConSaldoPositivo ? (
                        <div style={{ display: 'flex', alignItems: 'stretch' }}>
                          {/* Indicador visual a la izquierda */}
                          <div
                            style={{
                              width: '10px',
                              backgroundColor: facturasInvolucradasMap[mov.codigo].color,
                              marginRight: '10px',
                            }}
                          ></div>
                          <div className="border p-3 rounded" style={{ flex: 1 }}>
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

                            {['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante) &&
                              facturasInvolucradasMap[mov.codigo] && (
                                <p className="mt-2">
                                  <strong>Involucrado:</strong> $
                                  {formatter(facturasInvolucradasMap[mov.codigo].montoInvolucrado)} (
                                  {facturasInvolucradasMap[mov.codigo].porcentaje.toFixed(1)}%, hace{' '}
                                  {facturasInvolucradasMap[mov.codigo].diasTranscurridos} días)
                                </p>
                              )}

                            {['FA', 'FB', 'FC', 'FD', 'FE', 'N/C A', 'N/C B', 'N/C C', 'N/C E'].includes(
                              mov.nombre_comprobante
                            ) && (
                              <div>
                                <table
                                  className="table table-bordered mt-3"
                                  style={{ width: '45%', marginLeft: '0', marginRight: 'auto' }}
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
                      ) : (
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
                              {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-AR') : '-'}
                            </p>
                            <p>
                              <strong>Índice:</strong> {mov.índice}
                            </p>
                            <p>
                              <strong>Saldo Parcial:</strong> ${formatter(mov.saldo_parcial)}
                            </p>
                          </div>

                          {['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante) &&
                            facturasInvolucradasMap[mov.codigo] && (
                              <p className="mt-2">
                                <strong>Involucrado:</strong> $
                                {formatter(facturasInvolucradasMap[mov.codigo].montoInvolucrado)} (
                                {facturasInvolucradasMap[mov.codigo].porcentaje.toFixed(1)}%, hace{' '}
                                {facturasInvolucradasMap[mov.codigo].diasTranscurridos} días)
                              </p>
                            )}

                          {['FA', 'FB', 'FC', 'FD', 'FE', 'N/C A', 'N/C B', 'N/C C', 'N/C E'].includes(
                            mov.nombre_comprobante
                          ) && (
                            <div>
                              <table
                                className="table table-bordered mt-3"
                                style={{ width: '45%', marginLeft: '0', marginRight: 'auto' }}
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
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          {/* Mostrar Saldo Inicial al final solo si no se aplicó ningún filtro */}
          {!(saldoCero || desdeHasta || facturasInvolucradas) && (
            <div className="mb-4">
              <h4 className="text-secondary mb-3">Saldo Inicial</h4>
              <div className="border p-3 rounded">
                <div className="justify-content-between d-flex">
                  <h5>
                    Saldo Inicial <span className="text-success">${formatter(saldoInicial)}</span>
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
          )}
        </>
      )}

      {/* Opciones para PDF en pantalla */}
      <div className="mb-4 no-print">
        <button className="btn btn-secondary" onClick={handleGenerarPDF}>
          Generar PDF
        </button>
      </div>
    </div>
  );
};

export default InformeCliente;