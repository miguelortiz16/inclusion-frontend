"use client"

import React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Lightbulb,
  Sparkles,
  Star,
  Users,
  Zap,
  ArrowRight,
  Crown,
  Brain,
  Search,
  Grid3X3,
  GamepadIcon,
  PuzzleIcon,
  BrainCircuitIcon,
  GraduationCap,
  Pencil,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  Calendar,
  Rocket,
  TrendingUp,
  Clock,
  ChevronDown,
  Users2,
} from "lucide-react"
import { TypingEffect } from "@/components/TypingEffect"
import Head from "next/head"
import { DynamicHeroText } from "./components/DynamicHeroText"
import { PrivacyPolicy } from "./components/PrivacyPolicy"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "framer-motion"

export default function Home() {
  const [visitCount, setVisitCount] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date('2025-07-05T00:00:00');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds };
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateVisitCount = async () => {
      try {
        // Register visit
        const visitResponse = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/visits', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!visitResponse.ok) {
          throw new Error(`HTTP error! status: ${visitResponse.status}`);
        }

        let visitData;
        try {
          visitData = await visitResponse.json();
          console.log('Visita registrada:', visitData);
        } catch (e) {
          console.log('La respuesta no contiene JSON, pero la visita fue registrada');
        }

      } catch (error) {
        console.error('Error al actualizar el conteo de visitas:', error);
        setVisitCount(0);
      }
    };

    updateVisitCount();
  }, []);

  // Animación por sección
  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  return (
    <>
      <Head>
        <title>ProfePlanner - IA para Maestros | Magic School AI | MaestroIA | Planificación y Evaluación 10x más Rápida</title>
        <meta name="description" content="ProfePlanner es la mejor herramienta de IA para profesores. Prepara clases, evalúa y corrige 10 veces más rápido. Únete a más de 50 mil de docentes en la mejor Inteligencia Artificial con calidad pedagógica." />
        <meta name="keywords" content="IA para Maestros, Magic School AI, MaestroIA, Magic School, Docente, Maestro, Maestra, inteligencia artificial profesores" />
      </Head>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="min-h-screen flex flex-col bg-gradient-to-b from-white via-indigo-50 to-blue-100"
      >
        {/* WhatsApp Contact Button with Dropdown */}
        <div className="fixed left-4 bottom-4 z-[9999] sm:fixed">
          <div className="relative">
            {/* Main Button */}
            <button
              onClick={() => setIsContactMenuOpen(!isContactMenuOpen)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 sm:gap-4"
            >
              <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-base sm:text-lg font-semibold">¡Contáctanos!</span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isContactMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isContactMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-2">
                  {/* Direct Message Option */}
                  <a
                    href="https://wa.me/573213589463?text=Hola%2C%20me%20interesa%20ProfePlanner%20y%20quiero%20más%20información."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsContactMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Mensaje Directo</p>
                      <p className="text-sm text-gray-600">Chatea directamente con nuestro equipo</p>
                    </div>
                  </a>

                  {/* WhatsApp Group Option */}
                  <a
                    href="https://chat.whatsapp.com/C6FAoTu4kVt6Y7h0gtf2lI?mode=ac_t"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsContactMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                      <Users2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Unirse al Grupo</p>
                      <p className="text-sm text-gray-600">Conecta con otros profesores</p>
                    </div>
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Close dropdown when clicking outside */}
        {isContactMenuOpen && (
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsContactMenuOpen(false)}
          />
        )}

        {/* Barra de navegación */}
        <motion.nav
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="relative w-8 h-8 mr-2">
                    <Image src="/images/logo.png" alt="Logo" fill className="rounded-lg object-cover" />
                  </div>
                  <span className="text-lg font-display font-semibold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                    ProfePlanner
                  </span>
                </div>
                <div className="hidden md:ml-8 md:flex md:space-x-6">
                  <Link
                    href="#features"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Características
                  </Link>
                  <Link
                    href="#tools"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Herramientas
                  </Link>
                  <PrivacyPolicy />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Registrarse
                  </Button>
                </Link>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
              <div className="px-4 pt-2 pb-3 space-y-1">
                <Link
                  href="#features"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  Características
                </Link>
                <Link
                  href="#tools"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  Herramientas
                </Link>
                <div onClick={() => setIsMenuOpen(false)}>
                  <PrivacyPolicy />
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-2 px-3">
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-center">
                        Iniciar sesión
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.nav>

        <main>
          {/* Hero Section */}
          <AnimatedSection>
            <section className="relative overflow-hidden py-20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-100"></div>
              <div className="absolute inset-0 bg-[url('/images/notebook-pattern.svg')] bg-repeat opacity-[0.02]"></div>

              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8">
                    <div className="inline-block bg-gradient-to-r from-indigo-100 to-blue-100 px-4 py-2 rounded-full">
                      <span className="text-indigo-700 text-sm font-medium">✨ ¿Cansado de la pila de papeles?</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                      <span className="text-blue-900 drop-shadow">
                        Libera tu tiempo con IA
                      </span>
                    </h1>

                    <p className="text-xl text-gray-600 leading-relaxed">
                      Automatiza tareas repetitivas con IA y dedica tu energía a lo que amas: enseñar e inspirar.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href="/sign-up">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                        >
                          Comenzar Ahora
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-full shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Seguro para escuelas</span>
                      </div>
                      <div className="flex items-center bg-gradient-to-r from-indigo-100 to-blue-100 px-4 py-2 rounded-full shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Privacidad garantizada</span>
                      </div>
                      <div className="flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-full shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Soporte 24/7</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="relative bg-white p-8 rounded-2xl shadow-xl">
                      <video
                        src="/images/profeplanner.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        width={500}
                        height={500}
                        className="w-full h-auto rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Features Section */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-b from-purple-50 to-indigo-100" id="premium-tools">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Herramientas Premium que Transforman tu Enseñanza
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Accede a las funciones más avanzadas y ahorra horas de trabajo cada semana.
                  </p>
                </div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <ToolFeatureCard
                    icon={<Pencil className="w-8 h-8 text-green-500" />}
                    title="Planificador de Lecciones con IA"
                    description="Prepara clases en minutos con metodologías innovadoras y personalizadas."
                  />
                  <ToolFeatureCard
                    icon={<Lightbulb className="w-8 h-8 text-yellow-500" />}
                    title="Generador de Ideas y Actividades"
                    description="Obtén ideas creativas y actividades listas para usar en clase."
                  />
                  <ToolFeatureCard
                    icon={<FileText className="w-8 h-8 text-indigo-600" />}
                    title="Creador de Cuestionarios Inteligentes"
                    description="Genera exámenes, rúbricas y listas de cotejo automáticamente."
                  />
                  <ToolFeatureCard
                    icon={<BookOpen className="w-8 h-8 text-blue-600" />}
                    title="Generador de Imágenes Educativas"
                    description="Crea imágenes y materiales visuales únicos para tus clases con IA."
                  />
                  <ToolFeatureCard
                    icon={<Brain className="w-8 h-8 text-purple-600" />}
                    title="Generador de Podcasts Educativos"
                    description="Convierte tus materiales en podcasts interactivos para tus estudiantes."
                  />
                  <ToolFeatureCard
                    icon={<CheckCircle2 className="w-8 h-8 text-violet-500" />}
                    title="Corrección Automática de Ensayos"
                    description="Califica ensayos y pruebas en segundos con IA."
                  />
                </motion.div>
                <div className="text-center mt-12">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      ¡Quiero acceso ilimitado!
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Video Tutorial */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-b from-blue-100 to-indigo-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Aprende a usar ProfePlanner
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Mira nuestro video tutorial y descubre cómo ProfePlanner puede transformar tu experiencia docente
                  </p>
                </div>
                <div className="aspect-video max-w-4xl mx-auto rounded-xl overflow-hidden shadow-xl">
                  <iframe
                    src="https://www.youtube.com/embed/1YZPk352zd0"
                    title="Tutorial ProfePlanner"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Pricing Section */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-b from-indigo-50 to-blue-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Planes de Suscripción
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Elige el plan que mejor se adapte a tus necesidades
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {/* Plan Básico */}
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-xl scale-100 md:scale-105">
                    <div className="p-6">
                      <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Plan Básico</h3>
                      <p className="text-slate-600 mb-6 text-sm">Ideal para empezar</p>


                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Acceso a funcionalidades básicas</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">5 créditos mensuales</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Recursos básicos</span>
                        </li>
                      </ul>

                      <Link href="/sign-up">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-10 text-base font-medium transition-all duration-300"
                          size="lg"
                        >
                          Comenzar Ahora
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Plan Mensual */}
                  <div className="bg-white rounded-xl shadow-lg border border-indigo-500 relative scale-100 md:scale-105 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        Más Popular
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Plan Profesional Mensual</h3>
                      <p className="text-slate-600 mb-6 text-sm">Acceso completo a todas las herramientas</p>

                      <div className="mb-6">
                        <div className="text-center">
                          <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            $6.00
                          </span>
                          <span className="text-slate-500">/mes USD</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Acceso ilimitado a todas las funcionalidades</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Generación ilimitada de clases</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Recursos premium</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Soporte prioritario</span>
                        </li>
                      </ul>

                      <Link href="/sign-up">
                        <Button
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-10 text-base font-medium transition-all duration-300"
                          size="lg"
                        >
                          ¡Prueba gratis de 7 días!
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Plan Anual */}
                  <div className="bg-white rounded-xl shadow-lg border border-indigo-500 relative scale-100 md:scale-105 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        Mejor Valor
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Plan Profesional Anual</h3>
                      <p className="text-slate-600 mb-6 text-sm">Acceso completo a todas las herramientas precio de lanzamiento</p>

                      <div className="mb-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              $29.99
                            </span>
                            <span className="text-slate-500">/año USD</span>
                          </div>
                          <div className="text-sm text-emerald-600 font-medium">
                            ¡Ahorra 60% - $42.1 USD al año!
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            $2.49 USD/mes
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Acceso ilimitado a todas las funcionalidades</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Generación ilimitada de clases</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Recursos premium</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Soporte prioritario</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">¡Ahorra más del 60%!</span>
                        </li>
                      </ul>

                      <Link href="/sign-up">
                        <Button
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-10 text-base font-medium transition-all duration-300"
                          size="lg"
                        >
                          ¡Prueba gratis de 7 días!
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Plan para Escuelas centrado en una fila aparte */}
                <div className="flex justify-center mt-16">
                  <div className="bg-white rounded-xl shadow-lg border border-indigo-500 relative scale-100 md:scale-105 transition-all duration-300 hover:shadow-xl min-h-[600px] w-full max-w-md flex flex-col justify-center mx-auto">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        Recomienda tu escuela
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Plan para Escuelas</h3>
                      <p className="text-slate-600 mb-6 text-sm">Obtén profePlanner gratis y conviértete en la sensación entre los profesores</p>
                      <div className="mb-6">
                        <div className="text-center">
                          <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Bajo consulta
                          </span>
                          <span className="text-slate-500 block mt-1">Precio especial para instituciones</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Acceso para toda la escuela</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Capacitación y soporte personalizado</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-700">
                          <div className="mt-0.5 p-1 rounded-full bg-indigo-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="text-slate-600 text-sm">Promociones exclusivas</span>
                        </li>
                      </ul>
                      <a
                        href="https://wa.me/573213589463?text=Hola%2C%20quiero%20recomendar%20ProfePlanner%20en%20mi%20escuela%20y%20conocer%20los%20beneficios%20para%20instituciones."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-10 text-base font-medium transition-all duration-300"
                          size="lg"
                        >
                          Hablemos por WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>



          {/* Herramientas Destacadas */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-b from-indigo-50 to-blue-100" id="tools">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Enseñar es exigente. El agotamiento es real.
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Transforma estos desafíos en oportunidades de crecimiento real para tus estudiantes, recuperando tu tiempo y energía.
                  </p>
                </div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <ToolFeatureCard
                    icon={<FileText className="w-8 h-8 text-indigo-600" />}
                    title="Planificación de Lecciones"
                    description="Prepara clases rápidamente con 5 metodologías de enseñanza. Planificación anual en minutos."
                  />
                  <ToolFeatureCard
                    icon={<BookOpen className="w-8 h-8 text-blue-600" />}
                    title="Evaluaciones Inteligentes"
                    description="+500k preguntas con clave de respuestas, preguntas originales e inéditas, exámenes de ingreso."
                  />
                  <ToolFeatureCard
                    icon={<Brain className="w-8 h-8 text-indigo-600" />}
                    title="Materiales Educativos"
                    description="Crea materiales con Inteligencia Artificial. +50 herramientas, planificación y producción de contenido."
                  />
                </motion.div>
              </div>
            </section>
          </AnimatedSection>

          {/* Cronograma */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-b from-blue-100 to-indigo-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Cronograma de Lanzamiento
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Únete ahora y disfruta de acceso completo a todas las herramientas de ProfePlanner
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-lg flex items-center justify-center mr-4">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Fase 1: Acceso Anticipado</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Acceso completo a todas las herramientas de ProfePlanner. Únete a la comunidad pionera de educadores.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-100 to-blue-100 p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-200 to-blue-200 rounded-lg flex items-center justify-center mr-4">
                        <Rocket className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Fase 2: Lanzamiento Oficial</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Lanzamiento oficial de la plataforma con todas las funcionalidades completas y optimizadas.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-lg flex items-center justify-center mr-4">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Fase 3: Expansión</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Nuevas funcionalidades avanzadas y herramientas especializadas para diferentes niveles educativos.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Testimonios */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-b from-indigo-50 to-blue-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Lo que dicen los profesores
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Experiencias reales de educadores que transformaron su enseñanza
                  </p>
                </div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                  variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <TestimonialCard
                    quote="He recuperado mi tiempo personal gracias a ProfePlanner. Ahora puedo dedicar más tiempo a mis estudiantes."
                    author="María González"
                    role="Profesora de Primaria"
                  />
                  <TestimonialCard
                    quote="Las evaluaciones generadas son increíblemente precisas y adaptadas a mis estudiantes."
                    author="Carlos Rodríguez"
                    role="Profesor de Secundaria"
                  />
                  <TestimonialCard
                    quote="La variedad de herramientas me permite crear experiencias de aprendizaje únicas."
                    author="Ana Martínez"
                    role="Profesora Universitaria"
                  />
                </motion.div>
              </div>
            </section>
          </AnimatedSection>

          {/* CTA Section */}
          <AnimatedSection>
            <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                    Únete a la Revolución Docente con IA
                  </h2>
                  <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                    Sé parte de esta comunidad pionera y transforma tu experiencia docente con ProfePlanner.
                  </p>
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Comenzar Ahora
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </AnimatedSection>
        </main>

        {/* Footer */}
        <motion.footer
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="bg-gradient-to-b from-white to-indigo-50 border-t border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="relative w-8 h-8 mr-2 overflow-hidden rounded-lg">
                    <video
                      src="/images/profeplanner.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-lg font-display font-semibold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                    ProfePlanner
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 max-w-md">
                  La plataforma de IA  diseñada específicamente para profesores, que te ayuda a planificar, evaluar y
                  crear materiales educativos de alta calidad.
                </p>
                <div className="flex space-x-4">
                  <a href="https://www.facebook.com/share/199nVH2cfN/" className="text-gray-400 hover:text-blue-600 transition-colors duration-200">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/profe_planner.educacion/" className="text-gray-400 hover:text-blue-600 transition-colors duration-200">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Producto</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      Características
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      Precios
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      Testimonios
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Empresa</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      Sobre nosotros
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      Contacto
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                &copy; {new Date().getFullYear()} ProfePlanner. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </motion.footer>
      </motion.div>
    </>
  )
}

// AnimatedSection helper
function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className=""
    >
      {children}
    </motion.section>
  );
}

// ToolFeatureCard y TestimonialCard animados
function ToolFeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-xl shadow-sm border border-gray-200"
    >
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-lg flex items-center justify-center mr-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-xl shadow-sm border border-gray-200"
    >
      <div className="flex items-center mb-4">
        <Star className="w-5 h-5 text-indigo-400" />
        <Star className="w-5 h-5 text-indigo-400" />
        <Star className="w-5 h-5 text-indigo-400" />
        <Star className="w-5 h-5 text-indigo-400" />
        <Star className="w-5 h-5 text-indigo-400" />
      </div>
      <p className="text-gray-600 mb-6 leading-relaxed">{quote}</p>
      <div>
        <p className="font-semibold text-gray-900">{author}</p>
        <p className="text-gray-500 text-sm">{role}</p>
      </div>
    </motion.div>
  )
} 