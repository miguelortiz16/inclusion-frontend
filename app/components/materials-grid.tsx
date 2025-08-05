import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  onViewResource: (resource: Resource) => void
}

export function MaterialsGrid({ resources, onViewResource }: MaterialsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 justify-items-center">
      {resources.map((resource) => (
        <motion.div
          key={resource.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-full max-w-[280px] sm:max-w-sm"
        >
          <Card className="h-full flex flex-col border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg overflow-hidden bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {resource.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5">
                    {resource.tipoTaller}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium uppercase">
                    {resource.email.charAt(0)}
                  </span>
                  <span className="text-gray-600">{resource.email}</span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full text-sm px-4 py-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-md transition-all duration-300"
                onClick={() => onViewResource(resource)}
              >
                Ver material
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
} 