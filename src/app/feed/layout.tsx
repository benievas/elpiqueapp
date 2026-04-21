import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed deportivo de Catamarca | ElPiqueApp",
  description: "Noticias, resultados y novedades del deporte catamarqueño. Seguí lo que pasa en tu ciudad con ElPiqueApp.",
  openGraph: {
    title: "Feed deportivo de Catamarca | ElPiqueApp",
    description: "Noticias, resultados y novedades del deporte en Catamarca.",
    url: "https://elpiqueapp.com/feed",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
    images: [{ url: "https://elpiqueapp.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Feed deportivo Catamarca | ElPiqueApp" },
  alternates: { canonical: "https://elpiqueapp.com/feed" },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
