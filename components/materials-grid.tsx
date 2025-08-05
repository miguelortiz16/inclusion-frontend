"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

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

interface MaterialsGridProps {
  resources: Resource[]
  onViewWorkshop: (resource: Resource) => void
}

export function MaterialsGrid({ resources, onViewWorkshop }: MaterialsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource, index) => (
        <motion.div
          key={resource.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {resource.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Tipo: {resource.tipoTaller}
                </p>
                <p className="text-sm text-gray-500">
                  Creado: {new Date(resource.timestamp).toLocaleDateString()}
                </p>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => onViewWorkshop(resource)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
} 