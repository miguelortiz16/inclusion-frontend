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
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import { exportToWord } from '@/utils/word-export'
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
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
import { motion } from "framer-motion"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface TrainingFormData {
  topic: string;
  level: string;
  objectives: string;
  content: string;
  methodology: string;
  resources: string;
  evaluation: string;
  name: string;
  isPublic: boolean;
}

export default function CapacitacionDocentes() {
  const [loading, setLoading] = useState(false)
  const [training, setTraining] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<TrainingFormData>({
    topic: "",
    level: "",
    objectives: "",
    content: "",
    methodology: "",
    resources: "",
    evaluation: "",
    name: "",
    isPublic: false
  })
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia la capacitación
  useEffect(() => {
    if (training) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('capacitacionFromChat')
      if (!isFromChat) {
        localStorage.removeItem('capacitacionChatState')
        console.log('Capacitación generada desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('capacitacionFromChat')
      }
    }
  }, [training])

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
    localStorage.removeItem('capacitacionChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual de la capacitación
    return training || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('capacitacionFromChat', 'true')
      
      // Actualizar el contenido de la capacitación
      setTraining(newContent)
      setEditedContent(newContent)
      toast.success("Capacitación actualizada exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar la capacitación.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const email = localStorage.getItem('email')
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
      const trainingRequest = {
        topic: "Tema: "+formData.topic+"\n"+"grado educativo: "+formData.level,
        name: formData.name,
        email: email,
        isPublic: formData.isPublic,
        theme: formData.topic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/capacitacion-docentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar la capacitación')
      }

      const data = await response.text()
      setTraining(data)
      setEditedContent(data)
      toast.success("Capacitación generada exitosamente")
      
      // Limpiar el estado del chat cuando se genera una nueva capacitación
      localStorage.removeItem('capacitacionChatState')

      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar la capacitación")
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      setLoading(false)
      return
    }
          // Agregar puntos por generar una capacitación
          await gamificationService.addPoints(email, 10, 'teacher_training_generation')
          showPointsNotification(10, 'generar una capacitación docente')
    
  }

  const handleInputChange = (field: keyof TrainingFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    setEditedContent(e.currentTarget.innerHTML)
  }

  const exportToPDF = async () => {
    try {
      setLoading(true);
      const pdf = initializePDF(`Plan de Capacitación - ${formData.topic}`, 'Generador de Planes de Capacitación');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Plan de Capacitación: ${formData.topic}`, `Nivel: ${formData.level}`);
      
      let y = MARGINS.top + 30;
      
      // Agregar el contenido generado por el backend
      if (training) {
        addStyledParagraph(pdf, training, y);
      }
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Plan_Capacitacion_${formData.topic.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay contenido para exportar');
      return;
    }

    try {
      const title = `Plan de Capacitación: ${formData.topic}`;
      const filename = `plan-capacitacion-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`;
      
      await exportToWord(editedContent, title, filename);
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareTraining = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Plan de Capacitación Docente - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Capacitación copiada al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir la capacitación");
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
        className="flex flex-col lg:flex-row h-screen"
      >
        {/* Panel izquierdo - Editor y Previsualizador */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 overflow-y-auto p-4 lg:p-6 border-r hidden lg:block"
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
                <h1 className="text-xl font-semibold">Capacitación Docente</h1>
              </motion.div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Capacitación Docente</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para la Capacitación:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas relevantes para el desarrollo profesional</li>
                            <li>Considera el nivel de experiencia de los docentes</li>
                            <li>Incluye objetivos claros y medibles</li>
                            <li>Proporciona recursos y materiales de apoyo</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Uso de herramientas tecnológicas en el aula</li>
                            <li>Estrategias de enseñanza innovadoras</li>
                            <li>Evaluación formativa y sumativa</li>
                            <li>Gestión del aula y disciplina</li>
                            <li>Educación inclusiva y diversidad</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para el Contenido:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Define objetivos específicos y alcanzables</li>
                            <li>Incluye actividades prácticas y participativas</li>
                            <li>Proporciona ejemplos y casos de estudio</li>
                            <li>Considera el tiempo disponible para la capacitación</li>
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
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!editedContent}
              >
                <FileText className="w-4 h-4" />
                Exportar a Word
              </Button>
                              <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={shareTraining}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {training && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                )}
              {training && (
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

          {training ? (
            <>
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

                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option>IA</option>
                  <option>Resumir</option>
                  <option>Expandir</option>
                  <option>Simplificar</option>
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

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                ref={previewRef}
                className="min-h-[500px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-6 text-gray-700 whitespace-pre-wrap font-sans"
                contentEditable
                onInput={handleContentChange}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-2">No hay capacitación generada</p>
              <p className="text-center text-sm">
                Configura el tema en el panel derecho y genera un plan de capacitación automáticamente.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Panel derecho - Formulario */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-[400px] p-4 lg:p-6 overflow-y-auto bg-gray-50"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-4 lg:p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Capacitación Docente</h2>
            
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
                    <Label htmlFor="topic">Tema de la Capacitación</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema principal de la capacitación. Incluye conceptos clave y contexto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Uso de herramientas tecnológicas en el aula: Integración de TIC para mejorar el aprendizaje"
                    required
                    maxLength={360}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/360</div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="level">Nivel de Experiencia</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel de experiencia de los docentes para adaptar el contenido.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    placeholder="Ej: Básico (0-2 años), Intermedio (3-5 años), Avanzado (5+ años)"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre de la Capacitación *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar fácilmente esta capacitación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Capacitación en Uso de TIC en el Aula - Nivel Intermedio"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
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
                          <p>Al marcar esta opción, tu capacitación será visible para otros educadores en la comunidad.</p>
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
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={loading} className="flex-1" size="lg">
                    {loading ? "Generando..." : "Generar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1" 
                    size="lg"
                    onClick={() => {
                      setFormData({ topic: "", level: "", objectives: "", content: "", methodology: "", resources: "", evaluation: "", name: "", isPublic: false })
                      setTraining("")
                      setEditedContent("")
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Botón para ver la previsualización en móvil */}
          {training && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 lg:hidden"
            >
              <Button 
                className="w-full"
                onClick={() => setShowPreviewModal(true)}
              >
                Ver Capacitación
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal para previsualización en móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Capacitación Docente</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option>Párrafo</option>
                  <option>Encabezado 1</option>
                  <option>Encabezado 2</option>
                  <option>Encabezado 3</option>
                </select>

                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option>IA</option>
                  <option>Resumir</option>
                  <option>Expandir</option>
                  <option>Simplificar</option>
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

                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                    <Undo className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                    <Redo className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={previewRef}
                className="min-h-[300px] sm:min-h-[400px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-gray-700 whitespace-pre-wrap font-sans"
                contentEditable
                onInput={handleContentChange}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />

              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
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
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                  onClick={handleExportWord}
                  disabled={!editedContent}
                >
                  <FileText className="w-4 h-4" />
                  Exportar a Word
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={shareTraining}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chat Improvement Modal */}
        <ChatImprovementModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false)
            // Limpiar el estado del chat cuando se cierra el modal
            localStorage.removeItem('capacitacionChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Capacitación Docente"
          description="Solicita mejoras específicas para tu capacitación. El asistente te ayudará a optimizar el contenido, metodología y estructura de la capacitación docente."
          suggestions={[
            "Mejora la metodología de enseñanza",
            "Añade más actividades prácticas",
            "Incluye recursos adicionales",
            "Mejora la estructura del contenido",
            "Añade ejemplos específicos",
            "Incluye estrategias de evaluación"
          ]}
          localStorageKey="capacitacionChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 