"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ToolCard } from "@/components/tool-card"
import { SearchBar } from "@/components/search-bar"
import { useState, useRef, useEffect } from "react"
import { useFavorites } from "@/contexts/favorites-context"
import { 
  RiQuestionAnswerFill,
  RiBookReadFill,
  RiFileTextFill,
  RiLightbulbFill,
  RiMagicFill,
  RiEarthFill,
  RiProjectorFill,
  RiFileChartFill,
  RiCalendarCheckFill,
  RiEdit2Fill,
  RiFileListFill,
  RiSearchEyeFill,
  RiPuzzleFill,
  RiBrainFill,
  RiGameFill,
  RiAddLine,
  RiGroupFill,
  RiUserStarFill,
  RiAwardFill,
  RiStarFill,
  RiFileCheckFill,
  RiUserSettingsLine,
  RiTentLine,
  RiMailFill,
  RiListCheck,
  RiYoutubeFill,
  RiToolsFill,
  RiCalendarFill,
  RiBookFill,
  RiMindMap,
  RiImageFill,
  RiSearchFill,
  RiMicFill,
  RiCheckboxCircleFill,
  RiTimeLine
} from 'react-icons/ri'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, FileText, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, Trash2, Star, ThumbsUp, ThumbsDown, Accessibility, Heart, Shield } from "lucide-react"
import jsPDF from 'jspdf'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CustomToolConfig } from "@/types/custom-tool"
import { Tool } from "@/types/tool"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { RiHeartFill, RiHeartLine } from "react-icons/ri"
import { useLanguage } from "../contexts/LanguageContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Workshop() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavorites, setShowFavorites] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showGettingStarted, setShowGettingStarted] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState("")
  const { favorites, toggleFavorite } = useFavorites()
  const [tools, setTools] = useState<Tool[]>([])
  const [customTools, setCustomTools] = useState<CustomToolConfig[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()

  // Recommended tools for inclusion (most used for inclusive education)
  const recommendedTools = [
    "dua",
    "ajustes-razonables",
    "planificador-lecciones",
    "creador-cuestionarios",
    "accesibilidad-textos",
    "nivelacion-textos"
  ]

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true)
        // Fetch predefined tools
        const predefinedTools: Tool[] = [
          {
            id: "dua",
            title: t('workshop.tools.dua.title'),
            description: t('workshop.tools.dua.description'),
            icon: <Accessibility className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/dua",
            category: "assessment" as const
          },

          {
            id: "imagenes-colorear",
            title: "Generador de imágenes para Colorear",
            description: "Genera imágenes educativas para colorear personalizadas según el tema y nivel de tus estudiantes.",
            icon: <RiFileTextFill className="w-8 h-8 text-pink-500" />,
            href: "/workshop/coloring",
            category: "content" as const
           
          },
          {
            id: "generador-imagenes-profesores",
            title: "Generador de Imágenes educativas",
            description: "Crea imágenes personalizadas para tus materiales educativos con IA.",
            icon: <RiImageFill className="w-8 h-8 text-purple-500" />,
            href: "/workshop/educational-images",
            category: "content" as const
           
      
          },
          {
            id: "generador-podcasts-educativos",
            title: "Generador de Podcasts Educativos",
            description: "Sube tus materiales en PDF o DOC y conviértelos automáticamente en podcasts educativos interactivos.",
            icon: <RiMicFill className="w-8 h-8 text-blue-500" />,
            href: "/workshop/generador-podcasts-educativos",
            category: "content" as const
      
          },
          {
            id: "creador-cuestionarios",
            title: t('workshop.tools.quizCreator.title'),
            description: t('workshop.tools.quizCreator.description'),
            icon: <RiQuestionAnswerFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/creador-cuestionarios",
            category: "assessment" as const
          },
          {
            id: "planificador-lecciones",
            title: t('workshop.tools.lessonPlanner.title'),
            description: t('workshop.tools.lessonPlanner.description'),
            icon: <RiBookReadFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/planificador-lecciones",
            category: "planning" as const
          },
          {
            id: "buscador-imagenes",
            title: t('workshop.tools.imageSearch.title'),
            description: t('workshop.tools.imageSearch.description'),
            icon: <RiSearchFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/buscador-imagenes",
            category: "content" as const
          },
          /*
          {
            id: "material-educativo",
            title: t('workshop.tools.educationalMaterial.title'),
            description: t('workshop.tools.educationalMaterial.description'),
            icon: <RiFileTextFill className="w-8 h-8 text-purple-500" />,
            href: "/workshop/material-educativo",
            category: "content" as const
          },
          */
          {
            id: "generador-ideas",
            title: t('workshop.tools.ideaGenerator.title'),
            description: t('workshop.tools.ideaGenerator.description'),
            icon: <RiLightbulbFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/generador-ideas",
            category: "content" as const
          },
          {
            id: "ajustes-razonables",
            title: t('workshop.tools.reasonableAdjustments.title'),
            description: t('workshop.tools.reasonableAdjustments.description'),
            icon: <Heart className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/ajustes-razonables",
            category: "assessment" as const
          },
          {
            id: "steam",
            title: t('workshop.tools.steam.title'),
            description: t('workshop.tools.steam.description'),
            icon: <RiUserSettingsLine className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/steam",
            category: "planning" as const
          },
          {
            id: "rubrica",
            title: t('workshop.tools.rubric.title'),
            description: t('workshop.tools.rubric.description'),
            icon: <RiFileTextFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/rubrica",
            category: "assessment" as const
          },
          {
            id: "cotejo",
            title: t('workshop.tools.checklist.title'),
            description: t('workshop.tools.checklist.description'),
            icon: <RiCheckboxCircleFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/cotejo",
            category: "assessment" as const
          },
          {
            id: "diapositivas",
            title: t('workshop.tools.slides.title'),
            description: t('workshop.tools.slides.description'),
            icon: <RiProjectorFill className="w-8 h-8 text-indigo-500" />,
            href: "/workshop/diapositivas",
            category: "content" as const
          },
          {
            id: "sopa-de-letras",
            title: t('workshop.tools.wordSearch.title'),
            description: t('workshop.tools.wordSearch.description'),
            icon: <RiSearchEyeFill className="w-8 h-8 text-purple-400" />,
            href: "/workshop/sopa-de-letras",
            category: "content" as const
          },
          {
            id: "ia-libre",
            title: t('workshop.tools.freeAI.title'),
            description: t('workshop.tools.freeAI.description'),
            icon: <RiMagicFill className="w-8 h-8 text-pink-500" />,
            href: "/workshop/ia-libre",
            category: "content" as const
          },
          {
            id: "beneficios-mundo-real",
            title: t('workshop.tools.realWorldBenefits.title'),
            description: t('workshop.tools.realWorldBenefits.description'),
            icon: <RiEarthFill className="w-8 h-8 text-teal-500" />,
            href: "/workshop/beneficios-mundo-real",
            category: "content" as const
          },
          {
            id: "generador-proyectos",
            title: t('workshop.tools.projectGenerator.title'),
            description: t('workshop.tools.projectGenerator.description'),
            icon: <RiProjectorFill className="w-8 h-8 text-orange-500" />,
            href: "/workshop/generador-proyectos",
            category: "content" as const
          },
          {
            id: "informes-estudiantes",
            title: t('workshop.tools.studentReports.title'),
            description: t('workshop.tools.studentReports.description'),
            icon: <RiFileChartFill className="w-8 h-8 text-indigo-500" />,
            href: "/workshop/informes-estudiantes",
            category: "assessment" as const
          },
          {
            id: "fechas-conmemorativas",
            title: t('workshop.tools.commemorativeDates.title'),
            description: t('workshop.tools.commemorativeDates.description'),
            icon: <RiCalendarCheckFill className="w-8 h-8 text-red-500" />,
            href: "/workshop/fechas-conmemorativas",
            category: "planning" as const
          },
          {
            id: "corrector-gramatical",
            title: t('workshop.tools.grammarChecker.title'),
            description: t('workshop.tools.grammarChecker.description'),
            icon: <RiEdit2Fill className="w-8 h-8 text-teal-500" />,
            href: "/workshop/corrector-gramatical",
            category: "content" as const
          },
          {
            id: "resumen-tema",
            title: t('workshop.tools.topicSummary.title'),
            description: t('workshop.tools.topicSummary.description'),
            icon: <RiFileListFill className="w-8 h-8 text-blue-400" />,
            href: "/workshop/resumen-tema",
            category: "content" as const
          },
          {
            id: "crucigrama",
            title: t('workshop.tools.crossword.title'),
            description: t('workshop.tools.crossword.description'),
            icon: <RiPuzzleFill className="w-8 h-8 text-green-400" />,
            href: "/workshop/crucigrama",
            category: "content" as const
          },
          {
            id: "mapa-mental-flow",
            title: t('workshop.tools.mindMap.title'),
            description: t('workshop.tools.mindMap.description'),
            icon: <RiMindMap className="w-8 h-8 text-purple-500" />,
            href: "/workshop/mapa-mental-flow",
            category: "content" as const
          },
          {
            id: "mapa-conceptual",
            title: t('workshop.tools.conceptMap.title'),
            description: t('workshop.tools.conceptMap.description'),
            icon: <RiMindMap className="w-8 h-8 text-purple-500" />,
            href: "/workshop/mapa-conceptual",
            category: "content" as const
          },
          {
            id: "linea-tiempo",
            title: t('workshop.tools.timeline.title'),
            description: t('workshop.tools.timeline.description'),
            icon: <RiTimeLine className="w-8 h-8 text-blue-500" />,
            href: "/workshop/linea-tiempo",
            category: "content" as const
          },
          {
            id: "ruleta-preguntas",
            title: t('workshop.tools.questionWheel.title'),
            description: t('workshop.tools.questionWheel.description'),
            icon: <RiGameFill className="w-8 h-8 text-yellow-400" />,
            href: "/workshop/ruleta-preguntas",
            category: "assessment" as const
          },
          {
            id: "talleres-padres",
            title: t('workshop.tools.parentWorkshops.title'),
            description: t('workshop.tools.parentWorkshops.description'),
            icon: <RiGroupFill className="w-8 h-8 text-blue-500" />,
            href: "/workshop/talleres-padres",
            category: "communication" as const
          },
          {
            id: "capacitacion-docentes",
            title: t('workshop.tools.teacherTraining.title'),
            description: t('workshop.tools.teacherTraining.description'),
            icon: <RiUserStarFill className="w-8 h-8 text-green-500" />,
            href: "/workshop/capacitacion-docentes",
            category: "planning" as const
          },
          {
            id: "estandares-calidad",
            title: t('workshop.tools.qualityStandards.title'),
            description: t('workshop.tools.qualityStandards.description'),
            icon: <RiAwardFill className="w-8 h-8 text-purple-500" />,
            href: "/workshop/estandares-calidad",
            category: "planning" as const
          },
          {
            id: "ideas-actividades",
            title: t('workshop.tools.activityIdeas.title'),
            description: t('workshop.tools.activityIdeas.description'),
            icon: <RiGameFill className="w-8 h-8 text-blue-500" />,
            href: "/workshop/ideas-actividades",
            category: "content" as const
          },
          {
            id: "secuencia-didactica",
            title: t('workshop.tools.didacticSequence.title'),
            description: t('workshop.tools.didacticSequence.description'),
            icon: <RiBookReadFill className="w-8 h-8 text-purple-500" />,
            href: "/workshop/secuencia-didactica",
            category: "planning" as const
          },
          {
            id: "redaccion",
            title: t('workshop.tools.writing.title'),
            description: t('workshop.tools.writing.description'),
            icon: <RiEdit2Fill className="w-8 h-8 text-green-500" />,
            href: "/workshop/redaccion",
            category: "content" as const
          },
          {
            id: "preguntas-texto",
            title: t('workshop.tools.textQuestions.title'),
            description: t('workshop.tools.textQuestions.description'),
            icon: <RiQuestionAnswerFill className="w-8 h-8 text-yellow-500" />,
            href: "/workshop/preguntas-texto",
            category: "assessment" as const
          },
          {
            id: "plan-recuperacion",
            title: t('workshop.tools.recoveryPlan.title'),
            description: t('workshop.tools.recoveryPlan.description'),
            icon: <RiUserStarFill className="w-8 h-8 text-red-500" />,
            href: "/workshop/plan-recuperacion",
            category: "planning" as const
          },
          {
            id: "correccion-preguntas",
            title: t('workshop.tools.questionCorrection.title'),
            description: t('workshop.tools.questionCorrection.description'),
            icon: <RiFileCheckFill className="w-8 h-8 text-indigo-500" />,
            href: "/workshop/correccion-preguntas",
            category: "assessment" as const
          },
          {
            id: "calificador-ensayos",
            title: t('workshop.tools.essayGrader.title'),
            description: t('workshop.tools.essayGrader.description'),
            icon: <RiFileChartFill className="w-8 h-8 text-cyan-500" />,
            href: "/workshop/calificador-ensayos",
            category: "assessment" as const
          },
          {
            id: "nivelacion-textos",
            title: t('workshop.tools.textLeveling.title'),
            description: t('workshop.tools.textLeveling.description'),
            icon: <RiFileTextFill className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/nivelacion-textos",
            category: "content" as const
          },
          {
            id: "accesibilidad-textos",
            title: t('workshop.tools.textAccessibility.title'),
            description: t('workshop.tools.textAccessibility.description'),
            icon: <Shield className="w-8 h-8" style={{ color: '#65cc8a' }} />,
            href: "/workshop/accesibilidad-textos",
            category: "content" as const
          },
          {
            id: "objetivos-aprendizaje",
            title: t('workshop.tools.learningObjectives.title'),
            description: t('workshop.tools.learningObjectives.description'),
            icon: <RiTentLine className="w-8 h-8 text-teal-500" />,
            href: "/workshop/objetivos-aprendizaje",
            category: "planning" as const
          },
          {
            id: "correos-escolares",
            title: t('workshop.tools.schoolEmails.title'),
            description: t('workshop.tools.schoolEmails.description'),
            icon: <RiMailFill className="w-8 h-8 text-blue-400" />,
            href: "/workshop/correos-escolares",
            category: "communication" as const
          },
          {
            id: "correos-padres",
            title: t('workshop.tools.parentEmails.title'),
            description: t('workshop.tools.parentEmails.description'),
            icon: <RiMailFill className="w-8 h-8 text-blue-400" />,
            href: "/workshop/correos-padres",
            category: "communication" as const
          },
          {
            id: "instrucciones-claras",
            title: t('workshop.tools.clearInstructions.title'),
            description: t('workshop.tools.clearInstructions.description'),
            icon: <RiListCheck className="w-8 h-8 text-green-400" />,
            href: "/workshop/instrucciones-claras",
            category: "communication" as const
          },
          {
            id: "correccion-pruebas",
            title: t('workshop.tools.paperTestCorrection.title'),
            description: t('workshop.tools.paperTestCorrection.description'),
            icon: <RiFileCheckFill className="w-8 h-8 text-violet-500" />,
            href: "/workshop/correccion-pruebas",
            category: "assessment" as const
          },
          {
            id: "preguntas-video",
            title: t('workshop.tools.videoQuestions.title'),
            description: t('workshop.tools.videoQuestions.description'),
            icon: <RiYoutubeFill className="w-8 h-8 text-red-500" />,
            href: "/workshop/preguntas-video",
            category: "assessment" as const
          }
        ]
        setTools(predefinedTools)

        // Fetch custom tools from backend
        const email = localStorage.getItem("email")
        const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools?email=' + email)
        if (!response.ok) {
          throw new Error('Error al cargar las herramientas personalizables')
        }
        const customToolsData = await response.json()
        setCustomTools(customToolsData)
      } catch (error) {
        console.error('Error fetching tools:', error)
        toast.error('Error al cargar las herramientas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTools()
  }, [])

  const categories = [
    { id: "all", name: t('workshop.categories.all') },
    { id: "planning", name: t('workshop.categories.planning') },
    { id: "assessment", name: t('workshop.categories.assessment') },
    { id: "content", name: t('workshop.categories.content') },
    { id: "communication", name: t('workshop.categories.communication') }
  ]

  const handleDeactivate = async (id: string) => {
    // Crear un div para el diálogo
    const dialog = document.createElement('div')
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
    dialog.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 animate-fade-in">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900">Eliminar Herramienta</h3>
        </div>
        <p class="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar esta herramienta? Esta acción no se puede deshacer.</p>
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200" id="cancelBtn">
            Cancelar
          </button>
          <button class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200" id="confirmBtn">
            Eliminar
          </button>
        </div>
      </div>
    `

    // Agregar estilos
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }
    `
    document.head.appendChild(style)

    // Agregar el diálogo al body
    document.body.appendChild(dialog)

    // Crear una promesa para manejar la confirmación
    return new Promise((resolve) => {
      const confirmBtn = dialog.querySelector('#confirmBtn')
      const cancelBtn = dialog.querySelector('#cancelBtn')

      const handleConfirm = () => {
        document.body.removeChild(dialog)
        document.head.removeChild(style)
        resolve(true)
      }

      const handleCancel = () => {
        document.body.removeChild(dialog)
        document.head.removeChild(style)
        resolve(false)
      }

      confirmBtn?.addEventListener('click', handleConfirm)
      cancelBtn?.addEventListener('click', handleCancel)
    }).then(async (confirmed) => {
      if (!confirmed) return

      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools/deactivate/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error response:', errorText)
          throw new Error('Error al eliminar la herramienta')
        }

        setCustomTools(prev => prev.filter(tool => tool._id !== id))
        toast.success('Herramienta eliminada exitosamente')
      } catch (error) {
        console.error('Error al eliminar la herramienta:', error)
        toast.error('Error al eliminar la herramienta')
      }
    })
  }

  // Convert custom tools to Tool format
  const mappedCustomTools = customTools.map(tool => {
    if (!tool._id) {
      console.error('Custom tool missing ID:', tool);
      return null;
    }
    return {
      id: tool._id,
      title: tool.name,
      description: tool.description,
      icon: <RiToolsFill className="w-8 h-8 text-indigo-500" />,
      href: `/workshop/custom-tools/${tool._id}`,
      category: tool.category as "assessment" | "planning" | "content" | "communication",
      isCustom: true
    };
  }).filter(Boolean) as Tool[];

  // Combine predefined and custom tools
  const allTools = [...tools, ...mappedCustomTools]

  const handleFavoriteClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault() // Prevent the Link navigation
    e.stopPropagation() // Prevent event bubbling
    toggleFavorite(href)
    
    // Show feedback toast
    if (favorites.includes(href)) {
      toast.success("Eliminado de favoritos")
    } else {
      toast.success("Agregado a favoritos")
    }
  }

  const filteredTools = allTools.filter(tool => {
    const matchesSearch = 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory
    
    if (showFavorites) {
      return matchesSearch && matchesCategory && favorites.includes(tool.href)
    }
    
    return matchesSearch && matchesCategory
  })

  const handleFeedback = async (feedback: 'positive' | 'negative', immediate: boolean = false) => {
    if (!immediate) {
      // Solo guardar el tipo de feedback si no es un envío inmediato
      setFeedbackSent(true)
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
          descripcionSolicitud: `Feedback de herramientas: ${feedback === 'positive' ? 'Positivo' : 'Negativo'}${feedbackComment ? `\nComentario: ${feedbackComment}` : ''}`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el feedback')
      }

      toast.success("Feedback enviado exitosamente")
      setFeedbackComment("") // Reset comment after successful submission
      setShowFeedbackDialog(false) // Cerrar el diálogo solo después de enviar exitosamente
      
      // Guardar en localStorage que ya se envió el feedback
      const feedbackData = {
        sent: true,
        timestamp: new Date().toISOString(),
        type: feedback,
        comment: feedbackComment
      }
      localStorage.setItem('workshopFeedback', JSON.stringify(feedbackData))
    } catch (error) {
      console.error('Error al enviar feedback:', error)
      toast.error("Error al enviar el feedback")
    }
  }

  // Modificar el useEffect que maneja el diálogo de feedback
  useEffect(() => {
    // Verificar si ya se envió feedback anteriormente
    const savedFeedback = localStorage.getItem('workshopFeedback')
    if (!savedFeedback) {
      // Mostrar el diálogo después de 50 segundos
      const timer = setTimeout(() => {
        setShowFeedbackDialog(true)
      }, 60000)

      // Limpiar el timer si el componente se desmonta
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-white font-montserrat"
        style={{ 
          background: '#ffffff'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-12"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
                              <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="relative"
                >
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 sm:w-16 sm:h-16"
                    style={{ 
                      boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)',
                      border: '2px solid rgba(101, 204, 138, 0.2)'
                    }}
                  />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold"
                    style={{ 
                      background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                      color: 'white'
                    }}
                  >
                    !
                  </motion.div>
                </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center sm:text-left"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-montserrat"
                        style={{ 
                          background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                      Herramientas de Inclusión
                    </h1>
                    <p className="text-gray-600 text-xs sm:text-sm lg:text-base font-montserrat">
                      Descubre herramientas educativas para crear un entorno de aprendizaje inclusivo
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 sm:gap-4"
            >
              <Button
                variant="outline"
                className="flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-montserrat text-xs sm:text-sm lg:text-base w-full sm:w-auto"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                  border: '1px solid rgba(101, 204, 138, 0.3)',
                  color: '#65cc8a'
                }}
                onClick={() => setShowGettingStarted(true)}
              >
                <RiQuestionAnswerFill className="w-3 h-3 sm:w-4 sm:h-4" />
                ¿No sabes por dónde empezar?
              </Button>

              <Link href="/solicitar-herramienta" className="w-full sm:w-auto">
                <Button className="flex items-center gap-2 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-montserrat text-xs sm:text-sm lg:text-base w-full"
                        style={{ 
                          background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                          boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                        }}>
                  <RiAddLine className="w-3 h-3 sm:w-4 sm:h-4" />
                  {t('workshop.suggestNewTool')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Getting Started Modal */}
          {showGettingStarted && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowGettingStarted(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
                style={{ 
                  background: '#ffffff',
                  border: '1px solid rgba(101, 204, 138, 0.2)',
                  boxShadow: '0 20px 40px rgba(101, 204, 138, 0.1)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#65cc8a' }}>¿Qué necesitas hacer?</h2>
                <div className="space-y-4">
                                      <Button
                      className="w-full flex items-center gap-2 justify-start"
                      variant="outline"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                        border: '1px solid rgba(101, 204, 138, 0.3)',
                        color: '#65cc8a'
                      }}
                      onClick={() => {
                        setSelectedCategory("planning")
                        setShowGettingStarted(false)
                      }}
                    >
                      <RiBookReadFill className="w-5 h-5" />
                      Planificar una clase o unidad
                    </Button>
                    <Button
                      className="w-full flex items-center gap-2 justify-start"
                      variant="outline"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                        border: '1px solid rgba(101, 204, 138, 0.3)',
                        color: '#65cc8a'
                      }}
                      onClick={() => {
                        setSelectedCategory("assessment")
                        setShowGettingStarted(false)
                      }}
                    >
                      <RiQuestionAnswerFill className="w-5 h-5" />
                      Crear una evaluación o cuestionario
                    </Button>
                    <Button
                      className="w-full flex items-center gap-2 justify-start"
                      variant="outline"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                        border: '1px solid rgba(101, 204, 138, 0.3)',
                        color: '#65cc8a'
                      }}
                      onClick={() => {
                        setSelectedCategory("content")
                        setShowGettingStarted(false)
                      }}
                    >
                      <RiFileTextFill className="w-5 h-5" />
                      Generar material educativo
                    </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Recommended Tools Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
                style={{ color: '#65cc8a' }}>
              🌱 Herramientas esenciales para inclusión educativa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {tools
                .filter(tool => recommendedTools.includes(tool.id))
                .map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ToolCard
                      tool={tool}
                      onFavoriteClick={handleFavoriteClick}
                      showExample={true}
                      favorites={favorites}
                    />
                  </motion.div>
                ))}
            </div>
          </motion.div>

          {/* Categories with Icons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-wrap gap-2 mb-4 sm:mb-6 lg:mb-8 justify-center sm:justify-start"
          >
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <div className="w-full max-w-md px-4 sm:px-0">
                <SearchBar 
                  onSearch={setSearchQuery}
                  placeholder="Buscar herramientas por nombre o descripción..."
                  className="w-full"
                />
              </div>
              <Button
                variant={showFavorites ? "default" : "outline"}
                className={`shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-montserrat text-xs sm:text-sm lg:text-base w-full sm:w-auto flex items-center gap-2 justify-center`}
                style={showFavorites ? {
                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                  color: 'white',
                  boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                } : {
                  background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                  border: '1px solid rgba(101, 204, 138, 0.3)',
                  color: '#65cc8a'
                }}
                onClick={() => setShowFavorites(!showFavorites)}
              >
                <RiHeartFill className="w-4 h-4" />
                {showFavorites ? "Mostrar todas" : "Mostrar favoritos"}
              </Button>
            </div>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                className="w-full sm:w-auto"
              >
                <Button
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-montserrat text-xs sm:text-sm lg:text-base w-full sm:w-auto flex items-center gap-2 justify-center`}
                  style={selectedCategory === category.id ? {
                    background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                  } : {
                    background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                    border: '1px solid rgba(101, 204, 138, 0.3)',
                    color: '#65cc8a'
                  }}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.id === "planning" && <RiBookReadFill className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {category.id === "assessment" && <RiQuestionAnswerFill className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {category.id === "content" && <RiFileTextFill className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {category.id === "communication" && <RiMailFill className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {category.name}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Tools Grid */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedCategory}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 relative z-0"
            >
              {isLoading ? (
                <div className="col-span-full text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base">Cargando herramientas...</p>
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="col-span-full text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base">No se encontraron herramientas</p>
                </div>
              ) : (
                filteredTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ToolCard
                      tool={tool}
                      onFavoriteClick={handleFavoriteClick}
                      showExample={true}
                      favorites={favorites}
                      onDeactivate={tool.isCustom ? handleDeactivate : undefined}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>

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
                <DialogTitle>¿Cómo fue tu experiencia con las herramientas?</DialogTitle>
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
                    className="text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                      boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                    }}
                    disabled={!feedbackSent} // Deshabilitar el botón hasta que se seleccione un tipo de feedback
                  >
                    Enviar Feedback
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </Layout>
  )
}

