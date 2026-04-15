"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2, Loader } from "lucide-react";

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

  useEffect(() => {
    fetchPosts();
  }, [filtroTipo]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("feed_posts")
        .select(
          `
          *,
          complex_name:complexes(nombre)
        `
        )
        .eq("visible", true)
        .order("created_at", { ascending: false });

      if (filtroTipo !== "todos") {
        query = query.eq("tipo", filtroTipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
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
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <Loader className="animate-spin text-rodeo-lime" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            Feed 📰
          </h1>
          <p className="text-rodeo-cream/70">
            Mantente actualizado con noticias, promos y eventos
          </p>
        </motion.div>

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

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="liquid-panel overflow-hidden"
                >
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
                        <h3 className="text-xl font-black text-white uppercase mb-2">
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
                          onClick={() => {
                            const newLiked = new Set(likedPosts);
                            if (newLiked.has(post.id)) {
                              newLiked.delete(post.id);
                            } else {
                              newLiked.add(post.id);
                            }
                            setLikedPosts(newLiked);
                          }}
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
                          {isLiked ? "Me encanta" : "Me encanta"}
                        </button>
                        <button className="flex items-center gap-2 text-sm font-bold text-rodeo-cream/60 hover:text-rodeo-lime transition-colors">
                          <MessageCircle size={18} />
                          Comentar
                        </button>
                      </div>
                      <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <Share2 size={18} className="text-rodeo-cream/60" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
