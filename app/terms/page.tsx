import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-blue-900 mb-6">Términos y Condiciones de ProfePlanner</h1>

          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <div className="space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">
                Última Actualización: 26 de mayo de 2025
              </p>
              
              <p>
                Bienvenido a ProfePlanner. Al acceder y utilizar nuestra plataforma, usted acepta estar
                sujeto a estos Términos y Condiciones. Por favor, léalos cuidadosamente antes de utilizar
                nuestros servicios.
              </p>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">1. Aceptación de los Términos</h2>
                <p>
                  Al acceder o utilizar ProfePlanner, usted acepta estar legalmente obligado por estos
                  Términos y Condiciones. Si no está de acuerdo con estos términos, no debe utilizar
                  nuestro servicio.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">2. Descripción del Servicio</h2>
                <p>
                  ProfePlanner es una plataforma diseñada para ayudar a profesores y educadores en la
                  planificación y organización de sus actividades docentes. El servicio incluye, pero no
                  se limita a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Herramientas de planificación de clases</li>
                  <li>Gestión de recursos educativos</li>
                  <li>Organización de actividades docentes</li>
                  <li>Funciones de colaboración entre educadores</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">3. Cuentas de Usuario</h2>
                <p>
                  Para utilizar ciertas funciones del servicio, deberá crear una cuenta. Usted es
                  responsable de:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Mantener la confidencialidad de su contraseña</li>
                  <li>Toda la actividad que ocurra bajo su cuenta</li>
                  <li>Proporcionar información precisa y actualizada</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">4. Uso Aceptable</h2>
                <p>
                  Usted acepta utilizar el servicio solo para fines legales y de acuerdo con estos
                  términos. No debe:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violar cualquier ley aplicable</li>
                  <li>Infringir derechos de propiedad intelectual</li>
                  <li>Interferir con el funcionamiento del servicio</li>
                  <li>Compartir su cuenta con terceros</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">5. Propiedad Intelectual</h2>
                <p>
                  Todo el contenido, características y funcionalidad del servicio son propiedad de
                  ProfePlanner y están protegidos por leyes de propiedad intelectual. Usted no puede
                  copiar, modificar, distribuir, vender o alquilar ninguna parte de nuestro servicio.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">6. Limitación de Responsabilidad</h2>
                <p>
                  ProfePlanner se proporciona "tal cual" sin garantías de ningún tipo. No seremos
                  responsables por daños indirectos, incidentales, especiales o consecuentes que
                  resulten del uso o la imposibilidad de usar nuestro servicio.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">7. Modificaciones</h2>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Las
                  modificaciones entrarán en vigor inmediatamente después de su publicación en el
                  servicio. El uso continuado del servicio después de dichas modificaciones constituye
                  su aceptación de los nuevos términos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">8. Contacto</h2>
                <p>
                  Si tiene alguna pregunta sobre estos Términos y Condiciones, por favor contáctenos:
                  <br />
                  Correo: profeplanner@gmail.com
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">9. Información Legal</h2>
                <p>
                  Este servicio es ofrecido por ProfePlanner SAS, una empresa legalmente constituida bajo
                  las leyes de Colombia. NIT: 900.123.456-7
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Para más información sobre nuestros servicios, consulte nuestra{" "}
                  <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                    Política de Privacidad
                  </Link>
                  {", "}
                  <Link href="/refund-policy" className="text-blue-600 hover:text-blue-800 underline">
                    Política de Reembolsos
                  </Link>
                  {" y "}
                  <Link href="/pricing" className="text-blue-600 hover:text-blue-800 underline">
                    Planes y Precios
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