"use client"

import { useState, useEffect, useRef } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, CloudCog, Eye, FileDown, FileText,GraduationCap, BrainCircuit, FileQuestion, Share2, LightbulbIcon, HelpCircle, ThumbsUp, ThumbsDown, BookOpen, Target, Award, Activity, Lightbulb, X, ListOrdered, MessageSquare, AlertCircle, FileSpreadsheet, ClipboardList, Trash2, Settings2, Loader2, Wand2, Globe, Rocket, Presentation, Youtube } from "lucide-react"
import Link from "next/link"
import { API_ENDPOINTS } from "@/config/api"
import { useRouter } from 'next/navigation'
import ExcelJS from 'exceljs'
import { toast } from "sonner"
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { WorkshopPreview } from "@/components/workshop-preview"
import { useLanguage } from '@/app/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FaShare, FaWhatsapp } from 'react-icons/fa'
import { PlanningAssistantChat } from './components/PlanningAssistantChat'
import jsPDF from 'jspdf'
import { addLogoToFooter } from '@/utils/pdf-utils'
import * as XLSX from 'xlsx'
import * as docx from 'docx'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ImageIcon } from "lucide-react"
import pptxgen from "pptxgenjs"
import { DUAModal } from "@/app/components/DUAModal"
import { NetworkIcon } from "lucide-react"
import { ConceptMapModal } from "@/app/components/ConceptMapModal"
import { PricingModal } from "@/components/pricing-modal"
interface Leccion {
  dia: number
  fecha: string | null
  titulo: string
  evaluacion?: string
  inicio: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
    evidencia?: {
      saber: string
      saberHacer: string
      ser: string
    }
  }
  desarrollo: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
    evidencia?: {
      saber: string
      saberHacer: string
      ser: string
    }
  }
  cierre: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
    evidencia?: {
      saber: string
      saberHacer: string
      ser: string
    }
  }
}

interface Unidad {
  _id: string
  id: string
  nombreUnidad: string
  titulo: string
  descripcion: string
  nivelEducativo: string
  grade: string
  asignatura: string
  detallesUnidad: string
  estandaresObjetivos: string
  numeroLecciones: number
  email: string
  lecciones: Leccion[]
  methodology: string
}

interface Slide {
  title: string
  content: string
}

// Add this function before the UnitPlannerView component
const parseActivity = (activity: string) => {
  try {
    // If the activity is already a JSON string, parse it
    if (activity.startsWith('{')) {
      const parsed = JSON.parse(activity);
      let result = parsed.descripcion;
      
      // Crear un array para almacenar los detalles
      const details = [];
      
      // Agregar tiempo estimado si existe
      if (parsed.tiempoEstimado) {
        details.push(`${parsed.tiempoEstimado}`);
      }
      
      // Agregar formato si existe
      if (parsed.formato) {
        details.push(`${parsed.formato}`);
      }
      

      
      // Si hay detalles, agregarlos en una nueva línea con sangría
      if (details.length > 0) {
        result += '\n' + details.map(detail => `  ${detail}`).join('\n');
      }
      
      return result;
    }
    // If it's not a JSON string, return as is
    return activity;
  } catch (e) {
    // If parsing fails, return the original string
    return activity;
  }
};

