# 💵 Dólar Hoy Argentina

Plataforma fullstack para monitorear cotizaciones del dólar, euro y real en Argentina en tiempo real, con historial, gráficos, calculadora, alertas y bandas cambiarias del BCRA.

---

## 🛠️ Stack Tecnológico

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

---

## 🗄️ Base de Datos

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

## ⚙️ Backend — API Routes

Todas las rutas viven en `src/app/api/` y corren como funciones serverless en Vercel.

### `/api/dolar` — Cotizaciones actuales
Consulta la API pública [dolarapi.com](https://dolarapi.com) y devuelve las cotizaciones del dólar (oficial, blue, MEP, CCL, tarjeta, cripto, mayorista). También persiste los datos en la base de datos.

### `/api/dolar/live` — Tiempo real (SSE)
Implementa **Server-Sent Events** (SSE). Mantiene una conexión HTTP persistente con el cliente y hace polling a la base de datos cada 5 segundos. Si detecta nuevos registros en `DolarRate` (insertados por el cron), los envía al frontend sin necesidad de que el usuario recargue la página.

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
Endpoint HTTP que invoca Vercel Cron cada 10 minutos. Llama a dolarapi.com, guarda las cotizaciones en la base de datos y verifica las alertas activas de los usuarios.

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

## 🔄 Sistema de Actualización de Datos

```
┌─────────────────────────────────────────────────────┐
│                  CADA 10 MINUTOS                    │
│                                                     │
│  Vercel Cron ──► /api/dolar/cron                   │
│  (prod)               │                            │
│                        ▼                            │
│  node-cron ──► runCronCycle()                      │
│  (dev)                │                            │
│                        ▼                            │
│          fetch dolarapi.com/v1/dolares             │
│                        │                            │
│                        ▼                            │
│          prisma.dolarRate.createMany()             │
│          (guarda snapshot en SQLite/PostgreSQL)    │
│                        │                            │
│                        ▼                            │
│          checkAndTriggerAlerts()                   │
│          (envía emails si hay alertas activas)     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  EN EL FRONTEND                     │
│                                                     │
│  EventSource('/api/dolar/live')                    │
│       │                                             │
│       └──► polling BD cada 5s                      │
│              │                                      │
│              └──► si hay nuevos registros           │
│                      │                              │
│                      ▼                              │
│              event: rates_update ──► React state   │
│                                       actualiza UI │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── alerts/          # CRUD alertas de precio
│   │   ├── auth/            # login, registro, logout, perfil
│   │   ├── bandas/          # cálculo bandas BCRA
│   │   ├── bank-rates/      # scraping cotizaciones bancarias
│   │   ├── dolar/
│   │   │   ├── route.ts     # cotizaciones actuales
│   │   │   ├── live/        # SSE tiempo real
│   │   │   ├── history/     # historial para gráficos
│   │   │   ├── cron/        # endpoint Vercel Cron
│   │   │   └── ranking/     # variación % por tipo
│   │   ├── exchange-rates/  # EUR y BRL con variantes
│   │   └── news/            # feed RSS de noticias
│   └── page.tsx             # página principal
├── components/
│   ├── Navbar.tsx           # navbar + SSE + búsqueda + hamburguesa
│   ├── DolarCard.tsx        # tarjeta por tipo de dólar
│   ├── DolarChart.tsx       # gráfico histórico (Recharts)
│   ├── ExchangeBands.tsx    # gauge banda cambiaria BCRA
│   ├── BankRates.tsx        # cotizaciones + comparador de bancos
│   ├── Calculator.tsx       # calculadora ARS ↔ USD
│   ├── AlertSettings.tsx    # configurar alertas de precio
│   ├── UniversalConverter.tsx # conversor de monedas
│   ├── ExchangeRateSection.tsx # sección EUR / BRL
│   └── NewsFeed.tsx         # noticias del mercado
├── lib/
│   ├── db.ts                # instancia Prisma (singleton)
│   ├── cron-local.ts        # cron para desarrollo
│   ├── exchange-rates.ts    # helpers para EUR/BRL
│   └── mail.ts              # envío de emails (Nodemailer)
├── styles/
│   └── main.scss            # estilos globales
└── types/
    └── dolar.ts             # tipos TypeScript compartidos

prisma/
├── schema.prisma            # modelos de la base de datos
├── seed.js                  # datos iniciales
└── dev.db                   # base de datos SQLite (desarrollo)
```

---

## 🚀 Instalación y Uso

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd dolar

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con DATABASE_URL y credenciales de email

# 4. Crear y migrar la base de datos
npx prisma db push
npx prisma generate

# 5. (Opcional) Sembrar datos históricos
node prisma/seed.js

# 6. Iniciar en desarrollo
npm run dev
```

## 🌐 Deploy en Vercel

El `vercel.json` configura el build y el cron automáticamente:

```json
{
  "buildCommand": "prisma db push && prisma generate && next build",
  "crons": [{ "path": "/api/dolar/cron", "schedule": "*/10 * * * *" }]
}
```

En producción se requiere una base de datos compatible con Prisma accesible desde Vercel (ej. Turso, PlanetScale, Supabase, Neon).

---

## 🔑 Variables de Entorno

```env
DATABASE_URL="file:./dev.db"         # SQLite en desarrollo
JWT_SECRET="tu_secreto_jwt"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu@email.com"
EMAIL_PASS="tu_contraseña_app"
```
