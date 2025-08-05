import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, User, Bot, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { PricingModal } from "@/components/pricing-modal"
interface Message {
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  changes?: string[]
}

interface PlanningAssistantChatProps {
  unitId: string
  isOpen: boolean
  onClose: () => void
  onUpdateUnit: (updatedUnit: any) => void
}


export function PlanningAssistantChat({ unitId, isOpen, onClose, onUpdateUnit }: PlanningAssistantChatProps) {
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isLoading) {
      // Reset progress when loading starts
      setProgress(0)
      
      // Start progress bar animation
      progressInterval.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            return 100
          }
          return prevProgress + 1
        })
      }, 300) // Update every 300ms to reach 100% in 30 seconds
    } else {
      // Clear interval when loading stops
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
      setProgress(0)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('Por favor, ingresa un comentario')
      return
    }

    // Agregar mensaje del usuario al historial
    const userMessage: Message = {
      type: 'user',
      content: comment,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setComment('')

    setIsLoading(true)
    let email=localStorage.getItem("email")
    if (!email) {
      toast.error("No se encontró el email del usuario")
      return
    }
 // Validar acceso
 const accessData = await validateAccess(email)

     
if (!accessData.allowed) {

// Mostrar el modal con el mensaje de acceso
setShowPricingModal(true)
setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')

onClose()
return // Detener el flujo
}

    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/update-unit/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comentario: comment }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar el comentario')
      }

      const data = await response.json()
      
      // Simular cambios realizados basados en el comentario del usuario
      const changes = [
        "Se han agregado más actividades prácticas en cada lección",
        "Se han ajustado los recursos necesarios para las nuevas actividades",
        "Se han actualizado los logros de aprendizaje para incluir las nuevas actividades"
      ]
      
      // Agregar respuesta del asistente al historial
      const assistantMessage: Message = {
        type: 'assistant',
        content: '¡He actualizado tu planeación con los cambios solicitados!',
        timestamp: new Date(),
        changes: changes
      }
      setMessages(prev => [...prev, assistantMessage])
      
      onUpdateUnit(data)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar el comentario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-lg font-semibold">Asistente de Mejora de Planeación</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            ¿Qué cambios te gustaría hacer a tu planeación? El asistente te ayudará a mejorar tu plan de clases.
          </DialogDescription>
        </DialogHeader>
        
        {/* Área de chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-500">
              <Bot className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">¡Hola! Soy tu asistente de planeación</p>
              <p className="text-sm mt-2">Puedo ayudarte a mejorar tu planeación de clases. ¿Qué cambios te gustaría hacer?</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.changes && (
                      <div className="mt-3 space-y-2">
                        {message.changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{change}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">El asistente está pensando...</span>
                    </div>
                    <Progress value={progress} className="w-full h-1" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulario de entrada */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="space-y-2">
            <Textarea
              placeholder="Escribe tu mensaje aquí..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cerrar
            </Button>
            <Button type="submit" disabled={isLoading || !comment.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 