export default function UnitPlannerView() {
  const router = useRouter()
  const { t } = useLanguage()
  const [unitData, setUnitData] = useState<Unidad | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showRubricDialog, setShowRubricDialog] = useState(false)
  const [rubricData, setRubricData] = useState<any>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestMadeRef = useRef(false)
  const { showPointsNotification } = usePoints()
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showWordSearchDialog, setShowWordSearchDialog] = useState(false)
  const [isGeneratingWordSearch, setIsGeneratingWordSearch] = useState(false)
  const [wordSearchData, setWordSearchData] = useState<any>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackTimer, setFeedbackTimer] = useState<NodeJS.Timeout | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [showAssistantChat, setShowAssistantChat] = useState(false)
  const [showUpdateAlert, setShowUpdateAlert] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [editingLesson, setEditingLesson] = useState<number | null>(null)
  const [showDateSuccessDialog, setShowDateSuccessDialog] = useState(false)
  const [showDatesDialog, setShowDatesDialog] = useState(false)
  const [showSlidesDialog, setShowSlidesDialog] = useState(false)
  const [slidesForm, setSlidesForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false,
    slideCount: '10',
    primaryColor: '#1a73e8',
    secondaryColor: '#4285f4',
    textColor: '#202124',
    prompt: ''
  })
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false)
  const [generatedSlides, setGeneratedSlides] = useState([])
  const [showSlidesDownloadModal, setShowSlidesDownloadModal] = useState(false)
  const [showDatesPreviewModal, setShowDatesPreviewModal] = useState(false)
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false)
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('')
  const [youtubeResults, setYoutubeResults] = useState<any[]>([])
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [showConceptMapDialog, setShowConceptMapDialog] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const validateAccess = async (email: string) => {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/validate-access?email=${email}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error validando acceso:', error)
      return { allowed: true, message: 'Error al validar el acceso' }
    }
  }
  useEffect(() => {
    const fetchUnitData = async () => {
      if (requestMadeRef.current) {
        return;
      }
      requestMadeRef.current = true;

      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second delay between retries

      const makeRequest = async () => {
        try {
          // Obtener los datos del formulario del localStorage
          const storedData = localStorage.getItem('unitPlannerData')
          if (!storedData) {
            console.error('No se encontraron datos en el localStorage')
            return
          }

          const formData = JSON.parse(storedData)
          console.log('Form data from localStorage:', formData)
          console.log('generateInEnglish value:', formData.generateInEnglish)

          // Si los datos ya contienen lecciones, significa que venimos del historial
          if (formData.lecciones) {
            setUnitData(formData)
            setLoading(false)
            return
          }

          // Si no hay lecciones, procedemos con la creación del plan
          const userEmail = localStorage.getItem('email')
          if (!userEmail) {
            setError('No se encontró el email del usuario. Por favor, inicie sesión nuevamente.')
            setLoading(false)
            return
          }

          console.log('generateInEnglish data:', formData.generateInEnglish )
          // Crear el objeto de request con el formato exacto requerido
          const requestData = {
            nombreUnidad: formData.nombreUnidad,
            asignatura: formData.asignatura,
            detallesUnidad: formData.generateInEnglish 
              ? "se debe generar el contenido en inglés de las clases pero la materia y el grado manterlo en español\n\n" + formData.detallesUnidad
              : formData.detallesUnidad,
            estandaresObjetivos: formData.estandaresObjetivos,
            numeroLecciones: formData.numeroLecciones,
            email: userEmail,
            nivelEducativo: formData.nivelEducativo,
            course: formData.asignatura,
            generateInEnglish: formData.generateInEnglish,
            ...(formData.methodology && {

              methodology: formData.methodology.split(',').map(method => {
                switch(method.trim()) {
                  case "Clase magistral":
                    return "Clase magistral: El profesor presenta el contenido de manera directa, mientras los estudiantes asimilan y toman notas."
                  case "Aprendizaje activo":
                    return "Aprendizaje activo: Los estudiantes participan activamente, realizando actividades prácticas y proyectos colaborativos."
                  case "Aprendizaje práctico":
                    return "Aprendizaje práctico: Muestra cómo el contenido se aplica a profesiones reales, preparándolos para los desafíos del mercado."
                  case "Aprendizaje social y emocional":
                    return "Aprendizaje social y emocional: Combina contenido escolar con habilidades socioemocionales, como la empatía y el trabajo en equipo."
                  case "Aprendizaje Basado en Casos":
                    return "Aprendizaje Basado en Casos: Los estudiantes analizan situaciones reales o simuladas para aplicar conocimientos y tomar decisiones."
                  case "Aprendizaje Basado en Indagación":
                    return "Aprendizaje Basado en Indagación: Se fomenta la curiosidad, iniciando desde preguntas del estudiante para investigar y construir conocimiento."
                  case "Aprendizaje Basado en Investigación":
                    return "Aprendizaje Basado en Investigación: Los estudiantes indagan científicamente para resolver preguntas complejas."
                  case "Aprendizaje Basado en Problemas":
                    return "Aprendizaje Basado en Problemas: Resolver problemas reales o simulados para desarrollar habilidades de análisis y solución."
                  case "Aprendizaje Basado en Proyectos":
                    return "Aprendizaje Basado en Proyectos: Los estudiantes crean un producto final aplicando conocimientos durante el proceso."
                  case "Aprendizaje Basado en Retos":
                    return "Aprendizaje Basado en Retos: Enfrentan desafíos reales que requieren soluciones creativas e innovadoras."
                  case "Aprendizaje Colaborativo":
                    return "Aprendizaje Colaborativo: Fomenta el trabajo en equipo para alcanzar objetivos comunes mediante la cooperación."
                  case "Aprendizaje Invertido":
                    return "Aprendizaje Invertido: El estudiante revisa teoría en casa y aplica en clase mediante prácticas guiadas."
                  case "Design Thinking":
                    return "Design Thinking: Metodología centrada en el usuario para diseñar soluciones creativas a problemas complejos."
                  case "Diseño Universal para el Aprendizaje":
                    return "DUA Diseño Universal para el Aprendizaje: Proporciona múltiples formas de aprender, involucrarse y expresar el conocimiento." 
                  case "Gamificación":
                    return "Gamificación: Aplica elementos del juego para motivar y hacer más atractivo el proceso de aprendizaje."

t
                    default:
                    return formData.methodology
                }
              }).filter(Boolean).join ('\n')
            })
          }

          console.log('Request data to be sent:', JSON.stringify(requestData, null, 2))

          const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/create-unit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          })

          if (!response.ok) {
            throw new Error(`Error al cargar los datos de la unidad: ${response.status}`)
          }

          const data = await response.json()
          if (!data || !data.lecciones) {
            throw new Error('Los datos recibidos no contienen lecciones')
          }
          setUnitData(data)
          setLoading(false)
          localStorage.setItem('unitPlannerData', JSON.stringify(data))

          // Eliminar la llamada inmediata al diálogo de feedback
          // const feedbackRequested = localStorage.getItem('feedbackRequested')
          // if (!feedbackRequested) {
          //   setShowFeedbackDialog(true)
          // }
        
        } catch (err) {
          console.error('Error:', err)
          if (retryCount < maxRetries) {
            retryCount++
            console.log(`Reintentando (${retryCount}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            return makeRequest()
          }
          setError(err instanceof Error ? err.message : 'Error desconocido')
          setLoading(false)
        }
      }

      await makeRequest()

    }

    fetchUnitData()
  }, [])

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up timer")
      if (feedbackTimer) {
        clearTimeout(feedbackTimer)
        console.log("Timer cleaned up")
      }
    }
  }, [feedbackTimer])

  const handleFeedback = async (feedback: 'positive' | 'negative', immediate: boolean = false) => {
    if (!immediate) {
      // Solo guardar el tipo de feedback si no es un envío inmediato
      setFeedbackSent(true)
      localStorage.setItem('feedbackRequested', 'true')
      return
    }

    const email = localStorage.getItem('email')
    // Si es un envío inmediato, proceder con el envío y cerrar el diálogo
    try {
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/herramientas/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nombre: "feedback",
          correoElectronico: email,
          descripcionSolicitud: `Feedback de planeación: ${feedback === 'positive' ? 'Positivo' : 'Negativo'}${feedbackComment ? `\nComentario: ${feedbackComment}` : ''}`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el feedback')
      }

      toast.success("Feedback enviado exitosamente")
      setFeedbackComment("") // Reset comment after successful submission
      setShowFeedbackDialog(false) // Cerrar el diálogo solo después de enviar exitosamente
      localStorage.setItem('feedbackRequested', 'true') // Marcar como enviado en localStorage
    } catch (error) {
      console.error('Error al enviar feedback:', error)
      toast.error("Error al enviar el feedback")
    }
  }

  // Modificar el useEffect que maneja el diálogo de feedback
  useEffect(() => {
    const feedbackRequested = localStorage.getItem('feedbackRequested')
    if (!feedbackRequested) {
      // Mostrar el diálogo después de 4 minutos (240000 ms)
      const timer = setTimeout(() => {
        setShowFeedbackDialog(true)
      }, 300000)

      // Limpiar el timer si el componente se desmonta
      return () => clearTimeout(timer)
    }
  }, [])

  const exportToExcel = async () => {
    if (!unitData) return

    try {
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Plan de Clase')

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
      worksheet.mergeCells('A1:H1')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = 'PLAN DE CLASE'
      headerCell.font = { bold: true, size: 14 }
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      }
      headerCell.font = { bold: true, color: { argb: 'FFFFFF' } }

      // Información general
      worksheet.mergeCells('A2:B2')
      worksheet.getCell('A2').value = 'INSTITUCIÓN EDUCATIVA:'
      worksheet.getCell('A2').font = { bold: true }
      worksheet.mergeCells('C2:H2')
      worksheet.getCell('C2').value = 'Nombre de la Institución'

      worksheet.mergeCells('A3:B3')
      worksheet.getCell('A3').value = 'ÁREA:'
      worksheet.getCell('A3').font = { bold: true }
      worksheet.mergeCells('C3:H3')
      worksheet.getCell('C3').value = unitData.asignatura

      worksheet.mergeCells('A4:B4')
      worksheet.getCell('A4').value = 'GRADO:'
      worksheet.getCell('A4').font = { bold: true }
      worksheet.mergeCells('C4:H4')
      worksheet.getCell('C4').value = unitData.nivelEducativo || 'No especificado'

      worksheet.mergeCells('A5:B5')
      worksheet.getCell('A5').value = 'CLASE:'
      worksheet.getCell('A5').font = { bold: true }
      worksheet.mergeCells('C5:H5')
      worksheet.getCell('C5').value = unitData.nombreUnidad

      // Agregar Metodología si existe
      if (unitData.methodology) {
        worksheet.mergeCells('A6:B6')
        worksheet.getCell('A6').value = 'METODOLOGÍA:'
        worksheet.getCell('A6').font = { bold: true }
        worksheet.mergeCells('C6:H6')
        worksheet.getCell('C6').value = unitData.methodology.replace("Usa la siguiente metodología como base: ", "")
        worksheet.getCell('C6').alignment = { wrapText: true }
      }

      // Agregar Detalles de la Clase
      worksheet.mergeCells('A7:B7')
      worksheet.getCell('A7').value = 'DETALLES DE LA CLASE:'
      worksheet.getCell('A7').font = { bold: true }
      worksheet.mergeCells('C7:H7')
      worksheet.getCell('C7').value = unitData.detallesUnidad
      worksheet.getCell('C7').alignment = { wrapText: true }

      // Agregar Estándares y Objetivos
      worksheet.mergeCells('A8:B8')
      worksheet.getCell('A8').value = 'ESTÁNDARES Y OBJETIVOS:'
      worksheet.getCell('A8').font = { bold: true }
      worksheet.mergeCells('C8:H8')
      worksheet.getCell('C8').value = unitData.estandaresObjetivos
      worksheet.getCell('C8').alignment = { wrapText: true }

      // Agregar espacio
      worksheet.addRow([])
      worksheet.addRow([])

      // Encabezado de la tabla de lecciones
      const headers = [
        'DÍA',
        'TEMA',
        'ACTIVIDADES DE INICIO',
        'ACTIVIDADES DE DESARROLLO',
        'ACTIVIDADES DE CIERRE',
        'RECURSOS',
        'LOGROS ESPERADOS',
        'EVIDENCIAS',
        'EVALUACIÓN'
      ]

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
        { width: 8 },  // DÍA
        { width: 30 }, // TEMA
        { width: 40 }, // ACTIVIDADES DE INICIO
        { width: 40 }, // ACTIVIDADES DE DESARROLLO
        { width: 40 }, // ACTIVIDADES DE CIERRE
        { width: 30 }, // RECURSOS
        { width: 30 }, // LOGROS ESPERADOS
        { width: 30 }, // EVIDENCIAS
        { width: 20 }  // EVALUACIÓN
      ]

      // Agregar los datos de las lecciones
      unitData.lecciones.forEach(lesson => {
        // Crear la fila con los datos
        const row = worksheet.addRow([
          lesson.dia,
          lesson.titulo,
          lesson.inicio.actividades.map(act => parseActivity(act)).join('\n'),
          lesson.desarrollo.actividades.map(act => parseActivity(act)).join('\n'),
          lesson.cierre.actividades.map(act => parseActivity(act)).join('\n'),
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
          [
            ...(lesson.inicio.evidencia ? [
              'Inicio:',
              'Saber: ' + lesson.inicio.evidencia.saber,
              'Saber Hacer: ' + lesson.inicio.evidencia.saberHacer,
              'Ser: ' + lesson.inicio.evidencia.ser,
              ''
            ] : []),
            ...(lesson.desarrollo.evidencia ? [
              'Desarrollo:',
              'Saber: ' + lesson.desarrollo.evidencia.saber,
              'Saber Hacer: ' + lesson.desarrollo.evidencia.saberHacer,
              'Ser: ' + lesson.desarrollo.evidencia.ser,
              ''
            ] : []),
            ...(lesson.cierre.evidencia ? [
              'Cierre:',
              'Saber: ' + lesson.cierre.evidencia.saber,
              'Saber Hacer: ' + lesson.cierre.evidencia.saberHacer,
              'Ser: ' + lesson.cierre.evidencia.ser
            ] : [])
          ].join('\n'),
          lesson.evaluacion || 'Observación directa'
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

      // Agregar pie de página
      worksheet.addRow([])
      worksheet.addRow([])
      worksheet.mergeCells('A' + (worksheet.rowCount - 1) + ':H' + (worksheet.rowCount - 1))
      const footerCell = worksheet.getCell('A' + (worksheet.rowCount - 1))
      footerCell.value = 'Observaciones:'
      footerCell.font = { bold: true }
      footerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F5F5F5' }
      }
      footerCell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } }
      }

      // Agregar espacio para observaciones
      worksheet.addRow([])
      worksheet.mergeCells('A' + (worksheet.rowCount) + ':H' + (worksheet.rowCount))
      const observationsCell = worksheet.getCell('A' + (worksheet.rowCount))
      observationsCell.value = '________________________________________________________________________________________________'
      observationsCell.font = { color: { argb: '808080' } }

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${unitData.nombreUnidad}-plan-clase.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success("Plan de clase generado exitosamente")
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      toast.error("Error al generar el plan de clase")
    }
  }

  const exportToWord = async () => {
    if (!unitData) return;

    try {
      const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, Packer } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: unitData.nombreUnidad,
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Asignatura: ${unitData.asignatura}`,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nivel Educativo: ${unitData.nivelEducativo || 'No especificado'}`,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Detalles de la Unidad:',
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: unitData.detallesUnidad,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Estándares y Objetivos:',
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: unitData.estandaresObjetivos,
                  size: 24,
                }),
              ],
            }),
            
            new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Lecciones:',
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            ...unitData.lecciones.flatMap((lesson, index) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Lección ${index + 1}: ${lesson.titulo}`,
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Fecha: ${lesson.fecha || 'No especificada'}`,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Inicio:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Tema: ${lesson.inicio.tema}`,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Actividades:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.inicio.actividades.map(actividad => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(actividad)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Recursos:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.inicio.recursos.map(recurso => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(recurso)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Logros:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.inicio.logros.map(logro => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(logro)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              ...(lesson.inicio.evidencia ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Evidencias:',
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Saber: ${lesson.inicio.evidencia.saber}`,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Saber Hacer: ${lesson.inicio.evidencia.saberHacer}`,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Ser: ${lesson.inicio.evidencia.ser}`,
                      size: 24,
                    }),
                  ],
                })
              ] : []),
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Desarrollo:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Tema: ${lesson.desarrollo.tema}`,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Actividades:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.desarrollo.actividades.map(actividad => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(actividad)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Recursos:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.desarrollo.recursos.map(recurso => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(recurso)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Logros:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.desarrollo.logros.map(logro => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(logro)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              ...(lesson.desarrollo.evidencia ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Evidencias:',
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Saber: ${lesson.desarrollo.evidencia.saber}`,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Saber Hacer: ${lesson.desarrollo.evidencia.saberHacer}`,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Ser: ${lesson.desarrollo.evidencia.ser}`,
                      size: 24,
                    }),
                  ],
                })
              ] : []),
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              new Paragraph({ children: [new TextRun({ text: '---' })] }), // Separator
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Cierre:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Tema: ${lesson.cierre.tema}`,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Actividades:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.cierre.actividades.map(actividad => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(actividad)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Recursos:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...lesson.cierre.recursos.map(recurso => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${parseActivity(recurso)}`,
                      size: 24,
                    }),
                  ],
                })
              ),
              ...(lesson.cierre.evidencia ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Evidencias:',
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Saber: ${lesson.cierre.evidencia.saber}`,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Saber Hacer: ${lesson.cierre.evidencia.saberHacer}`,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• Ser: ${lesson.cierre.evidencia.ser}`,
                      size: 24,
                    }),
                  ],
                })
              ] : []),
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              new Paragraph({ children: [new TextRun({ text: '---' })] }), // Separator
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              // Sección de Evaluación
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Evaluación:',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: lesson.evaluacion || 'Observación directa',
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: '' })] }), // Empty line
              new Paragraph({ children: [new TextRun({ text: '---' })] }), // Separator
            ]),
          ],
        }],
      });

      // Generate and download the document
      const docBlob = await Packer.toBlob(doc);
      const docUrl = window.URL.createObjectURL(docBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = docUrl;
      downloadLink.download = `${unitData.nombreUnidad.replace(/\s+/g, '_')}.docx`;
      downloadLink.click();
      window.URL.revokeObjectURL(docUrl);
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al exportar el documento');
    }
  };

  const generateWordSearch = async () => {
    try {
      setIsGeneratingWordSearch(true)
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para generar la sopa de letras")
        return
      }


      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowWordSearchDialog(false)
  setIsGeneratingWordSearch(false)
  setShowRubricDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)

  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}
      // Create a workshop object for word search generation
      const workshop = {
        id: `wordsearch-${selectedDay}`,
        tipoTaller: 'sopa-de-letras',
        prompt: `Genera una sopa de letras para el tema "${unitData?.lecciones.find(l => l.dia === selectedDay)?.titulo}" con las siguientes especificaciones:
- Nivel educativo: ${unitData?.nivelEducativo}
- Materia: ${unitData?.asignatura}
- Tema: ${unitData?.lecciones.find(l => l.dia === selectedDay)?.titulo}
- Palabras clave: ${unitData?.lecciones.find(l => l.dia === selectedDay)?.inicio.logros.join(', ')}
- Contenido: ${unitData?.lecciones.find(l => l.dia === selectedDay)?.desarrollo.tema}
- Objetivos de aprendizaje: ${unitData?.estandaresObjetivos}`,
        response: '',
        timestamp: new Date().toISOString(),
        name: unitData?.lecciones.find(l => l.dia === selectedDay)?.titulo || 'Sopa de Letras',
        email: email,
        activate: true,
        topic: `tema:${unitData?.lecciones.find(l => l.dia === selectedDay)?.titulo}|grado:${unitData?.nivelEducativo}|materia:${unitData?.asignatura}|palabras:${unitData?.lecciones.find(l => l.dia === selectedDay)?.inicio.logros.join(',')}|contenido:${unitData?.lecciones.find(l => l.dia === selectedDay)?.desarrollo.tema}|objetivos:${unitData?.estandaresObjetivos}`,
        grade: unitData?.nivelEducativo,
        subject: unitData?.asignatura,
        theme: unitData?.lecciones.find(l => l.dia === selectedDay)?.titulo,
        isPublic: false
      }
