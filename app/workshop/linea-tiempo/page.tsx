"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, HelpCircle, NetworkIcon, Image } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { motion } from "framer-motion"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PricingModal } from "@/components/pricing-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"


interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category?: string;
}

interface TimelineData {
  events: TimelineEvent[];
}

interface TimelineFormData {
  name: string;
  topic: string;
  grade: string;
  subject: string;
  style: string;
  isPublic: boolean;
}

const TIMELINE_STYLES = [
  { value: "style6", label: "Estilo 1 (Banda de Color)" },
  { value: "style1", label: "Estilo 2 (Clásico)" },
  { value: "style2", label: "Estilo 3 (Moderno)" },
  { value: "style3", label: "Estilo 4 (Minimalista)" },
  { value: "style4", label: "Estilo 5 (Tarjetas Coloridas)" },
  { value: "style5", label: "Estilo 5 (Circular Alternado)" }

]

export default function TimelineGenerator() {
  const [loading, setLoading] = useState(false)
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [formData, setFormData] = useState<TimelineFormData>({
    name: "",
    topic: "",
    grade: "",
    subject: "",
    style: "style1",
    isPublic: false
  })
  const previewRef = useRef<HTMLDivElement>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const [showMobileResult, setShowMobileResult] = useState(false)
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia la línea de tiempo
  useEffect(() => {
    if (timeline) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('lineaFromChat')
      if (!isFromChat) {
        localStorage.removeItem('lineaChatState')
        console.log('Línea de tiempo generada desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('lineaFromChat')
      }
    }
  }, [timeline])

  // Detectar si es móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  // Mostrar modal automáticamente en móvil cuando se genera la línea de tiempo
  useEffect(() => {
    if (timeline && isMobile) {
      setShowMobileResult(true)
    }
  }, [timeline])

  const handleInputChange = (field: keyof TimelineFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
    localStorage.removeItem('lineaChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Enviar información específica del JSON para el chat
    if (!timeline) return ""
    
    // Tomar el primer evento como referencia para el chat
    const firstEvent = timeline.events[0]
    if (!firstEvent) return ""
    
    // Enviar solo el título del primer evento como referencia
    return firstEvent.title
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('lineaFromChat', 'true')
      
      // Por ahora, solo mostramos un mensaje de éxito
      // En el futuro, se podría parsear el contenido y actualizar la línea de tiempo
      toast.success("Línea de tiempo actualizada exitosamente")
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar la línea de tiempo.")
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("No se encontró el email del usuario")
      setLoading(false)
      return
    }
 // Validar acceso
 const accessData = await validateAccess(email)

     
if (!accessData.allowed) {
// Mostrar el modal con el mensaje de acceso
setShowPricingModal(true)
setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
return // Detener el flujo
}


    try {
      const request = {
        name: formData.name,
        topic: formData.topic,
        grade: formData.grade,
        subject: formData.subject,
        email,
        isPublic: formData.isPublic
      }
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      if (!response.ok) throw new Error('Error al generar la línea de tiempo')
      const data = await response.json()
      setTimeline(data)
      toast.success("Línea de tiempo generada exitosamente")
      
      // Limpiar el estado del chat cuando se genera una nueva línea de tiempo
      localStorage.removeItem('lineaChatState')
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar la línea de tiempo")
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!previewRef.current || !timeline) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      // Calcular tamaño escalado para que quepa en la página
      const margin = 20;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2 - 20; // 20 para el título
      const scale = Math.min(availableWidth / imgProps.width, availableHeight / imgProps.height);
      const imgWidth = imgProps.width * scale;
      const imgHeight = imgProps.height * scale;
      // Título
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text(formData.name || 'Línea de Tiempo Educativa', margin, margin);
      // Imagen
      pdf.addImage(imgData, 'PNG', margin, margin + 10, imgWidth, imgHeight);
      // Pie de página
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const date = new Date().toLocaleDateString();
      pdf.text(`Generado el ${date}`, margin, pdfHeight - 8);
      pdf.save(`linea-tiempo-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('Línea de tiempo exportada exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar la línea de tiempo');
    }
  }

  const exportToImage = async () => {
    if (!previewRef.current || !timeline) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        logging: false
      });
      
      // Crear un enlace temporal para descargar la imagen
      const link = document.createElement('a');
      link.download = `linea-tiempo-${formData.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Línea de tiempo exportada como imagen exitosamente');
    } catch (error) {
      console.error('Error al exportar imagen:', error);
      toast.error('Error al exportar la imagen');
    }
  }

  // Renderizado de la línea de tiempo según el estilo
  const renderTimeline = () => {
    if (!timeline) return null
    switch (formData.style) {
      case "style1":
        return <TimelineStyle1 events={timeline.events} />
      case "style2":
        return <TimelineStyle2 events={timeline.events} />
      case "style3":
        return <TimelineStyle3 events={timeline.events} />
      case "style4":
        return <TimelineStyle4 events={timeline.events} />
      case "style5":
        return <TimelineStyle5 events={timeline.events} />
      case "style6":
        return <TimelineStyle6 events={timeline.events} />
      default:
        return <TimelineStyle1 events={timeline.events} />
    }
  }

  return (
    <>
    <PricingModal 
    open={showPricingModal} 
    onOpenChange={setShowPricingModal}
    accessMessage={accessMessage}
  />

  {/* Modal para móvil */}
  <Dialog open={showMobileResult} onOpenChange={setShowMobileResult}>
    <DialogContent className="max-w-full w-full p-0">
      <DialogHeader>
        <DialogTitle>{formData.name || 'Línea de Tiempo Generada'}</DialogTitle>
      </DialogHeader>
      <div className="p-2 overflow-x-auto">
        {timeline && renderTimeline()}
      </div>
      <div className="p-4 space-y-2">
        {timeline && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            onClick={openChatModal}
          >
            <MessageCircle className="w-4 h-4" />
            Mejorar con IA
          </Button>
        )}
        <DialogClose asChild>
          <Button variant="outline" className="w-full">Cerrar</Button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>

    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row h-screen"
      >
        {/* Panel izquierdo - Visualización */}
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
            <h1 className="text-xl font-semibold">Generador de Línea de Tiempo Educativa</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white" onClick={exportToPDF} disabled={!timeline}>
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 text-white" onClick={exportToImage} disabled={!timeline}>
                <Image className="w-4 h-4" />
                Exportar a Imagen
              </Button>
              {timeline && (
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
          {/* Selector de estilo reactivo, solo si hay línea de tiempo */}
          {timeline && (
            <div className="mb-4 flex items-center gap-4">
              <Label htmlFor="style" className="font-medium">Estilo de Línea de Tiempo:</Label>
              <Select
                value={formData.style}
                onValueChange={value => handleInputChange("style", value)}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecciona un estilo" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_STYLES.map(style => (
                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative"
            ref={previewRef}
          >
            {timeline ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {renderTimeline()}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <NetworkIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay línea de tiempo generada</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar una línea de tiempo educativa.
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
                  <Label htmlFor="name">Nombre de la Línea de Tiempo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Línea de Tiempo de la Segunda Guerra Mundial"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>
                <div>
                  <Label htmlFor="topic">Tema *</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={e => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Segunda Guerra Mundial"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grado/Nivel educativo *</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={e => handleInputChange("grade", e.target.value)}
                    placeholder="Ej: Grado 6, Universidad, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Asignatura *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={e => handleInputChange("subject", e.target.value)}
                    placeholder="Ej: Historia, Ciencias, etc."
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={e => handleInputChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                    Compartir con la comunidad de profesores
                  </Label>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !formData.topic || !formData.grade || !formData.subject || !formData.name}
                >
                  {loading ? "Generando..." : "Generar Línea de Tiempo"}
                </Button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('lineaChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Líneas de Tiempo"
        description="Solicita mejoras específicas para tu línea de tiempo. El asistente te ayudará a optimizar la estructura, eventos y claridad de la línea de tiempo."
        suggestions={[
          "Añade más eventos importantes",
          "Mejora las descripciones de los eventos",
          "Reorganiza el orden cronológico",
          "Añade eventos intermedios",
          "Mejora la claridad de las fechas",
          "Incluye más contexto histórico"
        ]}
        localStorageKey="lineaChatState"
        isSlidesMode={true}
      />

      <Toaster />
    </Layout>
    </>
  )
}

// COMPONENTES DE ESTILO DE LÍNEA DE TIEMPO
function TimelineStyle1({ events }: { events: TimelineEvent[] }) {
  // Clásico: todos los eventos sobre la línea
  const minTimelineWidth = Math.max(events.length * 160, 600);
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto py-4" style={{ minHeight: 180 }}>
      <div className="relative flex justify-center items-center mx-auto" style={{ minHeight: 120, minWidth: minTimelineWidth }}>
        {/* Línea horizontal continua */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-blue-100 z-0" style={{ transform: 'translateY(-50%)', width: '100%' }} />
        <div className="flex flex-row items-center w-full justify-between z-10" style={{ position: 'relative', minWidth: minTimelineWidth }}>
          {events.map((event) => (
            <div key={event.id} className="relative flex flex-col items-center" style={{ minWidth: 140 }}>
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold mb-1 text-base z-10">
                <span>📍</span>
              </div>
              <div className="bg-white rounded-lg shadow p-2 text-center min-w-[110px] border border-blue-100 hover:shadow-lg transition-all duration-200 mt-1">
                <div className="font-bold text-blue-700 text-sm mb-1">{event.title}</div>
                <div className="text-xs text-blue-400 mb-1 font-semibold">{event.date}</div>
                <div className="text-xs text-gray-700 leading-snug mb-1" style={{minHeight: 28}}>{event.description}</div>
                {event.category && <div className="mt-1 text-xs text-blue-400 italic">{event.category}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  
}

function TimelineStyle2({ events }: { events: TimelineEvent[] }) {
  // Moderno: alterna arriba y abajo de la línea usando flex y margin
  const minTimelineWidth = Math.max(events.length * 160, 600);
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto py-4" style={{ minHeight: 220 }}>
      <div className="relative flex justify-center items-center mx-auto" style={{ minHeight: 160, minWidth: minTimelineWidth }}>
        {/* Línea horizontal continua */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-purple-100 z-0" style={{ transform: 'translateY(-50%)', width: '100%' }} />
        <div className="flex flex-row items-end w-full justify-between z-10" style={{ minWidth: minTimelineWidth, position: 'relative' }}>
          {events.map((event, idx) => {
            const isAbove = idx % 2 === 0;
            return (
              <div
                key={event.id}
                className="flex flex-col items-center"
                style={{
                  minWidth: 140,
                  marginBottom: isAbove ? 60 : 0,
                  marginTop: !isAbove ? 60 : 0,
                }}
              >
                {isAbove && (
                  <>
                    <div className="bg-white rounded-lg shadow p-2 text-center min-w-[110px] border border-purple-100 mb-1">
                      <div className="font-bold text-purple-700 text-sm mb-1">{event.title}</div>
                      <div className="text-xs text-purple-400 mb-1 font-semibold">{event.date}</div>
                      <div className="text-xs text-gray-700 leading-snug mb-1">{event.description}</div>
                      {event.category && <div className="mt-1 text-xs text-purple-400 italic">{event.category}</div>}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-base mx-auto z-10">
                      <span>⭐</span>
                    </div>
                  </>
                )}
                {!isAbove && (
                  <>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-base mx-auto z-10 mb-1">
                      <span>⭐</span>
                    </div>
                    <div className="bg-white rounded-lg shadow p-2 text-center min-w-[110px] border border-purple-100 mt-1">
                      <div className="font-bold text-purple-700 text-sm mb-1">{event.title}</div>
                      <div className="text-xs text-purple-400 mb-1 font-semibold">{event.date}</div>
                      <div className="text-xs text-gray-700 leading-snug mb-1">{event.description}</div>
                      {event.category && <div className="mt-1 text-xs text-purple-400 italic">{event.category}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

function TimelineStyle3({ events }: { events: TimelineEvent[] }) {
  // Minimalista: todos los eventos sobre la línea
  const minTimelineWidth = Math.max(events.length * 100, 400);
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto py-4" style={{ minHeight: 100 }}>
      <div className="relative flex justify-center items-center mx-auto" style={{ minHeight: 60, minWidth: minTimelineWidth }}>
        {/* Línea horizontal continua */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 z-0" style={{ transform: 'translateY(-50%)', width: '100%' }} />
        <div className="flex flex-row items-center w-full justify-between z-10" style={{ position: 'relative', minWidth: minTimelineWidth }}>
          {events.map((event) => (
            <div key={event.id} className="relative flex flex-col items-center" style={{ minWidth: 90 }}>
              <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow mb-1 flex items-center justify-center text-white text-xs z-10">●</div>
              <div className="text-[10px] text-gray-700 font-semibold mb-1">{event.date}</div>
              <div className="text-xs text-gray-800 font-bold mb-1 text-center">{event.title}</div>
              <div className="text-[10px] text-gray-600 text-center mb-1" style={{minHeight: 18}}>{event.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// NUEVO ESTILO: Tarjetas Coloridas
function TimelineStyle4({ events }: { events: TimelineEvent[] }) {
  const CARD_COLORS = [
    '#a5b4fc', // azul
    '#99f6e4', // aqua
    '#d9f99d', // verde
    '#fde68a', // amarillo
    '#fbcfe8', // rosa
  ];
  const minTimelineWidth = Math.max(events.length * 240, 600);
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto py-6" style={{ minHeight: 320 }}>
      <div className="flex flex-row items-end gap-8 px-8" style={{ minWidth: minTimelineWidth }}>
        {events.map((event, idx) => {
          const color = CARD_COLORS[idx % CARD_COLORS.length];
          return (
            <div key={event.id} className="flex flex-col items-center relative" style={{ minWidth: 200 }}>
              {/* Tarjeta principal */}
              <div className="flex flex-row items-center w-full">
                <div className="flex-shrink-0 -ml-6 z-10">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white" style={{ background: color }}>
                    {idx + 1}
                  </div>
                </div>
                <div className="ml-2 flex-1 bg-white rounded-xl shadow-lg p-5 border-2" style={{ borderColor: color, minWidth: 180 }}>
                  <div className="text-lg font-bold mb-1" style={{ color }}>{event.date}</div>
                  <div className="text-base font-semibold mb-1 text-gray-800">{event.title}</div>
                  <div className="text-sm text-gray-700 mb-2">{event.description}</div>
                  {/* Aquí podrías poner un ícono si lo deseas */}
                </div>
              </div>
              {/* Flecha entre tarjetas */}
              {idx < events.length - 1 && (
                <div className="absolute right-0 left-0 flex justify-center" style={{ top: '50%', transform: 'translateY(60px)' }}>
                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2C10 22 30 2 38 22" stroke="#a3a3a3" strokeWidth="2" strokeDasharray="5 5" fill="none" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// NUEVO ESTILO: Circular Alternado
function TimelineStyle5({ events }: { events: TimelineEvent[] }) {
  const CIRCLE_COLORS = [
    '#fde047', // amarillo
    '#60a5fa', // azul
    '#f87171', // rojo
    '#4ade80', // verde
    '#a3a3a3', // gris
    '#fb923c', // naranja
    '#a78bfa', // lila
    '#f472b6', // rosa
  ];
  const ICONS = ['👥', '💻', '🤝', '💬', '🎯', '✉️', '🔒', '🥇'];
  const circleSize = 355; // 273 * 1.3
  const minTimelineWidth = Math.max(events.length * 420, 1400);
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto py-10" style={{ minHeight: 1.2 * circleSize }}>
      <div className="flex flex-row items-center gap-12 px-12" style={{ minWidth: minTimelineWidth }}>
        {events.map((event, idx) => {
          const color = CIRCLE_COLORS[idx % CIRCLE_COLORS.length];
          const icon = ICONS[idx % ICONS.length];
          const isAbove = idx % 2 === 0;
          return (
            <div key={event.id} className="flex flex-col items-center relative" style={{ minWidth: circleSize + 40 }}>
              <div style={{ height: isAbove ? 0.38 * circleSize : 0 }} />
              <div
                className="flex flex-col items-center justify-center shadow-lg"
                style={{
                  background: color,
                  borderRadius: '50%',
                  width: circleSize,
                  height: circleSize,
                  boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)',
                  border: '6px solid white',
                  marginBottom: isAbove ? 0 : 0.24 * circleSize,
                  marginTop: isAbove ? 0.24 * circleSize : 0,
                }}
              >
                <div className="text-7xl mb-6">{icon}</div>
                <div className="text-4xl font-bold mb-3 text-center">{event.date}</div>
                <div className="text-2xl font-semibold mb-3 text-center">{event.title}</div>
                <div className="text-lg text-gray-700 text-center px-4">{event.description}</div>
              </div>
              {/* Flecha entre círculos */}
              {idx < events.length - 1 && (
                <div className="flex justify-center w-full" style={{ height: 0.18 * circleSize }}>
                  <svg width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d={isAbove ? "M15 15 Q55 80 95 15" : "M15 65 Q55 0 95 65"} stroke="#a3a3a3" strokeWidth="3" strokeDasharray="7 7" fill="none" />
                    <polygon points={isAbove ? "95,15 90,30 100,30" : "95,65 90,50 100,50"} fill="#a3a3a3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// NUEVO ESTILO: Banda de Color Horizontal
function TimelineStyle6({ events }: { events: TimelineEvent[] }) {
  const BAND_COLORS = [
    '#2563eb', // azul
    '#f43f5e', // rojo
    '#facc15', // amarillo
    '#22c55e', // verde
    '#38bdf8', // celeste
    '#a21caf', // morado
  ];
  const ICONS = ['👥', '🔗', '⚙️', '📈', '🤝', '🏆'];
  const minTimelineWidth = Math.max(events.length * 220, 600);
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto py-8" style={{ minHeight: 320 }}>
      <div className="flex flex-row items-end gap-8 px-8" style={{ minWidth: minTimelineWidth }}>
        {events.map((event, idx) => {
          const color = BAND_COLORS[idx % BAND_COLORS.length];
          const icon = ICONS[idx % ICONS.length];
          return (
            <div key={event.id} className="flex flex-col items-center relative bg-white rounded-xl shadow-lg border border-gray-100" style={{ minWidth: 180, maxWidth: 220, padding: 0 }}>
              <div className="flex flex-col items-center pt-4 pb-2 px-4">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-base font-semibold text-gray-800 mb-1 text-center">{event.title}</div>
              </div>
              {/* Banda de color horizontal para la fecha */}
              <div className="w-full flex items-center justify-center" style={{ background: color, height: 38, position: 'relative' }}>
                <span className="text-white font-bold text-lg tracking-wide">{event.date}</span>
                <div className="absolute left-1/2" style={{ bottom: -10, transform: 'translateX(-50%)' }}>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="0,0 12,12 24,0" fill={color} />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-center px-4 pt-4 pb-6">
                <div className="text-xs text-gray-600 text-center mb-2">{event.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 