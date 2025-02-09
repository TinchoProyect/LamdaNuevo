import { useState } from 'react';
import { useClientes } from '../context/ClientesContext';
import { useMovimientos } from '../context/MovimientoContext';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useSaldos } from '../context/SaldoContext';
import { formatNumeroCliente } from '../utils/numeroClienteMap';
import { Cliente } from '../types/cliente';
import calcularSaldoTotal from '../utils/calcularSaldoTotal';
import { Movimiento } from '../types/movimiento';
import { Mov_Detalle } from '../types/movimiento_detalle';
import InformeCliente from './InformeCliente';
import './BusquedaCliente.css';

// Importamos la función que genera el PDF
import { generarInformePDF } from '../utils/generarPDF';

const MAX_RESULTS = 10;

const BusquedaCliente = () => {
  const { clientes, isLoading } = useClientes();
  const { fetchMovDetalles } = useMovimientoDetalles();
  const { fetchMovimientos } = useMovimientos();
  const { fetchSaldo } = useSaldos();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showInforme, setShowInforme] = useState<boolean>(false);

  // Guardar movimientos y detalles para filtrar y generar PDF
  const [movimientosCliente, setMovimientosCliente] = useState<Movimiento[]>([]);
  const [movDetallesCliente, setMovDetallesCliente] = useState<Mov_Detalle[]>([]);

  // Estado para guardar el saldo inicial obtenido desde la base de datos
  const [saldoInicialDB, setSaldoInicialDB] = useState<number>(0);

  // Estados de filtros:
  // Se precargan las fechas:
  // - "fechaDesde": se inicializa con la fecha actual.
  // - "fechaHasta": se inicializa con la fecha actual + 3 días.
  const todayISO = new Date().toISOString().split('T')[0];
  const defaultFechaHasta = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [saldoCero, setSaldoCero] = useState<boolean>(false);
  const [desdeHasta, setDesdeHasta] = useState<boolean>(false);
  const [fechaDesde, setFechaDesde] = useState<string>(todayISO);
  const [fechaHasta, setFechaHasta] = useState<string>(defaultFechaHasta);

  // Estado adicional para el bloque de opciones de PDF (se mantiene separado si se requiere)
  const [mostrarGenerarPDF, setMostrarGenerarPDF] = useState<boolean>(false);
  const [generarPDFEnabled, setGenerarPDFEnabled] = useState<boolean>(false);

  // Filtrar clientes basado en el término de búsqueda
  const filteredClientes = searchTerm
    ? clientes.filter((cliente: Cliente) => {
        const numero = formatNumeroCliente(cliente.Número);
        const nombre = cliente.Nombre?.toLowerCase() || '';
        const apellido = cliente.Apellido?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();

        return (
          numero.includes(searchTerm) ||
          nombre.includes(searchLower) ||
          apellido.includes(searchLower)
        );
      })
    : [];

  const limitedClientes = filteredClientes.slice(0, MAX_RESULTS);

  const handleSelectCliente = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setSearchTerm('');
    setGenerarPDFEnabled(true);
    // Al seleccionar un cliente se reinician los filtros a los valores por defecto
    setSaldoCero(false);
    setDesdeHasta(false);
    setFechaDesde(todayISO);
    setFechaHasta(defaultFechaHasta);

    try {
      // 1) Obtener saldo inicial y movimientos
      const saldoInicial = await fetchSaldo(cliente.Número); // Devuelve un número
      setSaldoInicialDB(saldoInicial); // Guardamos el saldo inicial
      const movimientos = await fetchMovimientos(cliente.Número); // Arreglo de movimientos

      // Guardarlos en estado
      setMovimientosCliente(movimientos);

      // 2) Obtener detalles de movimientos
      const detalles = ((await fetchMovDetalles(cliente.Número)) ?? []) as Mov_Detalle[];
      setMovDetallesCliente(detalles);

      // 3) Calcular el saldo total usando la función
      const saldoTotal = calcularSaldoTotal(saldoInicial, movimientos);

      // 4) Actualizar el cliente seleccionado con el saldo calculado
      setSelectedCliente((prev) =>
        prev
          ? {
              ...prev,
              saldo: saldoTotal,
            }
          : prev
      );
    } catch (error) {
      console.error('Error al calcular el saldo del cliente:', error);
    }
  };

  const handleVerMovimientos = () => {
    if (selectedCliente) {
      // Al pasar a InformeCliente se envían también los valores de filtro seleccionados
      setShowInforme(true);
    }
  };

  const handleBack = () => {
    setShowInforme(false);
  };

  // Función para manejar el cambio en los checkboxes de filtro.
  // Se asegura que al activar una opción se desactive la otra.
  const handleCheckboxChange = (checkbox: string) => {
    if (checkbox === 'saldoCero') {
      setSaldoCero(!saldoCero);
      if (!saldoCero) setDesdeHasta(false);
    } else if (checkbox === 'desdeHasta') {
      setDesdeHasta(!desdeHasta);
      if (!desdeHasta) setSaldoCero(false);
    }
  };

  // Función para generar PDF (se mantiene la lógica previa)
  const handleGenerarPDF = () => {
    if (!selectedCliente) {
      console.error('No hay cliente seleccionado.');
      return;
    }

    console.log('Generando PDF con los filtros aplicados...');
    console.log(`Saldo Cero: ${saldoCero}, DesdeHasta: ${desdeHasta}`);

    // 1) Ordenar movimientos por fecha (ascendente)
    const sortedMovs = [...movimientosCliente].sort(
      (a, b) => new Date(a.fecha || '').getTime() - new Date(b.fecha || '').getTime()
    );

    // 2) Calcular saldo parcial empezando desde el saldoInicialDB
    let saldoAcumulado = saldoInicialDB;
    const movimientosConSaldoParcial = sortedMovs.map((mov, index) => {
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

      if (Math.abs(saldoAcumulado) < 1) {
        saldoAcumulado = 0;
      }

      return {
        ...mov,
        saldo_parcial: saldoAcumulado,
        índice: index + 2,
      };
    });

    // 3) Agregar el movimiento de Saldo Inicial con índice 1
    const movimientosConSaldoInicial = [
      {
        codigo: 0,
        nombre_comprobante: 'Saldo Inicial',
        importe_total: saldoInicialDB,
        saldo_parcial: saldoInicialDB,
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
      },
      ...movimientosConSaldoParcial,
    ];

    // 4) Aplicar filtros (si se seleccionó alguno)
    let movimientosFiltrados: Movimiento[] = movimientosConSaldoInicial;

    if (saldoCero) {
      // Filtrar desde el último saldo cero (excluyendo el Saldo Inicial)
      let indexCero = -1;
      for (let i = movimientosFiltrados.length - 1; i >= 0; i--) {
        if (
          Math.abs(movimientosFiltrados[i].saldo_parcial) < 1 &&
          movimientosFiltrados[i].codigo !== 0
        ) {
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
    }

    // 5) Revertir el orden para que el movimiento con índice 1 quede al final
    const movimientosFiltradosReversed = movimientosFiltrados.slice().reverse();

    const detallesPorMovimiento = movDetallesCliente.reduce((acc, detalle) => {
      const { Codigo_Movimiento } = detalle;
      if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
      acc[Codigo_Movimiento].push(detalle);
      return acc;
    }, {} as Record<number, Mov_Detalle[]>);

    const saldoFinalComputed =
      movimientosConSaldoInicial.length > 0
        ? movimientosConSaldoInicial[movimientosConSaldoInicial.length - 1].saldo_parcial
        : selectedCliente.saldo ?? 0;

    // Lógica de análisis de saldo para el PDF (se mantiene la misma)
    let facturasInvolucradasMap: Record<
      number,
      { montoInvolucrado: number; porcentaje: number; diasTranscurridos: number; color: string }
    > = {};
    if (saldoFinalComputed > 0) {
      let saldoPendiente = saldoFinalComputed;
      const facturas = movimientosConSaldoInicial.filter((mov) =>
        ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)
      );
      const facturasDesc = facturas.sort((a, b) => b.índice - a.índice);
      for (const factura of facturasDesc) {
        if (saldoPendiente <= 0) break;
        const montoFactura = factura.importe_total;
        const montoInvolucrado = Math.min(montoFactura, saldoPendiente);
        const porcentaje = (montoInvolucrado / saldoFinalComputed) * 100;
        let diasTranscurridos = 0;
        if (factura.fecha) {
          const fechaFactura = new Date(factura.fecha);
          const hoy = new Date();
          diasTranscurridos = Math.floor((hoy.getTime() - fechaFactura.getTime()) / (1000 * 60 * 60 * 24));
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
        } else if (diasTranscurridos >= 29) {
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

    const orderColors = ['#d4edda', '#fff3cd', '#ffe5b4', '#f8d7da', '#800020'];
    const estadoMapping: Record<string, string> = {
      '#d4edda': '0-7 Días',
      '#fff3cd': '8-14 Días',
      '#ffe5b4': '15-21 Días',
      '#f8d7da': 'Mas de 28 Días',
      '#800020': 'Pendiente Vencida',
    };

    // Establecer nombre predeterminado para el archivo PDF
    const fechaActual = new Date();
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const anio = fechaActual.getFullYear();
    const fechaActualFormatted = `${dia}-${mes}-${anio}`;
    const nombreArchivo = `${selectedCliente?.Número}_${selectedCliente?.Nombre}_Resumen de Cuenta_${fechaActualFormatted}.pdf`;

    generarInformePDF({
      nombreArchivo,
      cliente: selectedCliente,
      saldoFinal: saldoFinalComputed,
      filtroSaldoCero: saldoCero,
      filtroDesdeHasta: desdeHasta,
      fechaDesde,
      fechaHasta,
      movimientosFiltrados: movimientosFiltradosReversed,
      detallesPorMovimiento,
      analysisGroups,
      orderColors,
      estadoMapping,
    });
  };

  return (
    <div className="container mt-5 pt-5">
      {showInforme ? (
        // Se pasan los valores de filtro seleccionados a InformeCliente mediante props
        <InformeCliente
          onBack={handleBack}
          cliente={selectedCliente}
          initialFiltroSaldoCero={saldoCero}
          initialFiltroDesdeHasta={desdeHasta}
          initialFechaDesde={fechaDesde}
          initialFechaHasta={fechaHasta}
        />
      ) : (
        <div className="search-container">
          <h2 className="text-center mb-4">Buscar Clientes</h2>

          <div className="search-wrapper">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Buscar por número, nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && !isLoading && (
              <div className="clientes-list-container">
                {limitedClientes.length > 0 ? (
                  <ul className="list-group">
                    {limitedClientes.map((cliente: Cliente) => (
                      <li
                        key={cliente.Número}
                        className={`list-group-item list-group-item-action ${
                          selectedCliente?.Número === cliente.Número ? 'active' : ''
                        }`}
                        onClick={() => handleSelectCliente(cliente)}
                      >
                        <strong>{formatNumeroCliente(cliente.Número)}</strong> -{' '}
                        {cliente.Nombre} {cliente.Apellido}
                      </li>
                    ))}
                    {filteredClientes.length > MAX_RESULTS && (
                      <li className="list-group-item text-muted text-center">
                        Hay más resultados, refine su búsqueda.
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-center no-results">No se encontraron clientes</p>
                )}
              </div>
            )}
          </div>

          {selectedCliente && (
            <>
              <div className="selected-client mt-3 mb-3">
                <h5>Cliente seleccionado:</h5>
                <p>
                  <strong>{formatNumeroCliente(selectedCliente.Número)}</strong> -{' '}
                  {selectedCliente.Nombre} {selectedCliente.Apellido}
                </p>
                {selectedCliente.saldo !== null && selectedCliente.saldo !== undefined && (
                  <p>
                    <strong>Saldo:</strong> $
                    {Intl.NumberFormat('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(selectedCliente.saldo)}
                  </p>
                )}
              </div>

              {/* Bloque de filtros siempre visibles cuando hay cliente seleccionado */}
              <div className="filter-options mt-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="saldoCero"
                    checked={saldoCero}
                    onChange={() => handleCheckboxChange('saldoCero')}
                  />
                  <label className="form-check-label" htmlFor="saldoCero">
                    Desde saldo cero
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="desdeHasta"
                    checked={desdeHasta}
                    onChange={() => handleCheckboxChange('desdeHasta')}
                  />
                  <label className="form-check-label" htmlFor="desdeHasta">
                    Desde y hasta
                  </label>
                </div>
                {desdeHasta && (
                  <div className="dates-container mt-2">
                    <div className="date-field">
                      <label htmlFor="fechaDesde">Desde:</label>
                      <input
                        type="date"
                        id="fechaDesde"
                        value={fechaDesde}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const hastaDate = new Date(fechaHasta);
                          if (selectedDate > hastaDate) {
                            alert("La fecha 'Desde' debe ser igual o anterior a 'Hasta'.");
                            return;
                          }
                          setFechaDesde(e.target.value);
                        }}
                        max={fechaHasta}
                        className="form-control"
                      />
                    </div>
                    <div className="date-field">
                      <label htmlFor="fechaHasta">Hasta:</label>
                      <input
                        type="date"
                        id="fechaHasta"
                        value={fechaHasta}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const desdeDate = new Date(fechaDesde);
                          if (fechaDesde && selectedDate < desdeDate) {
                            alert("La fecha 'Hasta' debe ser igual o posterior a 'Desde'.");
                            return;
                          }
                          setFechaHasta(e.target.value);
                        }}
                        min={fechaDesde || undefined}
                        className="form-control"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            className="btn btn-primary w-100 mt-3"
            onClick={handleVerMovimientos}
            disabled={!selectedCliente}
          >
            Ver Movimientos
          </button>

          {/* Sección de opciones para PDF (se mantiene, pero los filtros ya se ven arriba) */}
          <button
            className="btn btn-success w-100 mt-3"
            onClick={() => setMostrarGenerarPDF(!mostrarGenerarPDF)}
          >
            {mostrarGenerarPDF ? 'Ocultar opciones' : 'Generar Informe PDF'}
          </button>

          {mostrarGenerarPDF && (
            <div className="mt-3">
              <h5>Generar Informe PDF</h5>
              {/* Aquí se repiten los checkboxes y opciones para PDF, pero estos usarán los mismos valores de filtro */}
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="saldoCeroPDF"
                  checked={saldoCero}
                  onChange={() => handleCheckboxChange('saldoCero')}
                  disabled={!selectedCliente}
                />
                <label className="form-check-label" htmlFor="saldoCeroPDF">
                  Desde saldo cero
                </label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="desdeHastaPDF"
                  checked={desdeHasta}
                  onChange={() => handleCheckboxChange('desdeHasta')}
                  disabled={!selectedCliente}
                />
                <label className="form-check-label" htmlFor="desdeHastaPDF">
                  Desde y hasta
                </label>
              </div>

              {desdeHasta && (
                <div className="dates-container">
                  <div className="date-field">
                    <label htmlFor="fechaDesdePDF">Desde:</label>
                    <input
                      type="date"
                      id="fechaDesdePDF"
                      value={fechaDesde}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const hastaDate = new Date(fechaHasta);
                        if (selectedDate > hastaDate) {
                          alert("La fecha 'Desde' debe ser igual o anterior a 'Hasta'.");
                          return;
                        }
                        setFechaDesde(e.target.value);
                      }}
                      max={fechaHasta}
                      className="form-control"
                    />
                  </div>
                  <div className="date-field">
                    <label htmlFor="fechaHastaPDF">Hasta:</label>
                    <input
                      type="date"
                      id="fechaHastaPDF"
                      value={fechaHasta}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const desdeDate = new Date(fechaDesde);
                        if (fechaDesde && selectedDate < desdeDate) {
                          alert("La fecha 'Hasta' debe ser igual o posterior a 'Desde'.");
                          return;
                        }
                        setFechaHasta(e.target.value);
                      }}
                      min={fechaDesde || undefined}
                      className="form-control"
                    />
                  </div>
                </div>
              )}
              <button
                className="btn btn-success w-45 mt-3"
                onClick={handleGenerarPDF}
                disabled={!generarPDFEnabled}
              >
                Generar PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BusquedaCliente;