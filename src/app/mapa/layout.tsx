import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa de complejos deportivos en Catamarca | ElPiqueApp",
  description: "Mapa interactivo de complejos y canchas deportivas en Catamarca. Encontrá el más cercano a vos con ElPiqueApp.",
  openGraph: {
    title: "Mapa deportivo de Catamarca | ElPiqueApp",
    description: "Mapa interactivo con todos los complejos y canchas deportivas de Catamarca.",
    url: "https://elpiqueapp.com/mapa",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
    images: [{ url: "https://elpiqueapp.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Mapa deportivo Catamarca | ElPiqueApp" },
  alternates: { canonical: "https://elpiqueapp.com/mapa" },
};

export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
