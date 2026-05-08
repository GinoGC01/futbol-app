# ⚽ Cancha Libre - Landing Page

Esta es la landing page oficial de **Cancha Libre**, la plataforma líder en gestión de torneos de fútbol amateur en Argentina. Diseñada bajo el concepto **"Sports-Tech Luxury"**, esta página está optimizada para la conversión y la captación de usuarios para la fase de Beta Cerrada.

## 🎨 Sistema de Diseño: Sports-Tech Luxury

La landing page hereda y potencia la identidad visual de la aplicación principal (`/client`):

- **Paleta de Colores**:
  - Primario: `#CEDE0B` (Lima Eléctrico)
  - Fondo: `#0D0D0D` (Deep Dark)
  - Superficies: `#1A1A1A` (Elevated Surface)
- **Tipografía**:
  - **Bebas Neue**: Para encabezados masivos y agresivos.
  - **Space Grotesk**: Para sub-encabezados y acentos tecnológicos.
  - **Inter**: Para cuerpo de texto y legibilidad.
- **Aesthetic**:
  - **Glassmorphism**: Componentes con desenfoque de fondo y bordes de cristal.
  - **Skewed Elements**: Formas inclinadas y cortes diagonales para transmitir dinamismo.
  - **Neon Glow**: Efectos de resplandor en elementos de acción clave.

## 🛠️ Tecnologías

- **Framework**: [Astro](https://astro.build/) (v5.x)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animaciones**: Vanilla JS con `IntersectionObserver` para efectos de revelado (reveal) y CSS `@keyframes` para marquesinas dinámicas.

## 🚀 Estructura del Proyecto

```text
/
├── public/
│   └── images/          # Isotipo, logotipo y marca Marios Web
├── src/
│   ├── components/      # Header, Footer y componentes UI
│   ├── layouts/         # Layout principal con configuración SEO
│   ├── pages/           # Estructura principal de la landing (index.astro)
│   └── styles/          # global.css con tokens del sistema de diseño
└── package.json
```

## Genie Commands

| Comando           | Acción                                                |
| :---------------- | :---------------------------------------------------- |
| `npm install`     | Instala las dependencias del proyecto.                |
| `npm run dev`     | Inicia el servidor de desarrollo en `localhost:4321`. |
| `npm run build`   | Genera el sitio estático optimizado en `./dist/`.     |
| `npm run preview` | Previsualiza la build de producción localmente.       |

## 🔗 Enlaces Relacionados

- **Aplicación Principal**: [app.canchalibre.pro](https://app.canchalibre.pro)
- **Producido por**: [Marios Web](https://www.mariosweb.site/)

---
