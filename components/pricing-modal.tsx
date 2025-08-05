"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Rocket, CreditCard, Shield, Youtube } from "lucide-react"
import { GooglePayButton } from "@/components/google-pay-button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { CardPaymentModal } from "@/components/card-payment-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

declare global {
  interface Window {
    createLemonSqueezy: () => void;
    LemonSqueezy: {
      Setup: (config: { eventHandler: (event: any) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
    ePayco: any;
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
      description: "Acceso completo a todas las herramientas para maestros.Ahorro hasta  20 horas semanales",
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

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessMessage?: string;
}

export function PricingModal({ open, onOpenChange, accessMessage }: PricingModalProps) {
  const [ePaycoLoaded, setEpaycoLoaded] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [currencyData, setCurrencyData] = useState<{ usdRate: number; currency: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | null>(null)
  // Eliminados: canClose, closeCountdown

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
              
              
              const maxRetries = 6
              let retryCount = 0
              let success = false
              var email = localStorage.getItem("email")
              if (!email) {
                toast.error("No se encontró el email del usuario")
              
                return
              }
              const orderData = event.data.order.data
              const orderId = orderData.id
              
              while (retryCount < maxRetries && !success) {
                try {
                  const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/webhooks/lemonsqueezyv1/subscriptions/${orderId}?email=${encodeURIComponent(email.trim())}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  })

                  if (!response.ok) {
                    throw new Error('Error al validar la suscripción')
                  }

                  const data = await response.json()
                
                  toast.success("¡Suscripción activada con éxito!")
                  success = true
                } catch (error) {
                  console.error(`Error en intento ${retryCount + 1}:`, error)
                  retryCount++

                  if (retryCount < maxRetries) {
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
      }
    }

    // Load ePayco script
    if (window.ePayco) {
      setEpaycoLoaded(true)
      return
    }

    const ePaycoScript = document.createElement("script")
    ePaycoScript.src = "https://checkout.epayco.co/checkout.js"
    ePaycoScript.async = true
    ePaycoScript.type = "text/javascript"

    ePaycoScript.onload = () => {
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
      toast.success("¡Plan gratuito activado!")
      return
    }

    console.log("Opening checkout with product ID:", plan.productId)
    const checkoutUrl = `https://profeplanner.lemonsqueezy.com/buy/${plan.productId}?embed=1&locale=es`
    
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl)
    } else {
      toast.error("El sistema de pago no está disponible. Por favor, inténtalo de nuevo.")
    }
  }

  const handleEpaycoPayment = (plan: any) => {
    if (!ePaycoLoaded || !window.ePayco) {
      toast.error("El script de ePayco aún no ha cargado. Intenta de nuevo.")
      return
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

      let email = localStorage.getItem("email")
      if (email) {
      
        email =btoa(email.trim());
      }

      let amount = plan.name === "Plan Profesional Anual" ? plan.price : plans.monthly[0].price
      
      // If currency is COP, multiply by the exchange rate
      if (currencyData?.currency === "COP" && currencyData?.usdRate) {
        amount = (parseFloat(amount) * currencyData.usdRate).toFixed(0)
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

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto z-50 bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-slate-900">
            Planes de Suscripción    Elige el plan que mejor se adapte a tus necesidades
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-600">
         
          </DialogDescription>
          {accessMessage && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-blue-800 text-center text-xs">{accessMessage}</p>
            </div>
          )}
          {/* Eliminado: mensaje de espera y lógica de canClose/closeCountdown */}
        </DialogHeader>

        <div className="px-3">
          {/* Early Bird Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-2 mb-3 text-white text-center shadow-sm">
            <h2 className="text-xs font-bold leading-tight">
              🎉 ¡Oferta Especial! Acceso Ilimitado por $29.99 USD/año - por $2.49 USD/mes - ¡Ahorra 60%! 🎉
            </h2>
          </div>

          {/* 7 Days Free Trial Banner */}
          {hasUsedTrial === false && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-2 mb-3 text-white text-center shadow-sm">
              <h2 className="text-xs font-semibold leading-tight">
                ¡Prueba gratis de 7 días! Prueba todas las funcionalidades premium sin compromiso. Se requiere tarjeta para verificar, puedes cancelar en cualquier momento.
              </h2>
            </div>
          )}

          {/* All Plans in Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <div className="p-2">
                <h2 className="text-base font-bold text-slate-900 mb-1">{plans.basic.name}</h2>
                <p className="text-slate-600 mb-1 text-xs">{plans.basic.description}</p>
                <div className="mb-1">
                  <div className="text-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      Gratis
                    </span>
                  </div>
                </div>
                <ul className="space-y-1 mb-1">
                  {plans.basic.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-slate-700">
                      <div className="mt-0.5 p-0.5 rounded-full bg-blue-100">
                        <Check className="w-2.5 h-2.5 text-blue-500" />
                      </div>
                      <span className="text-slate-600 text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Planes con prueba gratis */}
            {hasUsedTrial === false && (
              <>
                {plans.monthly.map((plan) => (
                  <div 
                    key={plan.name} 
                    className="bg-white rounded-xl shadow-sm border border-blue-200 relative scale-105 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                        Más Popular
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <h2 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h2>
                      <p className="text-slate-600 mb-1 text-xs">{plan.description}</p>
                      
                      <div className="mb-1">
                        <div className="text-center">
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                            ${plan.price}
                          </span>
                          <span className="text-slate-500 text-xs">/mes USD</span>
                          {currencyData && (
                            <>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/mes
                              </div>
                              <div className="text-xs text-slate-500">
                                {convertToLocalCurrency(parseFloat(plan.price) / 30)} {currencyData.currency}/día
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-1 mb-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-slate-700">
                            <div className="mt-0.5 p-0.5 rounded-full bg-blue-100">
                              <Check className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                            <span className="text-slate-600 text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="space-y-1">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-8 text-xs font-medium transition-all duration-300"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            handlePayment(plan);
                          }}
                          data-lemonsqueezy="true"
                          data-lang="es"
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          ¡Prueba gratis de 7 días!
                        </Button>
                        <a
                          href="https://www.youtube.com/watch?v=GyCN7t5K4OU"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-1 text-blue-700 hover:text-red-600 font-semibold text-xs transition-colors"
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
                {plans.yearly.map((plan) => (
                  <div 
                    key={plan.name} 
                    className="bg-white rounded-xl shadow-sm border border-blue-200 relative scale-105 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                        Mejor Valor
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <h2 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h2>
                      <p className="text-slate-600 mb-1 text-xs">{plan.description}</p>
                      
                      <div className="mb-1">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                              ${plan.price}
                            </span>
                            <span className="text-slate-500 text-xs">/año USD</span>
                          </div>
                          {currencyData && (
                            <>
                              <div className="text-xs text-slate-500">
                                {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/año
                              </div>
                              <div className="text-xs text-slate-500">
                                {convertToLocalCurrency(parseFloat(plan.price) / 12)} {currencyData.currency}/mes
                              </div>
                              <div className="text-xs text-slate-500">
                                {convertToLocalCurrency(parseFloat(plan.price) / 365)} {currencyData.currency}/día
                              </div>
                            </>
                          )}
                          <div className="text-xs text-blue-500 font-medium mt-0.5">
                            ¡Ahorra 60% - ${(parseFloat(plans.monthly[0].price) * 12 - parseFloat(plan.price)).toFixed(2)} USD al año!
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-1 mb-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-slate-700">
                            <div className="mt-0.5 p-0.5 rounded-full bg-blue-100">
                              <Check className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                            <span className="text-slate-600 text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="space-y-1">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-8 text-xs font-medium transition-all duration-300"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            handlePayment(plan);
                          }}
                          data-lemonsqueezy="true"
                          data-lang="es"
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          Prueba gratis de 7 días!
                        </Button>
                        <a
                          href="https://www.youtube.com/watch?v=GyCN7t5K4OU"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-1 text-blue-700 hover:text-red-600 font-semibold text-xs transition-colors"
                        >
                          <Youtube className="w-4 h-4" />
                          Ver tutorial de cómo pagar
                        </a>
                               {/*  <p className="text-xs text-emerald-700 text-center font-semibold">
                          ¡Prueba gratis de 14 días!
                        </p>
                       */}
                        {plan.name === "Plan Profesional Anual" && currencyData?.currency === "COP" && (
                          <Button
                            className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white h-8 text-xs font-medium transition-all duration-300"
                            size="sm"
                            onClick={() => {
                              onOpenChange(false);
                              handleEpaycoPayment(plan);
                            }}
                          >
                            <Rocket className="w-3 h-3 mr-1" />
                            Otros Métodos de Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Planes sin prueba gratis */}
            {hasUsedTrial === true && (
              <>
                {[{
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
                }, {
                  name: "Plan Anual",
                  price: "29.99",
                  productId: "e2943dd8-62d7-4ae8-8b0b-a239b7df6cbb",
                  description: "Acceso completo a todas las herramientas por un año",
                  features: [
                    "Acceso ilimitado a todas las funcionalidades",
                    "Generación ilimitada de clases",
                    "Recursos premium",
                    "Almacenamiento ampliado",
                    "Soporte prioritario",
                    "¡Ahorra más del 60%!"
                  ]
                }].map((plan) => (
                  <div key={plan.name} className="bg-white rounded-xl shadow-sm border border-blue-200 relative scale-105 transition-all duration-300 hover:shadow-md">
                    <div className="p-2">
                      <h2 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h2>
                      <p className="text-slate-600 mb-1 text-xs">{plan.description}</p>
                      <div className="mb-1">
                        <div className="text-center">
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                            ${plan.price}
                          </span>
                          <span className="text-slate-500 text-xs">{plan.name === 'Plan Mensual' ? '/mes USD' : '/año USD'}</span>
                          {currencyData && (
                            <>
                              {plan.name === 'Plan Mensual' && (
                                <>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/mes
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {convertToLocalCurrency(parseFloat(plan.price) / 30)} {currencyData.currency}/día
                                  </div>
                                </>
                              )}
                              {plan.name === 'Plan Anual' && (
                                <>
                                  <div className="text-xs text-slate-500">
                                    {convertToLocalCurrency(parseFloat(plan.price))} {currencyData.currency}/año
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {convertToLocalCurrency(parseFloat(plan.price) / 12)} {currencyData.currency}/mes
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {convertToLocalCurrency(parseFloat(plan.price) / 365)} {currencyData.currency}/día
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-1 mb-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-slate-700">
                            <div className="mt-0.5 p-0.5 rounded-full bg-blue-100">
                              <Check className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                            <span className="text-slate-600 text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-1">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-8 text-xs font-medium transition-all duration-300"
                          size="sm"
                          onClick={
                            () => {
                              onOpenChange(false);
                              window.LemonSqueezy?.Url.Open(`https://profeplanner.lemonsqueezy.com/buy/${plan.productId}?embed=1&locale=es`)}
                            }
                         
                          data-lemonsqueezy="true"
                          data-lang="es"
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          Suscribirse
                        </Button>
                        {plan.name === "Plan Anual" && currencyData?.currency === "COP" && (
                          <Button
                            className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white h-8 text-xs font-medium transition-all duration-300"
                            size="sm"
                            onClick={() => handleEpaycoPayment(plan)}
                          >
                            <Rocket className="w-3 h-3 mr-1" />
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

        {selectedPlanForPayment && (
          <CardPaymentModal
            open={showCardModal}
            onOpenChange={setShowCardModal}
            plan={selectedPlanForPayment}
            selectedPlan="yearly"
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 