"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import { PDFExporter } from '@/components/pdf-exporter'
import { LazyTypingEffect as TypingEffect, LazyLoadingButton as LoadingButton } from '@/components/lazy-components'
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


interface ActivityFormData {
  topic: string;
  course: string;
  name: string;
  isPublic: boolean;
  grade: string;
  customGrade?: string;
}

export default function ActivityIdeasGenerator() {
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<ActivityFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    grade: ""
  })
  const [email, setEmail] = useState<string | null>(null)

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian las ideas
  useEffect(() => {
    if (ideas) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('ideasActividadesFromChat')
      if (!isFromChat) {
        localStorage.removeItem('ideasActividadesChatState')
        console.log('Ideas generadas desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('ideasActividadesFromChat')
      }
    }
  }, [ideas])

  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('email')
      setEmail(storedEmail)
    }
  }, [])

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
    localStorage.removeItem('ideasActividadesChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual de las ideas
    return ideas || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('ideasActividadesFromChat', 'true')
      
      // Actualizar el contenido de las ideas
      setIdeas(newContent)
      setEditedContent(newContent)
      toast.success("Ideas de actividades actualizadas exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar las ideas de actividades.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')
    
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

    try {
      const topicRequest = {
        topic: "tema: " + formData.topic + " grado academico: " + (formData.course === "otro" ? formData.customGrade : formData.course),
        email: email,
        name: formData.name,
        isPublic: formData.isPublic,
        theme: formData.topic,
        grade: formData.course === "otro" ? formData.customGrade : formData.course
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-ideas-actividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar las ideas de actividades')
      }

      const data = await response.text()
      setIdeas(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Ideas de actividades generadas exitosamente")
      
      // Limpiar el estado del chat cuando se generan nuevas ideas
      localStorage.removeItem('ideasActividadesChatState')

      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las ideas de actividades")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
         // Agregar puntos por generar ideas de actividades
         await gamificationService.addPoints(email, 5, 'activity_ideas_generation')
         showPointsNotification(5, 'generar ideas de actividades')
   
  }

  const handleInputChange = (field: keyof ActivityFormData, value: string | boolean) => {
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
      pdf.text(`Ideas de Actividades para: ${formData.topic}`, marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido de las ideas
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
        title: `Ideas de Actividades - ${formData.topic}`,
        subject: 'Ideas de Actividades Educativas',
        author: 'Generador de Ideas de Actividades',
      });

      // Guardar el PDF
      pdf.save(`ideas-actividades-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Ideas de actividades exportadas exitosamente");
      
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar las ideas de actividades");
      throw error;
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay contenido para exportar');
      return;
    }

    try {
      const title = `Ideas de Actividades: ${formData.topic}`;
      const filename = `ideas-actividades-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Convertir el contenido a texto plano
      const plainContent = editedContent
        .replace(/<[^>]*>/g, '') // Remover etiquetas HTML
        .replace(/&nbsp;/g, ' ') // Convertir &nbsp; a espacios
        .replace(/&lt;/g, '<')   // Convertir &lt; a <
        .replace(/&gt;/g, '>')   // Convertir &gt; a >
        .replace(/&amp;/g, '&')  // Convertir &amp; a &
        .trim();                 // Remover espacios extra al inicio y final

      const content = `
${title}
Nivel Educativo: ${formData.course}
----------------------------------------

${plainContent}
`;
      
      await exportToWord(content, title, filename);
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
          title: `Ideas de Actividades - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Ideas de actividades copiadas al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir las ideas de actividades");
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
                <h1 className="text-xl font-semibold">Generador de Ideas de Actividades</h1>
              </motion.div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Generar Ideas de Actividades</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Actividades:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas relevantes y atractivos</li>
                            <li>Considera el nivel educativo de los estudiantes</li>
                            <li>Incluye actividades prácticas y participativas</li>
                            <li>Proporciona materiales y recursos necesarios</li>
                            <li>Define objetivos claros y medibles</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tipos de Actividades:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Actividades prácticas y experimentales</li>
                            <li>Juegos educativos y dinámicas</li>
                            <li>Proyectos colaborativos</li>
                            <li>Debates y discusiones</li>
                            <li>Actividades de investigación</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para la Implementación:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Adapta las actividades al tiempo disponible</li>
                            <li>Considera los recursos disponibles</li>
                            <li>Incluye instrucciones claras</li>
                            <li>Proporciona ejemplos y casos prácticos</li>
                            <li>Establece criterios de evaluación</li>
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
                  onClick={shareIdeas}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {ideas && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                )}
              {ideas && (
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
            {ideas ? (
              <TypingEffect 
                content={ideas}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando ideas de actividades..."
                typingMessage="Escribiendo ideas..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay ideas de actividades generadas</p>
                <p className="text-center text-sm">
                  Configura el tema en el panel derecho y genera ideas de actividades interactivas y didácticas automáticamente.
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
          className="w-full lg:w-[400px] p-4 lg:p-6 overflow-y-auto bg-gray-50"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-4 lg:p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Generador de Ideas de Actividades</h2>
            
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
                          <p>Describe el tema principal para el que deseas generar actividades.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Introducción a la programación: Conceptos básicos y primeros pasos"
                    required
                    maxLength={360}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/360</div>
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
                          <p>Selecciona el nivel educativo para adaptar las actividades.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.course}
                    onValueChange={(value) => handleInputChange("course", value)}
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
                    <Label htmlFor="name">Nombre de las Actividades *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar estas actividades.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Actividades de Programación - Grado 5"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
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
                          <p>Al marcar esta opción, tus ideas de actividades serán visibles para otros educadores en la comunidad.</p>
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
                  loadingText="Generando ideas..."
                  disabled={loading || !formData.topic || !formData.course}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Ideas
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Botón para ver la previsualización en móvil */}
          {ideas && (
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
                Ver Ideas
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal para previsualización en móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Ideas de Actividades</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
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
              >
                {ideas ? (
                  <TypingEffect 
                    content={ideas}
                    isLoading={loading}
                    onContentChange={handleContentChange}
                    loadingMessage="Generando ideas de actividades..."
                    typingMessage="Escribiendo ideas..."
                  />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="border border-dashed rounded-lg p-8 sm:p-16 flex flex-col items-center justify-center text-gray-500 min-h-[300px] sm:min-h-[400px]"
                  >
                    <LightbulbIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 text-gray-300" />
                    <p className="text-center mb-2">No hay ideas generadas</p>
                    <p className="text-center text-sm">
                      Completa el formulario para generar ideas de actividades.
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
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
                  onClick={shareIdeas}
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
            localStorage.removeItem('ideasActividadesChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Ideas de Actividades"
          description="Solicita mejoras específicas para tus ideas de actividades. El asistente te ayudará a optimizar la creatividad, variedad y efectividad de las actividades."
          suggestions={[
            "Añade más variedad de actividades",
            "Mejora la creatividad de las ideas",
            "Incluye actividades para diferentes estilos de aprendizaje",
            "Añade actividades de evaluación",
            "Mejora las instrucciones de las actividades",
            "Incluye actividades de extensión"
          ]}
          localStorageKey="ideasActividadesChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 