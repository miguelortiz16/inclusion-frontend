"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CreditCard, Lock, Shield, CheckCircle2 } from "lucide-react"
import { Plan } from "@/types/plan"
import { useState, useEffect } from "react"

declare global {
  interface Window {
    ePayco: any;
  }
}

interface CardPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan
  selectedPlan: "monthly" | "yearly"
}

export function CardPaymentModal({ open, onOpenChange, plan, selectedPlan }: CardPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    email: "",
    phone: "",
  })

  const [cardType, setCardType] = useState<string>("")
  const [isValid, setIsValid] = useState({
    cardNumber: false,
    cardName: false,
    expiryDate: false,
    cvv: false,
    email: false,
    phone: false,
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load ePayco script
    const script = document.createElement('script')
    script.src = 'https://checkout.epayco.co/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    // Detect card type
    const number = formData.cardNumber.replace(/\s/g, "")
    if (number.startsWith("4")) {
      setCardType("visa")
    } else if (number.startsWith("5")) {
      setCardType("mastercard")
    } else {
      setCardType("")
    }

    // Validate card number
    setIsValid(prev => ({
      ...prev,
      cardNumber: /^[0-9]{16}$/.test(number)
    }))

    // Validate card name
    setIsValid(prev => ({
      ...prev,
      cardName: formData.cardName.length >= 3
    }))

    // Validate expiry date
    const [month, year] = formData.expiryDate.split("/")
    const currentYear = new Date().getFullYear() % 100
    const currentMonth = new Date().getMonth() + 1
    const isValidMonth = parseInt(month) >= 1 && parseInt(month) <= 12
    const isValidYear = parseInt(year) >= currentYear
    const isValidDate = isValidMonth && isValidYear && (parseInt(year) > currentYear || parseInt(month) >= currentMonth)
    setIsValid(prev => ({
      ...prev,
      expiryDate: /^\d{2}\/\d{2}$/.test(formData.expiryDate) && isValidDate
    }))

    // Validate CVV
    setIsValid(prev => ({
      ...prev,
      cvv: /^[0-9]{3,4}$/.test(formData.cvv)
    }))

    // Validate email
    setIsValid(prev => ({
      ...prev,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    }))

    // Validate phone
    setIsValid(prev => ({
      ...prev,
      phone: /^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ""))
    }))
  }, [formData])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const amount = selectedPlan === "yearly" ? plan.yearlyPrice || plan.price : plan.price
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

      // Crear el formulario de pago
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = 'https://checkout.epayco.co/checkout.php'
      form.target = '_blank'

      // Obtener la fecha actual y agregar 2 años para la fecha de expiración
      const currentDate = new Date()
      const expYear = (currentDate.getFullYear() + 2).toString().slice(-2)
      const expMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')

      // Agregar los campos necesarios
      const fields = {
        public_key: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY as string,
        amount: amount.toString(),
        currency: "COP",
        description: `Suscripción ${plan.name}`,
        invoice: `INV-${Date.now()}`,
        name: plan.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''), // Solo números
        doc_type: "CC",
        doc_number: "123456789",
        name_billing: formData.cardName,
        address_billing: "Calle 123",
        type_doc_billing: "CC",
        mobilephone_billing: formData.phone.replace(/\D/g, ''), // Solo números
        number_doc_billing: "123456789",
        tax: "0",
        tax_base: "0",
        country: "CO",
        lang: "es",
        test: "true",
        external: "false",
        confirmation: `${baseUrl}/api/payment/confirmation`,
        response: `${baseUrl}/success`,
        // Campos adicionales para el modo de prueba
        test_client: "true",
        test_card: "4575623182290326",
        test_cvv: "123",
        test_exp_year: expYear,
        test_exp_month: expMonth,
        // Campos adicionales requeridos
        extra1: plan.id,
        extra2: selectedPlan,
        extra3: "test",
        extra4: "test",
        extra5: "test",
        extra6: "test",
        extra7: "test",
        extra8: "test",
        extra9: "test",
        extra10: "test"
      }

      // Agregar los campos al formulario
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      // Agregar el formulario al documento y enviarlo
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)

      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = Object.values(isValid).every(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-blue-900">
            Pago Seguro
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Ingresa los datos de tu tarjeta para procesar el pago de {plan.name}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
              <Lock className="w-4 h-4" />
              Pago 100% Seguro
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                Número de Tarjeta
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`pr-12 ${isValid.cardNumber ? 'border-green-500' : formData.cardNumber ? 'border-red-500' : ''}`}
                  required
                />
                {cardType && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cardType === "visa" ? (
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path fill="#1A1F71" d="M22.4 4H1.6C.7 4 0 4.7 0 5.6v12.8c0 .9.7 1.6 1.6 1.6h20.8c.9 0 1.6-.7 1.6-1.6V5.6c0-.9-.7-1.6-1.6-1.6z"/>
                        <path fill="#F7B600" d="M22.4 4H1.6C.7 4 0 4.7 0 5.6v12.8c0 .9.7 1.6 1.6 1.6h20.8c.9 0 1.6-.7 1.6-1.6V5.6c0-.9-.7-1.6-1.6-1.6z"/>
                      </svg>
                    ) : cardType === "mastercard" ? (
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path fill="#FF5F00" d="M12 4H1.6C.7 4 0 4.7 0 5.6v12.8c0 .9.7 1.6 1.6 1.6H12V4z"/>
                        <path fill="#EB001B" d="M12 4h10.4c.9 0 1.6.7 1.6 1.6v12.8c0 .9-.7 1.6-1.6 1.6H12V4z"/>
                        <path fill="#F79E1B" d="M12 4h10.4c.9 0 1.6.7 1.6 1.6v12.8c0 .9-.7 1.6-1.6 1.6H12V4z"/>
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">
                Nombre en la Tarjeta
              </Label>
              <Input
                id="cardName"
                value={formData.cardName}
                onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="Juan Pérez"
                className={isValid.cardName ? 'border-green-500' : formData.cardName ? 'border-red-500' : ''}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                  Fecha de Expiración
                </Label>
                <Input
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={isValid.expiryDate ? 'border-green-500' : formData.expiryDate ? 'border-red-500' : ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                  placeholder="123"
                  maxLength={4}
                  className={isValid.cvv ? 'border-green-500' : formData.cvv ? 'border-red-500' : ''}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className={isValid.email ? 'border-green-500' : formData.email ? 'border-red-500' : ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+57 300 123 4567"
                className={isValid.phone ? 'border-green-500' : formData.phone ? 'border-red-500' : ''}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Tus datos están protegidos con encriptación SSL</span>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || !isFormValid}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-6 text-lg font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Pagar ${selectedPlan === "yearly" ? plan.yearlyPrice : plan.price}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 