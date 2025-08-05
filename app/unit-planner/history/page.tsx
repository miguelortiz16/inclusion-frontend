"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Eye, Trash2, AlertTriangle, Search, GraduationCap, BookOpen, LightbulbIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WorkshopPreview } from "@/components/workshop-preview"
import { useTranslations } from "@/utils/useTranslations"

interface Leccion {
  dia: number
  fecha: string | null
  titulo: string
  inicio: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
  }
  desarrollo: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
  }
  cierre: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
  }
}

interface Unidad {
  _id: string
  nombreUnidad: string
  asignatura: string
  detallesUnidad: string
  estandaresObjetivos: string
  numeroLecciones: number
  nivelEducativo: string | null
  email: string
  lecciones: Leccion[]
  activo: boolean
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message }: ConfirmationDialogProps) {
  if (!isOpen) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg"
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center mb-4"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4"
          >
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 mb-6"
        >
          {message}
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-3"
        >
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm"
          >
            Eliminar
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default function UnitPlannerHistory() {
  const router = useRouter()
  const t = useTranslations()
  const [units, setUnits] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [questionType, setQuestionType] = useState<string>("opcion_multiple")
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5)
  const [difficultyLevel, setDifficultyLevel] = useState<string>("media")

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const userEmail = localStorage.getItem('email')
        if (!userEmail) {
          setError('No se encontró el email del usuario. Por favor, inicie sesión nuevamente.')
          setLoading(false)
          return
        }

        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/units/active?email=${userEmail}`)
        if (!response.ok) {
          throw new Error(`Error al cargar las clases: ${response.status}`)
        }

        const data = await response.json()
        setUnits(data)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchUnits()
  }, [])

  const filteredUnits = units.filter(unit => {
    const searchLower = searchQuery.toLowerCase()
    const nombreUnidad = unit.nombreUnidad?.toLowerCase() || ""
    const detallesUnidad = unit.detallesUnidad?.toLowerCase() || ""
    
    // Apply search filter
    const matchesSearch = nombreUnidad.includes(searchLower) || detallesUnidad.includes(searchLower)
    
    // Apply grade filter
    const matchesGrade = selectedGrade === "all" || unit.nivelEducativo === selectedGrade
    
    // Apply subject filter
    const matchesSubject = selectedSubject === "all" || unit.asignatura.toLowerCase() === selectedSubject.toLowerCase()
    
    return matchesSearch && matchesGrade && matchesSubject
  })

  const handleDeactivateUnit = async (unitId: string) => {
    if (!unitId) {
      toast.error("Error: ID de unidad no válido")
      return
    }
    setUnitToDelete(unitId)
    setShowConfirmation(true)
  }

  const handleConfirmDelete = async () => {
    if (!unitToDelete) return

    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/deactivate-unit/${unitToDelete}`, {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error(`Error al desactivar la unidad: ${response.status}`)
      }

      // Actualizar el estado local eliminando la unidad desactivada
      setUnits(prevUnits => prevUnits.filter(unit => unit._id !== unitToDelete))
      toast.success("Unidad desactivada exitosamente")
    } catch (err) {
      console.error('Error:', err)
      toast.error("Error al desactivar la unidad")
    } finally {
      setShowConfirmation(false)
      setUnitToDelete(null)
    }
  }

  const handleViewUnit = (unit: Unidad) => {
    // Guardar los datos de la unidad en localStorage
    localStorage.setItem('unitPlannerData', JSON.stringify(unit))
    // Navegar a la página de vista
    router.push('/unit-planner/view')
  }

  const handleUnitSelection = (unitId: string) => {
    setSelectedUnits(prev => {
      if (prev.includes(unitId)) {
        return prev.filter(id => id !== unitId)
      } else {
        return [...prev, unitId]
      }
    })
  }

  const generateSaberProQuestions = async () => {
    try {
      setIsGeneratingQuestions(true)
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para generar las preguntas")
        return
      }

      const selectedUnitsData = units.filter(unit => selectedUnits.includes(unit._id))
      if (selectedUnitsData.length === 0) {
        toast.error("Por favor, selecciona al menos una clase")
        return
      }

      // Crear un objeto workshop con la información de todas las unidades seleccionadas
      const topic = selectedUnitsData.map(unit => 
        `genera un cuestionario para evaluar los temas que sea muy parecido a saber pro "${unit.nombreUnidad}" con las siguientes especificaciones:unidad:${unit.nombreUnidad}|asignatura:${unit.asignatura}|detalles:${unit.detallesUnidad}|objetivos:${unit.estandaresObjetivos}|tipo:${questionType}|cantidad:${numberOfQuestions}|dificultad:${difficultyLevel}`
      ).join('||')

      const workshop = {
        id: `saber-pro-${Date.now()}`,
        tipoTaller: 'saber-pro',
        prompt: topic,
        response: '',
        timestamp: new Date().toISOString(),
        name: `Preguntas ${questionType} - ${selectedUnitsData.map(u => u.nombreUnidad).join(', ')}`,
        email: email,
        activate: true,
        topic: topic,
        grade: selectedUnitsData[0].nivelEducativo,
        subject: selectedUnitsData[0].asignatura,
        theme: selectedUnitsData.map(u => u.nombreUnidad).join(', '),
        isPublic: false
      }

      // Send request to backend
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-cuestionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workshop)
      })

      if (!response.ok) {
        throw new Error('Error al generar las preguntas')
      }

      const responseText = await response.text()
      workshop.response = responseText

      // Open the workshop preview with the questions
      setSelectedWorkshop(workshop)
      setIsPreviewOpen(true)
      setShowQuestionsDialog(false)
      setSelectedUnits([])
      toast.success("Preguntas generadas exitosamente")
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las preguntas")
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const handleSelectAllVisible = () => {
    const visibleUnitIds = filteredUnits.map(unit => unit._id)
    if (selectedUnits.length === visibleUnitIds.length) {
      // Si ya están todas seleccionadas, deseleccionar todas
      setSelectedUnits([])
    } else {
      // Si no están todas seleccionadas, seleccionar todas
      setSelectedUnits(visibleUnitIds)
    }
  }

  if (loading) {
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 flex items-center justify-center min-h-[400px]"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"
            />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600"
            >
              {t('common.loading')}
            </motion.p>
          </motion.div>
        </motion.div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center text-red-600"
          >
            <p>{error}</p>
          </motion.div>
        </motion.div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <Link href="/unit-planner" className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('unitPlanner.history.backToPlanner')}
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2">
            {selectedUnits.length > 0 && (
              <Button
                onClick={() => setShowQuestionsDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {t('unitPlanner.history.generateQuestions')} ({selectedUnits.length})
              </Button>
            )}
            <p className="text-sm text-gray-500 text-right">
              {t('unitPlanner.history.generateQuestionsSubtitle')}
            </p>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-display font-bold mb-4"
        >
          {t('unitPlanner.history.title')}
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LightbulbIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">{t('unitPlanner.history.generateCombinedQuestions')}</h3>
              <p className="text-sm text-blue-700">
                {t('unitPlanner.history.generateCombinedQuestionsDescription')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters and Select All */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="grade">{t('unitPlanner.history.educationalLevel')}</Label>
            <Select
              value={selectedGrade}
              onValueChange={setSelectedGrade}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nivel Educativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('unitPlanner.history.allLevels')}</SelectItem>
                <SelectItem value="infantil">Educación Infantil</SelectItem>
                <SelectItem value="Pre-escolar">Pre-escolar</SelectItem>
                <SelectItem value="Grado-1">Grado 1</SelectItem>
                <SelectItem value="Grado-2">Grado 2</SelectItem>
                <SelectItem value="Grado-3">Grado 3</SelectItem>
                <SelectItem value="Grado-4">Grado 4</SelectItem>
                <SelectItem value="Grado-5">Grado 5</SelectItem>
                <SelectItem value="Grado-6">Grado 6</SelectItem>
                <SelectItem value="Grado-7">Grado 7</SelectItem>
                <SelectItem value="Grado-8">Grado 8</SelectItem>
                <SelectItem value="Grado-9">Grado 9</SelectItem>
                <SelectItem value="Grado-10">Grado 10</SelectItem>
                <SelectItem value="Grado-11">Grado 11</SelectItem>
                <SelectItem value="universidad">Universidad</SelectItem>
                <SelectItem value="Grado-Bachelor">Grado de Licenciatura</SelectItem>
<SelectItem value="Grado-Master">Maestría</SelectItem>
<SelectItem value="Grado-PhD">Doctorado</SelectItem>
<SelectItem value="Grado-Diploma">Diplomado</SelectItem>
<SelectItem value="Grado-Especializacion">Especialización</SelectItem>

              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">{t('unitPlanner.history.subject')}</Label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('unitPlanner.history.subject')} />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="Otro">Otro</SelectItem>
                <SelectItem value="all">{t('unitPlanner.history.allSubjects')}</SelectItem>
                <SelectItem value="Biología">Biología</SelectItem>
                <SelectItem value="Ciencias Naturales">Ciencias Naturales</SelectItem>
                <SelectItem value="ciencias-sociales">Ciencias Sociales</SelectItem>
                <SelectItem value="Ciencias Sociales">Economía</SelectItem>
                <SelectItem value="Educación Artística y Cultural">Educación Artística y Cultural</SelectItem>
                <SelectItem value="Educación Física, Recreación y Deportes">Educación Física, Recreación y Deportes</SelectItem>
                <SelectItem value="Física">Física</SelectItem>
                <SelectItem value="Geografía">Geografía</SelectItem>
                <SelectItem value="Historia">Historia</SelectItem>
                <SelectItem value="Inglés">Inglés</SelectItem>
                <SelectItem value="musica">Musica</SelectItem>
                <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                <SelectItem value="Química">Química</SelectItem>
                <SelectItem value="Lengua">Lengua</SelectItem>
                <SelectItem value="espanol">Español</SelectItem>
                <SelectItem value="musica">Musica</SelectItem>
                <SelectItem value="Literatura">Literatura</SelectItem>
             
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Search and Select All */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-2xl">
              <div className="relative bg-white rounded-lg border-2 border-blue-100 shadow-sm hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center p-2">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 flex items-center justify-center text-blue-500">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('unitPlanner.history.searchPlaceholder')}
                      className="w-full p-2 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
                    />
                  </div>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pr-4 flex items-center"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                          {filteredUnits.length} {filteredUnits.length === 1 ? 'result' : 'results'}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={handleSelectAllVisible}
              variant="outline"
              className="whitespace-nowrap"
            >
              {selectedUnits.length === filteredUnits.length ? t('unitPlanner.history.deselectAll') : t('unitPlanner.history.selectAll')}
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 flex items-center justify-center min-h-[400px]"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"
              />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600"
              >
                {t('common.loading')}
              </motion.p>
            </motion.div>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-center text-red-600"
            >
              <p>{error}</p>
            </motion.div>
          </motion.div>
        ) : filteredUnits.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center text-gray-600 py-8"
          >
            <p>{searchQuery ? t('unitPlanner.history.noResults') : t('unitPlanner.history.noActiveClasses')}</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredUnits.map((unit, index) => (
              <motion.div
                key={unit._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                className={`border rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group ${
                  selectedUnits.includes(unit._id) ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="p-5">
                  <div className="absolute top-2 right-2 z-10">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit._id)}
                        onChange={() => handleUnitSelection(unit._id)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        title={t('unitPlanner.history.selectMultipleUnits')}
                      />
                      {selectedUnits.includes(unit._id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          {selectedUnits.indexOf(unit._id) + 1}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-3 mb-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{unit.asignatura}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {unit.nivelEducativo === "infantil" ? t('unitPlanner.history.earlyChildhoodEducation') : 
                           unit.nivelEducativo === "universidad" ? t('unitPlanner.history.university') : 
                           unit.nivelEducativo?.replace("Grado-", t('unitPlanner.history.grade') + " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {unit.numeroLecciones} {unit.numeroLecciones === 1 ? t('unitPlanner.history.lesson') : t('unitPlanner.history.lessons')}
                      </span>
                    </div>
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2"
                  >
                    {unit.nombreUnidad}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 text-sm mb-4 line-clamp-2"
                  >
                    {unit.detallesUnidad}
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-between items-center pt-4 border-t border-gray-100"
                  >
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm group-hover:shadow-md transition-all"
                      onClick={() => handleViewUnit(unit)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t('unitPlanner.history.viewDetails')}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => handleDeactivateUnit(unit._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationDialog
            isOpen={showConfirmation}
            onClose={() => {
              setShowConfirmation(false)
              setUnitToDelete(null)
            }}
            onConfirm={handleConfirmDelete}
            title={t('unitPlanner.history.deleteConfirmation')}
            message={t('unitPlanner.history.deleteConfirmationDescription')}
          />
        )}
      </AnimatePresence>

      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('unitPlanner.history.generateQuestionsDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('unitPlanner.history.generateQuestionsDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-700 mb-2">{t('unitPlanner.history.generateQuestionsDialog.selectedUnits')}</h4>
              <ul className="space-y-2">
                {units
                  .filter(unit => selectedUnits.includes(unit._id))
                  .map(unit => (
                    <li key={unit._id} className="text-sm text-purple-600">
                      {unit.nombreUnidad} - {unit.asignatura}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="questionType" className="text-base font-medium">{t('unitPlanner.history.generateQuestionsDialog.questionType')}</Label>
                <Select
                  value={questionType}
                  onValueChange={setQuestionType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('unitPlanner.history.generateQuestionsDialog.questionTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opcion_multiple">{t('unitPlanner.history.questionTypes.multipleChoice')}</SelectItem>
                    <SelectItem value="completar_espacios_en_blanco">{t('unitPlanner.history.questionTypes.fillInTheBlank')}</SelectItem>
                    <SelectItem value="verdadero_falso">{t('unitPlanner.history.questionTypes.trueFalse')}</SelectItem>
                    <SelectItem value="respuesta_escrita">{t('unitPlanner.history.questionTypes.writtenResponse')}</SelectItem>
                    <SelectItem value="opcion_multiple_y_completar_espacios_en_blanco">{t('unitPlanner.history.questionTypes.multipleChoiceAndFillInTheBlank')}</SelectItem>
                    <SelectItem value="opcion_multiple_y_verdadero_falso">{t('unitPlanner.history.questionTypes.multipleChoiceAndTrueFalse')}</SelectItem>
                    <SelectItem value="opcion_multiple_y_respuesta_escrita">{t('unitPlanner.history.questionTypes.multipleChoiceAndWrittenResponse')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfQuestions" className="text-base font-medium">{t('unitPlanner.history.generateQuestionsDialog.numberOfQuestions')}</Label>
                <Select
                  value={numberOfQuestions.toString()}
                  onValueChange={(value) => setNumberOfQuestions(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('unitPlanner.history.generateQuestionsDialog.numberOfQuestionsPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 {t('unitPlanner.history.questionTypes.multipleChoice')}</SelectItem>
                    <SelectItem value="10">10 {t('unitPlanner.history.questionTypes.multipleChoice')}</SelectItem>
                    <SelectItem value="15">15 {t('unitPlanner.history.questionTypes.multipleChoice')}</SelectItem>
                    <SelectItem value="20">20 {t('unitPlanner.history.questionTypes.multipleChoice')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficultyLevel" className="text-base font-medium">{t('unitPlanner.history.generateQuestionsDialog.difficultyLevel')}</Label>
                <Select
                  value={difficultyLevel}
                  onValueChange={setDifficultyLevel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('unitPlanner.history.generateQuestionsDialog.difficultyLevelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">{t('unitPlanner.history.difficultyLevels.low')}</SelectItem>
                    <SelectItem value="media">{t('unitPlanner.history.difficultyLevels.medium')}</SelectItem>
                    <SelectItem value="alta">{t('unitPlanner.history.difficultyLevels.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowQuestionsDialog(false)}
              className="w-full sm:w-auto"
            >
              {t('unitPlanner.history.cancel')}
            </Button>
            <Button 
              onClick={generateSaberProQuestions} 
              disabled={isGeneratingQuestions}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              {isGeneratingQuestions ? t('unitPlanner.history.generateQuestionsDialog.generating') : t('unitPlanner.history.generateQuestionsDialog.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPreviewOpen && selectedWorkshop && (
        <WorkshopPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          workshop={selectedWorkshop}
        />
      )}
    </Layout>
  )
}

