"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowRight, Clock, Sparkles, AlertCircle, Loader2, BookOpen, BrainCircuit, Target, Calendar, Lightbulb } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Niconne } from "next/font/google"
import { useLanguage } from "../contexts/LanguageContext"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { StandardsDialog } from "./components/standards-dialog"
import GradeEquivalenceModal from "./components/GradeEquivalenceModal"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { PricingModal } from "@/components/pricing-modal"
import { toast } from "react-hot-toast"

interface FormData {
  nombreUnidad: string
  asignatura: string
  detallesUnidad: string
  estandaresObjetivos: string
  numeroLecciones: number
  email: string
  methodology: string[]
  nivelEducativo: string[]
  otraAsignatura?: string
  generateInEnglish?: boolean
  otroNivelEducativo?: string
  otraMetodologia?: string
}

const grades = [
  { value: "infantil", label: "Educación Infantil" },
  { value: "pre-escolar", label: "Pre-escolar" },
  { value: "Grado-1", label: "Grado 1" },
  { value: "Grado-2", label: "Grado 2" },
  { value: "Grado-3", label: "Grado 3" },
  { value: "Grado-4", label: "Grado 4" },
  { value: "Grado-5", label: "Grado 5" },
  { value: "Grado-6", label: "Grado 6" },
  { value: "Grado-7", label: "Grado 7" },
  { value: "Grado-8", label: "Grado 8" },
  { value: "Grado-9", label: "Grado 9" },
  { value: "Grado-10", label: "Grado 10" },
  { value: "Grado-11", label: "Grado 11" },
  { value: "universidad", label: "Universidad" },
  { value: "Grado-Bachelor", label: "Grado de Licenciatura" },
  { value: "Grado-Master", label: "Maestría" },
  { value: "Grado-PhD", label: "Doctorado" },
  { value: "Grado-Diploma", label: "Diplomado" },
  { value: "Grado-Especializacion", label: "Especialización" }
]

function LoadingSpinner() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 100,
          damping: 10
        }}
        className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Loader2 className="w-12 h-12 text-blue-500 mb-4" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600"
        >
          Procesando tu solicitud...
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-gray-500 mt-2"
        >
          Por favor, espera mientras generamos tu contenido
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

