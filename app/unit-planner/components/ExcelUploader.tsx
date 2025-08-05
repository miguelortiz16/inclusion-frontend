"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileDown } from "lucide-react"
import * as XLSX from "xlsx"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface ExcelUploaderProps {
  onDataMapped: (data: any) => void
  unitData: {
    nombreUnidad: string
    asignatura: string
    detallesUnidad: string
    estandaresObjetivos: string
    numeroLecciones: number
    lecciones?: Array<{
      dia: number
      titulo: string
      inicio?: {
        tema: string
        actividades: string[]
        recursos: string[]
        logros: string[]
      }
      desarrollo?: {
        tema: string
        actividades: string[]
        recursos: string[]
        logros: string[]
      }
      cierre?: {
        tema: string
        actividades: string[]
        recursos: string[]
        logros: string[]
      }
    }>
  }
}

interface FieldMapping {
  excelField: string
  jsonField: string
  section?: string
  coordinates: { row: number; col: number }[]
}

export function ExcelUploader({ onDataMapped, unitData }: ExcelUploaderProps) {
  const [excelData, setExcelData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [isMapping, setIsMapping] = useState(false)
  const [allFields, setAllFields] = useState<string[]>([])
  const [mappedData, setMappedData] = useState<any>(null)

  // Log para verificar los datos recibidos
  useEffect(() => {
    console.log("ExcelUploader - unitData recibido:", unitData)
  }, [unitData])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convertir todo el contenido a JSON con opciones específicas
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '', // valor por defecto para celdas vacías
        blankrows: false // ignorar filas vacías
      }) as any[][]
      
      // Limpiar y estructurar los datos
      const cleanedData = jsonData
        .filter((row: any[]) => row.some((cell: any) => cell !== '')) // Eliminar filas completamente vacías
        .map((row: any[]) => row.map((cell: any) => cell === null ? '' : String(cell).trim())) // Convertir nulls a strings vacíos

      if (cleanedData.length > 0) {
        // Extraer campos únicos del Excel
        const uniqueFields = new Set<string>()
        const fieldCoordinates: { [key: string]: { row: number; col: number }[] } = {}

        // Extraer todos los campos que no estén vacíos
        cleanedData.forEach((row: any, rowIndex: number) => {
          row.forEach((cell: any, colIndex: number) => {
            if (cell && typeof cell === 'string') {
              const field = cell.trim()
              if (field) {
                uniqueFields.add(field)
                if (!fieldCoordinates[field]) {
                  fieldCoordinates[field] = []
                }
                fieldCoordinates[field].push({ row: rowIndex, col: colIndex })
              }
            }
          })
        })

        // Identificar campos de encabezado y columnas
        const headerFields: string[] = []
        const columnFields: string[] = []

        // Asumimos que los campos que aparecen en las primeras filas son encabezados
        // y los que aparecen múltiples veces o en filas posteriores son columnas
        Array.from(uniqueFields).forEach(field => {
          const coordinates = fieldCoordinates[field]
          if (coordinates.length === 1 && coordinates[0].row < 4) {
            headerFields.push(field)
          } else {
            columnFields.push(field)
          }
        })

        console.log('Campos de encabezado encontrados:', headerFields)
        console.log('Campos de columnas encontrados:', columnFields)

        setAllFields(Array.from(uniqueFields))
        setExcelData(cleanedData)
        setIsMapping(true)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleMappingChange = (excelField: string, jsonField: string, section?: string) => {
    console.log("Cambio de mapeo:", { excelField, jsonField, section })
    
    if (!jsonField) {
      // Si no se selecciona un campo, eliminar el mapeo
      setMappings(prev => prev.filter(m => m.excelField !== excelField))
      return
    }

    setMappings(prev => {
      const existing = prev.find(m => m.excelField === excelField)
      if (existing) {
        return prev.map(m => m.excelField === excelField ? { ...m, jsonField, section } : m)
      }
      return [...prev, { excelField, jsonField, section, coordinates: [] }]
    })
  }

  const handleApplyMapping = () => {
    console.log("Iniciando mapeo...")
    console.log("Mappings:", mappings)
    console.log("UnitData:", unitData)

    if (mappings.length === 0) {
      toast.error("Por favor, seleccione al menos un campo para mapear")
      return
    }

    if (!unitData) {
      toast.error("No hay datos de unidad disponibles. Por favor, complete los datos de la unidad primero.")
      return
    }

    // Crear una copia del Excel original con los datos mapeados
    const newExcelData = [...excelData]
    console.log("Excel original:", newExcelData)
    
    // Procesar cada fila del Excel
    for (let i = 0; i < newExcelData.length; i++) {
      const row = newExcelData[i]
      if (!Array.isArray(row)) continue

      // Para cada celda en la fila
      row.forEach((cell: any, colIndex: number) => {
        if (!cell || typeof cell !== 'string') return

        const cellValue = cell.trim()
        if (!cellValue) return

        // Buscar el mapeo para este campo
        const mapping = mappings.find(m => m.excelField === cellValue)
        if (!mapping) return

        console.log(`Procesando campo: ${cellValue} con mapeo:`, mapping)

        try {
          // Aplicar el valor mapeado
          if (mapping.jsonField === 'dia') {
            // Si es un campo de día, buscar todas las lecciones
            if (unitData.lecciones && unitData.lecciones.length > 0) {
              // Crear una nueva fila para cada lección
              const lessonRows = unitData.lecciones.map(lesson => {
                const newRow = [...row]
                newRow[colIndex + 1] = lesson.dia
                return newRow
              })
              
              // Reemplazar la fila actual con las nuevas filas de lecciones
              newExcelData.splice(i, 1, ...lessonRows)
              i += lessonRows.length - 1 // Ajustar el índice para la siguiente iteración
            }
          } else if (mapping.jsonField === 'titulo') {
            // Si es un campo de título, buscar todas las lecciones
            if (unitData.lecciones && unitData.lecciones.length > 0) {
              const lessonRows = unitData.lecciones.map(lesson => {
                const newRow = [...row]
                newRow[colIndex + 1] = lesson.titulo
                return newRow
              })
              
              newExcelData.splice(i, 1, ...lessonRows)
              i += lessonRows.length - 1
            }
          } else if (mapping.section) {
            // Si es una sección (inicio, desarrollo, cierre)
            if (unitData.lecciones && unitData.lecciones.length > 0) {
              const lessonRows = unitData.lecciones.map(lesson => {
                const newRow = [...row]
                const section = lesson[mapping.section as 'inicio' | 'desarrollo' | 'cierre']
                
                if (section) {
                  if (mapping.jsonField === 'tema' && section.tema) {
                    newRow[colIndex + 1] = section.tema
                  } else if (mapping.jsonField === 'actividades' && Array.isArray(section.actividades)) {
                    newRow[colIndex + 1] = section.actividades.join('\n')
                  } else if (mapping.jsonField === 'recursos' && Array.isArray(section.recursos)) {
                    newRow[colIndex + 1] = section.recursos.join('\n')
                  } else if (mapping.jsonField === 'logros' && Array.isArray(section.logros)) {
                    newRow[colIndex + 1] = section.logros.join('\n')
                  }
                }
                return newRow
              })
              
              newExcelData.splice(i, 1, ...lessonRows)
              i += lessonRows.length - 1
            }
          } else {
            // Datos generales
            const value = unitData[mapping.jsonField as keyof typeof unitData]
            if (value !== undefined) {
              row[colIndex + 1] = value
            }
          }
        } catch (error) {
          console.error(`Error al mapear el campo ${cellValue}:`, error)
          row[colIndex + 1] = cell
        }
      })
    }

    console.log("Excel mapeado:", newExcelData)
    setMappedData(newExcelData)
    onDataMapped(newExcelData)
    toast.success("Datos mapeados exitosamente")
  }

  const handleDownloadExcel = async () => {
    if (!mappedData) {
      toast.error("No hay datos mapeados para descargar")
      return
    }

    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "Education Frontend"
      workbook.lastModifiedBy = "Education Frontend"
      workbook.created = new Date()
      workbook.modified = new Date()

      const worksheet = workbook.addWorksheet("Planeador de Clases")
      
      // Configurar estilos
      const headerStyle = {
        font: { bold: true, size: 12 },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFE0E0E0' }
        }
      }

      // Configurar el formato de la hoja
      worksheet.properties.defaultRowHeight = 25
      worksheet.properties.defaultColWidth = 20

      // Agregar título principal
      worksheet.mergeCells('A1:G1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'PLANEADOR DE CLASES'
      titleCell.style = headerStyle

      // Agregar encabezados de información
      worksheet.mergeCells('A2:B2')
      worksheet.getCell('A2').value = 'DOCENTE:'
      worksheet.mergeCells('C2:D2')
      worksheet.getCell('C2').value = unitData.asignatura || ''
      worksheet.mergeCells('E2:F2')
      worksheet.getCell('E2').value = 'COLEGIO:'

      worksheet.mergeCells('A3:B3')
      worksheet.getCell('A3').value = 'ASIGNATURA:'
      worksheet.mergeCells('C3:D3')
      worksheet.getCell('C3').value = unitData.asignatura || ''
      worksheet.mergeCells('E3:F3')
      worksheet.getCell('E3').value = 'CURSO:'

      // Agregar encabezados de columnas
      const columnHeaders = ['Fecha', 'Tema', 'Actividades', 'Recursos', 'Tiempo', 'Evaluación', 'Logros']
      const headerRow = worksheet.addRow(columnHeaders)
      headerRow.eachCell((cell) => {
        cell.style = headerStyle
      })

      // Agregar datos de las lecciones
      if (unitData.lecciones) {
        unitData.lecciones.forEach((leccion, index) => {
          const row = worksheet.addRow([
            leccion.dia,
            leccion.titulo,
            leccion.inicio?.actividades.join('\n') || '',
            leccion.inicio?.recursos.join('\n') || '',
            '', // Tiempo
            '', // Evaluación
            leccion.inicio?.logros.join('\n') || ''
          ])

          // Aplicar estilos a la fila
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' as const },
              left: { style: 'thin' as const },
              bottom: { style: 'thin' as const },
              right: { style: 'thin' as const }
            }
            cell.alignment = { vertical: 'middle' as const, wrapText: true }
          })
        })
      }

      // Ajustar ancho de columnas
      worksheet.columns.forEach(column => {
        column.width = 20
      })

      // Guardar el archivo
      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), "planeador_de_clases.xlsx")
      toast.success("Excel descargado exitosamente")
    } catch (error) {
      console.error("Error al generar el Excel:", error)
      toast.error("Error al generar el archivo Excel")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="excel-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click para subir</span> o arrastra y suelta
            </p>
            <p className="text-xs text-gray-500">Excel (.xlsx)</p>
          </div>
          <input
            id="excel-upload"
            type="file"
            className="hidden"
            accept=".xlsx"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {isMapping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mapeo de Campos</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Encabezados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFields.filter(field => {
                  const coordinates = excelData.findIndex(row => row.includes(field))
                  return coordinates < 4 && coordinates >= 0
                }).map((field) => {
                  // Determinar qué opciones mostrar según el campo
                  let options = []
                  if (field.toLowerCase().includes('planeador')) {
                    options = [{ value: 'nombreUnidad', label: 'Nombre de la Unidad' }]
                  } else if (field.toLowerCase().includes('docente')) {
                    options = [{ value: 'docente', label: 'Docente' }]
                  } else if (field.toLowerCase().includes('asignatura')) {
                    options = [{ value: 'asignatura', label: 'Asignatura' }]
                  } else if (field.toLowerCase().includes('colegio')) {
                    options = [{ value: 'colegio', label: 'Colegio' }]
                  } else if (field.toLowerCase().includes('curso')) {
                    options = [{ value: 'curso', label: 'Curso' }]
                  } else {
                    options = [
                      { value: 'nombreUnidad', label: 'Nombre de la Unidad' },
                      { value: 'asignatura', label: 'Asignatura' },
                      { value: 'detallesUnidad', label: 'Detalles de la Unidad' },
                      { value: 'estandaresObjetivos', label: 'Estándares y Objetivos' }
                    ]
                  }

                  return (
                    <div key={field} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-600 w-1/3">{field}</span>
                      <select
                        className="flex-1 p-2 border rounded-md"
                        onChange={(e) => handleMappingChange(field, e.target.value)}
                      >
                        <option value="">Seleccione campo</option>
                        {options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Columnas de Lecciones</h4>
              <div className="grid grid-cols-1 gap-4">
                {allFields.filter(field => {
                  const coordinates = excelData.findIndex(row => row.includes(field))
                  return coordinates >= 4 || excelData.filter(row => row.includes(field)).length > 1
                }).map((field) => {
                  // Determinar qué opciones mostrar según el campo
                  let options = []
                  if (field.toLowerCase().includes('fecha')) {
                    options = [{ value: 'dia', label: 'Día de la Lección' }]
                  } else if (field.toLowerCase().includes('tema')) {
                    options = [
                      { value: 'titulo', label: 'Título de la Lección' },
                      { value: 'tema|inicio', label: 'Tema - Inicio' },
                      { value: 'tema|desarrollo', label: 'Tema - Desarrollo' },
                      { value: 'tema|cierre', label: 'Tema - Cierre' }
                    ]
                  } else if (field.toLowerCase().includes('actividad')) {
                    options = [
                      { value: 'actividades|inicio', label: 'Actividades - Inicio' },
                      { value: 'actividades|desarrollo', label: 'Actividades - Desarrollo' },
                      { value: 'actividades|cierre', label: 'Actividades - Cierre' }
                    ]
                  } else if (field.toLowerCase().includes('recurso')) {
                    options = [
                      { value: 'recursos|inicio', label: 'Recursos - Inicio' },
                      { value: 'recursos|desarrollo', label: 'Recursos - Desarrollo' },
                      { value: 'recursos|cierre', label: 'Recursos - Cierre' }
                    ]
                  } else if (field.toLowerCase().includes('tiempo')) {
                    options = [{ value: 'tiempo', label: 'Tiempo' }]
                  } else if (field.toLowerCase().includes('evaluacion') || field.toLowerCase().includes('evaluación')) {
                    options = [{ value: 'evaluacion', label: 'Evaluación' }]
                  } else if (field.toLowerCase().includes('logro')) {
                    options = [
                      { value: 'logros|inicio', label: 'Logros - Inicio' },
                      { value: 'logros|desarrollo', label: 'Logros - Desarrollo' },
                      { value: 'logros|cierre', label: 'Logros - Cierre' }
                    ]
                  } else {
                    // Opciones por defecto si no se reconoce el campo
                    options = [
                      { value: 'dia', label: 'Día de la Lección' },
                      { value: 'titulo', label: 'Título de la Lección' },
                      { value: 'tema|inicio', label: 'Tema - Inicio' },
                      { value: 'tema|desarrollo', label: 'Tema - Desarrollo' },
                      { value: 'tema|cierre', label: 'Tema - Cierre' },
                      { value: 'actividades|inicio', label: 'Actividades - Inicio' },
                      { value: 'actividades|desarrollo', label: 'Actividades - Desarrollo' },
                      { value: 'actividades|cierre', label: 'Actividades - Cierre' },
                      { value: 'recursos|inicio', label: 'Recursos - Inicio' },
                      { value: 'recursos|desarrollo', label: 'Recursos - Desarrollo' },
                      { value: 'recursos|cierre', label: 'Recursos - Cierre' },
                      { value: 'logros|inicio', label: 'Logros - Inicio' },
                      { value: 'logros|desarrollo', label: 'Logros - Desarrollo' },
                      { value: 'logros|cierre', label: 'Logros - Cierre' }
                    ]
                  }

                  return (
                    <div key={field} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-600 w-1/3">{field}</span>
                      <select
                        className="flex-1 p-2 border rounded-md"
                        onChange={(e) => {
                          const [jsonField, section] = e.target.value.split('|')
                          handleMappingChange(field, jsonField, section)
                        }}
                      >
                        <option value="">Seleccione campo</option>
                        {options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
              onClick={handleApplyMapping}
            >
              Aplicar Mapeo
            </Button>
            {mappedData && (
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white"
                onClick={handleDownloadExcel}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Descargar Excel Mapeado
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
} 