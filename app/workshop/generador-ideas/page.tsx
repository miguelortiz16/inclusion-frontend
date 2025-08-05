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
import { addLogoToFooter } from '@/utils/pdf-utils'
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
  DialogFooter,
} from "@/components/ui/dialog"
import { exportToWord } from '@/utils/word-export'
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface IdeaFormData {
  topic: string;
  course: string;
  name: string;
  isPublic: boolean;
  customGrade: string;
}

export default function IdeaGenerator() {
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<IdeaFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    customGrade: ""
  })
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian las ideas
  useEffect(() => {
    if (ideas) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('ideasFromChat')
      if (!isFromChat) {
        localStorage.removeItem('ideasChatState')
        console.log('Ideas generadas desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('ideasFromChat')
      }
    }
  }, [ideas])

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
    localStorage.removeItem('ideasChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Si hay contenido editado, usarlo; si no, usar las ideas originales
    return editedContent || ideas
  }

  const handleContentUpdate = (newContent: string) => {
    // Marcar que el cambio viene del chat
    sessionStorage.setItem('ideasFromChat', 'true')
    
    setEditedContent(newContent)
    setIdeas(newContent)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("No se encontró el email del usuario")
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
    try {
      const topic = `${formData.topic} Grado/Nivel educativo: ${formData.course === "otro" ? formData.customGrade : formData.course} Materia: ${formData.topic}
      Las ideas deben ser:
      - Innovadoras y atractivas
      - Adaptadas al nivel educativo
      - Fáciles de implementar
      - Con recursos mínimos
      - Alineadas con objetivos de aprendizaje`

      const topicRequest = {
        name: formData.name,
        topic: topic,
        email: email,
        isPublic: formData.isPublic,
        grade: formData.course === "otro" ? formData.customGrade : formData.course,
        theme: formData.topic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar las ideas')
      }

      const data = await response.text()
      setIdeas(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Ideas generadas exitosamente")
      
      // Limpiar el estado del chat cuando se generan nuevas ideas
      localStorage.removeItem('ideasChatState')
      

      // En móvil, mostrar el modal de previsualización
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las ideas")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
          // Agregar puntos por generar ideas
          if (email) {
            await gamificationService.addPoints(email, 5, 'idea_generation')
            showPointsNotification(5, 'generar ideas creativas')
          }
          
  }

  const handleInputChange = (field: keyof IdeaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content)
  }

  const exportToPDF = async () => {
    if (!previewRef.current) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Configuración básica
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 20;
      const pageWidth = 210; // Ancho A4 en mm
      const pageHeight = 297; // Alto A4 en mm
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Título y encabezado
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Ideas Creativas para: ${formData.topic}`, marginLeft, marginTop);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nivel: ${formData.course}`, marginLeft, marginTop + 10);
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido de las ideas
      let yPos = marginTop + 25;
      const lines = editedContent.split('\n');
      
      for (const line of lines) {
        if (yPos > pageHeight - marginTop - 20) {
          // Agregar el logo en el footer antes de la nueva página
          addLogoToFooter(pdf);
          pdf.addPage();
          yPos = marginTop;
        }

        // Saltar líneas vacías
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

        // Detectar listas
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const text = '• ' + line.trim().substring(2);
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

      // Agregar el logo en el footer de la última página
      addLogoToFooter(pdf);

      // Metadatos
      pdf.setProperties({
        title: `Ideas Creativas - ${formData.topic}`,
        subject: formData.course,
        author: 'Generador de Ideas',
      });

      // Guardar PDF
      pdf.save(`ideas-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Ideas exportadas exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar las ideas");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay ideas para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Ideas Creativas para: ${formData.topic}`,
        `ideas-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareIdeas = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ideas Creativas - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Ideas copiadas al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir las ideas");
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
          className="hidden lg:block flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 border-b lg:border-r lg:border-b-0"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-between items-center mb-6"
          >
            <h1 className="text-xl font-semibold">Generador de Ideas</h1>
            <div className="flex gap-2">
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
                onClick={shareIdeas}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {ideas && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white relative"
                  onClick={openChatModal}
                >
                  <MessageCircle className="w-4 h-4" />
                  Mejorar con IA
                </Button>
              )}
            </div>
          </motion.div>

          {/* Editor toolbar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative" 
            ref={previewRef}
          >
            {ideas ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <TypingEffect 
                  content={ideas}
                  isLoading={loading}
                  onContentChange={handleContentChange}
                  loadingMessage="Generando ideas..."
                  typingMessage="Escribiendo ideas..."
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay ideas generadas</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar ideas creativas.
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
          className="w-full lg:w-[400px] p-2 sm:p-4 lg:p-6 overflow-y-auto bg-gray-50"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-4 sm:p-6"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-between items-center mb-6"
            >
              <h2 className="text-xl font-semibold">Generador de Ideas</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Generar Ideas Creativas</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Se específico con el área o tema que deseas desarrollar</li>
                            <li>Considera el nivel educativo de los estudiantes</li>
                            <li>Piensa en actividades prácticas y atractivas</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características de las Ideas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Innovadoras y atractivas para los estudiantes</li>
                            <li>Adaptadas al nivel educativo seleccionado</li>
                            <li>Fáciles de implementar en el aula</li>
                            <li>Con recursos mínimos o accesibles</li>
                            <li>Alineadas con objetivos de aprendizaje</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </motion.div>
            
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="space-y-4"
              >
                                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre de las Ideas *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Un nombre descriptivo que identifique el conjunto de ideas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Ideas Creativas para Enseñar Ecosistemas en Grado 5"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema o área *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El área o tema específico para el que necesitas ideas creativas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Ciencias Naturales - Ecosistemas"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course">Nivel educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El grado o nivel educativo de los estudiantes</p>
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
                    <div className="mt-2">
                      <Input
                        id="customGrade"
                        value={formData.customGrade}
                        onChange={(e) => handleInputChange("customGrade", e.target.value)}
                        placeholder="Especifica el nivel educativo"
                        required
                      />
                    </div>
                  )}
                </div>



                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                    Compartir con la comunidad de profesores
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Al marcar esta opción, tus ideas serán visibles para otros profesores en la comunidad</p>
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
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando ideas..."
                  disabled={loading || !formData.topic || !formData.course || !formData.name}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Ideas
                </LoadingButton>
              </motion.div>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {ideas && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver Previsualización
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal de previsualización para móvil */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Previsualización de Ideas</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {ideas ? (
              <div className="space-y-4">
                {/* Botones de exportación en el modal */}
                <div className="flex flex-wrap gap-2 mb-4">
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
                    onClick={shareIdeas}
                    disabled={!editedContent}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white relative"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                </div>

                <div className="border-b pb-3 mb-4 flex flex-wrap gap-2">
                  <select className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                    <option>Párrafo</option>
                    <option>Encabezado 1</option>
                    <option>Encabezado 2</option>
                    <option>Encabezado 3</option>
                  </select>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
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

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
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

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
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
                  className="min-h-[300px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-4 text-gray-700 whitespace-pre-wrap font-sans"
                  contentEditable
                  onInput={(e) => handleContentChange(e.currentTarget.textContent || '')}
                  suppressContentEditableWarning
                >
                  {editedContent}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay ideas generadas</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar ideas creativas.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
      
      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('ideasChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Ideas"
        description="Solicita mejoras específicas para tus ideas creativas. El asistente te ayudará a optimizar y expandir las ideas."
        suggestions={[
          "Haz las ideas más detalladas",
          "Añade más variedad de actividades",
          "Incluye recursos materiales necesarios",
          "Mejora la secuencia de implementación",
          "Añade adaptaciones para diferentes niveles",
          "Incluye evaluación de las actividades"
        ]}
        localStorageKey="ideasChatState"
      />
    </Layout>
    </>
  )
}


