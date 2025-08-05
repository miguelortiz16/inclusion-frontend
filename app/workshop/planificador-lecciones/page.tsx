"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
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
import { useLanguage } from "@/app/contexts/LanguageContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface LessonPlanFormData {
  topic: string;
  grade: string;
  subject: string;
  duration: string;
  objectives: string;
  name: string;
  methodology?: string[];
  customSubject?: string;
  isPublic: boolean;
  customGrade?: string;
  customMethodology?: string;
}

export default function LessonPlanBuilder() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [lessonPlan, setLessonPlan] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el plan de lección
  useEffect(() => {
    if (lessonPlan) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('lessonPlanFromChat')
      if (!isFromChat) {
        localStorage.removeItem('lessonPlanChatState')
        console.log('Plan de lección generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('lessonPlanFromChat')
      }
    }
  }, [lessonPlan])
  const [formData, setFormData] = useState<LessonPlanFormData>({
    topic: "",
    grade: "",
    subject: "",
    duration: "45",
    objectives: "",
    name: "",
    methodology: [],
    customSubject: "",
    isPublic: false,
    customGrade: "",
    customMethodology: "",
  })


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
    localStorage.removeItem('lessonPlanChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Si hay contenido editado, usarlo; si no, usar el plan de lección original
    return editedContent || lessonPlan
  }

  const handleContentUpdate = (newContent: string) => {
    // Marcar que el cambio viene del chat
    sessionStorage.setItem('lessonPlanFromChat', 'true')
    
    setEditedContent(newContent)
    setLessonPlan(newContent)
  }

  const handleMethodologyChange = (value: string) => {
    setFormData(prev => {
      const currentMethodologies = prev.methodology || [];
      if (value === "otro") {
        // Si se selecciona "otro", lo agregamos si no está ya
        return {
          ...prev,
          methodology: currentMethodologies.includes("otro") ? currentMethodologies : [...currentMethodologies, "otro"]
        };
      } else {
        // Para otras opciones, alternamos su presencia
        const newMethodologies = currentMethodologies.includes(value)
          ? currentMethodologies.filter(m => m !== value)
          : [...currentMethodologies, value];
        return {
          ...prev,
          methodology: newMethodologies
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')

    try {
      const topic = `Crea un plan de lección detallado para enseñar ${formData.topic} con las siguientes especificaciones:
- Nivel educativo: ${formData.grade === "otro" ? formData.customGrade : formData.grade}° año
- Materia: ${formData.subject === "otro" ? formData.customSubject : formData.subject}
- Duración: ${formData.duration} minutos
- Objetivos específicos: ${formData.objectives}
${formData.methodology && formData.methodology.length > 0 ? `- Metodologías: ${formData.methodology.map(m => m === "otro" ? formData.customMethodology : m).join(", ")}
  ${formData.methodology.map(m => {
    switch(m) {
      case "Clase magistral": return "El profesor presenta el contenido de manera directa, mientras los estudiantes asimilan y toman notas.";
      case "Aprendizaje activo": return "Los estudiantes participan activamente, realizando actividades prácticas y proyectos colaborativos.";
      case "Aprendizaje práctico": return "Muestra cómo el contenido se aplica a profesiones reales, preparándolos para los desafíos del mercado.";
      case "Aprendizaje social y emocional": return "Combina contenido escolar con habilidades socioemocionales, como la empatía y el trabajo en equipo.";
      case "Aprendizaje Basado en Casos": return "Los estudiantes analizan situaciones reales o simuladas para desarrollar habilidades de análisis y resolución de problemas.";
      case "Aprendizaje Basado en Indagación": return "Los estudiantes investigan y exploran activamente para construir su propio conocimiento.";
      case "Aprendizaje Basado en Investigación": return "Los estudiantes desarrollan proyectos de investigación para profundizar en temas específicos.";
      case "Aprendizaje Basado en Problemas": return "Los estudiantes resuelven problemas complejos del mundo real para desarrollar habilidades prácticas.";
      case "Aprendizaje Basado en Proyectos": return "Los estudiantes desarrollan proyectos extensos que integran múltiples áreas de conocimiento.";
      case "Aprendizaje Basado en Retos": return "Los estudiantes enfrentan desafíos reales que requieren soluciones innovadoras.";
      case "Aprendizaje Colaborativo": return "Los estudiantes trabajan en equipo para lograr objetivos comunes y desarrollar habilidades sociales.";
      case "Aprendizaje Invertido": return "Los estudiantes revisan el contenido teórico en casa y realizan actividades prácticas en clase.";
      case "Design Thinking": return "Los estudiantes utilizan un proceso creativo para resolver problemas y generar soluciones innovadoras.";
      case "Gamificación": return "Se utilizan elementos de juego para motivar y hacer más atractivo el proceso de aprendizaje.";
      case "DUA: Diseño Universal para el Aprendizaje": return "El DUA es una metodología que se centra en la creación de experiencias educativas inclusivas y accesibles para todos los estudiantes, independientemente de sus capacidades o necesidades especiales.";
      case "otro": return formData.customMethodology ;
      default: return "";
    }
  }).join("\n  ")}` : ''}`
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

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-plan-de-leccion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic, 
          name: formData.name, 
          email: email,
          isPublic: formData.isPublic,
          grade: formData.grade,
          subject: formData.subject,
          theme: formData.topic,

        })
      })

      if (!response.ok) {
        throw new Error('Error al generar el plan de lección')
      }

      const data = await response.text()
      setLessonPlan(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Plan de lección generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo plan de lección
      localStorage.removeItem('lessonPlanChatState')
      

      
      // En móvil, mostrar el modal de previsualización
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el plan de lección")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
          // Agregar puntos por crear el plan de lección
          if (email) {
            await gamificationService.addPoints(email, 10, 'lesson_plan_creation')
            showPointsNotification(10, 'crear un plan de lección')
          }
  }

  const handleInputChange = (field: keyof LessonPlanFormData, value: string | boolean) => {
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
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Título y encabezado
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Plan de Lección: ${formData.topic}`, marginLeft, marginTop);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nivel: ${formData.grade}° año`, marginLeft, marginTop + 10);
      pdf.text(`Materia: ${formData.subject}`, marginLeft, marginTop + 15);
      pdf.text(`Duración: ${formData.duration} minutos`, marginLeft, marginTop + 20);
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 25, pageWidth - marginRight, marginTop + 25);

      // Contenido del plan
      let yPos = marginTop + 35;
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
        title: `Plan de Lección - ${formData.topic}`,
        subject: formData.subject,
        author: 'Generador de Planes de Lección',
      });

      // Guardar PDF
      pdf.save(`plan-leccion-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Plan de lección exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el plan de lección");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay plan de lección para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Plan de Lección: ${formData.topic}`,
        `plan-leccion-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareLessonPlan = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Plan de Lección - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Plan de lección copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el plan de lección");
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
            <h1 className="text-xl font-semibold">{t('lessonPlanner.title')}</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!editedContent}
              >
                <FileDown className="w-4 h-4" />
                {t('lessonPlanner.buttons.exportToPDF')}
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!editedContent}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('lessonPlanner.buttons.exportToWord')}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareLessonPlan}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                {t('lessonPlanner.buttons.share')}
              </Button>
              {lessonPlan && (
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
              <option>{t('lessonPlanner.editor.paragraph')}</option>
              <option>{t('lessonPlanner.editor.heading1')}</option>
              <option>{t('lessonPlanner.editor.heading2')}</option>
              <option>{t('lessonPlanner.editor.heading3')}</option>
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
            {lessonPlan ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <TypingEffect 
                  content={lessonPlan}
                  isLoading={loading}
                  onContentChange={handleContentChange}
                  loadingMessage={t('lessonPlanner.messages.generating')}
                  typingMessage={t('lessonPlanner.messages.typing')}
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
                <p className="text-center mb-2">{t('lessonPlanner.messages.noLessonPlan')}</p>
                <p className="text-center text-sm">
                  {t('lessonPlanner.messages.completeForm')}
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
              <h2 className="text-xl font-semibold">{t('lessonPlanner.form.title')}</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('lessonPlanner.form.help.title')}</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">{t('lessonPlanner.form.help.learningObjectives.title')}</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>{t('lessonPlanner.form.help.learningObjectives.tip1')}</li>
                            <li>{t('lessonPlanner.form.help.learningObjectives.tip2')}</li>
                            <li>{t('lessonPlanner.form.help.learningObjectives.tip3')}</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">{t('lessonPlanner.form.help.duration.title')}</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>{t('lessonPlanner.form.help.duration.tip1')}</li>
                            <li>{t('lessonPlanner.form.help.duration.tip2')}</li>
                            <li>{t('lessonPlanner.form.help.duration.tip3')}</li>
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
                    <Label htmlFor="name">{t('lessonPlanner.form.fields.name.label')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('lessonPlanner.form.fields.name.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t('lessonPlanner.form.fields.name.placeholder')}
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">{t('lessonPlanner.form.fields.topic.label')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('lessonPlanner.form.fields.topic.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder={t('lessonPlanner.form.fields.topic.placeholder')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="grade">{t('lessonPlanner.form.fields.grade.label')}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('lessonPlanner.form.fields.grade.tooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleInputChange("grade", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('lessonPlanner.form.fields.grade.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otro">Otro (especificar)</SelectItem>
                        <SelectItem value="infantil">{t('lessonPlanner.form.fields.grade.options.preschool')}</SelectItem>
                        <SelectItem value="Grado-1">{t('lessonPlanner.form.fields.grade.options.grade1')}</SelectItem>
                        <SelectItem value="Grado-2">{t('lessonPlanner.form.fields.grade.options.grade2')}</SelectItem>
                        <SelectItem value="Grado-3">{t('lessonPlanner.form.fields.grade.options.grade3')}</SelectItem>
                        <SelectItem value="Grado-4">{t('lessonPlanner.form.fields.grade.options.grade4')}</SelectItem>
                        <SelectItem value="Grado-5">{t('lessonPlanner.form.fields.grade.options.grade5')}</SelectItem>
                        <SelectItem value="Grado-6">{t('lessonPlanner.form.fields.grade.options.grade6')}</SelectItem>
                        <SelectItem value="Grado-7">{t('lessonPlanner.form.fields.grade.options.grade7')}</SelectItem>
                        <SelectItem value="Grado-8">{t('lessonPlanner.form.fields.grade.options.grade8')}</SelectItem>
                        <SelectItem value="Grado-9">{t('lessonPlanner.form.fields.grade.options.grade9')}</SelectItem>
                        <SelectItem value="Grado-10">{t('lessonPlanner.form.fields.grade.options.grade10')}</SelectItem>
                        <SelectItem value="Grado-11">{t('lessonPlanner.form.fields.grade.options.grade11')}</SelectItem>
                        <SelectItem value="universidad">{t('lessonPlanner.form.fields.grade.options.university')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.grade === "otro" && (
                      <div className="mt-2">
                        <Input
                          value={formData.customGrade}
                          onChange={(e) => handleInputChange("customGrade", e.target.value)}
                          placeholder="Escribe el nivel educativo"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="subject">{t('lessonPlanner.form.fields.subject.label')}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('lessonPlanner.form.fields.subject.tooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => handleInputChange("subject", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('lessonPlanner.form.fields.subject.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="otro">Otro (especificar)</SelectItem>
                        <SelectItem value="biologia">{t('lessonPlanner.form.fields.subject.options.biology')}</SelectItem>
                        <SelectItem value="ciencias-naturales">{t('lessonPlanner.form.fields.subject.options.naturalSciences')}</SelectItem>
                        <SelectItem value="ciencias-sociales">{t('lessonPlanner.form.fields.subject.options.socialSciences')}</SelectItem>
                        <SelectItem value="economia">{t('lessonPlanner.form.fields.subject.options.economics')}</SelectItem>
                        <SelectItem value="educacion-artistica">{t('lessonPlanner.form.fields.subject.options.artEducation')}</SelectItem>
                        <SelectItem value="educacion-fisica">{t('lessonPlanner.form.fields.subject.options.physicalEducation')}</SelectItem>
                        <SelectItem value="fisica">{t('lessonPlanner.form.fields.subject.options.physics')}</SelectItem>
                        <SelectItem value="geografia">{t('lessonPlanner.form.fields.subject.options.geography')}</SelectItem>
                        <SelectItem value="historia">{t('lessonPlanner.form.fields.subject.options.history')}</SelectItem>
                        <SelectItem value="ingles">{t('lessonPlanner.form.fields.subject.options.english')}</SelectItem>
                        <SelectItem value="musica">Musica</SelectItem>
                        <SelectItem value="matematicas">{t('lessonPlanner.form.fields.subject.options.mathematics')}</SelectItem>
                        <SelectItem value="quimica">{t('lessonPlanner.form.fields.subject.options.chemistry')}</SelectItem>
                        <SelectItem value="lengua">{t('lessonPlanner.form.fields.subject.options.language')}</SelectItem>
                        <SelectItem value="literatura">{t('lessonPlanner.form.fields.subject.options.literature')}</SelectItem>
                        <SelectItem value="religion">{t('lessonPlanner.form.fields.subject.options.religion')}</SelectItem>
                        <SelectItem value="constitucion-politica">{t('lessonPlanner.form.fields.subject.options.politicalConstitution')}</SelectItem>
                        <SelectItem value="etica-valores">{t('lessonPlanner.form.fields.subject.options.ethics')}</SelectItem>
                        <SelectItem value="filosofia">{t('lessonPlanner.form.fields.subject.options.philosophy')}</SelectItem>
                        <SelectItem value="tecnologia-informatica">{t('lessonPlanner.form.fields.subject.options.informationTechnology')}</SelectItem>
                        <SelectItem value="educacion-ambiental">{t('lessonPlanner.form.fields.subject.options.environmentalEducation')}</SelectItem>
                        <SelectItem value="estudios-afrocolombianos">{t('lessonPlanner.form.fields.subject.options.afroColombianStudies')}</SelectItem>
                        <SelectItem value="educacion-ciudadana">{t('lessonPlanner.form.fields.subject.options.citizenshipEducation')}</SelectItem>
                        <SelectItem value="educacion-paz">{t('lessonPlanner.form.fields.subject.options.peaceEducation')}</SelectItem>
                        <SelectItem value="educacion-sexualidad">{t('lessonPlanner.form.fields.subject.options.sexualityEducation')}</SelectItem>

                      </SelectContent>
                    </Select>
                    {formData.subject === "otro" && (
                      <div className="mt-2">
                        <Input
                          value={formData.customSubject}
                          onChange={(e) => handleInputChange("customSubject", e.target.value)}
                          placeholder={t('lessonPlanner.form.fields.subject.customPlaceholder')}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="duration">{t('lessonPlanner.form.fields.duration.label')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('lessonPlanner.form.fields.duration.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => handleInputChange("duration", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('lessonPlanner.form.fields.duration.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">45 {t('lessonPlanner.form.fields.duration.minutes')}</SelectItem>
                      <SelectItem value="60">60 {t('lessonPlanner.form.fields.duration.minutes')}</SelectItem>
                      <SelectItem value="90">90 {t('lessonPlanner.form.fields.duration.minutes')}</SelectItem>
                      <SelectItem value="120">120 {t('lessonPlanner.form.fields.duration.minutes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="objectives">{t('lessonPlanner.form.fields.objectives.label')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('lessonPlanner.form.fields.objectives.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => handleInputChange("objectives", e.target.value)}
                    placeholder={t('lessonPlanner.form.fields.objectives.placeholder')}
                    required
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="methodology">{t('lessonPlanner.form.fields.methodology.label')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('lessonPlanner.form.fields.methodology.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.methodology?.[0] || ""}
                    onValueChange={handleMethodologyChange}
                  >
                    <SelectTrigger className="h-auto py-2">
                      <SelectValue>
                        {formData.methodology && formData.methodology.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {formData.methodology.length === 1 
                                ? (formData.methodology[0] === "otro" ? "Otro (especificar)" : formData.methodology[0])
                                : `${formData.methodology.length} metodologías seleccionadas`}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formData.methodology.map(m => {
                                switch(m) {
                                  case "Clase magistral": return t('lessonPlanner.form.fields.methodology.descriptions.lecture');
                                  case "Aprendizaje activo": return t('lessonPlanner.form.fields.methodology.descriptions.activeLearning');
                                  case "Aprendizaje práctico": return t('lessonPlanner.form.fields.methodology.descriptions.practicalLearning');
                                  case "Aprendizaje social y emocional": return t('lessonPlanner.form.fields.methodology.descriptions.socialEmotionalLearning');
                                  case "Aprendizaje Basado en Casos": return t('lessonPlanner.form.fields.methodology.descriptions.caseBased');
                                  case "Aprendizaje Basado en Indagación": return t('lessonPlanner.form.fields.methodology.descriptions.inquiryBased');
                                  case "Aprendizaje Basado en Investigación": return t('lessonPlanner.form.fields.methodology.descriptions.researchBased');
                                  case "Aprendizaje Basado en Problemas": return t('lessonPlanner.form.fields.methodology.descriptions.problemBased');
                                  case "Aprendizaje Basado en Proyectos": return t('lessonPlanner.form.fields.methodology.descriptions.projectBased');
                                  case "Aprendizaje Basado en Retos": return t('lessonPlanner.form.fields.methodology.descriptions.challengeBased');
                                  case "Aprendizaje Colaborativo": return t('lessonPlanner.form.fields.methodology.descriptions.collaborative');
                                  case "Aprendizaje Invertido": return t('lessonPlanner.form.fields.methodology.descriptions.flipped');
                                  case "Design Thinking": return t('lessonPlanner.form.fields.methodology.descriptions.designThinking');
                                  case "Gamificación": return t('lessonPlanner.form.fields.methodology.descriptions.gamification');
                                  case "DUA: Diseño Universal para el Aprendizaje": return t('lessonPlanner.form.fields.methodology.descriptions.dua');
                                  case "otro": return "Metodología personalizada";
                                  default: return "";
                                }
                              }).join(", ")}
                            </span>
                          </div>
                        ) : (
                          t('lessonPlanner.form.fields.methodology.placeholder')
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {formData.methodology && formData.methodology.length > 0 && (
                        <div className="px-2 py-1.5 text-sm text-gray-500 border-b">
                          {formData.methodology.length} metodologías seleccionadas
                        </div>
                      )}
                       <SelectItem value="otro" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">Otro (especificar)</span>
                          <span className="text-sm text-gray-500">Metodología personalizada</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Clase magistral" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.lecture')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.lecture')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje activo" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.activeLearning')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.activeLearning')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje práctico" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.practicalLearning')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.practicalLearning')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje social y emocional" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.socialEmotionalLearning')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.socialEmotionalLearning')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Basado en Casos" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.caseBased')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.caseBased')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Basado en Indagación" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.inquiryBased')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.inquiryBased')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Basado en Investigación" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.researchBased')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.researchBased')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Basado en Problemas" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.problemBased')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.problemBased')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Basado en Proyectos" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.projectBased')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.projectBased')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Basado en Retos" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.challengeBased')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.challengeBased')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Colaborativo" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.collaborative')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.collaborative')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Aprendizaje Invertido" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.flipped')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.flipped')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Design Thinking" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.designThinking')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.designThinking')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Gamificación" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.gamification')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.gamification')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DUA: Diseño Universal para el Aprendizaje" className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{t('lessonPlanner.form.fields.methodology.options.dua')}</span>
                          <span className="text-sm text-gray-500">{t('lessonPlanner.form.fields.methodology.descriptions.dua')}</span>
                        </div>
                      </SelectItem>

                    </SelectContent>
                  </Select>
                  {formData.methodology?.includes("otro") && (
                    <div className="mt-2">
                      <Input
                        value={formData.customMethodology}
                        onChange={(e) => handleInputChange("customMethodology", e.target.value)}
                        placeholder="Escribe tu metodología personalizada"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="isPublic">{t('lessonPlanner.form.fields.isPublic.label')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('lessonPlanner.form.fields.isPublic.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="isPublic" className="text-sm text-gray-700">
                      {t('lessonPlanner.form.fields.isPublic.description')}
                    </Label>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText={t('lessonPlanner.form.buttons.generating')}
                  disabled={loading || !formData.topic || !formData.grade || !formData.subject || !formData.duration || !formData.objectives}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  {t('lessonPlanner.form.buttons.generate')}
                </LoadingButton>
              </motion.div>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {lessonPlan && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  {t('lessonPlanner.form.buttons.preview')}
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
            <DialogTitle>{t('lessonPlanner.preview.title')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {lessonPlan ? (
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
                    {t('lessonPlanner.buttons.exportToPDF')}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                    onClick={handleExportWord}
                    disabled={!editedContent}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('lessonPlanner.buttons.exportToWord')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={shareLessonPlan}
                    disabled={!editedContent}
                  >
                    <Share2 className="w-4 h-4" />
                    {t('lessonPlanner.buttons.share')}
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
                    <option>{t('lessonPlanner.editor.paragraph')}</option>
                    <option>{t('lessonPlanner.editor.heading1')}</option>
                    <option>{t('lessonPlanner.editor.heading2')}</option>
                    <option>{t('lessonPlanner.editor.heading3')}</option>
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
                <p className="text-center mb-2">{t('lessonPlanner.messages.noLessonPlan')}</p>
                <p className="text-center text-sm">
                  {t('lessonPlanner.messages.completeForm')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>{t('lessonPlanner.buttons.close')}</Button>
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
          localStorage.removeItem('lessonPlanChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Plan de Lección"
        description="Solicita mejoras específicas para tu plan de lección. El asistente te ayudará a optimizar la estructura y contenido."
        suggestions={[
          "Haz el plan más detallado",
          "Añade más actividades prácticas",
          "Incluye recursos visuales",
          "Mejora la secuencia didáctica",
          "Añade evaluación formativa",
          "Incluye adaptaciones para diferentes estilos de aprendizaje"
        ]}
        localStorageKey="lessonPlanChatState"
      />
    </Layout>
    </>
  )
}

