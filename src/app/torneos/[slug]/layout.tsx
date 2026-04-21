import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

async function getTorneo(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("tournaments")
    .select("nombre, descripcion, deporte, fecha_inicio, imagen_url, slug")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const torneo = await getTorneo(slug);

  if (!torneo) {
    return {
      title: "Torneo | ElPiqueApp",
      description: "Seguí los brackets y resultados de torneos deportivos en Catamarca.",
    };
  }

  const title = `${torneo.nombre} — Torneo de ${torneo.deporte} | ElPiqueApp`;
  const description = torneo.descripcion || `Inscribite al torneo de ${torneo.deporte} en Catamarca. Brackets y resultados en tiempo real.`;
  const url = `https://elpiqueapp.com/torneos/${slug}`;
  const image = torneo.imagen_url || "https://elpiqueapp.com/og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ElPiqueApp",
      locale: "es_AR",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: torneo.nombre }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url },
  };
}

export default function TorneoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
