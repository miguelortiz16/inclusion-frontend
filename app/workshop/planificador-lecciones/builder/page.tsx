"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
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
import { useState, useRef, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { FileDown, Share2, LightbulbIcon, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRouter, useSearchParams } from "next/navigation"
import { makeRequest } from "@/config/api"
import { getEmailFromStorage } from "@/utils/email"
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import { exportToWord } from '@/utils/word-export'
import { useLanguage } from "../../../contexts/LanguageContext"

interface LessonFormData {
  topic: string;
  keywords: string;
  grade: string;
  subject: string;
  coverage: string;
  duration: number;
  objectives: string;
  activities: string;
  resources: string;
  assessment: string;
  name: string;
  customSubject: string;
  educationalLevel: string;
  customGrade?: string;
}

interface Lesson {
  title: string;
  objectives: string[];
  materials: string[];
  activities: {
    title: string;
    description: string;
    duration: string;
  }[];
  assessment: string;
  notes: string;
}

function LessonPlannerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<LessonFormData>({
    topic: "",
    keywords: "",
    grade: "1",
    subject: "",
    coverage: "",
    duration: 45,
    objectives: "",
    activities: "",
    resources: "",
    assessment: "",
    name: "",
    customSubject: "",
    educationalLevel: "infantil"
  })
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRawResponse(null)

    try {
      const email = localStorage.getItem('email')
      if (!email) {
        throw new Error('No se encontró el email del usuario')
      }
      console.log('Email del usuario:', email)

      const prompt = `Genera un plan de lección sobre ${formData.topic} con las siguientes especificaciones:
- Nivel educativo: ${formData.grade === "otro" ? formData.customGrade : formData.grade}° año
- Materia: ${formData.subject === "otro" ? formData.customSubject : formData.subject}
- Palabras clave: ${formData.keywords}
- Aspectos a cubrir: ${formData.coverage}
- Duración de la lección: ${formData.duration} minutos
- Objetivos de aprendizaje: ${formData.objectives}
- Actividades: ${formData.activities}
- Recursos necesarios: ${formData.resources}
- Evaluación: ${formData.assessment}`

      const requestData = {
        topic: prompt,
        email: email,
        gradeLevel: formData.grade,
        subject: formData.subject === "otro" ? formData.customSubject : formData.subject,
        keywords: formData.keywords,
        coverage: formData.coverage,
        duration: formData.duration,
        objectives: formData.objectives,
        activities: formData.activities,
        resources: formData.resources,
        assessment: formData.assessment,
        educationalLevel: formData.educationalLevel === "otro" ? formData.customGrade : formData.educationalLevel
      }

      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-plan-de-leccion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`)
      }

      const data = await response.text()
      console.log('Respuesta del servidor:', data)
      setRawResponse(data)

      const parsedLesson = parseChatGPTResponse(data)
      console.log('Lección parseada:', parsedLesson)
      
      if (parsedLesson) {
        setLesson(parsedLesson)
        toast.success("Plan de lección generado exitosamente")

        // Guardar los datos en localStorage para la vista
        localStorage.setItem('lessonPlanData', JSON.stringify({
          topic: formData.topic,
          lesson: parsedLesson
        }))
      } else {
        console.log('No se pudo parsear la lección, mostrando respuesta raw')
        setLesson(null)
      }
    } catch (err) {
      console.error('Error al crear el plan de lección:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el plan de lección')
      toast.error("Error al generar el plan de lección")
      setLesson(null)
    } finally {
      setLoading(false)
    }
  }

  const parseChatGPTResponse = (response: string): Lesson | null => {
    try {
      const lines = response.split('\n')
      const lesson: Partial<Lesson> = {
        objectives: [],
        materials: [],
        activities: []
      }

      let currentSection = ''
      let currentActivity: { title: string; description: string; duration: string } | null = null

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        if (trimmedLine.startsWith('Título:')) {
          lesson.title = trimmedLine.replace('Título:', '').trim()
        } else if (trimmedLine.startsWith('Objetivos:')) {
          currentSection = 'objectives'
        } else if (trimmedLine.startsWith('Materiales:')) {
          currentSection = 'materials'
        } else if (trimmedLine.startsWith('Actividades:')) {
          currentSection = 'activities'
        } else if (trimmedLine.startsWith('Evaluación:')) {
          lesson.assessment = trimmedLine.replace('Evaluación:', '').trim()
        } else if (trimmedLine.startsWith('Notas:')) {
          lesson.notes = trimmedLine.replace('Notas:', '').trim()
        } else if (trimmedLine.startsWith('Actividad')) {
          if (currentActivity) {
            lesson.activities?.push(currentActivity)
          }
          currentActivity = {
            title: trimmedLine,
            description: '',
            duration: ''
          }
        } else if (trimmedLine.startsWith('Duración:')) {
          if (currentActivity) {
            currentActivity.duration = trimmedLine.replace('Duración:', '').trim()
          }
        } else if (trimmedLine.startsWith('-')) {
          const content = trimmedLine.replace('-', '').trim()
          if (currentSection === 'objectives') {
            lesson.objectives?.push(content)
          } else if (currentSection === 'materials') {
            lesson.materials?.push(content)
          } else if (currentSection === 'activities' && currentActivity) {
            currentActivity.description += content + '\n'
          }
        }
      }

      if (currentActivity) {
        lesson.activities?.push(currentActivity)
      }

      return lesson as Lesson
    } catch (err) {
      console.error('Error al parsear la respuesta:', err)
      return null
    }
  }

  const handleInputChange = (field: keyof LessonFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const exportToPDF = async () => {
    if (!previewRef.current || !lesson) return;

    try {
      const pdf = initializePDF(`Plan de Lección - ${lesson.title}`, 'Generador de Planes de Lección');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Plan de Lección: ${lesson.title}`, `Materia: ${formData.subject} - Nivel: ${formData.grade}° año`);
      
      let y = MARGINS.top + 30;
      
      // Agregar secciones
      y = addSection(pdf, 'Objetivos de Aprendizaje', lesson.objectives.join('\n'), y);
      y = addSection(pdf, 'Materiales Necesarios', lesson.materials.join('\n'), y);
      
      // Agregar actividades
      y = addSection(pdf, 'Actividades', '', y);
      lesson.activities.forEach((activity, index) => {
        y = addStyledParagraph(pdf, `${index + 1}. ${activity.title}`, y);
        y = addStyledParagraph(pdf, `   Descripción: ${activity.description}`, y);
        y = addStyledParagraph(pdf, `   Duración: ${activity.duration}`, y);
        y += 5;
      });
      
      // Agregar evaluación
      y = addSection(pdf, 'Evaluación', lesson.assessment, y);
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Plan_Leccion_${lesson.title.replace(/\s+/g, '_')}.pdf`);
      toast.success("Plan de lección exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el plan de lección");
    }
  };

  const handleExportWord = async () => {
    if (!lesson) {
      toast.error('No hay plan de lección para exportar');
      return;
    }

    try {
      // Crear el contenido del documento Word
      const content = `
Plan de Lección: ${lesson.title}

Materia: ${formData.subject}
Nivel: ${formData.grade}° año

Objetivos de Aprendizaje:
${lesson.objectives.map(obj => `• ${obj}`).join('\n')}

Materiales Necesarios:
${lesson.materials.map(mat => `• ${mat}`).join('\n')}

Actividades:
${lesson.activities.map((act, index) => `
${index + 1}. ${act.title}
   Descripción: ${act.description}
   Duración: ${act.duration}
`).join('\n')}

Evaluación:
${lesson.assessment}
`;

      await exportToWord(
        content,
        `Plan de Lección: ${lesson.title}`,
        `plan-leccion-${lesson.title.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareLesson = async () => {
    if (!lesson) return;

    try {
      const lessonText = `
Plan de Lección: ${lesson.title}

Objetivos de Aprendizaje:
${lesson.objectives.map(obj => `• ${obj}`).join('\n')}

Materiales Necesarios:
${lesson.materials.map(mat => `• ${mat}`).join('\n')}

Actividades:
${lesson.activities.map(act => `
${act.title}
${act.description}
Duración: ${act.duration}
`).join('\n')}

Evaluación:
${lesson.assessment}
`;

      if (navigator.share) {
        await navigator.share({
          title: `Plan de Lección: ${lesson.title}`,
          text: lessonText,
        });
      } else {
        await navigator.clipboard.writeText(lessonText);
        toast.success("Plan de lección copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el plan de lección");
    }
  };

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Panel izquierdo - Previsualizador */}
        <div className="flex-1 overflow-y-auto p-6 border-r">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">{t('unitPlanner.view.title')}</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!lesson}
              >
                <FileDown className="w-4 h-4" />
                {t('unitPlanner.view.buttons.exportToExcel')}
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!lesson}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('unitPlanner.view.buttons.exportToWord')}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareLesson}
                disabled={!lesson}
              >
                <Share2 className="w-4 h-4" />
                {t('unitPlanner.view.buttons.share')}
              </Button>
            </div>
          </div>

          <div ref={previewRef}>
            {lesson ? (
              <div className="space-y-8">
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4">{lesson.title}</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                    <div>
                      <span className="font-medium">{t('unitPlanner.view.dialogs.lessonDetails.mainTopic')}:</span> {formData.subject}
                    </div>
                    <div>
                      <span className="font-medium">{t('unitPlanner.view.dialogs.lessonDetails.estimatedDuration')}:</span> {formData.grade}° año
                    </div>
                    <div>
                      <span className="font-medium">{t('unitPlanner.view.dialogs.lessonDetails.minutes')}:</span> {formData.duration} minutos
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{t('unitPlanner.view.dialogs.lessonDetails.sections.objectives')}</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {lesson.objectives.map((objective, index) => (
                          <li key={index} className="text-gray-700">{objective}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">{t('unitPlanner.view.dialogs.lessonDetails.sections.resources')}</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {lesson.materials.map((material, index) => (
                          <li key={index} className="text-gray-700">{material}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">{t('unitPlanner.view.dialogs.lessonDetails.sections.activities')}</h3>
                      <div className="space-y-6">
                        {lesson.activities.map((activity, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">{activity.title}</h4>
                            <p className="text-gray-600 mb-2">{activity.description}</p>
                            <div className="text-sm text-gray-500">
                              {t('unitPlanner.view.dialogs.lessonDetails.estimatedDuration')}: {activity.duration}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">{t('unitPlanner.view.dialogs.lessonDetails.sections.achievements')}</h3>
                      <p className="text-gray-700">{lesson.assessment}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : rawResponse ? (
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('unitPlanner.view.dialogs.lessonDetails.help.title')}</h3>
                <div className="bg-white p-4 rounded border">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                    {rawResponse}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500">
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">{t('unitPlanner.view.dialogs.lessonDetails.help.description')}</p>
                <p className="text-center text-sm mb-4">
                  {t('unitPlanner.view.dialogs.lessonDetails.help.description')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="w-[400px] p-6 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">{t('unitPlanner.title')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">{t('unitPlanner.steps.basicInfo.className')}</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder={t('unitPlanner.steps.basicInfo.classNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">{t('unitPlanner.steps.basicInfo.subject')}</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange("keywords", e.target.value)}
                    placeholder={t('unitPlanner.steps.basicInfo.subjectPlaceholder')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">{t('unitPlanner.steps.basicInfo.educationalLevel')}</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleInputChange("grade", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('unitPlanner.steps.basicInfo.educationalLevelPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="otro">Otro (especificar)</SelectItem>
                      <SelectItem value="pre-escolar">Pre-escolar</SelectItem>
                        <SelectItem value="infantil">{t('unitPlanner.steps.basicInfo.educationalLevel')}</SelectItem>
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
                        <SelectItem value="universidad">{t('unitPlanner.steps.basicInfo.educationalLevel')}</SelectItem>
    
                      </SelectContent>
                    </Select>
                    {formData.grade === "otro" && (
                      <div className="mt-2">
                        <Input
                          value={formData.customGrade}
                          onChange={(e) => handleInputChange("grade", e.target.value)}
                          placeholder="Escribe el nivel educativo"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="subject">{t('unitPlanner.steps.basicInfo.subject')}</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => handleInputChange("subject", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('unitPlanner.steps.basicInfo.subjectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="otro">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="biologia">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="ciencias-naturales">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="ciencias-sociales">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="economia">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="educacion-artistica">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="educacion-fisica">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="fisica">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="geografia">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="historia">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="ingles">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="matematicas">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="quimica">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="lengua">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="literatura">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="religion">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="constitucion-politica">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="etica-valores">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="filosofia">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="tecnologia-informatica">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="educacion-ambiental">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="estudios-afrocolombianos">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="educacion-ciudadana">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="educacion-paz">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>
                        <SelectItem value="educacion-sexualidad">{t('unitPlanner.steps.basicInfo.subject')}</SelectItem>

                      </SelectContent>
                    </Select>
                    {formData.subject === "otro" && (
                      <div className="mt-2">
                        <Input
                          value={formData.customSubject}
                          onChange={(e) => handleInputChange("customSubject", e.target.value)}
                          placeholder={t('unitPlanner.steps.basicInfo.subjectPlaceholder')}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverage">{t('unitPlanner.steps.classDetails.classContent')}</Label>
                  <Textarea
                    id="coverage"
                    value={formData.coverage}
                    onChange={(e) => handleInputChange("coverage", e.target.value)}
                    placeholder={t('unitPlanner.steps.classDetails.classContentPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration">{t('unitPlanner.steps.duration.title')}</Label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) => handleInputChange("duration", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('unitPlanner.steps.duration.subtitle')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 {t('unitPlanner.steps.duration.minutes')}</SelectItem>
                      <SelectItem value="45">45 {t('unitPlanner.steps.duration.minutes')}</SelectItem>
                      <SelectItem value="60">60 {t('unitPlanner.steps.duration.minutes')}</SelectItem>
                      <SelectItem value="90">90 {t('unitPlanner.steps.duration.minutes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="objectives">{t('unitPlanner.steps.classDetails.standards')}</Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => handleInputChange("objectives", e.target.value)}
                    placeholder={t('unitPlanner.steps.classDetails.standardsPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="activities">{t('unitPlanner.steps.classDetails.activities')}</Label>
                  <Textarea
                    id="activities"
                    value={formData.activities}
                    onChange={(e) => handleInputChange("activities", e.target.value)}
                    placeholder={t('unitPlanner.steps.classDetails.activitiesPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="resources">{t('unitPlanner.steps.classDetails.resources')}</Label>
                  <Textarea
                    id="resources"
                    value={formData.resources}
                    onChange={(e) => handleInputChange("resources", e.target.value)}
                    placeholder={t('unitPlanner.steps.classDetails.resourcesPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="assessment">{t('unitPlanner.steps.classDetails.assessment')}</Label>
                  <Textarea
                    id="assessment"
                    value={formData.assessment}
                    onChange={(e) => handleInputChange("assessment", e.target.value)}
                    placeholder={t('unitPlanner.steps.classDetails.assessmentPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">{t('unitPlanner.steps.basicInfo.className')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t('unitPlanner.steps.basicInfo.classNamePlaceholder')}
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
                </div>
              </div>

              {error && (
                <div className="mb-4 text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? t('unitPlanner.steps.duration.processing') : t('unitPlanner.title')}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Toaster />
    </Layout>
  )
}

export default function LessonPlannerBuilder() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LessonPlannerContent />
    </Suspense>
  )
} 