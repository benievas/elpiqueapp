"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import CityBanner from "@/components/CityBanner";
import { useCityContext } from "@/lib/context/CityContext";

interface Post {
  id: string;
  titulo: string;
  contenido: string;
  tipo: "promo" | "noticia" | "evento" | "torneo" | "consejo";
  imagen_principal: string | null;
  complex_id: string;
  autor_id: string;
  created_at: string;
  visible: boolean;
  complex_name?: string;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { ciudadCorta: city } = useCityContext();

  useEffect(() => {
    // Don't fetch until city resolves
    if (!city) return;
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, city]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Use a separate complexes join without !inner to avoid errors if table is empty
      let query = supabase
        .from("feed_posts")
        .select("*, complexes(nombre, ciudad)")
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (filtroTipo !== "todos") {
        query = query.eq("tipo", filtroTipo);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist yet — show empty state instead of hanging spinner
        console.warn("feed_posts query error:", error.message);
        setPosts([]);
        return;
      }

      // Filter by city client-side (avoids complex server-side join filter)
      const cityLower = city.toLowerCase();
      const postsMapeados = (data || [])
        .filter((p: any) => {
          const c = Array.isArray(p.complexes) ? p.complexes[0] : p.complexes;
          return !c || c.ciudad?.toLowerCase() === cityLower;
        })
        .map((p: any) => {
          const c = Array.isArray(p.complexes) ? p.complexes[0] : p.complexes;
          return { ...p, complex_name: c?.nombre ?? null };
        });

      setPosts(postsMapeados as Post[]);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const tipos = [
    { value: "todos", label: "Todo", emoji: "📰" },
    { value: "promo", label: "Promos", emoji: "🎉" },
    { value: "noticia", label: "Noticias", emoji: "📢" },
    { value: "evento", label: "Eventos", emoji: "🎪" },
    { value: "torneo", label: "Torneos", emoji: "🏆" },
    { value: "consejo", label: "Consejos", emoji: "💡" },
  ];

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      promo: { bg: "bg-purple-500/20 border-purple-500/30", text: "text-purple-400" },
      noticia: { bg: "bg-blue-500/20 border-blue-500/30", text: "text-blue-400" },
      evento: { bg: "bg-pink-500/20 border-pink-500/30", text: "text-pink-400" },
      torneo: { bg: "bg-orange-500/20 border-orange-500/30", text: "text-orange-400" },
      consejo: { bg: "bg-green-500/20 border-green-500/30", text: "text-green-400" },
    };
    return colors[tipo] || colors.noticia;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark pb-28">
        <header className="sticky top-0 z-30 px-5 py-4 flex items-center gap-4 bg-rodeo-dark/60 backdrop-blur-md border-b border-white/5">
          <div className="w-10 h-10 rounded-full border border-white/20 bg-white/8 flex items-center justify-center">
            <ChevronLeft className="text-rodeo-cream" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide">Feed</h1>
            <p className="text-xs text-rodeo-cream/50">Noticias, promos y eventos</p>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-5 pt-6 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="liquid-panel overflow-hidden">
              <Skeleton className="h-48 w-full" rounded="sm" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark pb-28">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 px-5 py-4 flex items-center gap-4 bg-rodeo-dark/60 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="w-10 h-10 rounded-full border border-white/20 bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all shrink-0">
          <ChevronLeft className="text-rodeo-cream" size={20} />
        </Link>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">
            <span className="section-slash">/</span>Feed
          </h1>
          <p className="text-xs text-rodeo-cream/50 mt-0.5">Noticias, promos y eventos</p>
        </div>
      </header>
      
      <CityBanner />

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-8">
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {tipos.map((tipo) => (
            <button
              key={tipo.value}
              onClick={() => setFiltroTipo(tipo.value)}
              className={`px-4 py-2 rounded-liquid border transition-all font-bold ${
                filtroTipo === tipo.value
                  ? "bg-rodeo-lime text-rodeo-dark border-rodeo-lime"
                  : "bg-white/5 border-white/10 text-rodeo-cream hover:bg-white/10"
              }`}
            >
              {tipo.emoji} {tipo.label}
            </button>
          ))}
        </motion.div>

        {/* Posts */}
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="liquid-panel p-12 text-center"
          >
            <p className="text-rodeo-cream/70">
              No hay publicaciones en este momento
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, idx) => {
              const tipoColor = getTipoColor(post.tipo);
              const isLiked = likedPosts.has(post.id);

              const compartir = async (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const url = `${window.location.origin}/feed/${post.id}`;
                const shareData = { title: post.titulo, text: post.contenido.slice(0, 140), url };
                const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
                if (nav.share) {
                  try { await nav.share(shareData); return; } catch { /* cancelled */ }
                }
                try { await navigator.clipboard.writeText(url); alert("Enlace copiado"); }
                catch { alert(url); }
              };

              const toggleLike = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const newLiked = new Set(likedPosts);
                if (newLiked.has(post.id)) newLiked.delete(post.id);
                else newLiked.add(post.id);
                setLikedPosts(newLiked);
              };

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link href={`/feed/${post.id}`} className="block liquid-panel overflow-hidden hover:border-white/25 transition-colors">
                  {/* Imagen */}
                  {post.imagen_principal && (
                    <div className="relative h-64 overflow-hidden bg-white/2">
                      <img
                        src={post.imagen_principal}
                        alt={post.titulo}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-rodeo-dark/80 via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "24px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white mb-2">
                          {post.titulo}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${tipoColor.bg} ${tipoColor.text}`}
                          >
                            {post.tipo.toUpperCase()}
                          </span>
                          <p className="text-xs text-rodeo-cream/50">
                            {new Date(post.created_at).toLocaleDateString(
                              "es-AR"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contenido */}
                    <p className="text-rodeo-cream/80 leading-relaxed line-clamp-3">
                      {post.contenido}
                    </p>

                    {/* Footer - Interacción */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex gap-4">
                        <button
                          onClick={toggleLike}
                          className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                            isLiked
                              ? "text-red-400"
                              : "text-rodeo-cream/60 hover:text-red-400"
                          }`}
                        >
                          <Heart
                            size={18}
                            className={isLiked ? "fill-current" : ""}
                          />
                          Me encanta
                        </button>
                        <span className="flex items-center gap-2 text-sm font-bold text-rodeo-cream/60">
                          <MessageCircle size={18} />
                          Comentar
                        </span>
                      </div>
                      <button onClick={compartir} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Compartir">
                        <Share2 size={18} className="text-rodeo-cream/60 hover:text-rodeo-lime" />
                      </button>
                    </div>
                  </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
