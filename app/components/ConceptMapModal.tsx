"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { NetworkIcon, Loader2, Wand2, Download } from "lucide-react"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { PricingModal } from "@/components/pricing-modal"



interface ConceptMapModalProps {
  isOpen: boolean
  onClose: () => void
  lessonTitle: string
  grade: string
}

interface ConceptMap {
  nodes: {
    id: string
    label: string
    description: string
    x: number
    y: number
  }[]
  edges: {
    from: string
    to: string
    label: string
  }[]
}

export function ConceptMapModal({ isOpen, onClose, lessonTitle, grade }: ConceptMapModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null)
  const [topic, setTopic] = useState(`${lessonTitle} Grado/Nivel educativo: ${grade || 'No especificado'}
El mapa conceptual debe:
- Ser claro y conciso
- Incluir conceptos clave
- Mostrar relaciones lógicas
- Ser visualmente organizado
- Adaptado al nivel educativo`)
  const { showPointsNotification } = usePoints()
  const conceptMapRef = useRef<HTMLDivElement>(null)
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
  const handleGenerate = async () => {
    try {
      setIsLoading(true)
      const email = localStorage.getItem('email')
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setIsLoading(false)
 
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  onClose()
  return // Detener el flujo
}
      const topicRequest = {
        name: lessonTitle,
        topic: "tema: " + topic + " grado/nivel educativo: " + (grade || 'No especificado'),
        email: email,
        isPublic: false,
        grade: grade || 'No especificado',
        theme: lessonTitle
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
      toast.success("Mapa conceptual generado exitosamente")

      // Agregar puntos por generar mapa conceptual
      if (email) {
        await gamificationService.addPoints(email, 5, 'concept_map_generation')
        showPointsNotification(5, 'generar mapa conceptual')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el mapa conceptual")
    } finally {
      setIsLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!conceptMapRef.current) return;

    try {
      const canvas = await html2canvas(conceptMapRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1600,
        windowHeight: 1000,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-concept-map]') as HTMLElement;
          if (element) {
            element.style.transform = 'scale(1)';
            element.style.transformOrigin = 'top left';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const originalWidth = imgProps.width;
      const originalHeight = imgProps.height;
      
      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // Add title to the PDF
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      const titleMarginTop = 15;
      const titleHeight = 10; // Estimate height of the title line
      pdf.text(lessonTitle, 15, titleMarginTop);

      // Available space for the map (considering margins, title, and footer)
      const horizontalMargin = 25; // Increased from 20
      const footerHeight = 10; // Estimate height of the footer
      const verticalSpaceUsed = titleMarginTop + titleHeight + footerHeight + 25; // Increased spacing below title and above footer
      
      const availableWidth = pdfPageWidth - 2 * horizontalMargin;
      const availableHeight = pdfPageHeight - verticalSpaceUsed;

      // Calculate scale factors to fit within available space
      const scaleFactorWidth = availableWidth / originalWidth;
      const scaleFactorHeight = availableHeight / originalHeight;

      // Use the smaller scale factor to ensure the entire map fits
      const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

      const scaledWidth = originalWidth * scaleFactor;
      const scaledHeight = originalHeight * scaleFactor;
      
      // Center the image horizontally and place it below the title
      const xPosition = horizontalMargin + (availableWidth - scaledWidth) / 2; // Center within available width
      const yPosition = titleMarginTop + titleHeight + 20; // Adjusted vertical position with more spacing

      // Add the concept map image with scaled dimensions
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, scaledWidth, scaledHeight);

      // Add footer
      const date = new Date().toLocaleDateString();
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const footerMarginBottom = 10;
      pdf.text(`Generado el ${date}`, horizontalMargin, pdfPageHeight - footerMarginBottom);

      pdf.save(`mapa-conceptual-${lessonTitle}.pdf`);
      toast.success("Mapa conceptual exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      toast.error("Error al exportar el mapa conceptual");
    }
  };

  const renderConceptMap = () => {
    if (!conceptMap) return null;
    
    const nodesById: Record<string, any> = Object.fromEntries(conceptMap.nodes.map(n => [n.id, n]));
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
    const areaHeight = 750;
    const paddingX = 40;
    const paddingY = 40;
    const nodeWidth = 200;
    const nodeHeight = 70;
    const levelCount = levels.length;
    const nodePositions: Record<string, { x: number; y: number }> = {};
    
    levels.forEach((ids, levelIdx) => {
      const count = ids.length;
      const totalWidth = (count - 1) * (nodeWidth + 60);
      ids.forEach((id, i) => {
        const x = (areaWidth - totalWidth) / 2 + i * (nodeWidth + 60) + nodeWidth / 2;
        const y = paddingY + levelIdx * ((areaHeight - 2 * paddingY) / Math.max(1, levelCount - 1));
        nodePositions[id] = { x, y };
      });
    });

    return (
      <div className="flex justify-center items-center w-full overflow-auto" style={{minHeight: 450}}>
        <div ref={conceptMapRef} data-concept-map className="relative" style={{ width: areaWidth, height: areaHeight, minWidth: areaWidth, minHeight: areaHeight }}>
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex:1, width: areaWidth, height: areaHeight}}>
            {conceptMap.edges.map((edge, i) => {
              const from = nodePositions[edge.from];
              const to = nodePositions[edge.to];
              if (!from || !to) return null;
              const x1 = from.x;
              const y1 = from.y + nodeHeight / 2;
              const x2 = to.x;
              const y2 = to.y - nodeHeight / 2;
              const c1x = x1;
              const c1y = y1 + 30;
              const c2x = x2;
              const c2y = y2 - 30;
              return (
                <g key={i}>
                  <path d={`M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`} stroke="#b2b7f7" strokeWidth="2" fill="none" />
                  {edge.label && (
                    <text x={(x1 + x2) / 2} y={((y1 + y2) / 2) - 8} fill="#7d7d7d" fontSize="12" textAnchor="middle" fontWeight="500">{edge.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {conceptMap.nodes.map((node, idx) => {
            const pos = nodePositions[node.id];
            const color = idx % 3 === 0 ? '#b2b7f7' : idx % 3 === 1 ? '#7ed6df' : '#f7b2e6';
            return (
              <div
                key={node.id}
                className={`absolute bg-white rounded-xl border-t-8 shadow-lg p-4 w-[200px] flex flex-col items-center transition-all duration-200`}
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
   
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mapa Conceptual</DialogTitle>
          <DialogDescription>
            Genera un mapa conceptual visual para la lección actual
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {conceptMap ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <NetworkIcon className="w-5 h-5 text-indigo-600" />
                    Mapa Conceptual
                  </h3>
                  <Button
                    onClick={exportToPDF}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
                {renderConceptMap()}
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                  <NetworkIcon className="w-5 h-5 text-indigo-600" />
                  Generar Mapa Conceptual
                </h3>
                <p className="text-gray-600 mb-4">
                  Genera un mapa conceptual visual para la lección "{lessonTitle}" que ayude a los estudiantes a comprender mejor los conceptos clave.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic" className="text-gray-700 font-medium">Tema y Requisitos</Label>
                    <textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full min-h-[200px] p-3 border rounded-lg mt-1 font-['Arial'] text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="Describe el tema y los requisitos para el mapa conceptual..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200/80 bg-gray-50/50 backdrop-blur-sm p-4">
          <Button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                {conceptMap ? 'Regenerar Mapa Conceptual' : 'Generar Mapa Conceptual'}
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
} 