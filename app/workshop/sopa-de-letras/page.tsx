"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileDown, Share2, LightbulbIcon, HelpCircle } from "lucide-react"
import { toast, Toaster } from "sonner"
import { jsPDF } from "jspdf"
import { PricingModal } from "@/components/pricing-modal"
import { addLogoToFooter, addStandardHeader, addStyledParagraph, addSection, initializePDF, MARGINS } from '@/utils/pdf-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { gamificationService } from "@/app/services/gamification"
import { usePoints } from "@/app/context/PointsContext"

interface WordSearchData {
  words: string[]
  gridSize: number
}

interface WordSearchFormData {
  topic: string
  course: string
  customCourse?: string
  subject: string
  customSubject?: string
  difficulty: string
  size: string
  name: string
  isPublic: boolean
}

export default function SopaDeLetras() {
  const [loading, setLoading] = useState(false)
  const [wordSearchData, setWordSearchData] = useState<WordSearchData | null>(null)
  const [grid, setGrid] = useState<string[][]>([])
  const [solution, setSolution] = useState<string[][]>([])
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const { showPointsNotification } = usePoints()
  const [formData, setFormData] = useState<WordSearchFormData>({
    topic: "",
    course: "",
    customCourse: "",
    subject: "",
    customSubject: "",
    difficulty: "facil",
    size: "10x10",
    name: "",
    isPublic: false
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error(`Intento ${attempt} fallido:`, {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          });
          
          if (attempt < maxRetries) {
            console.log(`Reintentando... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Espera exponencial
            continue;
          }
          
          throw new Error(`Error al generar la sopa de letras: ${response.status} ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    throw lastError;
  };
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const email = localStorage.getItem("email")
      if (!email) {
        toast.error("Por favor, inicia sesión para continuar")
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


 
      const response = await fetchWithRetry(
        "https://planbackend.us-east-1.elasticbeanstalk.com/api/education/sopa-de-letras",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic:"tema "+ formData.topic+" Grado/Nivel educativo: "+(formData.course === "otro" ? formData.customCourse : formData.course)+" Materia: "+(formData.subject === "otro" ? formData.customSubject : formData.subject),
            email: email,
            name: formData.name,
            isPublic: formData.isPublic,
            grade: formData.course === "otro" ? formData.customCourse : formData.course,
            subject: formData.subject === "otro" ? formData.customSubject : formData.subject,
            difficulty: formData.difficulty,
            size: formData.size
          }),
        }
      )

      const responseData = await response.json()
      console.log("Respuesta exitosa:", responseData)
      
      if (!responseData.data || !responseData.data.words || !Array.isArray(responseData.data.words)) {
        throw new Error("Formato de respuesta inválido")
      }

      const data = responseData.data
      setWordSearchData(data)
      
      // Crear una cuadrícula simple para mostrar las palabras
      const size = Math.max(15, Math.ceil(Math.sqrt(data.words.length * 10)))
      const newGrid = Array(size).fill(null).map(() => Array(size).fill(""))
      const newSolution = Array(size).fill(null).map(() => Array(size).fill(""))
      
      // Función para verificar si una palabra cabe en una posición
      const canPlaceWord = (word: string, row: number, col: number, direction: string) => {
        if (direction === "horizontal") {
          // Verificar si hay espacio horizontal
          if (col + word.length > size) return false
          
          // Verificar si hay conflicto con otras palabras
          for (let i = 0; i < word.length; i++) {
            if (newGrid[row][col + i] !== "" && newGrid[row][col + i] !== word[i]) {
              return false
            }
          }
        } else {
          // Verificar si hay espacio vertical
          if (row + word.length > size) return false
          
          // Verificar si hay conflicto con otras palabras
          for (let i = 0; i < word.length; i++) {
            if (newGrid[row + i][col] !== "" && newGrid[row + i][col] !== word[i]) {
              return false
            }
          }
        }
        return true
      }

      // Colocar las palabras en la cuadrícula
      data.words.forEach((word: string) => {
        let placed = false
        let attempts = 0
        const maxAttempts = 100 // Evitar bucle infinito
        const upperWord = word.toUpperCase() // Convertir la palabra a mayúsculas

        while (!placed && attempts < maxAttempts) {
          const row = Math.floor(Math.random() * size)
          const col = Math.floor(Math.random() * size)
          const direction = Math.random() > 0.5 ? "horizontal" : "vertical"

          if (canPlaceWord(upperWord, row, col, direction)) {
            if (direction === "horizontal") {
              for (let i = 0; i < upperWord.length; i++) {
                newGrid[row][col + i] = upperWord[i]
                newSolution[row][col + i] = "1" // Marcar las letras que forman parte de una palabra
              }
            } else {
              for (let i = 0; i < upperWord.length; i++) {
                newGrid[row + i][col] = upperWord[i]
                newSolution[row + i][col] = "1" // Marcar las letras que forman parte de una palabra
              }
            }
            placed = true
          }
          attempts++
        }

        if (!placed) {
          console.warn(`No se pudo colocar la palabra: ${upperWord}`)
        }
      })

      // Llenar espacios vacíos con letras aleatorias en mayúsculas
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (!newGrid[i][j]) {
            const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
            newGrid[i][j] = randomLetter
            newSolution[i][j] = "0" // Marcar las letras que no forman parte de una palabra
          }
        }
      }

      // Asegurar que la solución sea exactamente igual a la cuadrícula
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (newSolution[i][j] === "") {
            newSolution[i][j] = newGrid[i][j]
          }
        }
      }

      setGrid(newGrid)
      setSolution(newSolution)
      toast.success("¡Sopa de letras generada con éxito!")


    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al generar la sopa de letras")
    } finally {
      setLoading(false)
    }
    const email = localStorage.getItem('email')
    if (!email) {
      toast.error("Por favor, inicia sesión para continuar")
      return
    }

          // Agregar puntos por generar sopa de letras
          await gamificationService.addPoints(email, 10, 'word_search_creation')
          showPointsNotification(10, 'crear una sopa de letras')
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const exportToPDF = () => {
    if (!wordSearchData || !grid.length) return;

    try {
      const pdf = initializePDF('Sopa de Letras', 'Generador de Sopas de Letras');
      
      // Agregar encabezado
      addStandardHeader(pdf, `Sopa de Letras: ${formData.topic}`, `Nivel: ${formData.course}`);
      
      let yPos = MARGINS.top + 30;
      
      // Dibujar la cuadrícula
      const cellSize = 10;
      const startX = (210 - (grid.length * cellSize)) / 2;
      
      grid.forEach((row, i) => {
        row.forEach((cell, j) => {
          const x = startX + (j * cellSize);
          const cellY = yPos + (i * cellSize);
          
          // Dibujar el borde de la celda
          pdf.setDrawColor(203, 213, 225);
          pdf.rect(x, cellY, cellSize, cellSize);
          
          // Escribir la letra centrada en la celda
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          const textWidth = pdf.getStringUnitWidth(cell) * 12 / pdf.internal.scaleFactor;
          const textX = x + (cellSize - textWidth) / 2;
          const textY = cellY + 7;
          pdf.text(cell, textX, textY);
        });
      });
      
      yPos += grid.length * cellSize + 20;
      
      // Agregar lista de palabras
      yPos = addSection(pdf, 'Palabras a encontrar', wordSearchData.words.join(', '), yPos);
      
      // Agregar logo al final
      addLogoToFooter(pdf);
      
      // Guardar el PDF
      pdf.save(`Sopa_de_Letras_${formData.topic.replace(/\s+/g, '_')}.pdf`);
      toast.success("Sopa de letras exportada exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar la sopa de letras");
    }
  };

  const exportSolutionToPDF = () => {
    if (!wordSearchData || !solution.length) return

    const doc = new jsPDF()
    
    // Título con color
    doc.setTextColor(109, 40, 217) // Púrpura
    doc.setFontSize(24)
    doc.text("¡Solución de la Sopa de Letras!", 105, 20, { align: "center" })
    
    // Cuadrícula de la solución
    const cellSize = 10
    const startX = (210 - (grid.length * cellSize)) / 2
    const startY = 40
    
    // Dibujar la cuadrícula usando la misma cuadrícula que la sopa de letras original
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        const x = startX + (j * cellSize)
        const y = startY + (i * cellSize)
        
        // Dibujar el borde de la celda
        doc.setDrawColor(203, 213, 225)
        doc.rect(x, y, cellSize, cellSize)
        
        // Si la celda es parte de una palabra en la solución, resaltarla
        if (solution[i][j] === "1") {
          doc.setFillColor(109, 40, 217) // Púrpura
          doc.rect(x, y, cellSize, cellSize, 'F')
          doc.setTextColor(255, 255, 255) // Blanco para las letras de las palabras
        } else {
          doc.setFillColor(243, 244, 246) // Gris claro
          doc.rect(x, y, cellSize, cellSize, 'F')
          doc.setTextColor(59, 130, 246) // Azul para las letras normales
        }
        
        // Escribir la letra
        doc.setFontSize(12)
        const textWidth = doc.getStringUnitWidth(cell) * 12 / doc.internal.scaleFactor
        const textX = x + (cellSize - textWidth) / 2
        const textY = y + 7
        doc.text(cell, textX, textY)
      })
    })
    
    // Lista de palabras
    const wordsStartY = startY + (grid.length * cellSize) + 20
    doc.setTextColor(109, 40, 217)
    doc.setFontSize(16)
    doc.text("¡Palabras encontradas!", 20, wordsStartY)
    
    // Dibujar las palabras
    doc.setFontSize(14)
    let y = wordsStartY + 10
    const wordsPerColumn = Math.ceil(wordSearchData.words.length / 2)
    const columnWidth = 90
    
    wordSearchData.words.forEach((word, index) => {
      const column = Math.floor(index / wordsPerColumn)
      const x = 20 + (column * columnWidth)
      const adjustedY = y + ((index % wordsPerColumn) * 10)
      
      doc.setFillColor(167, 139, 250)
      doc.circle(x + 2, adjustedY - 3, 2, 'F')
      
      doc.setTextColor(109, 40, 217)
      doc.text(word, x + 6, adjustedY)
    })

    doc.save("sopa-de-letras-solucion.pdf")
  }

  const shareContent = async () => {
    if (!wordSearchData) return

    const text = `Sopa de Letras\n\nPalabras a encontrar:\n${wordSearchData.words.join(", ")}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sopa de Letras",
          text,
        })
      } catch (error) {
        console.error("Error sharing:", error)
        // Fallback to clipboard
        await navigator.clipboard.writeText(text)
        toast.success("¡Contenido copiado al portapapeles!")
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast.success("¡Contenido copiado al portapapeles!")
    }
  }

  // Función para manejar el clic en una celda
  const handleCellClick = (row: number, col: number) => {
    // Si la celda ya está seleccionada, la deseleccionamos
    const cellIndex = selectedCells.findIndex(cell => cell.row === row && cell.col === col)
    if (cellIndex !== -1) {
      setSelectedCells(selectedCells.filter((_, index) => index !== cellIndex))
      return
    }

    // Si no hay celdas seleccionadas o la celda es adyacente a la última seleccionada
    if (selectedCells.length === 0 || isAdjacent(selectedCells[selectedCells.length - 1], {row, col})) {
      setSelectedCells([...selectedCells, {row, col}])
    }
  }

  // Función para verificar si dos celdas son adyacentes
  const isAdjacent = (cell1: {row: number, col: number}, cell2: {row: number, col: number}) => {
    const rowDiff = Math.abs(cell1.row - cell2.row)
    const colDiff = Math.abs(cell1.col - cell2.col)
    return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0)
  }

  // Función para verificar si las celdas seleccionadas forman una palabra
  const checkSelectedWord = () => {
    if (selectedCells.length < 2) return

    const word = selectedCells.map(cell => grid[cell.row][cell.col]).join('')
    const reversedWord = [...selectedCells].reverse().map(cell => grid[cell.row][cell.col]).join('')

    if (wordSearchData?.words.includes(word.toLowerCase()) && !foundWords.includes(word.toLowerCase())) {
      setFoundWords([...foundWords, word.toLowerCase()])
      toast.success(`¡Encontraste la palabra "${word}"!`)
    } else if (wordSearchData?.words.includes(reversedWord.toLowerCase()) && !foundWords.includes(reversedWord.toLowerCase())) {
      setFoundWords([...foundWords, reversedWord.toLowerCase()])
      toast.success(`¡Encontraste la palabra "${reversedWord}"!`)
    }
  }

  // Efecto para verificar la palabra cuando se seleccionan celdas
  useEffect(() => {
    if (selectedCells.length > 0) {
      checkSelectedWord()
    }
  }, [selectedCells])

  // Función para obtener las celdas de una palabra encontrada
  const getWordCells = (word: string) => {
    const cells: {row: number, col: number}[] = []
    const upperWord = word.toUpperCase()
    
    // Buscar la palabra en todas las direcciones
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid.length; j++) {
        // Horizontal
        if (j + word.length <= grid.length) {
          const horizontalWord = grid[i].slice(j, j + word.length).join('')
          if (horizontalWord === upperWord) {
            for (let k = 0; k < word.length; k++) {
              cells.push({row: i, col: j + k})
            }
          }
        }
        
        // Vertical
        if (i + word.length <= grid.length) {
          const verticalWord = Array.from({length: word.length}, (_, k) => grid[i + k][j]).join('')
          if (verticalWord === upperWord) {
            for (let k = 0; k < word.length; k++) {
              cells.push({row: i + k, col: j})
            }
          }
        }
      }
    }
    
    return cells
  }

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.topic.trim() !== "" &&
      formData.subject !== "" &&
      formData.course !== ""
    )
  }

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
        {/* Panel izquierdo - Previsualización */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden lg:block flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 border-b lg:border-r lg:border-b-0"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-between items-center mb-6"
            >
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <LightbulbIcon className="w-6 h-6 text-blue-500" />
                </motion.div>
                <h1 className="text-2xl font-bold">Sopa de Letras</h1>
              </motion.div>
              <div className="flex gap-2">
                {true && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                      onClick={exportToPDF}
                    >
                      <FileDown className="w-4 h-4" />
                      Exportar a PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-white"
                      onClick={exportSolutionToPDF}
                    >
                      <FileDown className="w-4 h-4" />
                      Exportar Solución
                    </Button>

                  </>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Guía para Crear Sopas de Letras</DialogTitle>
                      <DialogDescription>
                        <div className="space-y-4 mt-4">
                          <div>
                            <h3 className="font-medium">Consejos para el Tema:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Se específico con el tema que deseas usar</li>
                              <li>Incluye palabras relevantes y significativas</li>
                              <li>Considera el nivel educativo de los estudiantes</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium">Sugerencias de Temas:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Vocabulario de ciencias</li>
                              <li>Conceptos matemáticos</li>
                              <li>Elementos de la tabla periódica</li>
                              <li>Países y capitales</li>
                              <li>Partes del cuerpo humano</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium">Tips para el Aula:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Usa la sopa de letras como actividad de repaso</li>
                              <li>Incluye palabras clave del tema estudiado</li>
                              <li>Puedes usarla como actividad individual o en grupo</li>
                              <li>Considera el tiempo disponible para la actividad</li>
                            </ul>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            {grid.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mb-8"
              >
                <motion.div 
                  className="grid gap-2 p-6 bg-white rounded-xl shadow-lg border-2 border-blue-100" 
                  style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  {grid.map((row, i) =>
                    row.map((cell, j) => {
                      const isSelected = selectedCells.some(c => c.row === i && c.col === j)
                      const isFound = foundWords.some(word => {
                        const wordCells = getWordCells(word)
                        return wordCells.some(c => c.row === i && c.col === j)
                      })

                      return (
                        <motion.div
                          key={`${i}-${j}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.8 + (i * 0.05) + (j * 0.01) }}
                          className={`aspect-square flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-200 rounded-lg ${
                            isSelected 
                              ? 'bg-blue-500 text-white' 
                              : isFound 
                                ? 'bg-green-500 text-white' 
                                : 'bg-white hover:bg-blue-50'
                          }`}
                          style={{
                            fontFamily: 'Arial, sans-serif'
                          }}
                          whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                          onClick={() => handleCellClick(i, j)}
                        >
                          {cell}
                        </motion.div>
                      )
                    })
                  )}
                </motion.div>
              </motion.div>
            )}

            {wordSearchData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-100"
              >
                <h2 className="text-xl font-bold mb-4 text-purple-700">¡Palabras a encontrar!</h2>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="flex flex-wrap gap-2"
                >
                  {wordSearchData.words.map((word, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-bold shadow-sm hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {word.toUpperCase()}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {solution.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-8 bg-white p-6 rounded-xl shadow-lg border-2 border-purple-100"
              >
                <h2 className="text-xl font-bold mb-4 text-purple-700">Solución</h2>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                  className="grid gap-1" 
                  style={{ gridTemplateColumns: `repeat(${solution.length}, minmax(0, 1fr))` }}
                >
                  {solution.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 1.4 + (rowIndex * 0.05) + (colIndex * 0.01) }}
                        className={`aspect-square flex items-center justify-center text-lg font-bold ${
                          cell === "1" ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-gray-100'
                        } rounded-md`}
                        whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                      >
                        {grid[rowIndex][colIndex]}
                      </motion.div>
                    ))
                  ))}
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Panel derecho - Formulario */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-[400px] p-2 sm:p-4 lg:p-6 overflow-y-auto bg-gray-50"
        >
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="name">Nombre del Recurso *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Asigna un nombre descriptivo a este recurso para identificarlo fácilmente.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ej: Sopa de Letras del Sistema Solar"
                className="mt-2"
                required
                maxLength={100}
              />
              <div className="text-xs text-right mt-1 text-gray-500">{formData.name.length}/100</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="topic">Tema</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>El tema principal para generar la sopa de letras. Incluye palabras clave relacionadas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange("topic", e.target.value)}
                placeholder={`Ej: El Sistema Solar
- Sol
- Mercurio
- Venus
- Tierra
- Marte
- Júpiter
- Saturno
- Urano
- Neptuno
- Luna
- Asteroide
- Cometa`}
                className="mt-2 min-h-[200px]"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="subject">Materia *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>La materia o asignatura para la cual estás creando la sopa de letras.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.subject}
                onValueChange={(value: string) => handleInputChange("subject", value)}
                required
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2"
                >
                  <Label htmlFor="customSubject">Especifica la materia *</Label>
                  <Input
                    id="customSubject"
                    value={formData.customSubject}
                    onChange={(e) => handleInputChange("customSubject", e.target.value)}
                    placeholder="Ingresa el nombre de la materia"
                    required
                    className="mt-1"
                  />
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="grade">Grado *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>El grado o nivel educativo de los estudiantes a quienes va dirigida la sopa de letras.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.course}
                onValueChange={(value: string) => handleInputChange("course", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grado" />
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

              {formData.course === "otro" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2"
                >
                  <Label htmlFor="customCourse">Especifica el nivel educativo *</Label>
                  <Input
                    id="customCourse"
                    value={formData.customCourse}
                    onChange={(e) => handleInputChange("customCourse", e.target.value)}
                    placeholder="Ingresa el nivel educativo"
                    required
                    className="mt-1"
                  />
                </motion.div>
              )}
            </motion.div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Compartir con la comunidad de profesores
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Al marcar esta opción, tu sopa de letras será visible para otros profesores en la comunidad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isFormValid()}
              >
                {loading ? "Generando..." : "Generar Sopa de Letras"}
              </Button>
            </motion.div>

            {wordSearchData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="space-y-4"
              >
                {/* Botón para ver previsualización en móvil */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full lg:hidden"
                  onClick={() => setShowPreviewModal(true)}
                >
                  Ver Previsualización
                </Button>
              </motion.div>
            )}
          </motion.form>
        </motion.div>

        {/* Modal de previsualización para móvil */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Previsualización de la Sopa de Letras</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {grid.length > 0 && (
                <div className="mb-8">
                  <div 
                    className="grid gap-2 p-6 bg-white rounded-xl shadow-lg border-2 border-blue-100" 
                    style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
                  >
                    {grid.map((row, i) =>
                      row.map((cell, j) => (
                        <div
                          key={`${i}-${j}`}
                          className="aspect-square flex items-center justify-center text-2xl font-bold bg-white hover:bg-blue-50 transition-all duration-200 rounded-lg"
                          style={{
                            color: '#3B82F6',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          {cell}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {wordSearchData && (
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-100">
                  <h2 className="text-xl font-bold mb-4 text-purple-700">¡Palabras a encontrar!</h2>
                  <div className="flex flex-wrap gap-2">
                    {wordSearchData.words.map((word, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-bold shadow-sm hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                      >
                        {word.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {solution.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border-2 border-purple-100">
                  <h2 className="text-xl font-bold mb-4 text-purple-700">Solución</h2>
                  <div 
                    className="grid gap-1" 
                    style={{ gridTemplateColumns: `repeat(${solution.length}, minmax(0, 1fr))` }}
                  >
                    {solution.map((row, rowIndex) => (
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`aspect-square flex items-center justify-center text-lg font-bold ${
                            cell === "1" ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-gray-100'
                          } rounded-md`}
                        >
                          {grid[rowIndex][colIndex]}
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
      <Toaster />
    </Layout>
    </>
  )
} 