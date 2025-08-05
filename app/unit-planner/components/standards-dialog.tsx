"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sparkles, Search, Globe, ExternalLink } from "lucide-react"
import { useState, useMemo } from "react"

interface StandardsData {
  [key: string]: {
    estandares: string[];
    referencia: string;
  };
}

const standardsData: StandardsData = {
  "México": {
    "estandares": [
      "Nueva Escuela Mexicana (NEM)"
    ],
    "referencia": "https://dgespe.sep.gob.mx"
  },
  "Colombia": {
    "estandares": [
      "Estándares Básicos de Competencias",
      "Derechos Básicos de Aprendizaje (DBA)"
    ],
    "referencia": "https://www.mineducacion.gov.co"
  },
  "Chile": {
    "estandares": [
      "Bases Curriculares y Objetivos de Aprendizaje"
    ],
    "referencia": "https://www.curriculumnacional.cl"
  },
  "Argentina": {
    "estandares": [
      "NAP (Núcleos de Aprendizajes Prioritarios)"
    ],
    "referencia": "https://www.argentina.gob.ar/educacion"
  },
  "Perú": {
    "estandares": [
      "Currículo Nacional de Educación Básica (CNEB)"
    ],
    "referencia": "https://www.minedu.gob.pe"
  },
  "Ecuador": {
    "estandares": [
      "Destrezas con Criterio de Desempeño"
    ],
    "referencia": "https://educacion.gob.ec/curriculo/"
  },
  "Brasil": {
    "estandares": [
      "BNCC (Base Nacional Comum Curricular)"
    ],
    "referencia": "http://basenacionalcomum.mec.gov.br"
  },
  "Bolivia": {
    "estandares": [
      "Currículo Base del Estado Plurinacional"
    ],
    "referencia": "https://www.minedu.gob.bo"
  },
  "Costa Rica": {
    "estandares": [
      "Programas de Estudio del MEP"
    ],
    "referencia": "https://www.mep.go.cr"
  },
  "Cuba": {
    "estandares": [
      "Planes y Programas de Estudio del MINED"
    ],
    "referencia": "https://www.mes.gob.cu"
  },
  "República Dominicana": {
    "estandares": [
      "Competencias Fundamentales y Específicas"
    ],
    "referencia": "https://www.minerd.gob.do"
  },
  "El Salvador": {
    "estandares": [
      "Estándares Educativos Nacionales"
    ],
    "referencia": "https://www.mined.gob.sv"
  },
  "Guatemala": {
    "estandares": [
      "CNB (Currículo Nacional Base)"
    ],
    "referencia": "https://www.mineduc.gob.gt/cnb/"
  },
  "Honduras": {
    "estandares": [
      "Currículo Nacional por Competencias"
    ],
    "referencia": "https://www.se.gob.hn"
  },
  "Nicaragua": {
    "estandares": [
      "Currículo Nacional Básico"
    ],
    "referencia": "https://www.mined.gob.ni"
  },
  "Panamá": {
    "estandares": [
      "Planes y Programas del MEDUCA"
    ],
    "referencia": "https://www.meduca.gob.pa"
  },
  "Paraguay": {
    "estandares": [
      "Diseño Curricular Nacional"
    ],
    "referencia": "https://www.mec.gov.py"
  },
  "Uruguay": {
    "estandares": [
      "Marco Curricular Nacional (MCN)"
    ],
    "referencia": "https://www.anep.edu.uy"
  },
  "Venezuela": {
    "estandares": [
      "Currículo Nacional Bolivariano"
    ],
    "referencia": "http://www.me.gob.ve"
  },
  "España": {
    "estandares": [
      "LOMLOE - Competencias clave, saberes básicos y criterios de evaluación"
    ],
    "referencia": "https://www.educacionyfp.gob.es"
  },
  "Estados Unidos": {
    "estandares": [
      "Common Core State Standards (CCSS)",
      "Next Generation Science Standards (NGSS)"
    ],
    "referencia": "https://www.corestandards.org"
  }
}

export function StandardsDialog({ onSelectStandard }: { onSelectStandard: (standard: string) => void }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filtra países y estándares según el buscador
  const filteredStandards = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return Object.entries(standardsData).filter(([country, data]) =>
      country.toLowerCase().includes(searchLower) ||
      data.estandares.some(est => est.toLowerCase().includes(searchLower))
    )
  }, [searchQuery])

  const handleStandardSelect = (country: string, standard: string) => {
    const formatted = `[${country}] ${standard}`
    onSelectStandard(formatted)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <Sparkles className="w-4 h-4 mr-1" />
          Ver ejemplos de estándares
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-3xl max-h-[90vh] p-0 flex flex-col">
        {/* Header fijo */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 border-b sticky top-0 z-20">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              Estándares Educativos por País
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-blue-700">
              Selecciona un estándar educativo para agregarlo a tus objetivos de aprendizaje
            </DialogDescription>
          </DialogHeader>
        </div>
        {/* Buscador fijo */}
        <div className="p-4 border-b bg-white sticky top-[72px] z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Buscar por país o estándar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        {/* Scrollable standards area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          <div className="space-y-6">
            {filteredStandards.length === 0 && (
              <p className="text-gray-500 text-sm">No se encontraron estándares.</p>
            )}
            {filteredStandards.map(([country, data]) => (
              <div key={country} className="space-y-2">
                <h3 className="font-semibold text-base sm:text-lg text-blue-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {country}
                </h3>
                <div className="space-y-2">
                  {data.estandares.map((standard) => (
                    <Button
                      key={standard}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-blue-50 border-gray-200 hover:border-blue-200 transition-colors duration-200"
                      onClick={() => handleStandardSelect(country, standard)}
                    >
                      <div className="space-y-1">
                        <span className="font-medium text-sm sm:text-base text-gray-900">{standard}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <ExternalLink className="w-3 h-3" />
                          <a 
                            href={data.referencia} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver referencia oficial
                          </a>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 