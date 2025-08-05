"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, NetworkIcon, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, HelpCircle, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
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
import { PricingModal } from "@/components/pricing-modal"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"



interface ConceptMapFormData {
  topic: string;
  course: string;
  name: string;
  isPublic: boolean;
  customGrade: string;
}

interface Node {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

interface ConceptMap {
  nodes: Node[];
  edges: Edge[];
}

export default function ConceptMapGenerator() {
  const [loading, setLoading] = useState(false)
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null)
  const [editedContent, setEditedContent] = useState<string>("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<ConceptMapFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    customGrade: ""
  })
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el mapa conceptual
  useEffect(() => {
    if (conceptMap) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('mapaFromChat')
      if (!isFromChat) {
        localStorage.removeItem('mapaChatState')
        console.log('Mapa conceptual generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('mapaFromChat')
      }
    }
  }, [conceptMap])

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
    localStorage.removeItem('mapaChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Convertir el mapa conceptual a texto para el chat
    if (!conceptMap) return ""
    
    let content = `# Mapa Conceptual: ${formData.topic}\n\n`
    content += `## Nodos:\n`
    conceptMap.nodes.forEach(node => {
      content += `- **${node.label}**: ${node.description}\n`
    })
    content += `\n## Relaciones:\n`
    conceptMap.edges.forEach(edge => {
      content += `- ${edge.from} ${edge.label} ${edge.to}\n`
    })
    
    return content
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('mapaFromChat', 'true')
      
      // Parsear el nuevo contenido y actualizar el mapa conceptual
      // Por ahora, solo actualizamos el contenido editado
      setEditedContent(newContent)
      toast.success("Mapa conceptual actualizado exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar el mapa conceptual.")
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')
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

    try {
      const topic = `${formData.topic} Grado/Nivel educativo: ${formData.course === "otro" ? formData.customGrade : formData.course}
      El mapa conceptual debe:
      - Ser claro y conciso
      - Incluir conceptos clave
      - Mostrar relaciones lógicas
      - Ser visualmente organizado
      - Adaptado al nivel educativo`

      const topicRequest = {
        name: formData.name,
        topic: "tema: " + topic + " grado/nivel educativo: " + (formData.course === "otro" ? formData.customGrade : formData.course),
        email: email,
        isPublic: formData.isPublic,
        grade: formData.course === "otro" ? formData.customGrade : formData.course,
        theme: formData.topic
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/concept-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el mapa conceptual')
      }

      const data = await response.json()
      setConceptMap(data)
      setLoadingState('typing')
      toast.success("Mapa conceptual generado exitosamente")
      
      // Limpiar el estado del chat cuando se genera un nuevo mapa conceptual
      localStorage.removeItem('mapaChatState')

      // En móvil, mostrar el modal de previsualización
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el mapa conceptual")
      setLoadingState('idle')
    } finally {
      setLoading(false)
    }
    // Agregar puntos por generar mapa conceptual
    if (email) {
      await gamificationService.addPoints(email, 5, 'concept_map_generation')
      showPointsNotification(5, 'generar mapa conceptual')
    }
  }

  const handleInputChange = (field: keyof ConceptMapFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content)
  }

  const exportToPDF = async () => {
    if (!previewRef.current) return;

    try {
      const canvas = await html2canvas(previewRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Agregar el logo en el footer
      addLogoToFooter(pdf);

      // Metadatos
      pdf.setProperties({
        title: `Mapa Conceptual - ${formData.topic}`,
        subject: formData.course,
        author: 'Generador de Mapas Conceptuales',
      });

      pdf.save(`mapa-conceptual-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Mapa conceptual exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el mapa conceptual");
    }
  };

  const handleExportWord = async () => {
    if (!conceptMap) {
      toast.error('No hay mapa conceptual para exportar');
      return;
    }

    try {
      // Convertir el mapa conceptual a texto estructurado
      const content = `# Mapa Conceptual: ${formData.topic}\n\n` +
        conceptMap.nodes.map(node => 
          `## ${node.label}\n${node.description}\n`
        ).join('\n') +
        '\n## Relaciones\n' +
        conceptMap.edges.map(edge => 
          `${edge.from} ${edge.label} ${edge.to}`
        ).join('\n');

      await exportToWord(
        content,
        `Mapa Conceptual: ${formData.topic}`,
        `mapa-conceptual-${formData.topic.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareConceptMap = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Mapa Conceptual - ${formData.topic}`,
          text: `Mapa Conceptual generado para: ${formData.topic}\nNivel: ${formData.course}`,
        });
      } else {
        await navigator.clipboard.writeText(`Mapa Conceptual: ${formData.topic}\nNivel: ${formData.course}`);
        toast.success("Información copiada al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el mapa conceptual");
    }
  };

  const renderConceptMap = () => {
    if (!conceptMap) return null;
    // Layout tipo árbol, área grande
    const nodesById: Record<string, Node> = Object.fromEntries(conceptMap.nodes.map(n => [n.id, n]));
    const childrenMap: Record<string, string[]> = {};
    const parentCount: Record<string, number> = {};
    conceptMap.nodes.forEach(n => { parentCount[n.id] = 0; });
    conceptMap.edges.forEach(e => {
      if (!childrenMap[e.from]) childrenMap[e.from] = [];
      childrenMap[e.from].push(e.to);
      parentCount[e.to] = (parentCount[e.to] || 0) + 1;
    });
    const roots = Object.keys(parentCount).filter(id => parentCount[id] === 0);
    const levels: string[][] = [];
    const nodeLevels: Record<string, number> = {};
    type QueueItem = { id: string; level: number };
    let queue: QueueItem[] = roots.map((id) => ({ id, level: 0 }));
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const { id, level } = item;
      if (!levels[level]) levels[level] = [];
      levels[level].push(id);
      nodeLevels[id] = level;
      (childrenMap[id] || []).forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });
    }
    const areaWidth = 1200;
    const areaHeight = 800;
    const paddingX = 40;
    const paddingY = 40;
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelCount = levels.length;
    const nodePositions: Record<string, { x: number; y: number }> = {};
    levels.forEach((ids, levelIdx) => {
      const count = ids.length;
      const totalWidth = (count - 1) * (nodeWidth + 80);
      ids.forEach((id, i) => {
        const x = (areaWidth - totalWidth) / 2 + i * (nodeWidth + 80) + nodeWidth / 2;
        const y = paddingY + levelIdx * ((areaHeight - 2 * paddingY) / Math.max(1, levelCount - 1));
        nodePositions[id] = { x, y };
      });
    });
    return (
      <div className="flex justify-center items-center w-full overflow-auto" style={{minHeight: 500}}>
        <div className="relative" style={{ width: areaWidth, height: areaHeight, minWidth: areaWidth, minHeight: areaHeight }}>
          {/* Renderizar edges como líneas Bezier SVG */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex:1, width: areaWidth, height: areaHeight}}>
            {conceptMap.edges.map((edge, i) => {
              const from = nodePositions[edge.from];
              const to = nodePositions[edge.to];
              if (!from || !to) return null;
              const x1 = from.x;
              const y1 = from.y + nodeHeight / 2;
              const x2 = to.x;
              const y2 = to.y - nodeHeight / 2;
              // Curva Bezier
              const c1x = x1;
              const c1y = y1 + 40;
              const c2x = x2;
              const c2y = y2 - 40;
              return (
                <g key={i}>
                  <path d={`M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`} stroke="#b2b7f7" strokeWidth="2" fill="none" />
                  {edge.label && (
                    <text x={(x1 + x2) / 2} y={((y1 + y2) / 2) - 8} fill="#7d7d7d" fontSize="12" textAnchor="middle">{edge.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {/* Renderizar nodos como tarjetas flotantes */}
          {conceptMap.nodes.map((node, idx) => {
            const pos = nodePositions[node.id];
            const color = idx % 3 === 0 ? '#b2b7f7' : idx % 3 === 1 ? '#7ed6df' : '#f7b2e6';
            return (
              <div
                key={node.id}
                className={`absolute bg-white rounded-2xl border-t-8 shadow-lg p-4 w-[200px] flex flex-col items-center transition-all duration-200`}
                style={{
                  top: pos.y,
                  left: pos.x,
                  borderTopColor: color,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)',
                }}
              >
                <span className="font-bold text-base text-gray-800 mb-1 text-center">{node.label}</span>
                <span className="text-xs text-gray-600 text-center">{node.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
        {/* Panel izquierdo - Visualización del Mapa */}
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
            <h1 className="text-xl font-semibold">Generador de Mapas Conceptuales</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!conceptMap}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareConceptMap}
                disabled={!conceptMap}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {conceptMap && (
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

          {/* Área de visualización del mapa conceptual */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative" 
            ref={previewRef}
          >
            {conceptMap ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {renderConceptMap()}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <NetworkIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay mapa conceptual generado</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar un mapa conceptual.
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
              <h2 className="text-xl font-semibold">Generador de Mapas Conceptuales</h2>
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
                          <h3 className="font-medium">Consejos para Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Se específico con el tema que deseas mapear</li>
                            <li>Considera el nivel educativo de los estudiantes</li>
                            <li>Piensa en los conceptos principales y sus relaciones</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características del Mapa:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Conceptos claros y concisos</li>
                            <li>Relaciones lógicas entre conceptos</li>
                            <li>Estructura visual organizada</li>
                            <li>Adaptado al nivel educativo</li>
                            <li>Fácil de entender y seguir</li>
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
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre del Mapa Conceptual *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Un nombre descriptivo que identifique el mapa conceptual</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Mapa Conceptual de Ecosistemas"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema o área *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El tema específico para el que necesitas el mapa conceptual</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Ecosistemas Terrestres"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course">Nivel educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El grado o nivel educativo de los estudiantes</p>
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
                        placeholder="Especifica el nivel educativo"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
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
                        <p>Al marcar esta opción, tu mapa conceptual será visible para otros profesores en la comunidad</p>
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
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando mapa conceptual..."
                  disabled={loading || !formData.topic || !formData.course || !formData.name}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Mapa Conceptual
                </LoadingButton>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal de previsualización para móvil */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Previsualización del Mapa Conceptual</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Área de visualización del mapa conceptual */}
            <div className="relative" ref={previewRef}>
              {conceptMap ? (
                <div className="border border-dashed rounded-lg p-4">
                  {renderConceptMap()}
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500">
                  <NetworkIcon className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay mapa conceptual generado</p>
                  <p className="text-center text-sm">
                    Completa el formulario para generar un mapa conceptual.
                  </p>
                </div>
              )}
            </div>

            {/* Export buttons in modal */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!conceptMap}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>

              <Button
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!conceptMap}
              >
                <FileText className="w-4 h-4" />
                Exportar a Word
              </Button>

              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={shareConceptMap}
                disabled={!conceptMap}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {conceptMap && (
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  onClick={openChatModal}
                >
                  <MessageCircle className="w-4 h-4" />
                  Mejorar con IA
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('mapaChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Mapas Conceptuales"
        description="Solicita mejoras específicas para tu mapa conceptual. El asistente te ayudará a optimizar la estructura, relaciones y claridad del mapa."
        suggestions={[
          "Mejora las relaciones entre conceptos",
          "Añade más conceptos clave",
          "Simplifica la estructura del mapa",
          "Mejora las descripciones de los nodos",
          "Añade conceptos intermedios",
          "Reorganiza la jerarquía de conceptos"
        ]}
        localStorageKey="mapaChatState"
        isSlidesMode={false}
      />

      <Toaster />
    </Layout>
    </>
  )
} 