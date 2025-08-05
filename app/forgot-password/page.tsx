"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { auth, sendPasswordResetEmail } from "@/lib/firebase"
import { toast } from "sonner"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setShowSuccessAlert(true)
      toast.success("Correo enviado exitosamente")
    } catch (error: any) {
      toast.error("Error al enviar el correo de recuperación. Por favor, verifica tu correo e intenta nuevamente.")
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
          <p className="text-gray-600 text-center">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>
        </div>

        <div className="space-y-4">
          {showSuccessAlert && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 font-semibold">Correo enviado exitosamente</AlertTitle>
              <AlertDescription className="text-blue-700">
                Hemos enviado las instrucciones de recuperación a {email}.<br />
                Si no encuentras el correo en tu bandeja de entrada, por favor revisa tu carpeta de spam.<br />
                <Button
                  variant="link"
                  className="text-blue-700 hover:text-blue-800 p-0 h-auto font-normal"
                  onClick={() => router.push("/sign-in")}
                >
                  Volver a iniciar sesión
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Correo electrónico"
                className="w-full py-6 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg shadow-sm transition-all"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar instrucciones"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 