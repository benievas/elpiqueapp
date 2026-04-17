import type { Metadata } from "next";
import "./globals.css";
import DeviceDetection from "@/components/DeviceDetection";
import BottomNav from "@/components/BottomNav";
import { CityProvider } from "@/lib/context/CityContext";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://matchpro.ar"),
  title: "ElPiqueApp - Reserva Canchas Deportivas",
  description: "Plataforma de reservas de canchas deportivas en Catamarca, Buenos Aires y Mendoza. Encuentra complejos, reserva canchas y participa en torneos.",
  keywords: [
    "canchas deportivas",
    "reservas fútbol",
    "padel",
    "tenis",
    "vóley",
    "catamarca",
    "torneos deportivos",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://matchpro.ar",
    siteName: "ElPiqueApp",
    title: "ElPiqueApp - Reserva Canchas Deportivas",
    description: "La plataforma más completa para reservar canchas deportivas",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ElPiqueApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElPiqueApp",
    description: "Reserva canchas deportivas en tu ciudad",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/assets/logo2.png",
    shortcut: "/assets/logo2.png",
    apple: "/assets/logo2.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F1A0E" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Inyección de variables de entorno públicas en runtime */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.__ENV=${JSON.stringify({
              NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
              NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            })}`,
          }}
        />

        {/* Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        />

        {/* Preconnect para recursos externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen" style={{ background: "linear-gradient(160deg, #040D07 0%, #081810 40%, #050F09 70%, #030A06 100%)" }}>
        <CityProvider>
          <DeviceDetection />
          {children}
          <BottomNav />
        </CityProvider>
      </body>
    </html>
  );
}
