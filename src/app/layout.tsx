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
  title: "Dólar Hoy Argentina | Cotizaciones en Tiempo Real e Histórico",
  description: "Monitorea la cotización del dólar en Argentina (Oficial, Blue, MEP, CCL, Tarjeta, Cripto) en tiempo real con gráficos interactivos, alertas de precios y calculadora de impuestos.",
  keywords: ["dolar hoy", "dolar argentina", "dolar blue", "dolar oficial", "dolar mep", "cotizacion dolar", "dolar cripto"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}

