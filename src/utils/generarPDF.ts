import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente } from '../types/cliente';
import { Movimiento } from '../types/movimiento';
import { Mov_Detalle } from '../types/movimiento_detalle';

// Función auxiliar: si el valor es cercano a 0 (entre -0,99 y 0,99) se considera 0.
function ajustarValor(valor: number): number {
  return Math.abs(valor) <= 0.99 ? 0 : valor;
}

// Estructuras para el análisis opcional
interface AnalysisGroups {
  [color: string]: {
    totalMonto: number;
    totalPercentage: number;
  };
}
interface ColorEstadoMap {
  [color: string]: string;
}

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
  // Opcional: si queremos mostrar también el análisis de saldo en el PDF:
  analysisGroups?: AnalysisGroups;
  orderColors?: string[];
  estadoMapping?: ColorEstadoMap;
}

/**
 * Genera un PDF profesional (texto real, no captura de pantalla)
 * con la lista de movimientos + sus detalles, y opcionalmente el análisis de saldo.
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
    analysisGroups = {},   // por defecto vacío
    orderColors = [],      // por defecto vacío
    estadoMapping = {},    // por defecto vacío
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
  // Se ajusta el saldoFinal si está cerca de cero
  pdf.text(`Saldo Final: $${ajustarValor(saldoFinal).toFixed(2)}`, 10, 41);
  pdf.setTextColor(0, 0, 0);

  // Mostrar filtros
  let filtroTexto = 'Sin filtros especiales';
  if (filtroSaldoCero) {
    filtroTexto = 'Desde Saldo Cero';
  } else if (filtroDesdeHasta) {
    filtroTexto = `Desde ${fechaDesde} Hasta ${fechaHasta}`;
  }
  pdf.text(`Filtro aplicado: ${filtroTexto}`, 10, 47);

  // 3) ANALISIS DE SALDO (opcional)
  let currentY = 55; // Posición vertical para las tablas
  const colorsExist = orderColors.length > 0 && Object.keys(analysisGroups).length > 0;

  if (colorsExist) {
    // Prepara cuerpo de la tabla
    const tableBody = orderColors
      .filter((color) => analysisGroups[color])
      .map((color) => {
        const group = analysisGroups[color];
        return {
          color,
          monto: `$${ajustarValor(group.totalMonto).toFixed(2)}`,
          porcentaje: `${ajustarValor(group.totalPercentage).toFixed(1)}%`,
          estado: estadoMapping[color] || '',
        };
      });

    autoTable(pdf, {
      startY: currentY,
      head: [['Color', 'Monto', 'Porcentaje', 'Estado']],
      body: tableBody.map((item) => [
        '',          // pintaremos la celda con willDrawCell
        item.monto,
        item.porcentaje,
        item.estado,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      willDrawCell: (data) => {
        // Pinta la primera columna con el color real
        if (data.section === 'body' && data.column.index === 0) {
          const rowIndex = data.row.index;
          const colorHex = tableBody[rowIndex].color;
          pdf.setFillColor(colorHex);
          pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      },
    });

    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }

  // 4) PREPARAR FILAS PARA jspdf-autotable
  const rows = movimientosFiltrados.map((mov) => {
    const fechaMov = mov.fecha
      ? new Date(mov.fecha).toLocaleDateString('es-AR')
      : '-';
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
      // Se ajusta el importe_total si está cerca de cero
      importe: `$${ajustarValor(mov.importe_total).toFixed(2)}`,
      saldoParcial:
        mov.saldo_parcial !== undefined
          ? `$${ajustarValor(mov.saldo_parcial).toFixed(2)}`
          : '-',
      detalles: detalleStr,
    };
  });

  // 5) DEFINIR COLUMNAS DE LA TABLA PRINCIPAL
  const columns = [
    { header: 'Índice', dataKey: 'indice' },
    { header: 'Fecha', dataKey: 'fecha' },
    { header: 'Comprobante', dataKey: 'comprobante' },
    { header: 'Importe', dataKey: 'importe' },
    { header: 'Saldo Parcial', dataKey: 'saldoParcial' },
    { header: 'Detalles', dataKey: 'detalles' },
  ];

  // 6) GENERAR TABLA DE MOVIMIENTOS
  autoTable(pdf, {
    startY: currentY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => Object.values(r)),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [22, 160, 133] }, // verde turquesa
    bodyStyles: {
      // Para que la celda "Detalles" haga salto de línea
      minCellHeight: 5,
      overflow: 'linebreak',
    },
  });

  // 7) Guardar/descargar
  pdf.save(`Informe_Cliente_${cliente.Número}_${fechaActual}.pdf`);
}