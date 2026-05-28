import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/styles/main.scss";
import { startLocalCron } from "@/lib/cron-local";

// Declarar variable global para rastrear si el cron ya fue iniciado
declare global {
  var cronInitialized: boolean;
}

// Inicializar cron local en desarrollo
(async () => {
  if (process.env.NODE_ENV === 'development' && !global.cronInitialized) {
    global.cronInitialized = true;
    try {
      await startLocalCron();
    } catch (error) {
      console.error('[Layout] Error iniciando cron local:', error);
    }
  }
})();

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dolararg.vercel.app";
const SITE_TITLE = "DolarARG | Dólar Blue, Tarjeta, Oficial, Bolsa y más · Argentina";
const SITE_DESCRIPTION =
  "Cotización del dólar en Argentina actualizada en tiempo real. Consultá el dólar blue, oficial, tarjeta, bolsa (MEP), CCL, cripto y mayorista. Gráficos históricos, calculadora, alertas de precios y cotizaciones de Euro, Real, Peso Chileno y Uruguayo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · DolarARG",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "dolar blue hoy", "dolar oficial hoy", "cotizacion dolar argentina",
    "dolar tarjeta", "dolar bolsa", "dolar mep", "dolar ccl",
    "dolar cripto", "dolar mayorista", "dolar hoy argentina",
    "precio dolar", "tipo de cambio argentina", "euro argentina",
    "real brasil argentina", "peso chileno", "peso uruguayo",
    "cotizaciones en tiempo real", "dolar blue precio",
    "calculadora dolar", "alerta dolar", "bcra banda cambiaria",
  ],
  authors: [{ name: "DolarARG" }],
  creator: "DolarARG",
  publisher: "DolarARG",
  category: "finance",
  manifest: "/manifest.json",
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
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "DolarARG",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "DolarARG - Cotizaciones del dólar en Argentina",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DolarARG",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={outfit.variable}>
      <head>
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[PWA] SW registrado:', reg.scope); })
                    .catch(function(err) { console.log('[PWA] SW error:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

