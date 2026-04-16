import type { Metadata } from "next";

// Mock data matches what's in page.tsx — in production this would be a DB fetch
const MOCK_COMPLEXES: Record<string, { nombre: string; descripcion: string; imagenPrincipal: string; deporte: string }> = {
  "sportivo-central": {
    nombre: "Sportivo Central",
    deporte: "Fútbol / Multideporte",
    descripcion: "Complejo deportivo profesional con 8 canchas de fútbol sintético, padel y vóley. Reservá tu cancha directo por WhatsApp.",
    imagenPrincipal: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop",
  },
  "padel-club-elite": {
    nombre: "Padel Club Elite",
    deporte: "Padel / Tenis",
    descripcion: "6 canchas de padel con césped sintético de última generación e iluminación LED. Reservá tu horario en ElPiqueApp.",
    imagenPrincipal: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop",
  },
  "arena-voley": {
    nombre: "Arena Vóley Catamarca",
    deporte: "Vóley / Básquet",
    descripcion: "Estadio especializado en vóley con 4 canchas profesionales. Torneos y ligas regulares en Catamarca.",
    imagenPrincipal: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1200&auto=format&fit=crop",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const complejo = MOCK_COMPLEXES[slug];

  if (!complejo) {
    return {
      title: "Complejo deportivo | ElPiqueApp",
      description: "Reservá canchas deportivas en Catamarca con ElPiqueApp.",
    };
  }

  const title = `${complejo.nombre} — Reservar canchas | ElPiqueApp`;
  const description = complejo.descripcion;
  const url = `https://elpique.app/complejo/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ElPiqueApp",
      images: [
        {
          url: complejo.imagenPrincipal,
          width: 1200,
          height: 630,
          alt: complejo.nombre,
        },
      ],
      type: "website",
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [complejo.imagenPrincipal],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function ComplejoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
