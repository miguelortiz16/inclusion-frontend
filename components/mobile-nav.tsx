"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, BookOpen, Wrench, History, Users, LogOut, CalendarIcon } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import { deleteCookie } from "cookies-next"

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  // No mostrar en estas rutas
  if (pathname === '/') return null
  if (pathname === '/sign-in') return null
  if (pathname === '/sign-up') return null

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path + "/")
      ? "text-blue-600"
      : "text-gray-500"
  }

  return (
    <>
      <button
        onClick={async () => {
          try {
            await signOut(auth)
            localStorage.removeItem('email')
            deleteCookie('auth')
            toast.success('Sesión cerrada correctamente')
            router.push('/')
            router.refresh()
          } catch (error) {
            console.error('Error al cerrar sesión:', error)
            toast.error('Error al cerrar sesión')
          }
        }}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white shadow-lg hover:bg-red-50 hover:text-red-500 transition-all duration-200 md:hidden"
      >
        <LogOut className="w-5 h-5" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden pb-safe shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          <Link
            href="/unit-planner"
            className="flex flex-col items-center py-2 px-3 relative group"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive("/unit-planner")} group-hover:bg-gray-50`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive("/unit-planner")}`}>Planificador</span>
          </Link>

          <Link
            href="/workshop"
            className="flex flex-col items-center py-2 px-3 relative group"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive("/workshop")} group-hover:bg-gray-50`}>
              <Wrench className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive("/workshop")}`}>Herramientas</span>
          </Link>

          <Link
            href="/history"
            className="flex flex-col items-center py-2 px-3 relative group"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive("/history")} group-hover:bg-gray-50`}>
              <History className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive("/history")}`}>Historial</span>
          </Link>

          <Link
            href="/comunidad"
            className="flex flex-col items-center py-2 px-3 relative group"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive("/comunidad")} group-hover:bg-gray-50`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive("/comunidad")}`}>Comunidad</span>
          </Link>
{/*
          <Link
            href="/unit-planner/calendar"
            className="flex flex-col items-center py-2 px-3 relative group"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive("/unit-planner/calendar")} group-hover:bg-gray-50`}>
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive("/unit-planner/calendar")}`}>Calendario</span>
          </Link>
*/}
          <Link
            href="/inicio"
            className="flex flex-col items-center py-2 px-3 relative group"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive("/inicio")} group-hover:bg-gray-50`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive("/inicio")}`}>Material</span>
          </Link>
        </div>
      </nav>
    </>
  )
} 