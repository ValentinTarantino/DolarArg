# Dólar Hoy Argentina 

¡Bienvenido a "Dólar Hoy Argentina"! Esta es una plataforma Fullstack moderna de grado profesional para monitorear las cotizaciones del dólar en Argentina en tiempo real y con datos históricos. 

El proyecto ha sido rediseñado desde cero utilizando tecnologías de alta demanda laboral para destacar ante cualquier reclutador o equipo técnico.

---

##  Tecnologías Utilizadas

- **Frontend**: Next.js 16 (App Router) + TypeScript + SASS (CSS Modules y estilos personalizados).
- **Backend (API)**: Next.js API Routes (Serverless-ready).
- **Base de Datos**: PostgreSQL (Almacenamiento de cotizaciones históricas y usuarios).
- **ORM**: Prisma ORM.
- **Real-time**: Server-Sent Events (SSE) para actualizaciones instantáneas de precios empujadas por el servidor.
- **Gráficos**: Recharts (Gráficos interactivos de líneas).
- **Contenedores**: Docker & Docker Compose.

---

##  Funcionalidades Destacadas 

1. **Datos en Tiempo Real (SSE)**: La aplicación mantiene una conexión HTTP persistente mediante Server-Sent Events. Si el servidor detecta una actualización de precio, actualiza el frontend al instante sin que el usuario tenga que refrescar.
2. **Historial y Gráficos (30 días)**: Historial completo para cada tipo de dólar ("Blue", "Oficial", "MEP", "CCL", etc.) visualizado mediante gráficos de líneas interactivos.
3. **Calculadora Avanzada con Impuestos**: Permite calcular el valor de compra/venta y desglosa de manera transparente los impuestos correspondientes en Argentina (Impuesto PAIS, Percepción de Ganancias).
4. **Sistema de Alertas Personalizadas**: Los usuarios pueden registrarse e iniciar sesión de manera segura. Una vez dentro, pueden definir límites de precios (ej. *"Avisar si el Blue supera los $1200"*). El servidor verifica estas reglas y marca las alertas como disparadas.
5. **Base de Datos Autogestionada (Docker)**: La base de datos y la aplicación se levantan en segundos gracias a Docker Compose.

---

## 📁 Estructura del Código

- `/prisma/schema.prisma`: Definición del modelo relacional (Usuario, Alerta, Cotización).
- `/prisma/seed.js`: Script de sembrado de datos históricos realistas para pruebas.
- `/src/app/page.tsx`: Vista principal de la aplicación con la suscripción a SSE.
- `/src/app/api/dolar/`: API Routes para consultas del dólar, histórico y SSE.
- `/src/app/api/auth/`: Rutas de registro, login, logout y perfil.
- `/src/components/`: Componentes UI reutilizables y limpios (`DolarCard`, `DolarChart`, `Calculator`, `AlertSettings`).
- `/src/styles/`: Hojas de estilo SASS personalizadas.
