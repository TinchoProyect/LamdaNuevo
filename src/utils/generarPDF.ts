import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente } from '../types/cliente';
import { Movimiento } from '../types/movimiento';
import { Mov_Detalle } from '../types/movimiento_detalle';

/**
 * Formatea un número para que tenga dos decimales.
 * Si el valor absoluto es menor o igual a 0.99, retorna '0.00'.
 *
 * @param valor - Número a formatear.
 * @returns Valor formateado como string.
 */

/**
 * Convierte un color en formato hexadecimal (#RRGGBB) a un array RGB [R, G, B].
 * @param hex - Color en formato hexadecimal.
 * @returns Un array con los valores [R, G, B] o negro [0, 0, 0] si el formato es inválido.
 */
function hexToRgb(hex: string): [number, number, number] {
  // Verificar si el color es un valor hexadecimal válido
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return match 
      ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)]
      : [0, 0, 0]; // Color negro por defecto si el formato es incorrecto.
}

function ajustarValor(valor: number): string {
  if (Math.abs(valor) <= 0.99) {
    return '0.00';
  }
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Interfaz para agrupar los análisis de saldo por color.
 */
interface AnalysisGroups {
  [color: string]: {
    totalMonto: number;
    totalPercentage: number;
  };
}

/**
 * Mapeo de color a estado.
 */
interface ColorEstadoMap {
  [color: string]: string;
}

/**
 * Parámetros para generar el informe PDF.
 * Se agregó la propiedad opcional "filtroFacturasInvolucradas" para recibir el nuevo filtro.
 */
interface GenerarInformePDFParams {
  nombreArchivo?: string;
  cliente: Cliente;
  saldoFinal: number;
  filtroSaldoCero: boolean;
  filtroDesdeHasta: boolean;
  filtroFacturasInvolucradas?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  movimientosFiltrados: Movimiento[];
  detallesPorMovimiento?: Record<number, Mov_Detalle[]>;
  analysisGroups?: AnalysisGroups;
  orderColors?: string[];
  estadoMapping?: ColorEstadoMap;
}



/**
 * Genera un informe PDF de movimientos utilizando jsPDF y jspdf-autotable.
 * En la tabla de movimientos, si el comprobante comienza con "F" se aplica
 * el color correspondiente (obtenido a partir de `estadoMapping` y `orderColors`)
 * a las celdas de Comprobante, Importe y Saldo Parcial.
 *
 * @param params - Parámetros necesarios para generar el PDF.
 */
export function generarInformePDF(params: GenerarInformePDFParams) {
  const {
    nombreArchivo,
    cliente,
    saldoFinal,
    movimientosFiltrados,
    detallesPorMovimiento = {},
    analysisGroups = {},
    orderColors = [],
    estadoMapping = {},
  } = params;

  // Crear la instancia del PDF en formato A4.
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Obtener la fecha actual con formato local.
  const fechaActual = new Date().toLocaleDateString('es-AR');

  // Cabecera del PDF.
  pdf.setFontSize(18);
  pdf.setTextColor(0, 150, 0);
  pdf.text('Lamda', 10, 10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.text('Alias: LAMDA.SER.MARTIN', 35, 10);

  pdf.setFontSize(14);
  pdf.text('Informe de Movimientos', 10, 18);

  pdf.setFontSize(11);
  pdf.text(`Fecha de generación: ${fechaActual}`, 10, 26);
  pdf.text(`Cliente: ${cliente.Nombre} ${cliente.Apellido}`, 10, 32);
  pdf.text(`N° Cliente: ${String(cliente.Número).padStart(3, '0')}`, 10, 38);

  pdf.setFontSize(14);
  pdf.setTextColor(0, 150, 0);
  pdf.text(`Saldo : $${ajustarValor(saldoFinal)}`, 10, 44);
  pdf.setTextColor(0, 0, 0);

  // Sección: Análisis de Saldo.
  pdf.setFontSize(11);
  pdf.text('Análisis de Saldo', 15, 54);

  let currentY = 56;
  const colorsExist = orderColors.length > 0 && Object.keys(analysisGroups).length > 0;

  if (colorsExist) {
    // Crear la data para la tabla de análisis de saldo.
    const tableBody = orderColors
      .filter((color) => analysisGroups[color])
      .map((color) => {
        const group = analysisGroups[color];
        return {
          color,
          monto: `$${ajustarValor(group.totalMonto)}`,
          porcentaje: `${ajustarValor(group.totalPercentage)}%`,
          estado: estadoMapping[color] || '',
        };
      });

    autoTable(pdf, {
      startY: currentY,
      head: [['Color', 'Monto', 'Porcentaje', 'Estado']],
      body: tableBody.map((item) => [
        '', // Se dibuja el color en willDrawCell.
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
        // En la primera columna se dibuja un rectángulo con el color correspondiente.
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
  console.log("Estado Mapping:", estadoMapping);
  console.log("Orden de colores:", orderColors);
  // Sección: Movimientos.
  // Si la tabla de análisis de saldo se generó, se usa su finalY para ubicar la tabla.
  pdf.setFontSize(11);
  pdf.text(
    'Movimientos',
    15,
    (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY + 8 : currentY
  );

  // Mapear cada movimiento a una fila de la tabla.
  const rows = movimientosFiltrados.map((mov) => {
    // Formatear la fecha.
    const fechaMov = mov.fecha
      ? new Date(mov.fecha).toLocaleDateString('es-AR')
      : '-';

    // Construir el detalle a partir de los detalles asociados (si existen).
    let detalleStr = '';
    const dets = detallesPorMovimiento[mov.codigo];
    if (dets && dets.length > 0) {
      detalleStr = dets
        .filter(
          (d) =>
            d.Articulo_Detalle && d.Descripcion_Detalle && d.Cantidad_Detalle
        )
        .map(
          (d) =>
            `${d.Articulo_Detalle} - ${d.Descripcion_Detalle} (x${d.Cantidad_Detalle})`
        )
        .join('\n');
      if (!detalleStr) detalleStr = '---';
    }

    // Verificar si el comprobante es una factura (comienza con "F").
    const esFactura = mov.nombre_comprobante?.startsWith('F');

    let facturaColor: [number, number, number] = [0, 0, 0]; // Negro por defecto si no se encuentra color

    if (esFactura && mov.fecha && mov.saldo_parcial > 0) { // SOLO FACTURAS IMPAGAS
      const fechaFactura = new Date(mov.fecha);
      const fechaHoy = new Date();
  
      // Calcular la diferencia en días entre hoy y la fecha de la factura
      const diferenciaTiempo = fechaHoy.getTime() - fechaFactura.getTime();
      const diasAntiguedad = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
  
      console.log(`📅 Factura IMPAGA: ${mov.nombre_comprobante} - Fecha: ${mov.fecha} - Antigüedad: ${diasAntiguedad} días`);
  
      let colorEncontrado: string | undefined;
  
      for (const color of orderColors) {
          const estadoTexto = estadoMapping[color]; // "0-7 Días", "8-14 Días", etc.
  
          // Extraemos los valores numéricos de los rangos usando expresiones regulares
          const match = estadoTexto.match(/(\d+)-(\d+)/);
          if (match) {
              const minDias = parseInt(match[1], 10);
              const maxDias = parseInt(match[2], 10);
  
              // Verificar si la antigüedad de la factura está dentro del rango
              if (diasAntiguedad >= minDias && diasAntiguedad <= maxDias) {
                  colorEncontrado = color;
                  break;
              }
          } else if (estadoTexto.includes("Mas de")) {
              // Caso especial para "Mas de 28 Días"
              const minDias = parseInt(estadoTexto.match(/(\d+)/)?.[1] ?? "0", 10);
              if (diasAntiguedad > minDias) {
                  colorEncontrado = color;
                  break;
              }
          } else if (estadoTexto.includes("Pendiente Vencida")) {
              // Si hay un estado específico de vencimiento, lo asignamos directamente
              colorEncontrado = color;
          }
      }
  
      // Asignamos el color si se encontró uno, o negro si no hay coincidencia
      if (colorEncontrado) {
          facturaColor = hexToRgb(colorEncontrado);
          console.log(`✅ Asignado color ${colorEncontrado} para factura impaga con ${diasAntiguedad} días de antigüedad.`);
      } else {
          console.log(`❌ No se encontró color para factura impaga con ${diasAntiguedad} días de antigüedad.`);
      }
  }
  
  // Imprimir en consola el color asignado para verificarlo
  console.log(`🎨 Factura: ${mov.nombre_comprobante} - Estado: ${(mov as any).estado} - Color: ${facturaColor}`);

    return {
      fecha: fechaMov,
      comprobante: {
        text: mov.nombre_comprobante,
        // Se asigna el color solo si es factura.
        textColor: esFactura ? facturaColor : undefined,
      },
      importe: {
        text: `$${ajustarValor(mov.importe_total)}`,
        textColor: esFactura ? facturaColor : undefined,
      },
      saldoParcial: {
        text:
          mov.saldo_parcial !== undefined
            ? `$${ajustarValor(mov.saldo_parcial)}`
            : '-',
        textColor: esFactura ? facturaColor : undefined,
      },
      detalles: detalleStr,
    };
  });

  const columns = [
    { header: 'Fecha', dataKey: 'fecha' },
    { header: 'Comprobante', dataKey: 'comprobante' },
    { header: 'Importe', dataKey: 'importe' },
    { header: 'Saldo Parcial', dataKey: 'saldoParcial' },
    { header: 'Detalles', dataKey: 'detalles' },
  ];

  // Generar la tabla de movimientos.
  autoTable(pdf, {
    startY: currentY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => [
        r.fecha,
        { content: r.comprobante.text },
        { content: r.importe.text },
        { content: r.saldoParcial.text },
        r.detalles,
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [22, 160, 133] },
    bodyStyles: {
        minCellHeight: 5,
        overflow: 'linebreak',
    },
    willDrawCell: function (data) {
        if (data.section === 'body') {
            const rowIndex = data.row.index;
            const colIndex = data.column.index;

            // Aplica color solo en las columnas de "Comprobante", "Importe" y "Saldo Parcial"
            if (colIndex === 1 || colIndex === 2 || colIndex === 3) {
                const rowData = rows[rowIndex];
                if (rowData) {
                    const textColor = rowData.comprobante.textColor;
                    if (textColor) {
                        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
                    }
                }
            }
        }
    },
    didDrawCell: function () {
        pdf.setTextColor(0, 0, 0); // Restablecer color después de dibujar la celda
    },
});


  // Guardar el PDF utilizando el nombre de archivo proporcionado o uno por defecto.
  pdf.save(
    nombreArchivo
      ? nombreArchivo
      : `Informe_Cliente_${cliente.Número}_${fechaActual}.pdf`
  );
}


