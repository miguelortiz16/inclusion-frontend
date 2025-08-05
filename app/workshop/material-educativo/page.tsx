"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, BookOpen, ArrowUpRight, Image, HelpCircle, FileText } from "lucide-react"
import { PDFExporter } from '@/components/pdf-exporter'
import { LazyTypingEffect as TypingEffect, LazyLoadingButton as LoadingButton } from '@/components/lazy-components'
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
  DialogFooter,
} from "@/components/ui/dialog"
import { exportToWord } from '@/utils/word-export'
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PricingModal } from "@/components/pricing-modal"

interface MaterialFormData {
  name: string;
  topic: string;
  grade: string;
  subject: string;
  keywords: string;
  coverage: string;
  customGrade?: string;
  customSubject?: string;
  isPublic: boolean;
}

interface RecommendedMaterial {
  title: string;
  description: string;
  twinklUrl: string;
  imageDescription: string;
}

const GRADES = [
  "otro",
  "pre-escolar",
  "infantil",
  "Grado-1",
  "Grado-2",
  "Grado-3",
  "Grado-4",
  "Grado-5",
  "Grado-6",
  "Grado-7",
  "Grado-8",
  "Grado-9",
  "Grado-10",
  "Grado-11",
  "universidad"
];

export default function MaterialEducativoBuilder() {
  const [loading, setLoading] = useState(false)
  const [material, setMaterial] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const [recommendedMaterial, setRecommendedMaterial] = useState<RecommendedMaterial | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const [formData, setFormData] = useState<MaterialFormData>({
    name: "",
    topic: "",
    grade: "",
    subject: "",
    keywords: "",
    coverage: "",
    customGrade: "",
    customSubject: "",
    isPublic: true
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')

    try {
      const prompt = `Crea un material educativo detallado y estructurado para ${formData.topic} con las siguientes especificaciones:
- Grado educativo: ${formData.grade === "otro" ? formData.customGrade : formData.grade}
- Materia: ${formData.subject === "otro" ? formData.customSubject : formData.subject}
- El material debe ser completo, incluyendo:
  * Introducción y objetivos
  * Conceptos clave
  * Ejemplos prácticos
  * Actividades de práctica
  * Recursos adicionales
  * Evaluación`
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
      const topicRequest = {
        topic: prompt,
        email: email,
        name: formData.name,
        isPublic: true,
        grade: formData.grade === "otro" ? formData.customGrade : formData.grade,
        theme: formData.topic,
        subject: formData.subject === "otro" ? formData.customSubject : formData.subject
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-material-educativo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el material educativo')
      }

      const data = await response.text()
      console.log('Respuesta del backend:', data)
      setMaterial(data)
      setEditedContent(data)
      setLoadingState('typing')

      // Generar material recomendado basado en la respuesta
      const recommendedData: RecommendedMaterial = {
        title: `${formData.topic}: Material Educativo`,
        description: `Material completo para ${formData.grade} que incluye introducción, objetivos, conceptos clave, ejemplos prácticos y actividades.`,
        twinklUrl: `https://www.twinkl.es/search?q=${encodeURIComponent(prompt)}&t=0&c=46&r=parent`,
        imageDescription: `Visualización relacionada con ${formData.topic} que ayuda a entender los conceptos clave del tema.`
      }
      setRecommendedMaterial(recommendedData)

      toast.success("Material educativo generado exitosamente")
      

      
      // En móvil, mostrar el modal de previsualización
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el material educativo")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }
          // Agregar puntos por crear el material educativo
          if (email) {
            await gamificationService.addPoints(email, 10, 'material_creation')
            showPointsNotification(10, 'crear un material educativo')
          }
  }

  const handleInputChange = (field: keyof MaterialFormData, value: string | boolean) => {
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
      pdf.text(`Material Educativo: ${formData.topic}`, marginLeft, marginTop);

      // Información del material
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Curso: ${formData.grade}`, marginLeft, marginTop + 10);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido del material
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
        title: `Material Educativo - ${formData.topic}`,
        subject: formData.grade,
        author: 'Generador de Material Educativo',
      });

      // Guardar PDF
      pdf.save(`material-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Material educativo exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el material educativo");
      throw error;
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay material educativo para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Material Educativo: ${formData.topic}`,
        `material-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareMaterial = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Material Educativo - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Material educativo copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el material educativo");
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
            <h1 className="text-xl font-semibold">Material Educativo</h1>
            <div className="flex gap-2">
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
                onClick={shareMaterial}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
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

          {/* Content Area */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative" 
            ref={previewRef}
          >
            {material ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-[500px] border border-dashed border-gray-300 rounded-lg p-6 text-gray-700 whitespace-pre-wrap font-sans"
              >
                {material}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay material educativo generado</p>
                <p className="text-center text-sm">
                  Configura tu material en el panel derecho y genera el contenido automáticamente.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Recommended Materials Section */}
          {recommendedMaterial && loadingState === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 border-t pt-6"
            >
              <h2 className="text-lg font-semibold mb-4">Material Adicional Recomendado</h2>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-blue-50 p-4 rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-700">{recommendedMaterial.title}</h3>
                    <p className="text-sm text-blue-600 mt-1">{recommendedMaterial.description}</p>
                    <div className="mt-3">
                      <a 
                        href={recommendedMaterial.twinklUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
                      >
                        Ver recursos en Twinkl
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
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
              <h2 className="text-xl font-semibold">Generador Ideas de Material Educativo</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Crear Material Educativo</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Se específico con el tema que deseas desarrollar</li>
                            <li>Considera el nivel educativo de los estudiantes</li>
                            <li>Incluye conceptos clave y ejemplos prácticos</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Estructura del Material:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Introducción y objetivos claros</li>
                            <li>Conceptos clave explicados paso a paso</li>
                            <li>Ejemplos prácticos y actividades</li>
                            <li>Recursos adicionales y evaluaciones</li>
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
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="subject">Nombre del Material Educativo *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Un nombre descriptivo que identifique claramente el contenido del material</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: Material Educativo: La Fotosíntesis para Grado 5"
                  required
                  maxLength={100}
                />
                <div className="text-xs text-right mt-1 text-gray-500">{formData.subject.length}/100</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El tema principal que se desarrollará en el material educativo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: La Fotosíntesis: Proceso y Aplicaciones"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grade">Nivel educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Nivel educativo de los estudiantes para quienes está destinado el material</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => handleInputChange("grade", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel educativo" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade === "otro" ? "Otro (especificar)" : grade}
                        </SelectItem>
                      ))}
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
                    <Label htmlFor="subject">Materia *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>La materia o asignatura para la cual se creará el material educativo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => handleInputChange("subject", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la materia" />
                    </SelectTrigger>
                    <SelectContent>
                                      <SelectItem value="otro">Otro (especificar)</SelectItem>
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
    <SelectItem value="musica">Musica</SelectItem>
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
                    <div className="mt-2">
                      <Input
                        value={formData.customSubject}
                        onChange={(e) => handleInputChange("customSubject", e.target.value)}
                        placeholder="Escribe la materia"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={true}
                    onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                    Compartir con la comunidad de profesores
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Al marcar esta opción, tu material será visible para otros profesores en la comunidad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <LoadingButton 
                isLoading={loadingState === 'generating'}
                loadingText="Generando material..."
                disabled={loading || !formData.topic || !formData.grade}
                type="submit"
                className="w-full"
                size="lg"
              >
                Generar Ideas de Materiales Educativos
              </LoadingButton>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {material && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver Previsualización
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
            <DialogTitle>Previsualización del Material Educativo</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {material ? (
              <div className="space-y-4">
                {/* Botones de exportación en el modal */}
                <div className="flex flex-wrap gap-2 mb-4">
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
                    onClick={shareMaterial}
                    disabled={!editedContent}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </Button>
                </div>

                <div className="border-b pb-3 mb-4 flex flex-wrap gap-2">
                  <select className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
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

                <div
                  ref={previewRef}
                  className="min-h-[300px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-4 text-gray-700 whitespace-pre-wrap font-sans"
                  contentEditable
                  onInput={(e) => handleContentChange(e.currentTarget.textContent || '')}
                  suppressContentEditableWarning
                >
                  {editedContent}
                </div>

                {/* Recommended Materials Section */}
                {recommendedMaterial && loadingState === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 border-t pt-6"
                  >
                    <h2 className="text-lg font-semibold mb-4">Material Adicional Recomendado</h2>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="bg-blue-50 p-4 rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-blue-700">{recommendedMaterial.title}</h3>
                          <p className="text-sm text-blue-600 mt-1">{recommendedMaterial.description}</p>
                          <div className="mt-3">
                            <a 
                              href={recommendedMaterial.twinklUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
                            >
                              Ver recursos en Twinkl
                              <ArrowUpRight className="w-4 h-4 ml-1" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay material educativo generado</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar un material educativo.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </Layout>
    </>
  )
}

