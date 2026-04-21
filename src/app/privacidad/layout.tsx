import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | ElPiqueApp",
  description: "Conocé cómo ElPiqueApp protege tus datos personales. Política de privacidad y tratamiento de información.",
  openGraph: {
    title: "Política de Privacidad | ElPiqueApp",
    description: "Política de privacidad y tratamiento de datos de ElPiqueApp.",
    url: "https://elpiqueapp.com/privacidad",
    siteName: "ElPiqueApp",
    locale: "es_AR",
    type: "website",
  },
  alternates: { canonical: "https://elpiqueapp.com/privacidad" },
  robots: { index: true, follow: false },
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
