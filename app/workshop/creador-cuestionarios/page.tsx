"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowDown, Clock, BookOpen, FileText, Lightbulb, GraduationCap, Sparkles, CheckCircle2, BrainCircuit, BookMarked, Award, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function CreadorCuestionarios() {
  const [quizName, setQuizName] = useState("")
  const router = useRouter()

  const handleCreateQuiz = () => {
    if (quizName.trim()) {
      router.push(`/workshop/creador-cuestionarios/builder?name=${encodeURIComponent(quizName)}`)
    }
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto py-4 sm:py-16 px-2 sm:px-6"
      >
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-16"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-1 sm:gap-2 bg-blue-100 text-blue-600 px-2 sm:px-4 py-1 sm:py-2 rounded-full mb-3 sm:mb-6 text-[10px] sm:text-sm"
          >
            <Sparkles className="w-3 h-3 sm:w-5 sm:h-5" />
            <span className="font-medium">Nueva Herramienta</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl sm:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent px-2"
          >
            Creador de Cuestionarios ProfePlanner
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-sm sm:text-xl text-gray-600 max-w-2xl mx-auto px-2"
          >
            Crea evaluaciones personalizadas y efectivas para tus estudiantes
          </motion.p>
        </motion.div>

        {/* Creation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl p-3 sm:p-8 shadow-lg max-w-md mx-auto border border-gray-100 mb-6 sm:mb-16"
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6"
          >
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-semibold text-gray-800">Crea tu Cuestionario</h2>
              <p className="text-[10px] sm:text-sm text-gray-500">Comienza con un nombre descriptivo</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-3 sm:mb-6"
          >
            <label className="block text-[10px] sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Nombre del Cuestionario:</label>
            <Input
              placeholder="Ej: Evaluación de Egipto Antiguo - Grado 6"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="border-gray-200 focus:border-blue-200 focus:ring-blue-200 transition-all duration-300 text-xs sm:text-base h-8 sm:h-10"
            />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full py-2 sm:py-6 text-xs sm:text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-300 h-8 sm:h-12" 
              size="lg" 
              onClick={handleCreateQuiz}
            >
              Comenzar a Crear <ArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-5 sm:h-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Arrow Separator */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mb-6 sm:mb-16"
        >
          <div className="bg-white rounded-full p-2 sm:p-4 shadow-lg border border-gray-100">
            <ArrowDown className="w-4 h-4 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-8 mb-6 sm:mb-16"
        >
          {[
            {
              icon: <BookMarked className="w-4 h-4 sm:w-6 sm:h-6 text-blue-300" />,
              title: "Evaluación Personalizada",
              description: "Diseña cuestionarios adaptados a tus objetivos de aprendizaje y nivel educativo.",
              color: "blue"
            },
            {
              icon: <Award className="w-4 h-4 sm:w-6 sm:h-6 text-blue-300" />,
              title: "Diversos Tipos de Preguntas",
              description: "Elige entre múltiples formatos de preguntas para evaluar diferentes habilidades.",
              color: "blue"
            },
            {
              icon: <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-300" />,
              title: "Resultados Inmediatos",
              description: "Obtén análisis detallados del desempeño de tus estudiantes.",
              color: "blue"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white rounded-xl p-3 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-50 group`}
            >
              <div className="flex items-center mb-2 sm:mb-4">
                <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-sm sm:text-lg font-medium text-gray-800">{feature.title}</h3>
              </div>
              <p className="text-xs sm:text-base text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 sm:mt-16 border-t pt-4 sm:pt-8"
        >
          <div className="flex flex-col items-center">
            <h3 className="text-sm sm:text-lg font-medium text-gray-700 mb-2 sm:mb-4">Acciones Rápidas</h3>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-4">
              {[
                { icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Historial", color: "blue" },
                { icon: <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Plantillas", color: "blue" },
                { icon: <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Sugerencias", color: "blue" }
              ].map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    variant="outline" 
                    className={`flex items-center gap-1 sm:gap-2 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-200 transition-all duration-300 text-[10px] sm:text-sm h-6 sm:h-9`}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  )
}

