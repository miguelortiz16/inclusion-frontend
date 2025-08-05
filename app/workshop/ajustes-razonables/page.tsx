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
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"

interface AjusteFormData {
  topic: string;
  grade: string;
  customGrade: string;
  name: string;
  isPublic: boolean;
  subject: string[];
  customSubject?: string;
  theme: string;
  email: string;
  medicalHistory: string;
}

export default function AjustesRazonables() {
  const router = useRouter()
  const [formData, setFormData] = useState<AjusteFormData>({
    topic: "",
    grade: "",
    customGrade: "",
    name: "",
    isPublic: false,
    subject: [],
    theme: "",
    email: "",
    medicalHistory: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [ajustes, setAjustes] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian los ajustes
  useEffect(() => {
    if (ajustes) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('ajustesFromChat')
      if (!isFromChat) {
        localStorage.removeItem('ajustesChatState')
        console.log('Ajustes generados desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('ajustesFromChat')
      }
    }
  }, [ajustes])
 
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
    // Enviar solo el área/asignatura como referencia para que el chat pueda buscar el contenido
    if (!ajustes) return ""
    
    try {
      const ajustesData = JSON.parse(ajustes)
      if (ajustesData && ajustesData.length > 0) {
        return ajustesData[0]["campo_de_pensamiento"] || ""
      }
      return ""
    } catch (error) {
      console.error('Error al parsear ajustes:', error)
      return ""
    }
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('ajustesFromChat', 'true')
      
      // Limpiar el formato ```json y ``` del string si viene
      let cleanedContent = newContent
      if (cleanedContent.includes('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (cleanedContent.includes('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '')
      }
      
      // Intentar parsear el JSON
      const parsedData = JSON.parse(cleanedContent)
      
      // Verificar que tenga la estructura esperada de ajustes razonables
      if (parsedData.ajustes_razonables && Array.isArray(parsedData.ajustes_razonables)) {
        // Actualizar los ajustes con el nuevo contenido
        setAjustes(JSON.stringify(parsedData.ajustes_razonables, null, 2))
        setEditedContent(JSON.stringify(parsedData.ajustes_razonables, null, 2))
        toast.success("Ajustes razonables actualizados exitosamente")
      } else if (Array.isArray(parsedData)) {
        // Si viene directamente como array
        setAjustes(JSON.stringify(parsedData, null, 2))
        setEditedContent(JSON.stringify(parsedData, null, 2))
        toast.success("Ajustes razonables actualizados exitosamente")
      } else {
        throw new Error("Formato de ajustes razonables inválido")
      }
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar los ajustes razonables. El formato no es válido.")
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
      // Preparar los datos para enviar al backend
      const dataToSend = {
        ...formData,
        subject: formData.subject.join(", "), // Convertir array a string separado por comas
        topic: formData.theme+" Grado/Nivel educativo: "+(formData.grade === "otro" ? formData.customGrade : formData.grade)+" Materia: "+formData.subject.join(", ") + "  "+formData.customSubject+" Antecedentes Clínicos o Historial Médico: "+formData.medicalHistory,
        email: emailUser ,
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/ajustes-razonables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error('Error al generar los ajustes razonables')
      }

      const data = await response.json()
      setAjustes(JSON.stringify(data.ajustes_razonables, null, 2))
      setEditedContent(JSON.stringify(data.ajustes_razonables, null, 2))
      toast.success('Ajustes razonables generados exitosamente')
      
      // Limpiar el estado del chat cuando se generan nuevos ajustes
      localStorage.removeItem('ajustesChatState')
      
      // Agregar puntos por generar ajustes razonables
      if (emailUser) {
        await gamificationService.addPoints(emailUser, 15, 'piar_creation')
        showPointsNotification(15, 'crear un Plan de Apoyo a la Inclusión (PIAR)')
      }
      
      // En móvil, mostrar el modal de previsualización
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar los ajustes razonables')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AjusteFormData, value: string | boolean | string[]) => {
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
    if (!previewRef.current || !ajustes) return;

    try {
      const data = JSON.parse(ajustes);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Configuración básica
      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 15;
      const pageWidth = 297; // Ancho A4 landscape
      const pageHeight = 210; // Alto A4 landscape
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Estilos consistentes
      const styles = {
        header: { fontSize: 18, fontStyle: 'bold' },
        subheader: { fontSize: 14, fontStyle: 'bold' },
        normal: { fontSize: 10, fontStyle: 'normal' },
        small: { fontSize: 8, fontStyle: 'normal' },
        table: { fontSize: 9, fontStyle: 'normal' },
        tableHeader: { fontSize: 9, fontStyle: 'bold' }
      };

      // Título y encabezado
      pdf.setFont('helvetica', styles.header.fontStyle);
      pdf.setFontSize(styles.header.fontSize);
      const title = 'Plan de Apoyo a la Inclusión (PIAR)';
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      // Información del estudiante
      let yPos = marginTop + 10;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      pdf.text(`Estudiante: ${formData.name}`, marginLeft, yPos);
      yPos += 6;
      pdf.text(`Nivel: ${formData.grade}`, marginLeft, yPos);
      yPos += 6;
      pdf.text(`Materias: ${formData.subject.join(", ")}`, marginLeft, yPos);
      yPos += 10;

      // Tabla principal
      const headers = [
        'Área/asignatura',
        'Campo de pensamiento',
        'Área de desarrollo',
        'Dimensiones articulación',
        'Dinámicas de vida diaria'
      ];

      const columnWidths = [
        contentWidth * 0.2,
        contentWidth * 0.2,
        contentWidth * 0.2,
        contentWidth * 0.2,
        contentWidth * 0.2
      ];

      // Estilo de encabezado de tabla
      pdf.setFillColor(243, 244, 246); // #f3f4f6
      pdf.rect(marginLeft, yPos, contentWidth, 8, 'F');
      pdf.setFont('helvetica', styles.tableHeader.fontStyle);
      pdf.setFontSize(styles.tableHeader.fontSize);

      let xPos = marginLeft;
      headers.forEach((header, i) => {
        pdf.text(header, xPos + 2, yPos + 5);
        xPos += columnWidths[i];
      });

      yPos += 8;

      // Contenido de la tabla
      pdf.setFont('helvetica', styles.table.fontStyle);
      pdf.setFontSize(styles.table.fontSize);

      data.forEach((item: any) => {
        const cellContents = [
          item["Área/asignatura"],
          item.campo_de_pensamiento,
          item.área_de_desarrollo,
          item.dimensiones_articulacion_con_educacion_media,
          item.dinamicas_de_la_vida_diaria
        ];

        const wrappedContents = cellContents.map((content, i) => 
          pdf.splitTextToSize(content, columnWidths[i] - 4)
        );

        const maxLines = Math.max(...wrappedContents.map(lines => lines.length));
        const rowHeight = Math.max(maxLines * 4, 8);

        if (yPos + rowHeight > pageHeight - marginTop) {
          pdf.addPage();
          yPos = marginTop;
        }

        // Dibujar el fondo de la fila
        pdf.setFillColor(255, 255, 255);
        pdf.rect(marginLeft, yPos, contentWidth, rowHeight, 'F');

        // Dibujar el contenido
        xPos = marginLeft;
        wrappedContents.forEach((lines, i) => {
          pdf.text(lines, xPos + 2, yPos + 4);
          xPos += columnWidths[i];
        });

        // Dibujar las líneas de la tabla
        pdf.setDrawColor(204, 204, 204); // #CCCCCC
        pdf.line(marginLeft, yPos, marginLeft + contentWidth, yPos);
        pdf.line(marginLeft, yPos, marginLeft, yPos + rowHeight);
        xPos = marginLeft;
        columnWidths.forEach(width => {
          xPos += width;
          pdf.line(xPos, yPos, xPos, yPos + rowHeight);
        });
        pdf.line(marginLeft, yPos + rowHeight, marginLeft + contentWidth, yPos + rowHeight);

        yPos += rowHeight;
      });

      // Secciones adicionales
      data.forEach((item: any) => {
        const sections = [
          {
            title: 'Barreras Identificadas',
            content: item.barreras_identificadas,
            type: 'list'
          },
          {
            title: 'Tipo de Ajuste',
            content: item.tipo_ajuste,
            type: 'list'
          },
          {
            title: 'Apoyo Requerido',
            content: item.apoyo_requerido,
            type: 'list'
          },
          {
            title: 'Descripción de Ajustes y Apoyos',
            content: item.descripcion_de_ajustes_y_apoyos,
            type: 'list'
          },
          {
            title: 'Seguimiento',
            content: item.seguimiento,
            type: 'text'
          }
        ];

        sections.forEach(section => {
          yPos += 10;

          if (yPos + 40 > pageHeight - marginTop) {
            pdf.addPage();
            yPos = marginTop;
          }

          // Título de la sección
          pdf.setFont('helvetica', styles.subheader.fontStyle);
          pdf.setFontSize(styles.subheader.fontSize);
          pdf.text(section.title, marginLeft, yPos);
          yPos += 6;

          // Contenido de la sección
          pdf.setFont('helvetica', styles.normal.fontStyle);
          pdf.setFontSize(styles.normal.fontSize);

          if (section.type === 'list') {
            (section.content as string[]).forEach(item => {
              const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - 4);
              if (yPos + (lines.length * 5) > pageHeight - marginTop) {
                pdf.addPage();
                yPos = marginTop;
              }
              pdf.text(lines, marginLeft, yPos);
              yPos += lines.length * 5;
            });
          } else {
            const lines = pdf.splitTextToSize(section.content as string, contentWidth - 4);
            if (yPos + (lines.length * 5) > pageHeight - marginTop) {
              pdf.addPage();
              yPos = marginTop;
            }
            pdf.text(lines, marginLeft, yPos);
            yPos += lines.length * 5;
          }
        });

        // Informe PIAR
        yPos += 10;
        if (yPos + 100 > pageHeight - marginTop) {
          pdf.addPage();
          yPos = marginTop;
        }

        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.setFontSize(styles.subheader.fontSize);
        pdf.text('Informe PIAR', marginLeft, yPos);
        yPos += 8;

        pdf.setFont('helvetica', styles.normal.fontStyle);
        pdf.setFontSize(styles.normal.fontSize);

        const informe = item.informe_piar;
        const informeDetails = [
          { label: 'Fase:', value: informe.fase },
          { label: 'Fecha de inicio:', value: informe.fecha_inicio },
          { label: 'Descripción de la intervención:', value: informe.descripcion_intervencion },
          { label: 'Objetivo de la intervención:', value: informe.objetivo_intervencion }
        ];

        informeDetails.forEach(detail => {
          const text = `${detail.label} ${detail.value}`;
          const lines = pdf.splitTextToSize(text, contentWidth - 4);
          if (yPos + (lines.length * 5) > pageHeight - marginTop) {
            pdf.addPage();
            yPos = marginTop;
          }
          pdf.text(lines, marginLeft, yPos);
          yPos += lines.length * 5 + 2;
        });

        // Acciones realizadas
        yPos += 4;
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.text('Acciones realizadas:', marginLeft, yPos);
        yPos += 6;
        pdf.setFont('helvetica', styles.normal.fontStyle);
        informe.acciones_realizadas.forEach(accion => {
          const lines = pdf.splitTextToSize(`• ${accion}`, contentWidth - 4);
          if (yPos + (lines.length * 5) > pageHeight - marginTop) {
            pdf.addPage();
            yPos = marginTop;
          }
          pdf.text(lines, marginLeft, yPos);
          yPos += lines.length * 5;
        });

        // Responsables
        yPos += 4;
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.text('Responsables:', marginLeft, yPos);
        yPos += 6;
        pdf.setFont('helvetica', styles.normal.fontStyle);
        informe.responsables.forEach(responsable => {
          const lines = pdf.splitTextToSize(`• ${responsable}`, contentWidth - 4);
          if (yPos + (lines.length * 5) > pageHeight - marginTop) {
            pdf.addPage();
            yPos = marginTop;
          }
          pdf.text(lines, marginLeft, yPos);
          yPos += lines.length * 5;
        });

        // Evaluación periódica
        yPos += 4;
        const evalText = `Evaluación periódica: ${informe.evaluacion_periodica}`;
        const evalLines = pdf.splitTextToSize(evalText, contentWidth - 4);
        if (yPos + (evalLines.length * 5) > pageHeight - marginTop) {
          pdf.addPage();
          yPos = marginTop;
        }
        pdf.text(evalLines, marginLeft, yPos);
      });

      addLogoToFooter(pdf);
      pdf.save(`piar-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("PIAR exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el PIAR");
    }
  };

  const handleExportWord = async () => {
    if (!ajustes) {
      toast.error('No hay PIAR para exportar');
      return;
    }

    try {
      const data = JSON.parse(ajustes);
      
      // Preparar los datos en el formato esperado por la función exportToWord
      const content = {
        studentInfo: {
          name: formData.name,
          grade: formData.grade,
          subjects: formData.subject.join(", ")
        },
        mainTable: {
          headers: [
            'Área/asignatura',
            'Campo de pensamiento',
            'Área de desarrollo',
            'Dimensiones articulación con educación media',
            'Dinámicas de la vida diaria'
          ],
          rows: data.map((item: any) => [
            item["Área/asignatura"],
            item.campo_de_pensamiento,
            item.área_de_desarrollo,
            item.dimensiones_articulacion_con_educacion_media,
            item.dinamicas_de_la_vida_diaria
          ])
        },
        sections: [
          {
            title: 'Barreras Identificadas',
            content: data[0].barreras_identificadas
          },
          {
            title: 'Tipo de Ajuste',
            content: data[0].tipo_ajuste
          },
          {
            title: 'Apoyo Requerido',
            content: data[0].apoyo_requerido
          },
          {
            title: 'Descripción de Ajustes y Apoyos',
            content: data[0].descripcion_de_ajustes_y_apoyos
          },
          {
            title: 'Seguimiento',
            content: data[0].seguimiento
          }
        ],
        informe: {
          details: {
            'Fase': data[0].informe_piar.fase,
            'Fecha de inicio': data[0].informe_piar.fecha_inicio,
            'Descripción de la intervención': data[0].informe_piar.descripcion_intervencion,
            'Objetivo de la intervención': data[0].informe_piar.objetivo_intervencion,
            'Evaluación periódica': data[0].informe_piar.evaluacion_periodica
          },
          acciones: data[0].informe_piar.acciones_realizadas,
          responsables: data[0].informe_piar.responsables
        }
      };

      await exportToWord(
        content,
        'Plan de Apoyo a la Inclusión (PIAR)',
        `piar-${formData.name.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('PIAR exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareAjustes = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Plan de Apoyo a la Inclusión (PIAR) - ${formData.name}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Ajustes copiados al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir los ajustes");
    }
  };

  const formatPiarData = (data: any) => {
    if (!data || !Array.isArray(data)) return null;

    return (
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Área/asignatura</th>
              <th className="border border-gray-300 p-2 text-left">Campo de pensamiento</th>
              <th className="border border-gray-300 p-2 text-left">Área de desarrollo</th>
              <th className="border border-gray-300 p-2 text-left">Dimensiones articulación con educación media</th>
              <th className="border border-gray-300 p-2 text-left">Dinámicas de la vida diaria</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: any, index: number) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 p-2 align-top">
                  {item["Área/asignatura"]}
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  {item.campo_de_pensamiento}
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  {item.área_de_desarrollo}
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  {item.dimensiones_articulacion_con_educacion_media}
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  {item.dinamicas_de_la_vida_diaria}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.map((item: any, index: number) => (
          <div key={index} className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Barreras Identificadas:</h3>
              <ul className="list-disc list-inside space-y-2">
                {item.barreras_identificadas.map((barrera: string, i: number) => (
                  <li key={i}>{barrera}</li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Tipo de Ajuste:</h3>
              <ul className="list-disc list-inside space-y-2">
                {item.tipo_ajuste.map((ajuste: string, i: number) => (
                  <li key={i}>{ajuste}</li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Apoyo Requerido:</h3>
              <ul className="list-disc list-inside space-y-2">
                {item.apoyo_requerido.map((apoyo: string, i: number) => (
                  <li key={i}>{apoyo}</li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Descripción de Ajustes y Apoyos:</h3>
              <ul className="list-disc list-inside space-y-2">
                {item.descripcion_de_ajustes_y_apoyos.map((desc: string, i: number) => (
                  <li key={i}>{desc}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Seguimiento:</h3>
              <p>{item.seguimiento}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Informe PIAR:</h3>
              <div className="space-y-2">
                <p><strong>Fase:</strong> {item.informe_piar.fase}</p>
                <p><strong>Fecha de inicio:</strong> {item.informe_piar.fecha_inicio}</p>
                <p><strong>Descripción de la intervención:</strong> {item.informe_piar.descripcion_intervencion}</p>
                <p><strong>Objetivo de la intervención:</strong> {item.informe_piar.objetivo_intervencion}</p>
                
                <div>
                  <strong>Acciones realizadas:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {item.informe_piar.acciones_realizadas.map((accion: string, i: number) => (
                      <li key={i}>{accion}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong>Responsables:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {item.informe_piar.responsables.map((responsable: string, i: number) => (
                      <li key={i}>{responsable}</li>
                    ))}
                  </ul>
                </div>

                <p><strong>Evaluación periódica:</strong> {item.informe_piar.evaluacion_periodica}</p>
              </div>
            </div>
          </div>
        ))}
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
              <h1 className="text-2xl font-bold text-gray-900">Plan de Apoyo a la Inclusión (PIAR)</h1>
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
              {ajustes && (
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
            {ajustes ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg border p-6"
              >
                {formatPiarData(JSON.parse(ajustes))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <RiUserSettingsLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay ajustes generados</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar el Plan de Apoyo a la Inclusión (PIAR).
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
              <h2 className="text-xl font-semibold">Generador de PIAR</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <RiQuestionLine className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Plan de Apoyo a la Inclusión (PIAR)</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Información Requerida:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Grado del estudiante</li>
                            <li>Asignatura específica</li>
                            <li>Área o tema de estudio</li>
                            <li>Nombre del estudiante</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características de los Ajustes:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Personalizados según las necesidades del estudiante</li>
                            <li>Adaptados al nivel educativo</li>
                            <li>Enfocados en la inclusión</li>
                            <li>Basados en mejores prácticas educativas</li>
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
                        <SelectItem value="otro">Otro</SelectItem>
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
                    <Label htmlFor="theme">Condiciones que Afectan el Aprendizaje o Obstáculos en el Proceso de Aprendizaje,  temas de la clase o contexto de estudiante</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe las condiciones o obstáculos que afectan el aprendizaje del estudiante</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    placeholder="Ej: Dificultades en la comprensión lectora, problemas de atención, barreras en el acceso a la información..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="medicalHistory">Antecedentes Clínicos o Historial Médico</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe cualquier condición médica, diagnóstico o antecedente clínico relevante que deba considerarse</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    placeholder="Ej: Diagnóstico de TDAH, condición visual, alergias, medicamentos..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Estudiante</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <RiQuestionLine className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa el nombre completo del estudiante</p>
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
                        <p>Al marcar esta opción, tus ajustes serán visibles para otros profesores en la comunidad</p>
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
                  {isLoading ? "Generando..." : "Generar PIAR"}
                </Button>
              </motion.div>
            </motion.form>

            {/* Botón para mostrar previsualización en móvil */}
            {ajustes && (
              <div className="lg:hidden mt-4">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver PIAR
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
            <DialogTitle>Previsualización del PIAR</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {ajustes ? (
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
                    onClick={shareAjustes}
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
                  {formatPiarData(JSON.parse(ajustes))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <RiUserSettingsLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay ajustes generados</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar el Plan de Apoyo a la Inclusión (PIAR).
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
          localStorage.removeItem('ajustesChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Ajustes Razonables"
        description="Solicita mejoras específicas para tu Plan de Apoyo a la Inclusión (PIAR). El asistente te ayudará a optimizar los ajustes y estrategias de inclusión."
        suggestions={[
          "Mejora las barreras identificadas",
          "Optimiza los tipos de ajuste",
          "Fortalece el apoyo requerido",
          "Añade más descripciones de ajustes",
          "Mejora el seguimiento",
          "Incluye más estrategias inclusivas"
        ]}
        localStorageKey="ajustesChatState"
        isSlidesMode={true}
      />
    </Layout>
    </>
  )
} 