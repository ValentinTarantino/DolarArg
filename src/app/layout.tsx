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

export const metadata: Metadata = {
  title: "DólarARG | Cotizaciones en Tiempo Real",
  description: "Monitorea la cotización del dólar en Argentina (Oficial, Blue, MEP, CCL, Tarjeta, Cripto) en tiempo real con gráficos interactivos, alertas de precios y calculadora de impuestos.",
  keywords: ["dolar hoy", "dolar argentina", "dolar blue", "dolar oficial", "dolar mep", "cotizacion dolar", "dolar cripto"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DólarARG",
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

