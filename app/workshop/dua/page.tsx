"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast, Toaster } from "sonner"
import { useRouter } from "next/navigation"
import { RiUserSettingsLine, RiFileDownloadLine, RiShareLine, RiQuestionLine } from "react-icons/ri"
import { motion } from "framer-motion"
import { FileDown, Share2, FileText } from "lucide-react"
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
import jsPDF from 'jspdf'
import { addLogoToFooter } from '@/utils/pdf-utils'
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface DuaFormData {
  grade: string;
  subject: string[];
  customSubject?: string;
  theme: string;
  name: string;
  email: string;
  public: boolean;
  customGrade?: string;
}

export default function Dua() {
  const router = useRouter()
  const [formData, setFormData] = useState<DuaFormData>({
    grade: "",
    subject: [],
    theme: "",
    name: "",
    email: "",
    public: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [dua, setDua] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
    // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el DUA
  useEffect(() => {
    if (dua) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('duaFromChat')
      if (!isFromChat) {
        localStorage.removeItem('duaChatState')
        console.log('DUA generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('duaFromChat')
      }
    }
  }, [dua])
  
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
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Enviar solo el objetivo general como referencia para que el chat pueda buscar el contenido
    if (!dua) return ""
    
    try {
      const duaData = JSON.parse(dua)
      return duaData.objetivo_general || ""
    } catch (error) {
      console.error('Error al parsear DUA:', error)
      return ""
    }
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('duaFromChat', 'true')
      
      // Limpiar el formato ```json y ``` del string si viene
      let cleanedContent = newContent
      if (cleanedContent.includes('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (cleanedContent.includes('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '')
      }
      
      // Intentar parsear el JSON
      const parsedData = JSON.parse(cleanedContent)
      
      // Verificar que tenga la estructura esperada de DUA
      if (parsedData.objetivo_general && parsedData.temas && Array.isArray(parsedData.temas)) {
        // Actualizar el DUA con el nuevo contenido
        setDua(JSON.stringify(parsedData, null, 2))
        setEditedContent(JSON.stringify(parsedData, null, 2))
        toast.success("DUA actualizado exitosamente")
      } else {
        throw new Error("Formato de DUA inválido")
      }
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el DUA. El formato no es válido.")
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    setIsLoading(true)
    let emailUser = localStorage.getItem("email")
    if (!emailUser) {
      toast.error("No se encontró el email del usuario")
      setIsLoading(false)
      return
    }
 // Validar acceso
 const accessData = await validateAccess(emailUser)

 
    
 if (!accessData.allowed) {
  setIsLoading(false)
   // Mostrar el modal con el mensaje de acceso
   setShowPricingModal(true)
   setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
   return // Detener el flujo
 }
    try {
      // Preparar los datos para enviar al backend
      const duaRequest = {
        email: emailUser,
        isPublic: formData.public,
        grade: formData.grade === "otro" ? formData.customGrade : formData.grade,
        theme: formData.theme,
        topic: formData.theme+" Grado educativo: "+(formData.grade === "otro" ? formData.customGrade : formData.grade)+" Materia: "+formData.subject.map(subject => 
          subject === "otro" ? formData.customSubject : subject
        ).join(", "),
        subject: formData.subject.map(subject => 
          subject === "otro" ? formData.customSubject : subject
        ).join(", "),
        name: formData.name
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/dua', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duaRequest),
      })

      if (!response.ok) {
        throw new Error('Error al generar el DUA')
      }

      const data = await response.json()
      setDua(JSON.stringify(data, null, 2))
      setEditedContent(JSON.stringify(data, null, 2))
      toast.success('DUA generado exitosamente')
      
      // Limpiar el estado del chat cuando se genera un nuevo DUA
      localStorage.removeItem('duaChatState')
      
      // Agregar puntos por generar DUA
      if (emailUser) {
        await gamificationService.addPoints(emailUser, 15, 'dua_creation')
        showPointsNotification(15, 'crear un Diseño Universal para el Aprendizaje (DUA)')
      }
      
      // Verificar si es una pantalla pequeña (móvil) y abrir el modal automáticamente
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar el DUA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof DuaFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubjectChange = (value: string) => {
    setFormData(prev => {
      if (value === "otro") {
        return { ...prev, subject: [...prev.subject, value] }
      }
      const newsubject = prev.subject.includes(value)
        ? prev.subject.filter(subject => subject !== value)
        : [...prev.subject, value]
      return { ...prev, subject: newsubject }
    })
  }

  const removeSubject = (subjectToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      subject: prev.subject.filter(subject => subject !== subjectToRemove)
    }))
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content)
  }

  const exportToPDF = async () => {
    if (!previewRef.current || !dua) return;

    try {
      const data = JSON.parse(dua);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Configuración básica
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 20;
      const pageWidth = 210; // Ancho A4
      const pageHeight = 297; // Alto A4
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Estilos consistentes
      const styles = {
        header: { fontSize: 16, fontStyle: 'bold' },
        subheader: { fontSize: 12, fontStyle: 'bold' },
        normal: { fontSize: 10, fontStyle: 'normal' },
        small: { fontSize: 8, fontStyle: 'normal' }
      };

      // Función auxiliar para agregar texto con manejo de saltos de página
      const addText = (text: string, x: number, y: number, maxWidth: number) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        if (y + (lines.length * 5) > pageHeight - marginTop) {
          pdf.addPage();
          y = marginTop;
        }
        pdf.text(lines, x, y);
        return y + (lines.length * 5);
      };

      // Título y encabezado
      pdf.setFont('helvetica', styles.header.fontStyle);
      pdf.setFontSize(styles.header.fontSize);
      const title = 'Diseño Universal para el Aprendizaje (DUA)';
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      // Información general
      let yPos = marginTop + 15;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      yPos = addText(`Asignatura: ${data.asignatura}`, marginLeft, yPos, contentWidth);
      yPos = addText(`Grado: ${data.grado}`, marginLeft, yPos, contentWidth);
      yPos = addText(`Duración Total: ${data.duracion_total}`, marginLeft, yPos, contentWidth);
      yPos += 10;

      // Objetivo General
      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.setFontSize(styles.subheader.fontSize);
      yPos = addText('Objetivo General:', marginLeft, yPos, contentWidth);
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      yPos = addText(data.objetivo_general, marginLeft, yPos, contentWidth);
      yPos += 10;

      // Temas
      data.temas.forEach((tema: any, index: number) => {
        if (yPos + 50 > pageHeight - marginTop) {
          pdf.addPage();
          yPos = marginTop;
        }

        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.setFontSize(styles.subheader.fontSize);
        yPos = addText(`Tema ${index + 1}: ${tema.nombre_tema}`, marginLeft, yPos, contentWidth);

        pdf.setFont('helvetica', styles.normal.fontStyle);
        pdf.setFontSize(styles.normal.fontSize);
        yPos = addText(`Duración: ${tema.duracion}`, marginLeft, yPos, contentWidth);
        yPos = addText(`Objetivo Específico: ${tema.objetivo_especifico}`, marginLeft, yPos, contentWidth);

        // Principios DUA
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        yPos = addText('Principios DUA:', marginLeft, yPos, contentWidth);
        pdf.setFont('helvetica', styles.normal.fontStyle);

        // Representación
        yPos = addText('Representación:', marginLeft + 5, yPos, contentWidth - 5);
        tema.principios_DUA.representacion.forEach((item: string) => {
          yPos = addText(`• ${item}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        // Acción y Expresión
        yPos = addText('Acción y Expresión:', marginLeft + 5, yPos, contentWidth - 5);
        tema.principios_DUA.accion_y_expresion.forEach((item: string) => {
          yPos = addText(`• ${item}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        // Motivación y Compromiso
        yPos = addText('Motivación y Compromiso:', marginLeft + 5, yPos, contentWidth - 5);
        tema.principios_DUA.motivacion_y_compromiso.forEach((item: string) => {
          yPos = addText(`• ${item}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        // Evaluación
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        yPos = addText('Evaluación:', marginLeft, yPos, contentWidth);
        pdf.setFont('helvetica', styles.normal.fontStyle);
        yPos = addText(`Instrumento: ${tema.evaluacion.instrumento}`, marginLeft + 5, yPos, contentWidth - 5);
        yPos = addText('Criterios:', marginLeft + 5, yPos, contentWidth - 5);
        tema.evaluacion.criterios.forEach((criterio: string) => {
          yPos = addText(`• ${criterio}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        yPos += 10;
      });

      // Adecuaciones y Apoyos
      if (yPos + 50 > pageHeight - marginTop) {
        pdf.addPage();
        yPos = marginTop;
      }

      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.setFontSize(styles.subheader.fontSize);
      yPos = addText('Adecuaciones y Apoyos:', marginLeft, yPos, contentWidth);
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      data.adecuaciones_y_apoyos.forEach((item: string) => {
        yPos = addText(`• ${item}`, marginLeft + 5, yPos, contentWidth - 5);
      });

      addLogoToFooter(pdf);
      pdf.save(`dua-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("DUA exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el DUA");
    }
  };

  const handleExportWord = async () => {
    if (!dua) {
      toast.error('No hay DUA para exportar');
      return;
    }

    try {
      const data = JSON.parse(dua);
      
      // Preparar los datos en el formato esperado por la función exportToWord
      const content = {
        title: 'Diseño Universal para el Aprendizaje (DUA)',
        generalInfo: {
          asignatura: data.asignatura,
          grado: data.grado,
          duracion_total: data.duracion_total,
          objetivo_general: data.objetivo_general
        },
        temas: data.temas.map((tema: any) => ({
          nombre: tema.nombre_tema,
          duracion: tema.duracion,
          objetivo: tema.objetivo_especifico,
          principios: tema.principios_DUA,
          evaluacion: tema.evaluacion
        })),
        adecuaciones: data.adecuaciones_y_apoyos
      };

      await exportToWord(
        content,
        'Diseño Universal para el Aprendizaje (DUA)',
        `dua-${formData.name.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('DUA exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareDua = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Diseño Universal para el Aprendizaje (DUA) - ${formData.name}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("DUA copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el DUA");
    }
  };

  const formatDuaData = (data: any) => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">Diseño Universal para el Aprendizaje (DUA)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Información General</h3>
              <p><strong>Asignatura:</strong> {data.asignatura}</p>
              <p><strong>Grado:</strong> {data.grado}</p>
              <p><strong>Duración Total:</strong> {data.duracion_total}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Objetivo General</h3>
              <p>{data.objetivo_general}</p>
            </div>
          </div>

          <div className="space-y-8">
            {data.temas.map((tema: any, index: number) => (
              <div key={index} className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Tema {index + 1}: {tema.nombre_tema}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p><strong>Duración:</strong> {tema.duracion}</p>
                    <p><strong>Objetivo Específico:</strong> {tema.objetivo_especifico}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Principios DUA</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Representación</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {tema.principios_DUA.representacion.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Acción y Expresión</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {tema.principios_DUA.accion_y_expresion.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Motivación y Compromiso</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {tema.principios_DUA.motivacion_y_compromiso.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Evaluación</h4>
                    <p><strong>Instrumento:</strong> {tema.evaluacion.instrumento}</p>
                    <div>
                      <strong>Criterios:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {tema.evaluacion.criterios.map((criterio: string, i: number) => (
                          <li key={i}>{criterio}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold mb-4">Adecuaciones y Apoyos</h3>
            <ul className="list-disc list-inside space-y-2">
              {data.adecuaciones_y_apoyos.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Agregar función de validación
  const isFormValid = () => {
    return formData.grade && 
           formData.subject.length > 0 && 
           formData.theme && 
           formData.name;
  };

  return (
    <>
          {/* Tu contenido normal */}
      
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
            <div className="flex items-center gap-4">
              <RiUserSettingsLine className="w-8 h-8 text-indigo-500" />
              <h1 className="text-2xl font-bold text-gray-900">Diseño Universal para el Aprendizaje (DUA)</h1>
            </div>
            <div className="flex gap-2">
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
              {dua && (
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

          {/* Contenido */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative" 
            ref={previewRef}
          >
            {dua ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg border p-6"
              >
                {formatDuaData(JSON.parse(dua))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <RiUserSettingsLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay DUA generado</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar el Diseño Universal para el Aprendizaje (DUA).
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
              <h2 className="text-xl font-semibold">Generador de DUA</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <RiQuestionLine className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Diseño Universal para el Aprendizaje (DUA)</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Información Requerida:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Grado del estudiante</li>
                            <li>Asignatura específica</li>
                            <li>Tema de estudio</li>
                            <li>Nombre del estudiante</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características del DUA:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Enfoque en la accesibilidad universal</li>
                            <li>Múltiples formas de representación</li>
                            <li>Múltiples formas de acción y expresión</li>
                            <li>Múltiples formas de motivación y compromiso</li>
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
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="grade">Nivel Educativo</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Selecciona el nivel educativo del estudiante</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleInputChange("grade", value)}
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

                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="subject">Materias</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Selecciona una o más materias del estudiante</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2">
                      <Select
                        value={formData.subject[formData.subject.length - 1] || ""}
                        onValueChange={handleSubjectChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona las materias" />
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
                      
                      {formData.subject.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                          {formData.subject.map((subject) => (
                            <div
                              key={subject}
                              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                            >
                              <span>
                                {subject === "otro" 
                                  ? "Otra materia" 
                                  : subject.split("-").map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(" ")}
                              </span>
                              <button
                                onClick={() => removeSubject(subject)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {formData.subject.includes("otro") && (
                        <div className="mt-2">
                          <Input
                            id="customSubject"
                            value={formData.customSubject}
                            onChange={(e) => handleInputChange("customSubject", e.target.value)}
                            placeholder="Escribe la materia"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="theme">Tema de Estudio ,actividad o objetivo</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema o temas que se abordarán en el DUA</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    placeholder="Ej: La fotosíntesis, Los números decimales, La Segunda Guerra Mundial..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del recurso</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa el nombre del recurso</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nombre del recurso"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={formData.public}
                    onChange={(e) => handleInputChange("public", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="public" className="text-sm font-medium text-gray-700">
                    Compartir con la comunidad de profesores
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <RiQuestionLine className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Al marcar esta opción, tu DUA será visible para otros profesores en la comunidad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Button 
                  type="submit" 
                  disabled={isLoading || !isFormValid()}
                  className={`w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white ${
                    !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-indigo-900'
                  }`}
                >
                  {isLoading ? "Generando..." : "Generar DUA"}
                </Button>
              </motion.div>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {dua && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver DUA
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
            <DialogTitle>Previsualización del DUA</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {dua ? (
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
                    onClick={shareDua}
                    disabled={!editedContent}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
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

                <div
                  ref={previewRef}
                  className="bg-white rounded-lg border p-6"
                >
                  {formatDuaData(JSON.parse(dua))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <RiUserSettingsLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay DUA generado</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar el Diseño Universal para el Aprendizaje (DUA).
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
      
      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('duaChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de DUA"
        description="Solicita mejoras específicas para tu Diseño Universal para el Aprendizaje. El asistente te ayudará a optimizar los principios DUA y las estrategias."
        suggestions={[
          "Mejora los principios de representación",
          "Optimiza las estrategias de acción y expresión",
          "Fortalece la motivación y compromiso",
          "Añade más adecuaciones específicas",
          "Mejora los criterios de evaluación",
          "Incluye más estrategias inclusivas"
        ]}
        localStorageKey="duaChatState"
        isSlidesMode={true}
      />
    </Layout>
    </>
  )
} 
