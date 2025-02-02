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

// Importamos la función que genera el PDF:
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

  // Guardar movimientos y detalles para poder filtrar y generar PDF
  const [movimientosCliente, setMovimientosCliente] = useState<Movimiento[]>([]);
  const [movDetallesCliente, setMovDetallesCliente] = useState<Mov_Detalle[]>([]);

  // Estados de checkboxes y fechas (para PDF)
  const [generarPDFEnabled, setGenerarPDFEnabled] = useState<boolean>(false);
  const [saldoCero, setSaldoCero] = useState<boolean>(false);
  const [desdeHasta, setDesdeHasta] = useState<boolean>(false);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

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
    setSaldoCero(false);
    setDesdeHasta(false);
    setFechaDesde('');
    setFechaHasta(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    try {
      // 1) Obtener saldo inicial y movimientos
      const saldoInicial = await fetchSaldo(cliente.Número); // Devuelve un número
      const movimientos = await fetchMovimientos(cliente.Número); // Devuelve un arreglo de movimientos

      // Guardarlos en estado
      setMovimientosCliente(movimientos);

      // 2) Obtener detalles de movimientos
      const detalles = ((await fetchMovDetalles(cliente.Número)) ?? []) as Mov_Detalle[]; // Garantizamos que sea un array
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
      // Ya se han realizado fetchMovimientos / fetchMovDetalles en handleSelectCliente
      setShowInforme(true);
    }
  };

  const handleBack = () => {
    setShowInforme(false);
  };

  /**
   * Lógica para generar PDF desde la pantalla 1
   */
  const handleGenerarPDF = () => {
    if (!selectedCliente) {
      console.error('No hay cliente seleccionado.');
      return;
    }

    console.log('Generando PDF con los filtros aplicados...');
    console.log(`Saldo Cero: ${saldoCero}, DesdeHasta: ${desdeHasta}`);

    // 1) Ordenar movimientos por fecha (ascendente) para luego recalcular saldo parcial
    const sortedMovs = [...movimientosCliente].sort(
      (a, b) => new Date(a.fecha || '').getTime() - new Date(b.fecha || '').getTime()
    );

    // 2) Calcular saldo parcial igual que en InformeCliente (agregar índice)
    let saldoAcumulado = selectedCliente.saldo ?? 0; // O el "saldoInicial" real
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
      return {
        ...mov,
        saldo_parcial: saldoAcumulado,
        índice: index + 2,
      };
    });

    // 3) Filtrar según saldoCero o desdeHasta
    let movimientosFiltrados: Movimiento[] = [];

    if (saldoCero) {
      const indexCero = movimientosConSaldoParcial.findIndex(
        (m) => Math.abs(m.saldo_parcial) < 1
      );
      if (indexCero !== -1) {
        movimientosFiltrados = movimientosConSaldoParcial.slice(indexCero);
      } else {
        movimientosFiltrados = movimientosConSaldoParcial;
      }
    } else if (desdeHasta) {
      const dDesde = fechaDesde ? new Date(fechaDesde) : null;
      const dHasta = new Date(fechaHasta);
      movimientosFiltrados = movimientosConSaldoParcial.filter((mov) => {
        if (!mov.fecha) return false;
        const fMov = new Date(mov.fecha);
        return (!dDesde || fMov >= dDesde) && fMov <= dHasta;
      });
    } else {
      movimientosFiltrados = movimientosConSaldoParcial;
    }

    const detallesPorMovimiento = movDetallesCliente.reduce((acc, detalle) => {
      const { Codigo_Movimiento } = detalle;
      if (!acc[Codigo_Movimiento]) acc[Codigo_Movimiento] = [];
      acc[Codigo_Movimiento].push(detalle);
      return acc;
    }, {} as Record<number, Mov_Detalle[]>);

    const saldoFinal =
      movimientosConSaldoParcial.length > 0
        ? movimientosConSaldoParcial[movimientosConSaldoParcial.length - 1].saldo_parcial
        : selectedCliente.saldo ?? 0;

    generarInformePDF({
      cliente: selectedCliente,
      saldoFinal,
      filtroSaldoCero: saldoCero,
      filtroDesdeHasta: desdeHasta,
      fechaDesde,
      fechaHasta,
      movimientosFiltrados,
      detallesPorMovimiento,
    });
  };

  const handleCheckboxChange = (checkbox: string) => {
    if (checkbox === 'saldoCero') {
      setSaldoCero(!saldoCero);
      setDesdeHasta(false);
    } else if (checkbox === 'desdeHasta') {
      setDesdeHasta(!desdeHasta);
      setSaldoCero(false);
    }
  };

  return (
    <div className="container mt-5 pt-5">
      {showInforme ? (
        <InformeCliente onBack={handleBack} cliente={selectedCliente} />
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
            <div className="selected-client mt-3 mb-3">
              <h5>Cliente seleccionado:</h5>
              <p>
                <strong>{formatNumeroCliente(selectedCliente.Número)}</strong> -{' '}
                {selectedCliente.Nombre} {selectedCliente.Apellido}
              </p>
              {selectedCliente.saldo !== null && selectedCliente.saldo !== undefined && (
                <p>
                  <strong>Saldo:</strong> ${selectedCliente.saldo.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <button
            className="btn btn-primary w-100 mt-3"
            onClick={handleVerMovimientos}
            disabled={!selectedCliente}
          >
            Ver Movimientos
          </button>

          {/* Sección de opciones para PDF */}
          <div className="mt-3">
            <h5>Generar Informe PDF</h5>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="saldoCero"
                checked={saldoCero}
                onChange={() => handleCheckboxChange('saldoCero')}
                disabled={!selectedCliente}
              />
              <label className="form-check-label" htmlFor="saldoCero">
                Desde Saldo Cero
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="desdeHasta"
                checked={desdeHasta}
                onChange={() => handleCheckboxChange('desdeHasta')}
                disabled={!selectedCliente}
              />
              <label className="form-check-label" htmlFor="desdeHasta">
                Desde y Hasta
              </label>
            </div>

            {desdeHasta && (
              <div className="dates-container">
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
                    placeholder="Selecciona una fecha inicial"
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
                    placeholder="Selecciona una fecha final (predeterminado: día actual + 3 días)"
                    className="form-control"
                  />
                </div>
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
        </div>
      )}
    </div>
  );
};

export default BusquedaCliente;