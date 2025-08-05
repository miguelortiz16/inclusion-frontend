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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface QuizCreatorDialogProps {
  trigger: React.ReactNode
}

export function QuizCreatorDialog({ trigger }: QuizCreatorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    gradeLevel: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Here you would typically make an API call to create the quiz
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Cuestionario creado exitosamente")
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        topic: "",
        gradeLevel: "",
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al crear el cuestionario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Cuestionario</DialogTitle>
          <DialogDescription>
            Crea un nuevo cuestionario para evaluar el aprendizaje de tus estudiantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Cuestionario</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Evaluación de Matemáticas - Unidad 1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el propósito y contenido del cuestionario"
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Tema</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Ej: Operaciones Básicas"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Nivel de Grado</Label>
            <Select
              value={formData.gradeLevel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gradeLevel: value }))}
            >
              <SelectTrigger>
              <SelectItem value="infantil">Educación Infantil</SelectItem>
                  <SelectItem value="Grado-1">Grado 1</SelectItem>
                  <SelectItem value="Grado-2">Grado 2</SelectItem>
                  <SelectItem value="Grado-3">Grado 3</SelectItem>
                  <SelectItem value="Grado-4">Grado 4</SelectItem>
                  <SelectItem value="Grado-5">Grado 5</SelectItem>
                  <SelectItem value="Grado-6">Grado 6</SelectItem>
                  <SelectItem value="Grado-7">Grado 7</SelectItem>
                  <SelectItem value="Grado-8">Grado 8</SelectItem>
                  <SelectItem value="Grado-9">Grado 9</SelectItem>
                  <SelectItem value="Grado-10">Grado 10</SelectItem>
                  <SelectItem value="Grado-11">Grado 11</SelectItem>
                  <SelectItem value="universidad">Universidad</SelectItem>
             
              </SelectTrigger>
            </Select>
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