import jsPDF from 'jspdf';
import { Cliente } from '../types/cliente';
import { Movimiento } from '../types/movimiento';

interface Filtros {
  desdeSaldoCero: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

interface GenerarPDFParams {
  cliente: Cliente;
  saldo: number;
  movimientos: Movimiento[];
  filtros: Filtros;
}

const generarPDF = async ({ cliente, saldo, movimientos, filtros }: GenerarPDFParams) => {
  try {
    // Aplicar filtros a los movimientos
    let movimientosFiltrados = [...movimientos];

    if (filtros.desdeSaldoCero) {
      // Buscar el último movimiento cuyo saldo parcial esté en el rango [-0.99, 0.99]
      const reversed = [...movimientosFiltrados].reverse();
      const indexEnReversed = reversed.findIndex(mov => Math.abs(mov.saldo_parcial) < 0.99);
      if (indexEnReversed !== -1) {
        const startIndex = movimientosFiltrados.length - indexEnReversed - 1;
        movimientosFiltrados = movimientosFiltrados.slice(startIndex);
      }
    } else if (filtros.fechaDesde && filtros.fechaHasta) {
      if (filtros.fechaHasta < filtros.fechaDesde) {
        throw new Error("La fecha 'Hasta' no puede ser anterior a 'Desde'.");
      }
      movimientosFiltrados = movimientosFiltrados.filter(mov => {
        if (!mov.fecha) return false;
        const movDate = new Date(mov.fecha);
        return movDate >= filtros.fechaDesde! && movDate <= filtros.fechaHasta!;
      });
    }

    // Ordenar los movimientos: del más reciente al más antiguo (según el valor de 'índice')
    movimientosFiltrados.sort((a, b) => b.índice - a.índice);

    // Crear una instancia de jsPDF para formato A4
    const doc = new jsPDF('p', 'mm', 'a4');

    const margin = 10;
    let yPos = 10;

    // Agregar encabezado
    doc.setFontSize(16);
    doc.text("Lambda", margin + 45, yPos + 10);
    yPos += 25;

    doc.setFontSize(12);
    doc.text(`Cliente: ${cliente.Nombre} ${cliente.Apellido}`, margin, yPos);
    yPos += 7;
    doc.text(`Número: ${cliente.Número}`, margin, yPos);
    yPos += 7;
    doc.text(`Saldo: $${saldo.toFixed(2)}`, margin, yPos);
    yPos += 7;
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, margin, yPos);
    yPos += 10;

    // Datos de la cuenta
    doc.text("Cuenta: Caja de ahorro en pesos", margin, yPos);
    yPos += 7;
    doc.text("N° Cuenta: 4007844-1 373-4", margin, yPos);
    yPos += 7;
    doc.text("CBU: 0070373230004007844141", margin, yPos);
    yPos += 10;

    // Sección de Análisis de Saldo
    doc.setFontSize(14);
    doc.text("Análisis de Saldo", margin, yPos);
    yPos += 7;

    // Agregar encabezado para la lista de movimientos
    doc.setFontSize(10);
    doc.text("Movimientos:", margin, yPos);
    yPos += 7;
    doc.text("Índice | Fecha | Comprobante | Importe Total | Saldo Parcial", margin, yPos);
    yPos += 7;

    // Listar los movimientos filtrados
    movimientosFiltrados.forEach(mov => {
      const fecha = mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-AR') : '-';
      const linea = `${mov.índice} | ${fecha} | ${mov.nombre_comprobante} | $${mov.importe_total.toFixed(
        2
      )} | $${mov.saldo_parcial.toFixed(2)}`;
      doc.text(linea, margin, yPos);
      yPos += 7;
      if (yPos > 280) {
        doc.addPage();
        yPos = 10;
      }
    });

    // Guardar el PDF con un nombre basado en el número de cliente
    doc.save(`Informe_${cliente.Número}.pdf`);
  } catch (error: any) {
    alert(`Error generando PDF: ${error.message}`);
    console.error(error);
  }
};

export default generarPDF;