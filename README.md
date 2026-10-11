# DólarARG

Plataforma fullstack para monitorear cotizaciones del dólar, euro, real, peso chileno, peso uruguayo y criptomonedas en Argentina en tiempo real, con historial, gráficos, calculadora, alertas, bandas cambiarias del BCRA y soporte PWA (instalable como app). Incluye una interfaz responsive para mobile, selector de monedas deslizable y tarjetas optimizadas para interacción táctil.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | SASS (SCSS) |
| ORM | Prisma 5 |
| Base de datos | SQLite local / PostgreSQL en AWS RDS |
| Gráficos | Recharts |
| Íconos | Lucide React |
| Email | Nodemailer |
| Web Scraping | Cheerio + Axios |
| Cron (dev) | node-cron |
| Cron (prod) | cron-job.org (cada 30 minutos) |
| Deploy | AWS EC2 (GitHub Actions + SSH + PM2) |
| PWA | Web App Manifest + Service Worker |
| SEO | OpenGraph, Twitter Cards, Sitemap, Robots.txt |
| APK | Firma con Android Studio (apksigner) |

---

## Infraestructura en AWS

La aplicación de producción utiliza estos servicios en **US East (Ohio), `us-east-2`**:

| Servicio | Uso |
|---|---|
| Amazon EC2 | Ejecuta Next.js en Linux. PM2 mantiene el proceso `dolar-app`. |
| Amazon RDS for PostgreSQL | Guarda cotizaciones, historial, usuarios y alertas en la instancia `dolar-db`. |
| Amazon VPC y grupos de seguridad | Aíslan los recursos y permiten la conexión de la aplicación a PostgreSQL por el puerto 5432. La base no necesita exposición pública. |
| GitHub Actions | Al hacer push a `main`, se conecta por SSH a EC2, actualiza el código, compila con Prisma para PostgreSQL y reinicia PM2. |
| DuckDNS | `dolar-arg.duckdns.org` es el dominio usado para acceder al sitio y al endpoint del cron. |

El actualizador externo de **cron-job.org** llama `https://dolar-arg.duckdns.org/api/dolar/cron` cada 30 minutos. Las credenciales de AWS para el despliegue se configuran como secretos de GitHub (`AWS_HOST` y `AWS_SSH_KEY`); no deben guardarse en el repositorio. La URL de conexión a RDS y las demás variables de ejecución se configuran en el servidor.

---

## Base de Datos

Se usa **SQLite** localmente (`prisma/dev.db`) y **PostgreSQL en Amazon RDS** en producción. `prisma/dev.db` está excluido de Git. El script `scripts/prepare-schema.js` prepara el esquema adecuado: localmente genera el cliente SQLite; el workflow de despliegue define `PRISMA_SCHEMA_TARGET=postgresql` para generar el cliente de producción antes de compilar la aplicación.

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

Todas las rutas viven en `src/app/api/` y se ejecutan en la aplicación Next.js alojada en AWS EC2.

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
Endpoint HTTP llamado por cron-job.org cada 30 minutos: `https://dolar-arg.duckdns.org/api/dolar/cron`. Consulta dolarapi.com, guarda únicamente las cotizaciones cuyo precio de compra o venta cambió, limpia registros de más de 45 días y verifica las alertas activas. El workflow `Update exchange rates` de GitHub Actions queda disponible para ejecución manual.

