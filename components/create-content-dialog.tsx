"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"

interface CreateContentDialogProps {
  type: "lesson" | "material" | "context" | "writing"
  trigger: React.ReactNode
}

export function CreateContentDialog({ type, trigger }: CreateContentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Here you would typically make an API call to create the content
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Contenido creado exitosamente")
      setOpen(false)
      setFormData({ title: "", description: "" })
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al crear el contenido")
    } finally {
      setLoading(false)
    }
  }

  const getDialogTitle = () => {
    switch (type) {
      case "lesson":
        return "Crear Plan de Lección"
      case "material":
        return "Crear Material Educativo"
      case "context":
        return "Crear Constructor de Contexto"
      case "writing":
        return "Crear Consigna de Escritura"
      default:
        return "Crear Contenido"
    }
  }

  const getDialogDescription = () => {
    switch (type) {
      case "lesson":
        return "Crea un nuevo plan de lección para tus estudiantes."
      case "material":
        return "Crea un nuevo material educativo para tus clases."
      case "context":
        return "Crea un nuevo constructor de contexto para tus lecciones."
      case "writing":
        return "Crea una nueva consigna de escritura para tus estudiantes."
      default:
        return "Crea un nuevo contenido educativo."
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ingresa un título para tu contenido"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe brevemente tu contenido"
              className="min-h-[100px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 