function Alert({ message }: { message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg"
    >
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center"
      >
        <motion.div
          initial={{ rotate: -20 }}
          animate={{ rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
        >
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-red-700"
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const totalSteps = 5 // Now including preview step
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`h-2 w-2 rounded-full ${
            index + 1 === currentStep
              ? 'bg-blue-600 scale-125'
              : index + 1 < currentStep
              ? 'bg-blue-400'
              : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="text-sm text-gray-500 ml-2">
        {currentStep} de {totalSteps}
      </span>
    </div>
  )
}

function MultiSelect({ value, onChange }: { value: string[], onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {value.map((v) => (
                <Badge
                  variant="secondary"
                  key={v}
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(value.filter((item) => item !== v))
                  }}
                >
                  {grades.find((grade) => grade.value === v)?.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          ) : (
            "Seleccionar grados..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar grado..." />
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup>
            {grades.map((grade) => (
              <CommandItem
                key={grade.value}
                onSelect={() => {
                  onChange(
                    value.includes(grade.value)
                      ? value.filter((item) => item !== grade.value)
                      : [...value, grade.value]
                  )
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    value.includes(grade.value) ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}
                >
                  {value.includes(grade.value) && (
                    <X className="h-3 w-3" />
                  )}
                </div>
                {grade.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function UnitPlanner() {
  const router = useRouter()
  const { t } = useLanguage()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    nombreUnidad: "",
    asignatura: "",
    detallesUnidad: "",
    estandaresObjetivos: "",
    numeroLecciones: 5,
    email: "",
    methodology: [],
    nivelEducativo: [],
    generateInEnglish: false,
    otroNivelEducativo: "",
    otraMetodologia: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showAlert, setShowAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGradeModalOpen, setGradeModalOpen] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState("")

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const email = localStorage.getItem("email")
        if (!email) {
          toast.error("No se encontró el email del usuario")
          router.push("/sign-in")
          return
        }

        const checkResponse = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/registration/check-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        if (!checkResponse.ok) {
          throw new Error("Error al verificar el registro")
        }

        const checkData = await checkResponse.json()

        if (!checkData.registered) {
          toast.success("Por favor, completa tu registro primero")
          router.push("/onboarding")
        }
      } catch (error) {
        console.error("Error:", error)
     //   toast.error("Hubo un error al verificar tu registro")
      //  router.push("/onboarding")
      }
    }

    checkRegistration()
  }, [router])

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail') || 'usuario@ejemplo.com'
    setFormData(prev => ({ ...prev, email: userEmail }))
  }, [])

  const startPlanning = () => {
    setStep(1)
  }

  const validateField = (field: string, value: string | string[] | boolean) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      switch (field) {
        case 'nombreUnidad':
          return 'Por favor, ingresa el tema de la clase'
        case 'asignatura':
          return 'Por favor, selecciona la materia'
        case 'nivelEducativo':
          return 'Por favor, selecciona el nivel educativo'
        case 'detallesUnidad':
          return 'Por favor, describe qué quieres que tus estudiantes aprendan'
        case 'methodology':
          return 'Por favor, selecciona al menos una metodología de enseñanza'
        case 'estandaresObjetivos':
          return 'Por favor, describe los estándares y objetivos'
        default:
          return ""
      }
    }
    return ""
  }

  const handleFieldChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    const error = validateField(field, value)
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
    setShowAlert(false)
  }

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {}
    
    if (currentStep === 1) {
      newErrors.nombreUnidad = validateField('nombreUnidad', formData.nombreUnidad)
      newErrors.asignatura = validateField('asignatura', formData.asignatura)
      newErrors.nivelEducativo = validateField('nivelEducativo', formData.nivelEducativo || [])
    } else if (currentStep === 2) {
      newErrors.detallesUnidad = validateField('detallesUnidad', formData.detallesUnidad)
      newErrors.methodology = validateField('methodology', formData.methodology)
    } else if (currentStep === 3) {
      newErrors.estandaresObjetivos = validateField('estandaresObjetivos', formData.estandaresObjetivos)
    }

    setErrors(newErrors)
    const hasErrors = Object.values(newErrors).some(error => error)
    setShowAlert(hasErrors)
    return !hasErrors
  }

  const validateAccess = async (email: string) => {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/validate-access?email=${encodeURIComponent(email)}`, {
        headers: {
          'Accept': 'application/vnd.api+json'
        }
      })
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error validating access:', error)
      return { allowed: true, message: 'Error al validar el acceso' }
    }
  }

  const handleSubmit = async () => {
    if (validateStep(3)) {
      setIsLoading(true)
      try {
        // Validar acceso antes de continuar
        const email = localStorage.getItem('email')
        if (!email) {
          toast.error("No se encontró el email del usuario")
          setIsLoading(false)
          return
        }

        const accessValidation = await validateAccess(email)
        if (!accessValidation.allowed) {
          setAccessMessage(accessValidation.message)
          setShowPricingModal(true)
          setIsLoading(false)
         return
        }

        // Si tiene acceso, continuar con el flujo normal
        const requestData = {
          nombreUnidad: formData.nombreUnidad,
          asignatura: formData.asignatura === "otro" ? formData.otraAsignatura : formData.asignatura,
          detallesUnidad: formData.detallesUnidad,
          estandaresObjetivos: formData.estandaresObjetivos,
          numeroLecciones: formData.numeroLecciones,
          email: formData.email,
          methodology: formData.methodology.includes("otro")
            ? formData.otraMetodologia
            : formData.methodology.length > 0 
              ? formData.methodology.join(',') 
              : "Clase magistral",
          course: formData.asignatura === "otro" ? formData.otraAsignatura : formData.asignatura,
          nivelEducativo: formData.nivelEducativo.includes("otro") 
            ? [...formData.nivelEducativo.filter(n => n !== "otro"), formData.otroNivelEducativo].join(', ')
            : formData.nivelEducativo.join(', '),
          generateInEnglish: formData.generateInEnglish || false
        }

        console.log('Saving to localStorage:', requestData)
        console.log('generateInEnglish value being saved:', requestData.generateInEnglish)
        
        localStorage.setItem('unitPlannerData', JSON.stringify(requestData))
        await new Promise(resolve => setTimeout(resolve, 2000))
        router.push('/unit-planner/view')
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto py-16 px-4"
      >
        {step === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">{t('unitPlanner.newTool')}</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
            >
              {t('unitPlanner.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              {t('unitPlanner.subtitle')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto border border-gray-100 mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{t('unitPlanner.startPlanning')}</h2>
                  <p className="text-sm text-gray-500">{t('unitPlanner.startPlanningSubtitle')}</p>
                </div>
              </div>
              <Button
                className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-sm hover:shadow-md transition-all duration-300"
                size="lg"
                onClick={startPlanning}
              >
                {t('unitPlanner.letsStart')} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex justify-center mb-16"
            >
              <Link href="/unit-planner/history">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border-blue-200 hover:border-blue-300 px-6 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Clock className="w-5 h-5" />
                  {t('unitPlanner.classHistory')}
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="max-w-3xl mx-auto mb-12 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Tutorial: Cómo crear una planeación efectiva</h2>
                  <p className="text-sm text-gray-500">Aprende a aprovechar al máximo esta herramienta</p>
                </div>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/1YZPk352zd0"
                  title="Tutorial de Planeación"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            >
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-100 cursor-pointer"
                onClick={() => setStep(1)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                    <BrainCircuit className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">{t('unitPlanner.features.intelligentPlanning.title')}</h3>
                </div>
                <p className="text-gray-600">{t('unitPlanner.features.intelligentPlanning.description')}</p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-purple-100 cursor-pointer"
                onClick={() => setStep(1)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">{t('unitPlanner.features.clearObjectives.title')}</h3>
                </div>
                <p className="text-gray-600">{t('unitPlanner.features.clearObjectives.description')}</p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-green-100 cursor-pointer"
                onClick={() => setStep(1)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">{t('unitPlanner.features.efficientOrganization.title')}</h3>
                </div>
                <p className="text-gray-600">{t('unitPlanner.features.efficientOrganization.description')}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <UnitPlannerSteps 
            currentStep={step} 
            setStep={setStep} 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit}
            errors={errors}
            validateStep={validateStep}
            handleFieldChange={handleFieldChange}
            touched={touched}
            showAlert={showAlert}
            isLoading={isLoading}
            isGradeModalOpen={isGradeModalOpen}
            setGradeModalOpen={setGradeModalOpen}
          />
        )}
      </motion.div>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal}
        accessMessage={accessMessage}
      />
    </Layout>
  )
}

function UnitPlannerSteps({ 
  currentStep, 
  setStep, 
  formData, 
  setFormData,
  onSubmit,
  errors,
  validateStep,
  handleFieldChange,
  touched,
  showAlert,
  isLoading,
  isGradeModalOpen,
  setGradeModalOpen
}: { 
  currentStep: number
  setStep: (step: number) => void
  formData: FormData
  setFormData: (data: FormData) => void
  onSubmit: (e: React.FormEvent) => void
  errors: Record<string, string>
  validateStep: (step: number) => boolean
  handleFieldChange: (field: string, value: string | string[] | boolean) => void
  touched: Record<string, boolean>
  showAlert: boolean
  isLoading: boolean
  isGradeModalOpen: boolean
  setGradeModalOpen: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const goBack = () => {
    setStep(currentStep - 1)
  }

  const goNext = () => {
    if (validateStep(currentStep)) {
      setStep(currentStep + 1)
    }
  }

  const getAlertMessage = () => {
    if (currentStep === 1) {
      if (errors.nombreUnidad) return errors.nombreUnidad
      if (errors.asignatura) return errors.asignatura
    } else if (currentStep === 2) {
      if (errors.detallesUnidad) return errors.detallesUnidad
      if (errors.methodology) return errors.methodology
    } else if (currentStep === 3) {
      if (errors.estandaresObjetivos) return errors.estandaresObjetivos
    }
    return "Por favor, completa todos los campos requeridos"
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl border shadow-sm p-8"
    >
      <ProgressIndicator currentStep={currentStep} />
      
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert message={getAlertMessage()} />
        </motion.div>
      )}
      
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"
            >
              <BookOpen className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{t('unitPlanner.steps.basicInfo.title')}</h1>
              <p className="text-sm text-gray-500">{t('unitPlanner.steps.basicInfo.subtitle')}</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">¿Nombre de la clase o tema?</label>
              <input
                type="text"
                value={formData.nombreUnidad}
                onChange={(e) => handleFieldChange('nombreUnidad', e.target.value)}
                placeholder="Ej: La independencia de Colombia"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  touched.nombreUnidad && errors.nombreUnidad ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.nombreUnidad && errors.nombreUnidad && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 text-sm text-red-500"
                >
                  {errors.nombreUnidad}
                </motion.p>
              )}
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700">Detalles de la clase</h3>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Nivel educativo (puedes seleccionar varios)</label>
                <Select
                  value={formData.nivelEducativo.length > 0 ? formData.nivelEducativo[0] : undefined}
                  onValueChange={(value) => {
                    const newValues = formData.nivelEducativo.includes(value)
                      ? formData.nivelEducativo.filter(v => v !== value)
                      : [...formData.nivelEducativo, value]
                    handleFieldChange("nivelEducativo", newValues)
                  }}
                >
                  <SelectTrigger className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    touched.nivelEducativo && errors.nivelEducativo ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    <SelectValue>
                      {formData.nivelEducativo.length > 0 ? (
                        formData.nivelEducativo.map(value => grades.find(grade => grade.value === value)?.label).join(', ')
                      ) : (
                        "Selecciona los grados"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="otro">Otro (especificar)</SelectItem>
                    <SelectItem value="infantil">Educación Infantil</SelectItem>
                    <SelectItem value="pre-escolar">Pre-escolar</SelectItem>
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
                {formData.nivelEducativo.includes("otro") && (
                  <div className="mt-2">
                    <Input
                      placeholder="Especifica el nivel educativo"
                      value={formData.otroNivelEducativo || ""}
                      onChange={(e) => handleFieldChange("otroNivelEducativo", e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                {formData.nivelEducativo.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.nivelEducativo.map((value) => (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {grades.find((grade) => grade.value === value)?.label}
                        <button
                          onClick={() => {
                            const newValues = formData.nivelEducativo.filter(v => v !== value)
                            handleFieldChange("nivelEducativo", newValues)
                          }}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {touched.nivelEducativo && errors.nivelEducativo && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.nivelEducativo}
                  </motion.p>
                )}
                <button
                  type="button"
                  className="mt-3 px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
                  onClick={() => setGradeModalOpen(true)}
                >
                  Ver equivalencia de grados por país
                </button>
                <GradeEquivalenceModal open={isGradeModalOpen} onOpenChange={setGradeModalOpen} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Materia</label>
                <Select
                  value={formData.asignatura}
                  onValueChange={(value) => handleFieldChange('asignatura', value)}
                >
                  <SelectTrigger className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    touched.asignatura && errors.asignatura ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    <SelectValue placeholder="Selecciona la materia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="otro">Otro (especificar)</SelectItem>
                    <SelectItem value="biologia">Biología</SelectItem>
                    <SelectItem value="ciencias-naturales">Ciencias Naturales</SelectItem>
                    <SelectItem value="ciencias-sociales">Ciencias Sociales</SelectItem>
                    <SelectItem value="economia">Economía</SelectItem>
                    <SelectItem value="educacion-artistica">Educación Artística y Cultural</SelectItem>
                    <SelectItem value="educacion-fisica">Educación Física, Recreación y Deportes</SelectItem>
                    <SelectItem value="fisica">Física</SelectItem>
                    <SelectItem value="geografia">Geografía</SelectItem>
                    <SelectItem value="historia">Historia</SelectItem>
                    <SelectItem value="ingles">Inglés</SelectItem>
                    <SelectItem value="musica">Musica</SelectItem>
                    <SelectItem value="matematicas">Matemáticas</SelectItem>
                    <SelectItem value="quimica">Química</SelectItem>
                    <SelectItem value="lengua">Lengua</SelectItem>
                    <SelectItem value="espanol">Español</SelectItem>
                    <SelectItem value="literatura">Literatura</SelectItem>
                    <SelectItem value="religion">Religión</SelectItem>
                    <SelectItem value="constitucion-politica">Constitución Política y Democracia</SelectItem>
                    <SelectItem value="etica-valores">Ética y Valores Humanos</SelectItem>
                    <SelectItem value="filosofia">Filosofía</SelectItem>
                    <SelectItem value="tecnologia-informatica">Tecnología e Informática</SelectItem>
                    <SelectItem value="educacion-ambiental">Educación Ambiental</SelectItem>
                    <SelectItem value="estudios-afrocolombianos">Cátedra de Estudios Afrocolombianos</SelectItem>
                    <SelectItem value="educacion-ciudadana">Educación para la Ciudadanía</SelectItem>
                    <SelectItem value="educacion-paz">Educación para la Paz</SelectItem>
                    <SelectItem value="educacion-sexualidad">Educación para la Sexualidad</SelectItem>
                
                  </SelectContent>
                </Select>
                {formData.asignatura === "otro" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Especifica la materia"
                      value={formData.otraAsignatura || ""}
                      onChange={(e) => handleFieldChange("otraAsignatura", e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                {formData.asignatura && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id="generateInEnglish"
                      checked={formData.generateInEnglish}
                      onChange={(e) => {
                        console.log('Checkbox changed:', e.target.checked)
                        handleFieldChange('generateInEnglish', e.target.checked)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="generateInEnglish" className="text-sm text-gray-700">
                      ¿Deseas que el contenido de la clase se genere en inglés?
                    </label>
                  </motion.div>
                )}
                {errors.asignatura && touched.asignatura && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.asignatura}
                  </motion.p>
                )}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-4 pt-6"
            >
              <Button onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800">
                {t('unitPlanner.steps.basicInfo.back')}
              </Button>
              <Button
                onClick={goNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                disabled={touched.nombreUnidad && touched.asignatura && (!!errors.nombreUnidad || !!errors.asignatura)}
              >
                {t('unitPlanner.steps.basicInfo.next')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center"
            >
              <Target className="w-6 h-6 text-purple-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Metodología y contenido</h1>
              <p className="text-sm text-gray-500">Define cómo enseñarás y qué cubrirás en la clase</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Metodología de enseñanza</label>
              <Select
                value={formData.methodology.length > 0 ? formData.methodology.join(', ') : undefined}
                onValueChange={(value) => {
                  const newMethodologies = formData.methodology.includes(value)
                    ? formData.methodology.filter(m => m !== value)
                    : [...formData.methodology, value]
                  handleFieldChange('methodology', newMethodologies)
                }}
              >
                <SelectTrigger className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  touched.methodology && errors.methodology ? 'border-red-500' : 'border-gray-300'
                }`}>
                  <SelectValue>
                    {formData.methodology.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{formData.methodology.join(', ')}</span>
                        <span className="text-sm text-gray-500">
                          {formData.methodology.length} metodología{formData.methodology.length > 1 ? 's' : ''} seleccionada{formData.methodology.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      "Selecciona una o más metodologías de enseñanza"
                    )}
                  </SelectValue>
                </SelectTrigger>
                
                <SelectContent>
                <SelectItem value="otro">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Otro (especificar)</span>
                      <span className="text-sm text-gray-500">Especifica una metodología de enseñanza personalizada.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Clase magistral">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Clase magistral</span>
                      <span className="text-sm text-gray-500">El profesor presenta el contenido de manera directa, mientras los estudiantes asimilan y toman notas.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje activo">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje activo</span>
                      <span className="text-sm text-gray-500">Los estudiantes participan activamente, realizando actividades prácticas y proyectos colaborativos.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje práctico">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje práctico</span>
                      <span className="text-sm text-gray-500">Muestra cómo el contenido se aplica a profesiones reales, preparándolos para los desafíos del mercado.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje social y emocional">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje social y emocional</span>
                      <span className="text-sm text-gray-500">Combina contenido escolar con habilidades socioemocionales, como la empatía y el trabajo en equipo.</span>
                    </div>
                  </SelectItem>

                  {/* Nuevas metodologías */}
                  <SelectItem value="Diseño Universal para el Aprendizaje">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">DUA: Diseño Universal para el Aprendizaje</span>
                      <span className="text-sm text-gray-500">Proporciona múltiples formas de aprender, involucrarse y expresar el conocimiento.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Basado en Casos">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Basado en Casos</span>
                      <span className="text-sm text-gray-500">Los estudiantes analizan situaciones reales o simuladas para aplicar conocimientos y tomar decisiones.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Basado en Indagación">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Basado en Indagación</span>
                      <span className="text-sm text-gray-500">Se fomenta la curiosidad, iniciando desde preguntas del estudiante para investigar y construir conocimiento.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Basado en Investigación">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Basado en Investigación</span>
                      <span className="text-sm text-gray-500">Los estudiantes indagan científicamente para resolver preguntas complejas.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Basado en Problemas">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Basado en Problemas</span>
                      <span className="text-sm text-gray-500">Resolver problemas reales o simulados para desarrollar habilidades de análisis y solución.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Basado en Proyectos">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Basado en Proyectos</span>
                      <span className="text-sm text-gray-500">Los estudiantes crean un producto final aplicando conocimientos durante el proceso.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Basado en Retos">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Basado en Retos</span>
                      <span className="text-sm text-gray-500">Enfrentan desafíos reales que requieren soluciones creativas e innovadoras.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Colaborativo">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Colaborativo</span>
                      <span className="text-sm text-gray-500">Fomenta el trabajo en equipo para alcanzar objetivos comunes mediante la cooperación.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Aprendizaje Invertido">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Aprendizaje Invertido</span>
                      <span className="text-sm text-gray-500">El estudiante revisa teoría en casa y aplica en clase mediante prácticas guiadas.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Design Thinking">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Design Thinking</span>
                      <span className="text-sm text-gray-500">Metodología centrada en el usuario para diseñar soluciones creativas a problemas complejos.</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="Gamificación">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Gamificación</span>
                      <span className="text-sm text-gray-500">Aplica elementos del juego para motivar y hacer más atractivo el proceso de aprendizaje.</span>
                    </div>
                  </SelectItem>

                </SelectContent>
              </Select>
              {formData.methodology.includes("otro") && (
                <div className="mt-2">
                  <Input
                    placeholder="Especifica la metodología de enseñanza"
                    value={formData.otraMetodologia || ""}
                    onChange={(e) => handleFieldChange("otraMetodologia", e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">¿Qué quieres que tus estudiantes aprendan con esta clase?</label>
              <textarea
                value={formData.detallesUnidad}
                onChange={(e) => handleFieldChange('detallesUnidad', e.target.value)}
                placeholder="Describe los principales conceptos y habilidades que quieres que tus estudiantes desarrollen"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] ${
                  touched.detallesUnidad && errors.detallesUnidad ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.detallesUnidad && errors.detallesUnidad && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 text-sm text-red-500"
                >
                  {errors.detallesUnidad}
                </motion.p>
              )}

            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-4 pt-6"
            >
              <Button onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800">
                {t('unitPlanner.steps.classDetails.back')}
              </Button>
              <Button
                onClick={goNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                disabled={touched.detallesUnidad && !!errors.detallesUnidad}
              >
                {t('unitPlanner.steps.classDetails.next')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center"
            >
              <Target className="w-6 h-6 text-purple-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Estándares y objetivos</h1>
              <p className="text-sm text-gray-500">Define los estándares y objetivos de aprendizaje</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Estándares y objetivos de aprendizaje</label>
              <textarea
                value={formData.estandaresObjetivos}
                onChange={(e) => handleFieldChange('estandaresObjetivos', e.target.value)}
                placeholder="Aquí puedes escribir los estándares y objetivos de aprendizaje, todos los detalles de la clase (actividades, contenidos, recursos y estrategias inclusivas), y puedes  incorporar los planes y programas de la Educación de enseñanza de tu país."
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] ${
                  touched.estandaresObjetivos && errors.estandaresObjetivos ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.estandaresObjetivos && errors.estandaresObjetivos && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 text-sm text-red-500"
                >
                  {errors.estandaresObjetivos}
                </motion.p>
              )}
              <div className="flex justify-end mt-1">
                <StandardsDialog 
                  onSelectStandard={(standard) => {
                    const currentValue = formData.estandaresObjetivos.trim();
                    const newValue = currentValue
                      ? `${currentValue}\n${standard}`
                      : standard;
                    handleFieldChange('estandaresObjetivos', newValue);
                  }} 
                />
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-4 pt-6"
            >
              <Button onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800">
                {t('unitPlanner.steps.classDetails.back')}
              </Button>
              <Button
                onClick={goNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                disabled={touched.estandaresObjetivos && !!errors.estandaresObjetivos}
              >
                {t('unitPlanner.steps.classDetails.next')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center"
            >
              <Calendar className="w-6 h-6 text-green-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Duración de la clase</h1>
              <p className="text-sm text-gray-500">¿Cuántas sesiones vas a dedicar a este tema?</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Número de lecciones</label>
              <p className="text-sm text-gray-500 mb-4">1 lección = 1 clase de 40-60 min aprox.</p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center justify-center gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, numeroLecciones: Math.max(1, formData.numeroLecciones - 1) })}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100"
                >
                  -
                </motion.button>
                <motion.div 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl font-medium w-32 text-center"
                >
                  {formData.numeroLecciones} {t('unitPlanner.steps.duration.lessons')}
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, numeroLecciones: Math.min(10, formData.numeroLecciones + 1) })}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100"
                >
                  +
                </motion.button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex gap-4 pt-10"
            >
              <Button onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800">
                {t('unitPlanner.steps.duration.back')}
              </Button>
              <Button
                onClick={goNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
              >
                Ver vista previa
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {currentStep === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"
            >
              <BookOpen className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Vista previa de tu planeación</h1>
              <p className="text-sm text-gray-500">Revisa los detalles antes de generar tu planeación</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Tema de la clase</h3>
                <p className="text-gray-900">{formData.nombreUnidad}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Detalles</h3>
                <p className="text-gray-900">{formData.nivelEducativo.join(', ')} - {formData.asignatura}  {formData.otraAsignatura}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Metodología</h3>
                <p className="text-gray-900">{formData.methodology.join(', ')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Contenido</h3>
                <p className="text-gray-900 whitespace-pre-line">{formData.detallesUnidad}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Estándares y objetivos</h3>
                <p className="text-gray-900 whitespace-pre-line">{formData.estandaresObjetivos}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Duración</h3>
                <p className="text-gray-900">{formData.numeroLecciones} lecciones</p>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex gap-4 pt-6"
            >
              <Button onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800">
                Volver a editar
              </Button>
              <Button
                onClick={onSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('unitPlanner.steps.duration.processing')}
                  </>
                ) : (
                  <>
                    Generar planeación <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

