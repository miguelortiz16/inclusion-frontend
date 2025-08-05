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
import { useState } from "react"
import { educationApi } from "../services/api"
import { toast } from "sonner"

interface CreateContentDialogProps {
  type: string;
  trigger: React.ReactNode;
}

export function CreateContentDialog({ type, trigger }: CreateContentDialogProps) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let response;
      switch (type) {
        case "quiz":
          response = await educationApi.createQuiz(topic)
          break
        case "lesson":
          response = await educationApi.createLessonPlan(topic)
          break
        case "material":
          response = await educationApi.createEducationalMaterial(topic)
          break
        case "context":
          response = await educationApi.createContext(topic)
          break
        case "ideas":
          response = await educationApi.generateIdeas(topic)
          break
        case "writing":
          response = await educationApi.generateWritingPrompt(topic)
          break
        default:
          throw new Error("Invalid type")
      }

      if (response.success) {
        toast.success("Contenido generado exitosamente")
        setOpen(false)
        setTopic("")
      } else {
        toast.error(response.error || "Error al generar el contenido")
      }
    } catch (error) {
      toast.error("Error al generar el contenido")
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
          <DialogTitle>Crear Nuevo Contenido</DialogTitle>
          <DialogDescription>
            Ingresa el tema sobre el que deseas generar contenido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Tema</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: La fotosíntesis"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 