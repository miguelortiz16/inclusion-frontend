"use client"

import { useEffect, useState } from "react"

interface Tool {
  title: string
  description: string
}

const tools: Tool[] = [
  {
    title: "Creador de Cuestionarios",
    description: "Crea un cuestionario en minutos con la ayuda de ProfePlanner. Esta herramienta es excelente para crear evaluaciones formativas."
  },
  {
    title: "Planificador de Lecciones",
    description: "Ahorra tiempo y energía creando un plan de lección detallado con la ayuda de ProfePlanner. Nunca más te quedes mirando un papel en blanco."
  },
  {
    title: "Ideas de Material Educativo",
    description: "Crea un material detallado y estructurado para prepararte a ti mismo o a tus estudiantes para una lección."
  },
  {
    title: "Generador de Ideas",
    description: "Genera una lista de ideas para una lección, proyecto o cualquier otra cosa que puedas imaginar. ¡Esta herramienta es excelente para actividades de lluvia de ideas!"
  },
  {
    title: "Generador de Diapositivas",
    description: "Crea presentaciones profesionales con contenido generado automáticamente, personalización de colores y soporte para imágenes."
  },
  {
    title: "Sopa de Letras",
    description: "Crea sopas de letras interactivas y educativas para tus estudiantes."
  },
  {
    title: "IA Libre",
    description: "Dile a ProfePlanner qué hacer, sin restricciones, formato o barreras."
  },
  {
    title: "Logros del Mundo Real",
    description: "Genera una lista de logros del mundo real para un tema. Esta herramienta es excelente para ayudar a los estudiantes a entender la importancia de un tema."
  },
  {
    title: "Generador de Proyectos",
    description: "Genera un proyecto para cualquier unidad o tema. Esta herramienta es perfecta para crear proyectos divertidos, atractivos y educativos para los estudiantes."
  },
  {
    title: "Informes de Estudiantes",
    description: "Genera un informe para un estudiante. Esta herramienta es excelente para ayudar a los estudiantes a entender sus fortalezas y debilidades."
  }
]

export function TypingEffect() {
  const [currentToolIndex, setCurrentToolIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(30)
  const [showInitialText, setShowInitialText] = useState(true)

  useEffect(() => {
    if (showInitialText) {
      const initialText = "La magia de la IA para ayudar a las escuelas con"
      if (!isDeleting && displayedText === initialText) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false)
        setShowInitialText(false)
      } else {
        const timeout = setTimeout(() => {
          if (isDeleting) {
            setDisplayedText(initialText.substring(0, displayedText.length - 1))
            setTypingSpeed(15)
          } else {
            setDisplayedText(initialText.substring(0, displayedText.length + 1))
            setTypingSpeed(30)
          }
        }, typingSpeed)
        return () => clearTimeout(timeout)
      }
    } else {
      const currentTool = tools[currentToolIndex]
      const targetText = currentTool.title

      if (!isDeleting && displayedText === targetText) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false)
        setCurrentToolIndex((prev) => (prev + 1) % tools.length)
      } else {
        const timeout = setTimeout(() => {
          if (isDeleting) {
            setDisplayedText(targetText.substring(0, displayedText.length - 1))
            setTypingSpeed(15)
          } else {
            setDisplayedText(targetText.substring(0, displayedText.length + 1))
            setTypingSpeed(30)
          }
        }, typingSpeed)
        return () => clearTimeout(timeout)
      }
    }
  }, [displayedText, isDeleting, currentToolIndex, showInitialText])

  return (
    <div className="min-h-[50px] p-4">
      <pre className="text-2xl font-display font-bold whitespace-pre-wrap">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          {displayedText}
        </span>
        <span className="animate-pulse text-blue-600">|</span>
      </pre>
    </div>
  )
} 