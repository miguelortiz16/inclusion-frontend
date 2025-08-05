"use client"

import { CustomToolConfig } from "@/types/custom-tool"
import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface CustomToolRendererProps {
  tool: CustomToolConfig
}

export function CustomToolRenderer({ tool }: CustomToolRendererProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [response, setResponse] = useState<string>("")

  const handleSubmit = async () => {
    if (!tool) return;
    
    setIsGenerating(true)
    const email = localStorage.getItem('email')
    
    try {
      // Construir el prompt basado en los campos
      const prompt = tool.fields.map(field => 
        `${field.label}: ${formValues[field.id] || ""}`
      ).join('\n')

      const request = {
        name: tool.name,
        topic: "descripcion de la tarea:" + tool.description + ".\n " + prompt,
        email: email
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Error al generar la respuesta')
      }

      const data = await response.text()
      setResponse(data)
      toast.success("Respuesta generada exitosamente")

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar la respuesta")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  return (
    <div className="space-y-6">
      {tool.fields.map((field) => {
        if (field.hidden) return null

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === "text" && (
              <Input
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === "textarea" && (
              <Textarea
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === "number" && (
              <Input
                type="number"
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === "select" && (
              <Combobox
                options={field.options || []}
                value={formValues[field.id] || ""}
                onChange={(value) => handleInputChange(field.id, value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === "checkbox" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formValues[field.id] || false}
                  onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                  required={field.required}
                />
                <Label className="text-sm font-normal">
                  {field.placeholder}
                </Label>
              </div>
            )}

            {field.type === "date" && (
              <Input
                type="date"
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        )
      })}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isGenerating ? "Generando..." : "Generar"}
        </Button>
      </div>

      {response && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Respuesta:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  )
} 