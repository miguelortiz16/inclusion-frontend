"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, BookOpen, Wrench, History, ChevronRight, Users, GraduationCap, School, Menu, X, ChevronLeft, LogOut, Trophy, Globe, CalendarIcon, Accessibility, Heart, Shield } from "lucide-react"
import { useSidebar } from "@/contexts/sidebar-context"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import { deleteCookie } from "cookies-next"
import { useLanguage } from "../app/contexts/LanguageContext"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, setIsOpen, isMobile } = useSidebar()
  const { language, setLanguage, t } = useLanguage()

  // No mostrar el sidebar en la ruta principal
  if (!pathname || pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up' || pathname.includes('/unit-planner/shared/')) {
    return null
  }

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path + "/")
      ? "bg-gradient-to-r from-green-50 to-green-100 text-green-600 font-medium border-l-4 border-green-500 shadow-sm"
      : "hover:bg-gradient-to-r hover:from-green-50/50 hover:to-green-100/50 text-gray-600"
  }

  return (
    <>
      {/* Botón del menú hamburguesa solo para tablets */}
      {!isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg sm:hidden"
          style={{ boxShadow: '0 4px 12px rgba(101, 204, 138, 0.2)' }}
        >
          {isOpen ? <X className="w-6 h-6" style={{ color: '#65cc8a' }} /> : <Menu className="w-6 h-6" style={{ color: '#65cc8a' }} />}
        </button>
      )}

      {/* Botón para mostrar menú en escritorio */}
      {!isOpen && !isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hidden md:flex items-center gap-2 transition-colors duration-200"
          style={{ 
            boxShadow: '0 4px 12px rgba(101, 204, 138, 0.2)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))'
          }}
        >
          <Menu className="w-6 h-6" style={{ color: '#65cc8a' }} />
          <span className="text-sm font-medium" style={{ color: '#65cc8a' }}>{t('sidebar.menu')}</span>
        </button>
      )}

      {/* Overlay para tablets */}
      {isOpen && !isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 
          h-screen w-64
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-2xl
        `}
        style={{ 
          borderRight: '1px solid rgba(101, 204, 138, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="h-full flex flex-col font-poppins">
          <div className="p-4 sm:p-6 flex items-center gap-3 border-b"
               style={{ borderColor: 'rgba(101, 204, 138, 0.2)' }}>
            <div className="relative">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-lg sm:w-12 sm:h-12"
                style={{ 
                  boxShadow: '0 4px 12px rgba(101, 204, 138, 0.3)',
                  border: '2px solid rgba(101, 204, 138, 0.2)'
                }}
              />
              <div className="absolute -bottom-1 -right-1 rounded-full p-1.5 shadow-md"
                   style={{ 
                     background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                     boxShadow: '0 2px 8px rgba(101, 204, 138, 0.4)'
                   }}>
                <Accessibility className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent"
                  style={{ 
                    background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                    WebkitBackgroundClip: 'text'
                  }}>
              InclusionPlanner
            </span>
          </div>

          <nav className="flex-1 py-4 sm:py-6">
            <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider"
                 style={{ color: '#65cc8a' }}>
              {t('sidebar.title')}
            </div>
            <ul className="space-y-2 px-2 font-montserrat font-semibold">
              <li>
                <Link
                  href="/unit-planner"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/unit-planner")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 rounded-lg shadow-sm"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))'
                       }}>
                    <BookOpen className="w-5 h-5" style={{ color: '#65cc8a' }} />
                  </div>
                  <span>{t('sidebar.classPlanner')}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              <li>
                <Link
                  href="/workshop"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/workshop")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 rounded-lg shadow-sm"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))'
                       }}>
                    <Wrench className="w-5 h-5" style={{ color: '#65cc8a' }} />
                  </div>
                  <span>{t('sidebar.aiTools')}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/history")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 rounded-lg shadow-sm"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))'
                       }}>
                    <History className="w-5 h-5" style={{ color: '#65cc8a' }} />
                  </div>
                  <span>{t('sidebar.history')}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              <li>
                <Link
                  href="/unit-planner/calendar"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/unit-planner/calendar")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 rounded-lg shadow-sm"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(101, 138, 204, 0.1), rgba(74, 222, 128, 0.1))'
                       }}>
                    <CalendarIcon className="w-5 h-5" style={{ color: '#65cc8a' }} />
                  </div>
                  <span>{t('sidebar.calendar')}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              {/*
              <li>
                <Link
                  href="/inicio"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/inicio")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>{t('sidebar.readyMaterials')}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              */}
              <li>
                <Link
                  href="/ranking"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/ranking")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 rounded-lg shadow-sm"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))'
                       }}>
                    <Trophy className="w-5 h-5" style={{ color: '#65cc8a' }} />
                  </div>
                  <span>{t('sidebar.ranking')}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              <li>
                <Link
                  href="/comunidad"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive("/comunidad")}`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="p-1.5 rounded-lg shadow-sm"
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))'
                       }}>
                    <Users className="w-5 h-5" style={{ color: '#65cc8a' }} />
                  </div>
                  <span>Comunidad</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              </li>
              <li>
                <button
                  onClick={async () => {
                    try {
                      await signOut(auth)
                      localStorage.removeItem('email')
                      deleteCookie('auth')
                      toast.success(t('sidebar.logoutSuccess'))
                      router.push('/')
                      router.refresh()
                    } catch (error) {
                      console.error('Error al cerrar sesión:', error)
                      toast.error(t('sidebar.logoutError'))
                    }
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 text-sm text-gray-600 hover:text-red-600 rounded-lg transition-colors duration-200"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.1))',
                    border: '1px solid rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('sidebar.logout')}</span>
                </button>
              </li>
            </ul>
          </nav>
          {/*
          <div className="p-4 border-t border-blue-100">
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="w-full flex items-center gap-2 py-2 px-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'es' ? 'English' : 'Español'}</span>
            </button>
          </div>
          */}
          <div className="p-4 border-t"
               style={{ borderColor: 'rgba(101, 204, 138, 0.2)' }}>
            <Link href="/pricing">
              <button
                className="w-full py-1.5 px-2 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 group mb-2"
                style={{ 
                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                  boxShadow: '0 4px 12px rgba(101, 204, 138, 0.3)'
                }}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <div className="p-0.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                  <span>¡Suscripción Premium!</span>
                </span>
              </button>
            </Link>

            <button
              onClick={() => {
                const message = encodeURIComponent("¡Descubre InclusionPlanner! La mejor plataforma de inclusión educativa. 🌱\n\nhttps://www.inclusionplanner.com/");
                window.open(`https://wa.me/?text=${message}`, '_blank');
              }}
              className="w-full py-1.5 px-2 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
              style={{ 
                background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                boxShadow: '0 4px 12px rgba(101, 204, 138, 0.3)'
              }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <div className="p-0.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                  <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span>{t('sidebar.shareWhatsApp')}</span>
              </span>
            </button>
          </div>
          
          <div className="p-4 border-t"
               style={{ borderColor: 'rgba(101, 204, 138, 0.2)' }}>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 transition-colors duration-200"
              style={{ color: '#65cc8a' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('sidebar.hideMenu')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

