"use client"

import { useState, useEffect, useMemo, ReactNode, Fragment } from "react"
import { Layout } from "@/components/layout"
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { es } from "date-fns/locale"
import { format, parse, startOfWeek, getDay, add } from "date-fns"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar-custom.css"
import { useTranslations } from "@/utils/useTranslations"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, Clock, BookOpen, Info, ChevronRight, Map, Target, Star, PenTool, X, Check, AlertCircle, Eye } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface Leccion {
  dia: number
  fecha: string | null
  titulo: string
  inicio: { tema: string }
  desarrollo: { tema: string }
  cierre: { tema: string }
}

interface Unidad {
  _id: string
  nombreUnidad: string
  asignatura: string
  detallesUnidad: string
  estandaresObjetivos: string
  numeroLecciones: number
  nivelEducativo: string | null
  email: string
  lecciones: Leccion[]
  activo: boolean
}

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const parseActivity = (activity: string) => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(activity);
    // If it's an object with descripcion, return a formatted string
    if (parsed.descripcion) {
      // If it's just a description, return it directly
      if (Object.keys(parsed).length === 1) {
        return parsed.descripcion;
      }
      // Otherwise format with additional fields
      return `${parsed.descripcion}${parsed.tiempoEstimado ? ` (${parsed.tiempoEstimado})` : ''}${parsed.formato ? ` - ${parsed.formato}` : ''}${parsed.materiales ? ` - Materiales: ${parsed.materiales}` : ''}`;
    }
    return activity;
  } catch {
    // If it's not valid JSON, return the original string
    return activity;
  }
};

