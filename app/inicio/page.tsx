"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, LogOut, BookOpen, Lightbulb, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { toast } from "sonner"
import { deleteCookie } from "cookies-next"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WorkshopPreview } from "@/components/workshop-preview"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useTranslations } from "@/utils/useTranslations"

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

export default function Inicio() {
  const router = useRouter()
  const t = useTranslations()
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
    // Filtro de tipos de taller a excluir
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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('email')
      deleteCookie('auth')
      toast.success('Sesión cerrada correctamente')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    }
  }

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
        className="w-full max-w-7xl mx-auto sm:ml-12 md:ml-16 lg:ml-20 mt-6 sm:mt-12 px-4 sm:px-6"
      >
        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent text-center">
              {t('community.inicio.title')}
            </h2>
            <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-3 sm:gap-4 mt-2 sm:mt-4">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl text-center px-2 sm:px-4 leading-relaxed">
              <span className="text-blue-600 font-medium">{t('community.inicio.discover')}</span> {t('community.inicio.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 text-xs sm:text-sm text-gray-500">
              <Link href="/materiales" className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span>{t('community.inicio.materials')}</span>
              </Link>
              <span className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg border border-blue-100">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span>{t('community.inicio.ideas')}</span>
              </span>
              <span className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg border border-blue-100">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span>{t('community.inicio.inspiration')}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
          <div className="relative w-full max-w-[300px] sm:max-w-[400px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder={t('community.inicio.searchPlaceholder')}
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
              <SelectValue placeholder={t('community.inicio.filterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('community.inicio.allTypes')}</SelectItem>
              {uniqueTipoTaller.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {t(`community.inicio.types.${tipo}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-12 sm:py-16">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 animate-spin" />
            <p className="text-sm sm:text-base md:text-lg text-gray-600">{t('community.inicio.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 justify-items-center">
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-full max-w-[280px] sm:max-w-sm"
              >
                <Card className="h-full flex flex-col border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg overflow-hidden bg-white">
                  <CardHeader className="p-4 bg-white border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium text-gray-800 truncate">
                          {resource.name}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {t(`community.inicio.types.${resource.tipoTaller}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow p-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>{resource.email}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full text-xs px-4 h-8 bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-sm rounded-md transition-all duration-300"
                        onClick={() => handleViewWorkshop(resource)}
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-2" />
                        {t('community.inicio.viewResource')}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
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