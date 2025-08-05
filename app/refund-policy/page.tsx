import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-6">Política de Reembolsos de ProfePlanner</h1>

          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <div className="space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">
                Última Actualización: 26 de mayo de 2025
              </p>
              
              <p>
                Esta Política de Reembolsos describe los términos y condiciones bajo los cuales ProfePlanner
                ("nosotros", "nuestro", "la Aplicación") procesa las solicitudes de reembolso para las
                suscripciones de nuestro servicio.
              </p>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">1. Período de Reembolso</h2>
                <p>
                  Ofrecemos un período de reembolso de 14 días desde la fecha de compra de la suscripción.
                  Durante este período, si no está satisfecho con nuestro servicio, puede solicitar un
                  reembolso completo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">2. Proceso de Reembolso</h2>
                <p>
                  Para solicitar un reembolso:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Envíe un correo electrónico a profeplanner@gmail.com</li>
                  <li>Incluya su nombre, correo electrónico asociado a la cuenta y motivo del reembolso</li>
                  <li>Procesaremos su solicitud dentro de los 5 días hábiles</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">3. Condiciones de Reembolso</h2>
                <p>
                  Los reembolsos están sujetos a las siguientes condiciones:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>La solicitud debe realizarse dentro del período de 14 días</li>
                  <li>El servicio no debe haber sido utilizado de manera significativa</li>
                  <li>No se procesarán reembolsos para suscripciones canceladas después del período de gracia</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">4. Método de Reembolso</h2>
                <p>
                  Los reembolsos se procesarán utilizando el mismo método de pago utilizado para la compra
                  original. El tiempo de procesamiento puede variar según el proveedor de pagos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">5. Cancelación de Suscripción</h2>
                <p>
                  Puede cancelar su suscripción en cualquier momento desde su panel de control. La
                  cancelación entrará en vigor al final del período de facturación actual. No se
                  proporcionarán reembolsos por períodos no utilizados después de la cancelación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">6. Contacto</h2>
                <p>
                  Si tiene alguna pregunta sobre nuestra Política de Reembolsos, por favor contáctenos:
                  <br />
                  Correo: profeplanner@gmail.com
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Para más información sobre nuestros servicios, consulte nuestros{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                    Términos y Condiciones
                  </Link>
                  {" "}y{" "}
                  <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                    Política de Privacidad
                  </Link>
                  .
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
} 