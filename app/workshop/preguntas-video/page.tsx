"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, FileText, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, Youtube, Copy } from "lucide-react"
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
import { API_ENDPOINTS, getEndpointUrl } from "@/config/api"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
interface VideoFormData {
  transcription: string;
  gradeLevel: string;
  questionType: string;
  questionCount: string;
  name: string;
  isPublic: boolean;
}

interface VideoContent {
  questions: string;
  answers: string;
}

export default function VideoQuestions() {
  const [formData, setFormData] = useState<VideoFormData>({
    transcription: "",
    gradeLevel: "12",
    questionType: "multiple",
    questionCount: "3",
    name: "",
    isPublic: false
  })
  const [content, setContent] = useState<VideoContent>({
    questions: "",
    answers: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoadingState('generating')

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        setIsLoading(false)
        setLoadingState('idle')
        return
      }
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setIsLoading(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  return // Detener el flujo
}

      const response = await fetch(getEndpointUrl('generateVideoQuestions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic:+" grado academico:"+formData.gradeLevel+" tipo de pregunta:"+formData.questionType+" numero de preguntas:"+formData.questionCount+ "Transcripción de YouTube:" + formData.transcription,
          name: formData.name,
          email: email,
          isPublic: formData.isPublic,
          theme: formData.name,
          grade: formData.gradeLevel
        }),
      })

      if (!response.ok) {
        throw new Error('Error al generar las preguntas')
      }

      const responseText = await response.text()
      
      let questions = responseText
      let answers = ""
      
      const answersIndex = responseText.indexOf("RESPUESTAS:")
      if (answersIndex !== -1) {
        questions = responseText.substring(0, answersIndex).trim()
        answers = responseText.substring(answersIndex).trim()
      } else {
        questions = responseText
      }
      
      setContent({
        questions: questions,
        answers: answers
      })
      setEditedContent(questions)
      setLoadingState('typing')
      toast.success("Preguntas generadas exitosamente")


      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar las preguntas")
      setLoadingState('idle')
    } finally {
      setIsLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
          // Agregar puntos por generar preguntas de video
          await gamificationService.addPoints(email, 6, 'video_questions_generation')
          showPointsNotification(6, 'generar preguntas de video')
    
  }

  const handleExportPDF = async () => {
    if (!contentRef.current) return

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
      pdf.text(`${formData.name || "Preguntas de Video de YouTube"}`, marginLeft, marginTop);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Grado: ${formData.gradeLevel}`, marginLeft, marginTop + 10);
      pdf.text(`Tipo: ${formData.questionType}`, marginLeft, marginTop + 16);
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 20, pageWidth - marginRight, marginTop + 20);

      // Contenido de las preguntas
      let yPos = marginTop + 30;
      const lines = editedContent.split('\n');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
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

        const splitText = pdf.splitTextToSize(line, contentWidth);
        pdf.text(splitText, marginLeft, yPos);
        yPos += (splitText.length * 6) + 3;
      }

      // Agregar respuestas en una nueva página
      pdf.addPage();
      yPos = marginTop;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Respuestas`, marginLeft, yPos);
      yPos += 10;
      
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, yPos, pageWidth - marginRight, yPos);
      yPos += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const answerLines = content.answers.split('\n');
      for (const line of answerLines) {
        if (yPos > pageHeight - marginTop - 20) {
          addLogoToFooter(pdf);
          pdf.addPage();
          yPos = marginTop;
        }

        if (line.trim() === '') {
          yPos += 5;
          continue;
        }

        const splitText = pdf.splitTextToSize(line, contentWidth);
        pdf.text(splitText, marginLeft, yPos);
        yPos += (splitText.length * 6) + 3;
      }

      // Agregar el logo en el footer de la última página
      addLogoToFooter(pdf);

      // Guardar PDF
      pdf.save(`preguntas-video.pdf`);
      toast.success("Preguntas exportadas exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar las preguntas");
    }
  }

  const handleExportWord = () => {
    if (!editedContent) {
      toast.error('No hay preguntas para exportar');
      return;
    }

    try {
      const wordContent = `
        ${formData.name || "Preguntas de Video de YouTube"}
        
        Nivel de grado: ${formData.gradeLevel}
        Tipo de pregunta: ${formData.questionType}
        Número de preguntas: ${formData.questionCount}
        
        PREGUNTAS:
        ${editedContent}
        
        RESPUESTAS:
        ${content.answers}
      `;
      
      // Use the provided name or a default for the filename
      const filename = formData.name 
        ? formData.name.toLowerCase().replace(/\s+/g, '-')
        : 'preguntas-video';
        
      exportToWord(wordContent, filename, formData.name || 'Preguntas de Video de YouTube');
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareContent = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Preguntas de Video de YouTube`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Preguntas copiadas al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir las preguntas");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      toast.success("Preguntas copiadas al portapapeles");
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error("Error al copiar las preguntas");
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
            <h1 className="text-xl font-semibold">Preguntas de Video de YouTube</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={handleExportPDF}
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
                onClick={shareContent}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </div>
          </motion.div>

          {/* Typing Effect Content Area */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative" 
            ref={contentRef}
          >
            {content.questions ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <TypingEffect 
                  content={content.questions}
                  isLoading={loadingState === 'generating'}
                  onContentChange={setEditedContent}
                  loadingMessage="Generando preguntas..."
                  typingMessage="Escribiendo preguntas..."
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <Youtube className="w-12 h-12 mb-4 text-red-500" />
                <p className="text-center mb-2">No hay preguntas generadas</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar preguntas basadas en un video de YouTube.
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-between items-center mb-6"
            >
              <h2 className="text-xl font-semibold">Preguntas de Video de YouTube</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Preguntas de Video de YouTube</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <p>Genera preguntas orientadoras alineadas a un video de YouTube.</p>
                        <div>
                          <h3 className="font-medium">Cómo usar esta herramienta:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Ingresa la transcripción del video de YouTube</li>
                            <li>Selecciona el nivel de grado apropiado</li>
                            <li>Elige el tipo de preguntas que necesitas</li>
                            <li>Indica cuántas preguntas quieres generar</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">¿Cómo obtener una transcripción?</h3>
                          <p className="mt-1 text-sm">
                            Puedes obtener la transcripción de un video directamente desde YouTube activando los subtítulos 
                            automáticos y exportándolos, o usando herramientas de transcripción en línea.
                          </p>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Nombre del conjunto de preguntas: *</Label>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Preguntas sobre evolución celular"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gradeLevel">Nivel de grado: *</Label>
                  </div>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) => handleSelectChange("gradeLevel", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona el grado" />
                    </SelectTrigger>
                    <SelectContent>

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
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="questionType">Tipo de Pregunta: *</Label>
                  </div>
                  <Select
                    value={formData.questionType}
                    onValueChange={(value) => handleSelectChange("questionType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple">Opción múltiple</SelectItem>
                      <SelectItem value="desarrollo">Desarrollo</SelectItem>
                      <SelectItem value="verdadero_falso">Verdadero/Falso</SelectItem>
                      <SelectItem value="completar">Completar</SelectItem>
                      <SelectItem value="asociar">Asociar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="questionCount">Número de Preguntas: *</Label>
                  </div>
                  <Select
                    value={formData.questionCount}
                    onValueChange={(value) => handleSelectChange("questionCount", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona la cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transcription">Transcripción de YouTube: *</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-blue-500 text-sm hover:underline"
                        >
                          ¿Cómo obtengo una transcripción?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Transcripciones de YouTube</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <h3 className="font-semibold text-lg">¿Por qué ya no puedo generar directamente desde URLs de YouTube?</h3>
                          <p className="text-sm text-gray-600">
                            Debido a las actualizadas pautas de privacidad y cumplimiento de YouTube, <strong className="font-medium text-gray-800">ya no se permite generar contenido con IA directamente desde URLs de YouTube</strong> y, por lo tanto, no es compatible con ProfePlanner. Si YouTube cambia sus políticas y encontramos una forma segura de hacerlo, nos aseguraremos de que vuelva a estar en la plataforma lo antes posible.
                          </p>
                          
                          <h3 className="font-semibold text-lg mt-4">Solución alternativa</h3>
                          <p className="text-sm text-gray-600">
                            Como educador individual, se le permite obtener la transcripción manualmente e integrarla en nuestras herramientas para generar preguntas para uso personal.
                          </p>
                          
                          <h3 className="font-semibold text-lg mt-4">Para obtener una transcripción de un video de YouTube, puede usar la función de transcripción integrada de YouTube:</h3>
                          
                          <h4 className="font-medium mt-2">Pasos</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            <li>Abre el video que deseas transcribir en YouTube.</li>
                            <li>Haz clic en '...más' debajo del título del video en el cuadro de descripción.</li>
                            <li>Haz clic en el botón <strong className="font-medium">Mostrar transcripción</strong> en el cuadro de descripción debajo del título del video.</li>
                            <li>La transcripción aparecerá en el lado derecho del video.</li>
                            <li>Resalta el texto completo, haz clic derecho y cópialo.</li>
                            <li>Pégalo en el campo de Transcripción de YouTube de ProfePlanner.</li>
                          </ol>
                          
                          <div className="mt-4 space-y-4">
                            <p className="text-sm text-gray-600">Localiza el botón '...más' y luego 'Mostrar transcripción':</p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              <div className="relative w-full sm:w-1/2 border rounded-md overflow-hidden">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="w-full h-full cursor-zoom-in focus:outline-none">
                                      <Image 
                                        src="/images/youtube-transcript-1.png"
                                        alt="Paso 1 para mostrar transcripción de YouTube: Botón ...más"
                                        width={300} 
                                        height={150} 
                                        layout="responsive"
                                        className="object-contain"
                                      />
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent border-none shadow-none">
                                    <Image 
                                      src="/images/youtube-transcript-1.png"
                                      alt="Paso 1 para mostrar transcripción de YouTube: Botón ...más - Ampliada"
                                      width={1200} 
                                      height={675}
                                      className="object-contain w-full h-auto rounded-md"
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <div className="relative w-full sm:w-1/2 border rounded-md overflow-hidden">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="w-full h-full cursor-zoom-in focus:outline-none">
                                      <Image 
                                        src="/images/youtube-transcript-2.png"
                                        alt="Paso 2 para mostrar transcripción de YouTube: Botón Mostrar transcripción"
                                        width={300} 
                                        height={150} 
                                        layout="responsive"
                                        className="object-contain"
                                      />
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent border-none shadow-none">
                                    <Image 
                                      src="/images/youtube-transcript-2.png"
                                      alt="Paso 2 para mostrar transcripción de YouTube: Botón Mostrar transcripción - Ampliada"
                                      width={1200} 
                                      height={675}
                                      className="object-contain w-full h-auto rounded-md"
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Textarea
                    id="transcription"
                    name="transcription"
                    value={formData.transcription}
                    onChange={handleInputChange}
                    placeholder="Pega aquí la transcripción del video..."
                    required
                    className="mt-1 min-h-[200px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isPublic: e.target.checked
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="isPublic" className="text-sm text-gray-700">
                    Compartir con la comunidad de profesores
                  </Label>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando preguntas..."
                  disabled={isLoading || !formData.transcription}
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  Generar
                </LoadingButton>
              </motion.div>
            </motion.form>

            {/* Botón para ver la previsualización en móvil */}
            {content.questions && (
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
                  Ver Preguntas
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Modal para previsualización en móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="fixed inset-0 flex flex-col h-[90vh] w-screen sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0 m-0 sm:m-4">
            <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-white z-10 border-b">
              <DialogTitle>Preguntas de Video</DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto px-6 py-4 focus:outline-none border border-dashed border-gray-300 rounded-lg mx-6 text-gray-700 whitespace-pre-wrap font-sans"
                contentEditable
                onInput={(e) => setEditedContent(e.currentTarget.innerHTML)}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editedContent }}
                style={{ 
                  minHeight: 'calc(90vh - 200px)',
                  maxHeight: 'calc(90vh - 200px)',
                  overflowY: 'auto'
                }}
              />

              <div className="flex flex-wrap gap-2 justify-center sm:justify-end sticky bottom-0 bg-white px-6 py-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                  onClick={handleExportPDF}
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
                  onClick={copyToClipboard}
                  disabled={!editedContent}
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={shareContent}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 