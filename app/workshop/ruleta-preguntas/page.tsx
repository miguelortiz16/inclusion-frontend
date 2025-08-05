"use client"

import { useState, Suspense } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast, Toaster } from "sonner"
import { LightbulbIcon, HelpCircle } from "lucide-react"
import dynamic from 'next/dynamic'
import { SearchBar } from "@/components/search-bar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), {
  ssr: false,
  loading: () => <div className="w-[500px] h-[500px] flex items-center justify-center">Cargando ruleta...</div>
})

interface Question {
  id: string
  question: string
  answer: string
}

interface WheelData {
  questions: Question[]
}

interface WheelOption {
  option: string
  style: { backgroundColor: string; textColor: string }
}

function RuletaPreguntasContent() {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [removedQuestions, setRemovedQuestions] = useState<Question[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [name, setName] = useState("")
  const [topic, setTopic] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [mustSpin, setMustSpin] = useState(false)
  const [prizeNumber, setPrizeNumber] = useState(0)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const { showPointsNotification } = usePoints()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const maxRetries = 3;
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
      try {
        const email = localStorage.getItem("email")
        if (!email) {
          toast.error("Por favor, inicia sesión para continuar")
          return
        }
     // Validar acceso
     const accessData = await validateAccess(email)
    
         
   if (!accessData.allowed) {
    setLoading(false)
    // Mostrar el modal con el mensaje de acceso
    setShowPricingModal(true)
    setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
    return // Detener el flujo
  }
  
        const response = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/education/ruleta-preguntas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            topic,
            email: email,
            isPublic: isPublic,
          }),
        })

        if (!response.ok) {
          throw new Error(`Error al generar la ruleta de preguntas: ${response.status}`)
        }

        const responseData = await response.json()
        
        if (!responseData.data || !responseData.data.prizes || !Array.isArray(responseData.data.prizes)) {
          throw new Error("Formato de respuesta inválido")
        }

        const newQuestions = responseData.data.prizes.map((prize: any, index: number) => ({
          id: `prize-${index}`,
          question: prize.question,
          answer: prize.answers[0]
        })).slice(0, 8)

        setQuestions(newQuestions)
        setPrizeNumber(0)
        setMustSpin(false)
        setSelectedQuestion(null)
        
        toast.success("Ruleta de preguntas generada exitosamente")

       
        // Mostrar modal automáticamente en móvil
        if (window.innerWidth < 1024) {
          setShowPreviewModal(true)
        }

        break; // Si todo sale bien, salimos del bucle

      } catch (error) {
        currentRetry++;
        if (currentRetry === maxRetries) {
          console.error("Error:", error)
          toast.error(error instanceof Error ? error.message : "Error al generar la ruleta de preguntas")
        } else {
          // Esperamos con backoff exponencial antes de reintentar
          const delay = 1000 * currentRetry; // 1s, 2s, 3s
          console.log(`Reintentando... (${currentRetry}/${maxRetries}) después de ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          toast.info(`Reintentando... (${currentRetry}/${maxRetries})`)
        }
      }
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
     // Agregar puntos por generar una ruleta de preguntas
     await gamificationService.addPoints(email, 5, 'question_wheel_generation')
     showPointsNotification(5, 'generar una ruleta de preguntas')


    setLoading(false)
  }

  const handleSpin = () => {
    if (!questions.length) return
    
    const newPrizeNumber = Math.floor(Math.random() * questions.length)
    setPrizeNumber(newPrizeNumber)
    setMustSpin(true)
    setSelectedQuestion(null)
  }

  const handleSpinEnd = () => {
    if (!questions.length) return
    
    const selected = questions[prizeNumber]
    setSelectedQuestion(selected)
    setMustSpin(false)
    setShowAnswer(false)
    toast.success("¡Pregunta seleccionada!")
  }

  const handleRemoveQuestion = () => {
    if (!selectedQuestion) return
    
    setRemovedQuestions(prev => [...prev, selectedQuestion])
    setQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id))
    setSelectedQuestion(null)
    toast.success("Pregunta eliminada de la ruleta")
  }

  const handleRestoreQuestions = () => {
    if (removedQuestions.length === 0) return
    
    setQuestions(prev => [...prev, ...removedQuestions])
    setRemovedQuestions([])
    toast.success("Preguntas restauradas")
  }

  const getWheelOptions = () => {
    const colors = [
      { bg: '#FF6B6B', text: '#ffffff' }, // Rojo coral
      { bg: '#4ECDC4', text: '#ffffff' }, // Turquesa
      { bg: '#FFD93D', text: '#000000' }, // Amarillo brillante
      { bg: '#6C5CE7', text: '#ffffff' }, // Púrpura
      { bg: '#A8E6CF', text: '#000000' }, // Menta
      { bg: '#FF8B94', text: '#ffffff' }, // Rosa
      { bg: '#98ACFF', text: '#000000' }, // Azul claro
      { bg: '#FDCB6E', text: '#000000' }, // Naranja pastel
    ]
    
    return questions.map((q, index) => ({
      option: q.question.length > 20 ? q.question.substring(0, 20) + '...' : q.question,
      style: {
        backgroundColor: colors[index % colors.length].bg,
        textColor: colors[index % colors.length].text
      }
    }))
  }

  return (
    <>
    <PricingModal 
    open={showPricingModal} 
    onOpenChange={setShowPricingModal}
    accessMessage={accessMessage}
  />

    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row h-full"
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden lg:block flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <LightbulbIcon className="w-8 h-8 text-blue-500" />
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                  ¡Ruleta de Preguntas!
                </h1>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para la Ruleta de Preguntas</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Preguntas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas específicos y relevantes</li>
                            <li>Incluye preguntas de diferentes niveles de dificultad</li>
                            <li>Usa preguntas claras y concisas</li>
                            <li>Adapta la complejidad según el nivel educativo</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>El Sistema Solar</li>
                            <li>La Fotosíntesis</li>
                            <li>La Revolución Industrial</li>
                            <li>Los Ecosistemas</li>
                            <li>Las Fracciones</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para las Preguntas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Incluye preguntas de opción múltiple</li>
                            <li>Agrega preguntas de desarrollo</li>
                            <li>Usa ejemplos prácticos</li>
                            <li>Considera el contexto educativo</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </motion.div>

            {questions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex flex-col items-center gap-8"
              >
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: mustSpin ? 360 : 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="relative w-[400px] h-[400px] bg-white rounded-2xl shadow-lg border-4 border-blue-200 flex items-center justify-center"
                >
                  <div className="w-[350px] h-[350px] flex items-center justify-center cursor-pointer" onClick={handleSpin}>
                    <Wheel
                      mustStartSpinning={mustSpin}
                      prizeNumber={prizeNumber}
                      data={getWheelOptions()}
                      onStopSpinning={handleSpinEnd}
                      outerBorderColor="#FF6B6B"
                      outerBorderWidth={5}
                      innerRadius={30}
                      innerBorderColor="#FFD93D"
                      innerBorderWidth={3}
                      radiusLineColor="#ffffff"
                      radiusLineWidth={2}
                      spinDuration={1}
                      perpendicularText={false}
                      textDistance={55}
                      fontSize={10}
                      backgroundColors={['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF', '#FF8B94', '#98ACFF', '#FDCB6E']}
                      textColors={['#ffffff', '#ffffff', '#000000', '#ffffff', '#000000', '#ffffff', '#000000', '#000000']}
                      diameter={300}
                    />
                  </div>
                </motion.div>

                {selectedQuestion && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-white p-8 rounded-2xl shadow-lg w-full border-4 border-blue-200"
                  >
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">¡Pregunta Seleccionada!</h2>
                    <p className="text-lg mb-6 text-gray-700">{selectedQuestion.question}</p>
                    <div className="space-y-4">
                      <Button
                        type="button"
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transform transition-all duration-200 hover:scale-105"
                        onClick={() => setShowAnswer(!showAnswer)}
                      >
                        {showAnswer ? "🙈 Ocultar Respuesta" : "🎯 Mostrar Respuesta"}
                      </Button>
                      {showAnswer && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                          className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200"
                        >
                          <p className="text-lg font-medium text-blue-700">{selectedQuestion.answer}</p>
                        </motion.div>
                      )}
                      <Button
                        type="button"
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl transform transition-all duration-200 hover:scale-105"
                        onClick={handleRemoveQuestion}
                      >
                        🗑️ Eliminar Pregunta
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {removedQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-4"
              >
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transform transition-all duration-200 hover:scale-105"
                  onClick={handleRestoreQuestions}
                >
                  🔄 Restaurar Preguntas Eliminadas ({removedQuestions.length})
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-96 border-t lg:border-l lg:border-t-0 p-4 sm:p-6 lg:p-8 bg-white"
        >
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="name" className="text-lg font-bold text-blue-700">Nombre del Recurso *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Asigna un nombre descriptivo a este recurso para identificarlo fácilmente.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ruleta de Preguntas sobre la Fotosíntesis"
                className="mt-2 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring-blue-400"
                required
                maxLength={100}
              />
              <div className="text-xs text-right mt-1 text-gray-500">{name.length}/100</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="topic" className="text-lg font-bold text-blue-700">Tema de las Preguntas</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Describe el tema principal para generar preguntas relevantes. Incluye conceptos clave y contexto.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`Ej: "La Fotosíntesis: Proceso por el cual las plantas convierten la luz solar en energía. Incluye conceptos como clorofila, dióxido de carbono, oxígeno y glucosa."`}
                className="mt-2 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring-blue-400"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isPublic">Quiero compartir esto con la comunidad educativa</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Al marcar esta opción, tu ruleta de preguntas será visible para otros educadores en la comunidad.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl"
                disabled={loading || !name || !topic}
              >
                {loading ? "Generando..." : "✨ Crear Ruleta Mágica"}
              </Button>
            </motion.div>

            {questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-xl"
                  onClick={handleSpin}
                  disabled={mustSpin}
                >
                  {mustSpin ? "🌀 Girando..." : "🎡 ¡Girar Ruleta!"}
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-xl transform transition-all duration-200 hover:scale-105"
                onClick={() => {
                  setName("")
                  setTopic("")
                  setQuestions([])
                }}
              >
                🧹 Limpiar
              </Button>
            </motion.div>

            {questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="space-y-4"
              >
                {/* Botón para ver previsualización en móvil */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full lg:hidden"
                  onClick={() => setShowPreviewModal(true)}
                >
                  Ver Ruleta
                </Button>
              </motion.div>
            )}
          </motion.form>
        </motion.div>

        {/* Modal de previsualización para móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
              <DialogTitle>Ruleta de Preguntas</DialogTitle>
            </DialogHeader>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
              {questions.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex flex-col items-center gap-4 sm:gap-6"
                >
                  <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: mustSpin ? 360 : 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="relative w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-white rounded-2xl shadow-lg border-4 border-blue-200 flex items-center justify-center"
                  >
                    <div className="w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] flex items-center justify-center cursor-pointer" onClick={handleSpin}>
                      <Wheel
                        mustStartSpinning={mustSpin}
                        prizeNumber={prizeNumber}
                        data={getWheelOptions()}
                        onStopSpinning={handleSpinEnd}
                        outerBorderColor="#FF6B6B"
                        outerBorderWidth={5}
                        innerRadius={30}
                        innerBorderColor="#FFD93D"
                        innerBorderWidth={3}
                        radiusLineColor="#ffffff"
                        radiusLineWidth={2}
                        spinDuration={1}
                        perpendicularText={false}
                        textDistance={55}
                        fontSize={10}
                        backgroundColors={['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF', '#FF8B94', '#98ACFF', '#FDCB6E']}
                        textColors={['#ffffff', '#ffffff', '#000000', '#ffffff', '#000000', '#ffffff', '#000000', '#000000']}
                        diameter={250}
                      />
                    </div>
                  </motion.div>

                  {selectedQuestion && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full border-4 border-blue-200"
                    >
                      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-600">¡Pregunta Seleccionada!</h2>
                      <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700">{selectedQuestion.question}</p>
                      <div className="space-y-4">
                        <Button
                          type="button"
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 sm:py-3 rounded-xl transform transition-all duration-200 hover:scale-105"
                          onClick={() => setShowAnswer(!showAnswer)}
                        >
                          {showAnswer ? "🙈 Ocultar Respuesta" : "🎯 Mostrar Respuesta"}
                        </Button>
                        {showAnswer && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3 }}
                            className="bg-blue-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200"
                          >
                            <p className="text-base sm:text-lg font-medium text-blue-700">{selectedQuestion.answer}</p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-2 sm:py-3 rounded-xl"
                    onClick={handleSpin}
                    disabled={mustSpin}
                  >
                    {mustSpin ? "🌀 Girando..." : "🎡 ¡Girar Ruleta!"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="border border-dashed rounded-lg p-8 sm:p-16 flex flex-col items-center justify-center text-gray-500"
                >
                  <LightbulbIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay ruleta generada</p>
                  <p className="text-center text-sm">
                    Configura el tema en el panel derecho y genera una ruleta de preguntas automáticamente.
                  </p>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
}

export default function RuletaPreguntas() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RuletaPreguntasContent />
    </Suspense>
  )
} 