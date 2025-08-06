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
  Heart,
  Shield,
  Globe,
  Target,
  Award,
  Accessibility,
  Eye,
  Ear,
  HandHeart,
} from "lucide-react"
import { TypingEffect } from "@/components/TypingEffect"
import Head from "next/head"
import { DynamicHeroText } from "./components/DynamicHeroText"
import { PrivacyPolicy } from "./components/PrivacyPolicy"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "framer-motion"

export default function InclusionPlanner() {
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
        <title>InclusionPlanner - Plataforma de Inclusión Educativa | Crecimiento y Armonía para Todos los Estudiantes</title>
        <meta name="description" content="InclusionPlanner es la plataforma líder en inclusión educativa. Diseña experiencias de aprendizaje accesibles y equitativas que permiten que cada estudiante crezca y se desarrolle en un entorno armonioso." />
        <meta name="keywords" content="Inclusión Educativa, Educación Inclusiva, Accesibilidad, Diversidad, Necesidades Especiales, UDL, Diseño Universal, Educación Equitativa" />
      </Head>
              <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="min-h-screen flex flex-col relative overflow-hidden"
          style={{ 
            background: '#ffffff'
          }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-10"
                 style={{ background: 'radial-gradient(circle, #fb923c, transparent)', animation: 'float 6s ease-in-out infinite' }}></div>
            <div className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-15"
                 style={{ background: 'radial-gradient(circle, #f97316, transparent)', animation: 'float 8s ease-in-out infinite reverse' }}></div>
            <div className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full opacity-10"
                 style={{ background: 'radial-gradient(circle, #fb923c, transparent)', animation: 'float 7s ease-in-out infinite' }}></div>
          </div>
        {/* WhatsApp Contact Button with Dropdown */}
        <div className="fixed left-4 bottom-4 z-[9999] sm:fixed">
          <div className="relative">
            {/* Main Button */}
            <button
              onClick={() => setIsContactMenuOpen(!isContactMenuOpen)}
              className="text-white rounded-full p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 sm:gap-4"
              style={{ background: 'linear-gradient(to right, #fb923c, #f97316)' }}
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
                    href="https://wa.me/573213589463?text=Hola%2C%20me%20interesa%20InclusionPlanner%20y%20quiero%20más%20información%20sobre%20inclusión%20educativa."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsContactMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200"
                         style={{ backgroundColor: '#fff5f0' }}>
                      <MessageCircle className="w-5 h-5" style={{ color: '#fb923c' }} />
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
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200"
                         style={{ backgroundColor: '#fff5f0' }}>
                      <Users2 className="w-5 h-5" style={{ color: '#fb923c' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Unirse al Grupo</p>
                      <p className="text-sm text-gray-600">Conecta con otros educadores inclusivos</p>
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
          className="sticky top-0 z-50 backdrop-blur-md border-b border-white/20"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="relative w-10 h-10 mr-3 p-2 rounded-xl"
                       style={{ background: 'linear-gradient(135deg, #fb923c, #f97316)' }}>
                    <Image src="/images/logo.png" alt="Logo" fill className="rounded-lg object-cover" />
                  </div>
                  <span className="text-xl font-display font-bold bg-clip-text text-transparent"
                        style={{ background: 'linear-gradient(to right, #fb923c, #f97316)', WebkitBackgroundClip: 'text' }}>
                    InclusionPlanner
                  </span>
                </div>
                <div className="hidden md:ml-12 md:flex md:space-x-8">
                  <Link
                    href="#features"
                    className="text-gray-700 hover:text-orange-600 px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Características
                  </Link>
                  <Link
                    href="#tools"
                    className="text-gray-700 hover:text-orange-600 px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Herramientas
                  </Link>
                  <PrivacyPolicy />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-gray-700 hover:text-green-600 font-medium">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #fb923c, #f97316)' }}>
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
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                  >
                    Características
                  </Link>
                  <Link
                    href="#tools"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50"
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
                                          <Button className="w-full justify-center bg-orange-600 hover:bg-orange-700 text-white">
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
            <section className="relative overflow-hidden py-32">
              {/* Animated background */}
              <div className="absolute inset-0" style={{ 
                background: 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
                animation: 'pulse 4s ease-in-out infinite'
              }}></div>
              
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center px-6 py-3 rounded-full mb-8"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))',
                      border: '1px solid rgba(251, 146, 60, 0.2)'
                    }}
                  >
                    <span className="text-lg mr-2">🌱</span>
                    <span className="text-sm font-semibold" style={{ color: '#fb923c' }}>
                      Crecimiento y Armonía para Todos
                    </span>
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-8"
                    style={{ 
                      background: 'linear-gradient(135deg, #1f2937 0%, #fb923c 50%, #1f2937 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Inclusión que
                    <br />
                    <span style={{ color: '#fb923c' }}>Transforma</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-12"
                  >
                    Diseña experiencias de aprendizaje accesibles y equitativas que permiten que cada estudiante crezca y se desarrolle en un entorno armonioso.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
                  >
                    <Link href="/sign-up">
                      <Button
                        size="lg"
                        className="text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 w-full sm:w-auto"
                        style={{ 
                          background: 'linear-gradient(135deg, #fb923c, #f97316)',
                          boxShadow: '0 20px 40px rgba(251, 146, 60, 0.3)'
                        }}
                      >
                        Comenzar Ahora
                        <ArrowRight className="ml-3 w-6 h-6" />
                      </Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                  >
                    <div className="flex items-center justify-center p-6 rounded-2xl backdrop-blur-sm"
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))',
                           border: '1px solid rgba(251, 146, 60, 0.2)'
                         }}>
                      <Accessibility className="w-8 h-8 mr-3" style={{ color: '#fb923c' }} />
                      <span className="text-lg font-semibold text-gray-800">Accesibilidad Universal</span>
                    </div>
                    <div className="flex items-center justify-center p-6 rounded-2xl backdrop-blur-sm"
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))',
                           border: '1px solid rgba(251, 146, 60, 0.2)'
                         }}>
                      <Heart className="w-8 h-8 mr-3" style={{ color: '#fb923c' }} />
                      <span className="text-lg font-semibold text-gray-800">Diseño Universal</span>
                    </div>
                    <div className="flex items-center justify-center p-6 rounded-2xl backdrop-blur-sm"
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))',
                           border: '1px solid rgba(251, 146, 60, 0.2)'
                         }}>
                      <Shield className="w-8 h-8 mr-3" style={{ color: '#fb923c' }} />
                      <span className="text-lg font-semibold text-gray-800">Entorno Seguro</span>
                    </div>
                  </motion.div>
                </div>

                {/* Floating video container */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="relative max-w-4xl mx-auto"
                >
                  <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20"
                       style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)' }}>
                    <video
                      src="/images/profeplanner.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      width={500}
                      height={500}
                      className="w-full h-auto rounded-2xl"
                    />
                  </div>
                </motion.div>
              </div>
            </section>
          </AnimatedSection>

          {/* Features Section */}
          <AnimatedSection>
            <section className="py-32 relative overflow-hidden" id="premium-tools">
              {/* Background with animated elements */}
              <div className="absolute inset-0" style={{ 
                background: 'linear-gradient(135deg, #fff5f0 0%, #fed7aa 50%, #fff5f0 100%)',
                backgroundSize: '400% 400%',
                animation: 'gradientShift 20s ease infinite'
              }}></div>
              
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <div className="inline-flex items-center px-6 py-3 rounded-full mb-8"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))',
                         border: '1px solid rgba(251, 146, 60, 0.2)'
                       }}>
                    <span className="text-lg mr-2">🚀</span>
                    <span className="text-sm font-semibold" style={{ color: '#fb923c' }}>
                      Herramientas Avanzadas
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-display font-black mb-8"
                      style={{ 
                        background: 'linear-gradient(135deg, #1f2937 0%, #fb923c 50%, #1f2937 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                    Inclusión que Fomenta el Crecimiento
                  </h2>
                  
                  <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                    Diseña experiencias de aprendizaje accesibles y equitativas para todos los estudiantes con nuestras herramientas especializadas.
                  </p>
                </motion.div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <ToolFeatureCard
                    icon={<Accessibility className="w-8 h-8" style={{ color: '#fb923c' }} />}
                    title="Diseño Universal de Aprendizaje"
                    description="Crea lecciones accesibles para todos los estilos de aprendizaje y necesidades."
                  />
                  <ToolFeatureCard
                    icon={<Eye className="w-8 h-8" style={{ color: '#fb923c' }} />}
                    title="Adaptaciones Visuales"
                    description="Genera materiales con alto contraste, textos alternativos y formatos accesibles."
                  />
                  <ToolFeatureCard
                    icon={<Ear className="w-8 h-8" style={{ color: '#fb923c' }} />}
                    title="Recursos Auditivos"
                    description="Crea podcasts, audiolibros y recursos de audio para estudiantes con necesidades auditivas."
                  />
                  <ToolFeatureCard
                    icon={<HandHeart className="w-8 h-8" style={{ color: '#fb923c' }} />}
                    title="Ajustes Razonables"
                    description="Diseña adaptaciones personalizadas para estudiantes con necesidades específicas."
                  />
                  <ToolFeatureCard
                    icon={<Target className="w-8 h-8" style={{ color: '#fb923c' }} />}
                    title="Evaluación Inclusiva"
                    description="Crea evaluaciones múltiples formatos y opciones de respuesta para todos."
                  />
                  <ToolFeatureCard
                    icon={<Globe className="w-8 h-8" style={{ color: '#fb923c' }} />}
                    title="Materiales Multiculturales"
                    description="Desarrolla contenido que refleje la diversidad cultural y lingüística."
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-center mt-16"
                >
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
                                              style={{ 
                          background: 'linear-gradient(135deg, #fb923c, #f97316)',
                          boxShadow: '0 20px 40px rgba(251, 146, 60, 0.3)'
                        }}
                    >
                      ¡Quiero crear inclusión!
                      <ArrowRight className="ml-3 w-6 h-6" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </section>
          </AnimatedSection>

          {/* Video Tutorial */}
          <AnimatedSection>
            <section className="py-20" style={{ background: '#ffffff' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Aprende a usar InclusionPlanner
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Mira nuestro video tutorial y descubre cómo InclusionPlanner puede transformar tu aula en un espacio de inclusión y crecimiento
                  </p>
                </div>
                <div className="aspect-video max-w-4xl mx-auto rounded-xl overflow-hidden shadow-xl">
                  <iframe
                    src="https://www.youtube.com/embed/1YZPk352zd0"
                    title="Tutorial InclusionPlanner"
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
            <section className="py-32 relative overflow-hidden">
              {/* Background with animated elements */}
              <div className="absolute inset-0" style={{ 
                background: 'linear-gradient(135deg, #fff5f0 0%, #fed7aa 50%, #fff5f0 100%)',
                backgroundSize: '400% 400%',
                animation: 'gradientShift 20s ease infinite'
              }}></div>
              
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <div className="inline-flex items-center px-6 py-3 rounded-full mb-8"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))',
                         border: '1px solid rgba(251, 146, 60, 0.2)'
                       }}>
                    <span className="text-lg mr-2">💰</span>
                    <span className="text-sm font-semibold" style={{ color: '#fb923c' }}>
                      Planes Accesibles
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-display font-black mb-8"
                      style={{ 
                        background: 'linear-gradient(135deg, #1f2937 0%, #fb923c 50%, #1f2937 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                    Planes de Inclusión
                  </h2>
                  
                  <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                    Elige el plan que mejor se adapte a tus necesidades de inclusión educativa
                  </p>
                </motion.div>
                <br />

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
                >
                  {/* Plan Básico */}
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-8 rounded-3xl backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105"
                                      style={{ 
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
             }}>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Plan Básico</h3>
                      <p className="text-gray-600 mb-6 text-sm">Ideal para empezar tu camino en la inclusión</p>

                      <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#fb923c' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Acceso a funcionalidades básicas de inclusión</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#fb923c' }} />
                          </div>
                          <span className="text-gray-600 text-sm">5 créditos mensuales</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#fb923c' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Recursos básicos de inclusión</span>
                        </li>
                      </ul>

                      <Link href="/sign-up">
                        <Button
                          className="w-full text-white h-12 text-base font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #fb923c, #f97316)' }}
                          size="lg"
                        >
                          Comenzar Ahora
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Plan Mensual */}
                  <div className="relative group">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                           style={{ 
                             background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                             color: 'white'
                           }}>
                        Más Popular
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-100 to-green-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-8 rounded-3xl backdrop-blur-sm border-2 border-green-200 transition-all duration-300 hover:scale-105"
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))',
                           boxShadow: '0 15px 40px rgba(251, 146, 60, 0.2)'
                         }}>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Plan Profesional Mensual</h3>
                      <p className="text-gray-600 mb-6 text-sm">Acceso completo a todas las herramientas de inclusión</p>

                      <div className="mb-8">
                        <div className="text-center">
                          <span className="text-5xl font-black"
                                style={{ 
                                  background: 'linear-gradient(135deg, #fb923c, #f97316)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}>
                            $6.00
                          </span>
                          <span className="text-gray-500 block">/mes USD</span>
                        </div>
                      </div>

                      <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Acceso ilimitado a todas las funcionalidades</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Generación ilimitada de materiales inclusivos</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Recursos premium de inclusión</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Soporte prioritario especializado</span>
                        </li>
                      </ul>

                      <Link href="/sign-up">
                        <Button
                          className="w-full text-white h-12 text-base font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                          style={{ 
                            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                            boxShadow: '0 10px 25px rgba(101, 204, 138, 0.3)'
                          }}
                          size="lg"
                        >
                          ¡Prueba gratis de 7 días!
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Plan Anual */}
                  <div className="relative group">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                           style={{ 
                             background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                             color: 'white'
                           }}>
                        Mejor Valor
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-100 to-green-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-8 rounded-3xl backdrop-blur-sm border-2 border-green-200 transition-all duration-300 hover:scale-105"
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))',
                           boxShadow: '0 15px 40px rgba(251, 146, 60, 0.2)'
                         }}>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Plan Profesional Anual</h3>
                      <p className="text-gray-600 mb-6 text-sm">Acceso completo con precio de lanzamiento</p>

                      <div className="mb-8">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-5xl font-black"
                                  style={{ 
                                    background: 'linear-gradient(135deg, #fb923c, #f97316)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                  }}>
                              $29.99
                            </span>
                            <span className="text-gray-500">/año USD</span>
                          </div>
                          <div className="text-sm font-bold" style={{ color: '#fb923c' }}>
                            ¡Ahorra 60% - $42.1 USD al año!
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            $2.49 USD/mes
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Acceso ilimitado a todas las funcionalidades</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Generación ilimitada de materiales inclusivos</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Recursos premium de inclusión</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Soporte prioritario especializado</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm font-bold">¡Ahorra más del 60%!</span>
                        </li>
                      </ul>

                      <Link href="/sign-up">
                        <Button
                          className="w-full text-white h-12 text-base font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                          style={{ 
                            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                            boxShadow: '0 10px 25px rgba(101, 204, 138, 0.3)'
                          }}
                          size="lg"
                        >
                          ¡Prueba gratis de 7 días!
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>

                {/* Plan para Escuelas */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex justify-center mt-20"
                >
                  <div className="relative group max-w-md w-full">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                           style={{ 
                             background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                             color: 'white'
                           }}>
                        Recomienda tu escuela
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-100 to-green-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-8 rounded-3xl backdrop-blur-sm border-2 border-green-200 transition-all duration-300 hover:scale-105 min-h-[600px] flex flex-col justify-center"
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))',
                           boxShadow: '0 15px 40px rgba(251, 146, 60, 0.2)'
                         }}>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Plan para Escuelas</h3>
                      <p className="text-gray-600 mb-6 text-sm">Obtén InclusionPlanner gratis y conviértete en la sensación entre los educadores</p>
                      <div className="mb-8">
                        <div className="text-center">
                          <span className="text-5xl font-black"
                                style={{ 
                                  background: 'linear-gradient(135deg, #fb923c, #f97316)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}>
                            Bajo consulta
                          </span>
                          <span className="text-gray-500 block mt-1">Precio especial para instituciones</span>
                        </div>
                      </div>
                      <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Acceso para toda la escuela</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Capacitación y soporte personalizado</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <div className="mt-1 p-1 rounded-full"
                               style={{ backgroundColor: 'rgba(101, 204, 138, 0.1)' }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#65cc8a' }} />
                          </div>
                          <span className="text-gray-600 text-sm">Promociones exclusivas</span>
                        </li>
                      </ul>
                      <a
                        href="https://wa.me/573213589463?text=Hola%2C%20quiero%20recomendar%20InclusionPlanner%20en%20mi%20escuela%20y%20conocer%20los%20beneficios%20para%20instituciones."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          className="w-full text-white h-12 text-base font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                          style={{ 
                            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                            boxShadow: '0 10px 25px rgba(101, 204, 138, 0.3)'
                          }}
                          size="lg"
                        >
                          Hablemos por WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          </AnimatedSection>



          {/* Herramientas Destacadas */}
          <AnimatedSection>
            <section className="py-20" id="tools" style={{ background: '#ffffff' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    La inclusión es un derecho, no un privilegio.
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Transforma tu aula en un espacio donde cada estudiante puede crecer y desarrollarse en un entorno de armonía y respeto.
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
                    icon={<Accessibility className="w-8 h-8" style={{ color: '#65cc8a' }} />}
                    title="Diseño Universal"
                    description="Crea experiencias de aprendizaje accesibles para todos los estudiantes desde el primer momento."
                  />
                  <ToolFeatureCard
                    icon={<Heart className="w-8 h-8" style={{ color: '#65cc8a' }} />}
                    title="Ajustes Razonables"
                    description="Diseña adaptaciones personalizadas que respetan las necesidades individuales de cada estudiante."
                  />
                  <ToolFeatureCard
                    icon={<Globe className="w-8 h-8" style={{ color: '#65cc8a' }} />}
                    title="Diversidad Cultural"
                    description="Desarrolla materiales que celebran y reflejan la riqueza de la diversidad en tu aula."
                  />
                </motion.div>
              </div>
            </section>
          </AnimatedSection>

          {/* Cronograma */}
          <AnimatedSection>
            <section className="py-20" style={{ background: '#ffffff' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Nuestro Compromiso con la Inclusión
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Únete ahora y forma parte de la transformación hacia una educación verdaderamente inclusiva
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 rounded-xl shadow-sm border border-gray-200"
                       style={{ backgroundColor: '#ffffff' }}>
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                           style={{ backgroundColor: '#fed7aa' }}>
                        <Calendar className="w-6 h-6" style={{ color: '#fb923c' }} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Fase 1: Acceso Anticipado</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Acceso completo a todas las herramientas de InclusionPlanner. Únete a la comunidad pionera de educadores inclusivos.
                    </p>
                  </div>

                                    <div className="p-6 rounded-xl shadow-sm border border-gray-200"
                       style={{ backgroundColor: '#ffffff' }}>
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                           style={{ backgroundColor: '#fed7aa' }}>
                        <Rocket className="w-6 h-6" style={{ color: '#fb923c' }} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Fase 2: Lanzamiento Oficial</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Lanzamiento oficial de la plataforma con todas las funcionalidades de inclusión completas y optimizadas.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl shadow-sm border border-gray-200"
                       style={{ backgroundColor: '#ffffff' }}>
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                           style={{ backgroundColor: '#fed7aa' }}>
                        <TrendingUp className="w-6 h-6" style={{ color: '#fb923c' }} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Fase 3: Expansión</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Nuevas funcionalidades avanzadas y herramientas especializadas para diferentes necesidades educativas.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Testimonios */}
          <AnimatedSection>
            <section className="py-20" style={{ background: '#ffffff' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Lo que dicen los educadores inclusivos
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Experiencias reales de educadores que transformaron sus aulas en espacios de crecimiento y armonía
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
                    quote="InclusionPlanner me ayudó a crear un aula donde cada estudiante se siente valorado y puede crecer a su propio ritmo."
                    author="María González"
                    role="Especialista en Educación Inclusiva"
                  />
                  <TestimonialCard
                    quote="Las herramientas de accesibilidad han transformado la forma en que mis estudiantes con necesidades especiales participan en clase."
                    author="Carlos Rodríguez"
                    role="Profesor de Educación Especial"
                  />
                  <TestimonialCard
                    quote="La diversidad cultural en mi aula ahora se celebra y se refleja en todos los materiales que creo."
                    author="Ana Martínez"
                    role="Coordinadora de Inclusión"
                  />
                </motion.div>
              </div>
            </section>
          </AnimatedSection>

          {/* CTA Section */}
          <AnimatedSection>
            <section className="py-20" style={{ background: 'linear-gradient(to right, #fb923c, #f97316)' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                    Únete a la Revolución de la Inclusión Educativa
                  </h2>
                  <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                    Sé parte de esta comunidad pionera y transforma tu aula en un espacio de crecimiento y armonía con InclusionPlanner.
                  </p>
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                      style={{ color: '#fb923c' }}
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
          className="border-t border-gray-200"
          style={{ background: 'linear-gradient(to bottom, #ffffff, #ffffff)' }}
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
                  <span className="text-lg font-display font-semibold bg-clip-text text-transparent"
                        style={{ background: 'linear-gradient(to right, #fb923c, #f97316)', WebkitBackgroundClip: 'text' }}>
                    InclusionPlanner
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 max-w-md">
                  La plataforma líder en inclusión educativa, diseñada para crear experiencias de aprendizaje accesibles y equitativas que permiten que cada estudiante crezca y se desarrolle en un entorno armonioso.
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
      className="p-8 rounded-3xl backdrop-blur-sm border border-white/20 relative overflow-hidden group"
      style={{ 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Hover effect background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))' }}></div>
      
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
             style={{ 
               background: 'linear-gradient(135deg, #fb923c, #f97316)',
               boxShadow: '0 8px 25px rgba(251, 146, 60, 0.3)'
             }}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors duration-300">{title}</h3>
        <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
      </div>
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
      className="p-8 rounded-3xl backdrop-blur-sm border border-white/20 relative overflow-hidden group"
      style={{ 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Hover effect background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))' }}></div>
      
      <div className="relative">
        <div className="flex items-center mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-6 h-6" style={{ color: '#fb923c' }} />
          ))}
        </div>
        <p className="text-gray-700 mb-6 leading-relaxed text-lg italic">"{quote}"</p>
        <div className="border-t border-gray-200 pt-4">
          <p className="font-bold text-gray-900 text-lg">{author}</p>
          <p className="text-gray-600 font-medium">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

// CSS Animations
const styles = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.2; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 