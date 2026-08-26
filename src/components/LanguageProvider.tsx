"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "es" | "en";

const translations: Array<[string, string]> = [
  // --- Exact mixed strings from older cached renders ---
  ["Exchange Rates Bancos y Casas de Cambio", "Bank and Exchange House Rates"],
  ["Exchange Rates del dólar y divisas en Argentina actualizadas en tiempo real.", "Real-time exchange rates for the dollar and currencies in Argentina."],
  ["Exchange Rates referenciales. Verificar con el banco antes de operar.", "Indicative rates. Check with the bank before trading."],
  ["Official Dollar: Cotización base del Banco Nación sin impuestos.", "Official Dollar: Banco Nación base rate, before taxes."],
  ["Blue Dollar: Mercado informal (paralelo).", "Blue Dollar: Informal (parallel) market."],

  // --- Long descriptions (sort-first by length) ---
  ["Regístrate o inicia sesión para recibir alertas en tiempo real cuando el dólar alcance tu precio objetivo.", "Sign up or sign in to receive real-time alerts when the dollar reaches your target price."],
  ["Los datos publicados en este sitio son de carácter exclusivamente informativo. No constituyen asesoramiento financiero, ni recomendación de compra o venta de divisas. Verificá siempre con tu banco o casa de cambio antes de operar.", "The data published on this site is for informational purposes only. It does not constitute financial advice or a recommendation to buy or sell currencies. Always verify rates with your bank or exchange house before trading."],
  ["Cotizaciones del dólar y divisas en Argentina actualizadas en tiempo real. Compará tipos de cambio, configurá alertas y seguí el mercado cambiario.", "Real-time exchange rates for the dollar and currencies in Argentina. Compare rates, set alerts, and follow the currency market."],
  ["El Índice de Precios al Consumidor mide la variación de precios mensual. Su evolución impacta directamente en el tipo de cambio real.", "The Consumer Price Index measures monthly price changes. Its evolution directly affects the real exchange rate."],
  ["Las reservas internacionales son los activos en moneda extranjera del BCRA. Indican la capacidad del banco central para intervenir en el mercado cambiario.", "International reserves are the BCRA's foreign-currency assets. They indicate the central bank's ability to intervene in the currency market."],
  ["El Riesgo País (EMBI+) mide la sobretasa que paga Argentina sobre bonos del Tesoro de EE.UU. Menor valor = menor riesgo percibido por los mercados.", "Country Risk (EMBI+) measures the premium Argentina pays over U.S. Treasury bonds. A lower value means lower perceived market risk."],
  ["Rango de precios dentro del cual el BCRA permite que fluctúe el dólar mayorista sin intervenir.", "Price range within which the BCRA allows the wholesale dollar to fluctuate without intervention."],
  ["Piso del rango. Si el dólar cae a este nivel, el BCRA compra divisas para sostener el precio.", "Bottom of the range. If the dollar falls to this level, the BCRA buys foreign currency to support the price."],
  ["Techo del rango. Si el dólar sube a este nivel, el BCRA vende reservas para contener la suba.", "Top of the range. If the dollar rises to this level, the BCRA sells reserves to contain the increase."],
  ["Comunicación del BCRA que establece las reglas del sistema de bandas cambiarias vigente.", "BCRA communication establishing the rules for the current exchange-band system."],
  ["Contado con Liquidación. Permite dolarizar activos a través de acciones o bonos en el exterior.", "Cash with Settlement. Lets investors dollarize assets through stocks or bonds abroad."],
  ["Cotización base del Banco Nación sin impuestos. Referencia para importaciones y tarjetas.", "Banco Nación base rate, before taxes. A reference for imports and card purchases."],
  ["Solo para bancos y grandes operadores. Menor spread, sin acceso al público general.", "For banks and large operators only. Lower spread, not available to the general public."],
  ["Mercado informal (paralelo). Libre de impuestos y sin límites de compra.", "Informal (parallel) market. No taxes or purchase limits."],
  ["Oficial + 30% de percepciones impositivas. Aplica a compras con tarjeta en moneda extranjera.", "Official rate + 30% in tax surcharges. Applies to foreign-currency card purchases."],
  ["Cotización en plataformas cripto para stablecoins (USDT/DAI). Disponible 24hs.", "Rate on crypto platforms for stablecoins (USDT/DAI). Available 24/7."],
  ["Dólar legal mediante compra-venta de bonos en pesos y dólares. Sin límites.", "Legal dollar traded through peso- and dollar-denominated bonds. No limits."],
  ["Las bandas aplican oficialmente al Dólar Mayorista (COM 3500).", "The bands officially apply to the Wholesale Dollar (COM 3500)."],
  ["Las cotizaciones pueden presentar demoras o diferencias respecto a los valores reales del mercado.", "Rates may be delayed or differ from current market values."],
  ["Las cotizaciones pueden presentar demoras o diferencias respecto a los valores del mercado.", "Rates may be delayed or differ from current market values."],
  ["Ingresá tu email y te enviamos un enlace para restablecerla.", "Enter your email and we will send you a password-reset link."],
  ["Fuente: CoinGecko · Top 50 por capitalización de mercado", "Source: CoinGecko · Top 50 by market capitalization"],
  ["Fuente", "Source"],
  ["Período", "Period"],
  ["Registro exitoso. Por favor inicia sesión.", "Registration successful. Please sign in."],
  ["Iniciando fallback polling de cotizaciones cada 30 segundos...", "Starting fallback rate polling every 30 seconds..."],
  ["No se pudieron cargar las cotizaciones en este momento.", "Could not load exchange rates at this moment."],
  ["No hay datos históricos disponibles para este período.", "No historical data is available for this period."],
  ["No existe mercado paralelo (Blue) para esta moneda.", "There is no parallel (Blue) market for this currency."],
  ["No se existe mercado paralelo (Blue) para esta moneda.", "There is no parallel (Blue) market for this currency."],
  ["Límite de CoinGecko alcanzado. Reintentá en 1 minuto.", "CoinGecko rate limit reached. Try again in 1 minute."],
  ["La carga tardó demasiado. Intentando de nuevo en segundo plano.", "Loading took too long. Retrying in the background."],
  ["Precio cerca del mínimo del período. Puede ser buen momento para comprar.", "Price near the period low. Could be a good time to buy."],
  ["Precio cerca del máximo del período. Considerar esperar.", "Price near the period high. Consider waiting."],
  ["oficial + 30% de recargos impositivos vigentes en Argentina", "official rate + 30% in current Argentine tax surcharges"],
  ["Cotizaciones referenciales. Verificar con el banco antes de operar.", "Reference rates. Verify with your bank before trading."],
  ["Error al enviar el correo de restablecimiento", "Error sending password reset email"],
  ["Actualizar cotizaciones de criptomonedas en tiempo real", "Refresh real-time crypto prices"],
  ["Actualizar cotizaciones de bancos y casas de cambio", "Refresh bank and exchange house rates"],
  ["Actualizar indicadores macroeconómicos", "Refresh macroeconomic indicators"],
  ["Actualizar cotizaciones del dólar y divisas en Argentina en tiempo real", "Refresh real-time Argentina dollar and currency rates"],
  ["Actualizar cotizaciones del dólar y divisas en tiempo real", "Refresh real-time dollar and currency rates"],
  ["No se encontraron cotizaciones disponibles", "No exchange rates available"],
  ["Cotizaciones Bancos y Casas de Cambio", "Banks and Exchange Houses"],
  ["Valores actuales de las bandas cambiarias", "Current exchange band values"],
  ["No se encontraron resultados para", "No results found for"],
  ["Diferencias con las bandas", "Distance from the bands"],
  ["Iniciar sesión con Correo Electrónico", "Sign in with Email"],
  ["Registrar Correo Electrónico", "Register Email Address"],
  ["Actualizar cotizaciones de exchanges", "Refresh exchange rates"],
  ["Actualizar cotizaciones de criptomonedas", "Refresh crypto prices"],
  ["Actualizar cotizaciones del dólar", "Refresh dollar rates"],
  ["Actualizar cotizaciones de divisas", "Refresh currency rates"],
  ["Actualizar cotizaciones de bancos", "Refresh bank rates"],
  ["No se encontraron criptomonedas para", "No cryptocurrencies found for"],
  ["Actualizar todos los datos", "Refresh all data"],
  ["Actualizar bandas cambiarias", "Refresh exchange bands"],
  ["Cargando cotizaciones de bancos...", "Loading bank rates..."],
  ["No se encontraron cotizaciones disponibles", "No exchange rates available"],
  ["Dólar legal mediante compra-venta", "Legal dollar traded through bonds"],
  ["Enviar enlace de restablecimiento", "Send reset link"],
  ["Cargando configuración de alertas...", "Loading alert settings..."],
  ["No se encontraron resultados", "No results found"],
  ["No se pudo cargar el historial", "Could not load historical data"],
  ["Buscar dólar, euro, real...", "Search dollar, euro, real..."],
  ["Buscar criptomoneda...", "Search cryptocurrency..."],
  ["Por debajo de la banda inferior", "Below the lower band"],
  ["Descargar APK para Android", "Download APK for Android"],
  ["Cotizaciones de criptomonedas", "Cryptocurrency Prices"],
  ["Configuración de Alertas", "Alert Settings"],
  ["Dólar oficial y mayorista", "Official and wholesale dollar"],
  ["Dólar oficial y paralelo", "Official and parallel dollar"],
  ["Dólar blue y paralelo", "Blue and parallel dollar"],
  ["Menor venta (para comprar)", "Lowest sell price (to buy)"],
  ["Mayor compra (para vender)", "Highest buy price (to sell)"],
  ["Mejor opción para comprar", "Best option to buy"],
  ["Mejor opción para vender", "Best option to sell"],
  ["Cargando bandas cambiarias...", "Loading exchange bands..."],
  ["Cargando datos históricos...", "Loading historical data..."],
  ["Cargando tipos de cambio...", "Loading exchange rates..."],
  ["Cargando datos del gráfico", "Loading chart data"],
  ["Cargando cotizaciones...", "Loading exchange rates..."],
  ["Cargando criptomonedas...", "Loading cryptocurrencies..."],
  ["Cargando indicadores...", "Loading indicators..."],
  ["Cargando titulares...", "Loading headlines..."],
  ["No hay datos históricos", "No historical data"],
  ["Sin variación en el período", "No change during this period"],
  ["Error cargando datos del gráfico", "Error loading chart data"],
  ["Calculadora de USD y Pesos", "USD and Peso Calculator"],
  ["Cotización de Referencia", "Reference Exchange Rate"],
  ["Todos los derechos reservados", "All rights reserved"],
  ["Aún no tienes alertas configuradas.", "You have no alerts configured yet."],
  ["Ingresá tu nueva contraseña.", "Enter your new password."],
  ["¡Alerta creada con éxito!", "Alert created successfully!"],
  ["USD → ARS (Dólares a Pesos)", "USD → ARS (Dollars to Pesos)"],
  ["ARS → USD (Pesos a Dólares)", "ARS → USD (Pesos to Dollars)"],
  ["¿Ya tenés cuenta? Iniciá sesión", "Already have an account? Sign in"],
  ["¿No tenés cuenta? Registrate", "Don't have an account? Sign up"],
  ["Error al cargar cotizaciones", "Error loading exchange rates"],
  ["Error cargando cotizaciones", "Error loading exchange rates"],
  ["Error al cargar datos macro", "Error loading macro data"],
  ["Indicadores Macroeconómicos", "Macroeconomic Indicators"],
  ["Indicadores macroeconómicos", "Macroeconomic indicators"],
  ["Regístrate o inicia sesión", "Sign up or sign in"],
  ["Registrar con Correo Electrónico", "Register with Email"],
  ["Iniciar sesión con Correo Electrónico", "Sign in with Email"],
  ["Banda Cambiaria BCRA", "BCRA Exchange Band"],
  ["Dólar Contado con liquidación", "Cash with Settlement Dollar"],
  ["Dolar Contado con liquidación", "Cash with Settlement Dollar"],
  ["Dólar oficial y mayorista", "Official and wholesale dollar"],
  ["Iniciar sesión con GitHub", "Sign in with GitHub"],
  ["Iniciar sesión con Google", "Sign in with Google"],
  ["Registrar con GitHub", "Register with GitHub"],
  ["Registrar con Google", "Register with Google"],
  ["Percepción (%)", "Tax surcharge (%)"],
  ["Tasa de Referencia", "Reference Rate"],
  ["Dirección de Conversión", "Conversion Direction"],
  ["Dólar Oficial", "Official Dollar"],
  ["Dolar Oficial", "Official Dollar"],
  ["Dólar Mayorista", "Wholesale Dollar"],
  ["Dolar Mayorista", "Wholesale Dollar"],
  ["Dólar MEP / Bolsa", "MEP / Stock Exchange Dollar"],
  ["Dolar Bolsa", "Stock Exchange Dollar"],
  ["Evolución del Dolar:", "Dollar performance:"],
  ["Dólar Contado con liquidación", "Cash with Settlement Dollar"],
  ["Iniciar Sesión con Google", "Sign In with Google"],
  ["Registrarse con Google", "Sign Up with Google"],
  ["Iniciar Sesión con GitHub", "Sign In with GitHub"],
  ["Registrarse con GitHub", "Sign Up with GitHub"],
  ["Comparador de cotizaciones bancarias", "Bank rate comparison"],
  ["¿Qué es la banda cambiaria?", "What is the exchange band?"],
  ["No hay datos disponibles", "No data available"],
  ["¿Olvidaste tu contraseña?", "Forgot your password?"],
  ["Tu contraseña fue restablecida exitosamente", "Your password has been reset successfully"],
  ["Contraseña actualizada con éxito. Ya podés iniciar sesión.", "Password updated successfully. You can now sign in."],
  ["Comprar de a poco", "Buy little by little"],
  ["Buscar moneda...", "Search currency..."],
  ["Buscar", "Search"],
  ["ejemplo@correo.com", "example@email.com"],
  ["Buscar cotización", "Search exchange rate"],

  // --- Dólar names (with and without accent) ---
  ["Dolar Blue", "Blue Dollar"],
  ["Dólar Blue", "Blue Dollar"],
  ["Dolar Card", "Card Dollar"],
  ["Dólar Tarjeta", "Card Dollar"],
  ["Dolar Cripto", "Crypto Dollar"],
  ["Dólar Cripto", "Crypto Dollar"],
  ["Dolar Wholesale", "Wholesale Dollar"],
  ["Dólar CCL", "CCL Dollar"],

  // --- Calculator ---
  ["Monto a Convertir", "Amount to Convert"],
  ["Ingresa el monto en", "Enter the amount in"],
  ["dólares", "dollars"],
  ["pesos", "pesos"],
  ["Monto en Dólares", "Amount in Dollars"],
  ["Monto en Pesos", "Amount in Pesos"],
  ["Compra (Banco te compra)", "Buy (Bank buys from you)"],
  ["Venta (Banco te vende)", "Sell (Bank sells to you)"],
  ["USD banda inferior", "USD lower band"],
  ["USD banda superior", "USD upper band"],
  ["Conversor de Monedas", "Currency Converter"],
  ["Ranking de Rendimiento", "Performance Ranking"],
  ["Dólares a Pesos", "Dollars to Pesos"],
  ["Pesos a Dólares", "Pesos to Dollars"],
  ["Pesos Argentinos", "Argentine Pesos"],
  ["Superó la banda superior", "Exceeded the upper band"],

  // --- Macro ---
  ["reservas internacionales brutas", "gross international reserves"],
  ["tipo de cambio turista", "tourist exchange rate"],
  ["percepciones impositivas", "tax surcharges"],
  ["puntos básicos (EMBI+)", "basis points (EMBI+)"],
  ["variación mensual del IPC (INDEC)", "monthly CPI change (INDEC)"],
  ["varación mensual del IPC (INDEC)", "monthly CPI change (INDEC)"],

  // --- Band ---
  ["Valores actuales de las bandas cambiarias", "Current exchange band values"],

  // --- Alerts ---
  ["Precio Objetivo (Venta)", "Target Price (Sell)"],
  ["Cuando supere o sea igual a (≥)", "When it reaches or exceeds (≥)"],
  ["Cuando caiga o sea igual a (≤)", "When it falls to or below (≤)"],

  // --- Section titles ---
  ["Datos en tiempo real", "Real-time data"],
  ["Mercado Cambiario", "Currency Market"],
  ["Argentina en tiempo real", "Argentina in real time"],
  ["Fuentes de datos", "Data Sources"],
  ["Tipo de Cambio", "Exchange Rate"],
  ["Cotizaciones", "Exchange Rates"],
  ["Tipos de cambio", "Exchange rates"],
  ["Spread blue", "Blue spread"],
  ["Mayor mov.", "Biggest move"],
  ["Riesgo País", "Country Risk"],
  ["Bajo", "Low"],
  ["Crear cuenta", "Create account"],
  ["Si ese email está registrado, recibirás un enlace para restablecer tu contraseña.", "If that email is registered, you will receive a password reset link."],
  ["Dólar", "Dollar"],
  ["Real Brasileño", "Brazilian Real"],
  ["Peso Chileno", "Chilean Peso"],
  ["Peso Uruguayo", "Uruguayan Peso"],
  ["Cripto", "Crypto"],
  ["Dólar oficial y mayorista", "Official and wholesale dollar"],
  ["Dólar blue y paralelo", "Blue and parallel dollar"],
  ["Criptomonedas", "Cryptocurrencies"],
  ["Referencia de mercado", "Market reference"],
  ["Indicadores macroeconómicos", "Macroeconomic indicators"],
  ["Datos económicos abiertos", "Open economic data"],
  ["Todos los derechos reservados", "All rights reserved"],
  ["Hecho en Argentina 🇦🇷", "Made in Argentina 🇦🇷"],
  ["Mejor opción para comprar", "Best option for buying"],
  ["Mejor opción para vender", "Best option for selling"],
  ["💡 Cotizaciones referenciales. Verificar con el banco antes de operar.", "💡 Indicative rates. Check with your bank before trading."],
  ["Al", "At"],
  ["de la banda", "of the band"],
  ["BANDA CAMBIARIA", "EXCHANGE BAND"],
  ["VALOR", "VALUE"],
  ["para llegar a la banda superior.", "to reach the upper band."],
  ["para llegar a la banda inferior.", "to reach the lower band."],
  ["El dólar debería subir", "The dollar would need to rise"],
  ["El dólar debería bajar", "The dollar would need to fall"],
  ["El dólar ha superado la banda superior.", "The dollar has exceeded the upper band."],
  ["El dólar está por debajo de la banda inferior.", "The dollar is below the lower band."],
  ["Oficial", "Official"],
  ["Blue", "Blue"],
  ["MEP", "MEP"],
  ["Contado con Liqui", "Cash with Settlement"],
  ["Tarjeta", "Card"],
  ["Cripto", "Crypto"],
  ["Mayorista", "Wholesale"],
  ["Reservas BCRA", "BCRA Reserves"],
  ["Inflación Mensual", "Monthly Inflation"],
  ["RESERVAS BCRA", "BCRA RESERVES"],
  ["INFLACIÓN MENSUAL", "MONTHLY INFLATION"],
  ["Cotizaciones del dólar", "Dollar rates"],
  ["Cotizaciones de bancos", "Bank rates"],
  ["Compra", "Buy"],
  ["Venta", "Sell"],
  ["Dólar", "Dollar"],
  ["dólar", "dollar"],
  ["Real", "Real"],
  ["Euro", "Euro"],
  ["Peso Chileno", "Chilean Peso"],
  ["Peso Uruguayo", "Uruguayan Peso"],
  ["Actualizado", "Updated"],
  ["Act.", "Updated"],
  ["Diaria", "Daily"],
  ["Días", "Days"],
  ["Comprar", "Buy"],
  ["vender", "sell"],
  ["bancos", "banks"],
  ["casas de cambio", "exchange houses"],
  ["por día", "per day"],
  ["para comprar", "to buy"],
  ["para vender", "to sell"],
  ["Actualizar", "Refresh"],
  ["Variación", "Variation"],
  ["Precios", "Prices"],

  // --- Auth ---
  ["Iniciar sesión", "Sign in"],
  ["Iniciar Sesión", "Sign In"],
  ["Correo Electrónico", "Email Address"],
  ["Nueva contraseña", "New Password"],
  ["Guardar contraseña", "Save Password"],
  ["Ingresá tu email y contraseña", "Enter your email and password"],
  ["Registrar usuario", "Register user"],
  ["Proveedor de autenticación", "Authentication provider"],
  ["Correos Electrónicos", "Email Addresses"],
  ["Creando tu cuenta...", "Creating your account..."],

  // --- Footer ---
  ["Secciones", "Sections"],
  ["Hecho en Argentina 🇦🇷", "Made in Argentina 🇦🇷"],
  ["⚠ Solo informativo", "⚠ For informational purposes only"],
  ["Noticias Económicas", "Economic News"],
  ["BANCO", "BANK"],
  ["COMPRA", "BUY"],
  ["VENTA", "SELL"],
  ["SPREAD", "SPREAD"],
  ["NOMBRE", "NAME"],
  ["PRECIO", "PRICE"],
  ["Nombre", "Name"],
  ["Circulante", "Circulating"],

  // --- Crypto table ---
  ["← Anterior", "← Previous"],
  ["Siguiente →", "Next →"],
  ["Página", "Page"],

  // --- Buttons / actions ---
  ["Volver", "Back"],
  ["Salir", "Sign out"],
  ["Favorable", "Favorable"],
  ["Intermedio", "Intermediate"],
  ["Precaución", "Caution"],
  ["Crítico", "Critical"],
  ["Compartir", "Share"],
  ["¡Copiado!", "Copied!"],
  ["Brecha", "Spread"],
  ["Máximo", "Maximum"],
  ["Mínimo", "Minimum"],
  ["Promedio", "Average"],
  ["Menú", "Menu"],
  ["Comparador", "Comparator"],
  ["Resultado", "Result"],
  ["Invertir", "Reverse"],
  ["Crear Alerta", "Create Alert"],
  ["Enviar enlace", "Send link"],
  ["Enviando...", "Sending..."],

  // --- Short labels ---
  ["Legal", "Legal"],
  ["Glosario", "Glossary"],
  ["Contraseña", "Password"],
  ["Hoy", "Today"],
  ["Descargar App", "Download App"],
  ["Banda inferior", "Lower band"],
  ["Banda superior", "Upper band"],
  ["Rango de valores", "Value range"],
  ["Monto Base", "Base Amount"],
  ["Total Estimado", "Estimated Total"],

  // --- Status ---
  ["Sin datos disponibles", "No data available"],
  ["Iniciando dashboard...", "Starting dashboard..."],
  ["Error al crear alerta", "Error creating alert"],
  ["Error al autenticar", "Authentication error"],
  ["Por favor ingresa un precio objetivo", "Please enter a target price"],

  // --- Misc ---
  ["Buen momento", "Good time"],
  ["Zona neutra", "Neutral zone"],
  ["Precio alto", "High price"],
  ["Últimos 30 registros", "Last 30 records"],
  ["Último dato", "Latest data"],
  ["vs día anterior", "vs previous day"],
  ["Frecuencia: Diaria", "Frequency: Daily"],
  ["de la banda", "of the band"],
  ["Ordenar por:", "Sort by:"],
  ["Eliminar alerta", "Delete alert"],
  ["Cargando datos de", "Loading data for"],
  ["No se pudieron cargar los datos de", "Could not load data for"],
  ["Actualizar datos", "Refresh data"],
  ["Actualizar precios", "Refresh prices"],
  ["Actualizar indicadores", "Refresh indicators"],
  ["Actualizar criptomonedas", "Refresh crypto"],
  ["Actualizar noticias", "Refresh news"],
  ["Actualizar cotización", "Refresh exchange rate"],
  ["Actualizar datos macro", "Refresh macro data"],
];

