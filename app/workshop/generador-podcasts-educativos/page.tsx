"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { RiMicFill, RiQuestionLine } from "react-icons/ri"
import { motion } from "framer-motion"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { PricingModal } from "@/components/pricing-modal"

const PixelationEffect = () => {
  return (
    <div className="relative w-full h-[300px] bg-gray-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-400/20 animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  )
}

interface PodcastFormData {
  topic: string;
  studentLevel: string;
  file?: File | null;
}

// Función para leer contenido de archivos PDF
const readPDFContent = async (file: File): Promise<string> => {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configurar el worker para Next.js
    if (typeof window !== 'undefined') {
      // Usar una URL más confiable para el worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error reading PDF:', error);
    
    // Si falla PDF.js, mostrar opción de entrada manual
    console.log('PDF no pudo ser leído automáticamente');
    throw new Error('PDF_NO_READABLE');
  }
};

// Función para leer contenido de archivos Word
const readWordContent = async (file: File): Promise<string> => {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value.trim();
  } catch (error) {
    console.error('Error reading Word document:', error);
    throw new Error('Error al leer el archivo Word');
  }
};

// Función para leer contenido de archivo según su tipo
const readFileContent = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return await readPDFContent(file);
  } else if (file.type === 'application/msword' || 
             file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await readWordContent(file);
  } else {
    throw new Error('Tipo de archivo no soportado');
  }
};

