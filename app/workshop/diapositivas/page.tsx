"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, ImageIcon, Palette, HelpCircle, Wand2 } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ColorPicker } from "@/components/ui/color-picker"
import TypingEffect, { LoadingButton } from "@/components/typing-effect"
import pptxgen from "pptxgenjs"
import { PricingModal } from "@/components/pricing-modal"

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
import { motion } from "framer-motion"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"
import { ChatImprovementModal } from "../../components/chat-improvement-modal"
import { MessageCircle } from "lucide-react"

interface Slide {
  title: string
  content: string
  imageUrl?: string
  imageBase64?: string
  isGeneratingImage?: boolean
}

interface PresentationFormData {
  topic: string
  course: string
  primaryColor: string
  secondaryColor: string
  textColor: string
  fontFamily: string
  slideCount: string
  name: string
  theme: string
  isPublic: boolean
  subject: string
  customSubject?: string
  customCourse?: string
}

export default function PresentationGenerator() {
  const [loading, setLoading] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'typing'>('idle')
  const [retryCount, setRetryCount] = useState(0)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<PresentationFormData>({
    topic: "",
    course: "",
    primaryColor: "#4F46E5",
    secondaryColor: "#818CF8",
    textColor: "#ffffff",
    fontFamily: "Montserrat",
    slideCount: "5",
    name: "",
    theme: "moderno",
    isPublic: false,
    subject: "",
    customSubject: "",
    customCourse: ""
  })

  const themes = {
    moderno: {
      primaryColor: "#4F46E5",
      secondaryColor: "#818CF8",
      textColor: "#ffffff",
      fontFamily: "Montserrat"
    },
    profesional: {
      primaryColor: "#1E40AF",
      secondaryColor: "#3B82F6",
      textColor: "#ffffff",
      fontFamily: "Arial"
    },
    educativo: {
      primaryColor: "#047857",
      secondaryColor: "#10B981",
      textColor: "#ffffff",
      fontFamily: "Open Sans"
    },
    minimalista: {
      primaryColor: "#1F2937",
      secondaryColor: "#6B7280",
      textColor: "#ffffff",
      fontFamily: "Helvetica"
    },
    creativo: {
      primaryColor: "#7C3AED",
      secondaryColor: "#A78BFA",
      textColor: "#ffffff",
      fontFamily: "Quicksand"
    }
  }

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  
  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambian las diapositivas
  useEffect(() => {
    if (slides) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('slidesFromChat')
      if (!isFromChat) {
        localStorage.removeItem('slidesChatState')
        console.log('Diapositivas generadas desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('slidesFromChat')
      }
    }
  }, [slides])

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
    localStorage.removeItem('slidesChatState')
    setShowChatModal(true)
  }

  const getCurrentContent = () => {
    // Enviar solo el título de la primera diapositiva para que el chat pueda buscar el contenido
    if (slides.length === 0) return ""
    
    // Tomar el título de la primera diapositiva como referencia
    return slides[0].title
  }

  const handleContentUpdate = (newContent: string) => {
    try {
      // Marcar que el cambio viene del chat
      sessionStorage.setItem('slidesFromChat', 'true')
      
      // Limpiar el formato ```json y ``` del string si viene
      let cleanedContent = newContent
      if (cleanedContent.includes('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (cleanedContent.includes('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '')
      }
      
      // Intentar parsear el JSON
      const parsedData = JSON.parse(cleanedContent)
      
      // Verificar que tenga la estructura esperada
      if (parsedData.slides && Array.isArray(parsedData.slides)) {
        // Actualizar las diapositivas con el nuevo contenido
        setSlides(parsedData.slides)
        toast.success("Diapositivas actualizadas exitosamente")
      } else {
        throw new Error("Formato de diapositivas inválido")
      }
    } catch (error) {
      console.error('Error al procesar la respuesta del chat:', error)
      toast.error("Error al actualizar las diapositivas. El formato no es válido.")
    }
  }
  const handleThemeChange = (theme: string) => {
    const selectedTheme = themes[theme as keyof typeof themes]
    setFormData(prev => ({
      ...prev,
      theme,
      primaryColor: selectedTheme.primaryColor,
      secondaryColor: selectedTheme.secondaryColor,
      textColor: selectedTheme.textColor,
      fontFamily: selectedTheme.fontFamily
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState('generating')

    try {
      // Procesar el texto del tema para extraer información
      const topicText = formData.topic;
      const courseMatch = topicText.match(/(?:Nivel|nivel):\s*(Universidad|Grado \d+|Educación Infantil)/i);
      const slideCountMatch = topicText.match(/(\d+)\s*diapositivas/i);
      
      // Extraer el tema real (primera línea)
      const actualTopic = topicText.split('\n')[0].trim();
      
      // Usar los valores extraídos o los valores por defecto
      const extractedCourse = courseMatch ? courseMatch[1].toLowerCase() : formData.course;
      const extractedSlideCount = slideCountMatch ? slideCountMatch[1] : formData.slideCount;

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

      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (!success && retryCount < maxRetries) {
        try {
          const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/diapositivas-automaticas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: actualTopic + " para explicarlo al grado " + (formData.course === "otro" ? formData.customCourse : extractedCourse) + " materia " + (formData.subject === "otro" ? formData.customSubject : formData.subject) + ". El objetivo es proporcionar una explicación extensa y detallada en cada diapositiva, cubriendo todos los aspectos del tema , definiciones claras, y un análisis exhaustivo. Cada diapositiva debe contener una explicación profunda, utilizando lenguaje académico adecuado para el nivel del curso. La cantidad de diapositivas será " + extractedSlideCount + ", por lo tanto, asegúrate de que el contenido de cada diapositiva sea lo suficientemente largo y completo como para cubrir el tema a fondo, sin omitir información clave.",
              email: email,
              name: formData.name,
              isPublic: formData.isPublic,
              grade: formData.course === "otro" ? formData.customCourse : formData.course,
              theme: formData.topic,
              subject: formData.subject === "otro" ? formData.customSubject : formData.subject
            })
          });

          if (!response.ok) {
            throw new Error(`Error al generar las diapositivas: ${response.status} ${response.statusText}`);
          }

          let data;
          try {
            const responseText = await response.text();
            data = JSON.parse(responseText);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            throw new Error("Error al procesar la respuesta del servidor. El formato de la respuesta no es válido.");
          }

          // Verificar que la respuesta tenga el formato esperado
          if (!data || !data.slides || !Array.isArray(data.slides)) {
            throw new Error('Formato de respuesta inválido de las diapositivas');
          }

          setSlides(data.slides);
          setLoadingState('typing');
          success = true;
          toast.success("Diapositivas generadas exitosamente");
          
          // Limpiar el estado del chat cuando se generan nuevas diapositivas
          localStorage.removeItem('slidesChatState')
          

          
          // En móvil, mostrar el modal de previsualización
          if (window.innerWidth < 1024) {
            setShowPreviewModal(true)
          }

        } catch (error) {
          retryCount++;
          console.error(`Intento ${retryCount} fallido:`, error);
          
          if (retryCount < maxRetries) {
            toast.error(`Error al generar las diapositivas. Intento ${retryCount} de ${maxRetries}. Reintentando...`);
            // Esperar 2 segundos antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            toast.error(error instanceof Error ? error.message : "Error al generar las diapositivas después de 3 intentos");
            setLoadingState('idle');
          }
        }

                  // Agregar puntos por generar diapositivas
                  if (email) {
                    await gamificationService.addPoints(email, 10, 'presentation_creation')
                    showPointsNotification(10, 'crear una presentación')
                  }
      }

      if (!success) {
        throw new Error("No se pudo generar las diapositivas después de varios intentos");
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Error al generar las diapositivas");
      setLoadingState('idle');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (field: keyof PresentationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (slideIndex: number, file: File) => {
    try {
      // Convertir el archivo a Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setSlides(prev => prev.map((slide, index) => 
          index === slideIndex ? { 
            ...slide, 
            imageUrl: URL.createObjectURL(file),
            imageBase64: base64String
          } : slide
        ))
        toast.success("Imagen subida exitosamente")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error al subir la imagen:', error)
      toast.error("Error al subir la imagen")
    }
  }

  const handleImageUrlChange = async (slideIndex: number, url: string) => {
    try {
      if (!url) {
        setSlides(prev => prev.map((slide, index) => 
          index === slideIndex ? { ...slide, imageUrl: '', imageBase64: undefined } : slide
        ))
        return
      }

      // Validar formato de URL
      if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
        toast.error("La URL debe ser una imagen válida (jpg, png, gif, webp)")
        return
      }

      // Intentar cargar la imagen primero
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      img.onload = () => {
        // Crear un canvas para convertir la imagen a base64
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        
        try {
          // Convertir a base64
          const base64String = canvas.toDataURL('image/jpeg')
          setSlides(prev => prev.map((slide, index) => 
            index === slideIndex ? { ...slide, imageUrl: url, imageBase64: base64String } : slide
          ))
          toast.success("Imagen cargada exitosamente")
        } catch (error) {
          console.error('Error al convertir la imagen:', error)
          toast.error("Error al procesar la imagen. Intenta con otra URL o sube la imagen directamente.")
        }
      }

      img.onerror = () => {
        toast.error(
          <div>
            <p>No se pudo cargar la imagen desde la URL proporcionada.</p>
            <p className="text-sm mt-1">Esto puede deberse a:</p>
            <ul className="text-sm list-disc list-inside mt-1">
              <li>La URL no es accesible</li>
              <li>La imagen está protegida</li>
              <li>El servidor no permite acceso externo</li>
            </ul>
            <p className="text-sm mt-2">Sugerencias:</p>
            <ul className="text-sm list-disc list-inside mt-1">
              <li>Verifica que la URL sea correcta</li>
              <li>Intenta guardar la imagen y subirla directamente</li>
              <li>Usa una URL de una imagen pública</li>
            </ul>
          </div>
        )
        setSlides(prev => prev.map((slide, index) => 
          index === slideIndex ? { ...slide, imageUrl: '', imageBase64: undefined } : slide
        ))
      }

      img.src = url
    } catch (error) {
      console.error('Error al cargar la imagen:', error)
      toast.error("Error al procesar la imagen. Intenta con otra URL o sube la imagen directamente.")
      setSlides(prev => prev.map((slide, index) => 
        index === slideIndex ? { ...slide, imageUrl: '', imageBase64: undefined } : slide
      ))
    }
  }

  const generatePresentation = () => {
    const pptx = new pptxgen()
    
    // Configurar el master de la presentación con un diseño más moderno y profesional
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: '#ffffff' },
      margin: [0.5, 0.5, 0.5, 0.5],
      objects: [
        // Barra superior más delgada
        { rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: formData.primaryColor } } },
        // Línea decorativa más delgada
        { rect: { x: 0, y: 0.6, w: '100%', h: 0.03, fill: { color: formData.secondaryColor } } },
        // Barra inferior
        { rect: { x: 0, y: 6.8, w: '100%', h: 0.2, fill: { color: formData.secondaryColor } } }
      ]
    })

    // Diapositiva de presentación mejorada
    const titleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' })
    
    // Formas decorativas para la portada
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: formData.secondaryColor, transparency: 20 },
      line: { color: formData.primaryColor, width: 1 }
    })

    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 10,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: formData.secondaryColor, transparency: 20 },
      line: { color: formData.primaryColor, width: 1 }
    })

    // Título principal con mejor espaciado
    titleSlide.addText(formData.topic.toUpperCase(), {
      x: 0.5,
      y: 2.8,
      w: '95%',
      h: 1.2,
      fontSize: 44,
      color: formData.primaryColor,
      align: 'center',
      bold: true,
      fontFace: formData.fontFamily
    })

    // Subtítulo con mejor estilo
    titleSlide.addText(`Nivel: ${formData.course}`, {
      x: 0.5,
      y: 4.2,
      w: '95%',
      h: 0.75,
      fontSize: 28,
      color: formData.secondaryColor,
      align: 'center',
      fontFace: formData.fontFamily
    })

    // Diapositivas de contenido mejoradas
    slides.forEach((slide, index) => {
      const pptxSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' })

      // Título arriba, centrado
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.28,
        w: '95%',
        h: 0.5,
        fontSize: 24,
        color: '#1F2937',
        align: 'center',
        bold: true,
        fontFace: formData.fontFamily
      })

      // Contenido a la izquierda
      const contentLines = slide.content.split('\n').filter(line => line.trim())
      pptxSlide.addText(contentLines.map(line => ({
        text: line,
        options: {
          bullet: { type: 'number' },
          fontSize: 12,
          color: '#374151',
          fontFace: formData.fontFamily,
          breakLine: true,
          paraSpaceBefore: 6
        }
      })), {
        x: 0.5,
        y: 1.2,
        w: 6,
        h: 3,
        align: 'left',
        lineSpacing: 16
      })

      // Imagen a la derecha (corrida a la izquierda un 30%)
      if (slide.imageBase64) {
        let imageData = slide.imageBase64
        if (!imageData.startsWith('data:image')) {
          imageData = `data:image/png;base64,${imageData}`
        }
        // Fondo para la imagen
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x: 5.1, // Corrido a la izquierda un 30%
          y: 1.2,
          w: 4,
          h: 3,
          fill: { color: '#ffffff' },
          line: { color: formData.secondaryColor, width: 2 },
          shadow: { type: 'outer', blur: 10, offset: 3, angle: 45, color: 'a6a6a6', opacity: 0.2 }
        })
        pptxSlide.addImage({
          data: imageData,
          x: 5.3, // Corrido a la izquierda un 30%
          y: 1.4,
          w: 3.6,
          h: 2.6,
          sizing: { type: 'contain', w: 3.6, h: 2.6 }
        })
      }
    })

    // Diapositiva final mejorada
    const endSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' })
    
    // Formas decorativas para el final
    endSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: formData.secondaryColor, transparency: 20 },
      line: { color: formData.primaryColor, width: 1 }
    })

    endSlide.addShape(pptx.ShapeType.rect, {
      x: 10,
      y: 2.5,
      w: 2,
      h: 2,
      fill: { color: formData.secondaryColor, transparency: 20 },
      line: { color: formData.primaryColor, width: 1 }
    })

    // Mensaje final con mejor estilo
    endSlide.addText('¡Gracias por su atención!', {
      x: 0.5,
      y: 2.8,
      w: '95%',
      h: 1.2,
      fontSize: 44,
      color: formData.primaryColor,
      align: 'center',
      bold: true,
      fontFace: formData.fontFamily
    })

    endSlide.addText('¿Preguntas y comentarios?', {
      x: 0.5,
      y: 4.2,
      w: '95%',
      h: 0.75,
      fontSize: 28,
      color: formData.secondaryColor,
      align: 'center',
      fontFace: formData.fontFamily
    })

    // Guardar la presentación
    pptx.writeFile({ fileName: `presentacion-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.pptx` })
    toast.success("Presentación generada exitosamente")
  }

  const handleAddSlide = () => {
    const newSlide: Slide = {
      title: "Nueva diapositiva",
      content: "Ingresa el contenido aquí..."
    }
    setSlides(prev => [...prev, newSlide])
    toast.success("Nueva diapositiva agregada")
  }

  const handleDeleteSlide = (index: number) => {
    setSlides(prev => prev.filter((_, i) => i !== index))
    toast.success("Diapositiva eliminada")
  }

  const generateImageForSlide = async (slideIndex: number) => {
    const slide = slides[slideIndex]
    const email = localStorage.getItem('email')
    
    if (!email) {
      toast.error("No se encontró el email del usuario")
      return
    }

    // Validar acceso
    const accessData = await validateAccess(email)
    
    if (!accessData.allowed) {
      setShowPricingModal(true)
      setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
      return
    } else if (accessData.message.includes("(3/5)") || accessData.message.includes("(4/5)") || accessData.message.includes("(5/5)")) {
      setShowPricingModal(true)
      setAccessMessage('Necesitas una suscripción para continuar')
      return
    }

    // Marcar la diapositiva como generando imagen
    setSlides(prev => prev.map((s, i) => 
      i === slideIndex ? { ...s, isGeneratingImage: true } : s
    ))

    try {
      const request = {
        grade: formData.course === "otro" ? formData.customCourse : formData.course,
        subject: formData.subject === "otro" ? formData.customSubject : formData.subject,
        topic: `${formData.topic}: ${slide.title}`,
        email: email
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-imagen-educativa', {
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
      
      // Actualizar la diapositiva con la imagen generada
      setSlides(prev => prev.map((s, i) => 
        i === slideIndex ? { 
          ...s, 
          imageBase64: data.base64Data,
          imageUrl: `data:image/png;base64,${data.base64Data}`,
          isGeneratingImage: false
        } : s
      ))
      
      toast.success('Imagen generada exitosamente para la diapositiva')
      
      // Agregar puntos por generar imagen
      await gamificationService.addPoints(email, 5, 'image_generation')
      showPointsNotification(5, 'generar una imagen')

    } catch (error) {
      console.error('Error al generar la imagen:', error)
      toast.error('Error al generar la imagen para esta diapositiva')
      
      // Quitar el estado de generación en caso de error
      setSlides(prev => prev.map((s, i) => 
        i === slideIndex ? { ...s, isGeneratingImage: false } : s
      ))
    }
  }

  const generateImagesForAllSlides = async () => {
    const email = localStorage.getItem('email')
    
    if (!email) {
      toast.error("No se encontró el email del usuario")
      return
    }

    // Validar acceso
    const accessData = await validateAccess(email)
    
    if (!accessData.allowed) {
      setShowPricingModal(true)
      setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
      return
    } else if (accessData.message.includes("(3/5)") || accessData.message.includes("(4/5)") || accessData.message.includes("(5/5)")) {
      setShowPricingModal(true)
      setAccessMessage('Necesitas una suscripción para continuar')
      return
    }

    // Marcar todas las diapositivas como generando imagen
    setSlides(prev => prev.map(slide => ({ ...slide, isGeneratingImage: true })))

    try {
      const promises = slides.map(async (slide, index) => {
        const request = {
          grade: formData.course === "otro" ? formData.customCourse : formData.course,
          subject: formData.subject === "otro" ? formData.customSubject : formData.subject,
          topic: `${formData.topic}: ${slide.title} no poner el texto en la imagen`,
          email: email
        }

        const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generar-imagen-educativa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`Error al generar la imagen para la diapositiva ${index + 1}`)
        }

        const data = await response.json()
        return { index, base64Data: data.base64Data }
      })

      const results = await Promise.all(promises)
      
      // Actualizar todas las diapositivas con sus imágenes generadas
      setSlides(prev => prev.map((slide, i) => {
        const result = results.find(r => r.index === i)
        if (result) {
          return {
            ...slide,
            imageBase64: result.base64Data,
            imageUrl: `data:image/png;base64,${result.base64Data}`,
            isGeneratingImage: false
          }
        }
        return { ...slide, isGeneratingImage: false }
      }))
      
      toast.success(`Imágenes generadas exitosamente para ${slides.length} diapositivas`)
      
      // Agregar puntos por generar imágenes
      await gamificationService.addPoints(email, slides.length * 5, 'bulk_image_generation')
      showPointsNotification(slides.length * 5, 'generar imágenes para todas las diapositivas')

    } catch (error) {
      console.error('Error al generar las imágenes:', error)
      toast.error('Error al generar las imágenes. Algunas diapositivas pueden no tener imagen.')
      
      // Quitar el estado de generación en caso de error
      setSlides(prev => prev.map(slide => ({ ...slide, isGeneratingImage: false })))
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
        className="flex flex-col lg:flex-row h-screen"
      >
        {/* Panel izquierdo - Previsualización */}
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
            <h1 className="text-xl font-semibold">Generador de Diapositivas (Beta)</h1>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-2"
            >
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50"
                onClick={handleAddSlide}
              >
                <span className="text-lg">+</span>
                <span className="font-medium">Agregar diapositiva</span>
              </Button>

              <Button 
                variant="default"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                onClick={generatePresentation}
                disabled={!slides.length}
              >
                <FileDown className="w-6 h-6" />
                <span className="font-semibold">Descargar Presentación</span>
              </Button>
              {slides.length > 0 && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white relative"
                  onClick={openChatModal}
                >
                  <MessageCircle className="w-4 h-4" />
                  Mejorar con IA
                </Button>
              )}
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-6"
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className="relative bg-white rounded-lg border-2 border-blue-500 shadow-sm p-4"
                style={{ boxShadow: '0 0 0 2px #3b82f6' }}
              >
                {/* Número de diapositiva en la esquina superior izquierda */}
                <div
                  className="absolute -top-3 -left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-4 border-white text-lg font-bold z-10"
                  style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.15)' }}
                  title={`Diapositiva ${index + 1}`}
                >
                  {index + 1}
                </div>
                {/* Resto del contenido de la diapositiva */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <Input
                      value={slide.title}
                      onChange={(e) => {
                        const newTitle = e.target.value
                        setSlides(prev => prev.map((s, i) => 
                          i === index ? { ...s, title: newTitle } : s
                        ))
                      }}
                      className="text-lg font-semibold mb-2"
                      placeholder="Título de la diapositiva"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const fileType = file.type.toLowerCase();
                          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                          if (!validTypes.includes(fileType)) {
                            toast.error("Por favor, sube una imagen en formato JPG, JPEG, PNG, GIF o WEBP");
                            return;
                          }
                          handleImageUpload(index, file);
                        }
                      }}
                      className="hidden"
                      id={`image-upload-${index}`}
                    />
                    <label
                      htmlFor={`image-upload-${index}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer text-blue-700 transition-colors duration-200"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-medium">Subir imagen</span>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 border-purple-200 hover:border-purple-300"
                      onClick={() => generateImageForSlide(index)}
                      disabled={slide.isGeneratingImage}
                      title="Generar imagen automáticamente basada en el contenido"
                    >
                      <Wand2 className={`w-5 h-5 ${slide.isGeneratingImage ? 'animate-spin' : ''}`} />
                      <span className="font-medium">
                        {slide.isGeneratingImage ? 'Generando...' : 'Generar imagen'}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteSlide(index)}
                    >
                      <span className="text-lg">×</span>
                      Eliminar
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <Label className="text-base font-medium text-gray-700 mb-2">Contenido</Label>
                  <Textarea
                    value={slide.content}
                    onChange={(e) => {
                      const newContent = e.target.value
                      setSlides(prev => prev.map((s, i) => 
                        i === index ? { ...s, content: newContent } : s
                      ))
                    }}
                    className="min-h-[200px]"
                    placeholder="Edita el contenido de la diapositiva aquí..."
                  />
                </div>
                {slide.imageUrl && (
                  <div className="mt-4 max-w-[300px]">
                    <img
                      src={slide.imageUrl}
                      alt={`Imagen para ${slide.title}`}
                      className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-md"
                      onError={() => {
                        toast.error("Error al cargar la imagen. Verifica que la URL sea correcta.")
                        handleImageUrlChange(index, '')
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {slides.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg mb-6 border border-green-100 shadow-sm"
              >
                <p className="text-green-800 font-semibold text-lg mb-2">✨ ¡Tu presentación está lista!</p>
                <p className="text-green-700 mb-4">
                  Puedes personalizar cada diapositiva agregando imágenes relevantes antes de descargar.
                </p>
                <Button 
                  variant="default"
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                  onClick={generatePresentation}
                >
                  <FileDown className="w-6 h-6" />
                  Descargar Presentación
                </Button>
              </motion.div>
            )}

            {!slides.length && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay diapositivas generadas</p>
                <p className="text-center text-sm">
                  Completa el formulario de la derecha para generar diapositivas automáticamente.
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-between items-center mb-6"
            >
              <h2 className="text-xl font-semibold">Generador de Diapositivas (Beta)</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Crear Presentaciones</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para el Tema:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Se específico con el tema que deseas presentar</li>
                            <li>Incluye los puntos principales que quieres cubrir</li>
                            <li>Considera el nivel educativo de tu audiencia</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Personalización:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Elige colores que mejoren la legibilidad</li>
                            <li>Selecciona una fuente que sea fácil de leer</li>
                            <li>Usa imágenes relevantes para apoyar tu contenido</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Estructura:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Comienza con una introducción clara</li>
                            <li>Desarrolla los puntos principales</li>
                            <li>Incluye ejemplos y casos prácticos</li>
                            <li>Finaliza con un resumen o conclusión</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </motion.div>
            
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
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El tema principal de tu presentación. Incluye los puntos clave que deseas cubrir.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder={`Ej: El Sistema Solar
- Introducción al Sistema Solar
- Los planetas y sus características
- El Sol y su importancia
- Curiosidades y datos interesantes`}
                    required
                    className="min-h-[150px] font-['Arial'] text-base p-4 border-2 border-gray-200 focus:border-blue-500 rounded-lg shadow-sm"
                    style={{ fontFamily: 'Arial' }}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course">Nivel educativo *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El grado o nivel educativo de los estudiantes a quienes va dirigida la presentación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.course}
                    onValueChange={(value: string) => handleInputChange("course", value)}
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2"
                    >
                      <Label htmlFor="customCourse">Especifica el nivel educativo *</Label>
                      <Input
                        id="customCourse"
                        value={formData.customCourse}
                        onChange={(e) => handleInputChange("customCourse", e.target.value)}
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
                  transition={{ duration: 0.5, delay: 0.75 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subject">Materia *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>La materia o asignatura para la cual estás creando la presentación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.subject}
                    onValueChange={(value: string) => handleInputChange("subject", value)}
                    required
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2"
                    >
                      <Label htmlFor="customSubject">Especifica la materia *</Label>
                      <Input
                        id="customSubject"
                        value={formData.customSubject}
                        onChange={(e) => handleInputChange("customSubject", e.target.value)}
                        placeholder="Ingresa el nombre de la materia"
                        required
                        className="mt-1"
                      />
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="slideCount">Cantidad de diapositivas *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El número de diapositivas que tendrá tu presentación. Considera el tiempo disponible y la profundidad del tema.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.slideCount}
                    onValueChange={(value: string) => handleInputChange("slideCount", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 diapositivas</SelectItem>
                      <SelectItem value="4">4 diapositivas</SelectItem>
                      <SelectItem value="5">5 diapositivas</SelectItem>
                      <SelectItem value="6">6 diapositivas</SelectItem>
                      <SelectItem value="7">7 diapositivas</SelectItem>
                      <SelectItem value="8">8 diapositivas</SelectItem>
                      <SelectItem value="9">9 diapositivas</SelectItem>
                      <SelectItem value="10">10 diapositivas</SelectItem>
                      <SelectItem value="11">11 diapositivas</SelectItem>
                      <SelectItem value="12">12 diapositivas</SelectItem>
                      <SelectItem value="13">13 diapositivas</SelectItem>
                      <SelectItem value="14">14 diapositivas</SelectItem>
                      <SelectItem value="15">15 diapositivas</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fontFamily">Tipo de letra</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona una fuente que sea legible y apropiada para tu audiencia.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(value: string) => handleInputChange("fontFamily", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial" className="font-['Arial']">Arial - Profesional y clara</SelectItem>
                      <SelectItem value="Helvetica" className="font-['Helvetica']">Helvetica - Moderna y limpia</SelectItem>
                      <SelectItem value="Calibri" className="font-['Calibri']">Calibri - Suave y legible</SelectItem>
                      <SelectItem value="Segoe UI" className="font-['Segoe UI']">Segoe UI - Moderna y elegante</SelectItem>
                      <SelectItem value="Roboto" className="font-['Roboto']">Roboto - Contemporánea</SelectItem>
                      <SelectItem value="Montserrat" className="font-['Montserrat']">Montserrat - Elegante y actual</SelectItem>
                      <SelectItem value="Open Sans" className="font-['Open Sans']">Open Sans - Clara y amigable</SelectItem>
                      <SelectItem value="Lato" className="font-['Lato']">Lato - Moderna y versátil</SelectItem>
                      <SelectItem value="Nunito" className="font-['Nunito']">Nunito - Suave y educativa</SelectItem>
                      <SelectItem value="Quicksand" className="font-['Quicksand']">Quicksand - Moderna y redondeada</SelectItem>
                      <SelectItem value="Comic Sans MS" className="font-['Comic Sans MS']">Comic Sans MS - Informal y divertida</SelectItem>
                      <SelectItem value="Century Gothic" className="font-['Century Gothic']">Century Gothic - Geométrica y clara</SelectItem>
                      <SelectItem value="Trebuchet MS" className="font-['Trebuchet MS']">Trebuchet MS - Profesional y dinámica</SelectItem>
                      <SelectItem value="Verdana" className="font-['Verdana']">Verdana - Alta legibilidad</SelectItem>
                      <SelectItem value="Georgia" className="font-['Georgia']">Georgia - Elegante con serifas</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <Label>Tema de la presentación</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona un tema predefinido para tu presentación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.theme}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderno">Moderno - Elegante y actual</SelectItem>
                      <SelectItem value="profesional">Profesional - Formal y corporativo</SelectItem>
                      <SelectItem value="educativo">Educativo - Claro y didáctico</SelectItem>
                      <SelectItem value="minimalista">Minimalista - Simple y limpio</SelectItem>
                      <SelectItem value="creativo">Creativo - Innovador y dinámico</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <div className="flex items-center gap-2">
                    <Label>Colores de la presentación</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Personaliza los colores de tu presentación o usa los del tema seleccionado.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Color principal</Label>
                      <ColorPicker
                        value={formData.primaryColor}
                        onChange={(value: string) => handleInputChange("primaryColor", value)}
                      />
                    </div>
                    <div>
                      <Label>Color secundario</Label>
                      <ColorPicker
                        value={formData.secondaryColor}
                        onChange={(value: string) => handleInputChange("secondaryColor", value)}
                      />
                    </div>
                    <div>
                      <Label>Color del texto</Label>
                      <ColorPicker
                        value={formData.textColor}
                        onChange={(value: string) => handleInputChange("textColor", value)}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Nombre de la Presentación *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Un nombre descriptivo que identifique tu presentación.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Presentación sobre el Sistema Solar para Grado 5"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </motion.div>

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
                        <p>Al marcar esta opción, tu presentación será visible para otros profesores en la comunidad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <LoadingButton 
                  isLoading={loadingState === 'generating'}
                  loadingText="Generando diapositivas..."
                  disabled={loading || !formData.topic || !formData.course}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Diapositivas
                </LoadingButton>
              </motion.div>

              {/* Botón para mostrar previsualización en móvil */}
              {slides.length > 0 && (
                <div className="lg:hidden mt-4">
                  <Button
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full"
                  >
                    Ver Previsualización
                  </Button>
                </div>
              )}
            </motion.form>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal de previsualización para móvil */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Previsualización de Diapositivas</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {slides.length > 0 ? (
              <div className="space-y-4">
                {/* Botones de acción en el modal */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50"
                    onClick={handleAddSlide}
                  >
                    <span className="text-lg">+</span>
                    <span className="font-medium">Agregar diapositiva</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 border-purple-200 hover:border-purple-300"
                    onClick={generateImagesForAllSlides}
                    disabled={slides.some(slide => slide.isGeneratingImage)}
                    title="Generar imágenes automáticamente para todas las diapositivas"
                  >
                    <Wand2 className="w-5 h-5" />
                    <span className="font-medium">Generar imágenes para todas</span>
                  </Button>
                  <Button 
                    variant="default"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                    onClick={generatePresentation}
                    disabled={!slides.length}
                  >
                    <FileDown className="w-6 h-6" />
                    <span className="font-semibold">Descargar Presentación</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white relative"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                </div>

                {/* Contenido de las diapositivas */}
                <div className="space-y-6">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className="relative bg-white rounded-lg border-2 border-blue-500 shadow-sm p-4"
                      style={{ boxShadow: '0 0 0 2px #3b82f6' }}
                    >
                      {/* Número de diapositiva en la esquina superior izquierda */}
                      <div
                        className="absolute -top-3 -left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-4 border-white text-lg font-bold z-10"
                        style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.15)' }}
                        title={`Diapositiva ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      {/* Resto del contenido de la diapositiva */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-4">
                          <Input
                            value={slide.title}
                            onChange={(e) => {
                              const newTitle = e.target.value
                              setSlides(prev => prev.map((s, i) => 
                                i === index ? { ...s, title: newTitle } : s
                              ))
                            }}
                            className="text-lg font-semibold mb-2"
                            placeholder="Título de la diapositiva"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const fileType = file.type.toLowerCase();
                                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                                if (!validTypes.includes(fileType)) {
                                  toast.error("Por favor, sube una imagen en formato JPG, JPEG, PNG, GIF o WEBP");
                                  return;
                                }
                                handleImageUpload(index, file);
                              }
                            }}
                            className="hidden"
                            id={`image-upload-${index}`}
                          />
                          <label
                            htmlFor={`image-upload-${index}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer text-blue-700 transition-colors duration-200"
                          >
                            <ImageIcon className="w-5 h-5" />
                            <span className="font-medium">Subir imagen</span>
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 border-purple-200 hover:border-purple-300"
                            onClick={() => generateImageForSlide(index)}
                            disabled={slide.isGeneratingImage}
                            title="Generar imagen automáticamente basada en el contenido"
                          >
                            <Wand2 className={`w-5 h-5 ${slide.isGeneratingImage ? 'animate-spin' : ''}`} />
                            <span className="font-medium">
                              {slide.isGeneratingImage ? 'Generando...' : 'Generar imagen'}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteSlide(index)}
                          >
                            <span className="text-lg">×</span>
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <div className="mb-4">
                        <Label className="text-base font-medium text-gray-700 mb-2">Contenido</Label>
                        <Textarea
                          value={slide.content}
                          onChange={(e) => {
                            const newContent = e.target.value
                            setSlides(prev => prev.map((s, i) => 
                              i === index ? { ...s, content: newContent } : s
                            ))
                          }}
                          className="min-h-[200px]"
                          placeholder="Edita el contenido de la diapositiva aquí..."
                        />
                      </div>
                      {slide.imageUrl && (
                        <div className="mt-4 max-w-[300px]">
                          <img
                            src={slide.imageUrl}
                            alt={`Imagen para ${slide.title}`}
                            className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-md"
                            onError={() => {
                              toast.error("Error al cargar la imagen. Verifica que la URL sea correcta.")
                              handleImageUrlChange(index, '')
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay diapositivas generadas</p>
                <p className="text-center text-sm">
                  Completa el formulario para generar diapositivas automáticamente.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
      
      {/* Chat Improvement Modal */}
      <ChatImprovementModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          // Limpiar el estado del chat cuando se cierra el modal
          localStorage.removeItem('slidesChatState')
        }}
        currentContent={getCurrentContent()}
        onContentUpdate={handleContentUpdate}
        title="Asistente de Mejora de Diapositivas"
        description="Solicita mejoras específicas para tus diapositivas. El asistente te ayudará a optimizar el contenido y estructura."
        suggestions={[
          "Haz el contenido más claro y conciso",
          "Añade más ejemplos prácticos",
          "Mejora la estructura de las diapositivas",
          "Incluye más información visual",
          "Añade transiciones entre temas",
          "Incluye preguntas de reflexión"
        ]}
        localStorageKey="slidesChatState"
        isSlidesMode={true}
      />
    </Layout>
    </>
  )
} 