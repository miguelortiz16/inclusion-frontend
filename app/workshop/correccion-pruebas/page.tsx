"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Camera, Upload, Loader2, HelpCircle } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { createWorker } from 'tesseract.js';
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
import { usePoints } from "@/app/context/PointsContext"
import { PricingModal } from "@/components/pricing-modal"
interface TestCorrectionFormData {
  topic: string;
  course: string;
  name: string;
  isPublic: boolean;
  customGrade: string;
  theme: string;
}

export default function PaperTestScanner() {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [grade, setGrade] = useState<string>("")
  const [testType, setTestType] = useState<string>("")
  const [score, setScore] = useState<string>("")
  const [name, setName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<TestCorrectionFormData>({
    topic: "",
    course: "",
    name: "",
    isPublic: false,
    customGrade: "",
    theme: ""
  })

  const validateFields = () => {
    if (!name) {
      toast.error("Por favor, ingresa un nombre para el recurso")
      return false
    }
    if (!grade) {
      toast.error("Por favor, selecciona el grado del estudiante")
      return false
    }
    if (!testType) {
      toast.error("Por favor, selecciona el tipo de prueba")
      return false
    }
    if (!imageUrl) {
      toast.error("Por favor, sube una imagen de la prueba")
      return false
    }
    return true
  }

  const handleImageUpload = async (file: File) => {
    try {
      // Validar el tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, sube una imagen válida")
        return
      }

      // Limpiar estados anteriores
      setImageUrl("")
      setScore("")
      setLoading(true)

      // Crear URL para previsualización
      const url = URL.createObjectURL(file)
      setImageUrl(url)

      // Convertir imagen a base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = reader.result as string
        // Remover el prefijo "data:image/jpeg;base64," del string base64
        const base64Image = base64String.split(',')[1]
        
        // Guardar el base64 en el estado
        setFormData(prev => ({
          ...prev,
          theme: base64Image
        }))
        toast.success("Imagen procesada correctamente")
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al procesar la imagen")
    } finally {
      setLoading(false)
    }
  }
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
        topic: `esta calificacion es para: ${formData.topic} grado academico: ${grade === "otro" ? formData.customGrade : grade} tipo de prueba: ${testType}`,
        email: email,
        name: formData.name,
        isPublic: formData.isPublic,
        theme: formData.theme,
        grade: grade === "otro" ? formData.customGrade : grade
      }

      console.log('Enviando al backend:', topicRequest)

      // Enviar al backend para calificación
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/correcion-pruebas-papel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicRequest)
      })

      if (!response.ok) {
        throw new Error('Error al calificar la prueba')
      }

      const result = await response.text()
      setScore(result)
      toast.success("Prueba calificada exitosamente")

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al enviar la petición")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0])
      // Resetear el input file para permitir subir la misma imagen de nuevo
      e.target.value = ""
    }
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
        className="max-w-4xl mx-auto p-6"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-between mb-8"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-blue-900">
                Calificacion de Pruebas en Papel o impresion
              </h1>
            </motion.div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-blue-100 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-blue-900">
                    Guía para el Corrector de Pruebas
                  </DialogTitle>
                  <DialogDescription>
                    <div className="space-y-6 mt-4">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="font-medium text-blue-700">Requisitos de la Imagen:</h3>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-blue-900">
                          <li>Buena iluminación</li>
                          <li>Enfoque nítido</li>
                          <li>Contraste adecuado</li>
                          <li>Formato PNG o JPG</li>
                          <li>Máximo 10MB</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="font-medium text-blue-700">Tips para Mejor Resultado:</h3>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-blue-900">
                          <li>Coloca la prueba sobre una superficie plana</li>
                          <li>Evita sombras y reflejos</li>
                          <li>Asegura que todo el texto sea visible</li>
                          <li>Usa una cámara con buena resolución</li>
                          <li>Mantén la imagen lo más recta posible</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="font-medium text-blue-700">Proceso de Corrección:</h3>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-blue-900">
                          <li>Selecciona el grado del estudiante</li>
                          <li>Elige el tipo de prueba</li>
                          <li>Sube la imagen de la prueba</li>
                          <li>Revisa el texto extraído</li>
                          <li>Envía para calificación</li>
                        </ul>
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-8"
          >
            {/* Campo de Nombre */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-blue-900 font-medium">Criterios de Evaluación *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Define los criterios específicos y la rúbrica que se utilizarán para evaluar la prueba.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))
                }}
                placeholder="Ej: - Evaluar la comprensión lectora&#10;- Revisar ortografía&#10;- Calificar la estructura del texto"
                className="w-full bg-white border-blue-200 text-blue-900 min-h-[100px]"
                required
                maxLength={500}
              />
              <div className="text-xs text-right mt-1 text-blue-500">{name.length}/500</div>
            </motion.div>

            {/* Selector de Grado */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-blue-900 font-medium">Grado del Estudiante *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ingresa el grado educativo del estudiante para adaptar la corrección.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    customGrade: e.target.value
                  }))
                }}
                placeholder="Ej: Grado 3, Primaria, Secundaria, etc."
                className="w-full bg-white border-blue-200 text-blue-900"
                required
              />
            </motion.div>

            {/* Selector de Tipo de Prueba */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-blue-900 font-medium">Tipo de Prueba *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Selecciona el formato de la prueba para una corrección más precisa.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={testType}
                onValueChange={setTestType}
              >
                <SelectTrigger className="w-full bg-white border-blue-200 text-blue-900">
                  <SelectValue placeholder="Selecciona el tipo de prueba" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-100">

                  <SelectItem value="verdadero_falso">
                    <div className="flex flex-col">
                      <span className="font-medium">Verdadero/Falso</span>
                      <span className="text-sm text-gray-500">Detecta afirmaciones y respuestas V/F, evalúa corrección y justifica</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completar">
                    <div className="flex flex-col">
                      <span className="font-medium">Completar espacios</span>
                      <span className="text-sm text-gray-500">Extrae oraciones con espacios, valida palabras y sugiere mejoras</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="desarrollo">
                    <div className="flex flex-col">
                      <span className="font-medium">Desarrollo</span>
                      <span className="text-sm text-gray-500">Evalúa contenido, coherencia, ortografía y claridad con calificación numérica</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ensayo">
                    <div className="flex flex-col">
                      <span className="font-medium">Ensayo</span>
                      <span className="text-sm text-gray-500">Analiza argumentos, estructura, gramática y profundidad con rúbrica detallada</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Área de Upload */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="bg-blue-50 rounded-xl p-8 text-center border-2 border-dashed border-blue-200"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              
              {!imageUrl ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-full shadow-sm">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-900 font-medium">Sube una foto de la prueba</p>
                    <p className="text-sm text-blue-600">PNG, JPG hasta 10MB</p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Seleccionar Imagen
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="space-y-4"
                >
                  <img
                    src={imageUrl}
                    alt="Prueba escaneada"
                    className="max-h-[400px] mx-auto rounded-lg shadow-sm"
                  />
                  <Button
                    onClick={() => {
                      setImageUrl("")
                      setScore("")
                    }}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Eliminar imagen
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Área de Resultados */}
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-100"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Procesando imagen...</span>
              </motion.div>
            )}

            {imageUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="space-y-4"
              >
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loading}
                >
                  Enviar para Calificación
                </Button>
              </motion.div>
            )}

            {score && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                className="bg-blue-50 rounded-xl p-6 border border-blue-100"
              >
                <h3 className="font-semibold text-blue-900 mb-2">Retroalimentación:</h3>
                <p className="text-blue-800 whitespace-pre-wrap">{score}</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 