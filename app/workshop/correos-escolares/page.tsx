"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, Mail, Loader2, HelpCircle, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils';
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
import { exportToWord } from '@/utils/word-export'
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface EmailFormData {
  name: string;
  purpose: string;
  recipient: string;
  additionalContext: string;
  isPublic: boolean;
}

interface EmailContent {
  subject: string;
  body: string;
  signature: string;
}

export default function EmailGenerator() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string>("")
  const [editedContent, setEditedContent] = useState<EmailContent | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<EmailFormData>({
    name: "",
    purpose: "",
    recipient: "",
    additionalContext: "",
    isPublic: false
  })

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el correo
  useEffect(() => {
    if (email) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('correosFromChat')
      if (!isFromChat) {
        localStorage.removeItem('correosChatState')
        console.log('Correo generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('correosFromChat')
      }
    }
  }, [email])

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

  const openChatModal = () => {
    // Limpiar el estado del chat antes de abrir el modal para asegurar un inicio limpio
    localStorage.removeItem('correosChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual del correo
    return email || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('correosFromChat', 'true')
      
      // Actualizar el contenido del correo
      setEmail(newContent)
      setEditedContent({
        subject: "",
        body: newContent,
        signature: ""
      })
      toast.success("Correo actualizado exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el correo.")
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')

    try {
      const emailUser = localStorage.getItem('email')
      if (!emailUser) {
        toast.error("Por favor, inicia sesión para continuar")
        setLoading(false)
        setLoadingState('idle')
        return
      }


   // Validar acceso
   const accessData = await validateAccess(emailUser)
  
       
 if (!accessData.allowed) {
  setLoading(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}


      const topic = `Escribe un correo electrónico profesional para: ${formData.purpose}. 
      El destinatario es: ${formData.recipient}.
      Contexto adicional: ${formData.additionalContext || 'No se proporcionó contexto adicional'}
      El correo debe ser profesional, claro y conciso, utilizando un lenguaje apropiado para comunicación escolar.`
      
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/correos-escolares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic,
          email: emailUser,
          name: formData.name,
          isPublic: formData.isPublic,
          theme: formData.name
        })
      })

      if (!response.ok) {
        throw new Error('Error al generar el correo')
      }

      const data = await response.text()
      setEmail(data)
      setEditedContent({
        subject: "",
        body: data,
        signature: ""
      })
      setLoadingState('typing')
      toast.success("Correo generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo correo
      localStorage.removeItem('correosChatState')

      // Agregar puntos por generar correo escolar
      await gamificationService.addPoints(emailUser, 5, 'school_email_generation')
      showPointsNotification(5, 'generar un correo escolar')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el correo")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EmailFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    if (!editedContent) {
      setEditedContent({
        subject: "",
        body: content,
        signature: ""
      });
      return;
    }
    
    const [section, ...rest] = content.split(': ');
    const sectionKey = section.toLowerCase() as keyof EmailContent;
    const newContent = rest.join(': ');
    
    setEditedContent({
      ...editedContent,
      [sectionKey]: newContent
    });
  }

  const exportToPDF = async () => {
    if (!editedContent) return;

    try {
      const pdf = initializePDF('Correo Escolar', 'Generador de Correos Escolares');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Correo: ${formData.purpose}`, `Destinatario: ${formData.recipient}`);
      
      let y = MARGINS.top + 30;
      
      // Agregar secciones
      y = addSection(pdf, 'Asunto', editedContent.subject, y);
      y = addSection(pdf, 'Contenido', editedContent.body, y);
      y = addSection(pdf, 'Firma', editedContent.signature, y);
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Correo_Escolar_${formData.purpose.replace(/\s+/g, '_')}.pdf`);
      toast.success("Correo exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el correo");
    }
  }

  const shareEmail = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Correo: ${formData.purpose}`,
          text: editedContent?.body || '',
        });
      } else {
        await navigator.clipboard.writeText(editedContent?.body || '');
        toast.success("Correo copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el correo");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay correo para exportar');
      return;
    }

    try {
      const content = `
