import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Armá partido en Catamarca | ElPiqueApp",
  description: "Publicá que te falta gente para jugar. Unite a partidos abiertos de fútbol, pádel, tenis y más en Catamarca con ElPiqueApp.",
  openGraph: {
    title: "Armá partido | ElPiqueApp",
    description: "Matchmaking social para jugadores de Catamarca. Unite a partidos abiertos o publicá el tuyo.",
    url: "https://elpiqueapp.com/partidos",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
  },
  alternates: { canonical: "https://elpiqueapp.com/partidos" },
};

export default function PartidosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
