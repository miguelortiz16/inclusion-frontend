"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, Loader2, HelpCircle, FileText } from "lucide-react"
import { jsPDF } from 'jspdf'
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import html2canvas from 'html2canvas'
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

interface MindMapData {
  id: string;
  label: string;
  level: string;
  children: MindMapData[];
}

interface MindMapContent {
  topic: string;
  concepts: string[];
  relationships: string[];
}

export default function MapaMental() {
  const [loading, setLoading] = useState(false)
  const [mindmap, setMindmap] = useState<MindMapData | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    topic: "",
    level: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MindMapData | null>(null)
  const [editedContent, setEditedContent] = useState<MindMapContent | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)

    const maxRetries = 3;
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
      try {
        const email = localStorage.getItem('email')
        if (!email) {
          throw new Error('No se encontró el email del usuario')
        }

        const response = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/education/mapa-mental", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            topic: "Tema: "+formData.topic+"\n"+"grado educativo: "+formData.level,
            email,
          }),
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || 'Error al generar el mapa conceptual')
        }

        if (!responseData.data || !responseData.data.label || !Array.isArray(responseData.data.children)) {
          throw new Error('Formato de respuesta inválido')
        }

        setData(responseData.data)
        setMindmap(responseData.data)
        toast.success("Mapa conceptual generado exitosamente")

        // Mostrar modal automáticamente en móvil
        if (window.innerWidth < 1024) {
          setShowPreviewModal(true)
        }

        break; // Si todo sale bien, salimos del bucle

      } catch (err) {
        currentRetry++;
        if (currentRetry === maxRetries) {
          setError(err instanceof Error ? err.message : 'Error al generar el mapa conceptual')
          toast.error(err instanceof Error ? err.message : 'Error al generar el mapa conceptual')
        } else {
          // Esperamos con backoff exponencial antes de reintentar
          const delay = 1000 * currentRetry; // 1s, 2s, 3s
          console.log(`Reintentando... (${currentRetry}/${maxRetries}) después de ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          toast.info(`Reintentando... (${currentRetry}/${maxRetries})`)
        }
      }
    }

    setLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    if (!editedContent) {
      const lines = content.split('\n');
      const concepts: string[] = [];
      const relationships: string[] = [];
      let topic = '';
      
      lines.forEach(line => {
        if (line.startsWith('Tema:')) {
          topic = line.replace('Tema:', '').trim();
        } else if (line.startsWith('Concepto:')) {
          concepts.push(line.replace('Concepto:', '').trim());
        } else if (line.startsWith('Relación:')) {
          relationships.push(line.replace('Relación:', '').trim());
        }
      });
      
      setEditedContent({ topic, concepts, relationships });
      return;
    }
    
    const lines = content.split('\n');
    const concepts: string[] = [];
    const relationships: string[] = [];
    let topic = editedContent.topic;
    
    lines.forEach(line => {
      if (line.startsWith('Tema:')) {
        topic = line.replace('Tema:', '').trim();
      } else if (line.startsWith('Concepto:')) {
        concepts.push(line.replace('Concepto:', '').trim());
      } else if (line.startsWith('Relación:')) {
        relationships.push(line.replace('Relación:', '').trim());
      }
    });
    
    setEditedContent({ topic, concepts, relationships });
  };

  const exportToPDF = async () => {
    if (!mindmap) return;

    try {
      // Capturar el mapa mental como imagen
      const mindmapElement = document.querySelector('.mindmap-container');
      if (!mindmapElement) return;

      const canvas = await html2canvas(mindmapElement as HTMLElement, {
        scale: 3, // Aumentamos la escala para mejor calidad
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: mindmapElement.scrollWidth,
        height: mindmapElement.scrollHeight
      });

      // Inicializar PDF en formato horizontal
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Agregar encabezado
      addStandardHeader(pdf, 'Mapa Mental', `Tema: ${formData.topic} - Nivel: ${formData.level}`);
      
      // Calcular dimensiones para la imagen
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = (pageWidth - 40) * 0.5; // Reducimos el ancho en 50% adicional (total 70% más pequeño)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Asegurarnos de que la imagen no exceda la altura de la página
      const finalHeight = Math.min(imgHeight, pageHeight - 60); // Dejamos espacio para el encabezado y pie
      
      // Calcular la posición centrada
      const xPos = (pageWidth - imgWidth) / 2;
      
      // Agregar la imagen del mapa mental
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', xPos, 40, imgWidth, finalHeight);
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Mapa mental exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el mapa mental");
    }
  };

  const shareMindMap = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Mapa Conceptual - ${formData.topic}`,
          text: `Tema: ${formData.topic}\n\nEstructura:\n${JSON.stringify(mindmap, null, 2)}`,
        });
      } else {
        await navigator.clipboard.writeText(`Tema: ${formData.topic}\n\nEstructura:\n${JSON.stringify(mindmap, null, 2)}`);
        toast.success("Mapa Conceptual copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el Mapa Conceptual");
    }
  };

  const handleExportWord = async () => {
    if (!mindmap) {
      toast.error('No hay mapa mental para exportar');
      return;
    }

    try {
      // Capturar el mapa mental como imagen
      const mindmapElement = document.querySelector('.mindmap-container');
      if (!mindmapElement) return;

      const canvas = await html2canvas(mindmapElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: mindmapElement.scrollWidth,
        height: mindmapElement.scrollHeight
      });

      // Convertir la imagen a base64
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Crear el contenido del documento con estilos mejorados
      const content = `
        <div style="text-align: center; font-family: Arial, sans-serif;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">Mapa Mental: ${formData.topic}</h1>
          <p style="font-size: 16px; margin-bottom: 20px;">Nivel: ${formData.level}</p>
          <div style="margin: 20px auto; max-width: 100%;">
            <img src="${imgData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
          </div>
        </div>
      `;

      await exportToWord(
        content,
        `Mapa Mental: ${formData.topic}`,
        formData.name.toLowerCase().replace(/\s+/g, '-')
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row h-screen"
      >
        {/* Panel izquierdo - Mapa Conceptual */}
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
              <h1 className="text-xl font-semibold">Generador de Mapa Conceptual</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Generar Mapas Conceptuales</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Mapas Conceptuales:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas con conceptos interrelacionados</li>
                            <li>Organiza los conceptos de lo general a lo específico</li>
                            <li>Usa palabras clave y frases cortas</li>
                            <li>Establece conexiones lógicas entre conceptos</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>El Sistema Solar</li>
                            <li>La Fotosíntesis</li>
                            <li>La Revolución Industrial</li>
                            <li>Los Ecosistemas</li>
                            <li>Las Fracciones</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para la Estructura:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Comienza con el concepto principal en el centro</li>
                            <li>Agrega ramas para conceptos secundarios</li>
                            <li>Usa colores para diferenciar categorías</li>
                            <li>Mantén una jerarquía clara de conceptos</li>
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
              className="flex gap-2"
            >
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!mindmap}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareMindMap}
                disabled={!mindmap}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </motion.div>
          </motion.div>

          {mindmap ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="space-y-6 flex justify-center w-full"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-white rounded-lg border p-6 w-full max-w-4xl"
              >
                <div className="mindmap-container">
                  <div className="mindmap-root-container">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="mindmap-node root"
                    >
                      {mindmap.label}
                    </motion.div>
                    <div className="mindmap-children">
                      {mindmap.children && mindmap.children.map((child, index) => (
                        <motion.div 
                          key={child.id} 
                          className="mindmap-branch"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                        >
                          <div className="mindmap-node child">
                            {child.label}
                          </div>
                          {child.children && child.children.length > 0 && (
                            <div className="mindmap-children">
                              {child.children.map((grandChild, grandIndex) => (
                                <motion.div 
                                  key={grandChild.id} 
                                  className="mindmap-branch"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.5, delay: 1.0 + grandIndex * 0.1 }}
                                >
                                  <div className="mindmap-node grandchild">
                                    {grandChild.label}
                                  </div>
                                  {grandChild.children && grandChild.children.length > 0 && (
                                    <div className="mindmap-children">
                                      {grandChild.children.map((greatGrandChild, greatGrandIndex) => (
                                        <motion.div 
                                          key={greatGrandChild.id} 
                                          className="mindmap-branch"
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.5, delay: 1.1 + greatGrandIndex * 0.1 }}
                                        >
                                          <div className="mindmap-node great-grandchild">
                                            {greatGrandChild.label}
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-2">No hay Mapa Conceptual generado</p>
              <p className="text-center text-sm">
                Configura el tema en el panel derecho y genera un Mapa Conceptual automáticamente.
              </p>
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
              Generador de Mapa Conceptual
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
                    <Label htmlFor="name">Nombre del Recurso *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo a este recurso para identificarlo fácilmente.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Mapa Mental de la Fotosíntesis"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe el tema principal del mapa conceptual. Incluye conceptos clave y contexto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder={`Ej: "La Fotosíntesis: Proceso por el cual las plantas convierten la luz solar en energía. Incluye conceptos como clorofila, dióxido de carbono, oxígeno y glucosa."`}
                    required
                    maxLength={2000}
                    className="min-h-[100px] resize-none font-['Arial']"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/2000</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="level">Nivel Educativo</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar la complejidad del mapa conceptual.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    required
                  >
                    <option value="">Selecciona un nivel</option>
                    <option value="infantil">Educación Infantil</option>
                    <option value="1">Grado 1</option>
                    <option value="2">Grado 2</option>
                    <option value="3">Grado 3</option>
                    <option value="4">Grado 4</option>
                    <option value="5">Grado 5</option>
                    <option value="6">Grado 6</option>
                    <option value="7">Grado 7</option>
                    <option value="8">Grado 8</option>
                    <option value="9">Grado 9</option>
                    <option value="10">Grado 10</option>
                    <option value="11">Grado 11</option>
                    <option value="universidad">Universidad</option>
                  </select>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="flex gap-2"
              >
                <Button 
                  type="submit" 
                  disabled={loading || !formData.topic.trim()} 
                  className="flex-1" 
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : "Generar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  size="lg"
                  onClick={() => {
                    setFormData({ 
                      name: "", 
                      topic: "", 
                      level: "" 
                    })
                    setMindmap(null)
                  }}
                >
                  Limpiar
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>

          {mindmap && (
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
              <DialogTitle>Previsualización del Mapa Conceptual</DialogTitle>
            </DialogHeader>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
              {mindmap ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="space-y-6 flex justify-center w-full"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-white rounded-lg border p-4 sm:p-6 w-full max-w-4xl"
                  >
                    <div className="mindmap-container">
                      <div className="mindmap-root-container">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                          className="mindmap-node root"
                        >
                          {mindmap.label}
                        </motion.div>
                        <div className="mindmap-children">
                          {mindmap.children && mindmap.children.map((child, index) => (
                            <motion.div 
                              key={child.id} 
                              className="mindmap-branch"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                            >
                              <div className="mindmap-node child">
                                {child.label}
                              </div>
                              {child.children && child.children.length > 0 && (
                                <div className="mindmap-children">
                                  {child.children.map((grandChild, grandIndex) => (
                                    <motion.div 
                                      key={grandChild.id} 
                                      className="mindmap-branch"
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.5, delay: 1.0 + grandIndex * 0.1 }}
                                    >
                                      <div className="mindmap-node grandchild">
                                        {grandChild.label}
                                      </div>
                                      {grandChild.children && grandChild.children.length > 0 && (
                                        <div className="mindmap-children">
                                          {grandChild.children.map((greatGrandChild, greatGrandIndex) => (
                                            <motion.div 
                                              key={greatGrandChild.id} 
                                              className="mindmap-branch"
                                              initial={{ opacity: 0, y: 20 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.5, delay: 1.1 + greatGrandIndex * 0.1 }}
                                            >
                                              <div className="mindmap-node great-grandchild">
                                                {greatGrandChild.label}
                                              </div>
                                            </motion.div>
                                          ))}
                                        </div>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="border border-dashed rounded-lg p-8 sm:p-16 flex flex-col items-center justify-center text-gray-500"
                >
                  <LightbulbIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay Mapa Conceptual generado</p>
                  <p className="text-center text-sm">
                    Configura el tema en el panel derecho y genera un Mapa Conceptual automáticamente.
                  </p>
                </motion.div>
              )}

              {/* Export buttons in modal */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={exportToPDF}
                  disabled={!mindmap}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a PDF
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleExportWord}
                  disabled={!mindmap}
                >
                  <FileText className="w-4 h-4" />
                  Exportar a Word
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={shareMindMap}
                  disabled={!mindmap}
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
  )
}

const styles = `
  .mindmap-container {
    width: 100%;
    min-height: 600px;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
    background: #ffffff;
  }

  .mindmap-root-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 1200px;
    width: 100%;
  }

  .mindmap-node {
    padding: 15px 25px;
    border-radius: 12px;
    width: 280px;
    text-align: center;
    background: #ffffff;
    margin-bottom: 20px;
    font-size: 1em;
    position: relative;
    transition: all 0.3s ease;
  }

  .mindmap-node:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .mindmap-node::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    width: 2px;
    height: 20px;
    background-color: #94a3b8;
    transform: translateX(-50%);
  }

  .mindmap-node.root {
    background: linear-gradient(135deg, #4158D0 0%, #C850C0 100%);
    color: white;
    font-weight: 500;
    border: none;
    box-shadow: 0 6px 12px rgba(65, 88, 208, 0.3);
  }

  .mindmap-children {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
  }

  .mindmap-branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .mindmap-branch .mindmap-children {
    flex-direction: row;
    justify-content: center;
    gap: 40px;
    margin-top: 20px;
  }

  .mindmap-branch .mindmap-children .mindmap-branch {
    width: auto;
    margin: 0;
  }

  .mindmap-branch .mindmap-children::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 50%;
    width: 2px;
    height: 20px;
    background-color: #94a3b8;
    transform: translateX(-50%);
  }

  .mindmap-branch .mindmap-children .mindmap-branch::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 50%;
    width: 2px;
    height: 20px;
    background-color: #94a3b8;
    transform: translateX(-50%);
  }

  .mindmap-node.child {
    background: linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%);
    color: #1a1a1a;
    border: none;
    box-shadow: 0 4px 8px rgba(255, 154, 158, 0.3);
  }

  .mindmap-node.grandchild {
    background: linear-gradient(135deg, #43E97B 0%, #38F9D7 100%);
    color: #1a1a1a;
    border: none;
    box-shadow: 0 4px 8px rgba(67, 233, 123, 0.3);
  }

  .mindmap-node.great-grandchild {
    background: linear-gradient(135deg, #F6D365 0%, #FDA085 100%);
    color: #1a1a1a;
    border: none;
    box-shadow: 0 4px 8px rgba(246, 211, 101, 0.3);
  }

  .mindmap-branch .mindmap-children::after {
    content: '';
    position: absolute;
    top: -20px;
    left: 20%;
    right: 20%;
    height: 2px;
    background-color: #94a3b8;
  }

  @media (max-width: 768px) {
    .mindmap-container {
      padding: 20px 10px;
    }
    
    .mindmap-node {
      width: 200px;
      padding: 12px 15px;
      font-size: 0.9em;
      margin-bottom: 15px;
    }

    .mindmap-branch .mindmap-children {
      gap: 20px;
      flex-wrap: wrap;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 