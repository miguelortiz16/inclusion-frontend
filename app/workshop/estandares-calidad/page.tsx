"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, Award, HelpCircle, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
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
import { th } from "date-fns/locale"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"


interface StandardsFormData {
  topic: string;
  institution: string;
  level: string;
  name: string;
  isPublic: boolean;
}

interface StandardsContent {
  introduction: string;
  standards: string;
  indicators: string;
  recommendations: string;
}

export default function EstandaresCalidad() {
  const [loading, setLoading] = useState(false)
  const [standards, setStandards] = useState<string>("")
  const [editedContent, setEditedContent] = useState<StandardsContent | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<StandardsFormData>({
    topic: "",
    institution: "",
    level: "",
    name: "",
    isPublic: false
  })
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian los estándares
  useEffect(() => {
    if (standards) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('estandaresFromChat')
      if (!isFromChat) {
        localStorage.removeItem('estandaresChatState')
        console.log('Estándares generados desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('estandaresFromChat')
      }
    }
  }, [standards])

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
    localStorage.removeItem('estandaresChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Retornar el contenido actual de los estándares
    return standards || ""
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('estandaresFromChat', 'true')
      
      // Actualizar el contenido de los estándares
      setStandards(newContent)
      toast.success("Estándares actualizados exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar los estándares.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')
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


    try {
      const topic = `Genera estándares de calidad educativa para el área: ${formData.topic} 
      en la institución: ${formData.institution}. 
      Los estándares deben incluir:
      - Criterios de calidad
      - Indicadores de medición
      - Niveles de desempeño
      - Procesos de evaluación
      - Planes de mejora
      - Documentación requerida`

      const topicRequest = {
        name: formData.name,
        topic: topic,
        email: email,
        isPublic: formData.isPublic,
        theme: formData.topic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/estandares-calidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar los estándares')
      }

      const data = await response.text()
      setStandards(data)
      setEditedContent({
        introduction: data.split('Introducción')[0],
        standards: data.split('Estándares')[1].split('Indicadores')[0],
        indicators: data.split('Indicadores')[1].split('Recomendaciones')[0],
        recommendations: data.split('Recomendaciones')[1]
      })
      setLoadingState('typing')
      toast.success("Estándares generados exitosamente")
      
      // Limpiar el estado del chat cuando se generan nuevos estándares
      localStorage.removeItem('estandaresChatState')

      // Mostrar el modal automáticamente en dispositivos móviles
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar los estándares")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
          // Agregar puntos por generar estándares de calidad
          await gamificationService.addPoints(email, 12, 'quality_standards_generation')
          showPointsNotification(12, 'generar estándares de calidad')
    
  }

  const handleInputChange = (field: keyof StandardsFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    if (!editedContent) return;
    
    const [section, ...rest] = content.split(': ');
    const sectionKey = section.toLowerCase() as keyof StandardsContent;
    const newContent = rest.join(': ');
    
    setEditedContent({
      ...editedContent,
      [sectionKey]: newContent
    });
  };

  const exportToPDF = async () => {
    if (!editedContent) return;

    try {
      const pdf = initializePDF('Estándares de Calidad', 'Generador de Estándares de Calidad');
      
      // Agregar encabezado
      addStandardHeader(pdf, 'Estándares de Calidad', `Nivel: ${formData.level}`);
      
      let y = MARGINS.top + 30;
      
      // Agregar secciones
      y = addSection(pdf, 'Introducción', editedContent.introduction, y);
      y = addSection(pdf, 'Estándares', editedContent.standards, y);
      y = addSection(pdf, 'Indicadores', editedContent.indicators, y);
      y = addSection(pdf, 'Recomendaciones', editedContent.recommendations, y);
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Estandares_Calidad_${formData.level.replace(/\s+/g, '_')}.pdf`);
      toast.success("Estándares de calidad exportados exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar los estándares de calidad");
    }
  };

  const shareStandards = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Estándares de Calidad - ${formData.topic}`,
          text: editedContent ? Object.values(editedContent).join('\n') : '',
        });
      } else {
        await navigator.clipboard.writeText(editedContent ? Object.values(editedContent).join('\n') : '');
        toast.success("Estándares copiados al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir los estándares");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay estándares para exportar');
      return;
    }

    try {
      const content = Object.entries(editedContent)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n\n');

      await exportToWord(
        content,
        `Estándares de Calidad: ${formData.topic}`,
        `estandares-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
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
                <h1 className="text-xl font-semibold">Estándares de Calidad</h1>
              </motion.div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Estándares de Calidad</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Estándares:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Define criterios claros y medibles</li>
                            <li>Incluye indicadores específicos</li>
                            <li>Establece niveles de desempeño</li>
                            <li>Proporciona procesos de evaluación</li>
                            <li>Define planes de mejora continua</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Áreas Comunes:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Gestión académica y curricular</li>
                            <li>Infraestructura y recursos</li>
                            <li>Desarrollo profesional docente</li>
                            <li>Evaluación y seguimiento</li>
                            <li>Participación de la comunidad</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para la Implementación:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Adapta los estándares a tu contexto</li>
                            <li>Involucra a todos los actores</li>
                            <li>Establece plazos realistas</li>
                            <li>Proporciona recursos de apoyo</li>
                            <li>Monitorea el progreso regularmente</li>
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
                  onClick={shareStandards}
                  disabled={!editedContent}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                {standards && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                )}
              {standards && (
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
            {standards ? (
              <TypingEffect 
                content={standards}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando estándares..."
                typingMessage="Escribiendo estándares..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <Award className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay estándares generados</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar estándares de calidad educativa.
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
            <h2 className="text-xl font-semibold mb-6">Generador de Estándares</h2>
            
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
                    <Label htmlFor="topic">Área de Calidad *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Especifica el área o aspecto de la calidad educativa que deseas evaluar.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Gestión académica: Planificación y desarrollo curricular"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="institution">Institución *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Nombre de la institución educativa donde se implementarán los estándares.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => handleInputChange("institution", e.target.value)}
                    placeholder="Ej: Colegio XYZ - Institución Educativa"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="level">Nivel *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Nivel educativo al que se aplicarán los estándares.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    placeholder="Ej: Educación Primaria - Grados 1-5"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre de los Estándares *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar estos estándares.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Estándares de Calidad para Matemáticas - Primaria"
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
                          <p>Al marcar esta opción, tus estándares serán visibles para otros educadores en la comunidad.</p>
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
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando estándares..."
                  disabled={loading || !formData.topic || !formData.institution || !formData.level || !formData.name}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Estándares
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Botón para ver la previsualización en móvil */}
          {standards && (
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
                Ver Estándares
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal para previsualización en móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Estándares de Calidad</DialogTitle>
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
                {standards ? (
                  <TypingEffect 
                    content={standards}
                    isLoading={loading}
                    onContentChange={handleContentChange}
                    loadingMessage="Generando estándares..."
                    typingMessage="Escribiendo estándares..."
                  />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="border border-dashed rounded-lg p-8 sm:p-16 flex flex-col items-center justify-center text-gray-500 min-h-[300px] sm:min-h-[400px]"
                  >
                    <Award className="w-8 h-8 sm:w-12 sm:h-12 mb-4 text-gray-300" />
                    <p className="text-center mb-2">No hay estándares generados</p>
                    <p className="text-center text-sm">
                      Completa el formulario para generar estándares de calidad educativa.
                    </p>
                  </motion.div>
                )}
              </div>

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
                  onClick={shareStandards}
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
            localStorage.removeItem('estandaresChatState')
          }}
          currentContent={getCurrentContent()}
          onContentUpdate={handleContentUpdate}
          title="Asistente de Mejora de Estándares de Calidad"
          description="Solicita mejoras específicas para tus estándares. El asistente te ayudará a optimizar los criterios, indicadores y procesos de evaluación de calidad."
          suggestions={[
            "Mejora los criterios de calidad",
            "Añade más indicadores específicos",
            "Incluye procesos de evaluación",
            "Mejora la claridad de los estándares",
            "Añade planes de mejora continua",
            "Incluye documentación requerida"
          ]}
          localStorageKey="estandaresChatState"
          isSlidesMode={false}
        />
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 