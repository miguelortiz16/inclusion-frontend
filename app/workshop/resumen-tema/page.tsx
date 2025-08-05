"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import { Input } from "@/components/ui/input"
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
interface ResumenFormData {
  topic: string;
  level: string;
  name: string;
  isPublic: boolean;
  grade: string;
  customGrade: string;
}

interface SummaryContent {
  introduction: string;
  mainPoints: string[];
  conclusion: string;
}

export default function ResumenTema() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<ResumenFormData>({
    topic: "",
    level: "",
    name: "",
    isPublic: false,
    grade: "",
    customGrade: ""
  })
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el resumen
  useEffect(() => {
    if (summary) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('resumenFromChat')
      if (!isFromChat) {
        localStorage.removeItem('resumenChatState')
        console.log('Resumen generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('resumenFromChat')
      }
    }
  }, [summary])

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
    localStorage.removeItem('resumenChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Si hay contenido editado, usarlo; si no, usar el resumen original
    return editedContent || summary
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('resumenFromChat', 'true')
      
      // Actualizar el resumen con el nuevo contenido
      setSummary(newContent)
      setEditedContent(newContent)
      toast.success("Resumen actualizado exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el resumen.")
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
      const topicRequest = {
        email: email,
        isPublic: formData.isPublic,
        grade: formData.level === "otro" ? formData.customGrade : formData.level,
        theme: formData.topic,
        topic: "tema: " + formData.topic+" Grado/Nivel educativo: "+(formData.level === "otro" ? formData.customGrade : formData.level)
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/resumen-tema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el resumen')
      }

      const data = await response.text()
      setSummary(data)
      handleContentChange(data)
      toast.success("Resumen generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo resumen
      localStorage.removeItem('resumenChatState')

      // Mostrar modal automáticamente en móvil
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el resumen")
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
          // Agregar puntos por generar un resumen
          await gamificationService.addPoints(email, 5, 'summary_generation')
          showPointsNotification(5, 'generar un resumen')
    
  }

  const handleInputChange = (field: keyof ResumenFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content);
  };

  const exportToPDF = async () => {
    if (!editedContent) return;

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

      // Agregar información del resumen
      let yPos = marginTop;
      
      // Nombre del resumen
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Nombre: ${formData.name}`, marginLeft, yPos);
      yPos += 10;

      // Nivel educativo
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Nivel: ${formData.level}`, marginLeft, yPos);
      yPos += 15;

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, yPos, pageWidth - marginRight, yPos);
      yPos += 10;

      // Contenido del resumen
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
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

        const splitText = pdf.splitTextToSize(line, contentWidth);
        pdf.text(splitText, marginLeft, yPos);
        yPos += (splitText.length * 6) + 3;
      }

      // Guardar el PDF
      pdf.save(`${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Resumen exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el resumen");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error("No hay contenido para exportar");
      return;
    }

    try {
      const filename = formData.name.toLowerCase().replace(/\s+/g, '-');
      const content = `Nombre: ${formData.name}\nNivel: ${formData.level}\n\n${editedContent}`;
      
      await exportToWord(content, '', filename);
      toast.success("Resumen exportado a Word exitosamente");
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error("Error al exportar a Word");
    }
  };

  const shareSummary = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Resumen - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Resumen copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el resumen");
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
              <h1 className="text-xl font-semibold">Generador de Resúmenes</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Generar Resúmenes</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Resúmenes:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas relevantes para tu currículo</li>
                            <li>Adapta el nivel de complejidad según el grado</li>
                            <li>Incluye conceptos clave y ejemplos</li>
                            <li>Mantén un lenguaje claro y conciso</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>La Segunda Guerra Mundial</li>
                            <li>El Sistema Solar</li>
                            <li>La Fotosíntesis</li>
                            <li>Las Fracciones</li>
                            <li>La Revolución Industrial</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para el Contenido:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Incluye una introducción clara</li>
                            <li>Destaca los puntos principales</li>
                            <li>Usa ejemplos prácticos</li>
                            <li>Agrega una conclusión significativa</li>
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
                disabled={!summary}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!summary}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar a Word
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareSummary}
                disabled={!summary}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {summary && (
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

          {summary ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              ref={previewRef}
              className="min-h-[500px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-6 text-gray-700 whitespace-pre-wrap font-sans"
              contentEditable
              onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
              suppressContentEditableWarning
            >
              {summary}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-2">No hay resumen generado</p>
              <p className="text-center text-sm">
                Configura el tema en el panel derecho y genera un resumen automáticamente.
              </p>
            </motion.div>
          )}
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
              Generador de Resúmenes
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
                    <Label htmlFor="topic">Tema</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema principal del resumen. Incluye conceptos clave y contexto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder={`Ej: "La Segunda Guerra Mundial fue un conflicto global que ocurrió entre 1939 y 1945. Incluye conceptos clave como el Holocausto, el Día D, y la Guerra Fría."`}
                    required
                    maxLength={5000}
                    className="min-h-[100px] resize-none font-['Arial']"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/5000</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="level">Nivel Educativo</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar el contenido del resumen.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    required
                  >
                  
                    <option value="">Selecciona un nivel</option>
                    <option value="otro">Otro (especificar)</option>
                    <option value="infantil">Educación Infantil</option>
                    <option value="Grado-1">Grado 1</option>
                    <option value="Grado-2">Grado 2</option>
                    <option value="Grado-3">Grado 3</option>
                    <option value="Grado-4">Grado 4</option>
                    <option value="Grado-5">Grado 5</option>
                    <option value="Grado-6">Grado 6</option>
                    <option value="Grado-7">Grado 7</option>
                    <option value="Grado-8">Grado 8</option>
                    <option value="Grado-9">Grado 9</option>
                    <option value="Grado-10">Grado 10</option>
                    <option value="Grado-11">Grado 11</option>
                    <option value="universidad">Universidad</option>
                   
                  </select>
                  {formData.level === "otro" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.customGrade}
                        onChange={(e) => setFormData({ ...formData, customGrade: e.target.value })}
                        placeholder="Escribe el nivel educativo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Resumen *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar fácilmente este resumen.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Resumen de la Segunda Guerra Mundial - Secundaria"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
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
                          <p>Al marcar esta opción, tu resumen será visible para otros educadores en la comunidad.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="flex gap-2"
              >
                <Button 
                  type="submit" 
                  disabled={loading || !formData.topic || !formData.level || !formData.name} 
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
                    setFormData({ topic: "", level: "", name: "", isPublic: false, grade: "", customGrade: "" })
                    setSummary("")
                    setEditedContent("")
                  }}
                >
                  Limpiar
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>

          {summary && (
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
          <DialogContent className="max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
              <DialogTitle>Previsualización del Resumen</DialogTitle>
            </DialogHeader>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
              {/* Editor toolbar */}
              <div className="border-b pb-3 mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <select className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-sm bg-white w-full sm:w-auto">
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

              {/* Content Area */}
              <div className="relative" ref={previewRef}>
                {summary ? (
                  <div
                    className="min-h-[300px] sm:min-h-[400px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-gray-700 whitespace-pre-wrap font-sans"
                    contentEditable
                    onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                    suppressContentEditableWarning
                  >
                    {summary}
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-8 sm:p-16 flex flex-col items-center justify-center text-gray-500">
                    <LightbulbIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 text-gray-300" />
                    <p className="text-center mb-2">No hay resumen generado</p>
                    <p className="text-center text-sm">
                      Configura el tema en el panel derecho y genera un resumen automáticamente.
                    </p>
                  </div>
                )}
              </div>

              {/* Export buttons in modal */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                  onClick={exportToPDF}
                  disabled={!summary}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a PDF
                </Button>

                <Button
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                  onClick={handleExportWord}
                  disabled={!summary}
                >
                  <FileText className="w-4 h-4" />
                  Exportar a Word
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={shareSummary}
                  disabled={!summary}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {summary && (
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
            localStorage.removeItem('resumenChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Resúmenes"
          description="Solicita mejoras específicas para tu resumen. El asistente te ayudará a optimizar la estructura, claridad y contenido del resumen."
          suggestions={[
            "Mejora la claridad del contenido",
            "Añade más ejemplos prácticos",
            "Incluye conceptos clave adicionales",
            "Mejora la estructura del resumen",
            "Añade una conclusión más sólida",
            "Simplifica el lenguaje para el nivel educativo"
          ]}
          localStorageKey="resumenChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 