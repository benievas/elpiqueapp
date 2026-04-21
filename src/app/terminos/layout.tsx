import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | ElPiqueApp",
  description: "Términos y condiciones de uso de ElPiqueApp, la plataforma deportiva de Catamarca.",
  openGraph: {
    title: "Términos y Condiciones | ElPiqueApp",
    description: "Términos y condiciones de uso de ElPiqueApp.",
    url: "https://elpiqueapp.com/terminos",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
  },
  alternates: { canonical: "https://elpiqueapp.com/terminos" },
  robots: { index: true, follow: false },
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
