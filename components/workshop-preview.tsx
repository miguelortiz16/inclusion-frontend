import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { FileDown, Share2, X, Bold, Italic, List, ListOrdered, AlignLeft, Undo, Redo, LinkIcon, CloudUpload, CloudCog, FileText } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from "sonner"
import { useRef, useState } from "react"
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { usePathname } from 'next/navigation'
import { useLanguage } from "../app/contexts/LanguageContext"

interface WorkshopPreviewProps {
  isOpen: boolean
  onClose: () => void
  workshop: {
    id: string
    tipoTaller: string 
    prompt: string
    response: string
    timestamp: string
    name: string 
    email: string
    activate: boolean
  }
  onUpdate?: () => void
}

const getWorkshopTitle = (tipoTaller: string) => {
  switch (tipoTaller) {
    case 'crear-cuestionario':
      return 'Creador de Cuestionarios'
    case 'crear-plan-de-leccion':
      return 'Planificador de Lecciones'
    case 'crear-plan-de-unidades':
      return 'Planificador de Unidades'
    case 'crear-material-educativo':
      return 'Material Educativo'
    case 'crear-contexto':
      return 'Constructor de Contexto'
    case 'generar-ideas':
      return 'Generador de Ideas'
    case 'ia-libre':
      return 'IA Libre'
    case 'beneficios-del-mundo-real':
      return 'Beneficios del Mundo Real'
    case 'generar-proyecto':
      return 'Generador de Proyectos'
    case 'generar-consigna-de-escritura':
      return 'Consignas de Escritura'
    case 'generar-informe-estudiantil':
      return 'Informes de Estudiantes'
    case 'generar-correo-para-padres':
      return 'Correos para Padres'
    case 'sopa-de-letras':
      return 'Sopa de Letras'
    default:
      return 'Taller'
  }
}

const formatContent = (content: string) => {
  // Convertir saltos de línea en <br> y mantener el formato
  return content
    .split('\n')
    .map(line => {
      // Si la línea comienza con un número y punto, es un título de sección
      if (/^\d+\./.test(line)) {
        return `<h3 class="text-sm text-gray-900 mt-6 mb-3">${line}</h3>`
      }
      // Si la línea comienza con un guión, es un punto
      if (line.trim().startsWith('-')) {
        return `<li class="ml-4 mb-2">${line.replace('-', '').trim()}</li>`
      }
      // Si la línea está vacía, es un espacio
      if (!line.trim()) {
        return '<br>'
      }
      // Si la línea comienza con "Objetivos de aprendizaje:", es un título
      if (line.startsWith('Objetivos de aprendizaje:')) {
        return `<h2 class="text-sm text-gray-900 mt-8 mb-4">${line}</h2>`
      }
      // Si la línea comienza con "Duración:", es un título
      if (line.startsWith('Duración:')) {
        return `<h2 class="text-sm text-gray-900 mt-8 mb-4">${line}</h2>`
      }
      // Si la línea comienza con "Actividades:", es un título
      if (line.startsWith('Actividades:')) {
        return `<h2 class="text-sm text-gray-900 mt-8 mb-4">${line}</h2>`
      }
      // Si la línea comienza con "Recursos:", es un título
      if (line.startsWith('Recursos:')) {
        return `<h2 class="text-sm text-gray-900 mt-8 mb-4">${line}</h2>`
      }
      // Si la línea comienza con "Metodologías activas:", es un título
      if (line.startsWith('Metodologías activas:')) {
        return `<h2 class="text-sm text-gray-900 mt-8 mb-4">${line}</h2>`
      }
      // Si la línea comienza con "Con este plan de clase", es un párrafo de cierre
      if (line.startsWith('Con este plan de clase')) {
        return `<p class="mt-6 text-gray-700">${line}</p>`
      }
      // Por defecto, es un párrafo normal
      return `<p class="text-gray-700">${line}</p>`
    })
    .join('')
}

