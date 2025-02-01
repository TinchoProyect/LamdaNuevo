import { useState } from 'react';
import { useClientes } from '../context/ClientesContext';
import { useMovimientos } from '../context/MovimientoContext';
import { useMovimientoDetalles } from '../context/MovimientoDetalleContext';
import { useSaldos } from '../context/SaldoContext';
import { formatNumeroCliente } from '../utils/numeroClienteMap';
import { Cliente } from '../types/cliente';
import calcularSaldoTotal from '../utils/calcularSaldoTotal';
import InformeCliente from './InformeCliente';
import './BusquedaCliente.css';

const MAX_RESULTS = 10;

const BusquedaCliente = () => {
  const { clientes, isLoading } = useClientes();
  const { fetchMovDetalles } = useMovimientoDetalles();
  const { fetchMovimientos } = useMovimientos();
  const { fetchSaldo } = useSaldos();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showInforme, setShowInforme] = useState<boolean>(false);
  
  // Nuevos estados para el botón y checkboxes
  const [generarPDFEnabled, setGenerarPDFEnabled] = useState<boolean>(false);
  const [saldoCero, setSaldoCero] = useState<boolean>(false);
  const [desdeHasta, setDesdeHasta] = useState<boolean>(false);

  // Ajuste de la lógica de fechas
  // Valor por defecto para "Hasta" => hoy + 3 días
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
    setSearchTerm(''); // Limpiar el campo de búsqueda al seleccionar
    setGenerarPDFEnabled(true); // Habilitar el botón de generar PDF
    setSaldoCero(false); // Resetear checkboxes
    setDesdeHasta(false);
    setFechaDesde(''); // Resetear fechas
    setFechaHasta(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    try {
      // Resolver las promesas para obtener saldo inicial y movimientos
      const saldoInicial = await fetchSaldo(cliente.Número); // Devuelve un número
      const movimientos = await fetchMovimientos(cliente.Número); // Devuelve un arreglo de movimientos

      // Calcular el saldo total usando la función reutilizable
      const saldoTotal = calcularSaldoTotal(saldoInicial, movimientos);

      // Actualizar el cliente seleccionado con el saldo calculado
      setSelectedCliente((prev) =>
        prev
          ? {
              ...prev,
              saldo: saldoTotal, // Asignar saldo resuelto (número)
            }
          : prev
      );
    } catch (error) {
      console.error('Error al calcular el saldo del cliente:', error);
    }
  };

  const handleVerMovimientos = () => {
    if (selectedCliente) {
      fetchMovDetalles(selectedCliente.Número);
      fetchMovimientos(selectedCliente.Número);
      fetchSaldo(selectedCliente.Número);
      setShowInforme(true);
    }
  };

  const handleBack = () => {
    setShowInforme(false);
  };

  const handleGenerarPDF = () => {
    // Aquí se llamaría a la función para generar el PDF
    console.log("Generando PDF con los filtros aplicados...");
  };

  const handleCheckboxChange = (checkbox: string) => {
    if (checkbox === 'saldoCero') {
      if (saldoCero) {
        setSaldoCero(false);
      } else {
        setSaldoCero(true);
        setDesdeHasta(false);
      }
    } else {
      if (desdeHasta) {
        setDesdeHasta(false);
      } else {
        setDesdeHasta(true);
        setSaldoCero(false);
      }
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
                        <strong>{formatNumeroCliente(cliente.Número)}</strong> - {cliente.Nombre}{' '}
                        {cliente.Apellido}
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
                <strong>{formatNumeroCliente(selectedCliente.Número)}</strong> - {selectedCliente.Nombre}{' '}
                {selectedCliente.Apellido}
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
              <label className="form-check-label" htmlFor="saldoCero">Desde Saldo Cero</label>
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
              <label className="form-check-label" htmlFor="desdeHasta">Desde y Hasta</label>
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
                    // El máximo para "Desde" es la fecha en "Hasta", para evitar que "Desde" sea posterior
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

                      // Si "Desde" no está vacío, validamos que "Hasta" sea >= "Desde"
                      if (fechaDesde && selectedDate < desdeDate) {
                        alert("La fecha 'Hasta' debe ser igual o posterior a 'Desde'.");
                        return;
                      }
                      setFechaHasta(e.target.value);
                    }}
                    // El mínimo para "Hasta" es la fecha en "Desde"
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