Asunto: ${formData.purpose}
Destinatario: ${formData.recipient}
Fecha: ${new Date().toLocaleDateString()}

${editedContent.body}
`;

      await exportToWord(
        content,
        `Correo Escolar: ${formData.purpose}`,
        `correo-${formData.purpose.toLowerCase().replace(/\s+/g, '-')}`
      );
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
        className="flex h-screen"
      >
        {/* Panel izquierdo - Editor y Previsualizador */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 overflow-y-auto p-6 border-r"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-between items-center mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <h1 className="text-xl font-semibold">Correos Escolares</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Redacción de Correos Escolares</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Estructura del Correo:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Saludo profesional y apropiado</li>
                            <li>Introducción clara del propósito</li>
                            <li>Desarrollo del mensaje principal</li>
                            <li>Conclusión con llamada a la acción</li>
                            <li>Despedida formal</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips de Redacción:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Usa un tono profesional pero cercano</li>
                            <li>Sé claro y conciso en el mensaje</li>
                            <li>Incluye toda la información relevante</li>
                            <li>Revisa la ortografía y gramática</li>
                            <li>Considera el contexto cultural</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tipos Comunes de Correos:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Comunicación con padres</li>
                            <li>Coordinación con colegas</li>
                            <li>Información administrativa</li>
                            <li>Solicitudes y permisos</li>
                            <li>Actualizaciones académicas</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-2"
            >
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!editedContent}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!editedContent}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar a Word
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareEmail}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {email && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  onClick={openChatModal}
                >
                  <MessageCircle className="w-4 h-4" />
                  Mejorar con IA
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Editor toolbar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="border-b pb-3 mb-6 flex items-center gap-2"
          >
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option>Párrafo</option>
              <option>Encabezado 1</option>
              <option>Encabezado 2</option>
              <option>Encabezado 3</option>
            </select>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <List className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <ListOrdered className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <AlignLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden ml-auto">
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Undo className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Typing Effect Content Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="relative" 
            ref={previewRef}
          >
            {email ? (
              <TypingEffect 
                content={email}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando correo electrónico..."
                typingMessage="Escribiendo correo..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <Mail className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay correo generado</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar un correo profesional.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Panel derecho - Formulario */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-[400px] p-6 overflow-y-auto bg-gray-50"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Generador de Correos</h2>
            
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Recurso *</Label>
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
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Correo para reunión de padres de 5°A"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="purpose">Propósito del correo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el objetivo principal del correo electrónico.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    placeholder="Ej: Solicitar reunión con padres para discutir el progreso académico del estudiante"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="recipient">Destinatario *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Especifica a quién va dirigido el correo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="recipient"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange("recipient", e.target.value)}
                    placeholder="Ej: Padres de familia del grado 5°A"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="additionalContext">Contexto adicional</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Agrega información adicional relevante para el correo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="additionalContext"
                    value={formData.additionalContext}
                    onChange={(e) => handleInputChange("additionalContext", e.target.value)}
                    placeholder="Ej: Para discutir el rendimiento académico y las estrategias de mejora"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isPublic" className="text-sm text-gray-700">
                    Compartir con la comunidad de profesores
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Al marcar esta opción, tu correo escolar será visible para otros profesores en la comunidad.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando correo..."
                  disabled={loading || !formData.purpose || !formData.recipient}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Correo
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>

        {/* Chat Improvement Modal */}
        <ChatImprovementModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false)
            // Limpiar el estado del chat cuando se cierra el modal
            localStorage.removeItem('correosChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Correos Escolares"
          description="Solicita mejoras específicas para tu correo escolar. El asistente te ayudará a optimizar el tono, claridad y profesionalismo del mensaje."
          suggestions={[
            "Mejora el tono profesional",
            "Añade más detalles específicos",
            "Incluye una llamada a la acción clara",
            "Mejora la estructura del correo",
            "Añade información de contacto",
            "Incluye un saludo más personalizado"
          ]}
          localStorageKey="correosChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 