"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { testAllRequests } from "@/utils/test-requests"

export default function TestRequestsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const handleTestRequests = async () => {
    setLoading(true)
    setResults([])
    
    try {
      await testAllRequests()
      setResults(['Pruebas completadas. Revisa la consola para ver los resultados.'])
    } catch (error) {
      setResults(['Error al ejecutar las pruebas:', error instanceof Error ? error.message : 'Error desconocido'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold mb-6">Validación de Peticiones</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Esta página probará todas las peticiones para validar que el email se envíe correctamente.
            Abre la consola del navegador (F12) para ver los resultados detallados.
          </p>
          
          <Button 
            onClick={handleTestRequests}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Ejecutando pruebas...' : 'Ejecutar pruebas'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Resultados:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {results.map((result, index) => (
                <p key={index} className="text-gray-700">{result}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 