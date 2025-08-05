"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface GooglePayButtonProps {
  amount: number
  onSuccess: () => void
  onError: (error: any) => void
}

declare global {
  interface Window {
    google?: {
      payments?: {
        api: {
          isReadyToPay(request: any): Promise<{ result: boolean }>;
          PaymentsClient: new (options: { environment: 'TEST' | 'PRODUCTION' }) => {
            loadPaymentData(request: any): Promise<any>;
          };
        };
      };
    };
  }
}

export function GooglePayButton({ amount, onSuccess, onError }: GooglePayButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let checkInterval: NodeJS.Timeout

    const checkGooglePay = () => {
      if (window.google?.payments?.api) {
        setIsScriptLoaded(true)
        window.google.payments.api.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['VISA', 'MASTERCARD']
            }
          }]
        }).then((result) => {
          setIsAvailable(result.result)
          if (!result.result) {
            setError("Google Pay no está disponible en tu dispositivo")
          }
          clearInterval(checkInterval)
        }).catch((error) => {
          console.error('Error checking Google Pay availability:', error)
          setIsAvailable(false)
          setError("Error al verificar la disponibilidad de Google Pay")
          clearInterval(checkInterval)
        })
      }
    }

    // Verificar cada 100ms hasta que el script esté cargado
    checkInterval = setInterval(checkGooglePay, 100)

    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      clearInterval(checkInterval)
    }
  }, [])

  const handlePayment = async () => {
    if (!isAvailable || !isScriptLoaded) {
      toast.error("Google Pay no está disponible en tu dispositivo")
      return
    }

    setIsLoading(true)
    try {
      if (!window.google?.payments?.api) {
        throw new Error("Google Pay no está disponible")
      }

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'gatewayMerchantId'
            }
          }
        }],
        merchantInfo: {
          merchantId: '01234567890123456789',
          merchantName: 'ProfePlanner'
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toString(),
          currencyCode: 'COP'
        }
      }

      const paymentClient = new window.google.payments.api.PaymentsClient({
        environment: 'TEST'
      })

      const result = await paymentClient.loadPaymentData(paymentDataRequest)
      
      // Aquí procesarías el pago con tu backend
      console.log('Payment data:', result)
      
      toast.success("¡Pago exitoso!")
      onSuccess()
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || "Error al procesar el pago")
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAvailable) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">{error || "Cargando Google Pay..."}</p>
      </div>
    )
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || !isScriptLoaded}
      className="w-full bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white shadow-sm rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Procesando...
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="20" height="20">
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
          Pagar con Google Pay
        </>
      )}
    </Button>
  )
} 