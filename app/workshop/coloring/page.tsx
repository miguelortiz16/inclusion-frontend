"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"
import { RiFileDownloadLine, RiShareLine, RiQuestionLine } from "react-icons/ri"
import { motion } from "framer-motion"
import { FileDown, Share2 } from "lucide-react"
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
import { PricingModal } from "@/components/pricing-modal"

// Add PixelationEffect component
const PixelationEffect = () => {
  return (
    <div className="relative w-full h-[500px] bg-gray-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-400/20 animate-pulse"
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface ColoringFormData {
  grade: string;
  topic: string;
  subject: string;
  customGrade?: string;
  customSubject?: string;
}

export default function Coloring() {
  const [formData, setFormData] = useState<ColoringFormData>({
    grade: "",
    topic: "",
    subject: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [imageData, setImageData] = useState<string>("")
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const [isImageLoading, setIsImageLoading] = useState(false)

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
    setIsLoading(true)
    setIsImageLoading(true)
    let emailUser = localStorage.getItem("email")
    if (!emailUser) {
      toast.error("No se encontró el email del usuario")
      setIsLoading(false)
      setIsImageLoading(false)
      return
    }

    const accessData = await validateAccess(emailUser)
    
    if (!accessData.allowed ) {
      setIsLoading(false)
      setIsImageLoading(false)
      setShowPricingModal(true)
      setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
      return
    }else if(accessData.message.includes("(3/5)")||accessData.message.includes("(4/5)") ||accessData.message.includes("(5/5)") ){

      setIsLoading(false)
      setIsImageLoading(false)
      setShowPricingModal(true)
      setAccessMessage( 'Necesitas una suscripción para continuar')
      return
    }

    try {
      const request = {
        grade: formData.grade === "otro" ? formData.customGrade : formData.grade,
        subject: formData.subject === "otro" ? formData.customSubject : formData.subject,
        topic: formData.topic,
        email: emailUser
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-dibujo-colorear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Error al generar la imagen')
      }

      const data = await response.json()
      setImageData(data.base64Data)
      toast.success('Imagen generada exitosamente')
      
      // Verificar si es una pantalla pequeña (móvil) y abrir el modal automáticamente
      if (window.innerWidth < 1024) {
        setShowPreviewModal(true)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar la imagen')
    } finally {
      setIsLoading(false)
      setIsImageLoading(false)
    }
  }

  const handleInputChange = (field: keyof ColoringFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const downloadImage = () => {
    if (!imageData) return

    const link = document.createElement('a')
    link.href = `data:image/png;base64,${imageData}`
    link.download = `dibujo-colorear-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Imagen descargada exitosamente")
  }

  const shareImage = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Dibujo para Colorear - ${formData.topic}`,
          text: `¡Mira este dibujo para colorear sobre ${formData.topic}!`,
          url: `data:image/png;base64,${imageData}`
        })
      } else {
        await navigator.clipboard.writeText(`data:image/png;base64,${imageData}`)
        toast.success("Enlace de la imagen copiado al portapapeles")
      }
    } catch (error) {
      console.error('Error al compartir:', error)
      toast.error("Error al compartir la imagen")
    }
  }

  const isFormValid = () => {
    return formData.grade && formData.topic && formData.subject
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
          className="flex flex-col lg:flex-row h-screen"
        >
          {/* Panel izquierdo - Previsualizador */}
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
                <RiFileDownloadLine className="w-8 h-8 text-pink-500" />
                <h1 className="text-2xl font-bold text-gray-900">Generador de Dibujos para Colorear</h1>
              </div>
              {imageData && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none"
                    onClick={downloadImage}
                  >
                    <FileDown className="w-4 h-4" />
                    Descargar Imagen
                  </Button>

                </div>
              )}
            </motion.div>

            {/* Contenido */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative"
            >
              {isImageLoading ? (
                <PixelationEffect />
              ) : imageData ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg border p-6 flex justify-center"
                >
                  <img 
                    src={`data:image/png;base64,${imageData}`}
                    alt="Dibujo para colorear"
                    className="max-w-[50%] h-auto"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
                >
                  <RiFileDownloadLine className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay imagen generada</p>
                  <p className="text-center text-sm">
                    Completa el formulario de la derecha para generar un dibujo para colorear.
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
                <h2 className="text-xl font-semibold">Generador de Dibujos</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <RiQuestionLine className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Guía para Generar Dibujos para Colorear</DialogTitle>
                      <DialogDescription>
                        <div className="space-y-4 mt-4">
                          <div>
                            <h3 className="font-medium">Información Requerida:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Nivel educativo del estudiante</li>
                              <li>Tema o concepto a ilustrar</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium">Características del dibujo:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Líneas negras simples y gruesas</li>
                              <li>Sin sombras ni colores</li>
                              <li>Fondo blanco</li>
                              <li>Diseño adaptado al nivel educativo</li>
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
                      </SelectContent>
                    </Select>
                    {formData.grade === "otro" && (
                      <div className="mt-2">
                        <Input
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
                      <Label htmlFor="subject">Materia</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Selecciona la materia del dibujo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => handleInputChange("subject", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la materia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otro">Otro (especificar)</SelectItem>
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
                        <SelectItem value="musica">Musica</SelectItem>
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
                    {formData.subject === "otro" && (
                      <div className="mt-2">
                        <Input
                          value={formData.customSubject}
                          onChange={(e) => handleInputChange("customSubject", e.target.value)}
                          placeholder="Escribe la materia"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="topic">Tema o Concepto</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Describe el tema o concepto que quieres ilustrar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => handleInputChange("topic", e.target.value)}
                      placeholder="Ej: El ciclo del agua, Los planetas del sistema solar, La fotosíntesis..."
                      className="min-h-[100px]"
                      required
                    />
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
                    className={`w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white ${
                      !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-blue-900'
                    }`}
                  >
                    {isLoading ? "Generando..." : "Generar Dibujo"}
                  </Button>
                </motion.div>
              </motion.form>

              {/* Botón para mostrar previsualización en móvil */}
              {imageData && (
                <div className="lg:hidden mt-4">
                  <Button
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full"
                  >
                    Ver Dibujo
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
              <DialogTitle>Previsualización del Dibujo</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto h-full">
              {isImageLoading ? (
                <PixelationEffect />
              ) : imageData ? (
                <div className="space-y-4">
                  {/* Botones de exportación en el modal */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none"
                      onClick={downloadImage}
                    >
                      <FileDown className="w-4 h-4" />
                      Descargar Imagen
                    </Button>

                  </div>

                  <div className="bg-white rounded-lg border p-6 flex justify-center">
                    <img 
                      src={`data:image/png;base64,${imageData}`}
                      alt="Dibujo para colorear"
                      className="max-w-[50%] h-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                  <RiFileDownloadLine className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay imagen generada</p>
                  <p className="text-center text-sm">
                    Completa el formulario para generar un dibujo para colorear.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  )
} 