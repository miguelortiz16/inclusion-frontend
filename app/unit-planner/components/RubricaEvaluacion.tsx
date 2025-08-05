"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileDown, FileText, Share2 } from "lucide-react"
import { toast } from "sonner"
import jsPDF from 'jspdf'
import ExcelJS from "exceljs"
import { addLogoToFooter } from '@/utils/pdf-utils'

interface Criterio {
  nombre: string
  excelente: string
  bueno: string
  regular: string
  necesitaMejora: string
}

interface RubricaData {
  titulo: string
  descripcion: string
  criterios: Criterio[]
}

export function RubricaEvaluacion({ lesson }: { lesson: any }) {
  const [rubrica, setRubrica] = useState<RubricaData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateRubrica = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/rubrica/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: lesson.nivelEducativo,
          subject: lesson.asignatura,
          theme: lesson.titulo,
          name: lesson.nombreEstudiante || "Estudiante",
          email: localStorage.getItem("email"),
          public: false
        }),
      })

      if (!response.ok) {
        throw new Error('Error al generar la rúbrica')
      }

      const data = await response.json()
      setRubrica(data)
      toast.success('Rúbrica generada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar la rúbrica')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!rubrica) return

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const marginLeft = 10
      const marginRight = 10
      const marginTop = 10
      const pageWidth = 297 // Ancho A4 landscape
      const pageHeight = 210 // Alto A4 landscape
      const contentWidth = pageWidth - marginLeft - marginRight

      const styles = {
        header: { fontSize: 14, fontStyle: 'bold' },
        subheader: { fontSize: 10, fontStyle: 'bold' },
        normal: { fontSize: 8, fontStyle: 'normal' },
        small: { fontSize: 7, fontStyle: 'normal' }
      }

      // Título
      pdf.setFont('helvetica', styles.header.fontStyle)
      pdf.setFontSize(styles.header.fontSize)
      const title = rubrica.titulo
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor
      const titleX = (pageWidth - titleWidth) / 2
      pdf.text(title, titleX, marginTop)

      // Descripción
      let yPos = marginTop + 10
      pdf.setFont('helvetica', styles.normal.fontStyle)
      pdf.setFontSize(styles.normal.fontSize)
      const descLines = pdf.splitTextToSize(rubrica.descripcion, contentWidth)
      pdf.text(descLines, marginLeft, yPos)
      yPos += descLines.length * 4 + 8

      // Definir anchos de columnas
      const colWidths = [50, 70, 120, 30]
      const startX = marginLeft

      // Criterios
      rubrica.criterios.forEach((criterio: any) => {
        if (yPos + 40 > pageHeight - marginTop) {
          pdf.addPage('landscape')
          yPos = marginTop
        }

        // Encabezado de la tabla
        pdf.setFont('helvetica', styles.subheader.fontStyle)
        pdf.setFontSize(styles.subheader.fontSize)
        
        // Dibujar bordes de la tabla
        pdf.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 8)
        pdf.text('Criterio', startX + 2, yPos)
        pdf.text('Descripción', startX + colWidths[0] + 2, yPos)
        pdf.text('Escala de Calificación', startX + colWidths[0] + colWidths[1] + 2, yPos)
        pdf.text('Calificación', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos)
        yPos += 8

        // Contenido del criterio
        pdf.setFont('helvetica', styles.normal.fontStyle)
        pdf.setFontSize(styles.normal.fontSize)
        
        // Calcular altura necesaria para la fila
        const criterioLines = pdf.splitTextToSize(criterio.nombre, colWidths[0] - 4)
        const descLines = pdf.splitTextToSize(criterio.descripcion, colWidths[1] - 4)
        const escalaText = criterio.escala.map((nivel: any) => 
          `Puntaje ${nivel.puntaje}: ${nivel.descripcion}`
        ).join('\n')
        const escalaLines = pdf.splitTextToSize(escalaText, colWidths[2] - 4)
        const rowHeight = Math.max(criterioLines.length, descLines.length, escalaLines.length) * 4 + 4

        // Dibujar bordes de la celda
        pdf.rect(startX, yPos - 4, colWidths[0], rowHeight)
        pdf.rect(startX + colWidths[0], yPos - 4, colWidths[1], rowHeight)
        pdf.rect(startX + colWidths[0] + colWidths[1], yPos - 4, colWidths[2], rowHeight)
        pdf.rect(startX + colWidths[0] + colWidths[1] + colWidths[2], yPos - 4, colWidths[3], rowHeight)
        
        // Nombre del criterio
        pdf.text(criterioLines, startX + 2, yPos)
        
        // Descripción
        pdf.text(descLines, startX + colWidths[0] + 2, yPos)
        
        // Escala
        pdf.text(escalaLines, startX + colWidths[0] + colWidths[1] + 2, yPos)
        
        // Espacio para calificación
        pdf.text('______', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos)
        
        yPos += rowHeight + 2
      })

      addLogoToFooter(pdf)
      pdf.save(`rubrica-${lesson.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      toast.success("Rúbrica exportada exitosamente")
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error("Error al exportar la rúbrica")
    }
  }

  const handleExportExcel = async () => {
    if (!rubrica) return

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Rúbrica')

      // Configurar márgenes
      worksheet.pageSetup.margins = {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }

      // Encabezado institucional
      worksheet.mergeCells('A1:D1')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = rubrica.titulo
      headerCell.font = { bold: true, size: 14 }
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      }
      headerCell.font = { bold: true, color: { argb: 'FFFFFF' } }

      // Descripción
      worksheet.mergeCells('A2:D2')
      const descCell = worksheet.getCell('A2')
      descCell.value = rubrica.descripcion
      descCell.alignment = { wrapText: true }
      descCell.font = { size: 11 }

      // Agregar espacio
      worksheet.addRow([])

      // Encabezados de la tabla
      const headers = ['Criterio', 'Descripción', 'Escala de Calificación', 'Calificación Obtenida']
      const headerRow = worksheet.addRow(headers)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      }
      headerRow.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      }

      // Configurar anchos de columna
      worksheet.columns = [
        { width: 30 }, // Criterio
        { width: 40 }, // Descripción
        { width: 50 }, // Escala de Calificación
        { width: 20 }  // Calificación Obtenida
      ]

      // Agregar los criterios
      rubrica.criterios.forEach((criterio: any) => {
        const row = worksheet.addRow([
          criterio.nombre,
          criterio.descripcion,
          criterio.escala.map((nivel: any) => 
            `Puntaje ${nivel.puntaje}: ${nivel.descripcion}`
          ).join('\n'),
          '______'
        ])

        // Aplicar estilos a la fila
        row.eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 11 }
          cell.alignment = {
            vertical: 'top',
            horizontal: 'left',
            wrapText: true
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'E0E0E0' } },
            left: { style: 'thin', color: { argb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
            right: { style: 'thin', color: { argb: 'E0E0E0' } }
          }
        })
      })

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${lesson.titulo}-rubrica.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success("Rúbrica exportada exitosamente")
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      toast.error("Error al exportar la rúbrica")
    }
  }

  const shareRubrica = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Rúbrica de Evaluación - ${lesson.titulo}`,
          text: JSON.stringify(rubrica, null, 2),
        })
      } else {
        await navigator.clipboard.writeText(JSON.stringify(rubrica, null, 2))
        toast.success("Rúbrica copiada al portapapeles")
      }
    } catch (error) {
      console.error('Error al compartir:', error)
      toast.error("Error al compartir la rúbrica")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rúbrica de Evaluación</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateRubrica}
            disabled={isLoading}
          >
            {isLoading ? "Generando..." : "Generar Rúbrica"}
          </Button>
        </div>
      </div>

      {rubrica ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h4 className="text-xl font-bold mb-4">{rubrica.titulo}</h4>
            <p className="text-gray-600 mb-6">{rubrica.descripcion}</p>

            <div className="space-y-6">
              {rubrica.criterios.map((criterio, index) => (
                <div key={index} className="border-t pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left w-1/5">Criterio</th>
                          <th className="border p-2 text-left w-1/4">Descripción</th>
                          <th className="border p-2 text-left w-2/5">Escala de Calificación</th>
                          <th className="border p-2 text-center w-1/5">Calificación Obtenida</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-semibold">{criterio.nombre}</td>
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
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
              onClick={exportToPDF}
            >
              <FileDown className="w-4 h-4" />
              Exportar a PDF
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
              onClick={handleExportExcel}
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={shareRubrica}
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
          <p className="text-center mb-2">No hay rúbrica generada</p>
          <p className="text-center text-sm">
            Haz clic en "Generar Rúbrica" para crear una rúbrica de evaluación para esta lección.
          </p>
        </div>
      )}
    </div>
  )
} 