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
      pdf.setFontSize(11);
      pdf.text('Análisis de Saldo', 15, 54);
      
    autoTable(pdf, {
      startY: currentY + 1,
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
    (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY + 8  : currentY ,
  );

 
  
   
   // **Cálculo de Facturas Involucradas en el Análisis de Saldo**
   const facturasInvolucradasMap: Record<
   number,
   { montoInvolucrado: number; porcentaje: number; diasTranscurridos: number; color: string }
 > = {};

 if (saldoFinal > 0) {
   let saldoPendiente = saldoFinal;
   const facturas = movimientosFiltrados.filter((mov) =>
     ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante)
   );

   const facturasDesc = facturas.sort((a, b) => b.fecha!.localeCompare(a.fecha!));

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
       diasTranscurridos = Math.floor((hoy.getTime() - fechaFactura.getTime()) / (1000 * 60 * 60 * 24));
     }

     let color = '#f0f0f0';
     if (diasTranscurridos <= 7) color = '#d4edda';
     else if (diasTranscurridos >= 8 && diasTranscurridos <= 14) color = '#fff3cd';
     else if (diasTranscurridos >= 15 && diasTranscurridos <= 21) color = '#ffe5b4';
     else if (diasTranscurridos >= 22 && diasTranscurridos <= 28) color = '#f8d7da';
     else if (diasTranscurridos >= 29) color = '#800020';

     facturasInvolucradasMap[factura.codigo] = { montoInvolucrado, porcentaje, diasTranscurridos, color };
     saldoPendiente -= montoInvolucrado;
   }
 }

 // **Generación de Tabla de Movimientos**
 const rows = movimientosFiltrados.map((mov) => {
   const esFactura = ['FA', 'FB', 'FC', 'FD', 'FE'].includes(mov.nombre_comprobante);
   const colorHex = facturasInvolucradasMap[mov.codigo]?.color || '#FFFFFF';
   const bgColor = hexToRgb(colorHex);
   const isBold = !!facturasInvolucradasMap[mov.codigo];
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


  

   return {
     fecha: mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-AR') : '-',
     comprobante: { text: mov.nombre_comprobante, bgColor, isBold },
     importe: { text: `$${ajustarValor(mov.importe_total)}`, bgColor, isBold },
     saldoParcial: { text: `$${ajustarValor(mov.saldo_parcial)}`, bgColor, isBold },
     detalles: detalleStr,
   };
 });

 autoTable(pdf, {
   startY: currentY + 2,
   head: [['Fecha', 'Comprobante', 'Importe', 'Saldo Parcial', 'Detalles']],
   body: rows.map((r) => [
     r.fecha,
     { content: r.comprobante.text, styles: { fontStyle: r.comprobante.isBold ? 'bold' : 'normal' } },
     { content: r.importe.text, styles: { fontStyle: r.importe.isBold ? 'bold' : 'normal' } },
     { content: r.saldoParcial.text, styles: { fontStyle: r.saldoParcial.isBold ? 'bold' : 'normal' } },
     r.detalles,
   ]),
   theme: 'grid',
   styles: { fontSize: 9, cellPadding: 3 },
   willDrawCell: function (data) {
     if (data.section === 'body' && [1, 2, 3].includes(data.column.index)) {
       const rowIndex = data.row.index;
       const rowData = rows[rowIndex];
       if (rowData && rowData.comprobante.bgColor) {
         const colorRGB = rowData.comprobante.bgColor;
         pdf.setFillColor(colorRGB[0], colorRGB[1], colorRGB[2]);
         pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
       }
     }
   },
 });



  // Guardar el PDF utilizando el nombre de archivo proporcionado o uno por defecto.
  pdf.save(
    nombreArchivo
      ? nombreArchivo
      : `Informe_Cliente_${cliente.Número}_${fechaActual}.pdf`
  );
}
