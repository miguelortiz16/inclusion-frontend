"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye } from "lucide-react"
import { useState } from "react"
import { 
  auth, 
  googleProvider,
  facebookProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from "@/lib/firebase"
import toast from "react-hot-toast"
import { setCookie } from "cookies-next"
import Image from "next/image"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      localStorage.setItem("email", email)
      setCookie("auth", idToken, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      })
      toast.success("Inicio de sesión exitoso")
      router.push("/onboarding")
    } catch (error: any) {
      console.log("Firebase error:", error)
      let errorMessage = "Ocurrió un error al iniciar sesión"
      
      if (error.code) {
        switch (error.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            errorMessage = "Correo electrónico o contraseña incorrectos"
            break
          case "auth/too-many-requests":
            errorMessage = "Demasiados intentos fallidos. Por favor, intente más tarde"
            break
          case "auth/user-disabled":
            errorMessage = "Esta cuenta ha sido deshabilitada"
            break
          case "auth/invalid-email":
            errorMessage = "El correo electrónico no es válido"
            break
          case "auth/network-request-failed":
            errorMessage = "Error de conexión. Por favor, verifique su conexión a internet"
            break
        }
      }
      console.log(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    let retryCount = 0;
    const maxRetries = 2;

    const attemptSignIn = async () => {
      try {
        console.log("Intento de inicio de sesión con Google #", retryCount + 1);
        
        // Limpiar cualquier estado de autenticación previo
        await auth.signOut();
        
        const userCredential = await signInWithPopup(auth, googleProvider);
        console.log("Usuario autenticado:", userCredential.user);
        
        if (userCredential.user) {
          const idToken = await userCredential.user.getIdToken();
          console.log("Token obtenido exitosamente");
          
          if (userCredential.user.email) {
            localStorage.setItem("email", userCredential.user.email);
          }
          
          setCookie("auth", idToken, {
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
          });
          
          toast.success("Inicio de sesión exitoso");
          router.push("/onboarding");
          return true;
        }
      } catch (error: any) {
        console.error("Error en intento de inicio de sesión:", error);
        
        // Manejar errores específicos
        if (error.code === 'auth/popup-closed-by-user') {
          console.log("Usuario cerró la ventana emergente");
          return false;
        }
        
        if (error.code === 'auth/cancelled-popup-request') {
          console.log("Solicitud de ventana emergente cancelada");
          if (retryCount < maxRetries) {
            retryCount++;
            console.log("Reintentando...");
            return attemptSignIn();
          }
        }
        
        if (error.code === 'auth/network-request-failed') {
          console.log("Error de red");
          toast.error("Error de conexión. Por favor, verifique su conexión a internet");
          return false;
        }
        
        // Para otros errores
        toast.error(error.message || "Error al iniciar sesión con Google");
        return false;
      }
      return false;
    };

    try {
      const success = await attemptSignIn();
      if (!success && retryCount >= maxRetries) {
        toast.error("No se pudo completar el inicio de sesión. Por favor, intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleFacebookSignIn = async () => {
    setLoading(true)
    let retryCount = 0;
    const maxRetries = 2;

    const attemptSignIn = async () => {
      try {
        console.log("Intento de inicio de sesión con Facebook #", retryCount + 1);
        
        // Limpiar cualquier estado de autenticación previo
        await auth.signOut();
        
        const userCredential = await signInWithPopup(auth, facebookProvider);
        console.log("Usuario autenticado:", userCredential.user);
        
        if (userCredential.user) {
          const idToken = await userCredential.user.getIdToken();
          console.log("Token obtenido exitosamente");
          
          if (userCredential.user.email) {
            localStorage.setItem("email", userCredential.user.email);
          } else {
            console.warn("No se pudo obtener el email del usuario de Facebook");
            toast.error("No se pudo obtener el email de tu cuenta de Facebook");
            return false;
          }
          
          setCookie("auth", idToken, {
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
          });
          
          toast.success("Inicio de sesión exitoso");
          router.push("/onboarding");
          return true;
        }
      } catch (error: any) {
        console.error("Error en intento de inicio de sesión:", error);
        
        // Manejar errores específicos
        if (error.code === 'auth/popup-closed-by-user') {
          console.log("Usuario cerró la ventana emergente");
          return false;
        }
        
        if (error.code === 'auth/cancelled-popup-request') {
          console.log("Solicitud de ventana emergente cancelada");
          if (retryCount < maxRetries) {
            retryCount++;
            console.log("Reintentando...");
            return attemptSignIn();
          }
        }
        
        if (error.code === 'auth/network-request-failed') {
          console.log("Error de red");
          toast.error("Error de conexión. Por favor, verifique su conexión a internet");
          return false;
        }

        if (error.code === 'auth/account-exists-with-different-credential') {
          toast.error("Ya existe una cuenta con este email usando otro método de inicio de sesión");
          return false;
        }
        
        // Para otros errores
        toast.error(error.message || "Error al iniciar sesión con Facebook");
        return false;
      }
      return false;
    };

    try {
      const success = await attemptSignIn();
      if (!success && retryCount >= maxRetries) {
        toast.error("No se pudo completar el inicio de sesión. Por favor, intente nuevamente.");
      }
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido!</h1>
          <p className="text-gray-600">¡Ahora tu vida escolar será mucho más fácil!</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-6 rounded-lg shadow-sm transition-all"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? "Iniciando sesión..." : "Continuar con Google"}
          </Button>

          {/* <Button
            onClick={handleFacebookSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white py-6 rounded-lg shadow-sm transition-all mt-2"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {loading ? "Iniciando sesión..." : "Continuar con Facebook"}
          </Button> */}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#f8fafc] text-gray-500">O ingresa con correo electrónico</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
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

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                className="w-full py-6 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                <Eye className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg shadow-sm transition-all"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            ¿Aún no tienes una cuenta?{" "}
            <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

