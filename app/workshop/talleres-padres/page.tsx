"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
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
interface WorkshopFormData {
  name: string;
  topic: string;
  grade: string;
  customGrade: string;
  isPublic: boolean;
}

interface WorkshopContent {
  objectives: string;
  content: string;
  activities: string;
  materials: string;
  evaluation: string;
}

export default function TalleresPadres() {
  const [loading, setLoading] = useState(false)
  const [workshops, setWorkshops] = useState<string>("")
  const [editedContent, setEditedContent] = useState<WorkshopContent | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [formData, setFormData] = useState<WorkshopFormData>({
    name: "",
    topic: "",
    grade: "",
    customGrade: "",
    isPublic: false
  })
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el taller
  useEffect(() => {
    if (workshops) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('talleresFromChat')
      if (!isFromChat) {
        localStorage.removeItem('talleresChatState')
        console.log('Taller generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('talleresFromChat')
      }
    }
  }, [workshops])

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
    localStorage.removeItem('talleresChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual del taller
    return workshops || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('talleresFromChat', 'true')
      
      // Actualizar el contenido del taller
      setWorkshops(newContent)
      toast.success("Taller actualizado exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el taller.")
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
      const topic = `Genera un plan de taller para padres sobre el tema: ${formData.topic} 
      para el nivel educativo: ${formData.grade === "otro" ? formData.customGrade : formData.grade}. 
      El taller debe incluir:
      - Objetivos claros
      - Actividades prácticas
      - Recursos necesarios
      - Tiempo estimado
      - Estrategias de seguimiento
      - Materiales de apoyo`

      const topicRequest = {
        name: formData.name,
        topic: topic,
        email: emailUser,
        isPublic: formData.isPublic,
        grade: formData.grade,
        theme: formData.topic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/talleres-padres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el taller')
      }

      const data = await response.text()
      setWorkshops(data)
      setEditedContent({
        objectives: "",
        content: data,
        activities: "",
        materials: "",
        evaluation: ""
      })
      setLoadingState('typing')
      toast.success("Taller generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo taller
      localStorage.removeItem('talleresChatState')

      // Agregar puntos por generar un taller para padres
      await gamificationService.addPoints(emailUser, 10, 'parent_workshop_generation')
      showPointsNotification(10, 'generar un taller para padres')

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el taller")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof WorkshopFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    if (!editedContent) return;
    
    const [section, ...rest] = content.split(': ');
    const sectionKey = section.toLowerCase() as keyof WorkshopContent;
    const newContent = rest.join(': ');
    
    setEditedContent({
      ...editedContent,
      [sectionKey]: newContent
    });
  };

  const exportToPDF = async () => {
    if (!editedContent) return;

    try {
      const pdf = initializePDF('Taller para Padres', 'Generador de Talleres para Padres');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Taller: ${formData.topic}`, `Nivel: ${formData.grade}`);
      
      let y = MARGINS.top + 30;
      
      // Agregar secciones
  
      y = addSection(pdf, 'Contenido', editedContent.content, y);
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Taller_Padres_${formData.topic.replace(/\s+/g, '_')}.pdf`);
      toast.success("Taller exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el taller");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay taller para exportar');
      return;
    }

    try {
      // Convertir el contenido del taller a texto
      const content = Object.entries(editedContent)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n\n');

      await exportToWord(
        content,
        `Taller para Padres: ${formData.topic}`,
        `taller-padres-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareWorkshop = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Taller para Padres - ${formData.topic}`,
          text: editedContent?.content || "",
        });
      } else {
        await navigator.clipboard.writeText(editedContent?.content || "");
        toast.success("Taller copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el taller");
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
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h1 className="text-xl font-semibold">Talleres para Padres</h1>
              </motion.div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Talleres de Padres</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Talleres:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas relevantes para los padres</li>
                            <li>Incluye actividades prácticas y participativas</li>
                            <li>Proporciona recursos y materiales de apoyo</li>
                            <li>Adapta el contenido según el nivel educativo</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Apoyo en tareas escolares</li>
                            <li>Desarrollo de hábitos de estudio</li>
                            <li>Uso responsable de la tecnología</li>
                            <li>Comunicación efectiva con los hijos</li>
                            <li>Manejo de emociones en la adolescencia</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para el Contenido:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Incluye objetivos claros y alcanzables</li>
                            <li>Agrega ejemplos prácticos y cotidianos</li>
                            <li>Proporciona recursos adicionales</li>
                            <li>Considera el tiempo disponible</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
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
                onClick={shareWorkshop}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {workshops && (
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
            {workshops ? (
              <TypingEffect 
                content={workshops}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando taller..."
                typingMessage="Escribiendo taller..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay taller generado</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar un taller para padres.
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
            <h2 className="text-xl font-semibold mb-6">Talleres para Padres</h2>
            
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
                <div>
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
                    placeholder="Ej: Taller de Apoyo en Tareas Escolares"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema del taller *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema principal del taller. Incluye conceptos clave y contexto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Apoyo en tareas escolares: Estrategias para ayudar a los hijos con sus deberes"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course">Nivel educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar el contenido del taller.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => handleInputChange("grade", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="otro">Otro (especificar)</SelectItem>
                    <SelectItem value="infantil">Educación Infantil</SelectItem>
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
                    </SelectContent>
                  </Select>
                  {formData.grade === "otro" && (
                    <div className="mt-2">
                      <Input
                        id="customGrade"
                        value={formData.customGrade}
                        onChange={(e) => handleInputChange("customGrade", e.target.value)}
                        placeholder="Escribe el nivel educativo"
                        required
                      />
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="isPublic">Quiero compartir esto con la comunidad educativa</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Al marcar esta opción, tu taller será visible para otros educadores en la comunidad.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando taller..."
                  disabled={loading || !formData.topic || !formData.grade || !formData.name}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Taller
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('talleresChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Talleres para Padres"
        description="Solicita mejoras específicas para tu taller. El asistente te ayudará a optimizar el contenido, actividades y estructura del taller para padres."
        suggestions={[
          "Mejora las actividades prácticas",
          "Añade más recursos y materiales",
          "Simplifica el lenguaje para padres",
          "Incluye más ejemplos cotidianos",
          "Mejora la estructura del taller",
          "Añade estrategias de seguimiento"
        ]}
        localStorageKey="talleresChatState"
        isSlidesMode={false}
      />

      <Toaster />
    </Layout>
    </>
  )
} 