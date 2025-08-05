"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import { PDFExporter } from '@/components/pdf-exporter'
import { LazyTypingEffect as TypingEffect, LazyLoadingButton as LoadingButton } from '@/components/lazy-components'
import { Textarea } from "@/components/ui/textarea"
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
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { exportToWord } from '@/utils/word-export';
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
interface CorrectorFormData {
  text: string;
  language: string;
  name: string;
  isPublic: boolean;
}

export default function CorrectorGramatical() {
  const [loading, setLoading] = useState(false)
  const [correctedText, setCorrectedText] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<CorrectorFormData>({
    text: "",
    language: "es",
    name: "",
    isPublic: false
  })
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
      const correctorRequest = {
        topic: "Texto: "+formData.text+"lenguaje: "+formData.language,
        name: formData.name,
        email: email,
        isPublic: formData.isPublic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/corrector-gramatical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correctorRequest)
      })

      if (!response.ok) {
        throw new Error('Error al corregir el texto')
      }

      const data = await response.text()
      setCorrectedText(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Texto corregido exitosamente")


      // Mostrar modal automáticamente en móvil
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al corregir el texto")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    
          // Agregar puntos por corregir un texto
          await gamificationService.addPoints(email, 3, 'grammar_correction')
          showPointsNotification(3, 'corregir un texto')
    
  }

  const handleInputChange = (field: keyof CorrectorFormData, value: string | boolean) => {
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
      pdf.text('Texto Corregido', marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido del texto
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

        // Texto normal
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const splitText = pdf.splitTextToSize(line, contentWidth);
        pdf.text(splitText, marginLeft, yPos);
        yPos += (splitText.length * 6) + 3;
      }

      // Metadatos
      pdf.setProperties({
        title: 'Texto Corregido',
        subject: 'Corrección Gramatical',
        author: 'Corrector Gramatical',
      });

      // Guardar el PDF
      pdf.save('texto-corregido.pdf');
      toast.success("Texto exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el texto");
      throw error;
    }
  };

  const shareText = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Texto Corregido',
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Texto copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el texto");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay texto corregido para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        'Texto Corregido',
        'texto_corregido'
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
              <h1 className="text-xl font-semibold">Corrector Gramatical</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para el Corrector Gramatical</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para la Corrección:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>El corrector revisa ortografía, gramática y estilo</li>
                            <li>Puedes corregir textos de hasta 2000 caracteres</li>
                            <li>Los cambios se muestran en tiempo real</li>
                            <li>Puedes exportar el texto corregido a PDF</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tipos de Textos que Puedes Corregir:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Ensayos y trabajos académicos</li>
                            <li>Documentos administrativos</li>
                            <li>Comunicaciones institucionales</li>
                            <li>Materiales educativos</li>
                            <li>Planes de clase</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Sugerencias de Uso:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Revisa el texto completo antes de exportar</li>
                            <li>Usa nombres descriptivos para tus textos</li>
                            <li>Comparte las correcciones con tus estudiantes</li>
                            <li>Guarda copias de los textos corregidos</li>
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
                  className="bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                  disabled={!editedContent}
                >
                  <FileText className="w-4 h-4 mr-2" />
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
                onClick={shareText}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
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
            {correctedText ? (
              <TypingEffect 
                content={correctedText}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Corrigiendo texto..."
                typingMessage="Mostrando correcciones..."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay texto corregido</p>
                <p className="text-center text-sm">
                  Ingresa el texto en el panel derecho para corregir errores gramaticales automáticamente.
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
              Corrector Gramatical
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
                    <Label htmlFor="text">Texto a corregir *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa el texto que deseas corregir. El corrector revisará ortografía, gramática y estilo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="text"
                    value={formData.text}
                    onChange={(e) => handleInputChange("text", e.target.value)}
                    placeholder={`Ej: "La contaminación ambiental es un problema que afecta a todo el mundo. Los estudiantes deben tomar conciencia sobre la importancia de cuidar el medio ambiente y desarrollar hábitos sostenibles en su vida diaria."`}
                    required
                    maxLength={2000}
                    className="min-h-[200px]"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.text.length}/2000</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Texto *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar fácilmente este texto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Corrección de Ensayo sobre la Contaminación - Grado 8"
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
                          <p>Al marcar esta opción, tu texto corregido será visible para otros educadores en la comunidad.</p>
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
                  loadingText="Corrigiendo texto..."
                  disabled={loading || !formData.text}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Corregir Texto
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>

          {correctedText && (
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
              <DialogTitle>Previsualización del Texto Corregido</DialogTitle>
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
                {correctedText ? (
                  <TypingEffect 
                    content={correctedText}
                    isLoading={loading}
                    onContentChange={handleContentChange}
                    loadingMessage="Corrigiendo texto..."
                    typingMessage="Mostrando correcciones..."
                  />
                ) : (
                  <div className="border border-dashed rounded-lg p-8 sm:p-16 flex flex-col items-center justify-center text-gray-500">
                    <LightbulbIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 text-gray-300" />
                    <p className="text-center mb-2">No hay texto corregido</p>
                    <p className="text-center text-sm">
                      Ingresa el texto en el panel derecho para corregir errores gramaticales automáticamente.
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
                  onClick={shareText}
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