const translationsSorted: Array<[string, string]> = translations.sort(
  (a, b) => b[0].length - a[0].length
);

const translate = (value: string, language: Language) => {
  let result = value;
  for (const [spanish, english] of translationsSorted) {
    const searchFor = language === "en" ? spanish : english;
    const replaceWith = language === "en" ? english : spanish;
    if (result.includes(searchFor)) {
      result = result.replaceAll(searchFor, replaceWith);
    }
  }
  return result;
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<HTMLElement, Map<string, string>>();

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (value: string) => string }>({
  language: "es",
  setLanguage: () => undefined,
  t: (value) => value,
});

function translatePage(language: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  nodes.forEach((text) => {
    if (text.parentElement?.closest("script, style, noscript")) return;
    const current = text.nodeValue || "";
    const source = originalText.get(text) ?? current;
    originalText.set(text, source);
    const translated = translate(source, language);
    if (translated !== current) text.nodeValue = translated;
  });
  document.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]").forEach((element) => {
    for (const attribute of ["placeholder", "title", "aria-label"]) {
      const value = element.getAttribute(attribute);
      if (value) {
        let attributes = originalAttributes.get(element);
        if (!attributes) {
          attributes = new Map();
          originalAttributes.set(element, attributes);
        }
        const source = attributes.get(attribute) ?? value;
        attributes.set(attribute, source);
        const translated = translate(source, language);
        if (translated !== value) element.setAttribute(attribute, translated);
      }
    }
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    const saved = window.localStorage.getItem("dolararg-language");
    if (saved === "en" || saved === "es") setLanguageState(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("dolararg-language", language);
    document.cookie = `dolararg-language=${language}; path=/; max-age=31536000; samesite=lax`;
    translatePage(language);
    let translating = false;
    const observer = new MutationObserver(() => {
      if (!translating) {
        translating = true;
        requestAnimationFrame(() => {
          translatePage(language);
          translating = false;
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: (next: Language) => setLanguageState(next),
    t: (value: string) => translate(value, language),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);
  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2000, display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "#12131c", border: "1px solid rgba(255,255,255,.12)" }}>
      <button type="button" onClick={() => setLanguage("es")} aria-pressed={language === "es"} style={{ border: 0, borderRadius: 999, padding: "6px 10px", cursor: "pointer", color: "#fff", background: language === "es" ? "#6366f1" : "transparent" }}>ES</button>
      <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} style={{ border: 0, borderRadius: 999, padding: "6px 10px", cursor: "pointer", color: "#fff", background: language === "en" ? "#6366f1" : "transparent" }}>EN</button>
    </div>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
