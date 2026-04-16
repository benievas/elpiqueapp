"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacidadPage() {
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
              <Shield size={28} className="text-rodeo-lime" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Política de Privacidad</h1>
              <p className="text-rodeo-cream/50 text-sm mt-1">Última actualización: abril 2025</p>
            </div>
          </div>

          <div className="liquid-panel p-8 space-y-8 text-rodeo-cream/80 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">1. Información que recopilamos</h2>
              <p>
                ElPiqueApp recopila la información que vos proporcionás directamente al usar
                nuestro servicio, incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Nombre y dirección de correo electrónico (al registrarte con Google)</li>
                <li>Información de tu complejo deportivo (si sos propietario)</li>
                <li>Historial de reservas e interacciones con la plataforma</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">2. Cómo usamos tu información</h2>
              <p>Utilizamos la información recopilada para:</p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Proveer, operar y mejorar los servicios de ElPiqueApp</li>
                <li>Procesar reservas y facilitar la comunicación entre jugadores y propietarios</li>
                <li>Enviar notificaciones relacionadas con tu actividad en la plataforma</li>
                <li>Procesar pagos de licencias a través de MercadoPago</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">3. Compartición de datos</h2>
              <p>
                No vendemos, alquilamos ni compartimos tu información personal con terceros,
                excepto en los siguientes casos:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Con propietarios de complejos, solo la información necesaria para gestionar tu reserva</li>
                <li>Con MercadoPago, para procesar pagos de forma segura</li>
                <li>Cuando sea requerido por ley o autoridades competentes</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">4. Seguridad</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger
                tu información personal. Utilizamos Supabase como plataforma de backend,
                que cumple con estándares de seguridad SOC 2 Type II y cifrado en tránsito
                y en reposo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">5. Cookies</h2>
              <p>
                Utilizamos cookies esenciales para el funcionamiento de la autenticación y
                la sesión de usuario. No utilizamos cookies de rastreo o publicidad de terceros.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">6. Tus derechos</h2>
              <p>Tenés derecho a:</p>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Acceder a tu información personal</li>
                <li>Solicitar la corrección de datos incorrectos</li>
                <li>Solicitar la eliminación de tu cuenta y datos</li>
                <li>Oponerte al procesamiento de tus datos</li>
              </ul>
              <p className="text-sm">
                Para ejercer estos derechos, contactanos en{" "}
                <a href="mailto:contactomatchpro@gmail.com" className="text-rodeo-lime hover:underline">
                  contactomatchpro@gmail.com
                </a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">7. Menores de edad</h2>
              <p>
                ElPiqueApp no está dirigida a menores de 13 años. No recopilamos
                intencionalmente información de menores. Si sos padre o tutor y creés
                que tu hijo proporcionó información personal, contactanos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">8. Cambios a esta política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos
                sobre cambios significativos a través de la aplicación o por correo electrónico.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">9. Contacto</h2>
              <p>
                Si tenés preguntas sobre esta política, contactanos en:{" "}
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
