"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { MaterialsGrid } from "@/components/materials-grid"
import { WorkshopPreview } from "@/components/workshop-preview"
import { Loader2 } from "lucide-react"

interface Resource {
  id: string
  name: string
  tipoTaller: string
  prompt: string
  response: string
  timestamp: string
  email: string
  activate: boolean
}

export default function Materiales() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tipoTaller: 'all',
    searchQuery: ''
  })
  const [selectedWorkshop, setSelectedWorkshop] = useState<Resource | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/peticiones')
        const data = await response.json()
        setResources(data)
      } catch (error) {
        console.error('Error fetching resources:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  const filteredResources = resources.filter(resource => {
    const excludedTypes = [
      'diapositivas-automaticas',
      'crucigrama',
      'mapa-mental-flow',
      'ruleta-preguntas',
      'generar-informe-estudiantil',
      'generar-correo-escolar',
      'generar-correo-para-padres',
      "ia-libre",
      "ruleta-con-preguntas"
    ]
    
    if (excludedTypes.includes(resource.tipoTaller)) return false
    
    if (filters.tipoTaller !== 'all' && resource.tipoTaller !== filters.tipoTaller) return false
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      return resource.name.toLowerCase().includes(searchLower)
    }
    return true
  })

  const uniqueTipoTaller = [...new Set(resources
    .filter(resource => ![
      'diapositivas-automaticas',
      'crucigrama',
      'mapa-mental-flow',
      'ruleta-preguntas',
      'generar-informe-estudiantil',
      'generar-correo-escolar',
      'generar-correo-para-padres',
      "ia-libre",
      "ruleta-con-preguntas"
    ].includes(resource.tipoTaller))
    .map(r => r.tipoTaller)
  )]

  const handleViewWorkshop = (resource: Resource) => {
    setSelectedWorkshop(resource)
    setIsPreviewOpen(true)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-b from-[#F4F7FB] via-white to-[#F4F7FB]"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-7xl mx-auto mt-6 sm:mt-12 px-4 sm:px-6"
      >
        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900">
            Materiales
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl text-center">
            Recursos compartidos por profesores para profesores
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
          <div className="relative w-full max-w-[300px] sm:max-w-[400px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="Buscar materiales..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="pl-9 sm:pl-10 w-full h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-xl shadow-sm"
            />
          </div>
          <Select
            value={filters.tipoTaller}
            onValueChange={(value) => setFilters({ ...filters, tipoTaller: value })}
          >
            <SelectTrigger className="w-full max-w-[300px] sm:max-w-[400px] h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-xl shadow-sm">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {uniqueTipoTaller.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-12 sm:py-16">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 animate-spin" />
            <p className="text-sm sm:text-base md:text-lg text-gray-600">Cargando materiales...</p>
          </div>
        ) : (
          <MaterialsGrid 
            resources={filteredResources}
            onViewResource={handleViewWorkshop}
          />
        )}
      </motion.div>

      {selectedWorkshop && (
        <WorkshopPreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setSelectedWorkshop(null)
          }}
          workshop={selectedWorkshop}
          onUpdate={() => {
            // Aquí podríamos actualizar los recursos si es necesario
          }}
        />
      )}
    </motion.div>
  )
} 