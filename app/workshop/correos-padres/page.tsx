"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, Mail, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Loading } from "@/components/ui/loading"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"

interface ParentEmailFormData {
  topic: string;
  strengths: string;
  improvements: string;
  gradeLevel: string;
  name: string;
  course: string;
  isPublic: boolean;
  customGrade?: string;
}

export default function ParentEmailGenerator() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<ParentEmailFormData>({
    topic: "",
    strengths: "",
    improvements: "",
    gradeLevel: "",
    name: "",
    course: "",
    isPublic: false
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el correo
  useEffect(() => {
    if (email) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('correosPadresFromChat')
      if (!isFromChat) {
        localStorage.removeItem('correosPadresChatState')
        console.log('Correo para padres generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('correosPadresFromChat')
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
    localStorage.removeItem('correosPadresChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual del correo para padres
    return email || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('correosPadresFromChat', 'true')
      
      // Actualizar el contenido del correo para padres
      setEmail(newContent)
      setEditedContent(newContent)
      toast.success("Correo para padres actualizado exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el correo para padres.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const emailUser = localStorage.getItem('email')
    
    if (!emailUser) {
      toast.error("Por favor, inicia sesión para continuar")
      setLoading(false)
      return
    }

    if (!emailUser) {
      toast.error("No se encontró el email del usuario")
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

    try {
      const topicRequest = {
        name: formData.name,
        topic: "Nombre del estudiante: "+formData.topic+" Áreas donde el estudiante sobresale: "+formData.strengths+" Áreas donde el estudiante necesita mejorar: "+formData.improvements+" Nivel de Grado: "+(formData.gradeLevel === "otro" ? formData.customGrade : formData.gradeLevel),
        email: emailUser,
        isPublic: formData.isPublic,
        theme: formData.name,
        grade: formData.gradeLevel === "otro" ? formData.customGrade : formData.gradeLevel
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-correo-para-padres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el correo')
      }

      const data = await response.text()
      setEmail(data)
      setEditedContent(data)
      toast.success("Correo generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo correo
      localStorage.removeItem('correosPadresChatState')

      // Agregar puntos por generar correo para padres
      await gamificationService.addPoints(emailUser, 8, 'parent_email_generation')
      showPointsNotification(8, 'generar un correo para padres')

      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el correo")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ParentEmailFormData, value: string) => {
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
      pdf.text(`Correo para Padres: ${formData.topic}`, marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido del correo
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
        title: `Correo para Padres - ${formData.topic}`,
        subject: 'Comunicación con Padres',
        author: 'Generador de Correos',
      });

      // Guardar el PDF
      pdf.save(`correo-padres-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Correo exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el correo");
    }
  };

  const exportToWord = async () => {
    try {
      const content = editedContent;
      const blob = new Blob([content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `correo-padres-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Correo exportado a Word exitosamente");
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error("Error al exportar el correo a Word");
    }
  };

  const shareEmail = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Correo para Padres - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Correo copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el correo");
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
              <h1 className="text-xl font-semibold">Generador de Correos para Padres</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Redacción de Correos a Padres</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Estructura del Correo:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Saludo personalizado y cordial</li>
                            <li>Reconocimiento de fortalezas del estudiante</li>
                            <li>Áreas de mejora identificadas</li>
                            <li>Recomendaciones específicas</li>
                            <li>Invitación a la colaboración</li>
                            <li>Despedida profesional</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips de Redacción:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Usa un tono constructivo y positivo</li>
                            <li>Destaca los logros del estudiante</li>
                            <li>Proporciona ejemplos concretos</li>
                            <li>Sugiere acciones específicas</li>
                            <li>Mantén un enfoque colaborativo</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Aspectos a Considerar:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Nivel de desarrollo del estudiante</li>
                            <li>Contexto familiar y cultural</li>
                            <li>Objetivos de aprendizaje</li>
                            <li>Estrategias de apoyo</li>
                            <li>Recursos disponibles</li>
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
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-blue-600"
                onClick={exportToWord}
                disabled={!editedContent}
              >
                <FileDown className="w-4 h-4" />
                Exportar a Word
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 hover:text-white border-red-600"
                onClick={exportToPDF}
                disabled={!editedContent}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
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

          {loading ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="border border-dashed rounded-lg p-16"
            >
              <Loading text="Generando correo para los padres..." />
            </motion.div>
          ) : email ? (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
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
                transition={{ duration: 0.5, delay: 0.8 }}
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
              transition={{ duration: 0.5, delay: 0.9 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <Mail className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-2">No hay correo generado</p>
              <p className="text-center text-sm">
                Completa el formulario en el panel derecho y genera un correo profesional para los padres.
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
                    <Label htmlFor="name">Nombre del Correo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar este correo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Comunicación sobre Progreso Académico - Segundo Trimestre"
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
                    <Label htmlFor="topic">Nombre del Estudiante *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa el nombre completo del estudiante.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Juan Carlos Pérez Martínez"
                    required
                    maxLength={360}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/360</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="strengths">Áreas donde el estudiante sobresale/muestra potencial *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe las fortalezas y habilidades destacadas del estudiante.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="strengths"
                    value={formData.strengths}
                    onChange={(e) => handleInputChange("strengths", e.target.value)}
                    placeholder="Ej: Juan demuestra excelentes habilidades en matemáticas, especialmente en resolución de problemas. Su participación en clase es activa y constructiva, mostrando gran interés por aprender."
                    required
                    maxLength={360}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.strengths.length}/360</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="improvements">Áreas donde el estudiante necesita mejorar *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Identifica las áreas de oportunidad y sugiere estrategias de mejora.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="improvements"
                    value={formData.improvements}
                    onChange={(e) => handleInputChange("improvements", e.target.value)}
                    placeholder="Ej: Juan necesita mejorar su organización en las tareas y la presentación de trabajos. Se sugiere implementar una agenda de actividades y establecer rutinas de estudio."
                    required
                    maxLength={360}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.improvements.length}/360</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="gradeLevel">Nivel de Grado *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo del estudiante.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) => handleInputChange("gradeLevel", value)}
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
                  {formData.gradeLevel === "otro" && (
                    <div className="mt-2">
                      <Input
                        value={formData.customGrade}
                        onChange={(e) => handleInputChange("customGrade", e.target.value)}
                        placeholder="Escribe el nivel educativo"
                        required
                      />
                    </div>
                  )}
                </motion.div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Curso
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Matemáticas 3º ESO"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>Compartir con la comunidad de profesores</span>
                  </label>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex gap-2"
              >
                <Button type="submit" disabled={loading} className="flex-1" size="lg">
                  {loading ? "Generando..." : "Generar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  size="lg"
                  onClick={() => {
                    setFormData({
                      topic: "",
                      strengths: "",
                      improvements: "",
                      gradeLevel: "",
                      name: "",
                      course: "",
                      isPublic: false
                    })
                    setEmail("")
                    setEditedContent("")
                  }}
                >
                  Limpiar
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Botón para ver la previsualización en móvil */}
          {email && (
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
                Ver Correo
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal para previsualización en móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Correo para Padres</DialogTitle>
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
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-blue-600"
                  onClick={exportToWord}
                  disabled={!editedContent}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a Word
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 hover:text-white border-red-600"
                  onClick={exportToPDF}
                  disabled={!editedContent}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a PDF
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
            localStorage.removeItem('correosPadresChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Correos para Padres"
          description="Solicita mejoras específicas para tu correo a padres. El asistente te ayudará a optimizar el tono, claridad y efectividad de la comunicación con las familias."
          suggestions={[
            "Mejora el tono constructivo y positivo",
            "Añade más ejemplos específicos",
            "Incluye estrategias de apoyo concretas",
            "Mejora la estructura del correo",
            "Añade información de contacto",
            "Incluye un saludo más personalizado"
          ]}
          localStorageKey="correosPadresChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
}

