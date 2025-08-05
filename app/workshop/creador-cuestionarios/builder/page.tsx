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
import { toast } from "react-hot-toast"
import { Toaster } from "sonner"
import { PlusCircle, FileDown, Share2, LightbulbIcon, X, Edit, Bold, Italic, LinkIcon, List, ListOrdered, AlignLeft, Undo, Redo, FileText, HelpCircle, Trophy } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRouter, useSearchParams } from "next/navigation"
import { makeRequest } from "@/config/api"
import { getEmailFromStorage } from "@/utils/email"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import { exportToWord } from '@/utils/word-export'
import { motion } from "framer-motion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LoadingButton } from "@/components/ui/loading-button"
import { gamificationService } from '@/app/services/gamification'
import { usePoints } from '@/app/context/PointsContext'
import { PointsNotification } from '@/app/components/PointsNotification'
import { PricingModal } from "@/components/pricing-modal"
import { MessageCircle, Loader2 } from "lucide-react"
import { ChatImprovementModal } from "../../../components/chat-improvement-modal"

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizFormData {
  topic: string;
  keywords: string;
  grade: string;
  subject: string;
  coverage: string;
  questionCount: number;
  questionType: string;
  difficulty: string;
  customSubject?: string;
  isPublic: boolean;
  customGrade: string;
}

function QuizBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showPointsNotification } = usePoints()
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const [formData, setFormData] = useState<QuizFormData>({
    topic: "",
    keywords: "",
    grade: "1",
    subject: "",
    coverage: "",
    questionCount: 5,
    questionType: "multiple_choice",
    difficulty: "medium",
    customSubject: "",
    isPublic: false,
    customGrade: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewType, setPreviewType] = useState<string | null>(null)
  const [previewResponse, setPreviewResponse] = useState<string | null>(null)
  const [isEditingPreview, setIsEditingPreview] = useState(false)
  const [editedPreview, setEditedPreview] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  // Chat functionality
  const [showChatModal, setShowChatModal] = useState(false)
  
  // Efecto para limpiar el chat cuando cambia el cuestionario
  useEffect(() => {
    if (rawResponse) {
      // Solo limpiar si el cambio viene de una nueva generación, no del chat
      const isFromChat = sessionStorage.getItem('quizFromChat')
      if (!isFromChat) {
        localStorage.removeItem('quizChatState')
        console.log('Cuestionario generado desde formulario, chat limpiado')
      } else {
        // Limpiar la marca de que viene del chat
        sessionStorage.removeItem('quizFromChat')
      }
    }
  }, [rawResponse])


  const validateAccess = async (email: string) => {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/validate-access?email=${email}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error validando acceso:', error)
      return { allowed: true, message: 'Error al validar el acceso' }
    }
  }

  // Función para abrir el modal de chat
  const openChatModal = () => {
    // Limpiar el estado del chat antes de abrir el modal para asegurar un inicio limpio
    localStorage.removeItem('quizChatState')
    setShowChatModal(true)
  }

  // Función para obtener el contenido actual
  const getCurrentContent = () => {
    if (questions.length > 0) {
      return questions.map((question, index) => {
        const options = question.options.map((option, i) => 
          `${String.fromCharCode(97 + i)}) ${option}`
        ).join('\n');
        return `Pregunta ${index + 1}: ${question.question}\n${options}\nRespuesta correcta: ${String.fromCharCode(97 + question.correctAnswer)}\n`;
      }).join('\n');
    } else if (previewResponse) {
      return previewResponse;
    } else if (rawResponse) {
      return rawResponse;
    }
    return "";
  }

  // Función para actualizar el contenido con las mejoras
  const handleContentUpdate = (newContent: string) => {
    // Marcar que el cambio viene del chat
    sessionStorage.setItem('quizFromChat', 'true')
    
    if (questions.length > 0) {
      // Si tenemos preguntas parseadas, intentar parsear la nueva respuesta
      const newQuestions = parseChatGPTResponse(newContent)
      if (Array.isArray(newQuestions) && newQuestions.length > 0) {
        setQuestions(newQuestions)
        setRawResponse(newContent)
      } else {
        setPreviewResponse(newContent)
        setPreviewType("multiple_choice")
        setShowPreview(true)
      }
    } else {
      setPreviewResponse(newContent)
      setPreviewType("multiple_choice")
      setShowPreview(true)
    }
  }



  useEffect(() => {
    // Leer el parámetro name de la URL
    const nameParam = searchParams?.get('name')
    if (nameParam) {
      // Limpiar datos anteriores
      localStorage.removeItem('quizData')
      setQuestions([])
      setRawResponse(null)
      
      // Actualizar el tema en el formulario
      const decodedTopic = decodeURIComponent(nameParam)
      console.log('Tema decodificado:', decodedTopic)

      // Obtener la respuesta del historial
      const historyData = localStorage.getItem('historyData')
      console.log('Datos del historial en localStorage:', historyData)
      
      if (historyData) {
        try {
          const parsedHistoryData = JSON.parse(historyData)
          console.log('Datos del historial parseados:', parsedHistoryData)
          
          if (parsedHistoryData.response) {
            console.log('Respuesta encontrada:', parsedHistoryData.response)
            setRawResponse(parsedHistoryData.response)
            
            // Intentar parsear las preguntas
            const parsedQuestions = parseChatGPTResponse(parsedHistoryData.response)
            console.log('Preguntas parseadas:', parsedQuestions)
            
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              setQuestions(parsedQuestions)
            } else {
              console.log('No se pudieron parsear las preguntas, mostrando respuesta raw')
              setQuestions([])
            }
          } else {
            console.log('No se encontró respuesta en los datos del historial')
          }
        } catch (err) {
          console.error('Error al procesar datos del historial:', err)
          setQuestions([])
        }
      } else {
        console.log('No se encontraron datos en el historial')
      }

      // Si el tema comienza con "Genera un cuestionario sobre", es una respuesta del historial
      if (decodedTopic.startsWith('Genera un cuestionario sobre')) {
        // Extraer los datos del prompt
        const promptLines = decodedTopic.split('\n')
        console.log('Líneas del prompt:', promptLines)

        // Función auxiliar para extraer valor de forma segura
        const extractValue = (line: string | undefined, prefix: string, suffix: string = '') => {
          if (!line) return ''
          return line.replace(prefix, '').replace(suffix, '').trim()
        }

        // Limpiar el tema de la duplicación
        const cleanTopic = promptLines[0].replace(/^Genera un cuestionario sobre\s+Genera un cuestionario sobre\s+/, 'Genera un cuestionario sobre ')
        console.log('Tema limpio:', cleanTopic)

        const formDataFromPrompt = {
          topic: extractValue(cleanTopic, 'Genera un cuestionario sobre ', ' with the following specifications:'),
          grade: extractValue(promptLines[1], '- Educational Level: ', '° year'),
          subject: extractValue(promptLines[2], '- Subject: '),
          keywords: extractValue(promptLines[3], '- Keywords: '),
          coverage: extractValue(promptLines[4], '- Aspects to cover: '),
          questionCount: parseInt(extractValue(promptLines[5], '- Number of questions: ')) || 5,
          questionType: promptLines[6]?.includes('multiple choice') ? 'multiple_choice' : 'other',
          difficulty: 'medium',
          isPublic: false,
          customGrade: extractValue(promptLines[1], '- Educational Level: ', '° year')
        }

        console.log('Datos extraídos del prompt:', formDataFromPrompt)
        setFormData(formDataFromPrompt)
      } else {
        // Si es un tema normal, solo actualizar el tema
        setFormData(prev => ({ 
          ...prev, 
          topic: decodedTopic,
          // Mantener los valores por defecto para los demás campos
          grade: prev.grade || "1",
          subject: prev.subject || "",
          keywords: prev.keywords || "",
          coverage: prev.coverage || "",
          questionCount: prev.questionCount || 5,
          questionType: prev.questionType || "multiple_choice",
          difficulty: prev.difficulty || "medium",
          customGrade: prev.customGrade || "1"
        }))
      }
    }

    // Verificar si hay datos guardados en localStorage
    const savedQuizData = localStorage.getItem('quizData')
    if (savedQuizData && !nameParam) {
      try {
        const { questions: savedQuestions } = JSON.parse(savedQuizData)
        if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
          setQuestions(savedQuestions)
        }
      } catch (err) {
        console.error('Error al cargar datos guardados:', err)
      }
    }
  }, [searchParams])

  const parseChatGPTResponse = (response: any): Question[] => {
    // Si la respuesta es null, undefined o un objeto vacío, retornar array vacío
    if (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
      console.warn('La respuesta está vacía o es un objeto vacío');
      return [];
    }

    // Si la respuesta es un objeto, intentar obtener el texto de la respuesta
    if (typeof response === 'object') {
      // Si es una respuesta de la API
      if (response.response) {
        response = response.response;
      } else if (response.text) {
        response = response.text;
      } else if (response.content) {
        response = response.content;
      } else if (response.message) {
        response = response.message;
      } else if (typeof response === 'string') {
        // Si es un objeto pero ya es un string, usarlo directamente
      } else {
        // Si es un objeto con datos, intentar extraer la información
        try {
          // Intentar convertir el objeto a string
          response = JSON.stringify(response);
        } catch (e) {
          console.warn('No se pudo convertir la respuesta a string:', e);
          return [];
        }
      }
    }

    // Asegurarse de que response sea una cadena
    if (typeof response !== 'string') {
      console.warn('La respuesta debe ser una cadena de texto:', response);
      return [];
    }

    // Limpiar la respuesta de caracteres especiales y espacios extra
    response = response.trim().replace(/\r\n/g, '\n');

    // Si la respuesta está vacía después de la limpieza, retornar array vacío
    if (!response) {
      console.warn('La respuesta está vacía después de la limpieza');
      return [];
    }

    const lines = response.split('\n');
    const questions: Question[] = [];
    let currentQuestion: Partial<Question> = {};
    let questionId = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Ignorar líneas que no son parte de las preguntas
      if (trimmedLine.includes('Educational Level:') || 
          trimmedLine.includes('Subject:') || 
          trimmedLine.includes('Keywords:') || 
          trimmedLine.includes('Aspects to cover:') ||
          trimmedLine.includes('Number of questions:') || 
          trimmedLine.includes('Question Type:')) {
        continue;
      }

      if (trimmedLine.startsWith('Question') || /^\d+\./.test(trimmedLine)) {
        if (Object.keys(currentQuestion).length > 0) {
          // Validar que la pregunta tenga al menos una opción
          if (currentQuestion.options && currentQuestion.options.length > 0) {
            // Asignar aleatoriamente la respuesta correcta entre las opciones b, c y d
            const randomIndex = Math.floor(Math.random() * 3) + 1; // 1, 2 o 3 (b, c o d)
            currentQuestion.correctAnswer = randomIndex;
            questions.push(currentQuestion as Question);
          }
          currentQuestion = {};
        }
        currentQuestion = {
          id: questionId++,
          question: trimmedLine.replace(/^Question\s*\d*:?\s*/, '').replace(/^\d+\.\s*/, '').trim(),
          options: [],
          correctAnswer: 0
        };
      } else if (trimmedLine.match(/^[a-d]\)/i)) {
        const optionIndex = trimmedLine.toLowerCase().charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
        const optionText = trimmedLine.slice(2).trim();
        if (currentQuestion.options) {
          currentQuestion.options[optionIndex] = optionText;
        }
      }
    }

    // Añadir la última pregunta si existe y tiene opciones
    if (Object.keys(currentQuestion).length > 0 && currentQuestion.options && currentQuestion.options.length > 0) {
      // Asignar aleatoriamente la respuesta correcta entre las opciones b, c y d
      const randomIndex = Math.floor(Math.random() * 3) + 1; // 1, 2 o 3 (b, c o d)
      currentQuestion.correctAnswer = randomIndex;
      questions.push(currentQuestion as Question);
    }

    // Si no se encontraron preguntas válidas, mostrar advertencia
    if (questions.length === 0) {
      console.warn('No se encontraron preguntas válidas en la respuesta');
    }

    return questions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRawResponse(null)
    setQuestions([])
    setPreviewResponse(null)
    setShowPreview(false)
    // Limpiar el estado del chat cuando se genera un nuevo cuestionario
    localStorage.removeItem('quizChatState')
    

    
    const email = localStorage.getItem('email')
    if (!email) {
      throw new Error('No se encontró el email del usuario')
    }


    try {
      const email = localStorage.getItem('email')
      if (!email) {
        throw new Error('No se encontró el email del usuario')
      }
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
  const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setLoading(false)
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
 return // Detener el flujo
}
      
      // Si es una opción "Próximamente", mostrar previsualización
      if (formData.questionType === 'completar_espacios_en_blanco' || 
          formData.questionType === 'verdadero_falso' || 
          formData.questionType === 'respuesta_escrita' ||
          formData.questionType === 'opcion_multiple_y_completar_espacios_en_blanco' ||
          formData.questionType === 'opcion_multiple_y_verdadero_falso' ||
          formData.questionType === 'opcion_multiple_y_respuesta_escrita') {
        const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-cuestionario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic:"tema:" + formData.topic + " grado educativo:" + formData.grade + " materia:" + (formData.subject === "otro" ? formData.customSubject : formData.subject) + " palabras clave:" + formData.keywords + " aspectos a cubrir:" + formData.coverage + " numero de preguntas:" + formData.questionCount+" tipo de cuestionario:" + formData.questionType+" dificultad del cuestionario:" + formData.difficulty,
            email: email,
            name:formData.topic,
            grade:formData.grade,
            subject:formData.subject,
            theme:formData.topic,
            isPublic: formData.isPublic,
          })
        })

        const responseText = await response.text()
        setPreviewResponse(responseText)
        setPreviewType(formData.questionType)
        setShowPreview(true)
        setActiveTab('preview')
        setLoading(false)
        if (window.innerWidth < 1024) {
          setShowPreviewModal(true)
        }
        
        // Agregar puntos por crear el cuestionario

        return
      }