export default function UnitPlannerCalendar() {
  const router = useRouter()
  const t = useTranslations()
  const [units, setUnits] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [view, setView] = useState(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<any>(null)
  const [activeSubjects, setActiveSubjects] = useState<string[]>([])
  const [todayHighlighted, setTodayHighlighted] = useState(true)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailEvent, setDetailEvent] = useState<any>(null)
  const [activeLevels, setActiveLevels] = useState<string[]>([])

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const userEmail = localStorage.getItem('email')
        if (!userEmail) {
          setError('No se encontró el email del usuario. Por favor, inicie sesión nuevamente.')
          setLoading(false)
          return
        }
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/units/active?email=${userEmail}`)
        if (!response.ok) {
          throw new Error(`Error al cargar las clases: ${response.status}`)
        }
        const data = await response.json()
        console.log('Unidades cargadas:', data)
        setUnits(data)
      } catch (err) {
        console.error('Error al cargar unidades:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchUnits()
  }, [])

  // Extraer niveles educativos únicos de las unidades
  const availableLevels = useMemo(() => {
    const levels = units
      .map(unit => unit.nivelEducativo ? unit.nivelEducativo : 'No especificado')
      .filter((level): level is string => Boolean(level));
    return Array.from(new Set(levels));
  }, [units]);

  // Map lessons with date to calendar events
  const events = useMemo(() => {
    console.log('Unidades para eventos:', units)
    return units
      .flatMap(unit =>
        unit.lecciones
          .filter(lesson => lesson.fecha)
          .map(lesson => {
            // Fecha en formato dd/MM/yyyy
            const [day, month, year] = lesson.fecha!.split("/")
            const start = new Date(Number(year), Number(month) - 1, Number(day), 10, 0)
            const end = new Date(Number(year), Number(month) - 1, Number(day), 11, 0)
            return {
              title: `${lesson.titulo}`,
              start,
              end,
              resource: { 
                unit, 
                lesson,
                asignatura: unit.asignatura,
                nivelEducativo: unit.nivelEducativo || 'No especificado'
              },
            }
          })
      )
      .filter(event =>
        (activeSubjects.length === 0 || activeSubjects.includes(event.resource.asignatura)) &&
        (activeLevels.length === 0 || activeLevels.includes(event.resource.nivelEducativo ? event.resource.nivelEducativo : 'No especificado'))
      );
  }, [units, activeSubjects, activeLevels])

  // Lecciones sin fecha
  const lessonsWithoutDate = useMemo(() => {
    console.log('Buscando lecciones sin fecha en unidades:', units)
    const lessons = units.flatMap(unit =>
      unit.lecciones
        .filter(lesson => !lesson.fecha)
        .map(lesson => ({
          ...lesson,
          unitName: unit.nombreUnidad,
          subject: unit.asignatura,
          unitId: unit._id,
        }))
    )
    console.log('Lecciones sin fecha encontradas:', lessons)
    return lessons
  }, [units])

  // Handler for empty slot (to create a class)
  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setConfirmModalOpen(true);
  }

  // Handler for confirming class creation
  const handleConfirmCreateClass = () => {
    if (selectedSlot) {
      // Guardar la fecha seleccionada en localStorage
      const formattedDate = format(selectedSlot.start, 'dd/MM/yyyy');
      localStorage.setItem('selectedDate', formattedDate);
      
      // Cerrar modal y redirigir
      setConfirmModalOpen(false);
      router.push('/unit-planner');
    }
  }

  // Handler for clicking an event
  const handleSelectEvent = (event: any) => {
    setDetailEvent(event);
    setShowDetailModal(true);
  }

  const handleAssignDate = async (lesson: any) => {
    setSelectedLesson(lesson)
    setShowDatePicker(true)
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !selectedLesson) return;
    
    try {
      // Find the unit that contains this lesson
      const unit = units.find(u => u._id === selectedLesson.unitId);
      if (!unit) {
        throw new Error('No se encontró la unidad');
      }
      
      // Update the unit data
      const updatedUnit = { ...unit };
      const lessonIndex = updatedUnit.lecciones.findIndex(l => l.dia === selectedLesson.dia);
      
      if (lessonIndex !== -1) {
        // Update the lesson date
        updatedUnit.lecciones[lessonIndex].fecha = format(date, 'dd/MM/yyyy');
        
        // Save to localStorage
        localStorage.setItem('unitPlannerData', JSON.stringify(updatedUnit));
        
        // Update in the database
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/update-class`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUnit),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar la fecha');
        }
        
        // Show success dialog
        setShowSuccessDialog(true)
        
        // Close date picker
        setShowDatePicker(false)
        setSelectedLesson(null)
      }
    } catch (error) {
      console.error('Error al actualizar la fecha:', error);
      setErrorMessage('Error al actualizar la fecha. Por favor intente de nuevo.');
      setShowErrorDialog(true)
    }
  }

  const getEventColor = (asignatura: string) => {
    const colors: {[key: string]: string} = {
      'Matemáticas': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      'Lenguaje': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      'Ciencias': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      'Historia': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      'Inglés': 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      'Arte': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      'Educación Física': 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      'Música': 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
      'Tecnología': 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
      'Religión': 'linear-gradient(135deg, #854d0e 0%, #ca8a04 100%)',
    }

    return colors[asignatura] || 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
  }

  const getSubjectIcon = (asignatura: string) => {
    const icons: {[key: string]: ReactNode} = {
      'Matemáticas': <Target className="w-3.5 h-3.5" />,
      'Lenguaje': <PenTool className="w-3.5 h-3.5" />,
      'Ciencias': <Star className="w-3.5 h-3.5" />,
      'Historia': <Map className="w-3.5 h-3.5" />,
      'Inglés': <BookOpen className="w-3.5 h-3.5" />,
    }

    return icons[asignatura] || <BookOpen className="w-3.5 h-3.5" />
  }

  // Toggle subject visibility
  const toggleSubject = (subject: string) => {
    if (activeSubjects.includes(subject)) {
      setActiveSubjects(activeSubjects.filter(s => s !== subject));
    } else {
      setActiveSubjects([...activeSubjects, subject]);
    }
  }

  // Reset filters
  const resetFilters = () => {
    setActiveSubjects([]);
  }

  if (loading) {
    return <Layout>
      <div className="p-8 text-center">
        <div className="animate-pulse flex flex-col items-center justify-center">
          <div className="h-10 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-64 w-full bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    </Layout>
  }
  
  if (error) {
    return <Layout>
      <div className="p-8 text-center text-red-500">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <div className="text-xl font-semibold mb-2">Error</div>
          <div>{error}</div>
        </div>
      </div>
    </Layout>
  }

  const availableSubjects = [...new Set(units.map(unit => unit.asignatura))];

  return (
    <Layout>
      {/* Modal de confirmación */}
      <AnimatePresence>
        {confirmModalOpen && selectedSlot && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b relative">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Crear planeación de clase</h3>
                </div>
                <button 
                  onClick={() => setConfirmModalOpen(false)} 
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-slate-600 mb-2">
                  ¿Desea crear una planeación de clase para el día <span className="font-semibold text-slate-800">{format(selectedSlot.start, 'PPP', { locale: es })}</span>?
                </p>
                <p className="text-sm text-slate-500 mb-5">
                  Al continuar, deberá completar el formulario usando esta fecha.
                </p>

                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmCreateClass}
                    className="group"
                  >
                    <Check className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Crear planeación
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <CalendarIcon className="w-6 h-6 mr-2 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{t("unitPlanner.calendar.title")}</h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2"
          >
            <Button variant="outline" size="sm" onClick={() => router.push('/unit-planner/history')}>
              <Clock className="w-4 h-4 mr-2" />
              Ver Historial de clases
            </Button>
            <Button size="sm" onClick={() => router.push('/unit-planner')}>
              <Plus className="w-4 h-4 mr-2" />
             Crear Nuevas clases
            </Button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex flex-wrap gap-3 mb-2">
              {/* Filtros de asignatura */}
              {availableSubjects.map(subject => (
                <Badge 
                  key={subject}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all duration-300 border-2",
                    activeSubjects.length === 0 || activeSubjects.includes(subject) 
                      ? "bg-slate-100 border-slate-200 hover:bg-slate-200"
                      : "opacity-50 hover:opacity-80"
                  )}
                  onClick={() => toggleSubject(subject)}
                >
                  <div className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: getEventColor(subject).split(', ')[1].split(' ')[0] }}></div>
                  {subject}
                </Badge>
              ))}
              {activeSubjects.length > 0 && (
                <Badge 
                  variant="outline"
                  className="cursor-pointer border-dashed hover:bg-slate-100 text-slate-500"
                  onClick={resetFilters}
                >
                  Mostrar todas
                </Badge>
              )}
              {/* Filtros de nivel educativo */}
              {availableLevels.map(level => (
                <Badge
                  key={level}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all duration-300 border-2",
                    activeLevels.length === 0 || activeLevels.includes(level)
                      ? "bg-green-100 border-green-200 hover:bg-green-200"
                      : "opacity-50 hover:opacity-80"
                  )}
                  onClick={() => {
                    if (activeLevels.includes(level)) {
                      setActiveLevels(activeLevels.filter(l => l !== level));
                    } else {
                      setActiveLevels([...activeLevels, level]);
                    }
                  }}
                >
                  {level}
                </Badge>
              ))}
              {activeLevels.length > 0 && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-dashed hover:bg-green-100 text-green-700"
                  onClick={() => setActiveLevels([])}
                >
                  Mostrar todos los niveles
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500">
              <span className="inline-flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Filtra por asignatura o nivel educativo haciendo clic en las etiquetas
              </span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 800 }}
              views={[Views.WEEK, Views.MONTH]}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={(newView: any) => setView(newView)}
              defaultView={Views.MONTH}
              messages={{
                week: 'Semana',
                month: 'Mes',
                today: 'Hoy',
                previous: 'Anterior',
                next: 'Siguiente',
                noEventsInRange: 'No hay clases en este rango',
              }}
              culture="es"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              popup
              components={{
                toolbar: ({ label, date: currentDate, view: currentView, onNavigate, onView }) => (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => onNavigate('TODAY')} 
                        className="relative overflow-hidden"
                      >
                        <span className="relative z-10">Hoy</span>
                        <span className="absolute inset-0 bg-white opacity-20 transform -translate-x-full hover:animate-shine"></span>
                      </Button>
                      <div className="flex border rounded-md shadow-sm">
                        <Button size="sm" variant="ghost" className="rounded-r-none border-r" onClick={() => onNavigate('PREV')}>
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-l-none" onClick={() => onNavigate('NEXT')}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-semibold text-lg text-slate-800">
                      <div className="flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
                        <span className="capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant={currentView === 'week' ? 'default' : 'outline'} onClick={() => onView('week')}>
                        Semana
                      </Button>
                      <Button size="sm" variant={currentView === 'month' ? 'default' : 'outline'} onClick={() => onView('month')}>
                        Mes
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setTodayHighlighted(!todayHighlighted)}
                        className={cn(todayHighlighted ? "bg-slate-100" : "")}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ),
                event: (props) => {
                  return (
                    <span style={{ fontWeight: 600 }}>
                      {props.title}
                      {props.event.resource.nivelEducativo && (
                        <span className="ml-2 text-xs text-slate-200 bg-slate-700 rounded px-2">
                          {props.event.resource.nivelEducativo ? props.event.resource.nivelEducativo : 'No especificado'}
                        </span>
                      )}
                    </span>
                  );
                }
              }}
              formats={{
                eventTimeRangeFormat: () => '' // Ocultar el rango de tiempo para dar más espacio al título
              }}
              eventPropGetter={(event) => {
                const { asignatura } = event.resource;
                return {
                  style: {
                    backgroundColor: asignatura === 'Matemáticas' ? '#4f46e5' : 
                                     asignatura === 'Lenguaje' ? '#ec4899' :
                                     asignatura === 'Ciencias' ? '#10b981' :
                                     asignatura === 'Historia' ? '#f59e0b' :
                                     asignatura === 'Inglés' ? '#6366f1' :
                                     asignatura === 'Arte' ? '#8b5cf6' :
                                     asignatura === 'Educación Física' ? '#ef4444' :
                                     asignatura === 'Música' ? '#0ea5e9' :
                                     asignatura === 'Tecnología' ? '#0891b2' :
                                     asignatura === 'Religión' ? '#ca8a04' : '#4f46e5',
                    color: 'white',
                    padding: '4px 8px',
                    height: 'auto'
                  }
                };
              }}
              dayPropGetter={(date) => {
                const isToday = todayHighlighted && new Date().toDateString() === date.toDateString();
                return {
                  className: isToday ? 'today-highlight' : '',
                  style: isToday ? {
                    backgroundColor: 'rgba(79, 70, 229, 0.06)',
                  } : {}
                };
              }}
            />
          </div>
        </motion.div>

        {lessonsWithoutDate.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Clases sin fecha asignada
            </h2>
            <div className="space-y-3">
              {lessonsWithoutDate.map((lesson, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100 hover:border-slate-200 hover:shadow-sm cursor-pointer"
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    const unit = units.find(u => u._id === lesson.unitId);
                    if (unit) {
                      localStorage.setItem('unitPlannerData', JSON.stringify(unit));
                      router.push('/unit-planner/view');
                    }
                  }}
                >
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ background: getEventColor(lesson.subject).split(', ')[1].split(' ')[0] }}></div>
                      {lesson.titulo}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 ml-4">
                      <BookOpen className="w-3 h-3" />
                      {lesson.unitName} 
                      <span className="inline-flex px-2 text-xs py-1 rounded-full bg-slate-100">{lesson.subject}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignDate(lesson);
                    }} 
                    className="group"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                    Asignar fecha
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Leyenda de asignaturas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6"
          whileHover={{ y: -3 }}
        >
          <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2 text-slate-400" />
            Leyenda de asignaturas
          </h3>
          <div className="flex flex-wrap gap-3">
            {['Matemáticas', 'Lenguaje', 'Ciencias', 'Historia', 'Inglés', 'Arte', 'Educación Física'].map((asignatura, idx) => (
              <motion.div 
                key={asignatura} 
                className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-4 h-4 rounded-full mr-2" style={{ background: getEventColor(asignatura) }}></div>
                <span className="text-sm text-slate-700">{asignatura}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modal de selección de fecha */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-blue-600 flex items-center justify-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Seleccionar fecha para la clase
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 flex flex-col items-center justify-center">
            <p className="text-gray-600 mb-4">
              Selecciona la fecha en que impartirás la clase "{selectedLesson?.titulo}"
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedLesson?.fecha ? new Date(selectedLesson.fecha.split('/').reverse().join('-') + 'T12:00:00') : undefined}
                onSelect={handleDateSelect}
                locale={es}
                initialFocus
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600 flex items-center justify-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              ¡Fecha actualizada exitosamente!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Se ha actualizado la fecha para impartir la clase. ¿Desea ir al calendario para ver todas las fechas?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSuccessDialog(false)
                  window.location.reload()
                }}
                className="sm:flex-1"
              >
                Seguir en la vista actual
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white sm:flex-1"
                onClick={() => {
                  setShowSuccessDialog(false)
                  window.open('/unit-planner/calendar', '_blank')
                }}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Ir al calendario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de error */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error al actualizar la fecha
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              {errorMessage}
            </p>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowErrorDialog(false)}
                className="sm:flex-1"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle elegante */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-5xl w-full p-0 bg-white border-0 shadow-2xl max-h-[80vh] overflow-y-auto">
          {detailEvent && (
            <>
              <DialogTitle asChild>
                <VisuallyHidden>{detailEvent.title}</VisuallyHidden>
              </DialogTitle>
              <div className="rounded-xl overflow-hidden">
                <div className="flex justify-end items-start mb-2 px-6 pt-6">
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg rounded-full px-5 py-2 flex items-center gap-2 hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                    onClick={() => {
                      const { unit } = detailEvent.resource;
                      localStorage.setItem('unitPlannerData', JSON.stringify(unit));
                      setShowDetailModal(false);
                      router.push('/unit-planner/view');
                    }}
                  >
                    <BookOpen className="w-5 h-5 mr-1" />
                    Ver planeación completa
                  </Button>
                </div>
                <h2 className="text-2xl font-bold text-blue-600 text-center mb-6 px-6">{detailEvent.title}</h2>
                <div className="space-y-6 px-6 pb-6">
                  {/* Inicio */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-1">Inicio</h3>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Tema:</span> {detailEvent.resource.lesson.inicio.tema}</p>
                    {detailEvent.resource.lesson.inicio.actividades && (
                      <div className="mt-3">
                        <h4 className="font-medium text-blue-600 mb-1">Actividades:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.inicio.actividades.map((actividad: string, index: number) => (
                            <li key={index} className="text-gray-600">{parseActivity(actividad)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEvent.resource.lesson.inicio.recursos && (
                      <div className="mt-3">
                        <h4 className="font-medium text-blue-600 mb-1">Recursos:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.inicio.recursos.map((recurso: string, index: number) => (
                            <li key={index} className="text-gray-600">{recurso}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEvent.resource.lesson.inicio.logros && (
                      <div className="mt-3">
                        <h4 className="font-medium text-blue-600 mb-1">Logros:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.inicio.logros.map((logro: string, index: number) => (
                            <li key={index} className="text-gray-600">{logro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {/* Desarrollo */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-700 mb-2 flex items-center gap-1">Desarrollo</h3>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Tema:</span> {detailEvent.resource.lesson.desarrollo.tema}</p>
                    {detailEvent.resource.lesson.desarrollo.actividades && (
                      <div className="mt-3">
                        <h4 className="font-medium text-purple-600 mb-1">Actividades:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.desarrollo.actividades.map((actividad: string, index: number) => (
                            <li key={index} className="text-gray-600">{parseActivity(actividad)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEvent.resource.lesson.desarrollo.recursos && (
                      <div className="mt-3">
                        <h4 className="font-medium text-purple-600 mb-1">Recursos:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.desarrollo.recursos.map((recurso: string, index: number) => (
                            <li key={index} className="text-gray-600">{recurso}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEvent.resource.lesson.desarrollo.logros && (
                      <div className="mt-3">
                        <h4 className="font-medium text-purple-600 mb-1">Logros:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.desarrollo.logros.map((logro: string, index: number) => (
                            <li key={index} className="text-gray-600">{logro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {/* Cierre */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-1">Cierre</h3>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">Tema:</span> {detailEvent.resource.lesson.cierre.tema}</p>
                    {detailEvent.resource.lesson.cierre.actividades && (
                      <div className="mt-3">
                        <h4 className="font-medium text-green-600 mb-1">Actividades:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.cierre.actividades.map((actividad: string, index: number) => (
                            <li key={index} className="text-gray-600">{parseActivity(actividad)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEvent.resource.lesson.cierre.recursos && (
                      <div className="mt-3">
                        <h4 className="font-medium text-green-600 mb-1">Recursos:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.cierre.recursos.map((recurso: string, index: number) => (
                            <li key={index} className="text-gray-600">{recurso}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEvent.resource.lesson.cierre.logros && (
                      <div className="mt-3">
                        <h4 className="font-medium text-green-600 mb-1">Logros:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {detailEvent.resource.lesson.cierre.logros.map((logro: string, index: number) => (
                            <li key={index} className="text-gray-600">{logro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 bg-slate-50 border-t gap-3 md:gap-0">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)} className="w-full md:w-auto">
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes shine {
          from {transform: translateX(-100%);}
          to {transform: translateX(100%);}
        }
        
        .hover\\:animate-shine:hover {
          animation: shine 0.8s ease-in-out;
        }
        
        @keyframes pulse-animation {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .pulse-animation {
          animation: pulse-animation 0.4s ease-in-out;
        }
        
        .today-highlight {
          position: relative;
        }
        
        .today-highlight::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.6), transparent);
        }
      `}</style>
    </Layout>
  )
} 