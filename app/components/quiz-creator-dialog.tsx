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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { educationApi } from "../services/api"
import { toast } from "sonner"

interface QuizCreatorDialogProps {
  trigger: React.ReactNode;
}

interface QuizFormData {
  topic: string;
  keywords: string;
  grade: string;
  subject: string;
  coverage: string;
  questionCount: number;
  customSubject?: string;
  customGrade?: string;
}

export function QuizCreatorDialog({ trigger }: QuizCreatorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<QuizFormData>({
    topic: "",
    keywords: "",
    grade: "",
    subject: "",
    coverage: "",
    questionCount: 5,
    customSubject: "",
    customGrade: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Format the data for the backend
      const quizRequest = {
        topic: formData.topic,
        keywords: formData.keywords,
        grade: formData.grade === "otro" ? formData.customGrade : formData.grade,
        subject: formData.subject === "otro" ? formData.customSubject : formData.subject,
        coverage: formData.coverage,
        questionCount: formData.questionCount,
        questionType: "multiple_choice" // Currently only supporting multiple choice
      }

      // Send the request to the backend
      const response = await fetch('/api/education/crear-cuestionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizRequest)
      })

      if (!response.ok) {
        throw new Error('Error al generar el cuestionario')
      }

      const data = await response.text()
      
      // Show success message
      toast.success("Cuestionario generado exitosamente")
      
      // Reset form and close dialog
      setOpen(false)
      setFormData({
        topic: "",
        keywords: "",
        grade: "",
        subject: "",
        coverage: "",
        questionCount: 5,
        customSubject: "",
        customGrade: ""
      })

      // Here you could also handle the response data
      // For example, you could show the generated quiz in a new dialog or page
      console.log('Generated quiz:', data)

    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al generar el cuestionario")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof QuizFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Constructor de Cuestionarios</DialogTitle>
          <DialogDescription>
            Completa los detalles para generar tu cuestionario personalizado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Tema</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange("topic", e.target.value)}
                placeholder="Ej: Ecosistemas"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="keywords">Palabras Clave</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                placeholder="Ej: Biomas, Biodiversidad, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="grade">Nivel Educativo</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => handleInputChange("grade", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el nivel" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="otro">Otro (especificar)</SelectItem>
                  <SelectItem value="infantil">Educación Infantil</SelectItem>
                  <SelectItem value="pre-escolar">Pre-escolar</SelectItem>
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
                  </SelectContent>
                </Select>
                {formData.grade === "otro" && (
                  <div className="mt-2">
                    <Input
                      id="customGrade"
                      value={formData.customGrade}
                      onChange={(e) => handleInputChange("customGrade", e.target.value)}
                      placeholder="Escribe el nivel educativo"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Materia</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleInputChange("subject", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la materia" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="otro">Otro (especificar)</SelectItem>
                  <SelectItem value="biologia">Biología</SelectItem>
    <SelectItem value="ciencias-naturales">Ciencias Naturales</SelectItem>
    <SelectItem value="ciencias-sociales">Ciencias Sociales</SelectItem>
    <SelectItem value="economia">Economía</SelectItem>
    <SelectItem value="educacion-artistica">Educación Artística y Cultural</SelectItem>
    <SelectItem value="educacion-fisica">Educación Física, Recreación y Deportes</SelectItem>
    <SelectItem value="fisica">Física</SelectItem>
    <SelectItem value="geografia">Geografía</SelectItem>
    <SelectItem value="historia">Historia</SelectItem>
    <SelectItem value="ingles">Inglés</SelectItem>
    <SelectItem value="musica">Musica</SelectItem>
    <SelectItem value="matematicas">Matemáticas</SelectItem>
    <SelectItem value="quimica">Química</SelectItem>
    <SelectItem value="lengua">Lengua</SelectItem>
    <SelectItem value="espanol">Español</SelectItem>
    <SelectItem value="literatura">Literatura</SelectItem>
    <SelectItem value="religion">Religión</SelectItem>
    <SelectItem value="constitucion-politica">Constitución Política y Democracia</SelectItem>
    <SelectItem value="etica-valores">Ética y Valores Humanos</SelectItem>
    <SelectItem value="filosofia">Filosofía</SelectItem>
    <SelectItem value="tecnologia-informatica">Tecnología e Informática</SelectItem>
    <SelectItem value="educacion-ambiental">Educación Ambiental</SelectItem>
    <SelectItem value="estudios-afrocolombianos">Cátedra de Estudios Afrocolombianos</SelectItem>
    <SelectItem value="educacion-ciudadana">Educación para la Ciudadanía</SelectItem>
    <SelectItem value="educacion-paz">Educación para la Paz</SelectItem>
    <SelectItem value="educacion-sexualidad">Educación para la Sexualidad</SelectItem>


                  </SelectContent>
                </Select>
                {formData.subject === "otro" && (
                  <div className="mt-2">
                    <Input
                      id="customSubject"
                      value={formData.customSubject}
                      onChange={(e) => handleInputChange("customSubject", e.target.value)}
                      placeholder="Escribe la materia"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coverage">El Cuestionario Debe Cubrir</Label>
              <Textarea
                id="coverage"
                value={formData.coverage}
                onChange={(e) => handleInputChange("coverage", e.target.value)}
                placeholder="Describe los aspectos específicos que debe cubrir el cuestionario..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="questionCount">Número de Preguntas</Label>
              <Select
                value={formData.questionCount.toString()}
                onValueChange={(value) => handleInputChange("questionCount", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el número de preguntas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Preguntas</SelectItem>
                  <SelectItem value="10">10 Preguntas</SelectItem>
                  <SelectItem value="15">15 Preguntas</SelectItem>
                  <SelectItem value="20">20 Preguntas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Generando Cuestionario..." : "Generar Cuestionario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 