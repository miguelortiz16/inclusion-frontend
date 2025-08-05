"use client"
import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Check, Rocket, CreditCard, Shield, Youtube, X, AlertTriangle, CheckCircle, Accessibility, Heart } from "lucide-react"
import { GooglePayButton } from "@/components/google-pay-button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { CardPaymentModal } from "@/components/card-payment-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ThumbsUp, ThumbsDown } from "lucide-react"

declare global {
  interface Window {
    createLemonSqueezy: () => void;
    LemonSqueezy: {
      Setup: (config: { eventHandler: (event: any) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
    ePayco: any; // Simplified type declaration to avoid conflicts
  }
}

const plans = {
  basic: {
    name: "Plan Básico",
    description: "Prueba con 5 créditos mensuales",
    price: "0.00",
    features: [
      "Acceso a funcionalidades básicas",
      "5 créditos mensuales",
      "Recursos básicos",
      "Almacenamiento limitado"
    ],
    popular: false,
    productId: "540676"
  },
  monthly: [
    {
      name: "Plan Profesional Mensual",
      description: "Acceso completo a todas las herramientas para maestros. Ahorro hasta  20 horas semanales",
      price: "6",
      features: [
        "Acceso ilimitado a todas las funcionalidades",
        "Generación ilimitada de clases",
        "Recursos premium",
        "Almacenamiento ampliado",
        "Soporte prioritario"
      ],
      popular: true,
      productId: "b29958ec-9e4b-4349-bdfd-a6cc21587f68"
    }
  ],
  yearly: [
    {
      name: "Plan Profesional Anual",
      description: "Acceso completo a todas las herramientas para maestros. Ahorro hasta  20 horas semanales",
      price: "29.99",
      features: [
        "Acceso ilimitado a todas las funcionalidades",
        "Generación ilimitada de clases",
        "Recursos premium",
        "Almacenamiento ampliado",
        "Soporte prioritario",
        "¡Ahorra más del 60%!"
      ],
      popular: true,
      productId: "2f6997cd-3221-4715-aa56-2b0b5f413308"
    }
  ]
}

export default function Pricing() {
  const [ePaycoLoaded, setEpaycoLoaded] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [currencyData, setCurrencyData] = useState<{ usdRate: number; currency: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showNoSubscriptionDialog, setShowNoSubscriptionDialog] = useState(false)
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<null | { status: string; startDate?: string; endDate?: string; source?: string }>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative" | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  
  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('email')
      setEmail(storedEmail)
    }
  }, [])

  useEffect(() => {
    const fetchCurrencyRate = async () => {
      if (typeof window === 'undefined' || !email) return;
      
      setLoading(true);
      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/v1/currency/user-rate?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch currency rate');
        }

        const data = await response.json();
        setCurrencyData(data);
      } catch (err) {
        console.error('Error fetching currency rate:', err);
        setCurrencyData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyRate();
  }, [email]);

  const convertToLocalCurrency = (usdAmount: number): string | null => {
    if (!currencyData?.usdRate) return null;
    const localAmount = usdAmount * currencyData.usdRate;
    return localAmount.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  useEffect(() => {
    // Initialize LemonSqueezy
    const lemonScript = document.createElement("script")
    lemonScript.src = "https://assets.lemonsqueezy.com/lemon.js"
    lemonScript.defer = true
    document.head.appendChild(lemonScript)

    lemonScript.onload = () => {
     
      if (window.createLemonSqueezy) {
         window.createLemonSqueezy()
        window.LemonSqueezy.Setup({
          eventHandler: async (event: any) => {
           
            if (event.event === "Checkout.Success") {
              console.log("Checkout success event detected")
              // Aquí obtenemos el ID de la suscripción
              const orderData = event.data.order.data
              const orderId = orderData.id
              const userEmail = localStorage.getItem("email")
              

              // Intentar obtener el ID de la suscripción
              const subscriptionId = orderData.attributes.first_order_item.variant_id
              
 

              
              const maxRetries = 6
              let retryCount = 0
              let success = false
            
              if (!userEmail) {
                toast.error("No se encontró el email del usuario")
              
                return
              }
            
              while (retryCount < maxRetries && !success) {
                try {
                  // Validar la suscripción en el backend usando el order_id en el path y el email como parámetro
                  const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/webhooks/lemonsqueezyv1/subscriptions/${orderId}?email=${encodeURIComponent(userEmail.trim())}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  })

                  if (!response.ok) {
                    throw new Error('Error al validar la suscripción')
                  }

                  const data = await response.json()
                  
                  // Mostrar mensaje de éxito
                  toast.success("¡Suscripción activada con éxito!")
                  success = true
                } catch (error) {
                  console.error(`Error en intento ${retryCount + 1}:`, error)
                  retryCount++

                  if (retryCount < maxRetries) {
                    // Esperar 3 segundos antes de reintentar
                    await new Promise(resolve => setTimeout(resolve, 3000))
                    toast.info(`Reintentando validación... (${retryCount + 1}/${maxRetries})`)
                  } else {
                    toast.error("Hubo un error al validar la suscripción después de varios intentos. Por favor, contacta a soporte.")
                  }
                }
              }
            }
          }
        })
        console.log("LemonSqueezy setup completed")
      } else {
        console.error("createLemonSqueezy not found")
      }
    }

    // Load ePayco script
    if (window.ePayco) {
      console.log("ePayco ya está cargado:", window.ePayco)
      setEpaycoLoaded(true)
      return
    }

    const ePaycoScript = document.createElement("script")
    ePaycoScript.src = "https://checkout.epayco.co/checkout.js"
    ePaycoScript.async = true
    ePaycoScript.type = "text/javascript"

    ePaycoScript.onload = () => {
      console.log("ePayco script loaded:", window.ePayco)
      setEpaycoLoaded(true)
    }

    document.body.appendChild(ePaycoScript)

    return () => {
      document.head.removeChild(lemonScript)
      document.body.removeChild(ePaycoScript)
    }
  }, [])

  const handlePayment = (plan: any) => {
    if (plan.price === "0.00") {
      // Handle free plan
      toast.success("¡Plan gratuito activado!")
      return
    }

    console.log("Opening checkout with product ID:", plan.productId)
    const checkoutUrl = `https://profeplanner.lemonsqueezy.com/buy/${plan.productId}?embed=1&locale=es`
    
    if (window.LemonSqueezy) {
      console.log("Opening LemonSqueezy checkout")
      window.LemonSqueezy.Url.Open(checkoutUrl)
    } else {
      console.error("LemonSqueezy not initialized")
      toast.error("El sistema de pago no está disponible. Por favor, inténtalo de nuevo.")
    }
  }

  const handleEpaycoPayment = (plan: any) => {
    if (!ePaycoLoaded || !window.ePayco) {
      toast.error("El script de ePayco aún no ha cargado. Intenta de nuevo.");
      return;
    }
    try {
      const handler = window.ePayco.checkout.configure({
        key: process.env.NEXT_PUBLIC_EPAYCO_KEY,
        test: false,
        lang: "es",
        external: "false",
        autoclick: "false",
        frame: "true",
        response: `${window.location.origin}/success`,
        confirmation: `${window.location.origin}/api/payment/confirmation`,
        redirect: true,
        useCustomStyles: true,
        customStyles: {
          logo: "https://profeplanner.com/logo.png",
          banner: "https://profeplanner.com/banner.png",
          menuBackgroundColor: "#2563eb",
          menuColor: "#ffffff",
          btnBackgroundColor: "#2563eb",
          btnColor: "#ffffff",
        }
      })
      let email=localStorage.getItem("email")
      let correoBase64 = "";
      if (email) {
        email =btoa(email.trim());
        const correoBase64 = btoa(email);
        const correoOriginal = atob(correoBase64);
      }
      let amount = plan.price;
      if (currencyData?.currency === "COP" && currencyData?.usdRate) {
        amount = (parseFloat(plan.price) * currencyData.usdRate).toFixed(0)
      }
      handler.open({
        amount: amount,
        name: plan.name,
        description: email,
        currency: "COP",
        country: "CO",
        tax: "0",
        tax_base: "0",
        invoice: `INV-${Date.now()}`,
        doc_type: "",
        doc_number: "",
        name_billing: "",
        address_billing: "",
        type_doc_billing: "",
        mobilephone_billing: "",
        number_doc_billing: "",
      })
    } catch (error) {
      console.error("Error al iniciar el pago:", error)
      toast.error("Error al iniciar el proceso de pago. Por favor, inténtalo de nuevo.")
    }
  }

  const sendFeedback = async () => {
 
    setFeedbackSending(true)
    const email = localStorage.getItem('email')
    try {
      await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/herramientas/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nombre: "feedback Plan",
          correoElectronico: email,
          descripcionSolicitud: `Feedback de herramientas: ${feedbackType === 'positive' ? 'Positivo' : 'Negativo'}${feedbackComment ? `\nComentario: ${feedbackComment}` : ''}`
        })
      })


     
      setFeedbackSent(true)
      toast.success("¡Gracias por tu feedback!")
      setTimeout(() => {
        setShowFeedbackDialog(false)
        setFeedbackType(null)
        setFeedbackComment("")
        setFeedbackSent(false)
      }, 1500)
    } catch (e) {
      toast.error("No se pudo enviar el feedback. Intenta de nuevo.")
    } finally {
      setFeedbackSending(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!email) {
      toast.error("No se encontró el email del usuario. Por favor, inicia sesión nuevamente.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/webhooks/lemonsqueezyv1/subscriptions?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const responseText = await response.text()
      console.log(responseText)
      if (responseText === "ok") {
        // Limpiar datos de suscripción del localStorage
        localStorage.removeItem('subscriptionId')
        localStorage.removeItem('orderId')
        setShowSuccessDialog(false)
        setShowFeedbackDialog(true) // Mostrar feedback tras cancelar
      } else {
        setShowNoSubscriptionDialog(true)
      }
      
    } catch (error) {
      console.error("Error al cancelar la suscripción:", error)
      toast.error("Error al cancelar la suscripción. Por favor, contacta a soporte.")
    } finally {
      setLoading(false)
      setShowCancelDialog(false)
    }
  }

  useEffect(() => {
    const checkTrial = async () => {
      if (!email) return;
      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/check?email=${encodeURIComponent(email.trim())}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.api+json',
          },
        });
        if (!response.ok) throw new Error('Error al consultar el estado de la prueba gratis');
        const data = await response.json();
        setHasUsedTrial(!!data.hasSubscriptionId);
      } catch (err) {
        // Si falla, mostrar los planes SIN prueba gratis
        setHasUsedTrial(true);
      }
    };
    if (email) checkTrial();
  }, [email]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      let email=localStorage.getItem("email")
      if (!email) return;
      setSubscriptionLoading(true);
      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/status/${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error('No se pudo obtener el estado de la suscripción');
        const data = await response.json();
        setSubscriptionStatus(data);
        // Si la respuesta es {status: null, source: 'No se encontró'}, permitir prueba gratis
        if (data && data.status === null && data.source === "No se encontró") {
          setHasUsedTrial(false);
        }
      } catch (err) {
        setSubscriptionStatus(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    if (email) fetchSubscriptionStatus();
  }, [email]);

  return (
    <Layout>
      <div className="min-h-screen"
           style={{
             background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
             position: 'relative',
             overflow: 'hidden'
           }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
               style={{ 
                 background: 'radial-gradient(circle, #65cc8a, transparent)',
                 animation: 'float 6s ease-in-out infinite'
               }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-15"
               style={{ 
                 background: 'radial-gradient(circle, #4ade80, transparent)',
                 animation: 'float 8s ease-in-out infinite reverse'
               }}></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full opacity-10"
               style={{ 
                 background: 'radial-gradient(circle, #65cc8a, transparent)',
                 animation: 'float 7s ease-in-out infinite'
               }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Subscription Status Banner */}
          {subscriptionLoading ? (
            <div className="rounded-xl p-2 mb-4 text-white text-center shadow-md animate-pulse"
                 style={{
                   background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                   boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                 }}>
              Consultando estado de tu suscripción...
            </div>
          ) : subscriptionStatus && ["active", "Aceptada", "on_trial"].includes(subscriptionStatus.status) ? (
            <div className="rounded-xl p-3 mb-4 text-white text-center shadow-lg flex flex-col items-center"
                 style={{
                   background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                   boxShadow: '0 12px 24px rgba(101, 204, 138, 0.3)'
                 }}>
              <div className="flex items-center gap-2 justify-center mb-1">
                <CheckCircle className="w-5 h-5 animate-bounce" style={{ color: '#ffffff' }} />
                <span className="font-bold text-lg">
                  {subscriptionStatus.status === "on_trial"
                    ? "¡Estás disfrutando de tu prueba gratuita!"
                    : subscriptionStatus.status === "active" || subscriptionStatus.status === "Aceptada"
                    ? "¡Tienes una suscripción activa!"
                    : null}
                </span>
              </div>
              {subscriptionStatus.status === "on_trial" ? (
                <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Disfruta de todas las funcionalidades premium sin límites durante tu periodo de prueba.</span>
              ) : (
                <>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Acceso premium habilitado.</span>
                  {subscriptionStatus.startDate && subscriptionStatus.endDate && (
                    <div className="mt-1 text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <span>Desde: <b>{new Date(subscriptionStatus.startDate).toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}</b></span>
                      <span className="mx-2">|</span>
                      <span>Hasta: <b>{new Date(subscriptionStatus.endDate).toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}</b></span>
                    </div>
                  )}
                </>
              )}

            </div>
          ) : null}

          {/* Early Bird Banner */}
          <div className="rounded-xl p-2 mb-4 text-white text-center shadow-md"
               style={{
                 background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                 boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
               }}>
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
              🎉 ¡Oferta Especial! Acceso Ilimitado por $29.99 USD/año -  por $2.49 USD/mes- ¡Ahorra 60%! 🎉
            </h2>
          </div>

          {/* 7 Days Free Trial Banner */}
          {hasUsedTrial === false && (
            <div className="rounded-2xl p-3 mb-8 text-white text-center shadow-lg"
                 style={{
                   background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                   boxShadow: '0 12px 24px rgba(101, 204, 138, 0.3)'
                 }}>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white">¡Prueba gratis de 7 días!</h2>
                  <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>•</span>
                  <p className="text-xs font-medium text-white">
                    Prueba todas las funcionalidades premium sin compromiso
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>•</span>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Se requiere tarjeta para verificar, puedes cancelar en cualquier momento
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight" style={{ color: '#000000' }}>
              Planes de Suscripción
            </h1>
            <p className="text-base max-w-2xl mx-auto font-medium" style={{ color: '#000000' }}>
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* All Plans in Horizontal Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 justify-center">
            {hasUsedTrial === false && (
              <>
                {/* Monthly Plan con prueba gratis */}
                {plans.monthly.map((plan) => (
                  <div key={plan.name} className="rounded-2xl shadow-lg relative scale-105 transition-all duration-300 hover:shadow-xl w-full max-w-xs"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(101, 204, 138, 0.2)',
                         boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                       }}>
                    <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                      <div className="text-white px-3 py-0.5 rounded-full text-xs font-semibold shadow-lg"
                           style={{
                             background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                             boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                           }}>
                        Más Popular
                      </div>
                    </div>
                    <div className="p-3">
                      <h2 className="text-xl font-display font-bold mb-1" style={{ color: '#000000' }}>{plan.name}</h2>
                      <p className="mb-2 text-sm font-medium" style={{ color: '#000000' }}>{plan.description}</p>
                      <div className="mb-2">
                        <div className="text-center">
                          <span className="text-3xl font-bold"
                                style={{
                                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent'
                                }}>
                            ${plan.price}
                          </span>
                          <span className="text-sm font-medium" style={{ color: '#000000' }}>/mes USD</span>
                          {currencyData && (
                            <>
                              <div className="text-sm mt-0.5 font-medium" style={{ color: '#000000' }}>
                                {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/mes
                              </div>
                              <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                {convertToLocalCurrency(parseFloat(plan.price) / 30)} {currencyData.currency}/día
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 rounded-full"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))'
                                 }}>
                              <Check className="w-3.5 h-3.5" style={{ color: '#65cc8a' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: '#000000' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-1">
                        <Button
                          className="w-full text-white h-9 text-sm font-semibold transition-all duration-300 rounded-xl"
                          size="lg"
                          style={{
                            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                            boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                          }}
                          onClick={() => handlePayment(plan)}
                          data-lemonsqueezy="true"
                          data-lang="es"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-2" />
                          ¡Prueba gratis de 7 días!
                        </Button>
                        <a
                          href="https://www.youtube.com/watch?v=GyCN7t5K4OU"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-1 font-semibold text-xs transition-colors"
                          style={{ color: '#65cc8a' }}
                        >
                          <Youtube className="w-4 h-4" />
                          Ver tutorial de cómo pagar
                        </a>
                      {/*  <p className="text-xs text-emerald-700 text-center font-semibold">
                          ¡Prueba gratis de 7 día!
                        </p>
                       */}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Yearly Plan con prueba gratis */}
                {plans.yearly.map((plan) => (
                  <div key={plan.name} className="rounded-2xl shadow-lg relative scale-105 transition-all duration-300 hover:shadow-xl w-full max-w-xs"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(101, 204, 138, 0.2)',
                         boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                       }}>
                    <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                      <div className="text-white px-3 py-0.5 rounded-full text-xs font-semibold shadow-lg"
                           style={{
                             background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                             boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                           }}>
                        Mejor Valor
                      </div>
                    </div>
                    <div className="p-3">
                      <h2 className="text-xl font-display font-bold mb-1" style={{ color: '#000000' }}>{plan.name}</h2>
                      <p className="mb-2 text-sm font-medium" style={{ color: '#000000' }}>{plan.description}</p>
                      <div className="mb-2">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-0.5">
                            <span className="text-3xl font-bold"
                                  style={{
                                    background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                  }}>
                              ${plan.price}
                            </span>
                            <span className="text-sm font-medium" style={{ color: '#000000' }}>/año USD</span>
                          </div>
                          {currencyData && (
                            <>
                              <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/año
                              </div>
                              <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                {convertToLocalCurrency(parseFloat(plan.price) / 12)} {currencyData.currency}/mes
                              </div>
                              <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                {convertToLocalCurrency(parseFloat(plan.price) / 365)} {currencyData.currency}/día
                              </div>
                            </>
                          )}
                          <div className="text-xs font-semibold mt-0.5" style={{ color: '#65cc8a' }}>
                            ¡Ahorra 60% - ${(parseFloat(plans.monthly[0].price) * 12 - parseFloat(plan.price)).toFixed(2)} USD al año!
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 rounded-full"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))'
                                 }}>
                              <Check className="w-3.5 h-3.5" style={{ color: '#65cc8a' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: '#000000' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-1">
                        <Button
                          className="w-full text-white h-9 text-sm font-semibold transition-all duration-300 rounded-xl"
                          size="lg"
                          style={{
                            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                            boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                          }}
                          onClick={() => handlePayment(plan)}
                          data-lemonsqueezy="true"
                          data-lang="es"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-2" />
                          ¡Prueba gratis de 7 días!
                        </Button>
                        <a
                          href="https://www.youtube.com/watch?v=GyCN7t5K4OU"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-1 font-semibold text-xs transition-colors"
                          style={{ color: '#65cc8a' }}
                        >
                          <Youtube className="w-4 h-4" />
                          Ver tutorial de cómo pagar
                        </a>
                           {/*  <p className="text-xs text-emerald-700 text-center font-semibold">
                          ¡Prueba gratis de 7 día!
                        </p>
                       */}
                        {plan.name === "Plan Profesional Anual" && currencyData?.currency === "COP" && (
                          <Button
                            className="w-full text-white h-9 text-sm font-bold transition-all duration-300 rounded-xl border shadow-md"
                            size="lg"
                            style={{
                              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                              boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)',
                              border: '1px solid rgba(101, 204, 138, 0.3)'
                            }}
                            onClick={() => handleEpaycoPayment(plan)}
                          >
                            <Rocket className="w-3.5 h-3.5 mr-2" />
                            Otros Métodos de Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {hasUsedTrial === true && (
              <>
                {/* Planes sin prueba gratis, usando los IDs LemonSqueezy dados */}
                {[
                  {
                    name: "Plan Mensual",
                    price: "6.00",
                    productId: "040f9179-7318-4abc-82da-fb9de70392a2",
                    description: "Acceso completo a todas las herramientas por un mes",
                    features: [
                      "Acceso ilimitado a todas las funcionalidades",
                      "Generación ilimitada de clases",
                      "Recursos premium",
                      "Almacenamiento ampliado",
                      "Soporte prioritario"
                    ]
                  },
                  {
                    name: "Plan Anual",
                    price: "29.99",
                    productId: "2f6997cd-3221-4715-aa56-2b0b5f413308",
                    description: "Acceso completo a todas las herramientas por un año",
                    features: [
                      "Acceso ilimitado a todas las funcionalidades",
                      "Generación ilimitada de clases",
                      "Recursos premium",
                      "Almacenamiento ampliado",
                      "Soporte prioritario",
                      "¡Ahorra más del 60%!"
                    ]
                  }
                ].map((plan) => (
                  <div key={plan.name} className="rounded-2xl shadow-lg relative scale-105 transition-all duration-300 hover:shadow-xl w-full max-w-xs"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(101, 204, 138, 0.2)',
                         boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                       }}>
                    <div className="p-3">
                      <h2 className="text-xl font-display font-bold mb-1" style={{ color: '#000000' }}>{plan.name}</h2>
                      <p className="mb-2 text-sm font-medium" style={{ color: '#000000' }}>{plan.description}</p>
                      <div className="mb-2">
                        <div className="text-center">
                          <span className="text-3xl font-bold"
                                style={{
                                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent'
                                }}>
                            ${plan.price}
                          </span>
                          <span className="text-sm font-medium" style={{ color: '#000000' }}>{plan.name === 'Plan Mensual' ? '/mes USD' : '/año USD'}</span>
                          {currencyData && (
                            <>
                              {plan.name === 'Plan Mensual' && (
                                <>
                                  <div className="text-sm mt-0.5 font-medium" style={{ color: '#000000' }}>
                                    {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/mes
                                  </div>
                                  <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                    {convertToLocalCurrency(parseFloat(plan.price) / 30)} {currencyData.currency}/día
                                  </div>
                                </>
                              )}
                              {plan.name === 'Plan Anual' && (
                                <>
                                  <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                    {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/año
                                  </div>
                                  <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                    {convertToLocalCurrency(parseFloat(plan.price) / 12)} {currencyData.currency}/mes
                                  </div>
                                  <div className="text-sm font-medium" style={{ color: '#000000' }}>
                                    {convertToLocalCurrency(parseFloat(plan.price) / 365)} {currencyData.currency}/día
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 rounded-full"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))'
                                 }}>
                              <Check className="w-3.5 h-3.5" style={{ color: '#65cc8a' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: '#000000' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-1">
                        <Button
                          className="w-full text-white h-9 text-sm font-semibold transition-all duration-300 rounded-xl"
                          size="lg"
                          style={{
                            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                            boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                          }}
                          onClick={() => window.LemonSqueezy?.Url.Open(`https://profeplanner.lemonsqueezy.com/buy/${plan.productId}?embed=1&locale=es`)}
                          data-lemonsqueezy="true"
                          data-lang="es"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-2" />
                          Suscribirse
                        </Button>
                        <a
                          href="https://www.youtube.com/watch?v=GyCN7t5K4OU"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-1 font-semibold text-xs transition-colors"
                          style={{ color: '#65cc8a' }}
                        >
                          <Youtube className="w-4 h-4" />
                          Ver tutorial de cómo pagar
                        </a>
                        {plan.name === "Plan Anual" && currencyData?.currency === "COP" && (
                          <Button
                            className="w-full text-white h-9 text-sm font-bold transition-all duration-300 rounded-xl border shadow-md"
                            size="lg"
                            style={{
                              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                              boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)',
                              border: '1px solid rgba(101, 204, 138, 0.3)'
                            }}
                            onClick={() => handleEpaycoPayment(plan)}
                          >
                            <Rocket className="w-3.5 h-3.5 mr-2" />
                            Otros Métodos de Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Cancel Subscription Section - Discreet */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="rounded-lg p-3 opacity-60 hover:opacity-100 transition-opacity duration-300"
               style={{
                 background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                 border: '1px solid rgba(101, 204, 138, 0.2)'
               }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X className="w-3 h-3" style={{ color: '#65cc8a' }} />
                <span className="text-xs font-medium" style={{ color: '#000000' }}>Gestionar cuenta</span>
              </div>
              
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={loading || !email}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                size="sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                  color: '#000000',
                  border: '1px solid rgba(101, 204, 138, 0.3)'
                }}
              >
                {loading ? "..." : "Cancelar la suscripción"}
              </Button>
            </div>
          </div>
        </div>

        {/* Alert Dialog for Cancellation Confirmation */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent className="sm:max-w-md"
                             style={{
                               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
                               backdropFilter: 'blur(20px)',
                               border: '1px solid rgba(101, 204, 138, 0.2)',
                               boxShadow: '0 25px 50px rgba(101, 204, 138, 0.2)'
                             }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"
                               style={{ color: '#65cc8a' }}>
                <AlertTriangle className="h-5 w-5" />
                Cancelar Suscripción
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: '#000000' }}>
                ¿Estás seguro de que quieres cancelar tu suscripción? Esta acción no se puede deshacer y perderás acceso a todas las funcionalidades premium al final del período facturado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-300 hover:bg-gray-50"
                                style={{ color: '#000000' }}>
                Mantener Suscripción
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelSubscription}
                className="text-white shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                  boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                }}
              >
                {loading ? "Cancelando..." : "Sí, Cancelar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success Alert Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent className="sm:max-w-md"
                             style={{
                               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
                               backdropFilter: 'blur(20px)',
                               border: '1px solid rgba(101, 204, 138, 0.2)',
                               boxShadow: '0 25px 50px rgba(101, 204, 138, 0.2)'
                             }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"
                               style={{ color: '#65cc8a' }}>
                <CheckCircle className="h-5 w-5" />
                Suscripción Cancelada
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: '#000000' }}>
                Tu suscripción ha sido cancelada exitosamente. Tendrás acceso a todas las funcionalidades premium hasta el final del período facturado. Gracias por haber sido parte de nuestra comunidad.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                onClick={() => setShowSuccessDialog(false)}
                className="text-white shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                  boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                }}
              >
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* No Subscription Alert Dialog */}
        <AlertDialog open={showNoSubscriptionDialog} onOpenChange={setShowNoSubscriptionDialog}>
          <AlertDialogContent className="sm:max-w-md"
                             style={{
                               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
                               backdropFilter: 'blur(20px)',
                               border: '1px solid rgba(101, 204, 138, 0.2)',
                               boxShadow: '0 25px 50px rgba(101, 204, 138, 0.2)'
                             }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"
                               style={{ color: '#65cc8a' }}>
                <Shield className="h-5 w-5" />
                Sin Suscripción Activa
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: '#000000' }}>
                No se encontró una suscripción activa asociada a tu cuenta. Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                onClick={() => setShowNoSubscriptionDialog(false)}
                className="text-white shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                  boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                }}
              >
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Feedback tras cancelar suscripción */}
        <Dialog open={showFeedbackDialog} onOpenChange={(open) => {
          if (!feedbackSent) {
            toast.error("Por favor, envía tu feedback antes de continuar")
            return
          }
          setShowFeedbackDialog(open)
        }}>
          <DialogContent style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(101, 204, 138, 0.2)',
            boxShadow: '0 25px 50px rgba(101, 204, 138, 0.2)'
          }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#000000' }}>Tu suscripción fue cancelada</DialogTitle>
              <DialogDescription style={{ color: '#000000' }}>
                ¿Por qué cancelaste tu suscripción? Tu opinión nos ayuda a mejorar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button
                  variant={feedbackType === "positive" ? "default" : "outline"}
                  size="lg"
                  className="flex flex-col items-center gap-2"
                  style={feedbackType === "positive" ? {
                    background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                    boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                  } : {
                    border: '1px solid rgba(101, 204, 138, 0.3)',
                    color: '#000000'
                  }}
                  onClick={() => setFeedbackType('positive')}
                >
                  <ThumbsUp className="w-6 h-6" />
                  <span>Me gustó, pero...</span>
                </Button>
                <Button
                  variant={feedbackType === "negative" ? "default" : "outline"}
                  size="lg"
                  className="flex flex-col items-center gap-2"
                  style={feedbackType === "negative" ? {
                    background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                    boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                  } : {
                    border: '1px solid rgba(101, 204, 138, 0.3)',
                    color: '#000000'
                  }}
                  onClick={() => setFeedbackType('negative')}
                >
                  <ThumbsDown className="w-6 h-6" />
                  <span>No me convenció</span>
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-comment" style={{ color: '#000000' }}>Comentario (opcional)</Label>
                <textarea
                  id="feedback-comment"
                  className="w-full min-h-[100px] p-2 rounded-md"
                  style={{
                    border: '1px solid rgba(101, 204, 138, 0.3)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                  placeholder="¿Tienes algún comentario o sugerencia que nos ayude a mejorar?"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={sendFeedback}
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                    boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                  }}
                  disabled={!feedbackType || feedbackSending || feedbackSent}
                >
                  {feedbackSending ? "Enviando..." : feedbackSent ? "¡Gracias!" : "Enviar Feedback"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPlanForPayment && (
        <CardPaymentModal
          open={showCardModal}
          onOpenChange={setShowCardModal}
          plan={selectedPlanForPayment}
          selectedPlan="yearly"
        />
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </Layout>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-200 transition-all duration-300 hover:shadow-md">
      <h3 className="font-semibold text-lg text-slate-900 mb-3">{question}</h3>
      <p className="text-slate-600">{answer}</p>
    </div>
  )
}

