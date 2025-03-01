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
  const [facturasInvolucradas, setFacturasInvolucradas] = useState<boolean>(false);
  const [fechaDesde, setFechaDesde] = useState<string>(todayISO);
  const [fechaHasta, setFechaHasta] = useState<string>(defaultFechaHasta);

 
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

     // MOD: Limpiamos estados para evitar arrastrar datos del cliente anterior.
     setMovimientosCliente([]);
     setMovDetallesCliente([]);
     setSaldoInicialDB(0);
     setSelectedCliente(null);

     //
    setSelectedCliente(cliente);
    setSearchTerm('');
      // Al seleccionar un cliente se reinician los filtros a los valores por defecto
    setSaldoCero(false);
    setDesdeHasta(false);
    setFacturasInvolucradas(false);
    setFechaDesde(todayISO);
    setFechaHasta(defaultFechaHasta);

    try {
      // 1) Obtener saldo inicial y movimientos
      const saldoInicial = await fetchSaldo(cliente.Número); // Devuelve un número
      // Si saldoInicial es null, se asigna 0 para evitar arrastrar datos del cliente anterior
      setSaldoInicialDB(saldoInicial ?? 0); // Guardamos el saldo inicial
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
      if (!saldoCero) {
        setDesdeHasta(false);
        setFacturasInvolucradas(false);
      }
    } else if (checkbox === 'desdeHasta') {
      setDesdeHasta(!desdeHasta);
      if (!desdeHasta) {
        setSaldoCero(false);
        setFacturasInvolucradas(false);
      }
    } else if (checkbox === 'facturasInvolucradas') {
      setFacturasInvolucradas(!facturasInvolucradas);
      if (!facturasInvolucradas) {
        setSaldoCero(false);
        setDesdeHasta(false);
      }
    }
  };

  

  return (
    <div className="container mt-5 pt-5">
      {showInforme ? (
        // Se pasan los valores de filtro seleccionados a InformeCliente mediante props
        // MOD: Se pasan como props los datos recién obtenidos para que InformeCliente
        // utilice estos en lugar de la información del contexto.
        <InformeCliente
          onBack={handleBack}
          cliente={selectedCliente}
          initialFiltroSaldoCero={saldoCero}
          initialFiltroDesdeHasta={desdeHasta}
          initialFiltroFacturasInvolucradas={facturasInvolucradas}
          initialFechaDesde={fechaDesde}
          initialFechaHasta={fechaHasta}
            // Nuevas props para sobreescribir los datos de contexto
            movimientosProp={movimientosCliente} // MOD:
            movDetallesProp={movDetallesCliente}   // MOD:
            saldoInicialProp={saldoInicialDB}         // MOD:
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
                {/* Mostrar el filtro "Facturas involucradas" solo si el cliente tiene saldo positivo mayor a 0.99 */}
                {selectedCliente.saldo !== null && selectedCliente.saldo !== undefined && selectedCliente.saldo > 0.99 && (
                  <div className="form-check">
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
                )}
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

          
         
        </div>
      )}
    </div>
  );
};

export default BusquedaCliente;