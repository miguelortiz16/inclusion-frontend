"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, FolderKanban, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import { PDFExporter } from '@/components/pdf-exporter'
import { LazyTypingEffect as TypingEffect, LazyLoadingButton as LoadingButton } from '@/components/lazy-components'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { addLogoToFooter } from '@/utils/pdf-utils'
import { exportToWord } from '@/utils/word-export'
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
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface ProjectFormData {
  topic: string;
  gradeLevel: string;
  name: string;
  isPublic: boolean;
  grade: string;
  customGrade: string;
}

export default function ProjectGenerator() {
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<ProjectFormData>({
    topic: "",
    gradeLevel: "",
    name: "",
    isPublic: false,
    grade: "",
    customGrade: ""
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el proyecto
  useEffect(() => {
    if (project) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('proyectoFromChat')
      if (!isFromChat) {
        localStorage.removeItem('proyectoChatState')
        console.log('Proyecto generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('proyectoFromChat')
      }
    }
  }, [project])

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
    localStorage.removeItem('proyectoChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Si hay contenido editado, usarlo; si no, usar el proyecto original
    return editedContent || project
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('proyectoFromChat', 'true')
      
      // Actualizar el proyecto con el nuevo contenido
      setProject(newContent)
      setEditedContent(newContent)
      toast.success("Proyecto actualizado exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el proyecto.")
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')
    
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
      const topicRequest = {
        topic:  "tema: " + formData.topic+" Grado/Nivel educativo: "+(formData.grade === "otro" ? formData.customGrade : formData.grade),
        email: email,
        name: formData.name,
        isPublic: formData.isPublic,
        grade: formData.grade
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-proyecto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el proyecto')
      }

      const data = await response.text()
      setProject(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Proyecto generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo proyecto
      localStorage.removeItem('proyectoChatState')

      // Mostrar modal automáticamente en móvil
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el proyecto")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
          // Agregar puntos por generar un proyecto educativo
          await gamificationService.addPoints(email, 12, 'project_creation')
          showPointsNotification(12, 'generar un proyecto educativo')
    
  }

  const handleInputChange = (field: keyof ProjectFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content)
  }

  const generatePDF = async (jsPDF: any) => {
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
      pdf.text(`Proyecto Educativo: ${formData.topic}`, marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido del proyecto
      let yPos = marginTop + 25;
      const lines = editedContent.split('\n');
      
      for (const line of lines) {
        if (yPos > pageHeight - marginTop - 20) {
          // Agregar el logo en el footer antes de la nueva página
          addLogoToFooter(pdf);
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

      // Agregar el logo en el footer de la última página
      addLogoToFooter(pdf);

      // Metadatos
      pdf.setProperties({
        title: `Proyecto Educativo - ${formData.topic}`,
        subject: 'Proyecto de Investigación',
        author: 'Generador de Proyectos',
      });

      // Guardar el PDF
      pdf.save(`proyecto-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Proyecto exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el proyecto");
      throw error;
    }
  };

  const shareProject = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Proyecto Educativo - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Proyecto copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el proyecto");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error("No hay contenido para exportar");
      return;
    }

    try {
      const title = `Proyecto Educativo: ${formData.topic}`;
      const filename = `proyecto-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`;
      
      await exportToWord(editedContent, title, filename);
      toast.success("Proyecto exportado a Word exitosamente");
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error("Error al exportar a Word");
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
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <h1 className="text-xl font-semibold">Generador de Proyectos</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Crear Proyectos Educativos</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Elige temas que sean relevantes y motivadores</li>
                            <li>Considera los intereses de tus estudiantes</li>
                            <li>Selecciona temas que permitan investigación y experimentación</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Proyectos:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Ciencias: "Efecto de diferentes suelos en el crecimiento de plantas"</li>
                            <li>Historia: "La influencia de la Revolución Industrial en tu ciudad"</li>
                            <li>Matemáticas: "Diseño de un parque usando geometría"</li>
                            <li>Literatura: "Creación de un periódico histórico"</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para el Aula:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Adapta el proyecto al nivel educativo</li>
                            <li>Incluye objetivos claros y medibles</li>
                            <li>Considera el tiempo disponible</li>
                            <li>Planifica recursos y materiales necesarios</li>
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
              className="flex gap-4"
            >
              <PDFExporter 
                generatePDF={generatePDF}
                disabled={!editedContent}
              >
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                  disabled={!editedContent}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a PDF
                </Button>
              </PDFExporter>
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
                onClick={shareProject}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {project && (
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
            {project ? (
              <TypingEffect 
                content={project}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando proyecto educativo..."
                typingMessage="Escribiendo proyecto..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <FolderKanban className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay proyecto generado</p>
                <p className="text-center text-sm">
                  Completa el formulario a la derecha para crear un proyecto educativo personalizado.
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-6"
          >
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl font-semibold mb-6"
            >
              Crear un Proyecto Educativo
            </motion.h2>
            
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
                                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.75 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Proyecto *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Un nombre descriptivo para tu proyecto educativo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Explorando el crecimiento de plantas, La Revolución Industrial en nuestra ciudad"
                    required
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema o Área *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El tema principal del proyecto. Debe ser específico y permitir investigación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Efecto de diferentes suelos en el crecimiento de plantas, La influencia de la Revolución Industrial en tu ciudad"
                    required
                  />
                </motion.div>



                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="gradeLevel">Nivel Educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar el proyecto a las capacidades de los estudiantes.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select 
                    value={formData.grade} 
                    onValueChange={(value) => handleInputChange("grade", value)}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="otro">Otro (especificar)</SelectItem>
                      <SelectItem value="preescolar">Preescolar</SelectItem>
                      <SelectItem value="primaria-1-3">Primaria (1° a 3°)</SelectItem>
                      <SelectItem value="primaria-4-5">Primaria (4° a 5°)</SelectItem>
                      <SelectItem value="secundaria-6-8">Secundaria (6° a 8°)</SelectItem>
                      <SelectItem value="secundaria-9-11">Secundaria (9° a 11°)</SelectItem>
                      <SelectItem value="universidad">Universidad</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.grade === "otro" && (
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
                  transition={{ duration: 0.5, delay: 0.9 }}
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
                          <p>Al marcar esta opción, tu proyecto será visible para otros educadores en la comunidad.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando proyecto..."
                  disabled={loading || !formData.topic || !formData.grade}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Proyecto
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>

          {project && (
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
                Ver Previsualización
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal de previsualización para móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Previsualización del Proyecto</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Editor toolbar */}
              <div className="border-b pb-3 mb-6 flex items-center gap-2">
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
              </div>

              {/* Typing Effect Content Area */}
              <div className="relative" ref={previewRef}>
                {project ? (
                  <TypingEffect 
                    content={project}
                    isLoading={loading}
                    onContentChange={handleContentChange}
                    loadingMessage="Generando proyecto educativo..."
                    typingMessage="Escribiendo proyecto..."
                  />
                ) : (
                  <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]">
                    <FolderKanban className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-center mb-2">No hay proyecto generado</p>
                    <p className="text-center text-sm">
                      Completa el formulario a la derecha para crear un proyecto educativo personalizado.
                    </p>
                  </div>
                )}
              </div>

              {/* Export buttons in modal */}
              <div className="flex flex-col gap-2">
                <PDFExporter 
                  generatePDF={generatePDF}
                  disabled={!editedContent}
                >
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                    onClick={generatePDF}
                    disabled={!editedContent}
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar a PDF
                  </Button>
                </PDFExporter>

                <Button
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                  onClick={handleExportWord}
                  disabled={!editedContent}
                >
                  <FileText className="w-4 h-4" />
                  Exportar a Word
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={shareProject}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {project && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                )}
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
            localStorage.removeItem('proyectoChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Proyectos Educativos"
          description="Solicita mejoras específicas para tu proyecto educativo. El asistente te ayudará a optimizar la estructura, objetivos y metodología del proyecto."
          suggestions={[
            "Mejora la estructura del proyecto",
            "Añade más actividades prácticas",
            "Incluye criterios de evaluación",
            "Mejora los objetivos de aprendizaje",
            "Añade recursos y materiales",
            "Incluye timeline del proyecto"
          ]}
          localStorageKey="proyectoChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
}

