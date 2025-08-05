"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
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
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"
interface SteamFormData {
  topic: string;
  grade: string;
  customGrade: string;
  name: string;
  isPublic: boolean;
  subject: string[];
  customSubject?: string;
  theme: string;
  email: string;
}

export default function SteamPlanner() {
  const router = useRouter()
  const [formData, setFormData] = useState<SteamFormData>({
    topic: "",
    grade: "",
    customGrade: "",
    name: "",
    isPublic: false,
    subject: [],
    theme: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [steamPlan, setSteamPlan] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
    const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el plan STEAM
  useEffect(() => {
    if (steamPlan) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('steamFromChat')
      if (!isFromChat) {
        localStorage.removeItem('steamChatState')
        console.log('Plan STEAM generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('steamFromChat')
      }
    }
  }, [steamPlan])
  
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
    localStorage.removeItem('steamChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Enviar solo el tema como referencia para que el chat pueda buscar el contenido
    if (!steamPlan) {
      console.log('getCurrentContent: No hay steamPlan')
      return ""
    }
    
    try {
      const steamData = JSON.parse(steamPlan)
      const tema = steamData.tema || ""
      console.log('getCurrentContent: Tema extraído:', tema)
      return tema
    } catch (error) {
      console.error('Error al parsear plan STEAM:', error)
      return ""
    }
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      console.log('handleContentUpdate llamado con:', newContent)
      
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('steamFromChat', 'true')
      
      // Limpiar el formato ```json y ``` del string si viene
      let cleanedContent = newContent
      if (cleanedContent.includes('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (cleanedContent.includes('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '')
      }
      
      console.log('Contenido limpio:', cleanedContent)
      
      // Intentar parsear el JSON
      const parsedData = JSON.parse(cleanedContent)
      console.log('JSON parseado:', parsedData)
      
      // Verificar que tenga la estructura esperada de plan STEAM
      if (parsedData.tema && parsedData.situacion_problema && parsedData.producto_final && parsedData.actividades) {
        // Actualizar el plan STEAM con el nuevo contenido
        setSteamPlan(JSON.stringify(parsedData, null, 2))
        setEditedContent(JSON.stringify(parsedData, null, 2))
        toast.success("Plan STEAM actualizado exitosamente")
        console.log('Plan STEAM actualizado correctamente')
      } else {
        throw new Error("Formato de plan STEAM inválido")
      }
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el plan STEAM. El formato no es válido.")
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    let emailUser = localStorage.getItem("email")
    if (!emailUser) {
      toast.error("No se encontró el email del usuario")
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
      const dataToSend = {
        ...formData,
        grade: formData.grade === "otro" ? formData.customGrade : formData.grade.split("-").map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" "),
        subject: formData.subject.map(subject => {
          if (subject === "otro" && formData.customSubject) {
            return formData.customSubject;
          }
          return subject.split("-").map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(" ");
        }).join(", "),
        topic: `tema: ${formData.theme} | Materias: ${formData.subject.map(subject => {
          if (subject === "otro" && formData.customSubject) {
            return formData.customSubject;
          }
          return subject.split("-").map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(" ");
        }).join(", ")} | Grado: ${formData.grade === "otro" ? formData.customGrade : formData.grade.split("-").map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ")}`,
        email: emailUser,
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/steam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error('Error al generar el plan STEAM')
      }

      const data = await response.json()
      setSteamPlan(JSON.stringify(data, null, 2))
      setEditedContent(JSON.stringify(data, null, 2))
      toast.success('Plan STEAM generado exitosamente')
      
      // Limpiar el estado del chat cuando se genera un nuevo plan STEAM
      localStorage.removeItem('steamChatState')
      
      // Cerrar el modal de chat si está abierto para forzar reinicio
      setShowChatModal(false)
      
      if (emailUser) {
        await gamificationService.addPoints(emailUser, 15, 'steam_creation')
        showPointsNotification(15, 'crear un Plan STEAM')
      }
      
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar el plan STEAM')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof SteamFormData, value: string | boolean | string[]) => {
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
    if (!previewRef.current || !steamPlan) return;

    try {
      const data = JSON.parse(steamPlan);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - marginLeft - marginRight;

      const styles = {
        header: { fontSize: 18, fontStyle: 'bold' },
        subheader: { fontSize: 14, fontStyle: 'bold' },
        normal: { fontSize: 10, fontStyle: 'normal' },
        small: { fontSize: 8, fontStyle: 'normal' }
      };

      pdf.setFont('helvetica', styles.header.fontStyle);
      pdf.setFontSize(styles.header.fontSize);
      const title = 'Plan STEAM';
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      let yPos = marginTop + 10;

      // Información básica
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      pdf.text(`Grado: ${data.grado}`, marginLeft, yPos);
      yPos += 6;
      pdf.text(`Tema: ${data.tema}`, marginLeft, yPos);
      yPos += 6;
      pdf.text(`Asignaturas: ${data.asignaturas.join(", ")}`, marginLeft, yPos);
      yPos += 10;

      // Situación problema
      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.setFontSize(styles.subheader.fontSize);
      pdf.text('Situación Problema:', marginLeft, yPos);
      yPos += 6;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      const situacionLines = pdf.splitTextToSize(data.situacion_problema, contentWidth);
      pdf.text(situacionLines, marginLeft, yPos);
      yPos += situacionLines.length * 5 + 10;

      // Producto final
      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.text('Producto Final:', marginLeft, yPos);
      yPos += 6;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      const productoLines = pdf.splitTextToSize(data.producto_final, contentWidth);
      pdf.text(productoLines, marginLeft, yPos);
      yPos += productoLines.length * 5 + 10;

      // Actividades
      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.text('Actividades:', marginLeft, yPos);
      yPos += 6;
      pdf.setFont('helvetica', styles.normal.fontStyle);

      data.actividades.forEach((actividad: any) => {
        if (yPos + 20 > pageHeight - marginTop) {
          pdf.addPage();
          yPos = marginTop;
        }

        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.text(`${actividad.asignatura}:`, marginLeft, yPos);
        yPos += 6;
        pdf.setFont('helvetica', styles.normal.fontStyle);
        const actividadLines = pdf.splitTextToSize(actividad.actividad, contentWidth);
        pdf.text(actividadLines, marginLeft, yPos);
        yPos += actividadLines.length * 5 + 6;
      });

      // Evaluación
      yPos += 6;
      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.text('Evaluación:', marginLeft, yPos);
      yPos += 6;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.text(`Tipo: ${data.evaluacion.tipo}`, marginLeft, yPos);
      yPos += 6;
      pdf.text('Criterios:', marginLeft, yPos);
      yPos += 6;

      data.evaluacion.criterios.forEach((criterio: string) => {
        const criterioLines = pdf.splitTextToSize(`• ${criterio}`, contentWidth - 10);
        pdf.text(criterioLines, marginLeft + 5, yPos);
        yPos += criterioLines.length * 5;
      });

      // Duración y observaciones
      yPos += 6;
      pdf.text(`Duración estimada: ${data.duracion_estimada}`, marginLeft, yPos);
      yPos += 6;
      pdf.text('Observaciones:', marginLeft, yPos);
      yPos += 6;
      const observacionesLines = pdf.splitTextToSize(data.observaciones, contentWidth);
      pdf.text(observacionesLines, marginLeft, yPos);

      addLogoToFooter(pdf);
      pdf.save(`steam-plan-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Plan STEAM exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el plan STEAM");
    }
  };

  const handleExportWord = async () => {
    if (!steamPlan) {
      toast.error('No hay plan STEAM para exportar');
      return;
    }

    try {
      const data = JSON.parse(steamPlan);
      
      // Crear el documento con formato específico para STEAM
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Título principal
            new Paragraph({
              text: 'Plan STEAM',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400,
              },
            }),

            // Información General
            new Paragraph({
              text: 'Información General',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Grado: ${data.grado}`,
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tema: ${data.tema}`,
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Asignaturas: ${data.asignaturas.join(", ")}`,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            // Situación Problema
            new Paragraph({
              text: 'Situación Problema',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: data.situacion_problema,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            // Producto Final
            new Paragraph({
              text: 'Producto Final',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: data.producto_final,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            // Actividades
            new Paragraph({
              text: 'Actividades',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 200 },
            }),
            ...data.actividades.map((actividad: any) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: actividad.asignatura,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: actividad.actividad,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),
            ]).flat(),

            // Evaluación
            new Paragraph({
              text: 'Evaluación',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tipo: ${data.evaluacion.tipo}`,
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Criterios:',
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...data.evaluacion.criterios.map((criterio: string) => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${criterio}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 100 },
              })
            ),

            // Información Adicional
            new Paragraph({
              text: 'Información Adicional',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Duración estimada: ${data.duracion_estimada}`,
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Observaciones: ${data.observaciones}`,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            // Pie de página
            new Paragraph({
              text: "Generado por Plan STEAM para Profesores",
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 400,
              },
            }),
          ],
        }],
      });

      // Exportar el documento
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steam-plan-${formData.name.toLowerCase().replace(/\s+/g, '-')}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Plan STEAM exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareSteamPlan = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Plan STEAM - ${formData.name}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Plan STEAM copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el plan STEAM");
    }
  };

  const formatSteamData = (data: any) => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">Plan STEAM</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Información General</h3>
              <p><strong>Grado:</strong> {data.grado}</p>
              <p><strong>Tema:</strong> {data.tema}</p>
              <p><strong>Asignaturas:</strong> {data.asignaturas.join(", ")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Situación Problema</h3>
              <p>{data.situacion_problema}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Producto Final</h3>
              <p>{data.producto_final}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Actividades</h3>
              <div className="space-y-4">
                {data.actividades.map((actividad: any, index: number) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-medium">{actividad.asignatura}</h4>
                    <p>{actividad.actividad}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Evaluación</h3>
              <p><strong>Tipo:</strong> {data.evaluacion.tipo}</p>
              <div>
                <strong>Criterios:</strong>
                <ul className="list-disc list-inside mt-2">
                  {data.evaluacion.criterios.map((criterio: string, index: number) => (
                    <li key={index}>{criterio}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Información Adicional</h3>
              <p><strong>Duración estimada:</strong> {data.duracion_estimada}</p>
              <p><strong>Observaciones:</strong> {data.observaciones}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isFormValid = () => {
    return formData.grade && 
           formData.subject.length > 0 && 
           formData.theme && 
           formData.name;
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
            <div className="flex items-center gap-4">
              <RiUserSettingsLine className="w-8 h-8 text-indigo-500" />
              <h1 className="text-2xl font-bold text-gray-900">Plan STEAM</h1>
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
              {steamPlan && (
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
            {steamPlan ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg border p-6"
              >
                {formatSteamData(JSON.parse(steamPlan))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <RiUserSettingsLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay plan STEAM generado</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar el plan STEAM.
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
              <h2 className="text-xl font-semibold">Generador de Plan STEAM</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <RiQuestionLine className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Plan STEAM</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Información Requerida:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Grado del estudiante</li>
                            <li>Asignaturas a integrar</li>
                            <li>Tema o problema a abordar</li>
                            <li>Nombre del proyecto</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características del Plan STEAM:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Enfoque transversal e interdisciplinario</li>
                            <li>Integración de ciencias, tecnología, ingeniería, artes y matemáticas</li>
                            <li>Enfoque en resolución de problemas</li>
                            <li>Desarrollo de habilidades del siglo XXI</li>
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
                            <p>Selecciona el nivel educativo</p>
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
                          id="customGrade"
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
                            <p>Selecciona las materias a integrar en el plan STEAM</p>
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
                          <SelectItem value="otro">Otro</SelectItem>
                          <SelectItem value="ciencias">Ciencias</SelectItem>
                          <SelectItem value="tecnologia">Tecnología</SelectItem>
                          <SelectItem value="ingenieria">Ingeniería</SelectItem>
                          <SelectItem value="artes">Artes</SelectItem>
                          <SelectItem value="matematicas">Matemáticas</SelectItem>
                          <SelectItem value="fisica">Física</SelectItem>
                          <SelectItem value="quimica">Química</SelectItem>
                          <SelectItem value="biologia">Biología</SelectItem>
                          <SelectItem value="programacion">Programación</SelectItem>
                          <SelectItem value="robotica">Robótica</SelectItem>
                          <SelectItem value="diseño">Diseño</SelectItem>
                          <SelectItem value="musica">Música</SelectItem>
                          <SelectItem value="artes-visuales">Artes Visuales</SelectItem>
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
                    <Label htmlFor="theme">Tema o Problema a Abordar</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema o problema que se abordará en el plan STEAM</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    placeholder="Ej: Diseño de una solución sostenible para el manejo de residuos en la escuela..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Proyecto</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa un nombre para el proyecto STEAM</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nombre del proyecto"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange("isPublic", e.target.checked)}
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
                        <p>Al marcar esta opción, tu plan STEAM será visible para otros profesores en la comunidad</p>
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
                  {isLoading ? "Generando..." : "Generar Plan STEAM"}
                </Button>
              </motion.div>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {steamPlan && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver Plan STEAM
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
            <DialogTitle>Previsualización del Plan STEAM</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {steamPlan ? (
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
                    onClick={shareSteamPlan}
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
                  {formatSteamData(JSON.parse(steamPlan))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <RiUserSettingsLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay plan STEAM generado</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar el plan STEAM.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('steamChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={(newContent) => {
          console.log('onContentUpdate llamado desde STEAM con:', newContent)
          handleContentUpdate(newContent)
        }}
        title="Asistente de Mejora de Plan STEAM"
        description="Solicita mejoras específicas para tu Plan STEAM. El asistente te ayudará a optimizar las actividades, evaluación y estrategias STEAM."
        suggestions={[
          "Mejora la situación problema",
          "Optimiza el producto final",
          "Fortalece las actividades STEAM",
          "Añade más criterios de evaluación",
          "Mejora la integración entre disciplinas",
          "Incluye más elementos de innovación"
        ]}
        localStorageKey="steamChatState"
        isSlidesMode={true}
      />
    </Layout>
    </>
  )
} 