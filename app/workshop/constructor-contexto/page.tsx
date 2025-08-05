"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { exportToWord } from '@/utils/word-export';

interface ContextFormData {
  topic: string;
  course: string;
  name: string;
  customGrade: string;
}

export default function ContextBuilder() {
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [formData, setFormData] = useState<ContextFormData>({
    topic: "",
    course: "",
    name: "",
    customGrade: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')

    try {
      const topic = `Genera un contexto educativo para el tema: ${formData.topic} 
      para el nivel educativo: ${formData.course === "otro" ? formData.customGrade : formData.course}. 
      El contexto debe incluir:
      - Situación real o hipotética
      - Personajes relevantes
      - Escenario detallado
      - Problema o desafío
      - Objetivos de aprendizaje
      - Conexiones con el mundo real`
      const email = localStorage.getItem('email')
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/constructor-contexto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, email, name: formData.name })
      })

      if (!response.ok) {
        throw new Error('Error al generar el contexto')
      }

      const data = await response.text()
      setContext(data)
      setEditedContent(data)
      setLoadingState('typing')
      toast.success("Contexto generado exitosamente")

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el contexto")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ContextFormData, value: string) => {
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
      pdf.text(`Contexto Educativo: ${formData.topic}`, marginLeft, marginTop);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nivel: ${formData.course}`, marginLeft, marginTop + 10);
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido del contexto
      let yPos = marginTop + 25;
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
        title: `Contexto Educativo - ${formData.topic}`,
        subject: formData.course,
        author: 'Constructor de Contexto',
      });

      // Guardar PDF
      pdf.save(`contexto-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Contexto exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el contexto");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay contexto para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Contexto Educativo: ${formData.topic}`,
        `contexto-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareContext = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Contexto Educativo - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Contexto copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el contexto");
    }
  };

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Panel izquierdo - Editor y Previsualizador */}
        <div className="flex-1 overflow-y-auto p-6 border-r">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">Constructor de Contexto</h1>
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
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareContext}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </div>
          </div>

          {/* Editor toolbar */}
          <div className="border-b pb-3 mb-6 flex items-center gap-2">
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
          </div>

          {/* Typing Effect Content Area */}
          <div className="relative" ref={previewRef}>
            {context ? (
              <TypingEffect 
                content={context}
                isLoading={loading}
                onContentChange={handleContentChange}
                loadingMessage="Generando contexto..."
                typingMessage="Escribiendo contexto..."
              />
            ) : (
              <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]">
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay contexto generado</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar un contexto educativo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="w-[400px] p-6 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Constructor de Contexto</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Tema *</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Cambio climático"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="course">Nivel educativo *</Label>
                  <Select
                    value={formData.course}
                    onValueChange={(value) => handleInputChange("course", value)}
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
                  {formData.course === "otro" && (
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

                <div>
                  <Label htmlFor="name">Nombre del Contexto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Contexto Histórico de la Revolución Industrial"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>
              </div>

              <LoadingButton 
                isLoading={loadingState === 'generating'}
                loadingText="Generando contexto..."
                disabled={loading || !formData.topic || !formData.course}
                type="submit"
                className="w-full"
                size="lg"
              >
                Generar Contexto
              </LoadingButton>
            </form>
          </div>
        </div>
      </div>
      <Toaster />
    </Layout>
  )
}

