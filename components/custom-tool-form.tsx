import { CustomToolConfig } from "@/types/custom-tool"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CustomToolFormProps {
  tool: CustomToolConfig
  onResponse: (response: string) => void
}

export function CustomToolForm({ tool, onResponse }: CustomToolFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async () => {
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
      onResponse(data)
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
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === "text" && (
              <input
                type="text"
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            )}

            {field.type === "select" && (
              <select
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{field.placeholder}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "checkbox" && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formValues[field.id] || false}
                  onChange={(e) => handleInputChange(field.id, e.target.checked)}
                  required={field.required}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">
                  {field.placeholder}
                </label>
              </div>
            )}

            {field.type === "date" && (
              <input
                type="date"
                value={formValues[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
    </div>
  )
} 