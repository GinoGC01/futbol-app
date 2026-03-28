# 🏆 Liga Amateur SaaS • Luxury Sports-Tech Platform

**Ecosistema de Gestión de Fútbol de Élite** diseñado para la administración profesional de ligas de fútbol amateur. Construido con una estética "Luxury Sports-Tech", con una arquitectura de 3 capas de alto rendimiento y sincronización de datos en tiempo real.

---

## ✨ Características

### 💎 UI/UX de Élite
- **Layouts de Bento Grid Modernos:** Visualización de datos de alta densidad para perfiles de Equipos y Jugadores.
- **Sistema de Diseño Glassmorphism:** Bordes ultra-finos y desenfoques de fondo para una sensación premium al estilo "Apple".
- **Omnisearch (CMD+K):** Una paleta de comandos global para una navegación ultrarrápida por ligas, equipos y acciones administrativas.
- **Vault Mode:** Estilo visual distintivo para temporadas archivadas o finalizadas para mantener la integridad histórica.

### ⚡ Rendimiento y Tiempo Real
- **Smart Refresh de 30s:** Polling continuo de datos en vivo usando TanStack Query para puntuaciones y clasificaciones al segundo.
- **Capa de Datos Optimizada:** Integración directa con una API de backend de 3 capas (/identity, /competition, /roster, /match, /stats).

### 🛠️ Administración Profesional
- **Tournament Architect:** Herramientas visuales para crear estructuras y fases de torneos complejos.
- **Award Scrutiny Tool:** Lógica avanzada para calcular los ganadores del "Hall of Fame" con detalles precisos de desempate.
- **Match Edge:** Seguimiento de eventos de partidos en tiempo real (goles, tarjetas, sustituciones) con verificación de elegibilidad.

---

## 🛠 Stack Tecnológico

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) (utilizando el nuevo motor JIT `@theme`)
- **Gestión de Estado:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
- **Iconos:** [Lucide React](https://lucide.dev/)

### Backend e Infraestructura
- **Runtime:** Node.js + Express
- **Base de Datos:** [PostgreSQL (Supabase)](https://supabase.com/)
- **Auth/Storage:** Supabase Identity y almacenamiento compatible con S3
- **Migraciones:** Versionado nativo basado en SQL

---

## 📂 Estructura del Proyecto

```bash
├── client/          # Frontend Luxury Sports-Tech (React + Tailwind v4)
├── server/          # Capa de API Profesional de 3 capas (Node.js)
├── supabase/        # Esquema de Base de Datos y Migraciones
└── .vscode/         # Configuración de espacio de trabajo optimizada para Tailwind v4
```

---

## 🚀 Empezando

1. **Clonar e Instalar Dependencias:**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. **Configuración del Entorno:**
   Crea archivos `.env` tanto en `/client` como en `/server` basados en las plantillas proporcionadas.

3. **Ejecutar para Desarrollo:**
   ```bash
   # Desde el directorio raíz
   npm run dev
   ```

---

## 🛡️ Estabilidad y Calidad
La plataforma consume estrictamente la **arquitectura de backend de 3 capas**, lo que garantiza una separación limpia de responsabilidades y una estabilidad lista para producción. Todas las rutas heredadas han sido purgadas para cumplir con el **Estándar de Élite**.

---
*Desarrollado con ❤️ para el deporte más hermoso del mundo.*
