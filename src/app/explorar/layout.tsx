import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar complejos deportivos en Catamarca | ElPiqueApp",
  description: "Encontrá complejos deportivos en Catamarca. Fútbol, padel, tenis, vóley y más. Reservá tu cancha online con ElPiqueApp.",
  openGraph: {
    title: "Explorar complejos deportivos | ElPiqueApp",
    description: "Encontrá y reservá canchas en los mejores complejos deportivos de Catamarca.",
    url: "https://elpiqueapp.com/explorar",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
    images: [{ url: "https://elpiqueapp.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Explorar complejos | ElPiqueApp" },
  alternates: { canonical: "https://elpiqueapp.com/explorar" },
};

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