console.log(formData)
      // Para opciones múltiples, continuar con el flujo normal
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/crear-cuestionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic:"tema:" + formData.topic + " grado educativo:" + (formData.grade === "otro" ? formData.customGrade : formData.grade) + " materia:" + (formData.subject === "otro" ? formData.customSubject : formData.subject) + " palabras clave:" + formData.keywords + " aspectos a cubrir:" + formData.coverage + " numero de preguntas:" + formData.questionCount+"tipo de cuestionario:" + formData.questionType+" dificultad:" + formData.difficulty,
          email: email,
          name: formData.topic,
          grade:formData.grade,
          subject:formData.subject,
          theme:formData.topic,
          isPublic: formData.isPublic,
        })
      })

      const responseText = await response.text()
      setRawResponse(responseText)
      
      // Limpiar el estado del chat cuando se genera un nuevo cuestionario
      localStorage.removeItem('quizChatState')
 
   

      const parsedQuestions = parseChatGPTResponse(responseText)
      
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        setQuestions(parsedQuestions)
        setActiveTab('preview')
        if (window.innerWidth < 1024) {
          setShowPreviewModal(true)
        }
        toast.success("Cuestionario generado exitosamente")
        // Agregar puntos por crear el cuestionario

      } else {
        setQuestions([])
        setPreviewResponse(responseText)
        setPreviewType("multiple_choice")
        setShowPreview(true)
        setActiveTab('preview')
        if (window.innerWidth < 1024) {
          setShowPreviewModal(true)
        }
        toast.success("Mostrando respuesta en formato de preguntas")

      }
    } catch (err) {
      console.error('Error al crear el cuestionario:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el cuestionario')
      toast.error("Error al generar el cuestionario")
      setQuestions([])
    } finally {
      setLoading(false)
    }

 //   await gamificationService.addPoints(email, 10, 'questionnaire_creation')
    showPointsNotification(10, 'crear un cuestionario')
  }

  const handleInputChange = (field: keyof QuizFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const exportToPDF = async () => {
    if (!previewResponse && questions.length === 0) return;

    try {
      const pdf = initializePDF('Cuestionario', 'Generador de Cuestionarios');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Cuestionario: ${formData.topic}`, `Nivel: ${formData.grade}° año - ${formData.subject}`);
      
      let y = MARGINS.top + 30;
      
      // Agregar información adicional
      if (formData.keywords) {
        y = addSection(pdf, 'Palabras clave', formData.keywords, y);
      }
      if (formData.coverage) {
        y = addSection(pdf, 'Aspectos cubiertos', formData.coverage, y);
      }
      
      // Agregar el contenido según el tipo
      if (previewResponse) {
        y = addStyledParagraph(pdf, previewResponse, y);
      } else if (questions.length > 0) {
        const questionsContent = questions.map((question, index) => {
          const options = question.options.map((option, i) => 
            `${String.fromCharCode(97 + i)}) ${option}`
          ).join('\n');
          return `Pregunta ${index + 1}: ${question.question}\n${options}\nRespuesta correcta: ${String.fromCharCode(97 + question.correctAnswer)}\n`;
        }).join('\n');
        y = addStyledParagraph(pdf, questionsContent, y);
      }
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Cuestionario_${formData.topic.replace(/\s+/g, '_')}.pdf`);
      toast.success("Cuestionario exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el cuestionario");
    }
  };

  const handleExportWord = async () => {
    if (!previewResponse && questions.length === 0) {
      toast.error('No hay cuestionario para exportar');
      return;
    }

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Título del cuestionario
            new Paragraph({
              text: formData.topic,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400,
              },
            }),
            // Información del nivel y materia
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nivel: ${formData.grade}° año - ${formData.subject}`,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            }),
            // Contenido del cuestionario
            ...(previewResponse ? 
              // Si hay una respuesta de preview, usarla
              previewResponse.split('\n').map(line => new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 32,
                  }),
                ],
                spacing: {
                  after: 100,
                },
              }))
              : 
              // Si no hay preview, usar las preguntas
              questions.map((question, index) => [
                // Número de pregunta
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Pregunta ${index + 1}:`,
                      bold: true,
                      size: 32,
                    }),
                  ],
                  spacing: {
                    after: 100,
                    before: 200,
                  },
                }),
                // Texto de la pregunta
                new Paragraph({
                  children: [
                    new TextRun({
                      text: question.question,
                      size: 32,
                    }),
                  ],
                  spacing: {
                    after: 200,
                  },
                }),
                // Opciones
                ...question.options.map((option, i) => 
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${String.fromCharCode(97 + i)}) ${option}`,
                        size: 32,
                      }),
                    ],
                    spacing: {
                      after: 100,
                    },
                  })
                ),
                // Respuesta correcta
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Respuesta correcta: ${String.fromCharCode(97 + question.correctAnswer)}`,
                      bold: true,
                      size: 32,
                    }),
                  ],
                  spacing: {
                    after: 200,
                  },
                }),
              ]).flat()
            ),
          ],
        }],
      });

      // Generar y descargar el documento
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cuestionario-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  const shareQuiz = async () => {
    if (!previewResponse) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cuestionario sobre ${formData.topic}`,
          text: previewResponse,
        });
      } else {
        await navigator.clipboard.writeText(previewResponse);
        toast.success("Cuestionario copiado al portapapeles");
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error("Error al compartir el cuestionario");
    }
  };

  const handleOptionChange = (questionId: number, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleCorrectAnswerChange = (questionId: number, value: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, correctAnswer: value };
      }
      return q;
    }));
  };

  const handleEditQuestion = (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestion(question);
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    
    setQuestions(questions.map(q => {
      if (q.id === editingQuestion.id) {
        return editingQuestion;
      }
      return q;
    }));
    setShowEditDialog(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: number) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, questionType: type }))
    setShowPreview(false)
    setPreviewType(null)
    setPreviewResponse(null)
  }

  const handleEditPreview = () => {
    setIsEditingPreview(true)
    setEditedPreview(previewResponse || "")
  }

  const handleSavePreview = () => {
    setPreviewResponse(editedPreview)
    setIsEditingPreview(false)
  }

  const handleCancelEdit = () => {
    setIsEditingPreview(false)
    setEditedPreview("")
  }

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setEditedContent(target.innerHTML);
  };

  return (
    <>
    <PricingModal 
    open={showPricingModal} 
    onOpenChange={setShowPricingModal}
    accessMessage={accessMessage}
  />
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row h-screen"
      >
        {/* Panel izquierdo - Editor y Previsualizador */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 overflow-y-auto p-4 lg:p-6 border-r hidden lg:block"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-between items-center mb-6"
          >
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h1 className="text-xl font-semibold">Generador de Cuestionarios</h1>
              </motion.div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                onClick={exportToPDF}
                disabled={!previewResponse && questions.length === 0}
              >
                <FileDown className="w-4 h-4" />
                Exportar a PDF
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                onClick={handleExportWord}
                disabled={!previewResponse && questions.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar a Word
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareQuiz}
                disabled={!previewResponse && questions.length === 0}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              {(previewResponse || questions.length > 0) && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white relative"
                  onClick={openChatModal}
                >
                  <MessageCircle className="w-4 h-4" />
                  Mejorar con IA

                </Button>
              )}
            </div>
          </motion.div>

          {/* Editor toolbar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border-b pb-3 mb-6 flex items-center gap-2"
          >
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option>Párrafo</option>
              <option>Encabezado 1</option>
              <option>Encabezado 2</option>
              <option>Encabezado 3</option>
            </select>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <List className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <ListOrdered className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <AlignLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden ml-auto">
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Undo className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="relative" 
            ref={previewRef}
          >
            {showPreview ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="min-h-[500px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-4 text-gray-700 whitespace-pre-wrap font-sans"
                  contentEditable
                  onInput={handleContentChange}
                  suppressContentEditableWarning
                >
                  {previewResponse}
                </div>
              </motion.div>
            ) : questions.length > 0 ? (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
                      <div>
                        <h3 className="font-medium text-base sm:text-lg mb-2">{question.question}</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Pregunta {question.id} de {questions.length}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleEditQuestion(question.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs sm:text-sm font-medium">
                            {String.fromCharCode(97 + index)}
                          </div>
                          <div className="flex-1 w-full">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(question.id, index, e.target.value)}
                              placeholder={`Opción ${String.fromCharCode(97 + index)}`}
                              className="w-full"
                            />
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === index}
                              onChange={() => handleCorrectAnswerChange(question.id, index)}
                              className="h-4 w-4"
                            />
                            <Label className="text-xs sm:text-sm">Correcta</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]"
              >
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay preguntas generadas</p>
                <p className="text-center text-sm">
                  Configura el cuestionario en el panel derecho y genera preguntas automáticamente.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Panel derecho - Formulario */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-[400px] p-4 lg:p-6 overflow-y-auto bg-gray-50"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border shadow-sm p-4 lg:p-6"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-between items-center mb-6"
            >
              <h2 className="text-xl font-semibold">Generador de Cuestionarios</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guía para Generar Cuestionarios</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h3 className="font-medium">Consejos para Temas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Se específico con el área o tema que deseas evaluar</li>
                            <li>Considera el nivel educativo de los estudiantes</li>
                            <li>Define claramente los aspectos a evaluar</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Características de las Preguntas:</h3>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Claras y concisas</li>
                            <li>Adaptadas al nivel educativo seleccionado</li>
                            <li>Con opciones bien definidas</li>
                            <li>Con una respuesta correcta clara</li>
                            <li>Alineadas con los objetivos de aprendizaje</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </motion.div>
            
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="questionType">Tipo de Pregunta *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el tipo de pregunta que deseas generar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.questionType}
                    onValueChange={(value) => handleQuestionTypeChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de pregunta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opcion_multiple">Opción Múltiple</SelectItem>
                      <SelectItem value="completar_espacios_en_blanco">Completar el Espacio</SelectItem>
                      <SelectItem value="verdadero_falso">Verdadero o Falso</SelectItem>
                      <SelectItem value="respuesta_escrita">Respuesta Escrita</SelectItem>
                      <SelectItem value="opcion_multiple_y_completar_espacios_en_blanco">Opción Múltiple y Completar el Espacio</SelectItem>
                      <SelectItem value="opcion_multiple_y_verdadero_falso">Opción Múltiple y Verdadero o Falso</SelectItem>
                      <SelectItem value="opcion_multiple_y_respuesta_escrita">Opción Múltiple y Respuesta Escrita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="topic">Tema *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El tema o área específica para la que necesitas el cuestionario</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Ciencias Naturales - Ecosistemas"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="keywords">Palabras Clave *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Palabras clave relacionadas con el tema del cuestionario</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange("keywords", e.target.value)}
                    placeholder="Ej: Biomas, Biodiversidad, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="grade">Nivel Educativo *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>El nivel educativo al que está dirigido el cuestionario</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleInputChange("grade", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otro">Otro (especificar)</SelectItem>
                        <SelectItem value="infantil">Educación Infantil</SelectItem>
                        <SelectItem value="pre-escolar">Pre-escolar</SelectItem>
                        <SelectItem value="grado-1">Grado 1</SelectItem>
                        <SelectItem value="grado-2">Grado 2</SelectItem>
                        <SelectItem value="grado-3">Grado 3</SelectItem>
                        <SelectItem value="grado-4">Grado 4</SelectItem>
                        <SelectItem value="grado-5">Grado 5</SelectItem>
                        <SelectItem value="grado-6">Grado 6</SelectItem>
                        <SelectItem value="grado-7">Grado 7</SelectItem>
                        <SelectItem value="grado-8">Grado 8</SelectItem>
                        <SelectItem value="grado-9">Grado 9</SelectItem>
                        <SelectItem value="grado-10">Grado 10</SelectItem>
                        <SelectItem value="grado-11">Grado 11</SelectItem>
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

                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="subject">Materia *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>La materia o asignatura del cuestionario</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => handleInputChange("subject", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la materia" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="otro">Otro</SelectItem>
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
                          value={formData.customSubject}
                          onChange={(e) => handleInputChange("customSubject", e.target.value)}
                          placeholder="Escribe la materia"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="coverage">El Cuestionario Debe Cubrir *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Describe los aspectos específicos que debe cubrir el cuestionario</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="coverage"
                    value={formData.coverage}
                    onChange={(e) => handleInputChange("coverage", e.target.value)}
                    placeholder="Describe los aspectos específicos que debe cubrir el cuestionario..."
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="questionCount">Número de Preguntas *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El número de preguntas que deseas generar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="difficulty">Nivel de Dificultad *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecciona el nivel de dificultad del cuestionario</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => handleInputChange("difficulty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel de dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="isPublic">Compartir con la comunidad</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Al compartir, tu cuestionario estará disponible para otros educadores</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="isPublic" className="text-sm text-gray-700">
                      Quiero compartir este cuestionario con la comunidad educativa
                    </Label>
                  </div>
                </div>
              </motion.div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-4 text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <LoadingButton 
                  isLoading={loading}
                  loadingText="Generando cuestionario..."
                  disabled={loading || !formData.topic || !formData.keywords || !formData.grade || !formData.subject || !formData.coverage || !formData.questionCount || !formData.questionType}
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Generar Cuestionario
                </LoadingButton>
              </motion.div>
            </motion.form>

            {/* Botones para móvil */}
            {(previewResponse || questions.length > 0) && (
              <div className="lg:hidden mt-4 space-y-2">
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full"
                >
                  Ver Previsualización
                </Button>
                <Button
                  onClick={openChatModal}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mejorar con IA
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal de previsualización para móvil */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Previsualización del Cuestionario</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full">
            {showPreview ? (
              <div className="space-y-4">
                {/* Botones de exportación en el modal */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                    onClick={exportToPDF}
                    disabled={!previewResponse && questions.length === 0}
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar a PDF
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                    onClick={handleExportWord}
                    disabled={!previewResponse && questions.length === 0}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar a Word
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={shareQuiz}
                    disabled={!previewResponse && questions.length === 0}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                    onClick={openChatModal}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mejorar con IA
                  </Button>
                </div>

                <div className="border-b pb-3 mb-4 flex flex-wrap gap-2">
                  <select className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                    <option>Párrafo</option>
                    <option>Encabezado 1</option>
                    <option>Encabezado 2</option>
                    <option>Encabezado 3</option>
                  </select>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <List className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <AlignLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <Undo className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-700">
                      <Redo className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={previewRef}
                  className="min-h-[300px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-4 text-gray-700 whitespace-pre-wrap font-sans"
                  contentEditable
                  onInput={handleContentChange}
                  suppressContentEditableWarning
                >
                  {previewResponse}
                </div>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
                      <div>
                        <h3 className="font-medium text-base sm:text-lg mb-2">{question.question}</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Pregunta {question.id} de {questions.length}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleEditQuestion(question.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs sm:text-sm font-medium">
                            {String.fromCharCode(97 + index)}
                          </div>
                          <div className="flex-1 w-full">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(question.id, index, e.target.value)}
                              placeholder={`Opción ${String.fromCharCode(97 + index)}`}
                              className="w-full"
                            />
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === index}
                              onChange={() => handleCorrectAnswerChange(question.id, index)}
                              className="h-4 w-4"
                            />
                            <Label className="text-xs sm:text-sm">Correcta</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
                <LightbulbIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center mb-2">No hay preguntas generadas</p>
                <p className="text-center text-sm">
                  Configura el cuestionario en el panel derecho y genera preguntas automáticamente.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
      
      {/* Componente reutilizable de chat */}
                      <ChatImprovementModal
                  isOpen={showChatModal}
                  onClose={() => {
                    setShowChatModal(false)
                    // Limpiar el estado del chat cuando se cierra el modal
                    localStorage.removeItem('quizChatState')
                  }}
                  currentContent={getCurrentContent()}
                  onContentUpdate={handleContentUpdate}
                  title="Asistente de Mejora de Cuestionario"
                  description="Solicita mejoras específicas para tu cuestionario. El asistente te ayudará a optimizar las preguntas y respuestas."
                  suggestions={[
                    "Haz las preguntas más claras",
                    "Añade más opciones de respuesta",
                    "Cambia el nivel de dificultad",
                    "Incluye preguntas de aplicación práctica"
                  ]}
                  localStorageKey="quizChatState"
                />

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pregunta</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="editQuestionText">Pregunta</Label>
                <Textarea
                  id="editQuestionText"
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: e.target.value
                  })}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label>Opciones</Label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[index] = e.target.value;
                        setEditingQuestion({
                          ...editingQuestion,
                          options: newOptions
                        });
                      }}
                      placeholder={`Opción ${String.fromCharCode(97 + index)}`}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newOptions = editingQuestion.options.filter((_, i) => i !== index);
                        setEditingQuestion({
                          ...editingQuestion,
                          options: newOptions
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setEditingQuestion({
                      ...editingQuestion,
                      options: [...editingQuestion.options, '']
                    });
                  }}
                >
                  Añadir Opción
                </Button>
              </div>
              <div>
                <Label>Respuesta Correcta</Label>
                <Select
                  value={editingQuestion.correctAnswer.toString()}
                  onValueChange={(value) => setEditingQuestion({
                    ...editingQuestion,
                    correctAnswer: parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la respuesta correcta" />
                  </SelectTrigger>
                  <SelectContent>
                    {editingQuestion.options.map((_, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {String.fromCharCode(97 + index)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
          <DialogFooter>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
    </>
  )
}

export default function QuizBuilder() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <QuizBuilderContent />
    </Suspense>
  )
}

