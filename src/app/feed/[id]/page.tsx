"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Share2, MapPin, Calendar, Loader, Heart, MessageCircle } from "lucide-react";

interface Post {
  id: string;
  titulo: string;
  contenido: string;
  tipo: "promo" | "noticia" | "evento" | "torneo" | "consejo";
  imagen_principal: string | null;
  galeria: string[] | null;
  complex_id: string;
  autor_id: string;
  created_at: string;
  visible: boolean;
  fecha_expiracion: string | null;
}

interface ComplexInfo {
  nombre: string;
  slug: string;
  ciudad: string | null;
  imagen_principal: string | null;
}

const TIPO_META: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  promo:   { bg: "bg-purple-500/20 border-purple-500/30", text: "text-purple-400", label: "PROMO",   emoji: "🎉" },
  noticia: { bg: "bg-blue-500/20 border-blue-500/30",     text: "text-blue-400",   label: "NOTICIA", emoji: "📢" },
  evento:  { bg: "bg-pink-500/20 border-pink-500/30",     text: "text-pink-400",   label: "EVENTO",  emoji: "🎪" },
  torneo:  { bg: "bg-orange-500/20 border-orange-500/30", text: "text-orange-400", label: "TORNEO",  emoji: "🏆" },
  consejo: { bg: "bg-green-500/20 border-green-500/30",   text: "text-green-400",  label: "CONSEJO", emoji: "💡" },
};

export default function FeedPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [complejo, setComplejo] = useState<ComplexInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from("feed_posts").select("*").eq("id", id).eq("visible", true).single() as { data: Post | null };
    if (!p) { setLoading(false); return; }
    setPost(p);
    if (p.complex_id) {
      const { data: c } = await supabase.from("complexes").select("nombre, slug, ciudad, imagen_principal").eq("id", p.complex_id).single();
      setComplejo(c as ComplexInfo | null);
    }
    setLoading(false);
  }

  async function compartir() {
    if (!post) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: post.titulo,
      text: post.contenido.slice(0, 140),
      url,
    };
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try { await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    } catch {
      alert(url);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rodeo-dark flex items-center justify-center">
        <Loader className="animate-spin text-rodeo-lime" size={32}/>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-rodeo-dark flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-rodeo-cream/70">Publicación no disponible</p>
          <Link href="/feed" className="text-rodeo-lime underline text-sm">Volver al feed</Link>
        </div>
      </div>
    );
  }

  const tipo = TIPO_META[post.tipo] ?? TIPO_META.noticia;
  const expirada = post.fecha_expiracion && new Date(post.fecha_expiracion) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark pb-28 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between gap-4 bg-rodeo-dark/70 backdrop-blur-md border-b border-white/5">
        <Link href="/feed" className="w-10 h-10 rounded-full border border-white/20 bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all shrink-0">
          <ChevronLeft className="text-rodeo-cream" size={20} />
        </Link>
        <button onClick={compartir}
          style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "12px" }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-rodeo-lime/20 transition-all text-rodeo-lime text-xs font-bold">
          <Share2 size={14}/> Compartir
        </button>
      </header>

      <article className="max-w-2xl mx-auto px-5 pt-6 space-y-6">
        {/* Imagen principal */}
        {post.imagen_principal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-[20px] overflow-hidden aspect-[16/10] bg-white/5">
            <img src={post.imagen_principal} alt={post.titulo} className="w-full h-full object-cover"/>
          </motion.div>
        )}

        {/* Título + meta */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border ${tipo.bg} ${tipo.text}`}>
              {tipo.emoji} {tipo.label}
            </span>
            <span className="text-xs text-rodeo-cream/40">
              {new Date(post.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {expirada && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/25">
                VENCIDO
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95, fontSize: "clamp(32px, 6vw, 52px)" }} className="text-white">
            <span className="section-slash">/</span>{post.titulo}
          </h1>

          {complejo && (
            <Link href={`/complejo/${complejo.slug}`} className="inline-flex items-center gap-2 text-sm text-rodeo-cream/70 hover:text-rodeo-lime transition-colors">
              <MapPin size={14}/> {complejo.nombre}{complejo.ciudad ? ` · ${complejo.ciudad}` : ""}
            </Link>
          )}
        </motion.div>

        {/* Contenido */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-rodeo-cream/85 leading-relaxed whitespace-pre-wrap text-base">
          {post.contenido}
        </motion.div>

        {/* Galería */}
        {post.galeria && post.galeria.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.galeria.map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                <img src={url} alt="" className="w-full h-full object-cover"/>
              </div>
            ))}
          </div>
        )}

        {/* Footer interacción */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex gap-4">
            <button onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${liked ? "text-red-400" : "text-rodeo-cream/60 hover:text-red-400"}`}>
              <Heart size={18} className={liked ? "fill-current" : ""}/>
              Me encanta
            </button>
            <button className="flex items-center gap-2 text-sm font-bold text-rodeo-cream/60">
              <MessageCircle size={18}/>
              Comentar
            </button>
          </div>
          <button onClick={compartir} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Share2 size={18} className="text-rodeo-cream/60"/>
          </button>
        </div>
      </article>
    </div>
  );
}
