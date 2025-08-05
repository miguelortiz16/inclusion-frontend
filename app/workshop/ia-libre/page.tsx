"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { Send, BrainCircuit, Loader2, User, Bot, Mic, FileText, FileDown } from "lucide-react"
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PDFExporter } from '@/components/pdf-exporter'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { PricingModal } from "@/components/pricing-modal"
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ChatMessage {
  id: string;
  sender: "profesor" | "IA";
  message: string;
  email: string;
  timestamp: string;
}

export default function FreeAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
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
    // Load chat history when component mounts
    const loadChatHistory = async () => {
      const email = localStorage.getItem('email')

      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/chat/history?email=${email}`)
        if (!response.ok) {
          throw new Error('Error al cargar el historial')
        }
        const history = await response.json()
        setMessages(history)
      } catch (error) {
        console.error('Error:', error)
        toast.error("Error al cargar el historial de chat")
      }
    }

    loadChatHistory()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'es-ES'

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInputMessage(transcript)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event) => {
          console.error('Error en el reconocimiento de voz:', event.error)
          setIsListening(false)
          toast.error('Error en el reconocimiento de voz')
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('El reconocimiento de voz no está disponible en tu navegador')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }

 // Validar acceso
 const accessData = await validateAccess(email)

     
if (!accessData.allowed) {
  
// Mostrar el modal con el mensaje de acceso
setShowPricingModal(true)
setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
return // Detener el flujo
}
    // Crear el mensaje del profesor
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "profesor",
      message: inputMessage,
      email: email,
      timestamp: new Date().toISOString()
    }

    // Agregar el mensaje del profesor inmediatamente
    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userMessage)
      })

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje')
      }

      const updatedMessages = await response.json()
      setMessages(updatedMessages)
      toast.success("Mensaje enviado exitosamente")

      // Agregar puntos por usar IA Libre
      await gamificationService.addPoints(email, 5, 'free_ai_usage')
      showPointsNotification(5, 'usar IA Libre')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al enviar el mensaje")
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = async (jsPDF: any, message: string) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Configuración de márgenes
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 20;
      const marginBottom = 20;
      const pageWidth = 210; // Ancho A4 en mm
      const pageHeight = 297; // Alto A4 en mm
      const contentWidth = pageWidth - marginLeft - marginRight;
      const maxHeight = pageHeight - marginTop - marginBottom;

      // Configuración inicial
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Respuesta de IA', marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido del mensaje
      let yPos = marginTop + 25;
      
      // Dividir el mensaje en líneas y procesar cada línea
      const lines = message.split('\n');
      
      for (const line of lines) {
        // Dividir el texto en líneas que quepan en el ancho de la página
        const splitText = pdf.splitTextToSize(line, contentWidth);
        
        // Verificar si hay espacio suficiente para todo el texto
        const textHeight = splitText.length * 6; // 6mm por línea
        if (yPos + textHeight > maxHeight) {
          pdf.addPage();
          yPos = marginTop;
        }

        // Agregar el texto
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(splitText, marginLeft, yPos);
        yPos += textHeight + 3; // 3mm de espacio entre líneas
      }

      // Metadatos
      pdf.setProperties({
        title: 'Respuesta de IA',
        subject: 'Chat con Asistente Virtual',
        author: 'IA Libre para Profesores',
      });

      // Guardar el PDF
      pdf.save('respuesta-ia.pdf');
      toast.success("Respuesta exportada exitosamente");
      
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar la respuesta");
      throw error;
    }
  };

  const handleExportWord = async (message: string) => {
    try {
      const title = 'Respuesta de IA';
      const filename = 'respuesta-ia';
      
      // Limpiar el contenido de HTML pero mantener el formato básico
      const cleanContent = message
        .replace(/<[^>]*>/g, '') // Remover etiquetas HTML
        .replace(/&nbsp;/g, ' ') // Convertir &nbsp; a espacios
        .replace(/&lt;/g, '<')   // Convertir &lt; a <
        .replace(/&gt;/g, '>')   // Convertir &gt; a >
        .replace(/&amp;/g, '&')  // Convertir &amp; a &
        .trim(); // Eliminar espacios al inicio y final del texto

      // Dividir el contenido en párrafos y crear elementos de Word
      const paragraphs = cleanContent.split('\n').map(line => {
        // Si la línea está vacía, crear un párrafo con espacio
        if (line.trim() === '') {
          return new Paragraph({
            children: [new TextRun({ text: ' ' })],
            spacing: {
              after: 200,
            },
          });
        }

        // Si la línea comienza con #, es un encabezado
        if (line.startsWith('# ')) {
          return new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: 400,
              after: 200,
            },
          });
        }

        if (line.startsWith('## ')) {
          return new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 300,
              after: 200,
            },
          });
        }

        if (line.startsWith('### ')) {
          return new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: {
              before: 200,
              after: 200,
            },
          });
        }

        // Si la línea comienza con * o -, es una lista
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return new Paragraph({
            children: [
              new TextRun({ text: '• ' }),
              new TextRun({ text: line.trim().substring(2) }),
            ],
            spacing: {
              before: 100,
              after: 100,
            },
            indent: {
              left: 720, // 0.5 inches
            },
          });
        }

        // Si la línea comienza con un número, es una lista numerada
        if (line.trim().match(/^\d+\./)) {
          return new Paragraph({
            text: line.trim(),
            spacing: {
              before: 100,
              after: 100,
            },
            indent: {
              left: 720, // 0.5 inches
            },
          });
        }

        // Párrafo normal
        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
            }),
          ],
          spacing: {
            line: 360, // 1.5 line spacing
            before: 100,
            after: 100,
          },
        });
      });

      // Crear el documento con formato
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            }),
            ...paragraphs,
            new Paragraph({
              text: "Generado por IA Libre para Profesores",
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 400,
              },
            }),
          ],
        }],
      });

      // Exportar el documento
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

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
        className="flex flex-col h-[calc(100vh-4rem)] sm:h-screen bg-gradient-to-b from-gray-50 to-white"
      >
        {/* Chat Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm p-3 sm:p-4 sticky top-0 z-10"
        >
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-semibold text-gray-800">IA Libre para Profesores</h1>
              <p className="text-xs text-gray-500">Asistente virtual para docentes</p>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-3xl mx-auto w-full"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center text-gray-600 px-4">
              <div className="bg-blue-500/10 p-4 rounded-full mb-4">
                <BrainCircuit className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              </div>
              <p className="text-base sm:text-lg font-semibold mb-2">¡Hola! Soy tu asistente de IA</p>
              <p className="text-sm sm:text-base max-w-md leading-relaxed">
                Estoy aquí para ayudarte con tus dudas sobre educación. ¿En qué puedo ayudarte hoy?
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'profesor' ? 'justify-end' : 'justify-start'} gap-2 sm:gap-3 w-full`}
              >
                {message.sender === 'IA' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                )}
                <div
                  className={`w-full max-w-[85%] sm:max-w-[85%] p-2 sm:p-3 rounded-2xl ${
                    message.sender === 'profesor'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
                  {message.sender === 'IA' && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <PDFExporter 
                        generatePDF={(jsPDF) => generatePDF(jsPDF, message.message)}
                        disabled={false}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-600 hover:text-blue-600"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      </PDFExporter>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-600 hover:text-blue-600"
                        onClick={() => handleExportWord(message.message)}
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        Word
                      </Button>
                    </div>
                  )}
                </div>
                {message.sender === 'profesor' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">La IA está pensando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </motion.div>

        {/* Input Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-sm p-3 sm:p-4 sticky bottom-0 z-10"
        >
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              placeholder="Escribe tu mensaje aquí..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[45px] sm:min-h-[60px] resize-none text-base sm:text-lg rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button 
                type="button"
                size="icon" 
                className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-sm ${
                  isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                onClick={toggleListening}
                disabled={isLoading}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                disabled={isLoading || !inputMessage.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </div>
        </motion.form>
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
}