console.log(workshop)
      // Send request to backend
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/sopa-de-letras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workshop)
      })

      if (!response.ok) {
        throw new Error('Error al generar la sopa de letras')
      }

      const responseData = await response.json()
      
      // Asegurarse de que la respuesta tenga el formato correcto
      const wordSearchData = {
        data: {
          grid: responseData.data.grid || [],
          words: responseData.data.words || []
        }
      }
      
      workshop.response = JSON.stringify(wordSearchData)
      
      // Open the workshop preview with the word search
      setSelectedWorkshop(workshop)
      setIsPreviewOpen(true)
      setShowWordSearchDialog(false)
      toast.success("Sopa de letras generada exitosamente")
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar la sopa de letras")
    } finally {
      setIsGeneratingWordSearch(false)
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/unit-planner/shared/${unitData?._id}`
    if (navigator.share) {
      navigator.share({
        title: unitData?.nombreUnidad,
        text: `mira la planecacion de la clases creada por profeplanner: ${unitData?.nombreUnidad}`,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  const handleWhatsappShare = () => {
    const shareUrl = `${window.location.origin}/unit-planner/shared/${unitData?._id}`
    const whatsappUrl = `https://wa.me/?text=mira la planecacion de la clases creada por profeplanner: ${encodeURIComponent(shareUrl)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleUnitUpdate = (updatedUnit: any) => {
    setUnitData(updatedUnit)
    setShowUpdateAlert(true)
    setTimeout(() => setShowUpdateAlert(false), 3000) // Ocultar la alerta después de 3 segundos
  }

  const handleDateSelect = async (date: Date | undefined, lessonDay: number) => {
    if (!date || !unitData) return;
    
    try {
      const updatedUnitData = { ...unitData };
      const lessonIndex = updatedUnitData.lecciones.findIndex(l => l.dia === lessonDay);
      
      if (lessonIndex !== -1) {
        // Ajustar la fecha para evitar problemas de timezone
        const adjustedDate = new Date(date);
        adjustedDate.setHours(12, 0, 0, 0); // Establecer al mediodía para evitar cambios de día
        updatedUnitData.lecciones[lessonIndex].fecha = format(adjustedDate, 'dd/MM/yyyy');
        setUnitData(updatedUnitData);
        
        // Guardar en localStorage
        localStorage.setItem('unitPlannerData', JSON.stringify(updatedUnitData));
        
        // Actualizar en la base de datos
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/update-class`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUnitData),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar la fecha');
        }
        
        // Mostrar diálogo de éxito estilizado en lugar del confirm
        setShowDateSuccessDialog(true);
      }
    } catch (error) {
      console.error('Error al actualizar la fecha:', error);
      toast.error('Error al actualizar la fecha');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de la clase...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !unitData || !unitData.lecciones) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>{error || 'No se encontraron datos de la unidad o las lecciones'}</p>
            <Button 
              className="mt-4 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white"
              onClick={() => router.push('/unit-planner')}
            >
              Volver al Planificador
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <>
    <PricingModal 
    open={showPricingModal} 
    onOpenChange={setShowPricingModal}
    accessMessage={accessMessage}
  />

    <Layout>
      <div className="container mx-auto px-1 py-1">
        {/* Alerta de actualización */}
        {showUpdateAlert && (
          <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in max-w-md">
            <AlertCircle className="w-6 h-6 text-green-600" />
            <p className="text-base text-green-700">Planeación actualizada exitosamente</p>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
          </div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2 sm:p-3 md:p-4"
        >
          {/* Barra de navegación superior */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4"
          >
            <Link href="/unit-planner">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="flex items-center gap-2 text-xs sm:text-sm">
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  {t('unitPlanner.view.backToPlanner')}
                </Button>
              </motion.div>
            </Link>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white text-sm sm:text-base"
                  onClick={exportToExcel}
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('unitPlanner.view.buttons.exportToExcel')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-sm sm:text-base"
                  onClick={exportToWord}
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('unitPlanner.view.buttons.exportToWord')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={handleShare}
                  className="w-full sm:w-auto bg-blue-500 text-white text-sm sm:text-base hover:bg-blue-600 transition-colors"
                >
                  <FaShare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Compartir
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={handleWhatsappShare}
                  className="w-full sm:w-auto bg-green-500 text-white text-sm sm:text-base hover:bg-green-600 transition-colors"
                >
                  <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  WhatsApp
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={() => setShowAssistantChat(true)}
                  className="w-full sm:w-auto bg-purple-500 text-white text-sm sm:text-base hover:bg-purple-600 transition-colors relative group shadow-lg hover:shadow-xl"
                >
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    ¡Nuevo!
                  </div>
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Asistente de Mejora
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Obtén ayuda personalizada para mejorar tu planificación
                  </div>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

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
                className="flex-1"
              >
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-blue-600 mb-2">{unitData.nombreUnidad}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-sm sm:text-base text-gray-600"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                    <span>{unitData.numeroLecciones} {t('unitPlanner.history.lessons')}</span>
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
                  {t('unitPlanner.view.status.active')}
                </motion.span>
              </motion.div>
            </div>
          </motion.div>

          {/* Sección de Detalles y Estándares */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
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
                <h2 className="text-lg sm:text-xl font-medium text-blue-500">{t('unitPlanner.view.sections.unitDetails')}</h2>
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
                <h2 className="text-lg sm:text-xl font-medium text-purple-500">{t('unitPlanner.view.sections.standardsAndObjectives')}</h2>
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
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-semibold text-gray-700 mb-3 sm:mb-4">{t('unitPlanner.view.sections.lessonPlan')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {unitData.lecciones.map((lesson, index) => (
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
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="px-2 py-1 text-sm font-medium bg-blue-50 text-blue-600 rounded-full cursor-pointer"
                        onClick={() => setEditingLesson(lesson.dia)}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <span className="flex items-center gap-1">
                              {lesson.fecha || 'Sin fecha asignada'}
                              <Calendar className="w-3 h-3" />
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-2 text-sm text-gray-600">
                              Selecciona la fecha en que impartirás esta clase
                            </div>
                            <div className="flex justify-center">
                              <CalendarComponent
                                mode="single"
                                selected={lesson.fecha ? new Date(lesson.fecha.split('/').reverse().join('-') + 'T12:00:00') : undefined}
                                onSelect={(date) => handleDateSelect(date, lesson.dia)}
                                locale={es}
                                initialFocus
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </motion.div>
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
                        {t('unitPlanner.view.buttons.viewDetails')}
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
              unitData={unitData}
              setSelectedWorkshop={setSelectedWorkshop}
              setIsPreviewOpen={setIsPreviewOpen}
              setShowWordSearchDialog={setShowWordSearchDialog}
              showRubricDialog={showRubricDialog}
              setShowRubricDialog={setShowRubricDialog}
              rubricData={rubricData}
              setRubricData={setRubricData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              handleUnitUpdate={handleUnitUpdate}
            />
          )}
        </motion.div>

        {/* Add WorkshopPreview component */}
        {isPreviewOpen && selectedWorkshop && (
          <WorkshopPreview
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            workshop={selectedWorkshop}
          />
        )}

        <Dialog open={showWordSearchDialog} onOpenChange={setShowWordSearchDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Sopa de Letras</DialogTitle>
              <DialogDescription>
                Genera una sopa de letras basada en el contenido de la lección.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">Detalles de la Sopa de Letras</h4>
                <p className="text-sm text-blue-600">
                  Se generará una sopa de letras con palabras relacionadas al tema "{unitData?.lecciones.find(l => l.dia === selectedDay)?.titulo}" y los objetivos de aprendizaje.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWordSearchDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={generateWordSearch} disabled={isGeneratingWordSearch}>
                {isGeneratingWordSearch ? 'Generando...' : 'Generar Sopa de Letras'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={showFeedbackDialog} onOpenChange={(open) => {
          // Solo permitir cerrar si el feedback ya ha sido enviado
          if (!feedbackSent) {
            toast.error("Por favor, envía tu feedback antes de continuar")
            return
          }
          setShowFeedbackDialog(open)
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Cómo fue tu experiencia con la planeación?</DialogTitle>
              <DialogDescription>
                Tu feedback es importante para mejorar el servicio. Por favor, comparte tu opinión.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex flex-col items-center gap-2"
                  onClick={() => handleFeedback('positive')}
                >
                  <ThumbsUp className="w-6 h-6" />
                  <span>Positivo</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex flex-col items-center gap-2"
                  onClick={() => handleFeedback('negative')}
                >
                  <ThumbsDown className="w-6 h-6" />
                  <span>Negativo</span>
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-comment">Comentario (opcional)</Label>
                <textarea
                  id="feedback-comment"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  placeholder="¿Tienes algún comentario o sugerencia que nos ayude a mejorar?"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleFeedback('positive', true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={!feedbackSent} // Deshabilitar el botón hasta que se seleccione un tipo de feedback
                >
                  Enviar Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <PlanningAssistantChat
          unitId={unitData?._id || ''}
          isOpen={showAssistantChat}
          onClose={() => setShowAssistantChat(false)}
          onUpdateUnit={handleUnitUpdate}
        />
        
        {/* Diálogo de éxito al actualizar fecha */}
        <Dialog open={showDateSuccessDialog} onOpenChange={setShowDateSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                ¡Fecha actualizada exitosamente!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                Se ha actualizado la fecha para impartir la clase. ¿Desea ir al calendario para ver todas las fechas?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDateSuccessDialog(false)}
                  className="sm:flex-1"
                >
                  Seguir en la vista actual
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:flex-1"
                  onClick={() => {
                    setShowDateSuccessDialog(false);
                    window.open('/unit-planner/calendar', '_blank');
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Ir al calendario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
    </>
  )
}

function LessonDetailsModal({
  lesson,
  allLessons,
  onClose,
  onNextLesson,
  unitData,
  setSelectedWorkshop,
  setIsPreviewOpen,
  setShowWordSearchDialog,
  showRubricDialog,
  setShowRubricDialog,
  rubricData,
  setRubricData,
  isLoading,
  setIsLoading,
  handleUnitUpdate,
}: {
  lesson: Leccion
  allLessons: Leccion[]
  onClose: () => void
  onNextLesson: (nextDay: number) => void
  unitData: Unidad
  setSelectedWorkshop: (workshop: any) => void
  setIsPreviewOpen: (isOpen: boolean) => void
  setShowWordSearchDialog: (isOpen: boolean) => void
  showRubricDialog: boolean
  setShowRubricDialog: (show: boolean) => void
  rubricData: any
  setRubricData: (data: any) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  handleUnitUpdate: (updatedUnit: Unidad) => void
}) {
  const { t } = useLanguage()
  const { showPointsNotification } = usePoints()
  const [activeSection, setActiveSection] = useState<'inicio' | 'desarrollo' | 'cierre'>('inicio')
  const [showHelp, setShowHelp] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLesson, setEditedLesson] = useState<Leccion>(lesson)
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState(false)
  const [showEducationalToolsDialog, setShowEducationalToolsDialog] = useState(false)
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [summaryForm, setSummaryForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [questionnaireConfig, setQuestionnaireConfig] = useState({
    questionType: 'opcion_multiple',
    questionCount: 10,
    difficulty: 'medium'
  })
  const [showObjectivesDialog, setShowObjectivesDialog] = useState(false)
  const [objectivesForm, setObjectivesForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false)
  const [generatedObjectives, setGeneratedObjectives] = useState('')
  const [showRealWorldDialog, setShowRealWorldDialog] = useState(false)
  const [realWorldForm, setRealWorldForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingRealWorld, setIsGeneratingRealWorld] = useState(false)
  const [generatedRealWorld, setGeneratedRealWorld] = useState('')
  const [showActivitiesDialog, setShowActivitiesDialog] = useState(false)
  const [activitiesForm, setActivitiesForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false)
  const [generatedActivities, setGeneratedActivities] = useState('')
  const [showProjectsDialog, setShowProjectsDialog] = useState(false)
  const [projectsForm, setProjectsForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false)
  const [generatedProjects, setGeneratedProjects] = useState('')
  const [showSequenceDialog, setShowSequenceDialog] = useState(false)
  const [sequenceForm, setSequenceForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false)
  const [generatedSequence, setGeneratedSequence] = useState('')
  const [showDatesDialog, setShowDatesDialog] = useState(false)
  const [datesForm, setDatesForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false
  })
  const [isGeneratingDates, setIsGeneratingDates] = useState(false)
  const [generatedDates, setGeneratedDates] = useState('')
  const [showSlidesDialog, setShowSlidesDialog] = useState(false)
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false)
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([])
  const [slidesForm, setSlidesForm] = useState({
    name: '',
    topic: '',
    course: '',
    isPublic: false,
    slideCount: '10',
    primaryColor: '#1a73e8',
    secondaryColor: '#4285f4',
    textColor: '#202124',
    prompt: ''
  })
  const [showActivitiesPreviewModal, setShowActivitiesPreviewModal] = useState(false)
  const [showSlidesDownloadModal, setShowSlidesDownloadModal] = useState(false)
  const [showSummaryPreviewModal, setShowSummaryPreviewModal] = useState(false)
  const [showObjectivesPreviewModal, setShowObjectivesPreviewModal] = useState(false)
  const [showRealWorldPreviewModal, setShowRealWorldPreviewModal] = useState(false)
  const [showProjectsPreviewModal, setShowProjectsPreviewModal] = useState(false)
  const [showSequencePreviewModal, setShowSequencePreviewModal] = useState(false)
  const [showDatesPreviewModal, setShowDatesPreviewModal] = useState(false)
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false)
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('')
  const [youtubeResults, setYoutubeResults] = useState<any[]>([])
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [showDUAModal, setShowDUAModal] = useState(false);
  const [showConceptMapDialog, setShowConceptMapDialog] = useState(false)

  const currentIndex = allLessons.findIndex(l => l.dia === lesson.dia)
  const nextLesson = allLessons[currentIndex + 1]
  const hasNextLesson = nextLesson !== undefined

  const handleSectionChange = (section: 'inicio' | 'desarrollo' | 'cierre') => {
    setActiveSection(section)
  }

  const searchYoutubeVideos = async () => {
    try {
      setIsSearchingYoutube(true)
      const searchQuery = `${lesson[activeSection].tema} education video`
      setYoutubeSearchQuery(searchQuery)

      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=5&key=AIzaSyDWMBc9ziA9djIMt-n3Sz_tRZAbypK3G3c`)
      
      if (!response.ok) {
        throw new Error('Error al buscar videos')
      }

      const data = await response.json()
      setYoutubeResults(data.items)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al buscar videos de YouTube')
    } finally {
      setIsSearchingYoutube(false)
    }
  }

  const handleVideoSelect = (video: any) => {
    setSelectedVideo(video)
  }
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  const validateAccess = async (email: string) => {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/validate-access?email=${email}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error validando acceso:', error)
      return { allowed: true, message: 'Error al validar el acceso' }
    }
  }
  const generateQuestionnaire = async () => {
    try {
      setIsGenerating(true)
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowQuestionnaireDialog(false)
  setIsGenerating(false)
  // Mostrar el modal con el mensaje de acceso
  setShowEducationalToolsDialog(false)
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}
      const workshop = {
        id: `questionnaire-${lesson.dia}`,
        tipoTaller: 'cuestionario',
        prompt: `Genera un cuestionario para el tema "${lesson.titulo}" con las siguientes especificaciones:
- Tipo de preguntas: ${questionnaireConfig.questionType}
- Número de preguntas: ${questionnaireConfig.questionCount}
- Dificultad: ${questionnaireConfig.difficulty}
- Nivel educativo: ${unitData?.nivelEducativo}
- Materia: ${unitData?.asignatura}
- Tema: ${lesson.titulo}
- Contenido: ${lesson.desarrollo.tema}`,
        response: '',
        timestamp: new Date().toISOString(),
        name: `Cuestionario - ${lesson.titulo}`,
        email: email,
        activate: true,
        topic: `tema:${lesson.titulo}|grado:${unitData?.nivelEducativo}|materia:${unitData?.asignatura}|tipo:${questionnaireConfig.questionType}|cantidad:${questionnaireConfig.questionCount}|dificultad:${questionnaireConfig.difficulty}|inicio:${lesson.inicio.tema}|desarrollo:${lesson.desarrollo.tema}|cierre:${lesson.cierre.tema}|actividades_inicio:${lesson.inicio.actividades.join(',')}|actividades_desarrollo:${lesson.desarrollo.actividades.join(',')}|actividades_cierre:${lesson.cierre.actividades.join(',')}|recursos_inicio:${lesson.inicio.recursos.join(',')}|recursos_desarrollo:${lesson.desarrollo.recursos.join(',')}|recursos_cierre:${lesson.cierre.recursos.join(',')}|logros_inicio:${lesson.inicio.logros.join(',')}|logros_desarrollo:${lesson.desarrollo.logros.join(',')}|logros_cierre:${lesson.cierre.logros.join(',')}`,
        grade: unitData?.nivelEducativo,
        subject: unitData?.asignatura,
        theme: lesson.titulo,
        isPublic: false
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-cuestionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workshop)
      })

      if (!response.ok) {
        throw new Error('Error al generar el cuestionario')
      }

      const responseText = await response.text()
      workshop.response = responseText

      setSelectedWorkshop(workshop)
      setIsPreviewOpen(true)
      setShowQuestionnaireDialog(false)
      toast.success(t('unitPlanner.view.dialogs.generateQuestionnaire.success'))
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('unitPlanner.view.dialogs.generateQuestionnaire.error'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleQuestionnaireConfigChange = (field: string, value: string) => {
    setQuestionnaireConfig(prev => ({
      ...prev,
      [field]: field === 'questionCount' ? parseInt(value) : value
    }))
  }

  const educationalTools = [
    {
      id: 'actividades',
      title: 'Actividades',
      description: 'Genera actividades interactivas y dinámicas para la clase.',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'rubrica',
      title: 'Rúbrica de Evaluación',
      description: 'Genera una rúbrica de evaluación para la lección actual.',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'mapa-conceptual',
      title: 'Mapa Conceptual',
      description: 'Genera un mapa conceptual visual para explicar los conceptos clave de la lección.',
      icon: <NetworkIcon className="w-5 h-5" />
    },
    {
      id: 'diapositivas',
      title: 'Diapositivas',
      description: 'Genera diapositivas profesionales para tu clase con el contenido de la lección.',
      icon: <Presentation className="w-5 h-5" />
    },
    {
      id: 'resumen',
      title: 'Resumen de Tema',
      description: 'Te da una versión concisa para explicar el tema rápidamente.',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'objetivos',
      title: 'Objetivos de Aprendizaje',
      description: 'Refuerza con claridad qué se está logrando en la clase.',
      icon: <GraduationCap className="w-5 h-5" />
    },
    {
      id: 'logros',
      title: 'Logros del Mundo Real',
      description: 'Aporta ejemplos reales para conectar el tema con la vida cotidiana.',
      icon: <BrainCircuit className="w-5 h-5" />
    },
    {
      id: 'proyectos',
      title: 'Proyectos',
      description: 'Crea proyectos significativos que integren el aprendizaje.',
      icon: <Lightbulb className="w-5 h-5" />
    },
    {
      id: 'secuencia',
      title: 'Secuencia Didáctica',
      description: 'Si te quedas corto de pasos o ideas, puedes pedir que genere más actividades.',
      icon: <ListOrdered className="w-5 h-5" />
    },
    {
      id: 'fechas',
      title: 'Fechas Conmemorativas',
      description: 'Si necesitas contenido contextual o quieres conectar con eventos actuales.',
      icon: <Calendar className="w-5 h-5" />
    },

  ]

  const handleSummarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingSummary(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }

   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowSummaryDialog(false)
  setIsGeneratingSummary(false)
  setShowEducationalToolsDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}
      const resumenRequest = {
        name: summaryForm.name || `Resumen - ${lesson.titulo}`,
        topic: summaryForm.topic || lesson.titulo,
        level: unitData?.nivelEducativo || '',
        email: email,
        isPublic: summaryForm.isPublic,
        grade: unitData?.nivelEducativo || '',
        theme: lesson.titulo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/resumen-tema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumenRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el resumen')
      }

      const data = await response.text()
      setGeneratedSummary(data)
      toast.success("Resumen generado exitosamente")
      setShowSummaryDialog(false)
      setShowSummaryPreviewModal(true)
      setSelectedWorkshop({
        id: 'summary-' + Date.now(),
        tipoTaller: 'resumen',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: summaryForm.name || `Resumen - ${lesson.titulo}`,
        email: email,
        activate: true
      })
      setIsPreviewOpen(true)

      // Agregar puntos por generar resumen
      await gamificationService.addPoints(email, 5, 'summary_generation')
      showPointsNotification(5, 'generar un resumen')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el resumen")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleObjectivesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingObjectives(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowObjectivesDialog(false)
  setIsGeneratingObjectives(false)
  setShowEducationalToolsDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const objectivesRequest = {
        name: objectivesForm.name || `Objetivos de Aprendizaje - ${lesson.titulo}`,
        topic: objectivesForm.topic || lesson.titulo,
        level: unitData?.nivelEducativo || '',
        email: email,
        isPublic: objectivesForm.isPublic,
        grade: unitData?.nivelEducativo || '',
        theme: lesson.titulo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/objetivos-aprendizaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objectivesRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar los objetivos')
      }

      const data = await response.text()
      setGeneratedObjectives(data)
      toast.success("Objetivos generados exitosamente")
      setShowObjectivesDialog(false)
      setShowObjectivesPreviewModal(true)
      setSelectedWorkshop({
        id: 'objectives-' + Date.now(),
        tipoTaller: 'objetivos',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: objectivesForm.name || `Objetivos - ${lesson.titulo}`,
        email: email,
        activate: true
      })
      setIsPreviewOpen(true)

      // Agregar puntos por generar objetivos
      await gamificationService.addPoints(email, 5, 'objectives_generation')
      showPointsNotification(5, 'generar objetivos de aprendizaje')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar los objetivos")
    } finally {
      setIsGeneratingObjectives(false)
    }
  }

  const handleRealWorldSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingRealWorld(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }

   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setIsGeneratingRealWorld(false)
  setShowEducationalToolsDialog(false)
  setShowRealWorldDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const realWorldRequest = {
        name: realWorldForm.name || `Logros del Mundo Real - ${lesson.titulo}`,
        topic: realWorldForm.topic || lesson.titulo,
        level: unitData?.nivelEducativo || '',
        email: email,
        isPublic: realWorldForm.isPublic,
        grade: unitData?.nivelEducativo || '',
        subject: unitData?.asignatura,
        theme: lesson.titulo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/beneficios-del-mundo-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(realWorldRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar los logros del mundo real')
      }

      const data = await response.text()
      setGeneratedRealWorld(data)
      toast.success("Logros del mundo real generados exitosamente")
      setShowRealWorldDialog(false)
      setShowRealWorldPreviewModal(true)
      setSelectedWorkshop({
        id: 'real-world-' + Date.now(),
        tipoTaller: 'logros-mundo-real',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: realWorldForm.name || `Logros del Mundo Real - ${lesson.titulo}`,
        email: email,
        activate: true
      })
      setIsPreviewOpen(true)

      // Agregar puntos por generar logros del mundo real
      await gamificationService.addPoints(email, 5, 'real_world_generation')
      showPointsNotification(5, 'generar logros del mundo real')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar los logros del mundo real")
    } finally {
      setIsGeneratingRealWorld(false)
    }
  }

  const handleActivitiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingActivities(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }

   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowActivitiesDialog(false)
  setIsGeneratingActivities(false)
  setShowEducationalToolsDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const activitiesRequest = {
        topic: "tema: " + (activitiesForm.topic || lesson.titulo) + " grado academico: " + (activitiesForm.course || unitData?.nivelEducativo),
        email: email,
        name: activitiesForm.name || `Ideas de Actividades - ${lesson.titulo}`,
        isPublic: activitiesForm.isPublic,
        theme: activitiesForm.topic || lesson.titulo,
        grade: activitiesForm.course || unitData?.nivelEducativo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-ideas-actividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activitiesRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar las ideas de actividades')
      }

      const data = await response.text()
      setGeneratedActivities(data)
      toast.success("Ideas de actividades generadas exitosamente")
      setShowActivitiesDialog(false)
      setShowActivitiesPreviewModal(true)
      setSelectedWorkshop({
        id: 'activities-' + Date.now(),
        tipoTaller: 'ideas-actividades',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: activitiesForm.name || `Ideas de Actividades - ${lesson.titulo}`,
        email: email,
        activate: true
      })
      setIsPreviewOpen(true)

      // Agregar puntos por generar ideas de actividades
      await gamificationService.addPoints(email, 5, 'activity_ideas_generation')
      showPointsNotification(5, 'generar ideas de actividades')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las ideas de actividades")
    } finally {
      setIsGeneratingActivities(false)
    }
  }

  const handleProjectsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingProjects(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }

   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowProjectsDialog(false)
  setIsGeneratingProjects(false)
  setShowEducationalToolsDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const projectsRequest = {
        topic: projectsForm.topic || lesson.titulo,
        email: email,
        name: projectsForm.name || `Proyecto - ${lesson.titulo}`,
        isPublic: projectsForm.isPublic,
        grade: unitData?.nivelEducativo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-proyecto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectsRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el proyecto')
      }

      const data = await response.text()
      setGeneratedProjects(data)
      toast.success("Proyecto generado exitosamente")
      setShowProjectsDialog(false)
      setShowProjectsPreviewModal(true)
      setSelectedWorkshop({
        id: 'projects-' + Date.now(),
        tipoTaller: 'proyecto',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: projectsForm.name || `Proyecto - ${lesson.titulo}`,
        email: email,
        activate: true
      })
      setIsPreviewOpen(true)

      // Agregar puntos por generar proyecto
      await gamificationService.addPoints(email, 5, 'project_generation')
      showPointsNotification(5, 'generar un proyecto')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el proyecto")
    } finally {
      setIsGeneratingProjects(false)
    }
  }

  const handleSequenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingSequence(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowSequenceDialog(false)
  setIsGeneratingSequence(false)
  setShowEducationalToolsDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}


      const sequenceRequest = {
        name: sequenceForm.name || `Secuencia Didáctica - ${lesson.titulo}`,
        topic: "tema: " + (sequenceForm.topic || lesson.titulo) + " grado academico: " + (sequenceForm.course || unitData?.nivelEducativo),
        email: email,
        isPublic: sequenceForm.isPublic,
        theme: sequenceForm.topic || lesson.titulo,
        grade: sequenceForm.course || unitData?.nivelEducativo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-secuencia-didactica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sequenceRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar la secuencia didáctica')
      }

      const data = await response.text()
      setGeneratedSequence(data)
      toast.success("Secuencia didáctica generada exitosamente")
      setShowSequenceDialog(false)
      setShowSequencePreviewModal(true)
      setSelectedWorkshop({
        id: 'sequence-' + Date.now(),
        tipoTaller: 'secuencia-didactica',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: sequenceForm.name || `Secuencia Didáctica - ${lesson.titulo}`,
        email: email,
        activate: true
      })
      setIsPreviewOpen(true)

      // Agregar puntos por generar secuencia didáctica
      await gamificationService.addPoints(email, 5, 'sequence_generation')
      showPointsNotification(5, 'generar una secuencia didáctica')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar la secuencia didáctica")
    } finally {
      setIsGeneratingSequence(false)
    }
  }

  const handleDatesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingDates(true)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        return
      }

   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setShowDatesDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setIsGeneratingDates(false)
  setShowEducationalToolsDialog(false)
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const datesRequest = {
        name: datesForm.name || `Fechas Conmemorativas - ${lesson.titulo}`,
        topic: "Fecha conmemorativa: " + (datesForm.topic || lesson.titulo) + " nivel educativo: Grado " + (datesForm.course || unitData?.nivelEducativo),
        email: email,
        isPublic: datesForm.isPublic,
        grade: datesForm.course || unitData?.nivelEducativo
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/ideas-fechas-conmemorativas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datesRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar las ideas para fechas conmemorativas')
      }

      const data = await response.text()
      setGeneratedDates(data)
      toast.success("Ideas para fechas conmemorativas generadas exitosamente")
      setShowDatesDialog(false)
      // Configurar el workshop y mostrar el preview
      const workshop = {
        id: 'dates-' + Date.now(),
        tipoTaller: 'fechas-conmemorativas',
        prompt: '',
        response: data,
        timestamp: new Date().toISOString(),
        name: datesForm.name || `Ideas para Fechas Conmemorativas - ${lesson.titulo}`,
        email: email,
        activate: true
      }
      setSelectedWorkshop(workshop)
      setShowDatesPreviewModal(true)
      setIsPreviewOpen(true)

      // Agregar puntos por generar ideas para fechas conmemorativas
      await gamificationService.addPoints(email, 5, 'dates_generation')
      showPointsNotification(5, 'generar ideas para fechas conmemorativas')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las ideas para fechas conmemorativas")
    } finally {
      setIsGeneratingDates(false)
    }
  }

  const [rubricForm, setRubricForm] = useState({
    name: "",
    topic: "¿Qué es la Biología? Explorando la Vida en América Latina",
    details: "Esta unidad introduce a los estudiantes a los conceptos fundamentales de la biología, enfocándose en la biodiversidad y los ecosistemas únicos de América Latina.",
    standards: unitData?.estandaresObjetivos || ""
  });

  const generateRubric = async () => {
    setIsLoading(true)
    let emailUser = localStorage.getItem("email")

    if (!emailUser) {
      toast.error("No se encontró el email del usuario")
      return
    }
 // Validar acceso
 const accessData = await validateAccess(emailUser)

     
if (!accessData.allowed) {
  setShowRubricDialog(false)
  setIsLoading(false)
// Mostrar el modal con el mensaje de acceso
setShowPricingModal(true)
setShowEducationalToolsDialog(false)
setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
return // Detener el flujo
}

    try {
      const combinedTopic = `Tema de la Rúbrica\n${rubricForm.topic}\n\nDetalles de la Clase\n${rubricForm.details}\n\nEstándares y Objetivos\n${rubricForm.standards}`

      const dataToSend = {
        grade: unitData.nivelEducativo,
        subject: unitData.asignatura,
        theme: combinedTopic,
        topic: combinedTopic,
        name: "Estudiante",
        email: emailUser,
        isPublic: false
      }
      

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/rubrica/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error('Error al generar la rúbrica')
      }

      const data = await response.json()
      setRubricData(data)
      toast.success('Rúbrica generada exitosamente')
      
      if (emailUser) {
        await gamificationService.addPoints(emailUser, 15, 'rubrica_creation')
        showPointsNotification(15, 'crear una rúbrica de evaluación')
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar la rúbrica')
    } finally {
      setIsLoading(false)
    }
  }

  const exportRubricToPDF = async () => {
    if (!rubricData) return;

    try {
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
      const title = rubricData.titulo;
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      // Descripción
      let yPos = marginTop + 10;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      const descLines = pdf.splitTextToSize(rubricData.descripcion, contentWidth);
      pdf.text(descLines, marginLeft, yPos);
      yPos += descLines.length * 4 + 8;

      // Definir anchos de columnas
      const colWidths = [50, 70, 120, 30];
      const startX = marginLeft;

      // Criterios
      rubricData.criterios.forEach((criterio: any) => {
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
      pdf.text(`Puntaje Total: ______ / ${rubricData.criterios.length * 5}`, startX + colWidths[0] + colWidths[1] + 2, yPos);
      pdf.text('______', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);

      addLogoToFooter(pdf);
      pdf.save(`rubrica-${rubricData.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Rúbrica exportada exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar la rúbrica");
    }
  };

  const exportRubricToExcel = async () => {
    if (!rubricData) return

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Rúbrica')

      worksheet.pageSetup.margins = {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }

      // Encabezado
      worksheet.mergeCells('A1:D1')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = rubricData.titulo
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
      descCell.value = rubricData.descripcion
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
        { width: 30 },
        { width: 40 },
        { width: 50 },
        { width: 20 }
      ]

      // Agregar criterios
      rubricData.criterios.forEach((criterio: any) => {
        const row = worksheet.addRow([
          criterio.nombre,
          criterio.descripcion,
          criterio.escala.map((e: any) => `Puntaje ${e.puntaje}: ${e.descripcion}`).join('\n'),
          ''
        ])
        row.alignment = { wrapText: true }
      })

      // Agregar fila final
      const finalRow = worksheet.addRow([
        'Calificación Final',
        'Total de puntos obtenidos',
        `Puntaje Total: ______ / ${rubricData.criterios.length * 5}`,
        ''
      ])
      finalRow.font = { bold: true }
      finalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F5F5F5' }
      }

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

  const handleSlidesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingSlides(true)
    try {
      const email = localStorage.getItem('email')

      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setIsGeneratingSlides(false)
  setShowSlidesDialog(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setShowEducationalToolsDialog(false)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/diapositivas-automaticas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: `Numero de diapositivas: ${slidesForm.slideCount} - del tema: ${slidesForm.topic}\n\nDetalles de la Clase:\n- Nivel Educativo: ${unitData?.nivelEducativo}\n- Asignatura: ${unitData?.asignatura}\n- Objetivos: ${unitData?.estandaresObjetivos}\n- Metodología: ${unitData?.methodology}\n\nContexto de la Lección:\n- Título: ${lesson.titulo}\n- Inicio: ${lesson.inicio.tema}\n- Desarrollo: ${lesson.desarrollo.tema}\n- Cierre: ${lesson.cierre.tema}`,
          email: email,
          name: slidesForm.name || `Diapositivas - ${lesson.titulo}`,
          isPublic: slidesForm.isPublic,
          grade: unitData?.nivelEducativo,
          subject: unitData?.asignatura,
          theme: slidesForm.topic,
          slideCount: slidesForm.slideCount,
          colors: {
            primary: slidesForm.primaryColor,
            secondary: slidesForm.secondaryColor,
            text: slidesForm.textColor
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Error al generar las diapositivas: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!data || !data.slides || !Array.isArray(data.slides)) {
        throw new Error('Formato de respuesta inválido de las diapositivas')
      }

      setGeneratedSlides(data.slides)
      setShowSlidesDialog(false)
      
      // Mostrar el modal de descarga en lugar del preview
      setShowPreviewModal(true)
      toast.success("Diapositivas generadas exitosamente")

      // Agregar puntos por generar diapositivas
      if (email) {
        await gamificationService.addPoints(email, 10, 'presentation_creation')
        showPointsNotification(10, 'crear una presentación')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : "Error al generar las diapositivas")
    } finally {
      setIsGeneratingSlides(false)
    }
  }

  const generatePresentation = () => {
    const pptx = new pptxgen()
    
    // Configurar el master de la presentación
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: '#ffffff' },
      margin: [0.5, 0.5, 0.5, 0.5],
      objects: [
        { rect: { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: slidesForm.primaryColor } } },
        { rect: { x: 0, y: 1.2, w: '100%', h: 0.1, fill: { color: slidesForm.secondaryColor } } },
        { rect: { x: 0, y: 6.8, w: '100%', h: 0.2, fill: { color: slidesForm.secondaryColor } } }
      ]
    })

    // Diapositiva de presentación
    const titleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' })
    
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: slidesForm.secondaryColor, transparency: 20 },
      line: { color: slidesForm.primaryColor, width: 1 }
    })

    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 10,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: slidesForm.secondaryColor, transparency: 20 },
      line: { color: slidesForm.primaryColor, width: 1 }
    })

    titleSlide.addText(slidesForm.topic.toUpperCase(), {
      x: 0.5,
      y: 2.8,
      w: '95%',
      h: 1.2,
      fontSize: 44,
      color: slidesForm.primaryColor,
      align: 'center',
      bold: true,
      fontFace: 'Arial'
    })

    titleSlide.addText(`Nivel: ${unitData?.nivelEducativo}`, {
      x: 0.5,
      y: 4.2,
      w: '95%',
      h: 0.75,
      fontSize: 28,
      color: slidesForm.secondaryColor,
      align: 'center',
      fontFace: 'Arial'
    })

    // Diapositivas de contenido
    generatedSlides.forEach((slide, index) => {
      const pptxSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' })
      // Header bar (color secundario)
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 1.2, fill: { color: slidesForm.secondaryColor }
      })
      // Título en el header, blanco y centrado
      pptxSlide.addText(slide.title, {
        x: 0.5, y: 0.2, w: '95%', h: 1,
        fontSize: 32, color: '#FFF', bold: true, align: 'center', fontFace: 'Arial'
      })
      // Contenido debajo del header
      const contentLines = slide.content.split('\n').filter(line => line.trim())
      pptxSlide.addText(contentLines.map(line => ({
        text: line,
        options: {
          bullet: { type: 'number' },
          fontSize: 16,
          color: slidesForm.textColor,
          fontFace: 'Arial',
          breakLine: true,
          paraSpaceBefore: 6
        }
      })), {
        x: 1.5, y: 1.7, w: 5.8, h: 2.75,
        align: 'left',
      })
      // Número de diapositiva
      pptxSlide.addText(`${index + 1}/${generatedSlides.length}`, {
        x: 12, y: 6.8, w: 2, h: 0.5,
        fontSize: 14, color: '#888', align: 'right', fontFace: 'Arial'
      })
    })

    // Diapositiva final
    const endSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' })
    
    endSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: slidesForm.secondaryColor, transparency: 20 },
      line: { color: slidesForm.primaryColor, width: 1 }
    })

    endSlide.addShape(pptx.ShapeType.rect, {
      x: 10,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: slidesForm.secondaryColor, transparency: 20 },
      line: { color: slidesForm.primaryColor, width: 1 }
    })

    endSlide.addText('¡Gracias por su atención!', {
      x: 0.5,
      y: 2.8,
      w: '95%',
      h: 1.2,
      fontSize: 44,
      color: slidesForm.primaryColor,
      align: 'center',
      bold: true,
      fontFace: 'Arial'
    })

    endSlide.addText('¿Preguntas y comentarios?', {
      x: 0.5,
      y: 4.2,
      w: '95%',
      h: 0.75,
      fontSize: 28,
      color: slidesForm.secondaryColor,
      align: 'center',
      fontFace: 'Arial'
    })

    // Guardar la presentación
    pptx.writeFile({ fileName: `presentacion-${slidesForm.topic.toLowerCase().replace(/\s+/g, '-')}.pptx` })
    toast.success("Presentación generada exitosamente")
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedLesson(lesson)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Create a copy of the unit data
      const updatedUnit = {
        ...unitData,
        lecciones: unitData.lecciones.map(l => 
          l.dia === lesson.dia ? editedLesson : l
        )
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/update-class', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUnit)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la lección')
      }

      // Get the updated unit from the response
      const updatedData = await response.json()
      
      // Show success message
      toast.success('Lección actualizada exitosamente')
      
      // Update the unit data in the parent component
      handleUnitUpdate(updatedData)

      setIsEditing(false)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar la lección')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedLesson(lesson)
  }

  return (
    <>
    <PricingModal 
    open={showPricingModal} 
    onOpenChange={setShowPricingModal}
    accessMessage={accessMessage}
  />
   
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-xl w-[95vw] md:w-[70vw] h-[80vh] md:h-[90vh] overflow-hidden flex flex-col"
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-2 sm:p-3 md:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-400 to-blue-600"
        >
          <div className="flex items-center order-2 sm:order-1">
            <Calendar className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white mr-2 sm:mr-2" />
            <h2 className="text-sm sm:text-sm md:text-base font-display font-semibold text-white">
              {t('unitPlanner.view.dialogs.lessonDetails.title', { day: lesson.dia.toString() })} - {lesson.titulo}
            </h2>
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            {!isEditing ? (
              <Button variant="ghost" onClick={handleEdit} className="text-white hover:text-white/80 hover:bg-white/10 text-sm sm:text-sm">
                Editar
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSave} className="text-white hover:text-white/80 hover:bg-white/10 text-sm sm:text-sm">
                  Guardar
                </Button>
                <Button variant="ghost" onClick={handleCancel} className="text-white hover:text-white/80 hover:bg-white/10 text-sm sm:text-sm">
                  Cancelar
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose} className="text-white hover:text-white/80 hover:bg-white/10 text-sm sm:text-sm">
              {t('unitPlanner.view.dialogs.lessonDetails.close')}
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-hidden"
        >
          <div className="flex flex-col md:flex-row h-full">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-2 sm:p-3 md:p-4 flex-1 border-r overflow-y-auto"
            >
              {/* Navegación de secciones - Versión móvil */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="md:hidden mb-2"
              >
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => handleSectionChange('inicio')}
                    className={`flex-1 px-2 py-1.5 rounded-lg transition-all text-xs ${
                      activeSection === 'inicio'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {t('unitPlanner.view.dialogs.lessonDetails.sections.start')}
                  </button>
                  <button
                    onClick={() => handleSectionChange('desarrollo')}
                    className={`flex-1 px-2 py-1.5 rounded-lg transition-all text-xs ${
                      activeSection === 'desarrollo'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {t('unitPlanner.view.dialogs.lessonDetails.sections.development')}
                  </button>
                  <button
                    onClick={() => handleSectionChange('cierre')}
                    className={`flex-1 px-2 py-1.5 rounded-lg transition-all text-xs ${
                      activeSection === 'cierre'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {t('unitPlanner.view.dialogs.lessonDetails.sections.closure')}
                  </button>
                </div>
              </motion.div>

              {/* Navegación de secciones - Versión desktop */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="hidden md:flex flex-wrap gap-2 mb-3 border-b pb-3 sticky top-0 bg-white z-10"
              >
                <button
                  onClick={() => handleSectionChange('inicio')}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                    activeSection === 'inicio'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {t('unitPlanner.view.dialogs.lessonDetails.sections.start')}
                </button>
                <button
                  onClick={() => handleSectionChange('desarrollo')}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                    activeSection === 'desarrollo'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {t('unitPlanner.view.dialogs.lessonDetails.sections.development')}
                </button>
                <button
                  onClick={() => handleSectionChange('cierre')}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                    activeSection === 'cierre'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {t('unitPlanner.view.dialogs.lessonDetails.sections.closure')}
                </button>
              </motion.div>

              {/* Mensaje de ayuda */}
              {showHelp && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-700 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.help.title')}</h3>
                      <p className="text-xs text-blue-600">
                        {t('unitPlanner.view.dialogs.lessonDetails.help.description')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Contenido de secciones */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                {activeSection === 'inicio' && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Tema</label>
                          <input
                            type="text"
                            value={editedLesson.inicio.tema}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              inicio: { ...editedLesson.inicio, tema: e.target.value }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Actividades</label>
                          <textarea
                            value={editedLesson.inicio.actividades.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              inicio: { ...editedLesson.inicio, actividades: e.target.value.split('\n').filter(a => a.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Una actividad por línea"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Recursos</label>
                          <textarea
                            value={editedLesson.inicio.recursos.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              inicio: { ...editedLesson.inicio, recursos: e.target.value.split('\n').filter(r => r.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Un recurso por línea"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Logros</label>
                          <textarea
                            value={editedLesson.inicio.logros.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              inicio: { ...editedLesson.inicio, logros: e.target.value.split('\n').filter(l => l.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Un logro por línea"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-base text-blue-600 mb-3">{lesson.inicio.tema}</h4>
                        <div className="flex flex-col gap-3">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.activities')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.inicio.actividades.map((actividad, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="flex-shrink-0 w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
                                  <span className="text-base text-gray-600 whitespace-pre-line">{parseActivity(actividad)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.resources')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.inicio.recursos.map((recurso, index) => (
                                <li key={index} className="text-gray-600">{parseActivity(recurso)}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.achievements')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.inicio.logros.map((logro, index) => (
                                <li key={index} className="text-gray-600">{parseActivity(logro)}</li>
                              ))}
                            </ul>
                          </div>
                          {lesson.inicio.evidencia && (
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                {t('unitPlanner.view.dialogs.lessonDetails.sections.evidence')}
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.saber')}</h6>
                                  <p className="text-base text-gray-600">{lesson.inicio.evidencia.saber}</p>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.saberHacer')}</h6>
                                  <p className="text-base text-gray-600">{lesson.inicio.evidencia.saberHacer}</p>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.ser')}</h6>
                                  <p className="text-base text-gray-600">{lesson.inicio.evidencia.ser}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeSection === 'desarrollo' && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Tema</label>
                          <input
                            type="text"
                            value={editedLesson.desarrollo.tema}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              desarrollo: { ...editedLesson.desarrollo, tema: e.target.value }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Actividades</label>
                          <textarea
                            value={editedLesson.desarrollo.actividades.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              desarrollo: { ...editedLesson.desarrollo, actividades: e.target.value.split('\n').filter(a => a.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Una actividad por línea"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Recursos</label>
                          <textarea
                            value={editedLesson.desarrollo.recursos.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              desarrollo: { ...editedLesson.desarrollo, recursos: e.target.value.split('\n').filter(r => r.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Un recurso por línea"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Logros</label>
                          <textarea
                            value={editedLesson.desarrollo.logros.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              desarrollo: { ...editedLesson.desarrollo, logros: e.target.value.split('\n').filter(l => l.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Un logro por línea"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-base text-blue-600 mb-3">{lesson.desarrollo.tema}</h4>
                        <div className="flex flex-col gap-3">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.activities')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.desarrollo.actividades.map((actividad, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="flex-shrink-0 w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
                                  <span className="text-base text-gray-600 whitespace-pre-line">{parseActivity(actividad)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.resources')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.desarrollo.recursos.map((recurso, index) => (
                                <li key={index} className="text-gray-600">{parseActivity(recurso)}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.achievements')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.desarrollo.logros.map((logro, index) => (
                                <li key={index} className="text-gray-600">{parseActivity(logro)}</li>
                              ))}
                            </ul>
                          </div>
                          {lesson.desarrollo.evidencia && (
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                {t('unitPlanner.view.dialogs.lessonDetails.sections.evidence')}
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.saber')}</h6>
                                  <p className="text-base text-gray-600">{lesson.desarrollo.evidencia.saber}</p>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.saberHacer')}</h6>
                                  <p className="text-base text-gray-600">{lesson.desarrollo.evidencia.saberHacer}</p>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.ser')}</h6>
                                  <p className="text-base text-gray-600">{lesson.desarrollo.evidencia.ser}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeSection === 'cierre' && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Tema</label>
                          <input
                            type="text"
                            value={editedLesson.cierre.tema}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              cierre: { ...editedLesson.cierre, tema: e.target.value }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Actividades</label>
                          <textarea
                            value={editedLesson.cierre.actividades.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              cierre: { ...editedLesson.cierre, actividades: e.target.value.split('\n').filter(a => a.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Una actividad por línea"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Recursos</label>
                          <textarea
                            value={editedLesson.cierre.recursos.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              cierre: { ...editedLesson.cierre, recursos: e.target.value.split('\n').filter(r => r.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Un recurso por línea"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-600 mb-1">Logros</label>
                          <textarea
                            value={editedLesson.cierre.logros.join('\n')}
                            onChange={(e) => setEditedLesson({
                              ...editedLesson,
                              cierre: { ...editedLesson.cierre, logros: e.target.value.split('\n').filter(l => l.trim()) }
                            })}
                            className="w-full p-2 rounded-md border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                            placeholder="Un logro por línea"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-base text-blue-600 mb-3">{lesson.cierre.tema}</h4>
                        <div className="flex flex-col gap-3">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.activities')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.cierre.actividades.map((actividad, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="flex-shrink-0 w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
                                  <span className="text-base text-gray-600 whitespace-pre-line">{parseActivity(actividad)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.resources')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.cierre.recursos.map((recurso, index) => (
                                <li key={index} className="text-gray-600">{parseActivity(recurso)}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {t('unitPlanner.view.dialogs.lessonDetails.sections.achievements')}
                            </h5>
                            <ul className="space-y-1.5">
                              {lesson.cierre.logros.map((logro, index) => (
                                <li key={index} className="text-gray-600">{parseActivity(logro)}</li>
                              ))}
                            </ul>
                          </div>
                          {lesson.cierre.evidencia && (
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <h5 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                {t('unitPlanner.view.dialogs.lessonDetails.sections.evidence')}
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.saber')}</h6>
                                  <p className="text-base text-gray-600">{lesson.cierre.evidencia.saber}</p>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.saberHacer')}</h6>
                                  <p className="text-base text-gray-600">{lesson.cierre.evidencia.saberHacer}</p>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.sections.evidenceFields.ser')}</h6>
                                  <p className="text-base text-gray-600">{lesson.cierre.evidencia.ser}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Evaluation Section */}
                {lesson.evaluacion && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">Evaluación</h3>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-gray-700">{lesson.evaluacion}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Panel lateral - Versión móvil */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="md:hidden p-3 bg-gray-50 border-t"
            >
              <div className="space-y-2">
                {hasNextLesson && (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs py-1.5"
                    onClick={() => onNextLesson(nextLesson.dia)}
                  >
                    {t('unitPlanner.view.dialogs.lessonDetails.nextLesson')}
                  </Button>
                )}
                 <Button 
                  className="w-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white text-xs py-1.5 mt-2"
                  onClick={() => setShowEducationalToolsDialog(true)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Herramientas Educativas
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white text-xs py-1.5"
                  onClick={() => setShowQuestionnaireDialog(true)}
                  disabled={isGenerating}
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  {isGenerating ? t('unitPlanner.view.dialogs.generateQuestionnaire.generating') : t('unitPlanner.view.dialogs.generateQuestionnaire.generate')}
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white text-xs py-1.5"
                  onClick={() => setShowWordSearchDialog(true)}
                >
                  <LightbulbIcon className="w-4 h-4 mr-2" />
                  {t('unitPlanner.view.dialogs.generateWordSearch.generate')}
                </Button>

              </div>
            </motion.div>

            {/* Panel lateral - Versión desktop */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="hidden md:block p-4 md:w-[250px] bg-gray-50 border-t md:border-t-0 md:border-l overflow-y-auto"
            >
              <h3 className="font-medium text-base text-blue-500 mb-4">{t('unitPlanner.view.dialogs.lessonDetails.summary')}</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-sm text-blue-500 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.mainTopic')}</h4>
                  <p className="text-sm text-gray-600">{lesson.titulo}</p>
                </div>
                {lesson.fecha && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-sm text-blue-500 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.date')}</h4>
                    <p className="text-sm text-gray-600">{lesson.fecha}</p>
                  </div>
                )}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-sm text-blue-500 mb-1">{t('unitPlanner.view.dialogs.lessonDetails.estimatedDuration')}</h4>
                  <p className="text-sm text-gray-600">45 {t('unitPlanner.view.dialogs.lessonDetails.minutes')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-sm text-blue-500 mb-1">Videos relacionados</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                
                      <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-800"
                      onClick={() => {
                        setShowYoutubeDialog(true)
                        searchYoutubeVideos()
                      }}
                    >
                      <Youtube className="w-12 h-12" />
                      <span className="hidden sm:inline">Buscar Video</span>
                    </Button>
                  
                    </div>

                  </div>
                </div>
              </div>

              <div className="mt-6">
                {hasNextLesson && (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white mb-4"
                    onClick={() => onNextLesson(nextLesson.dia)}
                  >
                    {t('unitPlanner.view.dialogs.lessonDetails.nextLesson')}
                  </Button>
                )}
                   <Button 
                  className="w-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white text-xs py-1.5 mt-2  mb-4"
                  onClick={() => setShowEducationalToolsDialog(true)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Herramientas Educativas
                </Button>
            
                
                <Button 
                  className="w-full bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white mb-4"
                  onClick={() => setShowQuestionnaireDialog(true)}
                  disabled={isGenerating}
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  {isGenerating ? t('unitPlanner.view.dialogs.generateQuestionnaire.generating') : t('unitPlanner.view.dialogs.generateQuestionnaire.generate')}
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white"
                  onClick={() => setShowWordSearchDialog(true)}
                >
                  <LightbulbIcon className="w-4 h-4 mr-2" />
                  {t('unitPlanner.view.dialogs.generateWordSearch.generate')}
                </Button>

              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <Dialog open={showQuestionnaireDialog} onOpenChange={setShowQuestionnaireDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('unitPlanner.view.dialogs.generateQuestionnaire.title')}</DialogTitle>
            <DialogDescription>
              {t('unitPlanner.view.dialogs.generateQuestionnaire.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="questionType">{t('unitPlanner.view.dialogs.generateQuestionnaire.questionType')} *</Label>
              <Select
                value={questionnaireConfig.questionType}
                onValueChange={(value) => handleQuestionnaireConfigChange('questionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('unitPlanner.view.dialogs.generateQuestionnaire.selectQuestionType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opcion_multiple">{t('unitPlanner.view.dialogs.generateQuestionnaire.multipleChoice')}</SelectItem>
                  <SelectItem value="completar_espacios_en_blanco">{t('unitPlanner.view.dialogs.generateQuestionnaire.fillInTheBlank')}</SelectItem>
                  <SelectItem value="verdadero_falso">{t('unitPlanner.view.dialogs.generateQuestionnaire.trueFalse')}</SelectItem>
                  <SelectItem value="respuesta_escrita">{t('unitPlanner.view.dialogs.generateQuestionnaire.writtenResponse')}</SelectItem>
                  <SelectItem value="opcion_multiple_y_completar_espacios_en_blanco">{t('unitPlanner.view.dialogs.generateQuestionnaire.multipleChoiceAndFillInTheBlank')}</SelectItem>
                  <SelectItem value="opcion_multiple_y_verdadero_falso">{t('unitPlanner.view.dialogs.generateQuestionnaire.multipleChoiceAndTrueFalse')}</SelectItem>
                  <SelectItem value="opcion_multiple_y_respuesta_escrita">{t('unitPlanner.view.dialogs.generateQuestionnaire.multipleChoiceAndWrittenResponse')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="questionCount">{t('unitPlanner.view.dialogs.generateQuestionnaire.questionCount')} *</Label>
              <Select
                value={questionnaireConfig.questionCount.toString()}
                onValueChange={(value) => handleQuestionnaireConfigChange('questionCount', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('unitPlanner.view.dialogs.generateQuestionnaire.selectQuestionCount')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {t('unitPlanner.view.dialogs.generateQuestionnaire.questions')}</SelectItem>
                  <SelectItem value="10">10 {t('unitPlanner.view.dialogs.generateQuestionnaire.questions')}</SelectItem>
                  <SelectItem value="15">15 {t('unitPlanner.view.dialogs.generateQuestionnaire.questions')}</SelectItem>
                  <SelectItem value="20">20 {t('unitPlanner.view.dialogs.generateQuestionnaire.questions')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">{t('unitPlanner.view.dialogs.generateQuestionnaire.difficulty')} *</Label>
              <Select
                value={questionnaireConfig.difficulty}
                onValueChange={(value) => handleQuestionnaireConfigChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('unitPlanner.view.dialogs.generateQuestionnaire.selectDifficulty')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t('unitPlanner.view.dialogs.generateQuestionnaire.easy')}</SelectItem>
                  <SelectItem value="medium">{t('unitPlanner.view.dialogs.generateQuestionnaire.medium')}</SelectItem>
                  <SelectItem value="hard">{t('unitPlanner.view.dialogs.generateQuestionnaire.hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionnaireDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={generateQuestionnaire}>
              {isGenerating ? 'Generando...' : 'Generar Cuestionario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Educational Tools Dialog */}
      <Dialog open={showEducationalToolsDialog} onOpenChange={setShowEducationalToolsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Herramientas Educativas
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground pt-2">
              Selecciona una herramienta para generar mas contenido educativo basado en la lección actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4 pb-4">
          <div
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowDUAModal(true)}
            >
              <BookOpen className="h-8 w-8 text-gray-600 mb-2" />
              <span className="text-sm text-center font-medium">Generar DUA</span>
              <span className="text-xs text-gray-500 text-center mt-1">
                Diseño Universal para el Aprendizaje
              </span>
            </div>
            {educationalTools.map((tool) => (
              <motion.div
                key={tool.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20 group"
                onClick={() => {
                  if (tool.id === 'resumen') {
                    setShowEducationalToolsDialog(false)
                    setShowSummaryDialog(true)
                  } else if (tool.id === 'objetivos') {
                    setShowEducationalToolsDialog(false)
                    setShowObjectivesDialog(true)
                  } else if (tool.id === 'logros') {
                    setShowEducationalToolsDialog(false)
                    setShowRealWorldDialog(true)
                  } else if (tool.id === 'actividades') {
                    setShowEducationalToolsDialog(false)
                    setShowActivitiesDialog(true)
                  } else if (tool.id === 'proyectos') {
                    setShowEducationalToolsDialog(false)
                    setShowProjectsDialog(true)
                  } else if (tool.id === 'secuencia') {
                    setShowEducationalToolsDialog(false)
                    setShowSequenceDialog(true)
                  } else if (tool.id === 'fechas') {
                    setShowEducationalToolsDialog(false)
                    setShowDatesDialog(true)
                  } else if (tool.id === 'diapositivas') {
                    setShowEducationalToolsDialog(false)
                    setShowSlidesDialog(true)
                  } else if (tool.id === 'rubrica') {
                    setShowEducationalToolsDialog(false)
                    setShowRubricDialog(true)
                  } else if (tool.id === 'mapa-conceptual') {
                    setShowEducationalToolsDialog(false)
                    setShowConceptMapDialog(true)
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConceptMapModal
        isOpen={showConceptMapDialog}
        onClose={() => setShowConceptMapDialog(false)}
        lessonTitle={lesson.titulo}
        grade={unitData.grade}
      />

      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Generar Resumen
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera un resumen del tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleSummarySubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre del Resumen</Label>
                  <Input
                    id="name"
                    value={summaryForm.name}
                    onChange={(e) => setSummaryForm({...summaryForm, name: e.target.value})}
                    placeholder={`Resumen - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={summaryForm.topic || lesson.titulo}
                    onChange={(e) => setSummaryForm({...summaryForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={summaryForm.isPublic}
                    onCheckedChange={(checked) => setSummaryForm({...summaryForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowSummaryDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleSummarySubmit}
              disabled={isGeneratingSummary}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingSummary ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Resumen
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedSummary && (
        <WorkshopPreview
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          workshop={{
            id: 'summary-' + Date.now(),
            tipoTaller: 'resumen-tema',
            prompt: '',
            response: generatedSummary,
            timestamp: new Date().toISOString(),
            name: summaryForm.name || `Resumen - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Objectives Dialog */}
      <Dialog open={showObjectivesDialog} onOpenChange={setShowObjectivesDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Generar Objetivos de Aprendizaje
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera objetivos de aprendizaje para el tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleObjectivesSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de los Objetivos</Label>
                  <Input
                    id="name"
                    value={objectivesForm.name}
                    onChange={(e) => setObjectivesForm({...objectivesForm, name: e.target.value})}
                    placeholder={`Objetivos - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={objectivesForm.topic || lesson.titulo}
                    onChange={(e) => setObjectivesForm({...objectivesForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={objectivesForm.isPublic}
                    onCheckedChange={(checked) => setObjectivesForm({...objectivesForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowObjectivesDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleObjectivesSubmit}
              disabled={isGeneratingObjectives}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingObjectives ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Objetivos
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedObjectives && (
        <WorkshopPreview
          isOpen={showObjectivesPreviewModal}
          onClose={() => setShowObjectivesPreviewModal(false)}
          workshop={{
            id: 'objectives-' + Date.now(),
            tipoTaller: 'objetivos',
            prompt: '',
            response: generatedObjectives,
            timestamp: new Date().toISOString(),
            name: objectivesForm.name || `Objetivos - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Real World Benefits Dialog */}
      <Dialog open={showRealWorldDialog} onOpenChange={setShowRealWorldDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-600" />
              Generar Logros del Mundo Real
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera logros del mundo real para el tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleRealWorldSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de los Logros</Label>
                  <Input
                    id="name"
                    value={realWorldForm.name}
                    onChange={(e) => setRealWorldForm({...realWorldForm, name: e.target.value})}
                    placeholder={`Logros - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={realWorldForm.topic || lesson.titulo}
                    onChange={(e) => setRealWorldForm({...realWorldForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={realWorldForm.isPublic}
                    onCheckedChange={(checked) => setRealWorldForm({...realWorldForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowRealWorldDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleRealWorldSubmit}
              disabled={isGeneratingRealWorld}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingRealWorld ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Logros
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedRealWorld && (
        <WorkshopPreview
          isOpen={showRealWorldPreviewModal}
          onClose={() => setShowRealWorldPreviewModal(false)}
          workshop={{
            id: 'real-world-' + Date.now(),
            tipoTaller: 'logros-mundo-real',
            prompt: '',
            response: generatedRealWorld,
            timestamp: new Date().toISOString(),
            name: realWorldForm.name || `Logros del Mundo Real - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Activities Dialog */}
      <Dialog open={showActivitiesDialog} onOpenChange={setShowActivitiesDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              Generar Ideas de Actividades
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera ideas de actividades para el tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleActivitiesSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de las Actividades</Label>
                  <Input
                    id="name"
                    value={activitiesForm.name}
                    onChange={(e) => setActivitiesForm({...activitiesForm, name: e.target.value})}
                    placeholder={`Actividades - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={activitiesForm.topic || lesson.titulo}
                    onChange={(e) => setActivitiesForm({...activitiesForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={activitiesForm.isPublic}
                    onCheckedChange={(checked) => setActivitiesForm({...activitiesForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowActivitiesDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleActivitiesSubmit}
              disabled={isGeneratingActivities}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingActivities ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Actividades
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedActivities && (
        <WorkshopPreview
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          workshop={{
            id: 'activities-' + Date.now(),
            tipoTaller: 'ideas-actividades',
            prompt: '',
            response: generatedActivities,
            timestamp: new Date().toISOString(),
            name: activitiesForm.name || `Ideas de Actividades - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Projects Dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <Rocket className="w-6 h-6 text-indigo-600" />
              Generar Proyectos
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera proyectos para el tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleProjectsSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de los Proyectos</Label>
                  <Input
                    id="name"
                    value={projectsForm.name}
                    onChange={(e) => setProjectsForm({...projectsForm, name: e.target.value})}
                    placeholder={`Proyectos - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={projectsForm.topic || lesson.titulo}
                    onChange={(e) => setProjectsForm({...projectsForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={projectsForm.isPublic}
                    onCheckedChange={(checked) => setProjectsForm({...projectsForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowProjectsDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleProjectsSubmit}
              disabled={isGeneratingProjects}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingProjects ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Proyectos
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedProjects && (
        <WorkshopPreview
          isOpen={showProjectsPreviewModal}
          onClose={() => setShowProjectsPreviewModal(false)}
          workshop={{
            id: 'projects-' + Date.now(),
            tipoTaller: 'proyecto',
            prompt: '',
            response: generatedProjects,
            timestamp: new Date().toISOString(),
            name: projectsForm.name || `Proyecto - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Sequence Dialog */}
      <Dialog open={showSequenceDialog} onOpenChange={setShowSequenceDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <ListOrdered className="w-6 h-6 text-indigo-600" />
              Generar Secuencia Didáctica
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera una secuencia didáctica para el tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleSequenceSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de la Secuencia</Label>
                  <Input
                    id="name"
                    value={sequenceForm.name}
                    onChange={(e) => setSequenceForm({...sequenceForm, name: e.target.value})}
                    placeholder={`Secuencia Didáctica - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={sequenceForm.topic || lesson.titulo}
                    onChange={(e) => setSequenceForm({...sequenceForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={sequenceForm.isPublic}
                    onCheckedChange={(checked) => setSequenceForm({...sequenceForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowSequenceDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleSequenceSubmit}
              disabled={isGeneratingSequence}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingSequence ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Secuencia
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedSequence && (
        <WorkshopPreview
          isOpen={showSequencePreviewModal}
          onClose={() => setShowSequencePreviewModal(false)}
          workshop={{
            id: 'sequence-' + Date.now(),
            tipoTaller: 'secuencia-didactica',
            prompt: '',
            response: generatedSequence,
            timestamp: new Date().toISOString(),
            name: sequenceForm.name || `Secuencia Didáctica - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Dates Dialog */}
      <Dialog open={showDatesDialog} onOpenChange={setShowDatesDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Generar Ideas para Fechas Conmemorativas
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera ideas para fechas conmemorativas relacionadas con el tema actual: "{lesson.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleDatesSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de las Ideas</Label>
                  <Input
                    id="name"
                    value={datesForm.name}
                    onChange={(e) => setDatesForm({...datesForm, name: e.target.value})}
                    placeholder={`Fechas Conmemorativas - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={datesForm.topic || lesson.titulo}
                    onChange={(e) => setDatesForm({...datesForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={datesForm.isPublic}
                    onCheckedChange={(checked) => setDatesForm({...datesForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowDatesDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleDatesSubmit}
              disabled={isGeneratingDates}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingDates ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Ideas
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedDates && (
        <WorkshopPreview
          isOpen={showDatesPreviewModal}
          onClose={() => setShowDatesPreviewModal(false)}
          workshop={{
            id: 'dates-' + Date.now(),
            tipoTaller: 'fechas-conmemorativas',
            prompt: '',
            response: generatedDates,
            timestamp: new Date().toISOString(),
            name: datesForm.name || `Fechas Conmemorativas - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Slides Dialog */}
      <Dialog open={showSlidesDialog} onOpenChange={setShowSlidesDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <Presentation className="w-6 h-6 text-indigo-600" />
              Generar Diapositivas
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Genera diapositivas profesionales para tu clase con el contenido de la lección.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            <form onSubmit={handleSlidesSubmit} className="space-y-6 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de las Diapositivas</Label>
                  <Input
                    id="name"
                    value={slidesForm.name}
                    onChange={(e) => setSlidesForm({...slidesForm, name: e.target.value})}
                    placeholder={`Diapositivas - ${lesson.titulo}`}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course" className="text-gray-700 font-medium">Nivel Educativo</Label>
                  <Input
                    id="course"
                    value={unitData?.nivelEducativo || ''}
                    className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base bg-gray-50"
                    disabled
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-gray-700 font-medium">Tema</Label>
                  <textarea
                    id="topic"
                    className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Escribe aquí el contenido del tema..."
                    value={slidesForm.topic || lesson.titulo}
                    onChange={(e) => setSlidesForm({...slidesForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slideCount" className="text-gray-700 font-medium">Número de Diapositivas</Label>
                  <Select
                    value={slidesForm.slideCount}
                    onValueChange={(value) => setSlidesForm({...slidesForm, slideCount: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el número de diapositivas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="13">13</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-gray-700 font-medium">Color Principal</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={slidesForm.primaryColor}
                        onChange={(e) => setSlidesForm({...slidesForm, primaryColor: e.target.value})}
                        className="w-12 h-12 p-1 border rounded-lg cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={slidesForm.primaryColor}
                        onChange={(e) => setSlidesForm({...slidesForm, primaryColor: e.target.value})}
                        className="flex-1 p-3 border rounded-lg font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-gray-700 font-medium">Color Secundario</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={slidesForm.secondaryColor}
                        onChange={(e) => setSlidesForm({...slidesForm, secondaryColor: e.target.value})}
                        className="w-12 h-12 p-1 border rounded-lg cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={slidesForm.secondaryColor}
                        onChange={(e) => setSlidesForm({...slidesForm, secondaryColor: e.target.value})}
                        className="flex-1 p-3 border rounded-lg font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="textColor" className="text-gray-700 font-medium">Color del Texto</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="textColor"
                        type="color"
                        value={slidesForm.textColor}
                        onChange={(e) => setSlidesForm({...slidesForm, textColor: e.target.value})}
                        className="w-12 h-12 p-1 border rounded-lg cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={slidesForm.textColor}
                        onChange={(e) => setSlidesForm({...slidesForm, textColor: e.target.value})}
                        className="flex-1 p-3 border rounded-lg font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={slidesForm.isPublic}
                    onCheckedChange={(checked) => setSlidesForm({...slidesForm, isPublic: checked as boolean})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isPublic" className="text-gray-600">Compartir recursos educativos con otros profesores</Label>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setShowSlidesDialog(false)} className="hover:bg-gray-100 transition-colors duration-200">
              Cancelar
            </Button>
            <Button 
              onClick={handleSlidesSubmit}
              disabled={isGeneratingSlides}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isGeneratingSlides ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Diapositivas
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedSlides && (
        <WorkshopPreview
          isOpen={showSlidesDownloadModal}
          onClose={() => setShowSlidesDownloadModal(false)}
          workshop={{
            id: 'slides-' + Date.now(),
            tipoTaller: 'diapositivas',
            prompt: '',
            response: JSON.stringify(generatedSlides),
            timestamp: new Date().toISOString(),
            name: slidesForm.name || `Diapositivas - ${lesson.titulo}`,
            email: localStorage.getItem('email') || '',
            activate: true
          }}
        />
      )}

      {/* Add Rubric Dialog */}
      <Dialog open={showRubricDialog} onOpenChange={setShowRubricDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
              Rúbrica de Evaluación
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                <p className="text-sm text-gray-500 italic">
                  La rúbrica se guardará automáticamente en el historial de la lección.
                </p>
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto border-red-200 hover:border-red-300 transition-colors duration-200"
                  onClick={() => {
                    setRubricData(null);
                    setShowRubricDialog(false);
                    toast.success("Rúbrica limpiada y guardada en el historial");
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar Rúbrica
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full px-1">
            {rubricData ? (
              <div className="space-y-4 p-4">
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={exportRubricToPDF}
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar a PDF
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={exportRubricToExcel}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar a Excel
                  </Button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">{rubricData.titulo}</h2>
                  <p className="text-gray-600 mb-6 italic">{rubricData.descripcion}</p>

                  <div className="space-y-6">
                    {rubricData.criterios.map((criterio: any, index: number) => (
                      <div key={index} className="border-t border-gray-100 pt-6">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse bg-white">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <th className="border border-gray-200 p-3 text-left w-1/5 text-gray-700">Criterio</th>
                                <th className="border border-gray-200 p-3 text-left w-1/4 text-gray-700">Descripción</th>
                                <th className="border border-gray-200 p-3 text-left w-2/5 text-gray-700">Escala de Calificación</th>
                                <th className="border border-gray-200 p-3 text-center w-1/5 text-gray-700">Calificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="border border-gray-200 p-3 font-semibold text-gray-800">{criterio.nombre}</td>
                                <td className="border border-gray-200 p-3 text-gray-600">{criterio.descripcion}</td>
                                <td className="border border-gray-200 p-3">
                                  <div className="space-y-2">
                                    {criterio.escala.map((nivel: any, nivelIndex: number) => (
                                      <div key={nivelIndex} className={`${nivelIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-2 rounded-md`}>
                                        <span className="font-semibold text-indigo-600">Puntaje {nivel.puntaje}:</span> {nivel.descripcion}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="border border-gray-200 p-3 text-center">
                                  <div className="flex items-center justify-center h-full">
                                    <input 
                                      type="number" 
                                      min="1" 
                                      max="5" 
                                      className="w-16 h-8 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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

                    <div className="border-t border-gray-100 pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white">
                          <tbody>
                            <tr className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                              <td className="border border-gray-200 p-3 font-semibold w-1/5 text-indigo-700">Calificación Final</td>
                              <td className="border border-gray-200 p-3 w-1/4 text-gray-700">Total de puntos obtenidos</td>
                              <td className="border border-gray-200 p-3 w-2/5">
                                <div className="space-y-2">
                                  <div className="bg-white p-2 rounded-md">
                                    <span className="font-semibold text-indigo-600">Puntaje Total:</span> ______ / {rubricData.criterios.length * 5}
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-md">
                                    <span className="font-semibold text-indigo-600">Nota Final:</span> ______
                                  </div>
                                </div>
                              </td>
                              <td className="border border-gray-200 p-3 text-center w-1/5">
                                <div className="flex items-center justify-center h-full">
                                  <input 
                                    type="number" 
                                    className="w-16 h-8 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    placeholder="Nota"
                                  />
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-indigo-600" />
                    Configuración de la Rúbrica
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="rubricName" className="text-gray-700 font-medium">Nombre</Label>
                      <Input
                        id="rubricName"
                        value={rubricForm.name}
                        onChange={(e) => setRubricForm({...rubricForm, name: e.target.value})}
                        className="w-full p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        placeholder="Ingrese el nombre..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="rubricTopic" className="text-gray-700 font-medium">Tema de la Rúbrica</Label>
                      <textarea
                        id="rubricTopic"
                        value={rubricForm.topic}
                        onChange={(e) => setRubricForm({...rubricForm, topic: e.target.value})}
                        className="w-full min-h-[100px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        placeholder="Ingrese el tema de la rúbrica..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="unitDetails" className="text-gray-700 font-medium">Detalles de la Clase</Label>
                      <textarea
                        id="unitDetails"
                        value={rubricForm.details}
                        onChange={(e) => setRubricForm({...rubricForm, details: e.target.value})}
                        className="w-full min-h-[100px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        placeholder="Ingrese los detalles de la clase..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="standards" className="text-gray-700 font-medium">Estándares y Objetivos</Label>
                      <textarea
                        id="standards"
                        value={rubricForm.standards}
                        onChange={(e) => setRubricForm({...rubricForm, standards: e.target.value})}
                        className="w-full min-h-[100px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        placeholder="Ingrese los estándares y objetivos..."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        checked={false}
                        disabled
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="isPublic" className="text-gray-600">Compartir rúbrica con otros profesores</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm">
            <Button 
              onClick={generateRubric}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generar Rúbrica
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de descarga de diapositivas */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Diapositivas Generadas</DialogTitle>
            <DialogDescription>
              Tus diapositivas han sido generadas exitosamente. Puedes descargarlas ahora.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {generatedSlides.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant="default"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                    onClick={generatePresentation}
                  >
                    <FileDown className="w-6 h-6" />
                    <span className="font-semibold">Descargar Diapositivas (PowerPoint)</span>
                  </Button>
                </div>

                <div className="space-y-6">
                  {generatedSlides.map((slide, index) => (
                    <div key={index} className="bg-white rounded-lg border shadow-sm p-4">
                      <h3 className="text-lg font-semibold mb-2">{slide.title}</h3>
                      <div className="prose max-w-none">
                        {slide.content.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay diapositivas generadas</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar diapositivas automáticamente.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Video Dialog */}
      <Dialog open={showYoutubeDialog} onOpenChange={setShowYoutubeDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Videos Educativos Relacionados en YouTube</DialogTitle>
            <DialogDescription>
              Videos  relacionados con el tema de la clase
            </DialogDescription>
          </DialogHeader>

          <div className="h-[calc(80vh-8rem)] overflow-y-auto pr-2">
            { youtubeResults.length === 0 ? (
              <div className="flex items-center justify-center py-8">
               
               <span className="ml-2">
               Hoy alcanzamos el límite de consultas a YouTube 😓. Vuelve a intentarlo mañana para ver los videos disponibles. Recuerda usar esta función con moderación para que todos los profesores puedan acceder sin inconvenientes 🙌.
               </span>x
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {youtubeResults.map((video) => (
                  <div
                    key={video.id.videoId}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={video.snippet.thumbnails.high.url}
                        alt={video.snippet.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <Youtube className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {video.snippet.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {video.snippet.channelTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="aspect-video bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedVideo?.id.videoId}`}
              title={selectedVideo?.snippet.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
          <div className="p-6">
            <h3 className="font-medium text-lg">{selectedVideo?.snippet.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedVideo?.snippet.channelTitle}
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Descripción</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedVideo?.snippet.description}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DUAModal
        isOpen={showDUAModal}
        onClose={() => setShowDUAModal(false)}
        lessonData={lesson}
        unitData={unitData}
      />

      <ConceptMapModal
        isOpen={showConceptMapDialog}
        onClose={() => setShowConceptMapDialog(false)}
        lessonTitle={lesson.titulo}
        grade={unitData.grade}
      />

    </motion.div>
    </>
  )
}

