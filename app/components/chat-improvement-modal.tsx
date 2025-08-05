"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, User, Bot, MessageCircle, Send } from 'lucide-react'
import { PricingModal } from "@/components/pricing-modal"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  emailUsuario: string;
  idPeticionOriginal: string;
  mensajes: ChatMessage[];
  timestamp: string;
}

interface ChatImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
  title?: string;
  description?: string;
  suggestions?: string[];
  localStorageKey?: string;
  isSlidesMode?: boolean; // Nuevo prop para modo diapositivas
}

export function ChatImprovementModal({
  isOpen,
  onClose,
  currentContent,
  onContentUpdate,
  title = "Asistente de Mejora",
  description = "Solicita mejoras específicas. El asistente te ayudará a optimizar el contenido.",
  suggestions = [
    "Haz el contenido más claro",
    "Añade más detalles",
    "Cambia el nivel de dificultad",
    "Incluye ejemplos prácticos"
  ],
  localStorageKey = "chatState",
  isSlidesMode = false
}: ChatImprovementModalProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [idPeticionOriginal, setIdPeticionOriginal] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

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

  // Función para iniciar una conversación de chat
  const startChatConversation = async () => {
    console.log('startChatConversation: Iniciando...')
    
    // Evitar llamadas duplicadas
    if (isChatLoading || conversationId) {
      console.log('startChatConversation: Ya está cargando o hay conversación activa, ignorando llamada')
      return
    }
    
    // Verificar que no haya una conversación ya iniciada
    if (chatMessages.length > 0) {
      console.log('startChatConversation: Ya hay mensajes en el chat, ignorando llamada')
      return
    }
    
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("No se encontró el email del usuario")
      return
    }

    // Validar acceso
    const accessData = await validateAccess(email)
    if (!accessData.allowed) {
      setShowPricingModal(true)
      setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
      return
    }

    // Intentar restaurar el estado del chat primero (solo si no estamos ya cargando)
    if (!isChatLoading && !conversationId && restoreChatState()) {
      toast.success("Chat restaurado exitosamente")
      return
    }

    setIsChatLoading(true)
    try {
      if (!currentContent) {
        toast.error("No hay contenido para mejorar")
        return
      }

      console.log('startChatConversation: currentContent:', currentContent)
      setCurrentResponse(currentContent)

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/chat/mejora/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          response: currentContent
        })
      })

      if (!response.ok) {
        throw new Error('Error al iniciar la conversación')
      }

      const conversation: Conversation = await response.json()
      console.log('startChatConversation: Conversación iniciada:', conversation)
      setConversationId(conversation.id)
      setIdPeticionOriginal(conversation.idPeticionOriginal)
      
      // Crear un mensaje de saludo en lugar de usar los mensajes del backend
      const welcomeMessage: ChatMessage = {
        role: 'model',
        content: `¡Hola! Soy tu asistente de mejora. He revisado tu contenido y estoy listo para ayudarte a optimizarlo. 

¿Qué te gustaría mejorar específicamente? Puedes pedirme que:
• Haga el contenido más claro y comprensible
• Añada más detalles o ejemplos
• Cambie el nivel de dificultad
• Incluya más actividades prácticas
• Mejore la estructura o formato
• O cualquier otra mejora que necesites

¡Dime qué quieres mejorar y trabajaremos juntos en ello!`,
        timestamp: new Date().toISOString()
      }
      
      setChatMessages([welcomeMessage])
      
      // Guardar el estado inicial del chat
      const chatState = {
        conversationId: conversation.id,
        messages: [welcomeMessage],
        currentResponse: currentContent
      }
      localStorage.setItem(localStorageKey, JSON.stringify(chatState))
      
      toast.success("Chat iniciado exitosamente")

    } catch (error) {
      console.error('Error al iniciar chat:', error)
      toast.error("Error al iniciar el chat")
    } finally {
      setIsChatLoading(false)
    }
  }

  // Función para enviar mensaje en el chat
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !conversationId) return

    console.log('sendChatMessage: Enviando mensaje:', chatInput)

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    }

    // Actualizar el estado de manera atómica
    const newMessages = [...chatMessages, userMessage]
    setChatMessages(newMessages)
    setChatInput("")
    setIsChatLoading(true)

    try {
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/chat/mejora/continuar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idConversacion: conversationId,
          nuevoMensaje: chatInput,
          idPeticionOriginal: idPeticionOriginal
        })
      })

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje')
      }

      const botResponse: ChatMessage = await response.json()
      console.log('sendChatMessage: Respuesta del bot:', botResponse)
      
      // Crear el nuevo array de mensajes con la respuesta del bot
      const updatedMessages = [...newMessages, botResponse]
      setChatMessages(updatedMessages)
      
      // Guardar el estado del chat en localStorage con los mensajes actualizados
      const chatState = {
        conversationId,
        messages: updatedMessages,
        currentResponse: currentContent // Usar el contenido actual
      }
      localStorage.setItem(localStorageKey, JSON.stringify(chatState))
      
      // Actualizar el contenido con la mejora
      if (botResponse.content) {
        console.log('ChatImprovementModal: Actualizando contenido con:', botResponse.content)
        // Siempre actualizar el contenido, independientemente del modo
        onContentUpdate(botResponse.content)
        
        // Mostrar mensaje de éxito solo en modo normal
        if (!isSlidesMode) {
          toast.success("Mejora aplicada exitosamente")
        }
      }

    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      toast.error("Error al enviar el mensaje")
    } finally {
      setIsChatLoading(false)
    }
  }

  // Función para restaurar el estado del chat
  const restoreChatState = () => {
    const savedChatState = localStorage.getItem(localStorageKey)
    if (savedChatState) {
      try {
        const chatState = JSON.parse(savedChatState)
        
        // Verificar que tenemos todos los datos necesarios
        if (!chatState.conversationId || !chatState.messages) {
          console.log('ChatImprovementModal: Datos incompletos, no restaurando')
          localStorage.removeItem(localStorageKey)
          return false
        }
        
        // Verificar si el contenido actual es diferente al contenido guardado
        // Solo si hay una diferencia significativa, no restaurar
        if (chatState.currentResponse && chatState.currentResponse !== currentContent) {
          console.log('ChatImprovementModal: Contenido cambió significativamente, no restaurando chat anterior')
          localStorage.removeItem(localStorageKey)
          return false
        }
        
        // Solo restaurar si no hay una conversación activa
        if (conversationId) {
          console.log('ChatImprovementModal: Ya hay conversación activa, no restaurando')
          return false
        }
        
        setConversationId(chatState.conversationId)
        setChatMessages(chatState.messages || [])
        setCurrentResponse(chatState.currentResponse || currentContent)
        console.log('ChatImprovementModal: Chat restaurado exitosamente con', chatState.messages.length, 'mensajes')
        return true
      } catch (error) {
        console.error('Error al restaurar el estado del chat:', error)
        localStorage.removeItem(localStorageKey)
      }
    }
    return false
  }

  // Función para limpiar el estado del chat
  const clearChatState = () => {
    console.log('ChatImprovementModal: Limpiando estado del chat')
    localStorage.removeItem(localStorageKey)
    setConversationId(null)
    setChatMessages([])
    setChatInput("")
    setCurrentResponse("")
    // También limpiar la marca de chat en sessionStorage
    sessionStorage.removeItem(`${localStorageKey}FromChat`)
  }



  // Iniciar chat automáticamente cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentContent && !conversationId && !isChatLoading) {
      // Intentar restaurar el estado del chat primero
      const restored = restoreChatState()
      
      if (!restored) {
        // Si no se pudo restaurar, iniciar una nueva conversación
        console.log('ChatImprovementModal: Iniciando nueva conversación')
        startChatConversation()
      }
    }
  }, [isOpen]) // Solo depender de isOpen

  return (
    <>
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal}
        accessMessage={accessMessage}
      />
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          // Solo limpiar si realmente se está cerrando el modal
          console.log('ChatImprovementModal: Cerrando modal')
        }
        onClose()
      }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatState}
                className="text-xs"
              >
                Limpiar Chat
              </Button>
            </div>
          </DialogHeader>
          
          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-500">
                <Bot className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">¡Hola! Soy tu asistente de mejora</p>
                <p className="text-sm mt-2">Puedo ayudarte a mejorar tu contenido. ¿Qué cambios te gustaría hacer?</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Sugerencias:</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>• "{suggestion}"</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                >
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {message.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}>
                    {message.role === 'model' && isSlidesMode ? (
                      <div>
                        <p className="text-sm text-green-600 font-medium">✅ Mejora aplicada exitosamente</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Los cambios han sido procesados y aplicados a tu contenido
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">
                      {isSlidesMode 
                        ? "Procesando mejoras para tus contenido..." 
                        : "El asistente está mejorando tu contenido..."
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={sendChatMessage} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe tu solicitud de mejora aquí..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={isChatLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendChatMessage(e)
                  }
                }}
              />
              <Button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="flex-shrink-0"
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>


        </DialogContent>
      </Dialog>
    </>
  )
} 