# DólarARG

Plataforma fullstack para monitorear cotizaciones del dólar, euro, real, peso chileno, peso uruguayo y criptomonedas en Argentina en tiempo real, con historial, gráficos, calculadora, alertas, bandas cambiarias del BCRA y soporte PWA (instalable como app).

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | SASS (SCSS) |
| ORM | Prisma 5 |
| Base de datos | SQLite (desarrollo) / compatible con PostgreSQL (producción) |
| Gráficos | Recharts |
| Íconos | Lucide React |
| Email | Nodemailer |
| Web Scraping | Cheerio + Axios |
| Cron (dev) | node-cron |
| Cron (prod) | Vercel Cron Jobs |
| Deploy | Vercel |
| PWA | Web App Manifest + Service Worker |
| SEO | OpenGraph, Twitter Cards, Sitemap, Robots.txt |
| APK | Firma con Android Studio (apksigner) |

---

## Base de Datos

Se usa **SQLite** en desarrollo (archivo `prisma/dev.db`) y puede configurarse con **PostgreSQL** o cualquier base compatible con Prisma en producción, simplemente cambiando el `provider` en `schema.prisma` y la variable `DATABASE_URL`.

### Modelos (schema.prisma)

#### `DolarRate`
Almacena cada snapshot de cotización del dólar guardado por el cron.

```prisma
model DolarRate {
  id        Int      @id @default(autoincrement())
  casa      String   // "oficial", "blue", "bolsa", "tarjeta", etc.
  nombre    String
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([casa, fecha])
}
```

#### `ExchangeRateHistory`
Historial de cotizaciones de Euro (EUR) y Real (BRL) por tipo.

```prisma
model ExchangeRateHistory {
  id        Int      @id @default(autoincrement())
  codigo    String   // "EUR" o "BRL"
  tipo      String   // "oficial", "blue", "tarjeta"
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([codigo, tipo, fecha])
}
```

#### `User` y `Alert`
Sistema de usuarios con autenticación JWT y alertas de precio personalizadas.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // hash bcrypt
  createdAt DateTime @default(now())
  alerts    Alert[]
}

