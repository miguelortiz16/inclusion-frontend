"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, FileText, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle } from "lucide-react"
import jsPDF from 'jspdf'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
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
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
interface EssayFormData {
  topic: string;
  course: string;
  name: string;
  isPublic: boolean;
  grade: string;
  customGrade: string;
}

export default function EssayGraderGenerator() {
  const [loading, setLoading] = useState(false)
  const [criteria, setCriteria] = useState<string>("")
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<EssayFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    grade: "",
    customGrade: ""
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

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
        setLoading(false)
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
        name: formData.name,
        topic: "tema:" + formData.topic + " grado educativo:" + (formData.course === "otro" ? formData.customGrade : formData.course),
        email: email,
        isPublic: formData.isPublic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/calificador-ensayos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar los criterios de calificación')
      }

      const data = await response.text()
      setCriteria(data)
      setEditedContent(data)
      toast.success("Criterios de calificación generados exitosamente")


    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar los criterios de calificación")
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      setLoading(false)
      return
    }
          // Agregar puntos por generar criterios de calificación
          await gamificationService.addPoints(email, 7, 'essay_grading_criteria_generation')
          showPointsNotification(7, 'generar criterios de calificación de ensayos')
    
  }

  const handleInputChange = (field: keyof EssayFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    setEditedContent(e.currentTarget.innerHTML)
  }

  const exportToPDF = async () => {
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
      pdf.text(`Criterios de Calificación`, marginLeft, marginTop);

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, marginTop + 15, pageWidth - marginRight, marginTop + 15);

      // Contenido de los criterios
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

      // Metadatos
      pdf.setProperties({
        title: `Criterios de Calificación`,
        subject: 'Evaluación de Ensayos',
        author: 'Generador de Criterios de Calificación',
      });

      // Guardar el PDF
      pdf.save(`criterios-calificacion.pdf`);
      toast.success("Criterios de calificación exportados exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar los criterios de calificación");
    }
  };

  const handleExportWord = async () => {
    if (!editedContent) {
      toast.error('No hay criterios para exportar');
      return;
    }

    try {
      await exportToWord(
        editedContent,
        `Criterios de Calificación`,
        `criterios-calificacion`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareCriteria = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Criterios de Calificación - ${formData.topic}`,
          text: editedContent,
        });
      } else {
        await navigator.clipboard.writeText(editedContent);
        toast.success("Criterios de calificación copiados al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir los criterios de calificación");
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
        className="flex h-screen"
      >
        {/* Panel izquierdo - Editor y Previsualizador */}
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <h1 className="text-xl font-semibold">Calificador de Ensayos</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para la Calificación de Ensayos</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Aspectos a Evaluar:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Estructura y organización del ensayo</li>
                            <li>Desarrollo de ideas y argumentos</li>
                            <li>Uso de fuentes y referencias</li>
                            <li>Ortografía y gramática</li>
                            <li>Estilo y claridad de la escritura</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Criterios de Calificación:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Coherencia y cohesión del texto</li>
                            <li>Profundidad del análisis</li>
                            <li>Originalidad de las ideas</li>
                            <li>Uso adecuado del lenguaje</li>
                            <li>Cumplimiento de requisitos formales</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para la Evaluación:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Lee el ensayo completo antes de calificar</li>
                            <li>Proporciona retroalimentación constructiva</li>
                            <li>Considera el nivel educativo del estudiante</li>
                            <li>Evalúa de manera objetiva y consistente</li>
                            <li>Destaca tanto fortalezas como áreas de mejora</li>
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
                disabled={!editedContent}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
              <Button
                className="flex items-center gap-2 bg-gradient-to-r from-blue-300 to-blue-400 hover:from-blue-400 hover:to-blue-500 text-white"
                onClick={handleExportWord}
                disabled={!editedContent}
              >
                <FileText className="w-4 h-4" />
                Exportar a Word
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareCriteria}
                disabled={!editedContent}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </motion.div>
          </motion.div>

          {criteria ? (
            <>
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

                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option>IA</option>
                  <option>Resumir</option>
                  <option>Expandir</option>
                  <option>Simplificar</option>
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

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                ref={previewRef}
                className="min-h-[500px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-6 text-gray-700 whitespace-pre-wrap font-sans"
                contentEditable
                onInput={handleContentChange}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500"
            >
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-2">No hay criterios de calificación generados</p>
              <p className="text-center text-sm">
                Ingresa el tema del ensayo y el nivel educativo en el panel derecho para generar los criterios de calificación.
              </p>
            </motion.div>
          )}
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
            <h2 className="text-xl font-semibold mb-6">Calificador de Ensayos</h2>
            
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
                    <Label htmlFor="topic">Ensayo a Calificar *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa el ensayo que deseas calificar y evaluar.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <textarea
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: La Revolución Industrial fue un período de transformación económica y social que comenzó en el siglo XVIII. Este ensayo analizará sus causas, consecuencias y su impacto en la sociedad moderna..."
                    required
                    maxLength={10000}
                    className="w-full min-h-[200px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/10000</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course">Nivel Educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar los criterios de calificación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Ensayo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Asigna un nombre descriptivo para identificar este ensayo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Análisis de la Revolución Industrial - Grado 10"
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
                          <p>Al marcar esta opción, tus criterios de calificación serán visibles para otros educadores en la comunidad.</p>
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
                className="flex gap-2"
              >
                <Button 
                  type="submit" 
                  disabled={loading || !formData.topic || !formData.course} 
                  className="flex-1" 
                  size="lg"
                >
                  {loading ? "Generando..." : "Generar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  size="lg"
                  onClick={() => {
                    setFormData({ topic: "", course: "", name: "", isPublic: false, grade: "", customGrade: "" })
                    setCriteria("")
                    setEditedContent("")
                  }}
                >
                  Limpiar
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 