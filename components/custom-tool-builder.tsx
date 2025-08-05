"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomToolConfig, CustomField } from "@/types/custom-tool"
import { Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface CustomToolBuilderProps {
  onSave: (tool: CustomToolConfig) => void
  onPreviewUpdate: (tool: CustomToolConfig) => void
}

export function CustomToolBuilder({ onSave, onPreviewUpdate }: CustomToolBuilderProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CustomToolConfig["category"]>("planning")
  const [fields, setFields] = useState<CustomField[]>([])
  const [newOption, setNewOption] = useState("")
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fieldTypeDescriptions = {
    text: {
      label: "Texto corto",
      description: "Para respuestas breves como títulos, nombres o palabras clave"
    },
    textarea: {
      label: "Texto largo",
      description: "Para descripciones, explicaciones o párrafos completos"
    },
    number: {
      label: "Número",
      description: "Para calificaciones, edades, cantidades o valores numéricos"
    },
    select: {
      label: "Lista de opciones",
      description: "Para seleccionar una opción de una lista predefinida (ej: niveles, grados, materias)"
    },
    checkbox: {
      label: "Casilla de verificación",
      description: "Para marcar opciones como sí/no o verdadero/falso"
    },
    date: {
      label: "Fecha",
      description: "Para seleccionar fechas de entrega, exámenes o eventos"
    }
  }

  const validateField = (field: CustomField): string | null => {
    if (!field.label.trim()) return "La etiqueta es requerida"
    if (!field.placeholder?.trim()) return "El placeholder es requerido"
    if (field.type === "select" && (!field.options || field.options.length === 0)) {
      return "Debes agregar al menos una opción"
    }
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!description.trim()) {
      newErrors.description = "La descripción es requerida"
    }

    if (fields.length === 0) {
      newErrors.fields = "Debes agregar al menos un campo"
    } else {
      fields.forEach((field, index) => {
        const error = validateField(field)
        if (error) {
          newErrors[`field-${field.id}`] = error
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddField = () => {
    const newField: CustomField = {
      id: uuidv4(),
      type: "text",
      label: "",
      required: true,
      placeholder: "",
      defaultValue: "",
      hidden: false,
      options: []
    }
    setFields([...fields, newField])
    setEditingFieldId(newField.id)
  }

  const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ))
    // Limpiar error al actualizar el campo
    if (errors[`field-${id}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`field-${id}`]
        return newErrors
      })
    }
  }

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(field => field.id !== id))
  }

  const handleAddOption = (fieldId: string) => {
    if (!newOption.trim()) {
      setErrors(prev => ({
        ...prev,
        [`option-${fieldId}`]: "La opción no puede estar vacía"
      }))
      return
    }

    const field = fields.find(f => f.id === fieldId)
    if (!field) return

    const optionValue = newOption.toLowerCase().replace(/\s+/g, '_')
    const newOptions = [
      ...(field.options || []),
      { value: optionValue, label: newOption }
    ]

    handleUpdateField(fieldId, { options: newOptions })
    setNewOption("")
    // Limpiar error de opciones
    if (errors[`option-${fieldId}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`option-${fieldId}`]
        return newErrors
      })
    }
  }

  const handleRemoveOption = (fieldId: string, optionValue: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return

    const newOptions = (field.options || []).filter(opt => opt.value !== optionValue)
    handleUpdateField(fieldId, { options: newOptions })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (!description.trim()) {
      toast.error('La descripción es requerida')
      return
    }

    if (fields.length === 0) {
      toast.error('Debes agregar al menos un campo')
      return
    }

    const tool: CustomToolConfig = {
      id: uuidv4(),
      name,
      description,
      category,
      fields,
      userId: 'current-user-id', // TODO: Replace with actual user ID
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/custom-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tool),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error al guardar la herramienta: ${response.status} ${response.statusText}`)
      }

      let savedTool
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        savedTool = await response.json()
      } else {
        const text = await response.text()
        console.warn('Non-JSON response:', text)
        savedTool = tool // Use the original tool if response is not JSON
      }

      onSave(savedTool)
      toast.success('Herramienta guardada exitosamente')
      router.push('/workshop') // Redirect to workshop page
    } catch (error) {
      console.error('Error saving tool:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar la herramienta')
    }
  }

  useEffect(() => {
    if (fields.length > 0) {
      const previewTool: CustomToolConfig = {
        id: "preview",
        name: name || "Nombre de la herramienta",
        description: description || "Descripción de la herramienta",
        category,
        fields,
        userId: "preview",
        createdAt: new Date(),
        updatedAt: new Date()
      }
      onPreviewUpdate(previewTool)
    }
  }, [name, description, category, fields])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Nombre de la herramienta *</Label>
          <p className="text-sm text-gray-500 mb-2">
            Un nombre claro que describa para qué sirve esta herramienta
          </p>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors.name
                  return newErrors
                })
              }
            }}
            placeholder="Ej: Generador de ejercicios de matemáticas"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label>Descripción *</Label>
          <p className="text-sm text-gray-500 mb-2">
            Explica cómo usar esta herramienta y qué tipo de contenido generará
          </p>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              if (errors.description) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors.description
                  return newErrors
                })
              }
            }}
            placeholder="Ej: Esta herramienta genera ejercicios de matemáticas personalizados para estudiantes de primaria, incluyendo problemas de suma, resta y multiplicación."
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>

        <div>
          <Label>Categoría *</Label>
          <p className="text-sm text-gray-500 mb-2">
            Selecciona el tipo de herramienta que estás creando
          </p>
          <Select value={category} onValueChange={(value: CustomToolConfig["category"]) => setCategory(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planificación de clases</SelectItem>
              <SelectItem value="assessment">Evaluación y exámenes</SelectItem>
              <SelectItem value="content">Contenido educativo</SelectItem>
              <SelectItem value="communication">Comunicación con estudiantes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Campos de la herramienta *</h3>
            <p className="text-sm text-gray-500">
              Define qué información necesitas para generar el contenido
            </p>
          </div>
          <Button onClick={handleAddField} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Campo
          </Button>
        </div>
        {errors.fields && <p className="text-sm text-red-500">{errors.fields}</p>}

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-4 flex-1">
                  <div>
                    <Label>Etiqueta del campo *</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Cómo se llamará este campo en la herramienta
                    </p>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                      placeholder="Ej: Nivel de dificultad"
                      className={errors[`field-${field.id}`] ? "border-red-500" : ""}
                    />
                    {errors[`field-${field.id}`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`field-${field.id}`]}</p>
                    )}
                  </div>

                  <div>
                    <Label>Tipo de campo *</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Qué tipo de información se ingresará en este campo
                    </p>
                    <Select
                      value={field.type}
                      onValueChange={(value: CustomField["type"]) => handleUpdateField(field.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(fieldTypeDescriptions).map(([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <div className="font-medium">{label}</div>
                              <div className="text-xs text-gray-500">{description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {field.type === "select" && (
                    <div className="space-y-2">
                      <Label>Opciones de la lista *</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Agrega las opciones que podrán seleccionar los usuarios
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Ej: Básico, Intermedio, Avanzado"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddOption(field.id)
                            }
                          }}
                          className={errors[`option-${field.id}`] ? "border-red-500" : ""}
                        />
                        <Button
                          onClick={() => handleAddOption(field.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {errors[`option-${field.id}`] && (
                        <p className="text-sm text-red-500">{errors[`option-${field.id}`]}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.options?.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                          >
                            <span>{option.label}</span>
                            <button
                              onClick={() => handleRemoveOption(field.id, option.value)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Texto de ayuda *</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Instrucciones que verán los usuarios al usar este campo
                    </p>
                    <Input
                      value={field.placeholder}
                      onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                      placeholder="Ej: Selecciona el nivel de dificultad del ejercicio"
                      className={errors[`field-${field.id}`] ? "border-red-500" : ""}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleRemoveField(field.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Guardar Herramienta
      </Button>
    </div>
  )
} 