model Alert {
  id          Int     @id @default(autoincrement())
  userId      Int
  casa        String   // tipo de dólar a monitorear
  condition   String   // "ABOVE" o "BELOW"
  value       Float    // precio límite
  isTriggered Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## Backend — API Routes

Todas las rutas viven en `src/app/api/` y corren como funciones serverless en Vercel.

### `/api/dolar` — Cotizaciones actuales
Consulta la API pública [dolarapi.com](https://dolarapi.com) y devuelve las cotizaciones del dólar (oficial, blue, MEP, CCL, tarjeta, cripto, mayorista). También persiste los datos en la base de datos.

### `/api/dolar/live` — Tiempo real (SSE)
Implementa **Server-Sent Events** (SSE) con **reconexión automática**. Mantiene una conexión HTTP persistente con el cliente y hace polling a la base de datos cada 5 segundos. Si detecta nuevos registros en `DolarRate`, los envía al frontend. Incluye lógica de reconexión con backoff exponencial (2s, 4s, 8s... hasta 30s) para recuperarse automáticamente ante desconexiones.

```
GET /api/dolar/live
Content-Type: text/event-stream

event: connected
event: rates_update  ← se dispara cuando el cron guarda nuevas cotizaciones
```

### `/api/dolar/history` — Historial para gráficos
Devuelve los registros de `DolarRate` para un tipo de dólar y un rango de días. Agrupa por día (último registro del día) para evitar duplicados en el gráfico.

```
GET /api/dolar/history?type=blue&days=30
```

### `/api/dolar/cron` — Cron endpoint (producción)
Endpoint HTTP que invoca Vercel Cron cada 5 minutos. Llama a dolarapi.com, guarda las cotizaciones en la base de datos y verifica las alertas activas de los usuarios.

### `/api/exchange-rates` — Euro y Real
Obtiene cotizaciones de EUR y BRL cruzando los tipos de dólar (oficial, blue, tarjeta) con la tasa de cambio USD→EUR/BRL desde [exchangerate-api.com](https://exchangerate-api.com).

### `/api/bandas` — Banda Cambiaria BCRA
Calcula matemáticamente las bandas del BCRA desde su fecha de inicio (11 de abril de 2025), aplicando el deslizamiento mensual: 1% fijo hasta diciembre 2025 y ~2.8% desde enero 2026 (estimado por IPC con rezago T-2). No requiere base de datos, el cálculo es puramente aritmético.

### `/api/bank-rates` — Cotizaciones bancarias
Realiza **web scraping** con Cheerio sobre fuentes públicas para obtener los precios de compra/venta de los principales bancos y casas de cambio argentinas.

### `/api/alerts` — Sistema de alertas
CRUD de alertas de precio. Cuando el cron detecta que el precio de un dólar supera o baja del umbral definido por el usuario, marca la alerta como disparada y envía un email via Nodemailer.

### `/api/auth` — Autenticación
Registro, login y logout con **JWT** (jsonwebtoken) y contraseñas hasheadas con **bcrypt**.

---

## Sistema de Actualización de Datos

```
┌─────────────────────────────────────────────────────┐
│                  CADA 10 MINUTOS                    │
│                                                     │
│  Vercel Cron ──► /api/dolar/cron                    │
│  (prod)               │                             │
│                        ▼                            │
│  node-cron ──► runCronCycle()                       │
│  (dev)                │                             │
│                        ▼                            │
│          fetch dolarapi.com/v1/dolares              │
│                        │                            │
│                        ▼                            │
│          prisma.dolarRate.createMany()              │
│          (guarda snapshot en SQLite/PostgreSQL)     │
│                        │                            │
│                        ▼                            │
│          checkAndTriggerAlerts()                    │
│          (envía emails si hay alertas activas)      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  EN EL FRONTEND                     │
│                                                     │
│  EventSource('/api/dolar/live')                     │
│       │                                             │
│       └──► polling BD cada 5s                       │
│              │                                      │
│              └──► si hay nuevos registros           │
│                      │                              │
│                      ▼                              │
│              event: rates_update ──► React state    │
│                                       actualiza UI  │
└─────────────────────────────────────────────────────┘
```


---


## PWA — Progressive Web App

El sitio es instalable como app en Android e iOS sin necesidad de tiendas.

### Cómo instalar (usuario final)

**Android (Chrome):**
1. Entrar al sitio desde Chrome
2. Tocar el banner "Agregar a pantalla de inicio" o ir al menú ⋮ → Instalar app
3. El ícono aparece en el escritorio y la app se abre sin barra del navegador

**iPhone (Safari):**
1. Entrar al sitio desde Safari
2. Tocar el botón compartir → "Añadir a pantalla de inicio"

### Descarga APK (Android)

También disponible como APK firmado para instalación directa en Android:

1. Click en **"Descargar App"** en el navbar (desktop) o menú hamburguesa (mobile)
2. Descargar `DolarARG-signed.apk` desde GitHub Releases
3. Permitir instalación de fuentes desconocidas en Android
4. Instalar y abrir — funciona como app nativa sin barra del navegador

### Archivos clave

| Archivo | Función |
|---|---|
| `public/manifest.json` | Nombre, ícono, colores, modo standalone |
| `public/sw.js` | Service Worker: caché de assets y APIs para modo offline |
| `public/icons/` | Íconos en SVG, 192px y 512px |
| `public/screenshots/` | Capturas para PWA (mobile/desktop) |
| `public/sitemap.xml` | Sitemap SEO dinámico |
| `public/robots.txt` | Directivas robots SEO |

---

## SEO y Metadatos

SEO completo implementado con Next.js Metadata API:

- **OpenGraph** y **Twitter Cards** para compartir en redes sociales
- **Canonical URLs** para evitar contenido duplicado
- **Sitemap.xml** generado automáticamente con todas las rutas
- **Robots.txt** con directivas de rastreo
- **Metadatos estructurados** (título, descripción, keywords) por página
- **Favicon** optimizado para navegadores (separado de íconos PWA)
- **Manifest.json** con `id`, `start_url`, `scope` para PWA


---

## Variables de Entorno

```env
DATABASE_URL="file:./dev.db"         # SQLite en desarrollo
JWT_SECRET="tu_secreto_jwt"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu@email.com"
EMAIL_PASS="tu_contraseña_app"
```

---

## Fuentes de Datos

| Fuente | Datos |
|---|---|
| [dolarapi.com](https://dolarapi.com) | Dólar oficial, blue, MEP, CCL, tarjeta, cripto |
| [Bluelytics](https://bluelytics.com.ar) | Dólar blue / paralelo |
| [BCRA](https://www.bcra.gob.ar) | Tipo de cambio oficial y bandas cambiarias |
| [ExchangeRate-API](https://www.exchangerate-api.com) | EUR, BRL, CLP, UYU |
| [CoinGecko](https://www.coingecko.com) | Top 50 criptomonedas por market cap |
| [INDEC](https://www.indec.gob.ar) | Indicadores macroeconómicos |
| [ArgentinaDatos](https://argentinadatos.com) | Datos económicos abiertos |
| Web scraping (Cheerio) | Cotizaciones de bancos y casas de cambio |

---

# DólarARG (EN)

Fullstack platform for monitoring real-time exchange rates for US Dollar, Euro, Brazilian Real, Chilean Peso, Uruguayan Peso, and cryptocurrencies in Argentina, featuring historical data, charts, calculator, price alerts, BCRA exchange rate bands, and PWA support (installable as an app).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 |
| Styling | SASS (SCSS) |
| ORM | Prisma 5 |
| Database | SQLite (development) / PostgreSQL compatible (production) |
| Charts | Recharts |
| Icons | Lucide React |
| Email | Nodemailer |
| Web Scraping | Cheerio + Axios |
| Cron (dev) | node-cron |
| Cron (prod) | Vercel Cron Jobs |
| Deploy | Vercel |
| PWA | Web App Manifest + Service Worker |
| SEO | OpenGraph, Twitter Cards, Sitemap, Robots.txt |
| APK | Signed with Android Studio (apksigner) |

---

## Database

**SQLite** is used in development (file `prisma/dev.db`) and can be configured with **PostgreSQL** or any Prisma-compatible database in production by simply changing the `provider` in `schema.prisma` and the `DATABASE_URL` environment variable.

### Models (schema.prisma)

#### `DolarRate`
Stores each dollar exchange rate snapshot saved by the cron job.

```prisma
model DolarRate {
  id        Int      @id @default(autoincrement())
  casa      String   // "oficial", "blue", "bolsa", "tarjeta", etc.
  nombre    String
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([casa, fecha])
}
```

#### `ExchangeRateHistory`
Historical data for Euro (EUR) and Real (BRL) by exchange type.

```prisma
model ExchangeRateHistory {
  id        Int      @id @default(autoincrement())
  codigo    String   // "EUR" or "BRL"
  tipo      String   // "oficial", "blue", "tarjeta"
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([codigo, tipo, fecha])
}
```

#### `User` and `Alert`
User authentication system with JWT and personalized price alerts.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcrypt hash
  createdAt DateTime @default(now())
  alerts    Alert[]
}

model Alert {
  id          Int     @id @default(autoincrement())
  userId      Int
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  casa        String   // dollar type to monitor
  condition   String   // "ABOVE" or "BELOW"
  value       Float    // price threshold
  isTriggered Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## Backend — API Routes

All routes live in `src/app/api/` and run as serverless functions on Vercel.

### `/api/dolar` — Current Exchange Rates
Queries the public API [dolarapi.com](https://dolarapi.com) and returns dollar exchange rates (official, blue, MEP, CCL, credit card, crypto, wholesale). Also persists data to the database.

### `/api/dolar/live` — Real-time (SSE)
Implements **Server-Sent Events** (SSE) with **automatic reconnection**. Maintains a persistent HTTP connection with the client and polls the database every 5 seconds. If new records are detected in `DolarRate`, they are sent to the frontend. Includes reconnection logic with exponential backoff (2s, 4s, 8s... up to 30s) to automatically recover from disconnections.

```
GET /api/dolar/live
Content-Type: text/event-stream

event: connected
event: rates_update  ← triggered when cron saves new exchange rates
```

### `/api/dolar/history` — Historical Data for Charts
Returns `DolarRate` records for a specific dollar type and date range. Groups by day (last record of each day) to avoid duplicates in the chart.

```
GET /api/dolar/history?type=blue&days=30
```

### `/api/dolar/cron` — Cron Endpoint (Production)
HTTP endpoint invoked by Vercel Cron every 5 minutes. Calls dolarapi.com, saves exchange rates to the database, and checks active user alerts.

### `/api/exchange-rates` — Euro and Real
Gets EUR and BRL exchange rates by crossing dollar types (official, blue, credit card) with the USD→EUR/BRL exchange rate from [exchangerate-api.com](https://exchangerate-api.com).

### `/api/bandas` — BCRA Exchange Rate Bands
Mathematically calculates BCRA bands from their start date (April 11, 2025), applying monthly crawling peg: 1% fixed until December 2025 and ~2.8% from January 2026 (estimated using CPI with T-2 lag). No database required, calculation is purely arithmetic.

### `/api/bank-rates` — Bank Exchange Rates
Performs **web scraping** with Cheerio on public sources to get buy/sell prices from major Argentine banks and exchange houses.

### `/api/alerts` — Alert System
CRUD for price alerts. When the cron detects that a dollar price crosses above or below the user's defined threshold, it marks the alert as triggered and sends an email via Nodemailer.

### `/api/auth` — Authentication
Registration, login, and logout with **JWT** (jsonwebtoken) and passwords hashed with **bcrypt**.

---

## Data Update System

```
┌─────────────────────────────────────────────────────┐
│                  EVERY 10 MINUTES                   │
│                                                     │
│  Vercel Cron ──► /api/dolar/cron                    │
│  (prod)               │                             │
│                        ▼                            │
│  node-cron ──► runCronCycle()                       │
│  (dev)                │                             │
│                        ▼                            │
│          fetch dolarapi.com/v1/dolares              │
│                        │                            │
│                        ▼                            │
│          prisma.dolarRate.createMany()              │
│          (saves snapshot to SQLite/PostgreSQL)      │
│                        │                            │
│                        ▼                            │
│          checkAndTriggerAlerts()                    │
│          (sends emails if active alerts)            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  IN THE FRONTEND                    │
│                                                     │
│  EventSource('/api/dolar/live')                     │
│       │                                             │
│       └──► polls DB every 5s                        │
│              │                                      │
│              └──► if new records found              │
│                      │                              │
│                      ▼                              │
│              event: rates_update ──► React state    │
│                                       updates UI    │
└─────────────────────────────────────────────────────┘
```

---

## PWA — Progressive Web App

The site is installable as an app on Android and iOS without app stores.

### How to Install (End User)

**Android (Chrome):**
1. Visit the site from Chrome
2. Tap the "Add to Home Screen" banner or go to menu ⋮ → Install app
3. The icon appears on the home screen and the app opens without the browser toolbar

**iPhone (Safari):**
1. Visit the site from Safari
2. Tap the share button → "Add to Home Screen"

### APK Download (Android)

Also available as a signed APK for direct installation on Android:

1. Click **"Download App"** in the navbar (desktop) or hamburger menu (mobile)
2. Download `DolarARG-signed.apk` from GitHub Releases
3. Allow installation from unknown sources on Android
4. Install and open — works as a native app without browser toolbar

### Key Files

| File | Function |
|---|---|
| `public/manifest.json` | Name, icon, colors, standalone mode |
| `public/sw.js` | Service Worker: asset and API caching for offline mode |
| `public/icons/` | Icons in SVG, 192px and 512px |
| `public/screenshots/` | PWA screenshots (mobile/desktop) |
| `public/sitemap.xml` | Dynamic SEO sitemap |
| `public/robots.txt` | SEO robots directives |

---

## SEO and Metadata

Complete SEO implemented with Next.js Metadata API:

- **OpenGraph** and **Twitter Cards** for social sharing
- **Canonical URLs** to avoid duplicate content
- **Sitemap.xml** automatically generated with all routes
- **Robots.txt** with crawling directives
- **Structured metadata** (title, description, keywords) per page
- **Favicon** optimized for browsers (separate from PWA icons)
- **Manifest.json** with `id`, `start_url`, `scope` for PWA

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"         # SQLite in development
JWT_SECRET="your_jwt_secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your@email.com"
EMAIL_PASS="your_app_password"
```

---

## Data Sources

| Source | Data |
|---|---|
| [dolarapi.com](https://dolarapi.com) | Official, blue, MEP, CCL, credit card, crypto |
| [Bluelytics](https://bluelytics.com.ar) | Blue/parallel dollar |
| [BCRA](https://www.bcra.gob.ar) | Official exchange rate and exchange rate bands |
| [ExchangeRate-API](https://www.exchangerate-api.com) | EUR, BRL, CLP, UYU |
| [CoinGecko](https://www.coingecko.com) | Top 50 cryptocurrencies by market cap |
| [INDEC](https://www.indec.gob.ar) | Macroeconomic indicators |
| [ArgentinaDatos](https://argentinadatos.com) | Open economic data |
| Web scraping (Cheerio) | Bank and exchange house rates |

---