export function WorkshopPreview({ isOpen, onClose, workshop, onUpdate }: WorkshopPreviewProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const isHistoryPage = pathname === '/history'
  console.log(workshop)
  const previewRef = useRef<HTMLDivElement>(null)
  const [editedContent, setEditedContent] = useState(workshop.response || '')
  const [formattedContent, setFormattedContent] = useState(formatContent(workshop.response || ''))
  const [isUpdating, setIsUpdating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parsear el contenido de la sopa de letras y generar la cuadrícula
  const wordSearchData = workshop.tipoTaller === 'sopa-de-letras' ? JSON.parse(workshop.response || '{}') : null
  const words = wordSearchData?.data?.words || []
  const initialGrid = wordSearchData?.data?.grid || []

  // Función para colocar una palabra en la cuadrícula
  const placeWord = (grid: string[][], word: string) => {
    const directions = [
      [0, 1],   // derecha
      [1, 0],   // abajo
      [1, 1],   // diagonal derecha abajo
      [1, -1],  // diagonal izquierda abajo
      [-1, 0],  // arriba
      [0, -1],  // izquierda
      [-1, -1], // diagonal izquierda arriba
      [-1, 1]   // diagonal derecha arriba
    ]

    const size = grid.length
    const wordUpper = word.toUpperCase()
    let placed = false
    let attempts = 0
    const maxAttempts = 200 // Aumentado de 100 a 200

    while (!placed && attempts < maxAttempts) {
      attempts++
      const direction = directions[Math.floor(Math.random() * directions.length)]
      const startX = Math.floor(Math.random() * size)
      const startY = Math.floor(Math.random() * size)

      let canPlace = true
      const newGrid = grid.map(row => [...row])

      for (let i = 0; i < wordUpper.length; i++) {
        const x = startX + direction[0] * i
        const y = startY + direction[1] * i

        if (x < 0 || x >= size || y < 0 || y >= size) {
          canPlace = false
          break
        }

        if (newGrid[x][y] !== '' && newGrid[x][y] !== wordUpper[i]) {
          canPlace = false
          break
        }
      }

      if (canPlace) {
        for (let i = 0; i < wordUpper.length; i++) {
          const x = startX + direction[0] * i
          const y = startY + direction[1] * i
          newGrid[x][y] = wordUpper[i]
        }
        placed = true
        return newGrid
      }
    }

    // Si no se pudo colocar la palabra, generar una nueva cuadrícula
    if (!placed) {
      console.warn(`No se pudo colocar la palabra "${word}" después de ${maxAttempts} intentos. Generando nueva cuadrícula...`)
      return generateEmptyGrid(size)
    }

    return grid
  }

  // Función para generar una cuadrícula vacía
  const generateEmptyGrid = (size: number) => {
    return Array(size).fill(null).map(() => Array(size).fill(''))
  }

  // Función para llenar los espacios vacíos con letras aleatorias
  const fillEmptySpaces = (grid: string[][]) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return grid.map(row => 
      row.map(cell => cell === '' ? letters[Math.floor(Math.random() * letters.length)] : cell)
    )
  }

  // Función para verificar si una palabra está en la cuadrícula
  const checkWordInGrid = (grid: string[][], word: string) => {
    const directions = [
      [0, 1],   // derecha
      [1, 0],   // abajo
      [1, 1],   // diagonal derecha abajo
      [1, -1],  // diagonal izquierda abajo
      [-1, 0],  // arriba
      [0, -1],  // izquierda
      [-1, -1], // diagonal izquierda arriba
      [-1, 1]   // diagonal derecha arriba
    ]

    const size = grid.length
    const wordUpper = word.toUpperCase()

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (const [dx, dy] of directions) {
          let found = true
          for (let k = 0; k < wordUpper.length; k++) {
            const x = i + dx * k
            const y = j + dy * k
            if (x < 0 || x >= size || y < 0 || y >= size || grid[x][y] !== wordUpper[k]) {
              found = false
              break
            }
          }
          if (found) return true
        }
      }
    }
    return false
  }

  // Usar la cuadrícula inicial o generar una nueva si no existe
  const grid = initialGrid.length > 0 ? initialGrid : generateEmptyGrid(15)

  // Colocar las palabras en la cuadrícula
  let finalGrid = grid
  let validGrid = false
  let attempts = 0
  const maxGridAttempts = 5

  while (!validGrid && attempts < maxGridAttempts) {
    attempts++
    finalGrid = words.reduce((currentGrid: string[][], word: string) => {
      return placeWord(currentGrid, word)
    }, grid)
    
    const filledGrid = fillEmptySpaces(finalGrid)
    
    // Validar que todas las palabras estén en la cuadrícula
    const missingWords = words.filter((word: string) => !checkWordInGrid(filledGrid, word))
    if (missingWords.length > 0) {
      validGrid = false
    } else {
      validGrid = true
    }
  }

  const filledGrid = fillEmptySpaces(finalGrid)
  
  // Filtrar solo las palabras que están en la cuadrícula
  const validWords = words.filter((word: string) => checkWordInGrid(filledGrid, word))

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEditedContent(content);
    setFormattedContent(formatContent(content));
  }

  const applyFormat = (format: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedContent;
    let newText = '';

    switch (format) {
      case 'bold':
        newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
        break;
      case 'italic':
        newText = text.substring(0, start) + '_' + text.substring(start, end) + '_' + text.substring(end);
        break;
      case 'list':
        const selectedText = text.substring(start, end);
        const lines = selectedText.split('\n');
        const bulletedLines = lines.map(line => line.trim() ? '- ' + line : line).join('\n');
        newText = text.substring(0, start) + bulletedLines + text.substring(end);
        break;
      case 'orderedList':
        const selectedTextOrdered = text.substring(start, end);
        const linesOrdered = selectedTextOrdered.split('\n');
        const numberedLines = linesOrdered.map((line, index) => line.trim() ? `${index + 1}. ${line}` : line).join('\n');
        newText = text.substring(0, start) + numberedLines + text.substring(end);
        break;
    }

    setEditedContent(newText);
    setFormattedContent(formatContent(newText));

    // Restaurar la selección
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start;
        textareaRef.current.selectionEnd = end + (format === 'bold' ? 4 : format === 'italic' ? 2 : 0);
      }
    }, 0);
  };

  const exportToPDF = async () => {
    if (!previewRef.current) return

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Configuración de márgenes
      const marginLeft = 20
      const marginRight = 20
      const marginTop = 20
      const marginBottom = 20
      const pageWidth = 210 // Ancho A4 en mm
      const pageHeight = 297 // Alto A4 en mm
      const contentWidth = pageWidth - marginLeft - marginRight - 10
      const maxY = pageHeight - marginTop - marginBottom - 20

      // Función para añadir encabezado
      const addHeader = () => {
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 128, 255)
        pdf.text('ProfePlanner', marginLeft, marginTop - 5)

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        pdf.text(`${getWorkshopTitle(workshop.tipoTaller || 'crear-cuestionario')}`, pageWidth / 2, marginTop - 5, { align: 'center' })

        pdf.setLineWidth(0.5)
        pdf.setDrawColor(0, 128, 255)
        pdf.line(marginLeft, marginTop, pageWidth - marginRight, marginTop)
      }

      // Función para añadir pie de página
      const addFooter = () => {
        const pageCount = pdf.getNumberOfPages()
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(128, 128, 128)
        pdf.text(
          `Página ${pageCount}`,
          pageWidth / 2,
          pageHeight - marginBottom + 5,
          { align: 'center' }
        )
      }

      // Primera página
      addHeader()
      let yPos = marginTop + 10

      // Si es una sopa de letras, dibujar la cuadrícula
      if (workshop.tipoTaller === 'sopa-de-letras' && filledGrid.length > 0) {
        const gridSize = filledGrid.length
        const cellSize = 12 // mm (reducido de 20 a 12)
        const gridWidth = gridSize * cellSize
        const startX = (pageWidth - gridWidth) / 2

        // Dibujar la cuadrícula
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const x = startX + (j * cellSize)
            const y = yPos + (i * cellSize)
            
            // Dibujar el borde de la celda con estilo similar al modal
            pdf.setDrawColor(59, 130, 246) // Color azul similar al del modal
            pdf.setLineWidth(0.3) // Reducido de 0.5 a 0.3
            pdf.rect(x, y, cellSize, cellSize)
            
            // Dibujar la letra con estilo similar al modal
            pdf.setFontSize(10) // Reducido de 16 a 10
            pdf.setTextColor(30, 64, 175) // Color azul oscuro similar al del modal
            pdf.text(filledGrid[i][j], x + cellSize/2, y + cellSize/2, { align: 'center', baseline: 'middle' })
          }
        }

        yPos += (gridSize * cellSize) + 15

        // Dibujar las palabras a encontrar con estilo similar al modal
        if (validWords.length > 0) {
          pdf.setFontSize(14)
          pdf.setTextColor(0, 0, 0) // Color negro para el título
          pdf.text('¡Palabras a encontrar!', marginLeft, yPos)
          yPos += 10

          // Calcular cuántas palabras caben por línea
          const wordsPerLine = 3
          const wordGroups = []
          for (let i = 0; i < validWords.length; i += wordsPerLine) {
            wordGroups.push(validWords.slice(i, i + wordsPerLine))
          }

          // Dibujar las palabras en grupos
          wordGroups.forEach((group: string[], index: number) => {
            const startX = marginLeft
            const groupY = yPos + (index * 12)
            
            group.forEach((word: string, wordIndex: number) => {
              const wordX = startX + (wordIndex * (pageWidth - marginLeft - marginRight) / wordsPerLine)
              pdf.setFontSize(12)
              pdf.setTextColor(0, 0, 0)
              pdf.text(word.toUpperCase(), wordX, groupY)
            })
          })

          yPos += (wordGroups.length * 12) + 20
        }
      } else {
        // Contenido normal
        const lines = editedContent.split('\n')
        for (const line of lines) {
          if (line.trim() === '') {
            yPos += 3
            continue
          }

          if (line.startsWith('Objetivos de aprendizaje:') || 
              line.startsWith('Duración:') || 
              line.startsWith('Actividades:') || 
              line.startsWith('Recursos:') || 
              line.startsWith('Metodologías activas:')) {
            
            if (yPos + 10 > maxY) {
              pdf.addPage()
              addHeader()
              yPos = marginTop + 10
            }

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(0, 128, 128)
            const splitTitle = pdf.splitTextToSize(line, contentWidth)
            pdf.text(splitTitle, marginLeft, yPos)
            yPos += (splitTitle.length * 6) + 3
            continue
          }

          if (line.trim().startsWith('-')) {
            if (yPos + 6 > maxY) {
              pdf.addPage()
              addHeader()
              yPos = marginTop + 10
            }

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(0, 0, 0)
            const splitBullet = pdf.splitTextToSize(`• ${line.replace('-', '').trim()}`, contentWidth)
            pdf.text(splitBullet, marginLeft, yPos)
            yPos += (splitBullet.length * 6) + 3
            continue
          }

          const splitText = pdf.splitTextToSize(line, contentWidth)
          const lineHeight = splitText.length * 6 + 3
          if (yPos + lineHeight > maxY) {
            pdf.addPage()
            addHeader()
            yPos = marginTop + 10
          }

          pdf.text(splitText, marginLeft, yPos)
          yPos += lineHeight
        }
      }

      // Añadir pie de página a todas las páginas
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        addFooter()
      }

      pdf.save(`taller-${workshop.id}.pdf`)
      toast.success("Documento exportado exitosamente")
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error("Error al exportar el documento")
    }
  }

  const exportToWord = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: getWorkshopTitle(workshop.tipoTaller || 'crear-cuestionario'),
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: format(new Date(workshop.timestamp), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es }),
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
            }),
            ...(workshop.tipoTaller === 'sopa-de-letras' && filledGrid.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Sopa de Letras",
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: filledGrid.map((row: string[]) => row.join(' ')).join('\n'),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "\n¡Palabras a encontrar!",
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: validWords.join(', ').toUpperCase(),
                    size: 24,
                  }),
                ],
              }),
            ] : editedContent.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 24,
                  }),
                ],
              })
            )),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taller-${workshop.id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Documento exportado a Word exitosamente");
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error("Error al exportar el documento a Word");
    }
  };

  const shareContent = async () => {
    try {
      const content = `
${getWorkshopTitle(workshop.tipoTaller || 'crear-cuestionario')}

Fecha: ${format(new Date(workshop.timestamp), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}

${editedContent}
`

      if (navigator.share) {
        await navigator.share({
          title: getWorkshopTitle(workshop.tipoTaller || 'crear-cuestionario'),
          text: content,
        })
      } else {
        await navigator.clipboard.writeText(content)
        toast.success("Contenido copiado al portapapeles")
      }
    } catch (error) {
      console.error('Error al compartir:', error)
      toast.error("Error al compartir el contenido")
    }
  }

  const handleUpdateWorkshop = async () => {
    try {
      console.log(workshop)
      setIsUpdating(true)
      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/update-Unit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: workshop.id,
          email: workshop.email || localStorage.getItem('email'),
          tipoTaller: workshop.tipoTaller || 'crear-cuestionario',
          prompt: workshop.prompt,
          response: editedContent,
          fecha: workshop.timestamp,
          name: workshop.name || 'Taller sin nombre',
          activate: workshop.activate
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el taller')
      }

      toast.success('Taller actualizado correctamente')
      onClose()
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error al actualizar el taller:', error)
      toast.error('Error al actualizar el taller')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl h-[90vh] bg-transparent p-0 border-none shadow-none">
        <div className="relative h-full flex flex-col">
          {/* Efecto de sombra y elevación */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-blue-700/10 rounded-xl shadow-2xl transform rotate-1"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-blue-700/10 rounded-xl shadow-2xl transform -rotate-1"></div>
          
          {/* Contenido principal */}
          <div className="relative bg-white rounded-xl shadow-xl h-full flex flex-col">
            <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500/20 to-blue-700/20 rounded-lg shadow-sm">
                  <FileDown className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold text-blue-900">
                    {getWorkshopTitle(workshop.tipoTaller || 'crear-cuestionario')}
                  </DialogTitle>
                  <p className="text-xs text-blue-600 mt-0.5">{t('workshop.editAndCustomize')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportToPDF}
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                  title={t('workshop.exportToPDF')}
                >
                  <FileDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </Button>
                {workshop.tipoTaller !== 'sopa-de-letras' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportToWord}
                    className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                    title={t('workshop.exportToWord')}
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareContent}
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                  title={t('workshop.shareContent')}
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </Button>
                {isHistoryPage && (
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleUpdateWorkshop}
                    className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={isUpdating}
                    title={t('workshop.saveChanges')}
                  >
                    <CloudUpload className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 sm:p-4" ref={previewRef}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-blue-500/10 to-blue-700/10 p-2 sm:p-3 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <div>
                      <span className="text-sm font-semibold text-blue-700">
                        {getWorkshopTitle(workshop.tipoTaller || 'crear-cuestionario')}
                      </span>
                      <p className="text-xs text-blue-600 mt-0.5">{t('workshop.workingDocument')}</p>
                    </div>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <span className="text-sm font-medium text-gray-600">
                      {format(new Date(workshop.timestamp), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                    <p className="text-xs text-gray-500">
                      {format(new Date(workshop.timestamp), "'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {workshop.tipoTaller === 'sopa-de-letras' && filledGrid.length > 0 && (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    {validWords.length > 0 && (
                      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg border-2 border-purple-100">
                        <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-purple-700">{t('workshop.wordsToFind')}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
                          {validWords.map((word: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-sm hover:from-purple-600 hover:to-blue-600 transition-all duration-200 text-center"
                            >
                              {word.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <div 
                        className="grid gap-0.25 p-1 bg-white rounded-lg shadow-lg border border-blue-100" 
                        style={{ 
                          gridTemplateColumns: `repeat(${filledGrid.length}, 1fr)`,
                          width: 'fit-content',
                          minWidth: '150px',
                          maxWidth: '250px'
                        }}
                      >
                        {filledGrid.map((row: string[], i: number) =>
                          row.map((cell: string, j: number) => (
                            <div
                              key={`${i}-${j}`}
                              className="aspect-square flex items-center justify-center text-[10px] sm:text-xs font-bold bg-white hover:bg-blue-50 transition-all duration-200 rounded-sm border border-blue-100"
                              style={{
                                color: '#1E40AF',
                                fontFamily: 'Arial, sans-serif',
                                minWidth: '14px',
                                minHeight: '14px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}
                            >
                              {cell}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {workshop.tipoTaller !== 'sopa-de-letras' && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-lg"></div>
                    <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                      <div className="border-b border-gray-100 p-2 flex items-center gap-1.5 bg-gray-50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-700 transition-colors" 
                          title={t('workshop.bold')}
                          onClick={() => applyFormat('bold')}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-700 transition-colors" 
                          title={t('workshop.italic')}
                          onClick={() => applyFormat('italic')}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-700 transition-colors" 
                          title={t('workshop.bulletList')}
                          onClick={() => applyFormat('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-700 transition-colors" 
                          title={t('workshop.numberedList')}
                          onClick={() => applyFormat('orderedList')}
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-gray-200 mx-1.5"></div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-700 transition-colors" 
                          title={t('workshop.undo')}
                          onClick={() => {
                            setEditedContent(workshop.response || '');
                            setFormattedContent(formatContent(workshop.response || ''));
                          }}
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                      </div>
                      <ScrollArea className="h-[500px] p-4 bg-white">
                        <textarea 
                          ref={textareaRef}
                          className="w-full prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 resize-none focus:ring-2 focus:ring-blue-500/20"
                          value={editedContent}
                          onChange={handleContentChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                            }
                          }}
                          style={{ 
                            outline: 'none',
                            minHeight: '500px',
                            height: 'auto',
                            paddingBottom: '1.5rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            padding: '1rem',
                            width: '100%',
                            overflowY: 'auto',
                            resize: 'vertical'
                          }}
                        />
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 