"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { makeRequest } from "@/config/api"
import { useRouter } from "next/navigation"
import { getEmailFromStorage } from "@/utils/email"

export default function QuizCreator() {
  const router = useRouter()
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Verificar que el email existe antes de hacer la petición
      const email = getEmailFromStorage()
      console.log('Email del usuario:', email)

      const response = await makeRequest('createQuiz', topic)
      console.log('Respuesta del servidor:', response)

      // Guardar los datos en localStorage para la vista
      localStorage.setItem('quizData', JSON.stringify(response))
      
      // Redirigir a la vista
      router.push('/quiz-creator/view')
    } catch (err) {
      console.error('Error al crear el cuestionario:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el cuestionario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold mb-6">Creador de Cuestionarios</h1>
        
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Tema del Cuestionario
            </label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: La fotosíntesis, El sistema solar, etc."
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creando Cuestionario...' : 'Crear Cuestionario'}
          </Button>
        </form>
      </div>
    </Layout>
  )
} 