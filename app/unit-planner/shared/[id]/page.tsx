'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Unidad, Leccion } from '../../../../types/unit'
import { motion } from 'framer-motion'
import { Calendar, CloudCog, GraduationCap, BrainCircuit, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FaShare, FaWhatsapp } from 'react-icons/fa'
import ExcelJS from 'exceljs'
import Link from 'next/link'

function LessonDetailsModal({
  lesson,
  allLessons,
  onClose,
  onNextLesson,
}: {
  lesson: Leccion
  allLessons: Leccion[]
  onClose: () => void
  onNextLesson: (nextDay: number) => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Día {lesson.dia}: {lesson.titulo}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Inicio */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Inicio</h3>
            <p className="text-gray-700">{lesson.inicio.tema}</p>
            <div className="mt-3">
              <h4 className="font-medium text-blue-600 mb-1">Actividades:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.inicio.actividades.map((actividad, index) => (
                  <li key={index} className="text-gray-600">{parseActivity(actividad)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-blue-600 mb-1">Recursos:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.inicio.recursos.map((recurso, index) => (
                  <li key={index} className="text-gray-600">{recurso}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-blue-600 mb-1">Logros:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.inicio.logros.map((logro, index) => (
                  <li key={index} className="text-gray-600">{logro}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Desarrollo */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-700 mb-2">Desarrollo</h3>
            <p className="text-gray-700">{lesson.desarrollo.tema}</p>
            <div className="mt-3">
              <h4 className="font-medium text-purple-600 mb-1">Actividades:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.desarrollo.actividades.map((actividad, index) => (
                  <li key={index} className="text-gray-600">{parseActivity(actividad)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-purple-600 mb-1">Recursos:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.desarrollo.recursos.map((recurso, index) => (
                  <li key={index} className="text-gray-600">{recurso}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-purple-600 mb-1">Logros:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.desarrollo.logros.map((logro, index) => (
                  <li key={index} className="text-gray-600">{logro}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cierre */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700 mb-2">Cierre</h3>
            <p className="text-gray-700">{lesson.cierre.tema}</p>
            <div className="mt-3">
              <h4 className="font-medium text-green-600 mb-1">Actividades:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.cierre.actividades.map((actividad, index) => (
                  <li key={index} className="text-gray-600">{parseActivity(actividad)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-green-600 mb-1">Recursos:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.cierre.recursos.map((recurso, index) => (
                  <li key={index} className="text-gray-600">{recurso}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-green-600 mb-1">Logros:</h4>
              <ul className="list-disc list-inside space-y-1">
                {lesson.cierre.logros.map((logro, index) => (
                  <li key={index} className="text-gray-600">{logro}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => onNextLesson(lesson.dia - 1)}
            disabled={lesson.dia === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => onNextLesson(lesson.dia + 1)}
            disabled={lesson.dia === allLessons.length}
          >
            Siguiente
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

const parseActivity = (activity: string) => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(activity);
    // If it's an object with descripcion, return a formatted string
    if (parsed.descripcion) {
      // If it's just a description, return it directly
      if (Object.keys(parsed).length === 1) {
        return parsed.descripcion;
      }
      // Otherwise format with additional fields
      return `${parsed.descripcion}${parsed.tiempoEstimado ? ` (${parsed.tiempoEstimado})` : ''}${parsed.formato ? ` - ${parsed.formato}` : ''}${parsed.materiales ? ` - Materiales: ${parsed.materiales}` : ''}`;
    }
    return activity;
  } catch {
    // If it's not valid JSON, return the original string
    return activity;
  }
};

export default function SharedUnitView() {
  const params = useParams()
  const id = params?.id as string
  const [unitData, setUnitData] = useState<Unidad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const handleDownload = async (format: 'pdf' | 'word' | 'excel') => {
    try {
      if (format === 'excel') {
        if (!unitData) return;

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plan de Clase');

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
        worksheet.mergeCells('A1:H1');
        const headerCell = worksheet.getCell('A1');
        headerCell.value = 'PLAN DE CLASE';
        headerCell.font = { bold: true, size: 14 };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
        headerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0066CC' }
        };
        headerCell.font = { bold: true, color: { argb: 'FFFFFF' } };

        // Información general
        worksheet.mergeCells('A2:B2');
        worksheet.getCell('A2').value = 'INSTITUCIÓN EDUCATIVA:';
        worksheet.getCell('A2').font = { bold: true };
        worksheet.mergeCells('C2:H2');
        worksheet.getCell('C2').value = 'Nombre de la Institución';

        worksheet.mergeCells('A3:B3');
        worksheet.getCell('A3').value = 'ÁREA:';
        worksheet.getCell('A3').font = { bold: true };
        worksheet.mergeCells('C3:H3');
        worksheet.getCell('C3').value = unitData.asignatura;

        worksheet.mergeCells('A4:B4');
        worksheet.getCell('A4').value = 'GRADO:';
        worksheet.getCell('A4').font = { bold: true };
        worksheet.mergeCells('C4:H4');
        worksheet.getCell('C4').value = unitData.nivelEducativo || 'No especificado';

        worksheet.mergeCells('A5:B5');
        worksheet.getCell('A5').value = 'CLASE:';
        worksheet.getCell('A5').font = { bold: true };
        worksheet.mergeCells('C5:H5');
        worksheet.getCell('C5').value = unitData.nombreUnidad;

        // Configurar anchos de columna
        worksheet.columns = [
          { width: 8 },  // DÍA
          { width: 30 }, // TEMA
          { width: 40 }, // ACTIVIDADES DE INICIO
          { width: 40 }, // ACTIVIDADES DE DESARROLLO
          { width: 40 }, // ACTIVIDADES DE CIERRE
          { width: 30 }, // RECURSOS
          { width: 30 }, // LOGROS ESPERADOS
          { width: 20 }  // EVALUACIÓN
        ];

        // Agregar los datos de las lecciones
        unitData.lecciones.forEach(lesson => {
          // Crear la fila con los datos
          const row = worksheet.addRow([
            lesson.dia,
            lesson.titulo,
            lesson.inicio.actividades.join('\n'),
            lesson.desarrollo.actividades.join('\n'),
            lesson.cierre.actividades.join('\n'),
            [
              ...lesson.inicio.recursos,
              ...lesson.desarrollo.recursos,
              ...lesson.cierre.recursos
            ].join('\n'),
            [
              ...lesson.inicio.logros,
              ...lesson.desarrollo.logros,
              ...lesson.cierre.logros
            ].join('\n'),
            'Observación directa'
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

        // Agregar pie de página
        worksheet.addRow([]);
        worksheet.addRow([]);
        worksheet.mergeCells('A' + (worksheet.rowCount - 1) + ':H' + (worksheet.rowCount - 1));
        const footerCell = worksheet.getCell('A' + (worksheet.rowCount - 1));
        footerCell.value = 'Observaciones:';
        footerCell.font = { bold: true };
        footerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };
        footerCell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        };

        // Agregar espacio para observaciones
        worksheet.addRow([]);
        worksheet.mergeCells('A' + (worksheet.rowCount) + ':H' + (worksheet.rowCount));
        const observationsCell = worksheet.getCell('A' + (worksheet.rowCount));
        observationsCell.value = '________________________________________________________________________________________________';
        observationsCell.font = { color: { argb: '808080' } };

        // Generar el archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${unitData.nombreUnidad}-plan-clase.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'word') {
        if (!unitData) return;

        try {
          // Crear el contenido HTML para el documento Word
          const content = `
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Plan de Clase - ${unitData.nombreUnidad}</title>
                <style>
                  body { font-family: Arial, sans-serif; }
                  h1 { color: #0066CC; }
                  h2 { color: #0066CC; }
                  .section { margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <h1 style="text-align: center;">PLAN DE CLASE</h1>
                
                <div class="section">
                  <h2>Información General</h2>
                  <p><strong>Institución Educativa:</strong> Nombre de la Institución</p>
                  <p><strong>Área:</strong> ${unitData.asignatura}</p>
                  <p><strong>Grado:</strong> ${unitData.nivelEducativo || 'No especificado'}</p>
                  <p><strong>Clase:</strong> ${unitData.nombreUnidad}</p>
                  ${unitData.methodology ? `<p><strong>Metodología:</strong> ${unitData.methodology.replace("Usa la siguiente metodología como base: ", "")}</p>` : ''}
                </div>

                <div class="section">
                  <h2>Detalles de la Clase</h2>
                  <p>${unitData.detallesUnidad}</p>
                </div>

                <div class="section">
                  <h2>Estándares y Objetivos</h2>
                  <p>${unitData.estandaresObjetivos}</p>
                </div>

                <div class="section">
                  <h2>Lecciones</h2>
                  ${unitData.lecciones.map(lesson => `
                    <div style="margin-bottom: 30px;">
                      <h3>Día ${lesson.dia} - ${lesson.titulo}</h3>
                      
                      <h4>Inicio</h4>
                      <p><strong>Tema:</strong> ${lesson.inicio.tema}</p>
                      <p><strong>Actividades:</strong></p>
                      <ul>
                        ${lesson.inicio.actividades.map(act => `<li>${parseActivity(act)}</li>`).join('')}
                      </ul>
                      <p><strong>Recursos:</strong></p>
                      <ul>
                        ${lesson.inicio.recursos.map(rec => `<li>${rec}</li>`).join('')}
                      </ul>
                      <p><strong>Logros:</strong></p>
                      <ul>
                        ${lesson.inicio.logros.map(log => `<li>${log}</li>`).join('')}
                      </ul>

                      <h4>Desarrollo</h4>
                      <p><strong>Tema:</strong> ${lesson.desarrollo.tema}</p>
                      <p><strong>Actividades:</strong></p>
                      <ul>
                        ${lesson.desarrollo.actividades.map(act => `<li>${parseActivity(act)}</li>`).join('')}
                      </ul>
                      <p><strong>Recursos:</strong></p>
                      <ul>
                        ${lesson.desarrollo.recursos.map(rec => `<li>${rec}</li>`).join('')}
                      </ul>
                      <p><strong>Logros:</strong></p>
                      <ul>
                        ${lesson.desarrollo.logros.map(log => `<li>${log}</li>`).join('')}
                      </ul>

                      <h4>Cierre</h4>
                      <p><strong>Tema:</strong> ${lesson.cierre.tema}</p>
                      <p><strong>Actividades:</strong></p>
                      <ul>
                        ${lesson.cierre.actividades.map(act => `<li>${parseActivity(act)}</li>`).join('')}
                      </ul>
                      <p><strong>Recursos:</strong></p>
                      <ul>
                        ${lesson.cierre.recursos.map(rec => `<li>${rec}</li>`).join('')}
                      </ul>
                      <p><strong>Logros:</strong></p>
                      <ul>
                        ${lesson.cierre.logros.map(log => `<li>${log}</li>`).join('')}
                      </ul>
                    </div>
                  `).join('')}
                </div>

                <div class="section">
                  <h2>Observaciones</h2>
                  <p>________________________________________________________________________________________________</p>
                </div>
              </body>
            </html>
          `;

          // Crear un blob con el contenido HTML
          const blob = new Blob([content], { type: 'application/msword' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${unitData.nombreUnidad.replace(/\s+/g, '_')}.doc`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error('Error al exportar a Word:', error);
          alert('Error al exportar a Word. Por favor, intente nuevamente.');
        }
      } else {
        const response = await fetch(`/api/unit-planner/export/${id}?format=${format}`);
        if (!response.ok) {
          throw new Error('Error al descargar el archivo');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${unitData?.nombreUnidad || 'unidad'}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el archivo');
    }
  }

  useEffect(() => {
    const fetchUnitData = async () => {
      if (!id) {
        setError('No unit ID provided')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching unit data for ID:', id)
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/get-unit/${id}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || 'Failed to fetch unit data')
        }

        const data = await response.json()
        console.log('Received unit data:', data)
        setUnitData(data)
      } catch (err) {
        console.error('Error fetching unit:', err)
        setError(err instanceof Error ? err.message : 'Error loading unit data')
      } finally {
        setLoading(false)
      }
    }

    fetchUnitData()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!unitData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Not Found</h2>
          <p className="text-yellow-600">The requested unit could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-2 sm:p-4 md:p-6"
    >
      {/* Encabezado principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-blue-600 mb-2">{unitData.nombreUnidad}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-sm sm:text-base text-gray-600"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <span>{unitData.numeroLecciones} Lecciones</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-sm sm:text-base text-gray-600"
              >
                <CloudCog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <span>{unitData.asignatura}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-sm sm:text-base text-gray-600"
              >
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <span>{unitData?.nivelEducativo}</span>
              </motion.div>
              {unitData?.methodology && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-sm sm:text-base text-gray-600"
                >
                  <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                  <span>{unitData.methodology.replace("Usa la siguiente metodología como base: ", "")}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs sm:text-sm text-gray-500">Estado:</span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800"
            >
              Activo
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* Botones de descarga y compartir */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap gap-3 mb-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex gap-3"
        >
          <Button
            onClick={() => handleDownload('word')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Word
          </Button>
          <Button
            onClick={() => handleDownload('excel')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Excel
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex gap-3 ml-auto"
        >
          <Button
            onClick={() => {
              window.location.href = '/sign-in';
            }}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Iniciar Sesión
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/sign-up';
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Registrarse
          </Button>
        </motion.div>
      </motion.div>

      {/* Sección de Detalles y Estándares */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6"
      >
        {/* Detalles de la Unidad */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                transition: { duration: 2, repeat: Infinity }
              }}
              className="w-1 h-4 sm:h-5 bg-blue-500 rounded-full mr-2 sm:mr-3"
            ></motion.div>
            <h2 className="text-lg sm:text-xl font-medium text-blue-500">Detalles de la Unidad</h2>
          </div>
          <div className="prose prose-base max-w-none">
            <p className="text-sm sm:text-base text-gray-700">{unitData.detallesUnidad}</p>
          </div>
        </motion.div>

        {/* Estándares y Objetivos */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                transition: { duration: 2, repeat: Infinity }
              }}
              className="w-1 h-4 sm:h-5 bg-purple-500 rounded-full mr-2 sm:mr-3"
            ></motion.div>
            <h2 className="text-lg sm:text-xl font-medium text-purple-500">Estándares y Objetivos</h2>
          </div>
          <div className="prose prose-base max-w-none">
            <p className="text-sm sm:text-base text-gray-700">{unitData.estandaresObjetivos}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Lista de Lecciones */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-4 sm:mb-6"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-display font-semibold text-gray-700 mb-3 sm:mb-4">Plan de Clases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {unitData.lecciones.map((lesson: Leccion, index: number) => (
            <motion.div
              key={lesson.dia}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                    <span className="text-sm sm:text-base font-medium text-gray-700">Día {lesson.dia}</span>
                  </motion.div>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="px-2 py-1 text-sm font-medium bg-blue-50 text-blue-600 rounded-full"
                  >
                    {lesson.fecha || 'Sin fecha'}
                  </motion.span>
                </div>
                <motion.h3 
                  whileHover={{ x: 5 }}
                  className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3"
                >
                  {lesson.titulo}
                </motion.h3>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col gap-2"
                >
                  <Button
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700 text-sm sm:text-base"
                    onClick={() => setSelectedDay(lesson.dia)}
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Ver Detalles
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {selectedDay && (
        <LessonDetailsModal
          lesson={unitData.lecciones.find((l) => l.dia === selectedDay)!}
          allLessons={unitData.lecciones}
          onClose={() => setSelectedDay(null)}
          onNextLesson={(nextDay) => setSelectedDay(nextDay)}
        />
      )}
    </motion.div>
  )
} 