import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { gamificationService } from "../services/gamification";
import { FileDown, FileText } from "lucide-react";
import { exportToWord } from '@/utils/word-export';
import jsPDF from 'jspdf';
import { addLogoToFooter } from '@/utils/pdf-utils';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PricingModal } from "@/components/pricing-modal"
interface DUAModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: {
    titulo: string;
    inicio: {
      tema: string;
      actividades: string[];
    };
    desarrollo: {
      tema: string;
      actividades: string[];
    };
    cierre: {
      tema: string;
      actividades: string[];
    };
  };
  unitData: {
    nivelEducativo: string | null;
    asignatura: string;
  };
}

interface DUAResponse {
  asignatura: string;
  grado: string;
  duracion_total: string;
  objetivo_general: string;
  temas: Array<{
    nombre_tema: string;
    duracion: string;
    objetivo_especifico: string;
    principios_DUA: {
      representacion: string[];
      accion_y_expresion: string[];
      motivacion_y_compromiso: string[];
    };
    evaluacion: {
      instrumento: string;
      criterios: string[];
    };
  }>;
  adecuaciones_y_apoyos: string[];
}

export function DUAModal({ isOpen, onClose, lessonData, unitData }: DUAModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [duaData, setDuaData] = useState<DUAResponse | null>(null);
  const [topic, setTopic] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

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

  // Inicializar el topic con los temas de la lección
  useEffect(() => {
    const initialTopic = `${lessonData.inicio.tema}, ${lessonData.desarrollo.tema}, ${lessonData.cierre.tema}`;
    setTopic(initialTopic);
  }, [lessonData]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const dataToSend = {
        grade: unitData.nivelEducativo || '',
        subject: unitData.asignatura,
        theme: topic,
        name: lessonData.titulo,
        email: localStorage.getItem("email") || '',
        public: false,
        topic: topic
      };
let email=localStorage.getItem("email");
      if (!email) {
        toast.error("No se encontró el email del usuario")
        return
      }
   // Validar acceso
   const accessData = await validateAccess(email)
  
       
 if (!accessData.allowed) {
  setIsLoading(false);
  // Mostrar el modal con el mensaje de acceso
  setShowPricingModal(true)
  setAccessMessage(accessData.message || 'Necesitas una suscripción para continuar')
  onClose()
  return // Detener el flujo
}


      const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/dua', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Error al generar el DUA');
      }

      const data = await response.json();
      setDuaData(data);
      toast.success('DUA generado exitosamente');
      
      // Agregar puntos por generar DUA
      const emailUser = localStorage.getItem("email");
      if (emailUser) {
        await gamificationService.addPoints(emailUser, 15, 'dua_creation');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar el DUA');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!previewRef.current || !duaData) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Configuración básica
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 20;
      const pageWidth = 210; // Ancho A4
      const pageHeight = 297; // Alto A4
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Estilos consistentes
      const styles = {
        header: { fontSize: 16, fontStyle: 'bold' },
        subheader: { fontSize: 12, fontStyle: 'bold' },
        normal: { fontSize: 10, fontStyle: 'normal' },
        small: { fontSize: 8, fontStyle: 'normal' }
      };

      // Título y encabezado
      pdf.setFont('helvetica', styles.header.fontStyle);
      pdf.setFontSize(styles.header.fontSize);
      const title = 'Diseño Universal para el Aprendizaje (DUA)';
      const titleWidth = pdf.getStringUnitWidth(title) * styles.header.fontSize / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, marginTop);

      // Información general
      let yPos = marginTop + 15;
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      
      // Función auxiliar para agregar texto con manejo de saltos de página
      const addText = (text: string, x: number, y: number, maxWidth: number) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        if (y + (lines.length * 5) > pageHeight - marginTop) {
          pdf.addPage();
          y = marginTop;
        }
        pdf.text(lines, x, y);
        return y + (lines.length * 5);
      };

      // Información general
      yPos = addText(`Asignatura: ${duaData.asignatura}`, marginLeft, yPos, contentWidth);
      yPos = addText(`Grado: ${duaData.grado}`, marginLeft, yPos, contentWidth);
      yPos = addText(`Duración Total: ${duaData.duracion_total}`, marginLeft, yPos, contentWidth);
      yPos += 10;

      // Objetivo General
      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.setFontSize(styles.subheader.fontSize);
      yPos = addText('Objetivo General:', marginLeft, yPos, contentWidth);
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      yPos = addText(duaData.objetivo_general, marginLeft, yPos, contentWidth);
      yPos += 10;

      // Temas
      duaData.temas.forEach((tema, index) => {
        if (yPos + 50 > pageHeight - marginTop) {
          pdf.addPage();
          yPos = marginTop;
        }

        pdf.setFont('helvetica', styles.subheader.fontStyle);
        pdf.setFontSize(styles.subheader.fontSize);
        yPos = addText(`Tema ${index + 1}: ${tema.nombre_tema}`, marginLeft, yPos, contentWidth);

        pdf.setFont('helvetica', styles.normal.fontStyle);
        pdf.setFontSize(styles.normal.fontSize);
        yPos = addText(`Duración: ${tema.duracion}`, marginLeft, yPos, contentWidth);
        yPos = addText(`Objetivo Específico: ${tema.objetivo_especifico}`, marginLeft, yPos, contentWidth);

        // Principios DUA
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        yPos = addText('Principios DUA:', marginLeft, yPos, contentWidth);
        pdf.setFont('helvetica', styles.normal.fontStyle);

        // Representación
        yPos = addText('Representación:', marginLeft + 5, yPos, contentWidth - 5);
        tema.principios_DUA.representacion.forEach((item) => {
          yPos = addText(`• ${item}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        // Acción y Expresión
        yPos = addText('Acción y Expresión:', marginLeft + 5, yPos, contentWidth - 5);
        tema.principios_DUA.accion_y_expresion.forEach((item) => {
          yPos = addText(`• ${item}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        // Motivación y Compromiso
        yPos = addText('Motivación y Compromiso:', marginLeft + 5, yPos, contentWidth - 5);
        tema.principios_DUA.motivacion_y_compromiso.forEach((item) => {
          yPos = addText(`• ${item}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        // Evaluación
        pdf.setFont('helvetica', styles.subheader.fontStyle);
        yPos = addText('Evaluación:', marginLeft, yPos, contentWidth);
        pdf.setFont('helvetica', styles.normal.fontStyle);
        yPos = addText(`Instrumento: ${tema.evaluacion.instrumento}`, marginLeft + 5, yPos, contentWidth - 5);
        yPos = addText('Criterios:', marginLeft + 5, yPos, contentWidth - 5);
        tema.evaluacion.criterios.forEach((criterio) => {
          yPos = addText(`• ${criterio}`, marginLeft + 10, yPos, contentWidth - 10);
        });

        yPos += 10;
      });

      // Adecuaciones y Apoyos
      if (yPos + 50 > pageHeight - marginTop) {
        pdf.addPage();
        yPos = marginTop;
      }

      pdf.setFont('helvetica', styles.subheader.fontStyle);
      pdf.setFontSize(styles.subheader.fontSize);
      yPos = addText('Adecuaciones y Apoyos:', marginLeft, yPos, contentWidth);
      pdf.setFont('helvetica', styles.normal.fontStyle);
      pdf.setFontSize(styles.normal.fontSize);
      duaData.adecuaciones_y_apoyos.forEach((item) => {
        yPos = addText(`• ${item}`, marginLeft + 5, yPos, contentWidth - 5);
      });

      addLogoToFooter(pdf);
      pdf.save(`dua-${lessonData.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("DUA exportado exitosamente");
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el DUA");
    }
  };

  const handleExportWord = async () => {
    if (!duaData) {
      toast.error('No hay DUA para exportar');
      return;
    }

    try {
      // Preparar los datos en el formato esperado por la función exportToWord
      const content = {
        title: 'Diseño Universal para el Aprendizaje (DUA)',
        generalInfo: {
          asignatura: duaData.asignatura,
          grado: duaData.grado,
          duracion_total: duaData.duracion_total,
          objetivo_general: duaData.objetivo_general
        },
        temas: duaData.temas.map((tema) => ({
          nombre: tema.nombre_tema,
          duracion: tema.duracion,
          objetivo: tema.objetivo_especifico,
          principios: tema.principios_DUA,
          evaluacion: tema.evaluacion
        })),
        adecuaciones: duaData.adecuaciones_y_apoyos
      };

      await exportToWord(
        content,
        'Diseño Universal para el Aprendizaje (DUA)',
        `dua-${lessonData.titulo.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('DUA exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast.error('Error al exportar a Word. Por favor, intente nuevamente.');
    }
  };

  return (
    <>
    <PricingModal 
    open={showPricingModal} 
    onOpenChange={setShowPricingModal}
    accessMessage={accessMessage}
  />

    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generador de DUA</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Diseño Universal para el Aprendizaje</h3>
            {duaData && (
              <div className="flex gap-2">
                <Button
                  onClick={handleExportWord}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Word
                </Button>
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            )}
          </div>

          {!duaData && (
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic" className="text-sm font-medium">
                    Tema o objetivo de la lección
                  </Label>
                  <Textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Describe el tema o objetivo principal de la lección..."
                    className="min-h-[100px] mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Puedes editar el tema que se enviará al generador de DUA
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Generando...' : 'Generar DUA'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div ref={previewRef}>
            {duaData && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-2xl font-bold mb-4">Diseño Universal para el Aprendizaje (DUA)</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="font-semibold mb-2">Información General</h3>
                      <p><strong>Asignatura:</strong> {duaData.asignatura}</p>
                      <p><strong>Grado:</strong> {duaData.grado}</p>
                      <p><strong>Duración Total:</strong> {duaData.duracion_total}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Objetivo General</h3>
                      <p>{duaData.objetivo_general}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {duaData.temas.map((tema, index) => (
                      <div key={index} className="border-t pt-6">
                        <h3 className="text-xl font-semibold mb-4">Tema {index + 1}: {tema.nombre_tema}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p><strong>Duración:</strong> {tema.duracion}</p>
                            <p><strong>Objetivo Específico:</strong> {tema.objetivo_especifico}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Principios DUA</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h5 className="font-medium mb-2">Representación</h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {tema.principios_DUA.representacion.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium mb-2">Acción y Expresión</h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {tema.principios_DUA.accion_y_expresion.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium mb-2">Motivación y Compromiso</h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {tema.principios_DUA.motivacion_y_compromiso.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Evaluación</h4>
                            <p><strong>Instrumento:</strong> {tema.evaluacion.instrumento}</p>
                            <div>
                              <strong>Criterios:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {tema.evaluacion.criterios.map((criterio, i) => (
                                  <li key={i}>{criterio}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-semibold mb-4">Adecuaciones y Apoyos</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {duaData.adecuaciones_y_apoyos.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
} 