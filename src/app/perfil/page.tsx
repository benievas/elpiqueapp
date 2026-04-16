"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Globe,
  MapPin,
  Star,
  LogOut,
  User,
} from "lucide-react";

// --- Tipos ---
type TabType = "ingresar" | "registrarse";

// --- Mock data para el perfil logueado ---
const MOCK_USER = {
  nombre: "María González",
  email: "maria.gonzalez@email.com",
  inicial: "M",
};

const MOCK_FAVORITOS = [
  {
    slug: "las-cascaditas",
    nombre: "Las Cascaditas",
    imagen:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=400&auto=format&fit=crop",
  },
  {
    slug: "la-hosteria",
    nombre: "La Hostería",
    imagen:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop",
  },
  {
    slug: "cristo-redentor",
    nombre: "Cristo Redentor",
    imagen:
      "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=400&auto=format&fit=crop",
  },
];

const MOCK_ACTIVIDAD = [
  { lugar: "Las Cascaditas", hace: "hace 2 días" },
  { lugar: "Cristo Redentor", hace: "hace 5 días" },
  { lugar: "La Hostería del Rodeo", hace: "hace 1 semana" },
];

const MOCK_RESENAS = [
  {
    lugar: "Las Cascaditas",
    estrellas: 5,
    texto:
      "Un lugar increíble, el agua cristalina y el entorno natural son simplemente mágicos. Volvería mil veces.",
  },
  {
    lugar: "Cristo Redentor",
    estrellas: 4,
    texto:
      "La vista panorámica del valle es impresionante. La caminata vale mucho la pena, especialmente al atardecer.",
  },
];

// --- Componente de estrellas ---
function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= cantidad ? "text-yellow-400 fill-yellow-400" : "text-white/20"}
        />
      ))}
    </div>
  );
}