export default function PodcastGenerator() {
  const [formData, setFormData] = useState<PodcastFormData>({
    topic: "",
    studentLevel: "",
    file: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [audioData, setAudioData] = useState<string>("")
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState("")
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [scriptText, setScriptText] = useState<string>("")
  const [fileContent, setFileContent] = useState<string>("")
  const [isReadingFile, setIsReadingFile] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualContent, setManualContent] = useState<string>("")
  const [showPdfErrorAlert, setShowPdfErrorAlert] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Monitorear cambios en el estado del formulario
  useEffect(() => {
    console.log("formData changed:", formData);
  }, [formData]);

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

  const handleInputChange = (field: keyof PodcastFormData, value: string | File | null) => {
    console.log("handleInputChange called:", field, value);
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log("handleFileChange called with file:", file);
    
    if (!file) {
      console.log("No file selected, setting file to null");
      setFormData(prev => ({ ...prev, file: null }));
      setFileContent("");
      return;
    }

    console.log("File selected:", file.name, "Type:", file.type, "Size:", file.size);

    // Simplificar la validación - solo verificar el tipo de archivo
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"
    ];

    if (allowedTypes.includes(file.type)) {
      console.log("File type is allowed, reading content...");
      setIsReadingFile(true);
      
      try {
        const content = await readFileContent(file);
        console.log("File content read successfully, length:", content.length);
        setFileContent(content);
        setFormData(prev => {
          console.log("Updating formData with file:", file.name);
          return { ...prev, file };
        });
        toast.success("Archivo leído correctamente");
      } catch (error) {
        console.error("Error reading file content:", error);
        
        if (error instanceof Error && error.message === 'PDF_NO_READABLE') {
          // Mostrar opción de entrada manual para PDFs
          setShowPdfErrorAlert(true);
          setShowManualInput(true);
          setFormData(prev => ({ ...prev, file }));
        } else {
          toast.error("Error al leer el contenido del archivo");
          setFormData(prev => ({ ...prev, file: null }));
          setFileContent("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } finally {
        setIsReadingFile(false);
      }
    } else {
      console.log("File type not allowed:", file.type);
      toast.error("Solo se permiten archivos PDF y Word (.doc, .docx)");
      setFormData(prev => ({ ...prev, file: null }));
      setFileContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log("fileToBase64 called with file:", file.name, "Size:", file.size);
      
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
      
      const reader = new FileReader()
      
      reader.onload = () => {
        console.log("FileReader onload triggered");
        try {
          const result = reader.result as string;
          if (!result) {
            reject(new Error("No result from FileReader"));
            return;
          }
          
          // Remove the data:...;base64, prefix
          const base64 = result.split(',')[1]
          if (!base64) {
            reject(new Error("Invalid base64 data"));
            return;
          }
          
          console.log("Base64 conversion completed, length:", base64.length);
          resolve(base64)
        } catch (error) {
          console.error("Error processing FileReader result:", error);
          reject(error)
        }
      }
      
      reader.onerror = error => {
        console.error("FileReader error:", error);
        reject(error)
      }
      
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted, current formData:", formData);
    setIsLoading(true)
    setIsAudioLoading(true)
    setAudioData("")
    setScriptText("")
    let emailUser = localStorage.getItem("email")
    if (!emailUser) {
      toast.error("No se encontró el email del usuario")
      setIsLoading(false)
      setIsAudioLoading(false)
      return
    }

    const accessData = await validateAccess(emailUser)
    if (!accessData.allowed || accessData.message?.includes("(3/5)") || accessData.message?.includes("(4/5)") || accessData.message?.includes("(5/5)")) {
      setIsLoading(false)
      setIsAudioLoading(false)
      setShowPricingModal(true)
      setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
      return
    }

    let documentBase64 = undefined
    let documentFileName = undefined
    console.log("formData.file in handleSubmit:", formData.file);
    if (formData.file) {
      try {
        console.log("Converting file to base64:", formData.file.name);
        documentBase64 = await fileToBase64(formData.file)
        documentFileName = formData.file.name
        console.log("File converted to base64, length:", documentBase64?.length);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        toast.error("Error al procesar el archivo");
        setIsLoading(false)
        setIsAudioLoading(false)
        return
      }
    } else {
      console.log("No file selected for upload");
    }

    try {
      // Concatenar el contenido del archivo al topic si existe
      let enhancedTopic = formData.topic;
      if (fileContent && fileContent.trim()) {
        enhancedTopic = `${formData.topic}\n\nContenido del archivo:\n${fileContent}`;
        console.log("Enhanced topic with file content, total length:", enhancedTopic.length);
      }

      // 1. PRIMERA PETICIÓN: Generar el guion
      const scriptRequest = {
        topic: enhancedTopic,
        studentLevel: formData.studentLevel,  
        email: emailUser
      };

      console.log("Sending script request:", {
        topic: scriptRequest.topic.substring(0, 200) + "...", // Mostrar solo los primeros 200 caracteres
        studentLevel: scriptRequest.studentLevel,
        email: scriptRequest.email
      });

      const scriptResponse = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/v1/podcast/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scriptRequest),
      });

      if (!scriptResponse.ok) {
        const errorText = await scriptResponse.text();
        throw new Error('Error al generar el guion: ' + errorText);
      }

      const scriptText = await scriptResponse.text();
      setScriptText(scriptText); // <-- Guarda el guion en el estado

      // 2. SEGUNDA PETICIÓN: Generar el audio a partir del guion
      const audioRequest = {
        script: scriptText
      };

      const audioResponse = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/v1/podcast/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(audioRequest),
      });

      if (!audioResponse.ok) {
        const errorText = await audioResponse.text();
        throw new Error('Error al generar el audio: ' + errorText);
      }

      const base64Data = await audioResponse.text();
      if (!base64Data) {
        throw new Error('No se encontró audio en la respuesta del backend');
      }
      const wavBase64 = pcm16ToWavBase64(base64Data, 24000, 1);
      setAudioData(wavBase64);
      toast.success('Podcast generado exitosamente');
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar el podcast')
    } finally {
      setIsLoading(false)
      setIsAudioLoading(false)
    }
  }

  const downloadAudio = () => {
    if (!audioData) return
    const link = document.createElement('a')
    link.href = `data:audio/wav;base64,${audioData}`
    link.download = `podcast-educativo-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.wav`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Podcast descargado exitosamente")
  }

  const downloadAudioAsMp3 = async () => {
    if (!audioData) return;

    // Decodifica el base64 WAV a ArrayBuffer
    const wavBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer;

    // Extrae los datos PCM del WAV (omite cabecera de 44 bytes)
    const wavView = new DataView(wavBuffer);
    const pcmData = new Int16Array(wavBuffer, 44);

    // Importación dinámica de lamejs SOLO cuando se usa
    const lamejs = await import("lamejs");
    const sampleRate = wavView.getUint32(24, true); // offset 24, little endian
    const numChannels = wavView.getUint16(22, true); // offset 22, little endian
    const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);

    // Codifica a MP3
    const mp3Data = [];
    let remaining = pcmData.length;
    const maxSamples = 1152;
    for (let i = 0; remaining >= maxSamples; i += maxSamples) {
      const mono = pcmData.subarray(i, i + maxSamples);
      const mp3buf = mp3Encoder.encodeBuffer(mono);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
      remaining -= maxSamples;
    }
    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    // Une los fragmentos MP3
    const blob = new Blob(mp3Data, { type: "audio/mp3" });
    const url = URL.createObjectURL(blob);

    // Descarga el archivo
    const link = document.createElement("a");
    link.href = url;
    link.download = `podcast-educativo-${formData.topic.toLowerCase().replace(/\s+/g, '-')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Podcast MP3 descargado exitosamente");
  };

  const isFormValid = () => {
    return formData.topic && formData.studentLevel && !isReadingFile && (!showManualInput || manualContent.trim())
  }

  return (
    <>
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal}
        accessMessage={accessMessage}
      />
      
      {/* Alert Dialog para error de PDF */}
      <Dialog open={showPdfErrorAlert} onOpenChange={setShowPdfErrorAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-orange-500">⚠️</span>
              Error al leer PDF
            </DialogTitle>
            <DialogDescription className="text-left">
              <p className="mb-4">
                El archivo PDF no pudo ser leído automáticamente. Esto puede deberse a:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-4">
                <li>El PDF está protegido o encriptado</li>
                <li>El PDF contiene principalmente imágenes</li>
                <li>Problemas de compatibilidad con el navegador</li>
              </ul>
              <p className="text-sm">
                <strong>Solución:</strong> Puedes copiar y pegar el contenido del PDF en el campo que aparecerá debajo.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setShowPdfErrorAlert(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Layout>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row h-screen"
        >
          {/* Panel izquierdo - Previsualizador */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:block flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 border-b lg:border-r lg:border-b-0"
          >
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-between items-center mb-6"
            >
              <div className="flex items-center gap-4">
                <RiMicFill className="w-8 h-8 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900">Generador de Podcasts Educativos</h1>
              </div>
              {audioData && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none"
                    onClick={downloadAudio}
                  >
                    Descargar Podcast
                  </Button>
       
                </div>
              )}
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative"
            >
              {isAudioLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px] w-full">
                  <div className="mb-4 animate-pulse text-blue-600 font-semibold text-lg text-center">
                    Generando tu podcast educativo...<br />
                    Esto puede demorar unos minutos, por favor espera.
                  </div>
                  <PixelationEffect />
                </div>
              ) : audioData ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg border p-6 flex flex-col items-center"
                >
                  <audio controls src={`data:audio/wav;base64,${audioData}`} className="w-full max-w-lg" />
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none"
                    onClick={downloadAudio}
                  >
                    Descargar Podcast
                  </Button>
                  {/*
                    <Button 
                      variant="outline" 
                      className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none"
                      onClick={downloadAudioAsMp3}
                    >
                      Descargar Podcast en MP3
                    </Button>
                    */}
                  {scriptText && (
                    <div className="mt-6 w-full max-w-lg">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Guion generado</h3>
                      <pre className="bg-gray-50 border rounded p-4 text-gray-700 whitespace-pre-wrap text-sm overflow-x-auto max-h-64">
                        {scriptText}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[300px]"
                >
                  <RiMicFill className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No hay podcast generado</p>
                  <p className="text-center text-sm">
                    Completa el formulario de la derecha para generar un podcast educativo.
                  </p>
                  {scriptText && (
                    <div className="mt-6 w-full max-w-lg">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Guion generado</h3>
                      <pre className="bg-gray-50 border rounded p-4 text-gray-700 whitespace-pre-wrap text-sm overflow-x-auto max-h-64">
                        {scriptText}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Panel derecho - Formulario */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full lg:w-[400px] p-2 sm:p-4 lg:p-6 overflow-y-auto bg-gray-50"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg border shadow-sm p-4 sm:p-6"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex justify-between items-center mb-6"
              >
                <h2 className="text-xl font-semibold">Generador de Podcasts</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <RiQuestionLine className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Guía para Generar Podcasts Educativos</DialogTitle>
                      <DialogDescription>
                        <div className="space-y-4 mt-4">
                          <div>
                            <h3 className="font-medium">Información Requerida:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Tema del podcast</li>
                              <li>Nivel educativo del estudiante</li>
                              <li>Archivo PDF o Word (opcional)</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium">Características del podcast:</h3>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Audio en formato MP3</li>
                              <li>Contenido adaptado al nivel educativo</li>
                              <li>Duración y estilo apropiados para el contexto educativo</li>
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
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="topic">Tema del Podcast</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Describe el tema principal del podcast</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => handleInputChange("topic", e.target.value)}
                      placeholder="Ej: La Revolución Francesa, El ciclo del agua..."
                      className="min-h-[80px]"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="studentLevel">Nivel Educativo</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ej: primaria, secundaria, bachillerato, universidad...</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="studentLevel"
                      value={formData.studentLevel}
                      onChange={(e) => handleInputChange("studentLevel", e.target.value)}
                      placeholder="Ej: primaria, secundaria, bachillerato..."
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="file">Archivo PDF o Word (opcional)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RiQuestionLine className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sube un archivo PDF o Word y su contenido se incluirá automáticamente en la generación del podcast junto con el tema que especifiques</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      💡 El contenido del archivo se combinará con el tema para crear un podcast más completo y contextualizado.
                      <br />
                      <span className="text-orange-600">⚠️ Nota: Si tienes problemas con archivos PDF, considera usar archivos Word (.doc, .docx) que son más compatibles.</span>
                    </div>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={isReadingFile}
                    />
                    {isReadingFile && (
                      <div className="text-xs text-blue-600 mt-1">
                        Leyendo contenido del archivo...
                      </div>
                    )}
                    {formData.file && !isReadingFile && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div className="flex items-center justify-between">
                          <span>Archivo seleccionado: {formData.file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, file: null }));
                              setFileContent("");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            Limpiar
                          </Button>
                        </div>
                        {fileContent && (
                          <div className="mt-2">
                            <div className="font-medium text-gray-700">Contenido leído ({fileContent.length} caracteres):</div>
                            <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                              {fileContent.substring(0, 200)}...
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Opción de entrada manual para PDFs */}
                    {showManualInput && (
                      <div className="grid gap-2 mt-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="manualContent">Contenido del PDF (ingresa manualmente)</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setShowManualInput(false);
                              setManualContent("");
                              setFileContent("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                        <Textarea
                          id="manualContent"
                          value={manualContent}
                          onChange={(e) => {
                            setManualContent(e.target.value);
                            setFileContent(e.target.value);
                          }}
                          placeholder="Copia y pega aquí el contenido del PDF..."
                          className="min-h-[100px]"
                        />
                        <div className="text-xs text-gray-500">
                          {manualContent.length} caracteres ingresados
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <Button 
                    type="submit" 
                    disabled={isLoading || !isFormValid()}
                    className={`w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white ${
                      !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-blue-900'
                    }`}
                  >
                    {isLoading ? "Generando..." : isReadingFile ? "Leyendo archivo..." : "Generar Podcast"}
                  </Button>
                </motion.div>
              </motion.form>
            </motion.div>
          </motion.div>
        </motion.div>
      </Layout>
    </>
  )
}

// Utilidad para convertir PCM16 base64 a WAV base64
function pcm16ToWavBase64(pcmBase64: string, sampleRate = 24000, numChannels = 1) {
  // Decodificar base64 a ArrayBuffer
  const pcmBinary = atob(pcmBase64)
  const pcmLength = pcmBinary.length
  const buffer = new ArrayBuffer(44 + pcmLength)
  const view = new DataView(buffer)

  // Escribir cabecera WAV
  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + pcmLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, 1, true) // AudioFormat PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true) // ByteRate
  view.setUint16(32, numChannels * 2, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample
  writeString(view, 36, 'data')
  view.setUint32(40, pcmLength, true)

  // Escribir datos PCM
  for (let i = 0; i < pcmLength; i++) {
    view.setUint8(44 + i, pcmBinary.charCodeAt(i))
  }

  // Convertir a base64 para usar en src="data:audio/wav;base64,..."
  const wavBytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < wavBytes.byteLength; i++) {
    binary += String.fromCharCode(wavBytes[i])
  }
  return btoa(binary)
} 