"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { auth, sendEmailVerification } from "@/lib/firebase"
import toast from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"

export function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (!email) {
      router.push("/sign-up")
      return
    }

    // Verificar el estado de verificación cada 5 segundos
    const checkVerification = async () => {
      try {
        const user = auth.currentUser
        if (user?.emailVerified) {
          toast.success("¡Correo verificado exitosamente!")
          router.push("/sign-in")
        }
      } catch (error) {
        console.error("Error al verificar el estado:", error)
      }
    }

    const interval = setInterval(checkVerification, 5000)
    return () => clearInterval(interval)
  }, [email, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    if (countdown > 0) return

    setLoading(true)
    try {
      const user = auth.currentUser
      if (user) {
        await sendEmailVerification(user)
        setCountdown(60) // 60 segundos de espera
        toast.success("Correo de verificación reenviado")
      }
    } catch (error: any) {
      toast.error(error.message || "Error al reenviar el correo de verificación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8fafc]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verifica tu correo</h1>
          <p className="text-gray-600 text-center">
            Hemos enviado un correo de verificación a <span className="font-medium">{email}</span>
          </p>
          <p className="text-gray-600 text-center mt-2">
            Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleResendVerification}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg shadow-sm transition-all"
            disabled={loading || countdown > 0}
          >
            {loading
              ? "Enviando..."
              : countdown > 0
              ? `Reenviar en ${countdown}s`
              : "Reenviar correo de verificación"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            ¿Ya verificaste tu correo?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 