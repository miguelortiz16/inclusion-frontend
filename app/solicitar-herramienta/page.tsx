"use client"

import type React from "react"
import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function SolicitarHerramienta() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertType, setAlertType] = useState<"success" | "error">("success")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/herramientas/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: name,
          correoElectronico: email,
          descripcionSolicitud: description
        })
      })

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud')
      }

      setAlertMessage('¡Gracias por tu solicitud!')
      setAlertType('success')
      setShowAlert(true)
      
      setTimeout(() => {
        router.push('/workshop')
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      setAlertMessage('Error al enviar la solicitud')
      setAlertType('error')
      setShowAlert(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        {showAlert && (
          <Alert className={`mb-4 ${alertType === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <AlertTitle>{alertType === 'success' ? 'Éxito' : 'Error'}</AlertTitle>
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        )}
        <div className="mb-8">
          <Link href="/workshop" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Taller
          </Link>
          <h1 className="text-3xl font-display font-bold gradient-text mb-4">Solicitar una Nueva Herramienta IA</h1>
          <p className="text-gray-600 max-w-3xl">
            ¿Tienes una gran idea para una nueva herramienta que debería ser añadida a ProfePlanner? Podemos crear casi
            cualquier cosa, sin importar cuán compleja sea. Cuanto más específica sea tu solicitud, más rápido podremos
            implementar tu idea.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/10 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-blue-600">*</span>
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico <span className="text-blue-600">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Por favor explica en detalle cómo debería funcionar la nueva herramienta IA{" "}
                <span className="text-blue-600">*</span>
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                placeholder="EJEMPLO: La herramienta debería generar una lista de 10 palabras de vocabulario basadas en un tema, palabra o asignatura que sea declarada por el profesor. La herramienta también debería definir cada palabra y luego usar esa palabra en dos ejemplos de oraciones diferentes para ayudar a proporcionar contexto."
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white"
              />
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-600 mb-4">
                <Sparkles className="w-4 h-4 inline-block mr-1 text-blue-600" />
                Si decidimos añadir tu herramienta, ¡recibirás beneficios especiales!
              </p>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-white px-8 py-2.5 rounded-lg shadow-sm"
              >
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

