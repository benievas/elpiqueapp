"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { ChevronLeft, Share2, MapPin, Loader, Heart, MessageCircle, Send, Trash2 } from "lucide-react";

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

interface Comment {
  id: string;
  user_id: string;
  contenido: string;
  created_at: string;
  autor_nombre: string | null;
  autor_avatar: string | null;
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
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [complejo, setComplejo] = useState<ComplexInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeSaving, setLikeSaving] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { if (id) load(); }, [id, user?.id]);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from("feed_posts").select("*").eq("id", id).eq("visible", true).single() as { data: Post | null };
    if (!p) { setLoading(false); return; }
    setPost(p);
    if (p.complex_id) {
      const { data: c } = await supabase.from("complexes").select("nombre, slug, ciudad, imagen_principal").eq("id", p.complex_id).single();
      setComplejo(c as ComplexInfo | null);
    }
    // Likes
    const { data: likesData } = await supabase
      .from("feed_likes")
      .select("user_id")
      .eq("post_id", p.id);
    const likes = likesData || [];
    setLikeCount(likes.length);
    setLiked(!!user && likes.some((l: { user_id: string }) => l.user_id === user.id));

    // Comentarios
    await loadComments(p.id);

    setLoading(false);
  }

  async function loadComments(postId: string) {
    const { data } = await supabase
      .from("feed_comments")
      .select("id, user_id, contenido, created_at, profiles(nombre_completo, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const mapped: Comment[] = (data || []).map((c: any) => {
      const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return {
        id: c.id,
        user_id: c.user_id,
        contenido: c.contenido,
        created_at: c.created_at,
        autor_nombre: prof?.nombre_completo ?? null,
        autor_avatar: prof?.avatar_url ?? null,
      };
    });
    setComments(mapped);
  }

  async function enviarComentario() {
    if (!post) return;
    if (!user) {
      router.push(`/login?returnTo=/feed/${post.id}`);
      return;
    }
    const texto = commentText.trim();
    if (!texto || sendingComment) return;
    setSendingComment(true);
    const { error } = await supabaseMut.from("feed_comments").insert({
      post_id: post.id,
      user_id: user.id,
      contenido: texto,
    });
    if (!error) {
      setCommentText("");
      await loadComments(post.id);
    }
    setSendingComment(false);
  }

  async function borrarComentario(cid: string) {
    if (!user || deletingId) return;
    setDeletingId(cid);
    const { error } = await supabaseMut.from("feed_comments").delete().eq("id", cid).eq("user_id", user.id);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== cid));
    }
    setDeletingId(null);
  }

  async function toggleLike() {
    if (!post) return;
    if (!user) {
      router.push(`/login?returnTo=/feed/${post.id}`);
      return;
    }
    if (likeSaving) return;
    setLikeSaving(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, wasLiked ? c - 1 : c + 1));

    if (wasLiked) {
      const { error } = await supabaseMut.from("feed_likes").delete()
        .eq("post_id", post.id).eq("user_id", user.id);
      if (error) {
        setLiked(wasLiked);
        setLikeCount((c) => c + 1);
      }
    } else {
      const { error } = await supabaseMut.from("feed_likes").insert({
        post_id: post.id, user_id: user.id,
      });
      if (error) {
        setLiked(wasLiked);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    }
    setLikeSaving(false);
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
            <button onClick={toggleLike} disabled={likeSaving}
              className={`flex items-center gap-2 text-sm font-bold transition-colors disabled:opacity-60 ${liked ? "text-red-400" : "text-rodeo-cream/60 hover:text-red-400"}`}>
              <Heart size={18} className={liked ? "fill-current" : ""}/>
              {likeCount > 0 ? likeCount : "Me encanta"}
            </button>
            <a href="#comentarios" className="flex items-center gap-2 text-sm font-bold text-rodeo-cream/60 hover:text-rodeo-lime transition-colors">
              <MessageCircle size={18}/>
              {comments.length > 0 ? comments.length : "Comentar"}
            </a>
          </div>
          <button onClick={compartir} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Share2 size={18} className="text-rodeo-cream/60"/>
          </button>
        </div>

        {/* COMENTARIOS */}
        <section id="comentarios" className="space-y-4 pt-4">
          <h2 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "24px", textTransform: "uppercase", letterSpacing: "-0.01em" }} className="text-white">
            <span className="section-slash">/</span>Comentarios {comments.length > 0 && <span className="text-rodeo-cream/40">· {comments.length}</span>}
          </h2>

          {user ? (
            <div className="flex gap-2 items-start">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribí un comentario..."
                maxLength={500}
                rows={2}
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"12px", color:"#E1D4C2" }}
                className="flex-1 px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25 outline-none focus:border-rodeo-lime/40 resize-none"
              />
              <button
                onClick={enviarComentario}
                disabled={sendingComment || !commentText.trim()}
                style={{ background: "rgba(200,255,0,0.9)", borderRadius:"12px" }}
                className="p-3 text-rodeo-dark disabled:opacity-40 hover:brightness-110 transition-all"
                title="Enviar comentario">
                {sendingComment ? <Loader size={16} className="animate-spin"/> : <Send size={16}/>}
              </button>
            </div>
          ) : (
            <Link href={`/login?returnTo=/feed/${post.id}`}
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"12px" }}
              className="block px-4 py-3 text-sm text-center text-rodeo-cream/70 hover:text-rodeo-lime transition-colors">
              Iniciá sesión para comentar
            </Link>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-rodeo-cream/40 text-center py-6">Sé el primero en comentar</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => {
                const esMio = user?.id === c.user_id;
                const nombre = c.autor_nombre || "Usuario";
                const inicial = nombre.charAt(0).toUpperCase();
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }}
                    className="p-3 flex gap-3 items-start">
                    {c.autor_avatar ? (
                      <img src={c.autor_avatar} alt={nombre} className="w-8 h-8 rounded-full object-cover shrink-0"/>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rodeo-lime/20 text-rodeo-lime font-black text-xs flex items-center justify-center shrink-0">
                        {inicial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{nombre}</p>
                        <p className="text-[10px] text-rodeo-cream/40">
                          {new Date(c.created_at).toLocaleDateString("es-AR", { day:"numeric", month:"short" })}
                        </p>
                      </div>
                      <p className="text-sm text-rodeo-cream/85 mt-0.5 whitespace-pre-wrap break-words">{c.contenido}</p>
                    </div>
                    {esMio && (
                      <button
                        onClick={() => borrarComentario(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1.5 text-rodeo-cream/30 hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
                        title="Borrar">
                        {deletingId === c.id ? <Loader size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
