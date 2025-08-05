import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-blue-900 mb-6">Política de Privacidad de ProfePlanner</h1>



          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <div className="space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">
                Última Actualización: 26 de mayo de 2025
              </p>
              
              <p>
                Bienvenido a ProfePlanner ("nosotros", "nuestro", "la Aplicación"). Nos comprometemos a
                proteger la privacidad de nuestros usuarios, que son principalmente profesores y
                educadores. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y
                protegemos su información cuando utiliza nuestra aplicación web ProfePlanner y los servicios
                relacionados (colectivamente, el "Servicio").
              </p>

              <p>
                Al acceder o utilizar el Servicio, usted acepta las prácticas descritas en esta Política de
                Privacidad. Si no está de acuerdo con los términos de esta política, por favor, no acceda ni
                utilice el Servicio.
              </p>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">1. Información que Recopilamos</h2>
                <p>Podemos recopilar información sobre usted de diversas formas. La información que podemos
                recopilar a través del Servicio incluye:</p>
                
                <h3 className="text-lg font-medium text-blue-800 mt-4 mb-2">• Información Personal que Usted Proporciona:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Datos de Cuenta: Cuando se registra para una cuenta, recopilamos
                  información como su nombre, dirección de correo electrónico, contraseña y
                  rol (profesor/educador).</li>
                  <li>Contenido Generado por el Usuario: Recopilamos y procesamos el
                  contenido que usted crea, carga o ingresa mientras utiliza el Servicio.</li>
                  <li>Información de Comunicación: Si se comunica con nosotros por correo
                  electrónico o a través del soporte, podemos recopilar su nombre, dirección de
                  correo electrónico y el contenido de su comunicación.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">2. Uso de su Información</h2>
                <p>Utilizamos la información que recopilamos para diversos fines comerciales, que incluyen:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proporcionar, operar y mantener el Servicio</li>
                  <li>Procesar sus solicitudes y generar los resultados solicitados</li>
                  <li>Personalizar su experiencia dentro del Servicio</li>
                  <li>Mejorar y expandir nuestro Servicio</li>
                  <li>Comunicarnos con usted para servicio al cliente y actualizaciones</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">3. Seguridad de los Datos</h2>
                <p>
                  Utilizamos medidas de seguridad administrativas, técnicas y físicas razonables diseñadas
                  para proteger su información personal. Si bien hemos tomado medidas razonables para
                  asegurar la información personal que nos proporciona, tenga en cuenta que a pesar de
                  nuestros esfuerzos, ninguna medida de seguridad es perfecta o impenetrable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">4. Sus Derechos de Privacidad</h2>
                <p>Dependiendo de su ubicación y las leyes de privacidad aplicables, puede tener ciertos
                derechos con respecto a su información personal, que pueden incluir:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Derecho de Acceso</li>
                  <li>Derecho de Rectificación</li>
                  <li>Derecho de Supresión</li>
                  <li>Derecho de Oposición</li>
                  <li>Derecho a la Portabilidad de Datos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">5. Contacto</h2>
                <p>
                  Si tiene alguna pregunta sobre esta Política de Privacidad, por favor contáctenos:
                  <br />
                  Correo: miguelortiz.maos@profeplanner.com
                </p>
              </section>



              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Para más información sobre nuestros servicios, consulte nuestros{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                    Términos y Condiciones
                  </Link>
                  {", "}
                  <Link href="/refund-policy" className="text-blue-600 hover:text-blue-800 underline">
                    Política de Reembolsos
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