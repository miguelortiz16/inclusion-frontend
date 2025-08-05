"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RiUserSettingsLine, RiFileDownloadLine, RiShareLine } from "react-icons/ri"
import { motion } from "framer-motion"

interface AjusteRazonable {
  area: string
  barreras_identificadas: string[]
  tipo_ajuste: string[]
  apoyo_requerido: string[]
  descripcion_ajustes_apoyos: string[]
  seguimiento: string
  informe_piar: {
    fase: string
    fecha_inicio: string
    descripcion_intervencion: string
    objetivo_intervencion: string
    acciones_realizadas: string[]
    responsables: string[]
    evaluacion_periodica: string
  }
}

export default function AjustesRazonablesView({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ajustes, setAjustes] = useState<AjusteRazonable[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAjustes = async () => {
      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/ajustes-razonables/${params.id}`)
        if (!response.ok) {
          throw new Error('Error al cargar los ajustes razonables')
        }
        const data = await response.json()
        setAjustes(data.ajustes_razonables)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al cargar los ajustes razonables')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAjustes()
  }, [params.id])

  const handleDownload = () => {
    // Implement PDF generation and download
    toast.info('Descarga de PDF en desarrollo')
  }

  const handleShare = () => {
    // Implement sharing functionality
    toast.info('Compartir en desarrollo')
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <RiUserSettingsLine className="w-8 h-8 text-indigo-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ajustes Razonables</h1>
              <p className="text-gray-600">Ajustes personalizados para el estudiante</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <RiFileDownloadLine className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <RiShareLine className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {ajustes.map((ajuste, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Área: {ajuste.area}</h2>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Barreras Identificadas</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {ajuste.barreras_identificadas.map((barrera, i) => (
                    <li key={i}>{barrera}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Tipo de Ajuste</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {ajuste.tipo_ajuste.map((ajuste, i) => (
                    <li key={i}>{ajuste}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Apoyo Requerido</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {ajuste.apoyo_requerido.map((apoyo, i) => (
                    <li key={i}>{apoyo}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Descripción de Ajustes y Apoyos</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {ajuste.descripcion_ajustes_apoyos.map((descripcion, i) => (
                    <li key={i}>{descripcion}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Seguimiento</h3>
                <p className="text-gray-600">{ajuste.seguimiento}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Informe PIAR</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Fase</h4>
                    <p className="text-gray-600">{ajuste.informe_piar.fase}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Fecha de Inicio</h4>
                    <p className="text-gray-600">{ajuste.informe_piar.fecha_inicio}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Descripción de la Intervención</h4>
                    <p className="text-gray-600">{ajuste.informe_piar.descripcion_intervencion}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Objetivo de la Intervención</h4>
                    <p className="text-gray-600">{ajuste.informe_piar.objetivo_intervencion}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Acciones Realizadas</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {ajuste.informe_piar.acciones_realizadas.map((accion, i) => (
                        <li key={i}>{accion}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Responsables</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {ajuste.informe_piar.responsables.map((responsable, i) => (
                        <li key={i}>{responsable}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Evaluación Periódica</h4>
                    <p className="text-gray-600">{ajuste.informe_piar.evaluacion_periodica}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
} 