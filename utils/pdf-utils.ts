import { jsPDF } from 'jspdf';

// Colores y estilos estándar
const COLORS = {
  primary: '#000000', // Negro para texto principal
  secondary: '#4B5563', // Gris oscuro para texto secundario
  accent: '#3B82F6', // Azul para acentos
  background: '#FFFFFF', // Blanco para fondo
  text: '#000000', // Negro para texto
  border: '#E5E7EB' // Gris claro para bordes
};

// Configuración de márgenes
export const MARGINS = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

// Configuración de fuentes
const FONTS = {
  title: {
    size: 16,
    style: 'bold'
  },
  subtitle: {
    size: 12,
    style: 'bold'
  },
  body: {
    size: 10,
    style: 'normal'
  },
  footer: {
    size: 8,
    style: 'normal'
  }
};

// Función para inicializar un PDF con el estilo estándar
export const initializePDF = (title: string, author: string = 'ProfePlanner') => {
  const pdf = new jsPDF();
  
  // Configurar metadatos
  pdf.setProperties({
    title,
    author,
    subject: 'Documento generado por ProfePlanner AI',
    keywords: 'education, ai, learning',
    creator: 'ProfePlanner AI'
  });
  
  return pdf;
};

// Función para agregar el logo al footer
export const addLogoToFooter = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Agregar el logo en la esquina inferior derecha
  const logoWidth = 20;
  const logoHeight = 20;
  const logoX = pageWidth - logoWidth - MARGINS.right;
  const logoY = pageHeight - logoHeight - MARGINS.bottom;
  
  // Cargar el logo
  const logoUrl = '/images/logo.png';
  pdf.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
  
  // Agregar texto debajo del logo
  pdf.setFontSize(FONTS.footer.size);
  pdf.setTextColor(COLORS.primary);
  pdf.text('ProfePlanner AI', logoX + (logoWidth / 2), logoY + logoHeight + 3, { align: 'center' });
};

// Función para agregar un encabezado estándar
export const addStandardHeader = (pdf: jsPDF, title: string, subtitle?: string) => {
  // Configurar fuente para el título
  pdf.setFontSize(FONTS.title.size);
  pdf.setTextColor(COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  
  // Agregar título
  pdf.text(title, MARGINS.left, MARGINS.top);
  
  if (subtitle) {
    // Configurar fuente para el subtítulo
    pdf.setFontSize(FONTS.subtitle.size);
    pdf.setTextColor(COLORS.secondary);
    pdf.setFont('helvetica', 'normal');
    
    // Agregar subtítulo
    pdf.text(subtitle, MARGINS.left, MARGINS.top + 10);
  }
  
  // Agregar línea decorativa
  pdf.setDrawColor(COLORS.primary);
  pdf.setLineWidth(0.5);
  pdf.line(MARGINS.left, MARGINS.top + 15, pdf.internal.pageSize.getWidth() - MARGINS.right, MARGINS.top + 15);
};

// Función para agregar un párrafo con estilo estándar
export const addStyledParagraph = (pdf: jsPDF, text: string, y: number) => {
  pdf.setFontSize(FONTS.body.size);
  pdf.setTextColor(COLORS.primary);
  pdf.setFont('helvetica', 'normal');
  
  const maxWidth = pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right;
  
  // Primero, dividir el texto en líneas basadas en saltos de línea existentes
  const paragraphs = text.split('\n');
  let currentY = y;
  
  for (const paragraph of paragraphs) {
    // Dividir cada párrafo en líneas que quepan en el ancho máximo
    const lines = pdf.splitTextToSize(paragraph, maxWidth);
    
    // Verificar si hay suficiente espacio en la página actual
    const spaceNeeded = lines.length * 5;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    if (currentY + spaceNeeded > pageHeight - MARGINS.bottom) {
      // Agregar nueva página si no hay suficiente espacio
      pdf.addPage();
      currentY = MARGINS.top;
    }
    
    // Agregar cada línea del párrafo
    lines.forEach((line: string, index: number) => {
      pdf.text(line, MARGINS.left, currentY + (index * 5));
    });
    
    // Actualizar la posición Y para el siguiente párrafo
    currentY += (lines.length * 5) + 5;
  }
  
  return currentY;
};

// Función para agregar una sección con título
export const addSection = (pdf: jsPDF, title: string, content: string, y: number) => {
  // Agregar título de sección
  pdf.setFontSize(FONTS.subtitle.size);
  pdf.setTextColor(COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGINS.left, y);
  
  // Agregar contenido
  return addStyledParagraph(pdf, content, y + 5);
};

// Función para agregar una tabla con estilo estándar
export const addStyledTable = (pdf: jsPDF, headers: string[], data: string[][], y: number) => {
  const columnWidth = (pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right) / headers.length;
  
  // Estilo para encabezados
  pdf.setFontSize(FONTS.body.size);
  pdf.setTextColor(COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  
  // Dibujar encabezados
  headers.forEach((header, index) => {
    pdf.text(header, MARGINS.left + (index * columnWidth), y);
  });
  
  // Estilo para datos
  pdf.setTextColor(COLORS.primary);
  pdf.setFont('helvetica', 'normal');
  
  // Dibujar datos
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      pdf.text(cell, MARGINS.left + (colIndex * columnWidth), y + ((rowIndex + 1) * 7));
    });
  });
  
  return y + ((data.length + 1) * 7) + 5;
};

export const exportToPDF = (rubric: string) => {
  try {
    const rubricData = JSON.parse(rubric);
    const doc = new jsPDF();
    
    // Set initial position and margins
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const titleWidth = doc.getTextWidth(rubricData.titulo);
    doc.text(rubricData.titulo, (pageWidth - titleWidth) / 2, y);
    y += 20;

    // Add description
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(rubricData.descripcion, maxWidth);
    doc.text(descriptionLines, margin, y);
    y += (descriptionLines.length * 7) + 10;

    // Add criteria table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Criterios de Evaluación', margin, y);
    y += 10;

    // Table headers
    doc.setFontSize(12);
    doc.text('Criterio', margin, y);
    doc.text('Descripción', margin + 50, y);
    doc.text('Escala de Calificación', margin + 120, y);
    doc.text('Puntuación', margin + 180, y);
    y += 10;

    // Add horizontal line
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Add criteria rows
    doc.setFont('helvetica', 'normal');
    rubricData.criterios.forEach((criterio: any) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Criterion name
      const nameLines = doc.splitTextToSize(criterio.nombre, 40);
      doc.text(nameLines, margin, y);
      
      // Description
      const descLines = doc.splitTextToSize(criterio.descripcion, 60);
      doc.text(descLines, margin + 50, y);
      
      // Grading scale
      const escalaText = criterio.escala.map((nivel: any) => 
        `Puntaje ${nivel.puntaje}: ${nivel.descripcion}`
      ).join('\n');
      const scaleLines = doc.splitTextToSize(escalaText, 50);
      doc.text(scaleLines, margin + 120, y);
      
      // Score placeholder
      doc.text('______', margin + 180, y);
      
      y += Math.max(nameLines.length, descLines.length, scaleLines.length) * 7 + 5;
      
      // Add horizontal line
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    });

    // Add final grade section
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Calificación Final', margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de puntos obtenidos: ______ / ${rubricData.criterios.length * 5}`, margin, y);
    y += 10;
    doc.text('Nota Final: ______', margin, y);

    // Save the PDF
    const filename = `${rubricData.titulo.toLowerCase().replace(/\s+/g, '-')}-rubrica.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
}; 