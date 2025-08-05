"use client"

import { Layout } from "@/components/layout"
import { CustomToolForm } from "@/components/custom-tool-form"
import { CustomToolConfig } from "@/types/custom-tool"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileDown, Share2, FileText } from "lucide-react"
import { exportToWord } from '@/utils/word-export'
import jsPDF from 'jspdf'
import { addLogoToFooter } from '@/utils/pdf-utils'
import TypingEffect from "@/components/typing-effect"
export default function CustomToolPage() {
  const [tool, setTool] = useState<CustomToolConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [response, setResponse] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const email = localStorage.getItem("email")
        if (!email) {
          toast.error("No se encontró el email del usuario")
          router.push('/workshop')
          return
        }

        // Obtener el ID de la ruta
        const toolId = params?.id as string
        console.log('Tool ID:', toolId) // Para debugging

        if (!toolId) {
          toast.error('ID de herramienta no válido')
          router.push('/workshop')
          return
        }

        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools/${toolId}?email=${email}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Herramienta no encontrada')
            router.push('/workshop')
            return
          }
          throw new Error('Error al cargar la herramienta')
        }

        const data = await response.json()
        console.log('Tool data:', data) // Para debugging
        setTool(data)
      } catch (error) {
        console.error('Error fetching tool:', error)
        toast.error('Error al cargar la herramienta')
        router.push('/workshop')
      } finally {
        setIsLoading(false)
      }
    }

    if (params?.id) {
      fetchTool()
    }
  }, [params?.id, router])

  const handleResponse = (newResponse: string) => {
    setResponse(newResponse)
  }

  const handleContentChange = (newContent: string) => {
    setResponse(newContent)
  }

  const exportToPDF = async () => {
    if (!previewRef.current || !tool) return;

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
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Título y encabezado
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(tool.name, marginLeft, marginTop);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tool.description, marginLeft, marginTop + 10);
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido
      let yPos = marginTop + 25;
      
      // Solo exportar la respuesta generada
      if (response) {
        if (yPos > pageHeight - marginTop - 20) {
          addLogoToFooter(pdf);
          pdf.addPage();
          yPos = marginTop;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const splitText = pdf.splitTextToSize(response, contentWidth);
        pdf.text(splitText, marginLeft, yPos);
      }

      addLogoToFooter(pdf);
      pdf.save(`${tool.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Datos exportados exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar los datos");
    }
  };

  const handleExportWord = async () => {
    if (!tool || !response) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      await exportToWord(
        response,
        tool.name,
        tool.name.toLowerCase().replace(/\s+/g, '-')
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareData = async () => {
    if (!response) {
      toast.error('No hay datos para compartir');
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: tool?.name,
          text: response,
        });
      } else {
        await navigator.clipboard.writeText(response);
        toast.success("Datos copiados al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir los datos");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Cargando herramienta...</p>
        </div>
      </Layout>
    )
  }

  if (!tool) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Herramienta no encontrada</h1>
          <p className="text-gray-600 mb-8">La herramienta que buscas no existe o ha sido eliminada.</p>
          <button
            onClick={() => router.push('/workshop')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver al taller
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex h-screen"
      >
        {/* Panel izquierdo - Previsualización */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 overflow-y-auto p-6 border-r"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-between items-center mb-6"
          >
            <h1 className="text-xl font-semibold">{tool.name}</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar a Word
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareData}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative" 
            ref={previewRef}
          >
            {response ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <TypingEffect 
                  content={response}
                  isLoading={isGenerating}
                  loadingMessage="Generando respuesta..."
                  typingMessage="Escribiendo respuesta..."
                  onContentChange={handleContentChange}
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <p className="text-center mb-2">No hay respuesta generada</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha y haz clic en "Generar" para obtener una respuesta.
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
          className="w-[400px] p-6 overflow-y-auto bg-gray-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold mb-6">{tool.name}</h2>
            <CustomToolForm tool={tool} onResponse={handleResponse} />
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  )
} 