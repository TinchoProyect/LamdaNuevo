import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente } from '../types/cliente';
import { Movimiento } from '../types/movimiento';
import { Mov_Detalle } from '../types/movimiento_detalle';

/**
 * Parámetros para generar el PDF
 */
interface GenerarInformePDFParams {
  cliente: Cliente;
  saldoFinal: number;
  filtroSaldoCero: boolean;
  filtroDesdeHasta: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  movimientosFiltrados: Movimiento[];
  detallesPorMovimiento?: Record<number, Mov_Detalle[]>; 
  // ^ Opcional: si quieres incluir los detalles de factura/NC en el PDF
}

/**
 * Genera un PDF profesional (texto real, no captura de pantalla)
 * con la lista de movimientos + sus detalles (opcional).
 */
export function generarInformePDF(params: GenerarInformePDFParams) {
  const {
    cliente,
    saldoFinal,
    filtroSaldoCero,
    filtroDesdeHasta,
    fechaDesde,
    fechaHasta,
    movimientosFiltrados,
    detallesPorMovimiento = {},
  } = params;

  // 1) Crear instancia jsPDF (A4 vertical, en milímetros)
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Fecha actual
  const fechaActual = new Date().toLocaleDateString('es-AR');

  // 2) ENCABEZADO / DATOS DEL CLIENTE
  pdf.setFontSize(14);
  pdf.text('Informe de Movimientos', 10, 15);

  pdf.setFontSize(11);
  pdf.text(`Fecha de generación: ${fechaActual}`, 10, 23);

  pdf.text(`Cliente: ${cliente.Nombre} ${cliente.Apellido}`, 10, 29);
  pdf.text(`N° Cliente: ${String(cliente.Número).padStart(3, '0')}`, 10, 35);

  pdf.setTextColor(0, 150, 0);
  pdf.text(`Saldo Final: $${saldoFinal.toFixed(2)}`, 10, 41);
  pdf.setTextColor(0, 0, 0);

  // Mostrar filtros
  let filtroTexto = 'Sin filtros especiales';
  if (filtroSaldoCero) {
    filtroTexto = 'Desde Saldo Cero';
  } else if (filtroDesdeHasta) {
    filtroTexto = `Desde ${fechaDesde} Hasta ${fechaHasta}`;
  }
  pdf.text(`Filtro aplicado: ${filtroTexto}`, 10, 47);

  // 3) PREPARAR FILAS PARA jspdf-autotable

  // Cada movimiento será una fila. Si tiene detalles (factura o NC),
  // concatenamos los detalles en una celda "Detalles".
  const rows = movimientosFiltrados.map((mov) => {
    // Convertir fecha a legible
    const fechaMov = mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-AR') : '-';
    // Juntar detalles si existen
    let detalleStr = '';
    const dets = detallesPorMovimiento[mov.codigo];
    if (dets && dets.length > 0) {
      // Construir un string con cada línea "Artículo - Descripción (xCant)"
      detalleStr = dets
        .map(
          (d) =>
            `${d.Articulo_Detalle} - ${d.Descripcion_Detalle} (x${d.Cantidad_Detalle})`
        )
        .join('\n');
    }

    return {
      indice: mov.índice || '-',
      fecha: fechaMov,
      comprobante: mov.nombre_comprobante,
      importe: `$${mov.importe_total.toFixed(2)}`,
      saldoParcial:
        mov.saldo_parcial !== undefined ? `$${mov.saldo_parcial.toFixed(2)}` : '-',
      detalles: detalleStr,
    };
  });

  // 4) DEFINIR COLUMNAS DE LA TABLA
  const columns = [
    { header: 'Índice', dataKey: 'indice' },
    { header: 'Fecha', dataKey: 'fecha' },
    { header: 'Comprobante', dataKey: 'comprobante' },
    { header: 'Importe', dataKey: 'importe' },
    { header: 'Saldo Parcial', dataKey: 'saldoParcial' },
    { header: 'Detalles', dataKey: 'detalles' },
  ];

  // 5) GENERAR TABLA
  autoTable(pdf, {
    startY: 55,
    head: columns,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [22, 160, 133] }, // verde turquesa
    bodyStyles: {
      // Permite que la celda de "Detalles" haga salto de línea
      minCellHeight: 5,
      overflow: 'linebreak',
    },
  });

  // 6) Guardar/descargar
  pdf.save(`Informe_Cliente_${cliente.Número}_${fechaActual}.pdf`);
}