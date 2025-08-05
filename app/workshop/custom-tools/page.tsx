"use client"

import { Layout } from "@/components/layout"
import { CustomToolBuilder } from "@/components/custom-tool-builder"
import { CustomToolConfig } from "@/types/custom-tool"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CustomToolInstance } from "@/types/custom-tool-instance"

export default function CustomToolsPage() {
  const [previewTool, setPreviewTool] = useState<CustomToolConfig | null>(null)
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({})
  const [tools, setTools] = useState<CustomToolConfig[]>([])
  const [instances, setInstances] = useState<CustomToolInstance[]>([])
  const [selectedTool, setSelectedTool] = useState<CustomToolConfig | null>(null)
  const [activeTab, setActiveTab] = useState<"builder" | "tools" | "instances">("builder")

  useEffect(() => {
    console.log("CustomToolsPage mounted")
  }, [])

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const   email=localStorage.getItem("email")
        const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools?email='+email) // TODO: Replace with actual user email
        if (!response.ok) {
          throw new Error('Error al cargar las herramientas')
        }
        const data = await response.json()
        setTools(data)
      } catch (error) {
        console.error('Error fetching tools:', error)
        toast.error('Error al cargar las herramientas')
      }
    }

    fetchTools()
  }, [])

  const handleSaveTool = async (tool: CustomToolConfig) => {
    try {
      const email = localStorage.getItem("email")
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tool,
          email: email
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar la herramienta')
      }

      const savedTool = await response.json()
      setTools(prev => [...prev, savedTool])
      toast.success('Herramienta guardada exitosamente')
    } catch (error) {
      console.error('Error saving tool:', error)
      toast.error('Error al guardar la herramienta')
    }
  }

  const handleDeactivateTool = async (id: string) => {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools/${id}/deactivate`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('Error al desactivar la herramienta')
      }

      setTools(prev => prev.filter(tool => tool.id !== id))
      toast.success('Herramienta desactivada exitosamente')
    } catch (error) {
      console.error('Error deactivating tool:', error)
      toast.error('Error al desactivar la herramienta')
    }
  }

  const handlePreviewUpdate = (tool: CustomToolConfig) => {
    setPreviewTool(tool)
    // Inicializar valores para la previsualización
    const initialValues: Record<string, any> = {}
    tool.fields.forEach(field => {
      if (!initialValues[field.id]) {
        initialValues[field.id] = field.defaultValue || ""
      }
    })
    setPreviewValues(initialValues)
  }

  const handlePreviewChange = (fieldId: string, value: any) => {
    setPreviewValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        {/* Panel izquierdo - Constructor */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 overflow-y-auto p-8 border-r bg-white/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-800">Constructor de Herramientas</h1>
            <p className="text-gray-600 mt-3 text-lg">
              Crea y personaliza tus propias herramientas educativas
            </p>
          </motion.div>

          <CustomToolBuilder
            onSave={handleSaveTool}
            onPreviewUpdate={handlePreviewUpdate}
          />
        </motion.div>

        {/* Panel derecho - Previsualización */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-[450px] p-8 overflow-y-auto bg-white/90 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl border shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold mb-8 text-gray-800">Previsualización</h2>
            
            {previewTool ? (
              <div className="space-y-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-4 text-lg">Información General</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-600">Nombre</Label>
                      <p className="text-gray-900 mt-1 text-lg font-medium">{previewTool.name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-gray-600">Descripción</Label>
                      <p className="text-gray-900 mt-1 text-lg">{previewTool.description}</p>
                    </div>
                    
                    <div>
                      <Label className="text-gray-600">Categoría</Label>
                      <p className="text-gray-900 mt-1 text-lg capitalize">{previewTool.category}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-6 text-lg">Campos</h3>
                  <div className="space-y-6">
                    {previewTool.fields.map((field) => {
                      if (field.hidden) return null

                      return (
                        <div key={field.id} className="space-y-2">
                          <Label className="text-gray-600">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          
                          {field.type === "text" && (
                            <Input
                              value={previewValues[field.id] || ""}
                              onChange={(e) => handlePreviewChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}

                          {field.type === "textarea" && (
                            <Textarea
                              value={previewValues[field.id] || ""}
                              onChange={(e) => handlePreviewChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}

                          {field.type === "number" && (
                            <Input
                              type="number"
                              value={previewValues[field.id] || ""}
                              onChange={(e) => handlePreviewChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}

                          {field.type === "select" && (
                            <Combobox
                              options={field.options || []}
                              value={previewValues[field.id] || ""}
                              onChange={(value) => handlePreviewChange(field.id, value)}
                              placeholder={field.placeholder}
                              required={field.required}
                            />
                          )}

                          {field.type === "checkbox" && (
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={previewValues[field.id] || false}
                                onCheckedChange={(checked) => handlePreviewChange(field.id, checked)}
                                required={field.required}
                                className="border-gray-300 data-[state=checked]:bg-blue-500"
                              />
                              <Label className="text-gray-600">
                                {field.placeholder}
                              </Label>
                            </div>
                          )}

                          {field.type === "date" && (
                            <Input
                              type="date"
                              value={previewValues[field.id] || ""}
                              onChange={(e) => handlePreviewChange(field.id, e.target.value)}
                              required={field.required}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <p className="text-lg mb-2">No hay herramienta para previsualizar</p>
                  <p className="text-sm">
                    Crea una herramienta para ver su previsualización aquí
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  )
} 