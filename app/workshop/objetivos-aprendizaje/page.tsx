"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, FileText, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, AlertCircle, Loader2 } from "lucide-react"
import jsPDF from 'jspdf'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
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
interface LearningObjectivesFormData {
  topic: string;
  course: string;
  name: string;
  isPublic: boolean;
  customGrade: string;
}

export default function LearningObjectivesGenerator() {
  const [loading, setLoading] = useState(false)
  const [objectives, setObjectives] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<LearningObjectivesFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    customGrade: ""
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian los objetivos
  useEffect(() => {
    if (objectives) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('objetivosFromChat')
      if (!isFromChat) {
        localStorage.removeItem('objetivosChatState')
        console.log('Objetivos generados desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('objetivosFromChat')
      }
    }
  }, [objectives])

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
    localStorage.removeItem('objetivosChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual de los objetivos
    return objectives || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('objetivosFromChat', 'true')
      
      // Actualizar el contenido de los objetivos
      setObjectives(newContent)
      setEditedContent(newContent)
      toast.success("Objetivos de aprendizaje actualizados exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar los objetivos de aprendizaje.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        setLoading(false)
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

      const topicRequest = {
        topic: "tema: " + formData.topic + " grado academico: " + (formData.course === "otro" ? formData.customGrade : formData.course),
        email: email,
        name: formData.name,
        isPublic: formData.isPublic,
        theme: formData.topic,
        grade: formData.course === "otro" ? formData.customGrade : formData.course
      }

      console.log('Enviando al backend:', topicRequest)

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/objetivos-aprendizaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar los objetivos de aprendizaje')
      }

      const data = await response.text()
      // Format the response text
      const formattedData = data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
      
      setObjectives(formattedData)
      setEditedContent(formattedData)
      toast.success("Objetivos de aprendizaje generados exitosamente")
      
      // Limpiar el estado del chat cuando se generan nuevos objetivos
      localStorage.removeItem('objetivosChatState')

 
      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Error al generar los objetivos de aprendizaje')
      toast.error("Error al generar los objetivos de aprendizaje")
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
         // Agregar puntos por generar objetivos de aprendizaje
         await gamificationService.addPoints(email, 10, 'learning_objectives_generation')
         showPointsNotification(10, 'generar objetivos de aprendizaje')
   
  }

  const handleInputChange = (field: keyof LearningObjectivesFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    setEditedContent(e.currentTarget.innerHTML)
  }

  const exportToPDF = async () => {
    if (!previewRef.current) return;

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
      const pageWidth = 210; // Ancho A4 en mm
      const pageHeight = 297; // Alto A4 en mm
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Configuración inicial
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Objetivos de Aprendizaje: ${formData.topic}`, marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido de los objetivos
      let yPos = marginTop + 25;
      const lines = editedContent.split('\n');
      
      for (const line of lines) {
        if (yPos > pageHeight - marginTop - 20) {
          pdf.addPage();
          yPos = marginTop;
        }

        // Ignorar líneas vacías
        if (line.trim() === '') {
          yPos += 5;
          continue;
        }

        // Detectar encabezados
        if (line.startsWith('# ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const text = line.substring(2);
          const splitText = pdf.splitTextToSize(text, contentWidth);
          pdf.text(splitText, marginLeft, yPos);
          yPos += (splitText.length * 7) + 5;
          continue;
        }

        if (line.startsWith('## ')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const text = line.substring(3);
          const splitText = pdf.splitTextToSize(text, contentWidth);
          pdf.text(splitText, marginLeft, yPos);
          yPos += (splitText.length * 6) + 4;
          continue;
        }

        if (line.startsWith('### ')) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const text = line.substring(4);
          const splitText = pdf.splitTextToSize(text, contentWidth);
          pdf.text(splitText, marginLeft, yPos);
          yPos += (splitText.length * 6) + 4;
          continue;
        }

        // Detectar listas
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const text = '• ' + line.trim().substring(2);
          const splitText = pdf.splitTextToSize(text, contentWidth - 5);
          pdf.text(splitText, marginLeft + 5, yPos);
          yPos += (splitText.length * 6) + 3;
          continue;
        }

        // Detectar listas numeradas
        if (line.trim().match(/^\d+\./)) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const text = line.trim();
          const splitText = pdf.splitTextToSize(text, contentWidth - 5);
          pdf.text(splitText, marginLeft + 5, yPos);
          yPos += (splitText.length * 6) + 3;
          continue;
        }

        // Texto normal
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const splitText = pdf.splitTextToSize(line, contentWidth);
        pdf.text(splitText, marginLeft, yPos);
        yPos += (splitText.length * 6) + 3;
      }

      // Metadatos
      pdf.setProperties({
        title: `Objetivos de Aprendizaje`,
        subject: 'Objetivos de Aprendizaje',
        author: 'Generador de Objetivos de Aprendizaje',
      });

      // Guardar el PDF
      pdf.save(`objetivos-${formData.topic.substring(0, 30).toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Objetivos de aprendizaje exportados exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar los objetivos de aprendizaje");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay objetivos para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Objetivos de Aprendizaje: ${formData.topic}`,
        `objetivos-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareObjectives = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Objetivos de Aprendizaje - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Objetivos de aprendizaje copiados al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir los objetivos de aprendizaje");
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <h1 className="text-xl font-semibold">Objetivos de Aprendizaje</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para la Formulación de Objetivos de Aprendizaje</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Características de los Objetivos:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Claros y específicos</li>
                            <li>Medibles y observables</li>
                            <li>Alcanzables y realistas</li>
                            <li>Relevantes para el nivel educativo</li>
                            <li>Con un tiempo definido</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Niveles de Objetivos:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Conocimiento: Recordar y comprender</li>
                            <li>Comprensión: Interpretar y explicar</li>
                            <li>Aplicación: Usar y resolver</li>
                            <li>Análisis: Comparar y contrastar</li>
                            <li>Evaluación: Juzgar y valorar</li>
                            <li>Creación: Diseñar y producir</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para la Formulación:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Usa verbos de acción específicos</li>
                            <li>Define criterios de evaluación claros</li>
                            <li>Considera el nivel de desarrollo cognitivo</li>
                            <li>Alínea con los estándares curriculares</li>
                            <li>Incluye objetivos de diferentes niveles</li>
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
                  onClick={shareObjectives}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {objectives && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                )}
              {objectives && (
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

          {objectives ? (
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
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-red-500"
            >
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-center mb-2">{error}</p>
              <p className="text-center text-sm">
                Por favor, intenta nuevamente o contacta al soporte técnico.
              </p>
            </motion.div>
          ) : loading ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <Loader2 className="w-12 h-12 mb-4 animate-spin" />
              <p className="text-center mb-2">Generando objetivos de aprendizaje...</p>
              <p className="text-center text-sm">
                Esto puede tomar unos momentos.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-2">No hay objetivos de aprendizaje generados</p>
              <p className="text-center text-sm">
                Ingresa el tema y el nivel educativo en el panel derecho para generar objetivos de aprendizaje.
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
            className="bg-white rounded-lg border shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Objetivos de Aprendizaje</h2>
            
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
                    <Label htmlFor="topic">Tema *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema o área de conocimiento para el que deseas generar objetivos de aprendizaje.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <textarea
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: La fotosíntesis en las plantas: Proceso de conversión de energía solar en energía química, incluyendo los componentes principales como cloroplastos, clorofila y la ecuación general del proceso..."
                    required
                    maxLength={2000}
                    className="w-full min-h-[200px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/2000</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course">Nivel Educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar los objetivos de aprendizaje.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.course}
                    onValueChange={(value) => handleInputChange("course", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel" />
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
                    </SelectContent>
                  </Select>

                  {formData.course === "otro" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2"
                    >
                      <Label htmlFor="customGrade">Especifica el nivel educativo *</Label>
                      <Input
                        id="customGrade"
                        value={formData.customGrade}
                        onChange={(e) => handleInputChange("customGrade", e.target.value)}
                        placeholder="Ingresa el nivel educativo"
                        required
                        className="mt-1"
                      />
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre de los Objetivos *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar estos objetivos de aprendizaje.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Objetivos de Aprendizaje - Fotosíntesis - Grado 7"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
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
                        <p>Al marcar esta opción, tus objetivos de aprendizaje serán visibles para otros profesores en la comunidad.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="flex gap-2"
              >
                <Button 
                  type="submit" 
                  disabled={loading || !formData.topic || !formData.course || !formData.name} 
                  className="flex-1" 
                  size="lg"
                >
                  {loading ? "Generando..." : "Generar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  size="lg"
                  onClick={() => {
                    setFormData({ topic: "", course: "", name: "", isPublic: false, customGrade: "" })
                    setObjectives("")
                    setEditedContent("")
                  }}
                >
                  Limpiar
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Botón para ver la previsualización en móvil */}
          {objectives && (
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
                Ver Objetivos
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal para previsualización en móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Objetivos de Aprendizaje</DialogTitle>
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
                  onClick={shareObjectives}
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
            localStorage.removeItem('objetivosChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Objetivos de Aprendizaje"
          description="Solicita mejoras específicas para tus objetivos de aprendizaje. El asistente te ayudará a optimizar la claridad, especificidad y efectividad de los objetivos."
          suggestions={[
            "Mejora la claridad de los objetivos",
            "Añade más objetivos específicos",
            "Incluye objetivos de diferentes niveles",
            "Mejora los verbos de acción",
            "Añade criterios de evaluación",
            "Incluye objetivos de aplicación práctica"
          ]}
          localStorageKey="objetivosChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 