### `/api/exchange-rates` — Euro y Real
Obtiene cotizaciones de EUR y BRL cruzando los tipos de dólar (oficial, blue, tarjeta) con la tasa de cambio USD→EUR/BRL desde [exchangerate-api.com](https://exchangerate-api.com). El historial persiste solo cuando cambia el precio de compra o venta.

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
Producción (cada 30 minutos): cron-job.org → /api/dolar/cron → dolarapi.com
                                              │
                                              ├─ guarda solo precios que cambiaron
                                              ├─ elimina historial de más de 45 días
                                              └─ revisa alertas y envía emails

Desarrollo: node-cron ejecuta el ciclo local cada 10 minutos y usa SQLite.

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
# En producción: URL de conexión PostgreSQL de Amazon RDS (secrets de EC2)
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

Fullstack platform for monitoring real-time exchange rates for US Dollar, Euro, Brazilian Real, Chilean Peso, Uruguayan Peso, and cryptocurrencies in Argentina, featuring historical data, charts, calculator, price alerts, BCRA exchange rate bands, and PWA support (installable as an app). It includes a mobile-responsive interface, swipeable currency selector, and cards optimized for touch interaction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 |
| Styling | SASS (SCSS) |
| ORM | Prisma 5 |
| Database | Local SQLite / PostgreSQL on Amazon RDS |
| Charts | Recharts |
| Icons | Lucide React |
| Email | Nodemailer |
| Web Scraping | Cheerio + Axios |
| Cron (dev) | node-cron |
| Cron (prod) | cron-job.org (every 30 minutes) |
| Deploy | AWS EC2 (GitHub Actions + SSH + PM2) |
| PWA | Web App Manifest + Service Worker |
| SEO | OpenGraph, Twitter Cards, Sitemap, Robots.txt |
| APK | Signed with Android Studio (apksigner) |

---

## AWS Infrastructure

The production application uses these services in **US East (Ohio), `us-east-2`**:

| Service | Usage |
|---|---|
| Amazon EC2 | Runs Next.js on Linux. PM2 keeps the `dolar-app` process running. |
| Amazon RDS for PostgreSQL | Stores rates, history, users, and alerts in the `dolar-db` instance. |
| Amazon VPC and security groups | Isolate resources and allow the application to connect to PostgreSQL on port 5432. The database does not need public exposure. |
| GitHub Actions | On pushes to `main`, connects to EC2 over SSH, updates the code, builds Prisma for PostgreSQL, and restarts PM2. |
| DuckDNS | `dolar-arg.duckdns.org` is the domain used to reach the site and cron endpoint. |

The external **cron-job.org** scheduler calls `https://dolar-arg.duckdns.org/api/dolar/cron` every 30 minutes. AWS deployment credentials are configured as GitHub secrets (`AWS_HOST` and `AWS_SSH_KEY`) and must not be committed to the repository. The RDS connection URL and other runtime variables are configured on the server.

---

## Database

**SQLite** is used locally (`prisma/dev.db`) and **PostgreSQL on Amazon RDS** is used in production. `prisma/dev.db` is excluded from Git. `scripts/prepare-schema.js` prepares the appropriate schema: local builds generate the SQLite client, while the deployment workflow sets `PRISMA_SCHEMA_TARGET=postgresql` to generate the production client before building.

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

All routes live in `src/app/api/` and run in the Next.js app hosted on AWS EC2.

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
HTTP endpoint called by cron-job.org every 30 minutes: `https://dolar-arg.duckdns.org/api/dolar/cron`. It queries dolarapi.com, stores only rates whose buy or sell price changed, removes records older than 45 days, and checks active alerts. The GitHub Actions `Update exchange rates` workflow remains available for manual runs.

### `/api/exchange-rates` — Euro and Real
Gets EUR and BRL exchange rates by crossing dollar types (official, blue, credit card) with the USD→EUR/BRL exchange rate from [exchangerate-api.com](https://exchangerate-api.com). History is stored only when the buy or sell price changes.

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
Production (every 30 minutes): cron-job.org → /api/dolar/cron → dolarapi.com
                                                  │
                                                  ├─ stores only changed prices
                                                  ├─ deletes history older than 45 days
                                                  └─ checks alerts and sends emails

Development: node-cron runs the local cycle every 10 minutes and uses SQLite.

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
# In production: Amazon RDS PostgreSQL connection URL (configured on EC2)
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
