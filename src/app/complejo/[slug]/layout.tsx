import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

interface ComplejoRow {
  nombre: string;
  descripcion: string | null;
  deporte_principal: string;
  ciudad: string;
  direccion: string | null;
  telefono: string | null;
  foto_principal: string | null;
  slug: string;
}

async function getComplejo(slug: string): Promise<ComplejoRow | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("complexes")
    .select("nombre, descripcion, deporte_principal, ciudad, direccion, telefono, foto_principal, slug")
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
  const complejo = await getComplejo(slug);

  if (!complejo) {
    return {
      title: "Complejo deportivo | ElPiqueApp",
      description: "Reservá canchas deportivas en Catamarca con ElPiqueApp.",
    };
  }

  const title = `${complejo.nombre} — Reservar canchas | ElPiqueApp`;
  const description =
    complejo.descripcion ||
    `${complejo.nombre} en ${complejo.ciudad}. Reservá tu cancha de ${complejo.deporte_principal} online con ElPiqueApp.`;
  const url = `https://elpiqueapp.com/complejo/${slug}`;
  const image = complejo.foto_principal || "https://elpiqueapp.com/og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ElPiqueApp",
      images: [{ url: image, width: 1200, height: 630, alt: complejo.nombre }],
      type: "website",
      locale: "es_AR",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url },
  };
}

export default async function ComplejoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const complejo = await getComplejo(slug);

  const jsonLd = complejo
    ? {
        "@context": "https://schema.org",
        "@type": "SportsActivityLocation",
        name: complejo.nombre,
        description: complejo.descripcion || undefined,
        url: `https://elpiqueapp.com/complejo/${slug}`,
        image: complejo.foto_principal || undefined,
        address: complejo.direccion
          ? {
              "@type": "PostalAddress",
              streetAddress: complejo.direccion,
              addressLocality: complejo.ciudad,
              addressCountry: "AR",
            }
          : undefined,
        telephone: complejo.telefono || undefined,
        sport: complejo.deporte_principal,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
