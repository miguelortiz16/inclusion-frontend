"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, HelpCircle, FileText } from "lucide-react"
import dynamic from 'next/dynamic'
import { jsPDF } from 'jspdf'
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
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
import { motion } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import html2canvas from 'html2canvas'
import { PricingModal } from "@/components/pricing-modal"
// Import Crossword component with no SSR
const Crossword = dynamic(() => import('@jaredreisinger/react-crossword'), {
  ssr: false
})

interface CrosswordData {
  across: {
    [key: string]: {
      clue: string;
      answer: string;
      row: number;
      col: number;
    }
  };
  down: {
    [key: string]: {
      clue: string;
      answer: string;
      row: number;
      col: number;
    }
  };
}

interface CrosswordContent {
  words: string[];
  clues: string[];
}

interface CrosswordFormData {
  name: string;
  topic: string;
  grade: string;
  isPublic: boolean;
  course: string;
  customGrade: string;
}

export default function Crucigrama() {
  const [loading, setLoading] = useState(false)
  const [crossword, setCrossword] = useState<CrosswordData | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [formData, setFormData] = useState<CrosswordFormData>({
    name: "",
    topic: "",
    grade: "",
    isPublic: false,
    course: "",
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

  const [editedContent, setEditedContent] = useState<CrosswordContent | null>(null)
  const { showPointsNotification } = usePoints()

  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error(`Intento ${attempt} fallido:`, {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          });
          
          if (attempt < maxRetries) {
            console.log(`Reintentando... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Espera exponencial
            continue;
          }
          
          throw new Error(`Error al generar el crucigrama: ${response.status} ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    throw lastError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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

      const response = await fetchWithRetry("https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crucigrama", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          topic: "tema: " + formData.topic+" Grado/Nivel educativo: "+(formData.grade === "otro" ? formData.customGrade : formData.grade),
          grade: formData.grade,
          email,
          isPublic: formData.isPublic,
          theme: formData.topic
        }),
      })

      const responseData = await response.json()
      console.log("Respuesta exitosa:", responseData)
      
      if (!responseData.data || !responseData.data.across || !responseData.data.down) {
        throw new Error("Formato de respuesta inválido")
      }

      setCrossword(responseData.data)
      toast.success("Crucigrama generado exitosamente")



      // Mostrar modal automáticamente en móvil
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el crucigrama")
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      setLoading(false)
      return
    }
          // Agregar puntos por generar un crucigrama
          await gamificationService.addPoints(email, 5, 'crossword_generation')
          showPointsNotification(5, 'generar un crucigrama')
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    if (!editedContent) {
      const lines = content.split('\n');
      const words: string[] = [];
      const clues: string[] = [];
      
      lines.forEach(line => {
        if (line.startsWith('Palabra:')) {
          words.push(line.replace('Palabra:', '').trim());
        } else if (line.startsWith('Pista:')) {
          clues.push(line.replace('Pista:', '').trim());
        }
      });
      
      setEditedContent({ words, clues });
      return;
    }
    
    const lines = content.split('\n');
    const words: string[] = [];
    const clues: string[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('Palabra:')) {
        words.push(line.replace('Palabra:', '').trim());
      } else if (line.startsWith('Pista:')) {
        clues.push(line.replace('Pista:', '').trim());
      }
    });
    
    setEditedContent({ words, clues });
  };

  const exportToPDF = async () => {
    if (!crossword) return;

    try {
      const pdf = initializePDF('Crucigrama', 'Generador de Crucigramas');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Crucigrama: ${formData.topic}`, `Nivel: ${formData.grade}`);
      
      let y = MARGINS.top + 30;

      // Capturar el crucigrama
      const crosswordElement = document.getElementById('crossword-grid');
      if (crosswordElement) {
        // Ocultar temporalmente los textos ACROSS y DOWN
        const acrossElements = crosswordElement.getElementsByClassName('crossword-across');
        const downElements = crosswordElement.getElementsByClassName('crossword-down');
        const cluesElements = crosswordElement.getElementsByClassName('crossword-clues');
        const cluesTitleElements = crosswordElement.getElementsByClassName('crossword-clues-title');
        // Ocultar cualquier elemento que contenga el texto ACROSS o DOWN
        const allElements = crosswordElement.querySelectorAll('*');
        const hiddenTextElements: HTMLElement[] = [];
        allElements.forEach(el => {
          if (el instanceof HTMLElement && (el.innerText.trim() === 'ACROSS' || el.innerText.trim() === 'DOWN')) {
            hiddenTextElements.push(el);
            el.style.display = 'none';
          }
        });
        
        const acrossDisplay = Array.from(acrossElements).map(el => (el as HTMLElement).style.display);
        const downDisplay = Array.from(downElements).map(el => (el as HTMLElement).style.display);
        const cluesDisplay = Array.from(cluesElements).map(el => (el as HTMLElement).style.display);
        const cluesTitleDisplay = Array.from(cluesTitleElements).map(el => (el as HTMLElement).style.display);
        
        Array.from(acrossElements).forEach(el => (el as HTMLElement).style.display = 'none');
        Array.from(downElements).forEach(el => (el as HTMLElement).style.display = 'none');
        Array.from(cluesElements).forEach(el => (el as HTMLElement).style.display = 'none');
        Array.from(cluesTitleElements).forEach(el => (el as HTMLElement).style.display = 'none');

        // Asegurar que el contenedor tenga el tamaño correcto
        const originalWidth = crosswordElement.style.width;
        const originalHeight = crosswordElement.style.height;
        crosswordElement.style.width = '100%';
        crosswordElement.style.height = 'auto';

        const canvas = await html2canvas(crosswordElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: crosswordElement.scrollWidth,
          height: crosswordElement.scrollHeight
        });
        
        // Restaurar el tamaño original
        crosswordElement.style.width = originalWidth;
        crosswordElement.style.height = originalHeight;
        
        // Restaurar la visibilidad de los textos
        Array.from(acrossElements).forEach((el, i) => (el as HTMLElement).style.display = acrossDisplay[i]);
        Array.from(downElements).forEach((el, i) => (el as HTMLElement).style.display = downDisplay[i]);
        Array.from(cluesElements).forEach((el, i) => (el as HTMLElement).style.display = cluesDisplay[i]);
        Array.from(cluesTitleElements).forEach((el, i) => (el as HTMLElement).style.display = cluesTitleDisplay[i]);
        hiddenTextElements.forEach(el => el.style.display = '');
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 132; // Ancho máximo aumentado un 10%
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', MARGINS.left, y, imgWidth, imgHeight);
      }

      // Agregar una nueva página para las respuestas
      pdf.addPage();
      
      // Agregar encabezado en la nueva página
      addStandardHeader(pdf, `Respuestas del Crucigrama: ${formData.topic}`, `Nivel: ${formData.grade}`);
      
      y = MARGINS.top + 30;

      // Agregar respuestas horizontales
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Respuestas Horizontales:', MARGINS.left, y);
      y += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      Object.entries(crossword.across).forEach(([number, clue]) => {
        const text = `${number}. ${clue.clue} - ${clue.answer}`;
        const splitText = pdf.splitTextToSize(text, pdf.internal.pageSize.width - (MARGINS.left + MARGINS.right));
        splitText.forEach((line: string) => {
          if (y > pdf.internal.pageSize.height - MARGINS.bottom) {
            pdf.addPage();
            y = MARGINS.top;
          }
          pdf.text(line, MARGINS.left, y);
          y += 7;
        });
        y += 5;
      });

      // Agregar espacio entre secciones
      y += 10;

      // Agregar respuestas verticales
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Respuestas Verticales:', MARGINS.left, y);
      y += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      Object.entries(crossword.down).forEach(([number, clue]) => {
        const text = `${number}. ${clue.clue} - ${clue.answer}`;
        const splitText = pdf.splitTextToSize(text, pdf.internal.pageSize.width - (MARGINS.left + MARGINS.right));
        splitText.forEach((line: string) => {
          if (y > pdf.internal.pageSize.height - MARGINS.bottom) {
            pdf.addPage();
            y = MARGINS.top;
          }
          pdf.text(line, MARGINS.left, y);
          y += 7;
        });
        y += 5;
      });
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Crucigrama_${formData.topic.replace(/\s+/g, '_')}.pdf`);
      toast.success("Crucigrama exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el crucigrama");
    }
  };

  const shareCrossword = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Crucigrama - ${formData.topic}`,
          text: `Pistas horizontales: ${Object.entries(crossword?.across || {}).map(([n, c]) => `${n}. ${c.clue}`).join('\n')}\n\nPistas verticales: ${Object.entries(crossword?.down || {}).map(([n, c]) => `${n}. ${c.clue}`).join('\n')}`,
        });
      } else {
        await navigator.clipboard.writeText(`Pistas horizontales: ${Object.entries(crossword?.across || {}).map(([n, c]) => `${n}. ${c.clue}`).join('\n')}\n\nPistas verticales: ${Object.entries(crossword?.down || {}).map(([n, c]) => `${n}. ${c.clue}`).join('\n')}`);
        toast.success("Crucigrama copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el crucigrama");
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
        {/* Panel izquierdo - Crucigrama */}
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
              <h1 className="text-xl font-semibold">Generador de Crucigrama</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Generar Crucigramas</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Crucigramas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Selecciona temas específicos y relevantes</li>
                            <li>Incluye palabras de diferentes longitudes</li>
                            <li>Usa pistas claras y concisas</li>
                            <li>Adapta la dificultad según el nivel educativo</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Ejemplos de Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Animales del Zoológico</li>
                            <li>Partes del Cuerpo Humano</li>
                            <li>Países de América</li>
                            <li>Elementos de la Tabla Periódica</li>
                            <li>Obras Literarias</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Tips para las Pistas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Usa definiciones claras</li>
                            <li>Incluye sinónimos y antónimos</li>
                            <li>Agrega ejemplos prácticos</li>
                            <li>Considera el contexto educativo</li>
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
                className="flex items-center gap-2"
                onClick={exportToPDF}
             
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
            
            </motion.div>
          </motion.div>

          {crossword && crossword.across && crossword.down ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="space-y-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-white rounded-lg border p-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                  id="crossword-grid"
                >
                  <Crossword
                    data={crossword}
                    theme={{
                      gridBackground: '#ffffff',
                      cellBackground: '#ffffff',
                      cellBorder: '#000000',
                      textColor: '#000000',
                      numberColor: '#666666',
                      highlightBackground: '#e6f3ff',
                      highlightColor: '#000000',
                    }}
                    acrossLabel="HORIZONTALES"
                    downLabel="VERTICALES"
                  />
                </motion.div>
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Respuestas Horizontales:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(crossword?.across || {}).map(([number, clue]) => (
                        <li key={number}>
                          {number}. {clue.clue} - <span className="font-bold">{clue.answer}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Respuestas Verticales:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(crossword?.down || {}).map(([number, clue]) => (
                        <li key={number}>
                          {number}. {clue.clue} - <span className="font-bold">{clue.answer}</span>
                        </li>
                      ))}
                    </ul>
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
              <p className="text-center mb-2">No hay crucigrama generado</p>
              <p className="text-center text-sm">
                Configura el tema en el panel derecho y genera un crucigrama automáticamente.
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
              Generador de Crucigrama
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
                    placeholder="Ej: Crucigrama de Animales del Zoológico"
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
                          <p>Describe el tema principal del crucigrama. Incluye conceptos clave y contexto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder={`Ej: "Animales del Zoológico: Incluye mamíferos, aves, reptiles y sus características principales."`}
                    required
                    maxLength={360}
                    className="min-h-[100px] resize-none font-['Arial']"
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.topic.length}/360</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grade">Nivel Educativo</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel educativo para adaptar la dificultad del crucigrama.</p>
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2"
                    >
                      <Label htmlFor="customGrade">Especifica el nivel educativo *</Label>
                      <Input
                        id="customGrade"
                        value={formData.customGrade}
                        onChange={(e) => handleInputChange("customGrade", e.target.value)}
                        placeholder="Ingresa el nivel educativo"
                        required
                        className="mt-1"
                      />
                    </motion.div>
                  )}
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
                          <p>Al marcar esta opción, tu crucigrama será visible para otros educadores en la comunidad.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="flex gap-2"
              >
                <Button type="submit" disabled={loading} className="flex-1" size="lg">
                  {loading ? "Generando..." : "Generar"}
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
                      grade: "",
                      isPublic: false,
                      course: "",
                      customGrade: ""
                    })
                    setCrossword(null)
                    setEditedContent(null)
                  }}
                >
                  Limpiar
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>

          {crossword && (
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
              <DialogTitle>Previsualización del Crucigrama</DialogTitle>
            </DialogHeader>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
              {crossword && crossword.across && crossword.down ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="space-y-6"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-white rounded-lg border p-4 sm:p-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full"
                      id="crossword-grid"
                    >
                      <Crossword
                        data={crossword}
                        theme={{
                          gridBackground: '#ffffff',
                          cellBackground: '#ffffff',
                          cellBorder: '#000000',
                          textColor: '#000000',
                          numberColor: '#666666',
                          highlightBackground: '#e6f3ff',
                          highlightColor: '#000000',
                        }}
                        acrossLabel="HORIZONTALES"
                        downLabel="VERTICALES"
                      />
                    </motion.div>
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
                  <p className="text-center mb-2">No hay crucigrama generado</p>
                  <p className="text-center text-sm">
                    Configura el tema en el panel derecho y genera un crucigrama automáticamente.
                  </p>
                </motion.div>
              )}

              {/* Export buttons in modal */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={exportToPDF}
                  disabled={!crossword}
                >
                  <FileDown className="w-4 h-4" />
                  Exportar a PDF
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={shareCrossword}
                  disabled={!crossword}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </div>

              <div className="mt-6 space-y-4 bg-white p-4 rounded-lg border">
                <div>
                  <h3 className="font-semibold mb-2">Respuestas Horizontales:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(crossword?.across || {}).map(([number, clue]) => (
                      <li key={number}>
                        {number}. {clue.clue} - <span className="font-bold">{clue.answer}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Respuestas Verticales:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(crossword?.down || {}).map(([number, clue]) => (
                      <li key={number}>
                        {number}. {clue.clue} - <span className="font-bold">{clue.answer}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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