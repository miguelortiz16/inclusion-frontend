"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeft, 
  ArrowRight, 
  Globe, 
  User, 
  MapPin, 
  BookOpen, 
  GraduationCap, 
  School, 
  Phone, 
  CheckCircle2,
  FileText,
  Shield,
  Users,
  Book,
  BookMarked,
  Building2,
  PhoneCall,
  Search,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type AccountType = "profesor" | "estudiante" | "administrativo" | null
type Step = 1 | 2 | 3 | 4 | 5
type Subject = string
type Grade = string

const countries = {
  america: [
    { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
    { code: "BO", name: "Bolivia", flag: "🇧🇴", dialCode: "+591" },
    { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
    { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56" },
    { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57" },
    { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506" },
    { code: "CU", name: "Cuba", flag: "🇨🇺", dialCode: "+53" },
    { code: "DO", name: "República Dominicana", flag: "🇩🇴", dialCode: "+1" },
    { code: "EC", name: "Ecuador", flag: "🇪🇨", dialCode: "+593" },
    { code: "SV", name: "El Salvador", flag: "🇸🇻", dialCode: "+503" },
    { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "+502" },
    { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "+504" },
    { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52" },
    { code: "NI", name: "Nicaragua", flag: "🇳🇮", dialCode: "+505" },
    { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "+507" },
    { code: "PY", name: "Paraguay", flag: "🇵🇾", dialCode: "+595" },
    { code: "PE", name: "Perú", flag: "🇵🇪", dialCode: "+51" },
    { code: "PR", name: "Puerto Rico", flag: "🇵🇷", dialCode: "+1" },
    { code: "UY", name: "Uruguay", flag: "🇺🇾", dialCode: "+598" },
    { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58" },
    { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
    { code: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "+1" }
  ],
  europe: [
    { code: "ES", name: "España", flag: "🇪🇸", dialCode: "+34" },
    { code: "FR", name: "Francia", flag: "🇫🇷", dialCode: "+33" },
    { code: "DE", name: "Alemania", flag: "🇩🇪", dialCode: "+49" },
    { code: "IT", name: "Italia", flag: "🇮🇹", dialCode: "+39" },
    { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
    { code: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44" },
    { code: "NL", name: "Países Bajos", flag: "🇳🇱", dialCode: "+31" },
    { code: "BE", name: "Bélgica", flag: "🇧🇪", dialCode: "+32" },
    { code: "CH", name: "Suiza", flag: "🇨🇭", dialCode: "+41" },
    { code: "AT", name: "Austria", flag: "🇦🇹", dialCode: "+43" }
  ]
}

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [otherSubject, setOtherSubject] = useState("")
  const [grades, setGrades] = useState<Grade[]>([])
  const [isSchoolAssociated, setIsSchoolAssociated] = useState<boolean | null>(null)
  const [school, setSchool] = useState("")
  const [phone, setPhone] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [privacyAccepted, setPrivacyAccepted] = useState(true)
  const [showCountrySelect, setShowCountrySelect] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDialCode, setSelectedDialCode] = useState("+57")
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar si el usuario ya está registrado al cargar el componente
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

        if (checkData.registered) {
          toast.success("¡Bienvenido de nuevo a ProfePlanner!")
          window.location.href = `${window.location.origin}/unit-planner`
        console.log(checkData)
        }
      } catch (error) {
        console.error("Error:", error)
        toast.error("Hubo un error al verificar tu registro")
      }
    }

    checkRegistration()
  }, [router])

  const availableSubjects = [
    "Biología",
    "Economía",
    "Geografía",
    "Matemáticas",
    "Física",
    "Química",
    "Historia",
    "Ciencias Naturales",
    "Educación Física, Recreación y Deportes",
    "Educación Artística y Cultural",
    "Inglés",
    "Ciencias Sociales",
  ]

  const availableGrades = [
    "Educación infantil",
    "1° Grado",
    "2° Grado",
    "3° Grado",
    "4° Grado",
    "5° Grado",
    "6° Grado",
    "7° Grado",
    "8° Grado",
    "9° Grado",
    "10° Grado",
    "11° Grado",
    "Universidad",
  ]

  const handleSubjectToggle = (subject: Subject) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter((s) => s !== subject))
    } else {
      setSubjects([...subjects, subject])
    }
  }

  const handleGradeToggle = (grade: Grade) => {
    if (grades.includes(grade)) {
      setGrades(grades.filter((g) => g !== grade))
    } else {
      setGrades([...grades, grade])
    }
  }

  const handleNext = async () => {
    setErrorMessage("") // Limpiar mensaje de error al intentar avanzar
    setIsSubmitting(true) // Deshabilitar el botón

    try {
      // Validar campos según el paso actual
      switch (step) {
        case 1:
          if (!accountType) {
            setErrorMessage("Por favor selecciona un tipo de cuenta")
            return
          }
          break
        case 2:
          if (!name) {
            setErrorMessage("Por favor ingresa tu nombre completo")
            return
          }
          if (!country) {
            setErrorMessage("Por favor selecciona tu país")
            return
          }
          break
        case 3:
          if (subjects.length === 0 && !otherSubject) {
            setErrorMessage("Por favor selecciona al menos una materia")
            return
          }
          if (subjects.includes("Otra") && !otherSubject) {
            setErrorMessage("Por favor especifica la otra materia")
            return
          }
          break
        case 4:
          if (grades.length === 0) {
            setErrorMessage("Por favor selecciona al menos un grado")
            return
          }
          break
        case 5:
          if (isSchoolAssociated === null) {
            setErrorMessage("Por favor indica si estás asociado a una escuela")
            return
          }
          if (isSchoolAssociated && !school) {
            setErrorMessage("Por favor ingresa el nombre de tu escuela")
            return
          }
          if (!phone) {
            setErrorMessage("Por favor ingresa tu número de teléfono")
            return
          }
          if (!termsAccepted) {
            setErrorMessage("Por favor acepta los Términos y Condiciones")
            return
          }
          if (!privacyAccepted) {
            setErrorMessage("Por favor acepta el Aviso de Privacidad")
            return
          }
          break
      }

      if (step < 5) {
        setStep((step + 1) as Step)
      } else {
        const email = localStorage.getItem("email")
        if (!email) {
          setErrorMessage("No se encontró el email del usuario")
          return
        }

        // Obtener el objeto completo del país seleccionado
        const allCountries = [...countries.america, ...countries.europe]
        const selectedCountryData = allCountries.find(c => c.code === country)

        // Preparar los datos para enviar al backend
        const userData = {
          email,
          accountType,
          name,
          country: selectedCountryData,
          subjects: subjects.concat(otherSubject ? [otherSubject] : []),
          grades,
          isSchoolAssociated,
          school: isSchoolAssociated ? school : null,
          phone: `${selectedDialCode}${phone}`,
          termsAccepted,
          privacyAccepted
        }

        // Enviar datos al backend
        const response = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/registration/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          throw new Error("Error al guardar los datos")
        }

        const data = await response.json()

        // Mostrar mensaje de éxito
        toast.success("¡Bienvenido a ProfePlanner!")

        // Redirigir a /inicio
        router.push("/pricing")
      }
    } catch (error) {
      console.error("Error:", error)
      setErrorMessage("Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.")
    } finally {
      setIsSubmitting(false) // Habilitar el botón nuevamente
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const isNextDisabled = () => {
    switch (step) {
      case 1:
        return !accountType
      case 2:
        return !name || !country
      case 3:
        return subjects.length === 0 && !otherSubject
      case 4:
        return grades.length === 0
      case 5:
        return !phone || !termsAccepted || !privacyAccepted
      default:
        return false
    }
  }

  const filteredCountries = [...countries.america, ...countries.europe].filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDialCodeByCountryCode = (countryCode: string) => {
    const allCountries = [...countries.america, ...countries.europe]
    const country = allCountries.find(c => c.code === countryCode)
    return country?.dialCode || "+57"
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.98
    }
  }

  return (
    <motion.div className="flex min-h-screen">
      {/* Left panel - Form */}
      <motion.div className="w-full md:w-1/2 p-6 flex flex-col">
        <motion.div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/images/logo.png"
                width={40}
                height={40}
                alt="ProfePlanner Logo"
                className="h-10 w-10"
              />
            </motion.div>
            <span className="text-2xl font-bold text-[#2563eb]">ProfePlanner®</span>
          </div>
          <Link href="#" className="text-[#2563eb] hover:text-[#1d4ed8]">
            Cerrar sesión
          </Link>
        </motion.div>

        <motion.div className="flex items-center mb-4">
          <motion.button 
            onClick={handleBack} 
            className="text-[#2563eb] flex items-center" 
            disabled={step === 1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Volver</span>
          </motion.button>
          <div className="ml-auto text-gray-500">{step} / 5</div>
        </motion.div>

        <motion.div className="flex-1">
          {errorMessage && (
            <motion.div 
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 font-medium shadow-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <X className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            </motion.div>
          )}
          
          <AnimatePresence mode="wait">
            {/* Step 1: Account Type */}
            {step === 1 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="flex items-center gap-2 mb-4">
                  <motion.div 
                    className="p-2 bg-[#2563eb]/10 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Users className="h-6 w-6 text-[#2563eb]" />
                  </motion.div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-medium">¿Cuál será su tipo de cuenta?</h2>
                  </div>
                </motion.div>

                <motion.div className="space-y-4">
                  <motion.button
                    onClick={() => setAccountType("profesor")}
                    className={`w-full p-4 border rounded-lg flex items-center gap-3 hover:border-[#2563eb] transition-colors ${
                      accountType === "profesor" ? "border-[#2563eb] bg-[#2563eb]/10" : "border-gray-200"
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div 
                      className="p-2 bg-[#2563eb]/10 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <User className="h-6 w-6 text-[#2563eb]" />
                    </motion.div>
                    <span className="text-lg">Profesor</span>
                  </motion.button>

                  <motion.button
                    onClick={() => setAccountType("estudiante")}
                    className={`w-full p-4 border rounded-lg flex items-center gap-3 hover:border-[#2563eb] transition-colors ${
                      accountType === "estudiante" ? "border-[#2563eb] bg-[#2563eb]/10" : "border-gray-200"
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div 
                      className="p-2 bg-[#2563eb]/10 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <GraduationCap className="h-6 w-6 text-[#2563eb]" />
                    </motion.div>
                    <span className="text-lg">Estudiante</span>
                  </motion.button>

                  <motion.button
                    onClick={() => setAccountType("administrativo")}
                    className={`w-full p-4 border rounded-lg flex items-center gap-3 hover:border-[#2563eb] transition-colors ${
                      accountType === "administrativo" ? "border-[#2563eb] bg-[#2563eb]/10" : "border-gray-200"
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div 
                      className="p-2 bg-[#2563eb]/10 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Building2 className="h-6 w-6 text-[#2563eb]" />
                    </motion.div>
                    <span className="text-lg">Administrativo</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Name and Country */}
            {step === 2 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="flex items-center gap-2 mb-4" variants={itemVariants}>
                  <motion.div 
                    className="p-2 bg-[#2563eb]/10 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MapPin className="h-6 w-6 text-[#2563eb]" />
                  </motion.div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-medium">¿Puedes confirmar tu nombre y país?</h2>
                  </div>
                </motion.div>

                <motion.div className="space-y-4" variants={containerVariants}>
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Escribe tu nombre completo"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">País</Label>
                    <div className="relative mt-1">
                      <Select
                        value={country}
                        onValueChange={(value) => {
                          setCountry(value)
                          setSelectedDialCode(getDialCodeByCountryCode(value))
                          setShowCountrySelect(false)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                placeholder="Buscar país..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            <div className="px-2 py-1 text-sm font-medium text-gray-500">América</div>
                            {countries.america
                              .filter(country => country.name.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <div className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            <div className="px-2 py-1 text-sm font-medium text-gray-500">Europa</div>
                            {countries.europe
                              .filter(country => country.name.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <div className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Subjects */}
            {step === 3 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="flex items-center gap-2 mb-4" variants={itemVariants}>
                  <motion.div 
                    className="p-2 bg-[#2563eb]/10 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Book className="h-6 w-6 text-[#2563eb]" />
                  </motion.div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-medium">¿Qué disciplinas enseñas?</h2>
                  </div>
                </motion.div>

                <motion.div className="flex flex-wrap gap-2" variants={containerVariants}>
                  {availableSubjects.map((subject) => (
                    <motion.button
                      key={subject}
                      onClick={() => handleSubjectToggle(subject)}
                      className={`px-4 py-2 rounded-full border transition-colors ${
                        subjects.includes(subject)
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "border-gray-300 hover:border-[#2563eb]"
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {subject}
                    </motion.button>
                  ))}

                  <motion.button
                    onClick={() => handleSubjectToggle("Otra")}
                    className={`px-4 py-2 rounded-full border transition-colors flex items-center gap-1 ${
                      subjects.includes("Otra")
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "border-gray-300 hover:border-[#2563eb]"
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Otra</span>
                  </motion.button>
                </motion.div>

                {subjects.includes("Otra") && (
                  <motion.div 
                    className="mt-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="otherSubject">¿Cuál otra disciplina?</Label>
                    <Input
                      id="otherSubject"
                      value={otherSubject}
                      onChange={(e) => setOtherSubject(e.target.value)}
                      placeholder="Escribe la disciplina"
                      className="mt-1"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 4: Grades */}
            {step === 4 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="flex items-center gap-2 mb-4" variants={itemVariants}>
                  <motion.div 
                    className="p-2 bg-[#2563eb]/10 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <BookMarked className="h-6 w-6 text-[#2563eb]" />
                  </motion.div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-medium">¿Para qué grados?</h2>
                  </div>
                </motion.div>

                <motion.div className="flex flex-wrap gap-2" variants={containerVariants}>
                  {availableGrades.map((grade) => (
                    <motion.button
                      key={grade}
                      onClick={() => handleGradeToggle(grade)}
                      className={`px-4 py-2 rounded-full border transition-colors ${
                        grades.includes(grade)
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "border-gray-300 hover:border-[#2563eb]"
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {grade}
                    </motion.button>
                  ))}

                  <motion.button
                    onClick={() => handleGradeToggle("Otra")}
                    className={`px-4 py-2 rounded-full border transition-colors flex items-center gap-1 ${
                      grades.includes("Otra")
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "border-gray-300 hover:border-[#2563eb]"
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Otra</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 5: School and Phone */}
            {step === 5 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="flex items-center gap-2 mb-4" variants={itemVariants}>
                  <motion.div 
                    className="p-2 bg-[#2563eb]/10 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <School className="h-6 w-6 text-[#2563eb]" />
                  </motion.div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-medium">¿Estás asociado a una escuela?</h2>
                  </div>
                </motion.div>

                <motion.div className="flex gap-2" variants={containerVariants}>
                  <motion.button
                    className={`rounded-full px-4 py-2 ${
                      isSchoolAssociated === true 
                        ? "bg-[#2563eb] text-white" 
                        : "border border-gray-300 hover:border-[#2563eb]"
                    }`}
                    onClick={() => setIsSchoolAssociated(true)}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Sí
                  </motion.button>
                  <motion.button
                    className={`rounded-full px-4 py-2 ${
                      isSchoolAssociated === false 
                        ? "bg-[#2563eb] text-white" 
                        : "border border-gray-300 hover:border-[#2563eb]"
                    }`}
                    onClick={() => setIsSchoolAssociated(false)}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    No
                  </motion.button>
                </motion.div>

                {isSchoolAssociated && (
                  <motion.div 
                    className="mt-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="school">¿En qué escuela enseñas?</Label>
                    <div className="relative mt-1">
                      <Input
                        id="school"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="Escribe el nombre de tu escuela"
                        className="pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </motion.div>
                )}

                <motion.div className="mt-4" variants={containerVariants}>
                  <Label htmlFor="phone">¿Cuál es tu teléfono?</Label>
                  <div className="flex mt-1">
                    <Select
                      value={selectedDialCode}
                      onValueChange={setSelectedDialCode}
                    >
                      <SelectTrigger className="w-[120px] rounded-r-none border-r-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Buscar país..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          <div className="px-2 py-1 text-sm font-medium text-gray-500">América</div>
                          {countries.america
                            .filter(country => country.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((country) => (
                              <SelectItem key={country.code} value={country.dialCode}>
                                <div className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.name}</span>
                                  <span className="text-gray-500">{country.dialCode}</span>
                                </div>
                              </SelectItem>
                            ))}
                          <div className="px-2 py-1 text-sm font-medium text-gray-500">Europa</div>
                          {countries.europe
                            .filter(country => country.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((country) => (
                              <SelectItem key={country.code} value={country.dialCode}>
                                <div className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.name}</span>
                                  <span className="text-gray-500">{country.dialCode}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-l-none"
                      placeholder="Número de teléfono"
                    />
                  </div>
                </motion.div>

                <motion.div className="space-y-2" variants={containerVariants}>
                  <motion.div className="flex items-start gap-2" variants={itemVariants}>
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-tight">
                      Estoy al tanto y acepto los{" "}
                      <motion.button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-[#2563eb] hover:underline"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        Términos y Condiciones de Uso
                      </motion.button>
                    </Label>
                  </motion.div>

                  <motion.div className="flex items-start gap-2" variants={itemVariants}>
                    <Checkbox
                      id="privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-tight">
                      He leído y comprendido el{" "}
                      <motion.button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-[#2563eb] hover:underline"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        Aviso de Privacidad
                      </motion.button>
                    </Label>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div className="mt-8">
          <motion.button
            onClick={handleNext}
            disabled={isNextDisabled() || isSubmitting}
            className={`w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full py-6 flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {step === 5 ? (
              <>
                <span>{isSubmitting ? 'Procesando...' : 'Iniciar sesión en ProfePlanner'}</span>
              </>
            ) : (
              <>
                <span>{isSubmitting ? 'Procesando...' : 'Siguiente'}</span>
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Right panel - Illustration */}
      <motion.div 
        className="hidden md:block md:w-1/2 bg-[#f8f9fe] p-12 flex items-center justify-center"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="max-w-md mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-5xl font-bold mb-8 text-[#2563eb]"
            variants={itemVariants}
          >
            {step === 1 ? "Tu vida escolar será mucho más fácil." : "Crea clases 10 veces más rápido."}
          </motion.h1>

          <motion.div 
            className="relative h-96"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/images/banner.png"
              width={400}
              height={400}
              alt="Banner ProfePlanner"
              className="w-full h-full object-contain"
              priority
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#2563eb]">Términos y Condiciones de Uso</DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Última actualización: {new Date().toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-gray-700">
                    <section>
                      <h3 className="text-lg font-semibold mb-2">1. Aceptación de los Términos</h3>
                      <p>
                        Al acceder y utilizar ProfePlanner®, usted acepta estar sujeto a estos Términos y Condiciones de Uso.
                        Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">2. Uso del Servicio</h3>
                      <p>
                        ProfePlanner® es una plataforma diseñada para facilitar la planificación y gestión educativa.
                        Usted se compromete a:
                      </p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Proporcionar información veraz y actualizada</li>
                        <li>Utilizar el servicio de manera responsable y ética</li>
                        <li>Respetar los derechos de propiedad intelectual</li>
                        <li>No compartir su cuenta con terceros</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">3. Privacidad y Protección de Datos</h3>
                      <p>
                        Nos comprometemos a proteger su privacidad y datos personales. Nuestra política de privacidad
                        detalla cómo recopilamos, usamos y protegemos su información.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">4. Responsabilidades del Usuario</h3>
                      <p>
                        Usted es responsable de:
                      </p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Mantener la confidencialidad de su cuenta</li>
                        <li>Notificar cualquier uso no autorizado</li>
                        <li>Respetar las leyes y regulaciones aplicables</li>
                        <li>No utilizar el servicio para actividades ilegales</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">5. Modificaciones</h3>
                      <p>
                        Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones
                        entrarán en vigor inmediatamente después de su publicación en la plataforma.
                      </p>
                    </section>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={() => setShowTermsModal(false)}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                    >
                      Cerrar
                    </Button>
                  </div>
                </DialogContent>
              </motion.div>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#2563eb]">Aviso de Privacidad</DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Última actualización: {new Date().toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-gray-700">
                    <section>
                      <h3 className="text-lg font-semibold mb-2">1. Información que Recopilamos</h3>
                      <p>
                        Recopilamos la siguiente información:
                      </p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Información de contacto (nombre, email, teléfono)</li>
                        <li>Información profesional (materias, grados, escuela)</li>
                        <li>Datos de uso de la plataforma</li>
                        <li>Información de la cuenta y preferencias</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">2. Uso de la Información</h3>
                      <p>
                        Utilizamos su información para:
                      </p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Proporcionar y mejorar nuestros servicios</li>
                        <li>Personalizar su experiencia</li>
                        <li>Comunicarnos con usted</li>
                        <li>Cumplir con obligaciones legales</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">3. Protección de Datos</h3>
                      <p>
                        Implementamos medidas de seguridad técnicas y organizativas para proteger su información
                        personal contra accesos no autorizados, alteraciones o destrucción.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">4. Derechos del Usuario</h3>
                      <p>
                        Usted tiene derecho a:
                      </p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Acceder a sus datos personales</li>
                        <li>Rectificar información inexacta</li>
                        <li>Solicitar la eliminación de sus datos</li>
                        <li>Oponerse al procesamiento de sus datos</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">5. Compartir Información</h3>
                      <p>
                        No vendemos ni compartimos su información personal con terceros, excepto cuando sea necesario
                        para proporcionar nuestros servicios o cuando lo requiera la ley.
                      </p>
                    </section>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={() => setShowPrivacyModal(false)}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                    >
                      Cerrar
                    </Button>
                  </div>
                </DialogContent>
              </motion.div>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 