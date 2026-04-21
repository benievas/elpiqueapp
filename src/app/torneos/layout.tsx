import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Torneos deportivos en Catamarca | ElPiqueApp",
  description: "Inscribite a torneos de fútbol, padel, tenis y vóley en Catamarca. Seguí los brackets y resultados en tiempo real con ElPiqueApp.",
  openGraph: {
    title: "Torneos deportivos en Catamarca | ElPiqueApp",
    description: "Inscribite a torneos de fútbol, padel, tenis y vóley. Brackets y resultados en vivo.",
    url: "https://elpiqueapp.com/torneos",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
    images: [{ url: "https://elpiqueapp.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Torneos deportivos | ElPiqueApp" },
  alternates: { canonical: "https://elpiqueapp.com/torneos" },
};

export default function TorneosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
