"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Trash2,
  BookOpen,
  FileQuestion,
  Lightbulb,
  Globe,
  Target,
  Mail,
  Calendar,
  Edit,
  Files,
  Users,
  UserCog,
  Award,
  Palette,
  BookMarked,
  PenTool,
  HelpCircle,
  TrendingUp,
  CheckSquare,
  BarChart,
  FileText as FileTextIcon,
  Settings,
  Flag,
  Send,
  ListChecks,
  Scan,
  ClipboardList,
  Globe2,
  PenSquare,
  Youtube,
  Grid,
  Accessibility,
  Heart,
  Shield
} from "lucide-react"
import { useRouter } from "next/navigation"
import { API_ENDPOINTS, getEndpointUrl } from "@/config/api"
import { WorkshopPreview } from "@/components/workshop-preview"
import { RubricPreview } from "@/components/rubric-preview"
import { Toaster, toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { motion } from "framer-motion"
import { useLanguage } from "../contexts/LanguageContext"

interface ToolFolder {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  items: HistoryItem[]
}

interface HistoryItem {
  id: string
  prompt: string
  response: string
  tipoTaller: string
  timestamp: string
  name: string
  email: string
  activate: boolean
}

interface Peticion {
  _id: string
  email: string
  tipo: string
  prompt: string
  response: string
  fecha: string
  activate: boolean
}

interface WorkshopResponse {
  id: string
  email: string
  tipoTaller: string
  prompt: string
  response: string
  timestamp: string
  name: string
  activate: boolean
}

const toolFolders: ToolFolder[] = [
  {
    id: "crear-cuestionario",
    name: "Quiz Creator",
    description: "Create a quiz in minutes with ProfePlanner's help. This tool is excellent for creating formative assessments.",
    icon: <FileQuestion className="w-8 h-8 text-blue-500" />,
    items: []
  },
  {
    id: "rubrica-evaluacion",
    name: "Rubric Generator",
    description: "Create detailed evaluation rubrics for your students' work and projects.",
    icon: <ListChecks className="w-8 h-8 text-purple-500" />,
    items: []
  },
  {
    id: "sopa-de-letras",
    name: "Word Search",
    description: "Create educational word searches to reinforce vocabulary and key concept learning.",
    icon: <Grid className="w-8 h-8 text-purple-500" />,
    items: []
  },
  {
    id: "crear-plan-de-leccion",
    name: "Lesson Planner",
    description: "Save time and energy by creating a detailed lesson plan with ProfePlanner's help.",
    icon: <BookOpen className="w-8 h-8 text-green-500" />,
    items: []
  },
  {
    id: "crear-material-educativo",
    name: "Educational Material",
    description: "Generate customized educational material for your classes.",
    icon: <FileTextIcon className="w-8 h-8 text-purple-500" />,
    items: []
  },
  {
    id: "generar-ideas",
    name: "Idea Generator",
    description: "Generate creative ideas for your educational activities.",
    icon: <Lightbulb className="w-8 h-8 text-yellow-500" />,
    items: []
  },
  {
    id: "ia-libre",
    name: "Free AI",
    description: "Use AI without restrictions for your educational needs.",
    icon: <Lightbulb className="w-8 h-8 text-indigo-500" />,
    items: []
  },
  {
    id: "beneficios-del-mundo-real",
    name: "Real World Benefits",
    description: "Explore the benefits and practical applications of educational topics.",
    icon: <Globe className="w-8 h-8 text-cyan-500" />,
    items: []
  },
  {
    id: "generar-proyecto",
    name: "Project Generator",
    description: "Create complete and engaging educational projects.",
    icon: <Target className="w-8 h-8 text-pink-500" />,
    items: []
  },
  {
    id: "generar-informe-estudiantil",
    name: "Student Reports",
    description: "Create detailed reports on student progress.",
    icon: <BarChart className="w-8 h-8 text-orange-500" />,
    items: []
  },
  {
    id: "generar-correo-para-padres",
    name: "Parent Communications",
    description: "Generate effective communications for parents.",
    icon: <Mail className="w-8 h-8 text-blue-500" />,
    items: []
  },
  {
    id: "ideas-fechas-conmemorativas",
    name: "Commemorative Dates",
    description: "Find ideas to celebrate important dates.",
    icon: <Calendar className="w-8 h-8 text-red-500" />,
    items: []
  },
  {
    id: "corrector-gramatical",
    name: "Grammar Checker",
    description: "Correct and improve educational texts.",
    icon: <Edit className="w-8 h-8 text-teal-500" />,
    items: []
  },
  {
    id: "resumen-tema",
    name: "Topic Summary",
    description: "Generate concise summaries of educational topics.",
    icon: <Files className="w-8 h-8 text-blue-400" />,
    items: []
  },
  {
    id: "talleres-de-padres",
    name: "Parent Workshops",
    description: "Create educational workshops for parents.",
    icon: <Users className="w-8 h-8 text-blue-500" />,
    items: []
  },
  {
    id: "capacitacion-docentes",
    name: "Teacher Training",
    description: "Generate training plans for teachers.",
    icon: <UserCog className="w-8 h-8 text-green-500" />,
    items: []
  },
  {
    id: "estandares-calidad-educacion",
    name: "Education Quality Standards",
    description: "Define educational quality standards.",
    icon: <Award className="w-8 h-8 text-purple-500" />,
    items: []
  },
  {
    id: "generar-ideas-actividades",
    name: "Activity Ideas",
    description: "Generate ideas for educational activities.",
    icon: <Palette className="w-8 h-8 text-blue-500" />,
    items: []
  },
  {
    id: "generar-secuencia-didactica",
    name: "Didactic Sequence",
    description: "Create complete didactic sequences.",
    icon: <BookMarked className="w-8 h-8 text-purple-500" />,
    items: []
  },
  {
    id: "generar-redaccion",
    name: "Writing",
    description: "Generate writing exercises.",
    icon: <PenTool className="w-8 h-8 text-green-500" />,
    items: []
  },
  {
    id: "generar-preguntas-texto",
    name: "Text Questions",
    description: "Generate reading comprehension questions.",
    icon: <HelpCircle className="w-8 h-8 text-yellow-500" />,
    items: []
  },
  {
    id: "generar-plan-recuperacion",
    name: "Recovery Plan",
    description: "Create academic recovery plans.",
    icon: <TrendingUp className="w-8 h-8 text-red-500" />,
    items: []
  },
  {
    id: "correccion-preguntas",
    name: "Question Correction",
    description: "Correct and improve assessment questions.",
    icon: <CheckSquare className="w-8 h-8 text-indigo-500" />,
    items: []
  },
  {
    id: "calificador-ensayos",
    name: "Essay Grader",
    description: "Evaluate and grade student essays.",
    icon: <BarChart className="w-8 h-8 text-cyan-500" />,
    items: []
  },
  {
    id: "nivelacion-textos",
    name: "Text Leveling",
    description: "Adapt texts to different educational levels.",
    icon: <FileTextIcon className="w-8 h-8 text-pink-500" />,
    items: []
  },
  {
    id: "accesibilidad-textos",
    name: "Text Accessibility",
    description: "Make texts more accessible for everyone.",
    icon: <Settings className="w-8 h-8 text-orange-500" />,
    items: []
  },
  {
    id: "generar-objetivos-aprendizaje",
    name: "Learning Objectives",
    description: "Define clear learning objectives.",
    icon: <Flag className="w-8 h-8 text-teal-500" />,
    items: []
  },
  {
    id: "generar-correo-escolar",
    name: "School Communications",
    description: "Generate effective school communications.",
    icon: <Send className="w-8 h-8 text-blue-400" />,
    items: []
  },
  {
    id: "generar-instrucciones-claras",
    name: "Clear Instructions",
    description: "Create clear instructions for activities.",
    icon: <ListChecks className="w-8 h-8 text-green-400" />,
    items: []
  },
  {
    id: "crear-cuestionario-video-youtube",
    name: "YouTube Video Questions",
    description: "Generate comprehension and analysis questions from YouTube videos to assess your students' learning.",
    icon: <Youtube className="w-8 h-8 text-red-500" />,
    items: []
  }
]

export default function HistoryPage() {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [folders, setFolders] = useState<ToolFolder[]>(toolFolders)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkshop, setSelectedWorkshop] = useState<HistoryItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<ToolFolder | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRubric, setSelectedRubric] = useState<HistoryItem | null>(null)
  const [isRubricPreviewOpen, setIsRubricPreviewOpen] = useState(false)

  const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  )

  const fetchWorkshops = async () => {
    try {
      const userEmail = localStorage.getItem('email')
      if (!userEmail) {
        throw new Error('No se encontró el email del usuario')
      }

      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/consultar-peticiones-email?email=${encodeURIComponent(userEmail)}`)
      
      if (!response.ok) {
        throw new Error(`Error al obtener las peticiones: ${response.status}`)
      }

      const data: WorkshopResponse[] = await response.json()

      // Filtrar solo los elementos activos
      const dataActiva = data.filter(item => item.activate)

      // Agrupar las peticiones por tipo de taller
      const peticionesPorTipo = dataActiva.reduce((acc: { [key: string]: WorkshopResponse[] }, item) => {
        // Asegurarnos de que el tipoTaller no sea null
        const tipoTaller = item.tipoTaller || 'crear-cuestionario'
        if (!acc[tipoTaller]) {
          acc[tipoTaller] = []
        }
        acc[tipoTaller].push({
          ...item,
          tipoTaller // Asegurarnos de que el tipoTaller esté definido
        })
        return acc
      }, {})

      // Actualizar los folders con las peticiones correspondientes
      const updatedFolders = folders.map(folder => {
        const folderItems = (peticionesPorTipo[folder.id] || []).map(item => ({
          id: item.id,
          prompt: item.prompt,
          response: item.response,
          tipoTaller: item.tipoTaller, // Ya no necesitamos el fallback aquí
          timestamp: item.timestamp,
          name: item.name || 'Taller sin nombre',
          email: item.email,
          activate: item.activate
        }))

        return {
          ...folder,
          items: folderItems
        }
      })

      setFolders(updatedFolders)
    } catch (err) {
      console.error('Error fetching workshops:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar los talleres')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const toggleFolder = (folderId: string) => {
    setSearchQuery("")
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? []
        : [folderId]
    )
  }

  const handleViewWorkshop = (item: HistoryItem | { tipoTaller: string }) => {
    if ('id' in item) {
      if (item.tipoTaller === 'rubrica-evaluacion') {
        setSelectedRubric(item)
        setIsRubricPreviewOpen(true)
        return
      }
      const workshopWithType = {
        ...item,
        tipoTaller: item.tipoTaller || 'crear-cuestionario'
      }
      setSelectedWorkshop(workshopWithType)
      setIsPreviewOpen(true)
      return
    }

    // Limpia datos anteriores
    localStorage.removeItem('historyData')
    
    // Si es un nuevo taller, no necesitamos guardar datos previos
    if ('tipoTaller' in item && !('id' in item)) {
      let route = ''
      switch (item.tipoTaller) {
        case 'crear-cuestionario':
          route = '/workshop/creador-cuestionarios'
          break
        case 'rubrica-evaluacion':
          route = '/workshop/rubrica'
          break
        case 'crear-cuestionario-video-youtube':
          route = '/workshop/preguntas-video'
          break
        case 'crear-plan-de-leccion':
          route = '/workshop/planificador-lecciones'
          break
        case 'crear-plan-de-unidades':
          route = '/workshop/planificador-unidades'
          break
        case 'crear-material-educativo':
          route = '/workshop/material-educativo'
          break
        case 'crear-contexto':
          route = '/workshop/constructor-contexto'
          break
        case 'generar-ideas':
          route = '/workshop/generador-ideas'
          break
        case 'ia-libre':
          route = '/workshop/ia-libre'
          break
        case 'beneficios-del-mundo-real':
          route = '/workshop/beneficios-mundo-real'
          break
        case 'generar-proyecto':
          route = '/workshop/generador-proyectos'
          break
        case 'generar-consigna-de-escritura':
          route = '/workshop/consignas-escritura'
          break
        case 'generar-informe-estudiantil':
          route = '/workshop/informes-estudiantes'
          break
        case 'generar-correo-para-padres':
          route = '/workshop/correos-padres'
          break
        case 'generar-correo-escolar':
          route = '/workshop/correos-escolares'
          break  
        case 'talleres-de-padres':
          route = '/workshop/talleres-padres'
          break  
        default:
          console.error('Tipo de taller no reconocido:', item.tipoTaller)
          return
      }
      router.push(route)
      return
    }
  }

  const getWorkshopTitle = (workshop: any) => {
    if (workshop.name) return workshop.name
    
    if (!workshop.prompt) return "Sin título"
    console.log(workshop.prompt)
    // Extraer el tema del prompt
    const match = workshop.prompt.match(/sobre (.+?) con/)
    return match ? match[1] : "Sin título"
  }

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "Fecha no disponible"
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error al formatear fecha:', error)
      return "Fecha no disponible"
    }
  }

  const handleDeactivateWorkshop = async (item: HistoryItem) => {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/desactivar-Herramienta/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el taller')
      }

      // Actualizar la lista de talleres
      fetchWorkshops()
      
      // Mostrar notificación de éxito
      toast.success('Taller eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar el taller:', error)
      toast.error('Error al eliminar el taller')
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return

    setIsDeleting(true)
    try {
      const deletePromises = selectedItems.map(itemId => 
        fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/desactivar-Herramienta/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      await Promise.all(deletePromises)
      setSelectedItems([])
      fetchWorkshops()
      toast.success('Recursos eliminados correctamente')
    } catch (error) {
      console.error('Error al eliminar los recursos:', error)
      toast.error('Error al eliminar los recursos')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredItems = (items: HistoryItem[]) => {
    if (!searchQuery) return items
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
  return (
    <Layout>
      <div className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen font-montserrat"
        style={{ 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
               style={{ 
                 background: 'radial-gradient(circle, #65cc8a, transparent)',
                 animation: 'float 6s ease-in-out infinite'
               }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-15"
               style={{ 
                 background: 'radial-gradient(circle, #4ade80, transparent)',
                 animation: 'float 8s ease-in-out infinite reverse'
               }}></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full opacity-10"
               style={{ 
                 background: 'radial-gradient(circle, #65cc8a, transparent)',
                 animation: 'float 7s ease-in-out infinite'
               }}></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={56}
                  height={56}
                  className="rounded-xl shadow-lg"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-yellow-400 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold"
                >
                  !
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 font-montserrat"
                    style={{ color: '#000000' }}>{t('history.title')}</h1>
                <p className="text-sm sm:text-base lg:text-lg font-montserrat"
                   style={{ color: '#000000' }}>{t('history.subtitle')}</p>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto"
            >
              {selectedItems.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      className="flex items-center gap-2 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-montserrat text-sm sm:text-base w-full sm:w-auto"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)'
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('history.deleteResources')} ({selectedItems.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('history.deleteConfirmation')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('history.deleteConfirmationDescription', { count: selectedItems.length.toString(), resource: selectedItems.length === 1 ? t('history.resource') : t('history.resources') })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBatchDelete}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                      >
                        {t('history.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button 
                className="flex items-center gap-2 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-montserrat text-sm sm:text-base w-full sm:w-auto"
                style={{
                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                  boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                }}
                onClick={() => router.push('/workshop')}
              >
                <Plus className="w-4 h-4" />
                {t('history.createResource')}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8"
          >
            {/* Panel lateral con carpetas */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full lg:w-96 flex-shrink-0 rounded-xl p-4 sm:p-6 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(101, 204, 138, 0.2)',
                boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
              }}
            >
                              <h2 className="text-lg sm:text-xl font-semibold mb-4 font-montserrat"
                    style={{ color: '#000000' }}>{t('history.educationalResources')}</h2>
              <div className="space-y-2 max-h-[300px] sm:max-h-[400px] lg:max-h-[calc(100vh-250px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 hover:scrollbar-thumb-blue-300">
                {folders.map((folder, index) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer transition-all duration-300 rounded-xl`}
                    style={expandedFolders.includes(folder.id) ? {
                      background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                      border: '1px solid rgba(101, 204, 138, 0.3)'
                    } : {
                      background: 'transparent',
                      border: '1px solid transparent'
                    }}
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <motion.div 
                      animate={{ rotate: expandedFolders.includes(folder.id) ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="transition-transform duration-300"
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: '#65cc8a' }} />
                    </motion.div>
                    <div className="flex-shrink-0">
                      {folder.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm sm:text-base" style={{ color: '#000000' }}>{t(`history.tools.${folder.id}.title`)}</div>
                      <div className="text-xs sm:text-sm" style={{ color: '#000000' }}>
                        {folder.items.length} {folder.items.length === 1 ? t('history.resource') : t('history.resources')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Panel principal con contenido */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex-1 rounded-xl p-4 sm:p-6 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(101, 204, 138, 0.2)',
                boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
              }}
            >
              {expandedFolders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                        boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                      }}
                    >
                      <Folder className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#65cc8a' }} />
                    </motion.div>
                    <h3 className="text-lg sm:text-xl font-medium mb-2 font-montserrat" style={{ color: '#000000' }}>{t('history.selectCategory')}</h3>
                    <p className="text-sm sm:text-base font-montserrat" style={{ color: '#000000' }}>{t('history.organizeMaterial')}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="space-y-4 sm:space-y-6"
                >
                  {expandedFolders.map(folderId => {
                    const folder = folders.find(f => f.id === folderId)
                    if (!folder) return null

                    return (
                      <motion.div 
                        key={folderId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-md"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                                   boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                                 }}>
                              {folder.icon}
                            </div>
                            <div>
                              <h2 className="text-lg sm:text-xl font-semibold font-montserrat" style={{ color: '#000000' }}>{t(`history.tools.${folder.id}.title`)}</h2>
                              <p className="text-xs sm:text-sm" style={{ color: '#000000' }}>{t(`history.tools.${folder.id}.description`)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                              <input
                                type="text"
                                placeholder={t('history.searchResources')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 w-full"
                              />
                              <div className="absolute left-3 top-2.5">
                                <SearchIcon />
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              className="flex items-center gap-2 font-montserrat text-sm sm:text-base"
                              style={{
                                background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                                border: '1px solid rgba(101, 204, 138, 0.3)',
                                color: '#65cc8a'
                              }}
                              onClick={() => handleViewWorkshop({ tipoTaller: folder.id })}
                            >
                              <Plus className="w-4 h-4" />
                              {t('history.newResource')}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {filteredItems(folder.items).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                                                              className={`group rounded-xl p-4 sm:p-6 
                                shadow-lg hover:shadow-xl
                                hover:-translate-y-2 
                                transition-all duration-300 ease-out
                                flex flex-col
                                relative
                                h-full
                                ${selectedItems.includes(item.id) ? 'ring-2' : ''}`}
                                style={{
                                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                                  backdropFilter: 'blur(20px)',
                                  border: '1px solid rgba(101, 204, 138, 0.2)',
                                  boxShadow: '0 8px 32px rgba(101, 204, 138, 0.1)',
                                  borderTop: selectedItems.includes(item.id) ? '4px solid #65cc8a' : '4px solid rgba(101, 204, 138, 0.3)'
                                }}
                              onClick={() => toggleItemSelection(item.id)}
                            >
                              {/* Efecto de brillo suave */}
                              <motion.div 
                                className="absolute inset-0 overflow-hidden rounded-xl"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                              >
                                {/* Efecto de brillo deslizante */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                  initial={{ x: "-100%" }}
                                  whileHover={{ 
                                    x: "100%",
                                    transition: { 
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: "linear"
                                    }
                                  }}
                                />

                                {/* Efecto de resplandor suave */}
                                <motion.div
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-blue-400/10"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.1, 0.3]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />

                                {/* Efecto de borde brillante */}
                                <motion.div
                                  className="absolute inset-0 rounded-xl border-2 border-transparent"
                                  whileHover={{
                                    borderColor: "rgba(59, 130, 246, 0.2)",
                                    transition: { duration: 0.3 }
                                  }}
                                />

                                {/* Efecto de sombra dinámica */}
                                <motion.div
                                  className="absolute inset-0 rounded-xl"
                                  whileHover={{
                                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.1)",
                                    transition: { duration: 0.3 }
                                  }}
                                />
                              </motion.div>

                              <div className="relative z-10">
                                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                  <motion.div 
                                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-md"
                                    style={{
                                      background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                                      boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                                    }}
                                    whileHover={{ 
                                      scale: 1.05,
                                      rotate: 5,
                                      transition: { duration: 0.3 }
                                    }}
                                  >
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#65cc8a' }} />
                                  </motion.div>
                                  <div>
                                    <motion.h3 
                                      className="text-base sm:text-lg font-semibold font-montserrat"
                                      style={{ color: '#000000' }}
                                      whileHover={{ 
                                        x: 5,
                                        transition: { duration: 0.3 }
                                      }}
                                    >
                                      {getWorkshopTitle(item)}
                                    </motion.h3>
                                    <p className="text-xs sm:text-sm" style={{ color: '#000000' }}>{formatDate(item.timestamp)}</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <motion.div
                                    whileHover={{ 
                                      scale: 1.05,
                                      transition: { duration: 0.3 }
                                    }}
                                  >
                                    <Button
                                      variant="ghost"
                                      className="font-montserrat text-sm sm:text-base"
                                      style={{
                                        color: '#65cc8a',
                                        background: 'transparent'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleViewWorkshop(item)
                                      }}
                                    >
                                      Ver Recurso
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ 
                                      scale: 1.1,
                                      transition: { duration: 0.3 }
                                    }}
                                  >
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                                                            <Button
                                      variant="ghost"
                                      className="font-montserrat"
                                      style={{
                                        color: '#ef4444',
                                        background: 'transparent'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{t('history.deleteConfirmation')}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {t('history.deleteConfirmationDescription', { count: "1", resource: t('history.resource') })}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeactivateWorkshop(item)}
                                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                                          >
                                            {t('history.delete')}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {filteredItems(folder.items).length === 0 && (
                            <div className="col-span-full text-center py-8 sm:py-12">
                              <div className="rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-lg"
                                   style={{
                                     background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                                     boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                                   }}>
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#65cc8a' }} />
                              </div>
                              <h3 className="text-lg sm:text-xl font-medium mb-2 font-montserrat" style={{ color: '#000000' }}>
                                {searchQuery ? t('history.noResourcesFound') : t('history.noResourcesInCategory')}
                              </h3>
                              {!searchQuery && (
                                <Button
                                  variant="outline"
                                  className="font-montserrat text-sm sm:text-base"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                                    border: '1px solid rgba(101, 204, 138, 0.3)',
                                    color: '#65cc8a'
                                  }}
                                  onClick={() => handleViewWorkshop({ tipoTaller: folder.id })}
                                >
                                  {t('history.createNewResource')}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      <Toaster />

      {selectedWorkshop && (
        <WorkshopPreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setSelectedWorkshop(null)
          }}
          workshop={selectedWorkshop}
          onUpdate={fetchWorkshops}
        />
      )}

      {selectedRubric && (
        <RubricPreview
          isOpen={isRubricPreviewOpen}
          onClose={() => {
            setIsRubricPreviewOpen(false)
            setSelectedRubric(null)
          }}
          rubric={selectedRubric}
          onUpdate={fetchWorkshops}
        />
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </Layout>
  )
}

