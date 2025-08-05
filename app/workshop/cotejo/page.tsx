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
import { RiCheckboxCircleFill, RiFileDownloadLine, RiShareLine, RiQuestionLine } from "react-icons/ri"
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
import * as XLSX from 'xlsx'
import ExcelJS from "exceljs"
import { API_URL } from "@/utils/api-urls"
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"

interface CotejoFormData {
  grade: string;
  subject: string;
  theme: string;
  name: string;
  email: string;
  public: boolean;
  customGrade?: string;
  customSubject?: string;
}

interface CotejoData {
  titulo: string;
  descripcion: string;
  criterios: {
    nombre: string;
    descripcion: string;
    escala: {
      nivel: string;
      descripcion: string;
    }[];
  }[];
}

interface Criterio {
  nombre: string;
  muyBien: string;
  bien: string;
  regular: string;
  mal: string;
}

interface Cotejo {
  asignatura: string;
  nivelEducativo: string;
  tema: string;
  criterios: Criterio[];
}

export default function Cotejo() {
  const router = useRouter()
  const [formData, setFormData] = useState<CotejoFormData>({
    grade: "",
    subject: "",
    theme: "",
    name: "",
    email: "",
    public: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [cotejo, setCotejo] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el cotejo
  useEffect(() => {
    if (cotejo) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('cotejoFromChat')
      if (!isFromChat) {
        localStorage.removeItem('cotejoChatState')
        console.log('Cotejo generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('cotejoFromChat')
      }
    }
  }, [cotejo])
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
    localStorage.removeItem('cotejoChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Si hay contenido editado, usarlo; si no, usar el cotejo original
    return editedContent || cotejo
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('cotejoFromChat', 'true')
      
      // Limpiar el formato ```json y ``` del string si viene
      let cleanedContent = newContent
      if (cleanedContent.includes('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (cleanedContent.includes('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '')
      }
      
      // Intentar parsear el JSON
      const parsedData = JSON.parse(cleanedContent)
      
      // Verificar que tenga la estructura esperada de cotejo
      if (parsedData.titulo && parsedData.descripcion && parsedData.criterios && Array.isArray(parsedData.criterios)) {
        // Actualizar el cotejo con el nuevo contenido
        setCotejo(JSON.stringify(parsedData, null, 2))
        setEditedContent(JSON.stringify(parsedData, null, 2))
        toast.success("Lista de cotejo actualizada exitosamente")
      } else {
        throw new Error("Formato de cotejo inválido")
      }
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar la lista de cotejo. El formato no es válido.")
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
      const topicRequest = {
        name: formData.name,
        topic: formData.theme+" Grado educativo: "+(formData.grade === "otro" ? formData.customGrade : formData.grade)+" Materia: "+(formData.subject === "otro" ? formData.customSubject : formData.subject),
        email: emailUser,
        public: formData.public,
        theme: formData.name,
        grade: formData.grade === "otro" ? formData.customGrade : formData.grade,
        subject: formData.subject === "otro" ? formData.customSubject : formData.subject
      }

      const response = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/education/cotejo/generar", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest),
      })

      if (!response.ok) {
        throw new Error('Error al generar la lista de cotejo')
      }

      const data = await response.json()
      setCotejo(JSON.stringify(data, null, 2))
      setEditedContent(JSON.stringify(data, null, 2))
      toast.success('Lista de cotejo generada exitosamente')
      
      // Limpiar el estado del chat cuando se genera una nueva lista de cotejo
      localStorage.removeItem('cotejoChatState')
      
      if (emailUser) {
        await gamificationService.addPoints(emailUser, 15, 'cotejo_creation')
        showPointsNotification(15, 'crear una lista de cotejo')
      }
      
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar la lista de cotejo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CotejoFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content)
  }

  const exportToPDF = async () => {
    if (!previewRef.current || !cotejo) return;

    try {
      const data = JSON.parse(cotejo);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 10;
      const pageWidth = 297; // Ancho A4 landscape
      const pageHeight = 210; // Alto A4 landscape
      const contentWidth = pageWidth - marginLeft - marginRight;

      const styles = {
        header: { fontSize: 14, fontStyle: 'bold' },
        subheader: { fontSize: 10, fontStyle: 'bold' },
        normal: { fontSize: 8, fontStyle: 'normal' },
        small: { fontSize: 7, fontStyle: 'normal' }
      };

      // Título
      pdf.setFont('helvetica', styles.header.fontStyle);
      pdf.setFontSize(styles.header.fontSize);
      const title = data.titulo;
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      // Descripción
      let yPos = marginTop + 10;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      const descLines = pdf.splitTextToSize(data.descripcion, contentWidth);
      pdf.text(descLines, marginLeft, yPos);
      yPos += descLines.length * 4 + 8;

      // Definir anchos de columnas
      const colWidths = [50, 70, 120, 30];
      const startX = marginLeft;

      // Criterios
      data.criterios.forEach((criterio: any) => {
        if (yPos + 40 > pageHeight - marginTop) {
          pdf.addPage('landscape');
          yPos = marginTop;
        }

        // Encabezado de la tabla
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.setFontSize(styles.subheader.fontSize);
        
        // Dibujar bordes de la tabla
        pdf.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 8);
        pdf.text('Criterio', startX + 2, yPos);
        pdf.text('Descripción', startX + colWidths[0] + 2, yPos);
        pdf.text('Escala de Calificación', startX + colWidths[0] + colWidths[1] + 2, yPos);
        pdf.text('Calificación', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
        yPos += 8;

        // Contenido del criterio
        pdf.setFont('helvetica', styles.normal.fontStyle);
        pdf.setFontSize(styles.normal.fontSize);
        
        // Calcular altura necesaria para la fila
        const criterioLines = pdf.splitTextToSize(criterio.nombre, colWidths[0] - 4);
        const descLines = pdf.splitTextToSize(criterio.descripcion, colWidths[1] - 4);
        const escalaText = criterio.escala.map((nivel: any) => 
          `${nivel.nivel}: ${nivel.descripcion}`
        ).join('\n');
        const escalaLines = pdf.splitTextToSize(escalaText, colWidths[2] - 4);
        const rowHeight = Math.max(criterioLines.length, descLines.length, escalaLines.length) * 4 + 4;

        // Dibujar bordes de la celda
        pdf.rect(startX, yPos - 4, colWidths[0], rowHeight);
        pdf.rect(startX + colWidths[0], yPos - 4, colWidths[1], rowHeight);
        pdf.rect(startX + colWidths[0] + colWidths[1], yPos - 4, colWidths[2], rowHeight);
        pdf.rect(startX + colWidths[0] + colWidths[1] + colWidths[2], yPos - 4, colWidths[3], rowHeight);
        
        // Nombre del criterio
        pdf.text(criterioLines, startX + 2, yPos);
        
        // Descripción
        pdf.text(descLines, startX + colWidths[0] + 2, yPos);
        
        // Escala
        pdf.text(escalaLines, startX + colWidths[0] + colWidths[1] + 2, yPos);
        
        // Espacio para calificación
        pdf.text('______', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
        
        yPos += rowHeight + 2;
      });

      addLogoToFooter(pdf);
      pdf.save(`cotejo-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Lista de cotejo exportada exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar la lista de cotejo");
    }
  };

  const handleExportExcel = async () => {
    if (!cotejo) {
      toast.error('No hay lista de cotejo para exportar');
      return;
    }

    try {
      const data = JSON.parse(cotejo);
      
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lista de Cotejo');

      // Configurar márgenes
      worksheet.pageSetup.margins = {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      };

      // Encabezado institucional
      worksheet.mergeCells('A1:D1');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = data.titulo;
      headerCell.font = { bold: true, size: 14 };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      };
      headerCell.font = { bold: true, color: { argb: 'FFFFFF' } };

      // Descripción
      worksheet.mergeCells('A2:D2');
      const descCell = worksheet.getCell('A2');
      descCell.value = data.descripcion;
      descCell.alignment = { wrapText: true };
      descCell.font = { size: 11 };

      // Agregar espacio
      worksheet.addRow([]);

      // Encabezados de la tabla
      const headers = ['Criterio', 'Descripción', 'Escala de Calificación', 'Calificación Obtenida'];
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' }
      };
      headerRow.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      // Configurar anchos de columna
      worksheet.columns = [
        { width: 30 }, // Criterio
        { width: 40 }, // Descripción
        { width: 50 }, // Escala de Calificación
        { width: 20 }  // Calificación Obtenida
      ];

      // Agregar los criterios
      data.criterios.forEach((criterio: any) => {
        const row = worksheet.addRow([
          criterio.nombre,
          criterio.descripcion,
          criterio.escala.map((nivel: any) => 
            `${nivel.nivel}: ${nivel.descripcion}`
          ).join('\n'),
          '______'
        ]);

        // Aplicar estilos a la fila
        row.eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 11 };
          cell.alignment = {
            vertical: 'top',
            horizontal: 'left',
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E0E0E0' } },
            left: { style: 'thin', color: { argb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
            right: { style: 'thin', color: { argb: 'E0E0E0' } }
          };
        });
      });

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.titulo}-cotejo.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Lista de cotejo exportada exitosamente");
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error("Error al exportar la lista de cotejo");
    }
  };

  const shareCotejo = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Lista de Cotejo - ${formData.name}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Lista de cotejo copiada al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir la lista de cotejo");
    }
  };

  const formatCotejoData = (data: CotejoData) => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">{data.titulo}</h2>
          <p className="text-gray-600 mb-6">{data.descripcion}</p>

          <div className="space-y-6">
            {data.criterios.map((criterio, index) => (
              <div key={index} className="border-t pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left w-1/5">Criterio</th>
                        <th className="border p-2 text-left w-1/4">Descripción</th>
                        <th className="border p-2 text-left w-2/5">Escala de Calificación</th>
                        <th className="border p-2 text-center w-1/5">Calificación Obtenida</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 font-semibold">{criterio.nombre}</td>
                        <td className="border p-2">{criterio.descripcion}</td>
                        <td className="border p-2">
                          <div className="space-y-2">
                            {criterio.escala.map((nivel, nivelIndex) => (
                              <div key={nivelIndex} className={nivelIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50 p-2'}>
                                <span className="font-semibold">{nivel.nivel}:</span> {nivel.descripcion}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border p-2 text-center">
                          <div className="flex items-center justify-center h-full">
                            <select 
                              className="w-24 h-8 border rounded text-center"
                            >
                              <option value="">Seleccionar</option>
                              <option value="Muy bien">Muy bien</option>
                              <option value="Bien">Bien</option>
                              <option value="Regular">Regular</option>
                              <option value="Mal">Mal</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const isFormValid = () => {
    return formData.grade && 
           formData.subject && 
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
              <RiCheckboxCircleFill className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900">Generador de Listas de Cotejo</h1>
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
                onClick={handleExportExcel}
                disabled={!editedContent}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar a Excel
              </Button>
              {cotejo && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
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
            {cotejo ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg border p-6"
              >
                {formatCotejoData(JSON.parse(cotejo))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <RiCheckboxCircleFill className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay lista de cotejo generada</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar una lista de cotejo.
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
              <h2 className="text-xl font-semibold">Generador de Listas de Cotejo</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <RiQuestionLine className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Listas de Cotejo</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Información Requerida:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Grado del estudiante</li>
                            <li>Asignatura específica</li>
                            <li>Tema o proyecto a evaluar</li>
                            <li>Nombre del recurso</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características de la Lista de Cotejo:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Escala de calificación: Mal, Regular, Bien, Muy bien</li>
                            <li>Criterios observables y medibles</li>
                            <li>Descripciones claras para cada nivel</li>
                            <li>Enfocada en la evaluación por observación</li>
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
                      <Label htmlFor="subject">Materia</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Selecciona la materia a evaluar</p>
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
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="theme">Tema o Proyecto a Evaluar</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema o proyecto que será evaluado con la lista de cotejo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    placeholder="Ej: Proyecto de investigación sobre el sistema solar, Presentación oral sobre la historia de Colombia..."
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
                    placeholder="Nombre completo del estudiante"
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
                        <p>Al marcar esta opción, tu lista de cotejo será visible para otros profesores en la comunidad</p>
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
                  {isLoading ? "Generando..." : "Generar Lista de Cotejo"}
                </Button>
              </motion.div>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {cotejo && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver Lista de Cotejo
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
            <DialogTitle>Previsualización de la Lista de Cotejo</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {cotejo ? (
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
                    onClick={handleExportExcel}
                    disabled={!editedContent}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar a Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={shareCotejo}
                    disabled={!editedContent}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </Button>
                  {cotejo && (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      onClick={openChatModal}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Mejorar con IA
                    </Button>
                  )}
                </div>

                <div
                  ref={previewRef}
                  className="bg-white rounded-lg border p-6"
                >
                  {formatCotejoData(JSON.parse(cotejo))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <RiCheckboxCircleFill className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay lista de cotejo generada</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar una lista de cotejo.
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
          localStorage.removeItem('cotejoChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Lista de Cotejo"
        description="Solicita mejoras específicas para tu lista de cotejo. El asistente te ayudará a optimizar los criterios y escalas de calificación."
        suggestions={[
          "Mejora los criterios de observación",
          "Añade más niveles de calificación",
          "Haz las descripciones más claras",
          "Incluye criterios adicionales",
          "Mejora la escala de evaluación",
          "Añade criterios de autoevaluación"
        ]}
        localStorageKey="cotejoChatState"
        isSlidesMode={true}
      />
    </Layout>
    </>
  )
} 