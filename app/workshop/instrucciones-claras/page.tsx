"use client"

import dynamic from 'next/dynamic'
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, FileText, HelpCircle } from "lucide-react"
import { LazyLoadedPage } from '@/components/lazy-loaded-page'
import { PDFExporter } from '@/components/pdf-exporter'
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
// Importación dinámica de componentes pesados
const TypingEffect = dynamic(() => import('@/components/typing-effect'), { 
  ssr: false,
  loading: () => (
    <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-gray-200 mb-4"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
})

// Importación dinámica del componente LoadingButton
const LoadingButton = dynamic(() => import('@/components/typing-effect').then(mod => ({ default: mod.LoadingButton })), {
  ssr: false,
  loading: () => (
    <Button disabled className="w-full" size="lg">
      <div className="animate-pulse">Cargando...</div>
    </Button>
  )
})

interface InstructionsFormData {
  name: string;
  topic: string;
  course: string;
  isPublic: boolean;
  customGrade?: string;
}

export default function ClearInstructionsGenerator() {
  const [loading, setLoading] = useState(false)
  const [instructions, setInstructions] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [formData, setFormData] = useState<InstructionsFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    customGrade: ""
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian las instrucciones
  useEffect(() => {
    if (instructions) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('instruccionesFromChat')
      if (!isFromChat) {
        localStorage.removeItem('instruccionesChatState')
        console.log('Instrucciones generadas desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('instruccionesFromChat')
      }
    }
  }, [instructions])

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
    localStorage.removeItem('instruccionesChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual de las instrucciones
    return instructions || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('instruccionesFromChat', 'true')
      
      // Actualizar el contenido de las instrucciones
      setInstructions(newContent)
      setEditedContent(newContent)
      toast.success("Instrucciones actualizadas exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar las instrucciones.")
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
        setLoading(false)
        setLoadingState('idle')
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

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/instrucciones-claras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar las instrucciones')
      }

      const data = await response.text()
      setInstructions(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Instrucciones generadas exitosamente")
      
      // Limpiar el estado del chat cuando se generan nuevas instrucciones
      localStorage.removeItem('instruccionesChatState')


      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las instrucciones")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
          // Agregar puntos por generar instrucciones claras
          await gamificationService.addPoints(email, 8, 'clear_instructions_generation')
          showPointsNotification(8, 'generar instrucciones claras')
    
  }

  const handleInputChange = (field: keyof InstructionsFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEditedContent(e.currentTarget.innerHTML)
  }

  const generatePDF = async (jsPDF: any) => {
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
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Título y encabezado
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Instrucciones para: ${formData.topic}`, marginLeft, marginTop);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nivel: ${formData.course}`, marginLeft, marginTop + 10);
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido de las instrucciones
      let yPos = marginTop + 25;
      const lines = editedContent.split('\n');
      
      for (const line of lines) {
        if (yPos > 270) {  // Nueva página si nos acercamos al final
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

      // Metadatos
      pdf.setProperties({
        title: `Instrucciones - ${formData.topic}`,
        subject: formData.course,
        author: 'Generador de Instrucciones Claras',
      });

      // Guardar PDF
      pdf.save(`instrucciones-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Instrucciones exportadas exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar las instrucciones");
      throw error;
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay instrucciones para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Instrucciones Claras: ${formData.topic}`,
        `instrucciones-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareInstructions = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Instrucciones para ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Instrucciones copiadas al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir las instrucciones");
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
      <LazyLoadedPage>
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
                <h1 className="text-xl font-semibold">Instrucciones Claras</h1>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Guía para Crear Instrucciones Claras</DialogTitle>
                      <DialogDescription>
                        <div className="space-y-4 mt-4">
                          <div>
                            <h3 className="font-medium">Elementos de Instrucciones Efectivas:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Objetivos de aprendizaje claros</li>
                              <li>Pasos secuenciales y lógicos</li>
                              <li>Lenguaje apropiado para el nivel</li>
                              <li>Ejemplos y demostraciones</li>
                              <li>Criterios de evaluación</li>
                              <li>Tiempo estimado</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium">Tips de Redacción:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Usa verbos de acción específicos</li>
                              <li>Divide en pasos manejables</li>
                              <li>Incluye ejemplos prácticos</li>
                              <li>Proporciona retroalimentación</li>
                              <li>Considera diferentes estilos de aprendizaje</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium">Estructura Recomendada:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Introducción y objetivos</li>
                              <li>Materiales necesarios</li>
                              <li>Pasos detallados</li>
                              <li>Ejemplos y demostraciones</li>
                              <li>Criterios de evaluación</li>
                              <li>Consejos y sugerencias</li>
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
                    onClick={shareInstructions}
                    disabled={!editedContent}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </Button>
                  {instructions && (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      onClick={openChatModal}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Mejorar con IA
                    </Button>
                  )}
                {instructions && (
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
              {instructions ? (
                <TypingEffect 
                  content={instructions}
                  isLoading={loading}
                  onContentChange={handleContentChange}
                  loadingMessage="Generando instrucciones..."
                  typingMessage="Escribiendo instrucciones..."
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
                >
                  <FileText className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay instrucciones generadas</p>
                  <p className="text-center text-sm">
                    Completa el formulario de la derecha y genera instrucciones claras para tus estudiantes.
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
              className="bg-white rounded-lg border shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-6">Generador de Instrucciones</h2>
              
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
                      placeholder="Ej: Instrucciones para maqueta del sistema solar"
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
                      <Label htmlFor="topic">Actividad o tema *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Describe la actividad o tema para el que necesitas instrucciones.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => handleInputChange("topic", e.target.value)}
                      placeholder="Ej: Creación de maqueta del sistema solar: Construcción de un modelo a escala con materiales reciclables"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <div className="flex items-center gap-2">
                      <Label htmlFor="course">Nivel educativo *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Especifica el nivel educativo para adaptar las instrucciones.</p>
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
                          value={formData.customGrade || ""}
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
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Label htmlFor="isPublic">Compartir con la comunidad de profesores</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Al marcar esta opción, tus instrucciones serán visibles para otros profesores en la comunidad.</p>
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
                    loadingText="Generando instrucciones..."
                    disabled={loading || !formData.topic || !formData.course}
                    type="submit"
                    className="w-full"
                    size="lg"
                  >
                    Generar Instrucciones
                  </LoadingButton>
                </motion.div>
              </motion.form>
            </motion.div>

            {/* Botón para ver la previsualización en móvil */}
            {instructions && (
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
                  Ver Instrucciones
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Modal para previsualización en móvil */}
          <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Instrucciones Claras</DialogTitle>
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
                  contentEditable
                  onInput={handleContentChange}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />

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
                    onClick={shareInstructions}
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
              localStorage.removeItem('instruccionesChatState')
            }}
            currentContent={getCurrentContent()}
            onContentUpdate={handleContentUpdate}
            title="Asistente de Mejora de Instrucciones Claras"
            description="Solicita mejoras específicas para tus instrucciones. El asistente te ayudará a optimizar la claridad, estructura y efectividad de las instrucciones."
            suggestions={[
              "Mejora la claridad de los pasos",
              "Añade más ejemplos específicos",
              "Incluye criterios de evaluación",
              "Mejora la estructura secuencial",
              "Añade consejos de seguridad",
              "Incluye adaptaciones para diferentes niveles"
            ]}
            localStorageKey="instruccionesChatState"
            isSlidesMode={false}
          />
        </motion.div>
        <Toaster />
      </LazyLoadedPage>
    </Layout>
    </>
  )
} 