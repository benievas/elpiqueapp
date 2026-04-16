"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark">
      <div className="max-w-3xl mx-auto px-6 py-12 pb-32">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-rodeo-cream/50 hover:text-rodeo-cream transition-colors mb-8 text-sm">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rodeo-lime/20 border border-rodeo-lime/30">
              <FileText size={28} className="text-rodeo-lime" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Términos y Condiciones</h1>
              <p className="text-rodeo-cream/50 text-sm mt-1">Última actualización: abril 2025</p>
            </div>
          </div>

          <div className="liquid-panel p-8 space-y-8 text-rodeo-cream/80 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">1. Aceptación de los términos</h2>
              <p>
                Al acceder y utilizar ElPiqueApp, aceptás estos Términos y Condiciones.
                Si no estás de acuerdo, por favor no uses la plataforma. El uso continuado
                de la plataforma implica la aceptación de cualquier modificación a estos términos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">2. Descripción del servicio</h2>
              <p>
                ElPiqueApp es una plataforma digital que conecta jugadores con complejos
                deportivos en Catamarca y otras ciudades. Facilitamos la búsqueda de canchas,
                la consulta de disponibilidad y la comunicación para reservas a través de WhatsApp.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">3. Cuentas de usuario</h2>
              <p>Para acceder a todas las funciones, debés crear una cuenta. Al hacerlo:</p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Proporcionás información veraz y actualizada</li>
                <li>Sos responsable de mantener la confidencialidad de tu cuenta</li>
                <li>Notificás inmediatamente cualquier uso no autorizado de tu cuenta</li>
                <li>Aceptás ser mayor de 13 años</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">4. Licencias para propietarios</h2>
              <p>Los propietarios de complejos deportivos deben adquirir una licencia:</p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Una licencia por complejo deportivo</li>
                <li>
                  Planes disponibles: mensual ($60.000 ARS) o anual ($600.000 ARS)
                </li>
                <li>30 días de prueba gratuita al registrar el primer complejo</li>
                <li>Las licencias no son transferibles a otros complejos o propietarios</li>
                <li>Sin reembolsos una vez activada la licencia pagada</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">5. Reservas y pagos</h2>
              <p>
                ElPiqueApp facilita la comunicación para reservas pero no es parte de
                la transacción entre el jugador y el propietario. Los pagos de reservas
                son acuerdos directos entre las partes. ElPiqueApp no se hace responsable
                por reservas no confirmadas o disputas entre usuarios y propietarios.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">6. Conducta del usuario</h2>
              <p>Al usar ElPiqueApp, acordás no:</p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Publicar contenido falso, engañoso o inapropiado</li>
                <li>Usar la plataforma para actividades ilegales</li>
                <li>Interferir con el funcionamiento de la plataforma</li>
                <li>Crear cuentas múltiples para evadir restricciones</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">7. Propiedad intelectual</h2>
              <p>
                Todo el contenido de ElPiqueApp, incluyendo diseño, logos, código y textos,
                es propiedad de ElPiqueApp y está protegido por derechos de autor.
                No podés usar, copiar o distribuir este contenido sin autorización expresa.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">8. Limitación de responsabilidad</h2>
              <p>
                ElPiqueApp no se responsabiliza por daños directos, indirectos o incidentales
                derivados del uso de la plataforma, incluyendo la cancelación de reservas,
                cambios en la disponibilidad de canchas o cualquier acción u omisión
                de los propietarios de complejos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">9. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios entran en vigencia al ser publicados. El uso continuado de
                la plataforma después de los cambios implica la aceptación de los mismos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">10. Ley aplicable</h2>
              <p>
                Estos términos se rigen por las leyes de la República Argentina.
                Cualquier disputa será resuelta en los tribunales de la Ciudad de Catamarca.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">11. Contacto</h2>
              <p>
                Para consultas sobre estos términos:{" "}
                <a href="mailto:contactomatchpro@gmail.com" className="text-rodeo-lime hover:underline">
                  contactomatchpro@gmail.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
