"use client"

import { useState, useCallback } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { motion } from "framer-motion"
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Tema Principal' },
    position: { x: 500, y: 250 },
    style: {
      background: '#fff',
      border: '2px solid #2563eb',
      borderRadius: '15px',
      padding: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
      width: 180,
      textAlign: 'center' as const,
    },
  },
]

const initialEdges: Edge[] = []

const nodeColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#84cc16', // green
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#d946ef', // fuchsia
  '#f43f5e', // rose
]

function MapaMentalFlowContent() {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )
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
      const email = localStorage.getItem("email")
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


      let retries = 0
      const maxRetries = 3
      let response

      while (retries < maxRetries) {
        try {
          response = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/education/mapa-mental-flow", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: title,
              topic,
              email: email,
              isPublic: isPublic,
              theme: topic
            }),
          })

          if (response.ok) {
            break
          }

          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
            toast.info(`Reintentando... (${retries}/${maxRetries})`)
          }
        } catch (error) {
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
            toast.info(`Reintentando... (${retries}/${maxRetries})`)
          } else {
            throw error
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Error al generar el mapa mental después de ${maxRetries} intentos`)
      }

      const responseData = await response.json()
      
      if (!responseData.data || !responseData.data.children) {
        throw new Error("Formato de respuesta inválido")
      }

      // Función recursiva para generar nodos y aristas
      const generateNodesAndEdges = (rootNode: any) => {
        const allNodes: Node[] = []
        const allEdges: Edge[] = []
        let currentId = 1

        const processNode = (
          node: any, 
          level: number = 0, 
          parentId: string | null = null, 
          branchIndex: number = 0
        ) => {
          const nodeId = `node-${currentId++}`
          
          // Configuración de posicionamiento
          const CENTER_X = 500
          const CENTER_Y = 350
          const LEVEL_SPACING = 400
          const NODE_HEIGHT = 60
          const VERTICAL_GAP = 120
          
          // Calcular posición
          let x = CENTER_X
          let y = CENTER_Y
          
          if (level === 0) {
            // Nodo principal en el centro
            x = CENTER_X
            y = CENTER_Y
          } else if (level === 1) {
            // Primer nivel: distribuir verticalmente
            const totalHeight = (node.parent?.children?.length || 1) * (NODE_HEIGHT + VERTICAL_GAP)
            const startY = CENTER_Y - (totalHeight / 2)
            y = startY + (branchIndex * (NODE_HEIGHT + VERTICAL_GAP))
            x = CENTER_X + LEVEL_SPACING
          } else {
            // Niveles subsiguientes
            const parentNode = allNodes.find(n => n.id === parentId)
            if (parentNode) {
              const siblingCount = node.parent?.children?.length || 1
              const verticalOffset = ((branchIndex - (siblingCount - 1) / 2) * (NODE_HEIGHT + VERTICAL_GAP))
              y = parentNode.position.y + verticalOffset
              x = parentNode.position.x + LEVEL_SPACING * 0.9
            }
          }

          // Color basado en la rama principal (nivel 1)
          const colorIndex = level === 0 ? 0 : (Math.floor(branchIndex) % nodeColors.length)

          // Crear nodo
          const newNode: Node = {
            id: nodeId,
            type: level === 0 ? 'input' : 'default',
            data: { label: node.label },
            position: { x, y },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            style: {
              background: '#fff',
              border: `2px solid ${nodeColors[colorIndex]}`,
              borderRadius: '15px',
              padding: '10px',
              fontSize: level === 0 ? '16px' : '14px',
              fontWeight: level === 0 ? 'bold' : 'normal',
              width: level === 0 ? 180 : 150,
              textAlign: 'center' as const,
            },
          }
          allNodes.push(newNode)

          // Crear arista si hay padre
          if (parentId) {
            const newEdge: Edge = {
              id: `edge-${parentId}-${nodeId}`,
              source: parentId,
              target: nodeId,
              type: 'smoothstep',
              sourceHandle: 'right',
              targetHandle: 'left',
              style: { 
                stroke: nodeColors[colorIndex],
                strokeWidth: level === 1 ? 3 : 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: nodeColors[colorIndex],
              },
            }
            allEdges.push(newEdge)
          }

          // Procesar hijos
          if (node.children && node.children.length > 0) {
            node.children.forEach((child: any, index: number) => {
              child.parent = node
              processNode(child, level + 1, nodeId, index)
            })
          }
        }

        // Iniciar el procesamiento desde el nodo raíz
        processNode(rootNode)
        return { nodes: allNodes, edges: allEdges }
      }

      // Generar nodos y aristas a partir de la respuesta
      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(responseData.data)

      setNodes(newNodes)
      setEdges(newEdges)
      toast.success("Mapa mental generado exitosamente")

      // Mostrar modal automáticamente en pantallas pequeñas
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Error al generar el mapa mental")
    }

    setLoading(false)
  }

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
        className="flex flex-col lg:flex-row h-full"
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden lg:block flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                  Mapa Mental
                </h1>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6 border-4 border-blue-200"
            >
              <div className="h-[600px]">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                  minZoom={0.2}
                  maxZoom={1.5}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                  fitViewOptions={{ padding: 0.3 }}
                >
                  <Background color="#f1f5f9" gap={20} />
                  <Controls />
                </ReactFlow>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-96 border-t lg:border-l lg:border-t-0 p-4 sm:p-6 lg:p-8 bg-white"
        >
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Label htmlFor="title" className="text-lg font-bold text-blue-700">Título del Mapa Mental</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: La Fotosíntesis"
                className="mt-2 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring-blue-400"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Label htmlFor="topic" className="text-lg font-bold text-blue-700">Tema Principal</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Proceso de la fotosíntesis en las plantas"
                className="mt-2 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring-blue-400"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isPublic">Quiero compartir esto con la comunidad educativa</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Al marcar esta opción, tu mapa mental será visible para otros educadores en la comunidad.</p>
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
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl"
                disabled={loading || !title || !topic}
              >
                {loading ? "🎲 Generando..." : "✨ Crear Mapa Mental"}
              </Button>
            </motion.div>
          </motion.form>

          {nodes.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="space-y-4 mt-6"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300"
                onClick={() => setShowPreviewModal(true)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Mapa Mental
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Modal de previsualización */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-800">Mapa Mental: {title}</DialogTitle>
          </DialogHeader>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="h-[500px] bg-white rounded-lg border p-4">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                fitViewOptions={{ padding: 0.3 }}
              >
                <Background color="#f1f5f9" gap={20} />
                <Controls />
              </ReactFlow>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </Layout>
    </>
  )
}

export default function MapaMentalFlow() {
  return <MapaMentalFlowContent />
} 