// --- Input común ---
function InputField({
  type,
  placeholder,
  value,
  onChange,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-liquid px-4 py-3 text-sm focus:outline-none focus:border-white/30 w-full text-rodeo-cream placeholder-rodeo-cream/25"
    />
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const [logueado, setLogueado] = useState(false);
  const [tab, setTab] = useState<TabType>("ingresar");

  // Ingresar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registrarse
  const [nombre, setNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleSubmit = () => {
    setLogueado(true);
  };

  return (
    <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans">
      {/* FONDO */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=2000&auto=format&fit=crop"
          alt="Fondo"
          style={{ filter: "blur(16px)" }}
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-rodeo-dark/80" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          {!logueado ? (
            /* ========== VISTA: NO LOGUEADO ========== */
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-start min-h-screen px-6 pt-8 pb-12"
            >
              {/* Header */}
              <div className="w-full max-w-sm flex items-center justify-between mb-6">
                <button
                  onClick={() => router.back()}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                  }}
                  className="p-2 hover:bg-white/15 transition-all"
                >
                  <ChevronLeft size={20} className="text-white/80" />
                </button>
                <img
                  src="/assets/elpique.png"
                  alt="ElPiqueApp"
                  className="h-10 w-auto"
                />
                <div className="w-9" />
              </div>

              <div className="w-full max-w-sm liquid-panel p-6 flex flex-col gap-5">
                {/* Tabs */}
                <div className="flex rounded-liquid overflow-hidden border border-white/10">
                  {(["ingresar", "registrarse"] as TabType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 text-sm font-semibold tracking-wide capitalize transition-colors ${
                        tab === t
                          ? "bg-white/15 text-rodeo-cream"
                          : "text-rodeo-cream/40 hover:text-rodeo-cream/70"
                      }`}
                    >
                      {t === "ingresar" ? "Ingresar" : "Registrarse"}
                    </button>
                  ))}
                </div>

                {/* Formularios */}
                <AnimatePresence mode="wait">
                  {tab === "ingresar" ? (
                    <motion.div
                      key="form-ingresar"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col gap-3"
                    >
                      <InputField
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={setEmail}
                      />
                      <InputField
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={setPassword}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form-registrarse"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col gap-3"
                    >
                      <InputField
                        type="text"
                        placeholder="Nombre completo"
                        value={nombre}
                        onChange={setNombre}
                      />
                      <InputField
                        type="email"
                        placeholder="Correo electrónico"
                        value={regEmail}
                        onChange={setRegEmail}
                      />
                      <InputField
                        type="password"
                        placeholder="Contraseña"
                        value={regPassword}
                        onChange={setRegPassword}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón submit */}
                <button
                  onClick={handleSubmit}
                  className="liquid-button w-full py-3 text-sm font-bold tracking-widest uppercase"
                >
                  {tab === "ingresar" ? "Ingresar" : "Crear Cuenta"}
                </button>

                {/* Separador */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-rodeo-cream/30">o continuá con</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Botón Google */}
                <button className="flex items-center justify-center gap-3 w-full py-3 rounded-liquid border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-rodeo-cream/70">
                  <Globe size={18} />
                  Continuar con Google
                </button>

                {/* Link explorar sin cuenta */}
                <Link
                  href="/"
                  className="text-center text-xs text-rodeo-cream/30 hover:text-rodeo-cream/60 transition-colors underline underline-offset-4"
                >
                  Explorar sin cuenta
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ========== VISTA: LOGUEADO ========== */
            <motion.div
              key="perfil"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center px-6 pt-10 pb-16 gap-6"
            >
              {/* Avatar + Info */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-rodeo-terracotta flex items-center justify-center text-3xl font-black text-white shadow-glass">
                  {MOCK_USER.inicial}
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black text-white">{MOCK_USER.nombre}</h2>
                  <p className="text-sm text-rodeo-cream/50">{MOCK_USER.email}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-rodeo-terracotta/20 text-rodeo-terracotta border border-rodeo-terracotta/30">
                    Turista
                  </span>
                </div>
              </div>

              <div className="w-full max-w-sm flex flex-col gap-5">
                {/* Mis Favoritos */}
                <section className="liquid-panel p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
                    Mis Favoritos
                  </h3>
                  <div className="flex flex-col gap-3">
                    {MOCK_FAVORITOS.map((fav) => (
                      <Link
                        key={fav.slug}
                        href={`/lugares/${fav.slug}`}
                        className="flex items-center gap-3 hover:bg-white/5 rounded-liquid p-2 -mx-2 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-liquid overflow-hidden shrink-0">
                          <img
                            src={fav.imagen}
                            alt={fav.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm font-semibold text-rodeo-cream">
                          {fav.nombre}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Actividad Reciente */}
                <section className="liquid-panel p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
                    Actividad Reciente
                  </h3>
                  <div className="flex flex-col gap-3">
                    {MOCK_ACTIVIDAD.map((act, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <MapPin size={14} className="text-rodeo-terracotta shrink-0" />
                        <span className="text-sm text-rodeo-cream/80">
                          Visitó{" "}
                          <span className="font-semibold text-rodeo-cream">
                            {act.lugar}
                          </span>{" "}
                          <span className="text-rodeo-cream/40">{act.hace}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Mis Reseñas */}
                <section className="liquid-panel p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
                    Mis Reseñas
                  </h3>
                  <div className="flex flex-col gap-4">
                    {MOCK_RESENAS.map((r, i) => (
                      <div key={i} className="flex flex-col gap-1.5 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-rodeo-cream">
                            {r.lugar}
                          </span>
                          <Estrellas cantidad={r.estrellas} />
                        </div>
                        <p className="text-xs text-rodeo-cream/60 leading-relaxed">
                          {r.texto}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Cerrar Sesión */}
                <button
                  onClick={() => setLogueado(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-liquid border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 transition-colors text-sm font-semibold text-rodeo-cream/60 hover:text-red-400"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
