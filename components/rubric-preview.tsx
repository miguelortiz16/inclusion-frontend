import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Share2, X, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { addLogoToFooter } from '@/utils/pdf-utils';
import ExcelJS from "exceljs";

interface NivelEscala {
  puntaje: number;
  descripcion: string;
}

interface Criterio {
  nombre: string;
  descripcion: string;
  escala: NivelEscala[];
}

interface RubricData {
  titulo: string;
  descripcion: string;
  criterios: Criterio[];
}

interface RubricPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  rubric: {
    id: string;
    prompt: string;
    response: string;
    tipoTaller: string;
    timestamp: string;
    name: string;
    email: string;
    activate: boolean;
  };
  onUpdate: (rubric: string) => void;
}

const RubricContent = ({ data }: { data: RubricData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{data.titulo}</h2>
        <p className="text-gray-600">{data.descripcion}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Criterio</th>
              <th className="border p-2">Descripción</th>
              <th className="border p-2">Escala de Calificación</th>
              <th className="border p-2">Calificación</th>
            </tr>
          </thead>
          <tbody>
            {data.criterios.map((criterio, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-2">{criterio.nombre}</td>
                <td className="border p-2">{criterio.descripcion}</td>
                <td className="border p-2">
                  <div className="space-y-2">
                    {criterio.escala.map((nivel, nivelIndex) => (
                      <div key={nivelIndex} className={nivelIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50 p-2'}>
                        <span className="font-semibold">Puntaje {nivel.puntaje}:</span> {nivel.descripcion}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="border p-2 text-center">
                  <div className="flex items-center justify-center h-full">
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      className="w-16 h-8 border rounded text-center"
                      placeholder="1-5"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Calificación Final</h3>
        <div className="space-y-2">
          <p>Total de puntos obtenidos: ______ / {data.criterios.length * 5}</p>
          <p>Nota Final: ______</p>
        </div>
      </div>
    </div>
  );
};

export const RubricPreview = ({ isOpen, onClose, rubric, onUpdate }: RubricPreviewProps) => {
  const handleExportPDF = async () => {
    try {
      const data = JSON.parse(rubric.response);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 10;
      const pageWidth = 297; // Ancho A4 landscape
      const pageHeight = 210; // Alto A4 landscape
      const contentWidth = pageWidth - marginLeft - marginRight;

      const styles = {
        header: { fontSize: 14, fontStyle: 'bold' },
        subheader: { fontSize: 10, fontStyle: 'bold' },
        normal: { fontSize: 8, fontStyle: 'normal' },
        small: { fontSize: 7, fontStyle: 'normal' }
      };

      // Título
      pdf.setFont('helvetica', styles.header.fontStyle);
      pdf.setFontSize(styles.header.fontSize);
      const title = data.titulo;
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      // Descripción
      let yPos = marginTop + 10;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      const descLines = pdf.splitTextToSize(data.descripcion, contentWidth);
      pdf.text(descLines, marginLeft, yPos);
      yPos += descLines.length * 4 + 8;

      // Definir anchos de columnas
      const colWidths = [50, 70, 120, 30];
      const startX = marginLeft;

      // Criterios
      data.criterios.forEach((criterio: any) => {
        if (yPos + 40 > pageHeight - marginTop) {
          pdf.addPage('landscape');
          yPos = marginTop;
        }

        // Encabezado de la tabla
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.setFontSize(styles.subheader.fontSize);
        
        // Dibujar bordes de la tabla
        pdf.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 8);
        pdf.text('Criterio', startX + 2, yPos);
        pdf.text('Descripción', startX + colWidths[0] + 2, yPos);
        pdf.text('Escala de Calificación', startX + colWidths[0] + colWidths[1] + 2, yPos);
        pdf.text('Calificación', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
        yPos += 8;

        // Contenido del criterio
        pdf.setFont('helvetica', styles.normal.fontStyle);
        pdf.setFontSize(styles.normal.fontSize);
        
        // Calcular altura necesaria para la fila
        const criterioLines = pdf.splitTextToSize(criterio.nombre, colWidths[0] - 4);
        const descLines = pdf.splitTextToSize(criterio.descripcion, colWidths[1] - 4);
        const escalaText = criterio.escala.map((nivel: any) => 
          `Puntaje ${nivel.puntaje}: ${nivel.descripcion}`
        ).join('\n');
        const escalaLines = pdf.splitTextToSize(escalaText, colWidths[2] - 4);
        const rowHeight = Math.max(criterioLines.length, descLines.length, escalaLines.length) * 4 + 4;

        // Dibujar bordes de la celda
        pdf.rect(startX, yPos - 4, colWidths[0], rowHeight);
        pdf.rect(startX + colWidths[0], yPos - 4, colWidths[1], rowHeight);
        pdf.rect(startX + colWidths[0] + colWidths[1], yPos - 4, colWidths[2], rowHeight);
        pdf.rect(startX + colWidths[0] + colWidths[1] + colWidths[2], yPos - 4, colWidths[3], rowHeight);
        
        // Nombre del criterio
        pdf.text(criterioLines, startX + 2, yPos);
        
        // Descripción
        pdf.text(descLines, startX + colWidths[0] + 2, yPos);
        
        // Escala
        pdf.text(escalaLines, startX + colWidths[0] + colWidths[1] + 2, yPos);
        
        // Espacio para calificación
        pdf.text('______', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
        
        yPos += rowHeight + 2;
      });

      // Calificación Final
      if (yPos + 20 > pageHeight - marginTop) {
        pdf.addPage('landscape');
        yPos = marginTop;
      }

      // Dibujar bordes de la fila final
      pdf.rect(startX, yPos - 4, colWidths.reduce((a, b) => a + b, 0), 12);

      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.setFontSize(styles.subheader.fontSize);
      pdf.text('Calificación Final', startX + 2, yPos);
      pdf.text('Total de puntos obtenidos', startX + colWidths[0] + 2, yPos);
      pdf.text(`Puntaje Total: ______ / ${data.criterios.length * 5}`, startX + colWidths[0] + colWidths[1] + 2, yPos);
      pdf.text('______', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);

      addLogoToFooter(pdf);
      pdf.save(`rubrica-${data.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Rúbrica exportada exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar la rúbrica");
    }
  };

  const handleExportExcel = async () => {
    try {
      const data = JSON.parse(rubric.response);
      
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rúbrica');

      // Configurar márgenes
      worksheet.pageSetup.margins = {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      };

      // Encabezado institucional
      worksheet.mergeCells('A1:D1');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = data.titulo;
      headerCell.font = { bold: true, size: 14 };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      };
      headerCell.font = { bold: true, color: { argb: 'FFFFFF' } };

      // Descripción
      worksheet.mergeCells('A2:D2');
      const descCell = worksheet.getCell('A2');
      descCell.value = data.descripcion;
      descCell.alignment = { wrapText: true };
      descCell.font = { size: 11 };

      // Agregar espacio
      worksheet.addRow([]);

      // Encabezados de la tabla
      const headers = ['Criterio', 'Descripción', 'Escala de Calificación', 'Calificación Obtenida'];
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      };
      headerRow.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      // Configurar anchos de columna
      worksheet.columns = [
        { width: 30 }, // Criterio
        { width: 40 }, // Descripción
        { width: 50 }, // Escala de Calificación
        { width: 20 }  // Calificación Obtenida
      ];

      // Agregar los criterios
      data.criterios.forEach((criterio: any) => {
        const row = worksheet.addRow([
          criterio.nombre,
          criterio.descripcion,
          criterio.escala.map((nivel: any) => 
            `Puntaje ${nivel.puntaje}: ${nivel.descripcion}`
          ).join('\n'),
          '______'
        ]);

        // Aplicar estilos a la fila
        row.eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 11 };
          cell.alignment = {
            vertical: 'top',
            horizontal: 'left',
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E0E0E0' } },
            left: { style: 'thin', color: { argb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
            right: { style: 'thin', color: { argb: 'E0E0E0' } }
          };
        });
      });

      // Agregar espacio
      worksheet.addRow([]);

      // Agregar calificación final
      const finalRow = worksheet.addRow([
        'Calificación Final',
        'Total de puntos obtenidos',
        `Puntaje Total: ______ / ${data.criterios.length * 5}\nNota Final: ______`,
        '______'
      ]);

      // Aplicar estilos a la fila final
      finalRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };
      });

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.titulo}-rubrica.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Rúbrica exportada exitosamente");
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error("Error al exportar la rúbrica");
    }
  };

  const shareRubric = async () => {
    try {
      const rubricData = JSON.parse(rubric.response);
      const shareData = {
        title: rubricData.titulo,
        text: rubricData.descripcion,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(rubric.response);
        toast.success('Rúbrica copiada al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing rubric:', error);
      toast.error('Error al compartir la rúbrica');
    }
  };

  try {
    const rubricData: RubricData = JSON.parse(rubric.response);
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Vista Previa de la Rúbrica</span>
              <div className="flex gap-2">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                  onClick={handleExportPDF}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a PDF
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white"
                  onClick={handleExportExcel}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar a Excel
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={shareRubric}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <RubricContent data={rubricData} />
          </div>
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    console.error('Error parsing rubric:', error);
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error al cargar la rúbrica</DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-red-500">
            <p>No se pudo cargar la rúbrica. Por favor, verifica que el formato sea correcto.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}; 