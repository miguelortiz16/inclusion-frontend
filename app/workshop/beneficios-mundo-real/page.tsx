"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import { PDFExporter } from '@/components/pdf-exporter'
import { LazyTypingEffect as TypingEffect, LazyLoadingButton as LoadingButton } from '@/components/lazy-components'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface BenefitsFormData {
  topic: string;
  isPublic: boolean;
  grade: string;
  subject: string;
  customSubject?: string;
  customGrade?: string;
}

export default function RealWorldBenefits() {
  const [loading, setLoading] = useState(false)
  const [benefits, setBenefits] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<BenefitsFormData>({
    topic: "",
    isPublic: false,
    grade: "",
    subject: ""
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian los beneficios
  useEffect(() => {
    if (benefits) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('beneficiosFromChat')
      if (!isFromChat) {
        localStorage.removeItem('beneficiosChatState')
        console.log('Beneficios generados desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('beneficiosFromChat')
      }
    }
  }, [benefits])
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
    localStorage.removeItem('beneficiosChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Si hay contenido editado, usarlo; si no, usar los beneficios originales
    return editedContent || benefits
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('beneficiosFromChat', 'true')
      
      // Actualizar los beneficios con el nuevo contenido
      setBenefits(newContent)
      setEditedContent(newContent)
      toast.success("Beneficios actualizados exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar los beneficios.")
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
        topic: "tema: " + formData.topic+" Grado/Nivel educativo: "+(formData.grade === "otro" ? formData.customGrade : formData.grade)+" Materia: "+(formData.subject === "otro" ? formData.customSubject : formData.subject),
        name: formData.topic,
        email: email,
        isPublic: formData.isPublic,
        grade: formData.grade,
        subject: formData.subject
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/beneficios-del-mundo-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar los beneficios')
      }

      const data = await response.text()
      setBenefits(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Beneficios generados exitosamente")
      
      // Limpiar el estado del chat cuando se generan nuevos beneficios
      localStorage.removeItem('beneficiosChatState')


    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar los beneficios")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      setLoading(false)
      return
    }
          // Agregar puntos por generar beneficios del mundo real
          await gamificationService.addPoints(email, 8, 'real_world_benefits')
          showPointsNotification(8, 'generar beneficios del mundo real')
    
  }

  const handleInputChange = (field: keyof BenefitsFormData, value: string | boolean) => {
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
      pdf.text(`Logros del Mundo Real: ${formData.topic}`, marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido de los beneficios
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
        title: `Logros del Mundo Real - ${formData.topic}`,
        subject: 'Beneficios Prácticos',
        author: 'Generador de Beneficios',
      });

      // Guardar el PDF
      pdf.save(`beneficios-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Beneficios exportados exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar los beneficios");
      throw error;
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay beneficios para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Beneficios del Mundo Real: ${formData.topic}`,
        `beneficios-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareBenefits = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Logros del Mundo Real - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Beneficios copiados al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir los beneficios");
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
              <h1 className="text-xl font-semibold">Logros del Mundo Real</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Conectar el Aula con el Mundo Real</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Elige temas que tengan aplicaciones prácticas claras</li>
                            <li>Considera el nivel educativo de tus estudiantes</li>
                            <li>Selecciona conceptos que puedan relacionarse con la vida cotidiana</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Matemáticas: Ecuaciones cuadráticas en la arquitectura</li>
                            <li>Ciencias: Fotosíntesis en la agricultura</li>
                            <li>Historia: Revolución Industrial y tecnología actual</li>
                            <li>Literatura: Análisis de textos en medios digitales</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para el Aula:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Usa los ejemplos para iniciar discusiones</li>
                            <li>Invita a los estudiantes a buscar más aplicaciones</li>
                            <li>Conecta con proyectos prácticos</li>
                            <li>Relaciona con carreras profesionales</li>
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
              <PDFExporter 
                generatePDF={generatePDF}
                disabled={!editedContent}
              >
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                  onClick={generatePDF}
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
                onClick={shareBenefits}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {benefits && (
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
            {benefits ? (
              <TypingEffect 
                content={benefits}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando beneficios del mundo real..."
                typingMessage="Escribiendo beneficios..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay logros generados</p>
                <p className="text-center text-sm">
                  Proporciona un tema académico para generar ejemplos de cómo se aplica en el mundo real.
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
              Conecta el aula con la vida real
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
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema académico *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa un concepto académico para descubrir sus aplicaciones prácticas en la vida real.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Ecuaciones cuadráticas en la arquitectura, Fotosíntesis en la agricultura"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ingresa un concepto o tema que quieras conectar con aplicaciones del mundo real
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grade">Grado *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el grado educativo para el que estás generando los beneficios.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => handleInputChange("grade", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un grado" />
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
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subject">Asignatura *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona la asignatura relacionada con el tema.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => handleInputChange("subject", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="biologia">Biología</SelectItem>
    <SelectItem value="ciencias-naturales">Ciencias Naturales</SelectItem>
    <SelectItem value="ciencias-sociales">Ciencias Sociales</SelectItem>
    <SelectItem value="economia">Economía</SelectItem>
    <SelectItem value="educacion-artistica">Educación Artística y Cultural</SelectItem>
    <SelectItem value="educacion-fisica">Educación Física, Recreación y Deportes</SelectItem>
    <SelectItem value="fisica">Física</SelectItem>
    <SelectItem value="geografia">Geografía</SelectItem>
    <SelectItem value="historia">Historia</SelectItem>
    <SelectItem value="ingles">Inglés</SelectItem>
    <SelectItem value="matematicas">Matemáticas</SelectItem>
    <SelectItem value="quimica">Química</SelectItem>
    <SelectItem value="lengua">Lengua</SelectItem>
    <SelectItem value="espanol">Español</SelectItem>
    <SelectItem value="literatura">Literatura</SelectItem>
    <SelectItem value="religion">Religión</SelectItem>
    <SelectItem value="constitucion-politica">Constitución Política y Democracia</SelectItem>
    <SelectItem value="etica-valores">Ética y Valores Humanos</SelectItem>
    <SelectItem value="filosofia">Filosofía</SelectItem>
    <SelectItem value="tecnologia-informatica">Tecnología e Informática</SelectItem>
    <SelectItem value="educacion-ambiental">Educación Ambiental</SelectItem>
    <SelectItem value="estudios-afrocolombianos">Cátedra de Estudios Afrocolombianos</SelectItem>
    <SelectItem value="educacion-ciudadana">Educación para la Ciudadanía</SelectItem>
    <SelectItem value="educacion-paz">Educación para la Paz</SelectItem>
    <SelectItem value="educacion-sexualidad">Educación para la Sexualidad</SelectItem>


                    </SelectContent>
                  </Select>

                  {formData.subject === "otro" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2"
                    >
                      <Label htmlFor="customSubject">Especifica la materia *</Label>
                      <Input
                        id="customSubject"
                        value={formData.customSubject}
                        onChange={(e) => handleInputChange("customSubject", e.target.value)}
                        placeholder="Ingresa el nombre de la asignatura"
                        required
                        className="mt-1"
                      />
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex items-center space-x-2"
                >
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
                        <p>Si seleccionas esta opción, tu contenido será compartido con la comunidad de profesores para que puedan beneficiarse de tus ideas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando beneficios..."
                  disabled={loading || !formData.topic}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Logros del Mundo Real
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>

          {benefits && (
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
              <DialogTitle>Previsualización de los Logros del Mundo Real</DialogTitle>
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
                {benefits ? (
                  <TypingEffect 
                    content={benefits}
                    isLoading={loading}
                    onContentChange={handleContentChange}
                    loadingMessage="Generando beneficios del mundo real..."
                    typingMessage="Escribiendo beneficios..."
                  />
                ) : (
                  <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]">
                    <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-center mb-2">No hay logros generados</p>
                    <p className="text-center text-sm">
                      Proporciona un tema académico para generar ejemplos de cómo se aplica en el mundo real.
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
                  onClick={shareBenefits}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {benefits && (
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
            localStorage.removeItem('beneficiosChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Beneficios del Mundo Real"
          description="Solicita mejoras específicas para tus beneficios del mundo real. El asistente te ayudará a optimizar las conexiones entre el aula y la vida cotidiana."
          suggestions={[
            "Añade más ejemplos prácticos",
            "Incluye casos de estudio específicos",
            "Mejora las conexiones con carreras profesionales",
            "Añade actividades prácticas para el aula",
            "Incluye recursos multimedia sugeridos",
            "Mejora las explicaciones técnicas"
          ]}
          localStorageKey="beneficiosChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
}

