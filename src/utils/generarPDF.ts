import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente } from '../types/cliente';
import { Movimiento } from '../types/movimiento';
import { Mov_Detalle } from '../types/movimiento_detalle';



function ajustarValor(valor: number): string {
  if (Math.abs(valor) <= 0.99) {
    return '0.00';
  }

  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}


interface AnalysisGroups {
  [color: string]: {
    totalMonto: number;
    totalPercentage: number;
  };
}
interface ColorEstadoMap {
  [color: string]: string;
}

// Se agregó la propiedad opcional "filtroFacturasInvolucradas" para recibir el nuevo filtro
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

export function generarInformePDF(params: GenerarInformePDFParams) {
  const {
    nombreArchivo,
    cliente,
    saldoFinal,
    /*filtroSaldoCero,
    filtroDesdeHasta,
    filtroFacturasInvolucradas,
    fechaDesde,
    fechaHasta,*/
    movimientosFiltrados,
    detallesPorMovimiento = {},
    analysisGroups = {},
    orderColors = [],
    estadoMapping = {},
  } = params;

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Se utiliza el formato local para la cabecera; el nombre del archivo se usará desde la propiedad pasada
  const fechaActual = new Date().toLocaleDateString('es-AR');

  pdf.setFontSize(18);
  pdf.setTextColor(0, 150, 0);
  pdf.text('Lamba', 10, 10);
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

  /*let filtroTexto = 'Sin filtros especiales';
  if (filtroSaldoCero) {
    filtroTexto = 'Desde Saldo Cero';
  } else if (filtroDesdeHasta) {
    filtroTexto = `Desde ${fechaDesde} Hasta ${fechaHasta}`;
  } else if (filtroFacturasInvolucradas) {
    filtroTexto = 'Facturas involucradas';
  }
  pdf.text(`Filtro aplicado: ${filtroTexto}`, 10, 47);*/
  
  pdf.setFontSize(11);
  pdf.text('Análisis de Saldo', 15, 54);

  let currentY = 56;
  const colorsExist = orderColors.length > 0 && Object.keys(analysisGroups).length > 0;

  if (colorsExist) {
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
        '',
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

  pdf.setFontSize(11);
  pdf.text('Movimientos', 15, (pdf as any).lastAutoTable.finalY + 8);

  const rows = movimientosFiltrados.map((mov) => {
    const fechaMov = mov.fecha
      ? new Date(mov.fecha).toLocaleDateString('es-AR')
      : '-';
    let detalleStr = '';
    const dets = detallesPorMovimiento[mov.codigo];
    if (dets && dets.length > 0) {
      detalleStr = dets
        .map(
          (d) =>
            `${d.Articulo_Detalle} - ${d.Descripcion_Detalle} (x${d.Cantidad_Detalle})`
        )
        .join('\n');
    }
    

    
    
    return {  
     // indice: mov.índice || '-',
      fecha: fechaMov,
      comprobante: mov.nombre_comprobante,
      importe: `$${ajustarValor(mov.importe_total)}`,
      saldoParcial:
        mov.saldo_parcial !== undefined
          ? `$${ajustarValor(mov.saldo_parcial)}`
          : '-',
      detalles: detalleStr,
    };
  });

  const columns = [
    //{ header: 'Índice', dataKey: 'indice' },
    { header: 'Fecha', dataKey: 'fecha' },
    { header: 'Comprobante', dataKey: 'comprobante' },
    { header: 'Importe', dataKey: 'importe' },
    { header: 'Saldo Parcial', dataKey: 'saldoParcial' },
    { header: 'Detalles', dataKey: 'detalles' },
  ];

  autoTable(pdf, {
    startY: currentY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => Object.values(r)),
   
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [22, 160, 133] },
    bodyStyles: {
      minCellHeight: 5,
      overflow: 'linebreak',
      
       
    },
   
  });

  pdf.save(
    nombreArchivo
      ? nombreArchivo
      : `Informe_Cliente_${cliente.Número}_${fechaActual}.pdf`
  );
}