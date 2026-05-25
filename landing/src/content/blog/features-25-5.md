---
title: "Features y novedades — Lo que se viene en Cancha Libre"
description: "Un repaso de todas las herramientas y funcionalidades que desarrollamos y que estarán disponibles en producción muy pronto."
pubDate: 2026-05-25
author: "Equipo Cancha Libre"
image: "../images/blog/features-25-5.webp"
tags: ["novedades", "features", "actualizacion", "lanzamiento"]
---

# Llega la actualización más grande hasta ahora

Trabajamos en una cantidad importante de mejoras para que Cancha Libre sea aún más potente, rápida y sencilla. Estas son todas las novedades que vas a encontrar cuando volvamos.

---

## Nueva arquitectura del panel de administración

Reorganizamos por completo la sección de administración para que sea más intuitiva y cada cosa esté en su lugar. Antes todo estaba mezclado en pantallas enormes que costaba seguir. Ahora separamos cada módulo con su propio espacio, sus propios hooks y sus propios servicios, lo que se traduce en menos tiempos de carga y una navegación mucho más clara.

Estos son los módulos que encontrás apenas entrás al panel:

- **Panel principal:** Te recibe con un resumen de todas tus ligas, métricas importantes de la temporada activa y acceso directo a las acciones que más usás. Todo lo que necesitas saber de un solo vistazo.
- **Módulo de competencia:** El cerebro del torneo. Desde acá manejás la creación de torneos, las fases, las jornadas, los grupos y la generación del fixture. Si sos organizador, este va a ser tu lugar favorito.
- **Módulo de roster:** La base de datos de tu liga. Gestionás equipos, jugadores, fichajes y plantillas completas. Olvidate de las planillas sueltas, todo está centralizado y sincronizado.
- **Módulo de partidos:** El corazón en vivo de la plataforma. Controlás cada encuentro, cargás resultados, gestionás eventos en tiempo real y ves cómo se mueven las tablas al instante.
- **Módulo de premios:** Estadísticas detalladas, tabla de goleadores, asistencias, tarjetas y todo lo que hace que una liga se sienta profesional.

Adentro de cada módulo vas a encontrar todo lo necesario para operar sin tener que saltar de una pantalla a otra. Y como cada uno funciona con su propia lógica, las actualizaciones y los movimientos se reflejan al toque.

---

## Gestión de torneos profesional

Este es uno de los saltos más grandes que dimos. Ahora Cancha Libre entiende de torneos de verdad, con toda la complejidad que eso implica. No importa si tu liga es simple de todos contra todos, o si armaste un mundialito con fases de grupos y eliminatorias, la plataforma se adapta a tu formato.

### Creador de torneos

El proceso de crear un torneo es guiado y rápido. Elegís el nombre, la temporada, el formato, la cantidad de equipos, los puntos por partido (ganado, empatado, perdido) y las reglas básicas. Todo se configura desde un solo lugar, sin tener que tocar código ni opciones ocultas. Una vez que está todo listo, el sistema arma la estructura base del torneo.

### Fases y grupos

Este era uno de los features más pedidos. Ahora podés organizar tu torneo en múltiples fases. Por ejemplo, una fase regular con dos grupos de 8 equipos cada uno, donde los primeros 4 de cada grupo avanzan a una fase eliminatoria. Cada grupo tiene su propia tabla de posiciones, sus propios puntos y sus propias reglas. Y cuando una fase termina, podés configurar cómo se pasa a la siguiente.

### Asignación de equipos

Diseñamos un panel visual donde asignás equipos a grupos de forma intuitiva. Ves todos los equipos disponibles en un panel y los grupos en otro. Seleccionás, asignás, y el sistema valida que las cantidades sean correctas antes de dejar seguir. Si te equivocaste, reasignás en dos clics. Queríamos que armar los grupos fuera tan fácil como acomodar los equipos en una mesa de café.

### Múltiples temporadas

No queríamos que una liga tuviera que empezar de cero cada vez que arranca una nueva temporada. Ahora podés tener varias temporadas dentro de una misma liga, cada una con su propia configuración, sus equipos y su historial. Los datos de temporadas anteriores no se pierden, quedan guardados para consulta histórica. Ideal para ligas que se juegan por año o por semestre.

### Historial de temporadas

Hablando de histórico, ahora cada temporada queda registrada. Podés volver atrás y ver quién ganó en 2025, cómo quedaron las tablas, quién fue el goleador. Todo ese historial se va acumulando y le da a tu liga una identidad, una historia que contar.

---

## Fixture automático e inteligente

Armar un fixture de 10 equipos no parece difícil hasta que te pones a cuadrar fechas, horarios y canchas. Ahora imaginate con 20 equipos divididos en grupos. El nuevo generador de fixture viene a sacarte ese peso de encima.

### Cómo funciona

El sistema toma los equipos de cada grupo y los cruza automáticamente siguiendo el formato que elegiste. Si es todos contra todos, arma las ruedas completas. Si es por grupos, cruza solo a los equipos del mismo grupo. Si es eliminatorio, genera los cruces directos. Todo respetando la cantidad de fechas que definiste.

### Personalización

Pero ojo, no es un fixture rígido. Sabemos que en el fútbol amateur las cosas cambian. La cancha se llueve, un equipo no llega, el finde largo. Por eso permitimos ajustes manuales: podés mover un partido de fecha, cambiar el horario, intercambiar localías, y el sistema reacomoda todo sin romper la estructura general.

### Fixture para torneos grupales

Esta es una novedad importante. Si tu torneo tiene fase de grupos, el generador arma los fixtures de cada grupo por separado. Cada grupo vive su propia competencia con sus fechas y sus cruces. Y cuando termina la fase de grupos, el sistema está listo para la siguiente fase.

### Visualización clara

Una vez generado, el fixture se muestra en una vista de jornadas con todos los partidos, fechas, horarios y estados. Los equipos pueden ver el calendario completo desde su perfil, sin tener que preguntar ni pedir que se lo manden.

---

## Partidos en vivo y gestión de eventos en tiempo real

Esta es la novedad que más nos entusiasma compartir. Cancha Libre ahora tiene un módulo de partidos en vivo donde todo pasa al instante.

### Carga de eventos desde la cancha

Imaginate que termina el partido y mientras los jugadores se dan la mano, el veedor ya cargó el resultado desde el celular. Goles, tarjetas amarillas, rojas, cambios, incidencias y tiempo adicional. Cada evento se registra con el minuto exacto y el jugador involucrado. Nada se pierde.

### Visualización en vivo para los equipos

Mientras el partido se juega, cualquier persona con acceso al torneo puede seguir la transmisión en vivo desde la vista del partido. Ves el marcador actualizado, los eventos en orden cronológico, las tarjetas, los cambios. Los jugadores pueden seguir a su equipo desde sus casas, los familiares pueden ver cómo va el partido, y nadie tiene que estar spameando el WhatsApp preguntando "¿cómo vamos?".

### Control de tiempo real

Incorporamos un cronómetro de partido con control de tiempo adicional. El veedor puede pausar el partido, agregar tiempo de descuento, y llevar el control exacto de los minutos. Todo sincronizado para que cuando termina el partido, el resultado ya esté cargado y las tablas actualizadas.

### Actualización automática de tablas

Este es el feature que vuela la cabeza. Apenas se guarda el resultado de un partido, el sistema recalcula todo al instante:
- La tabla de posiciones se actualiza con los puntos nuevos.
- La tabla de goleadores suma los goles a los jugadores correspondientes.
- Las tarjetas se acumulan y el sistema sabe quién está suspendido para la próxima fecha.
- Las estadísticas de equipo y jugador se refrescan.

Todo eso que antes implicaba sentarse una hora a actualizar planillas, ahora pasa solo en segundos.

### Gestión de jornadas completas

Si tenés una fecha con 6 partidos, el sistema te permite manejar los partidos de forma independiente pero también ver el progreso general de la jornada. Sabés cuántos partidos están pendientes, cuántos se están jugando y cuántos están cerrados. Una vista de control total para el organizador.

---

## Gestión de jugadores y equipos mejorada

Los jugadores son el alma de cualquier torneo, y nos parecía que merecían un espacio a la altura.

### Fichaje por lote

Si estás armando un torneo de 10 equipos con 15 jugadores cada uno, tenés 150 jugadores que cargar. Hacerlo uno por uno es inviable. Por eso creamos el fichaje masivo. Subís los datos en lote, el sistema procesa los jugadores, valida que no haya duplicados y los asigna a los equipos correspondientes. En minutos tenés la plantilla completa de tu torneo lista y cargada.

### Perfiles públicos de jugador

Cada jugador tiene su propia página con su historial completo. No es solo un nombre en una lista. En su perfil se ven:
- Partidos jugados y su historial de resultados.
- Goles convertidos, con la fecha y el rival.
- Tarjetas amarillas y rojas recibidas.
- Asistencias (si aplica).
- Estadísticas acumuladas por temporada.

Es como tener la ficha de un jugador profesional, pero para tu torneo de los sábados. Y lo mejor: se puede compartir en redes.

### Perfiles de equipo

Cada equipo tiene su página con la plantilla completa, el fixture, los resultados y las estadísticas. El capitán puede ver quién está disponible, quién está suspendido, y cómo viene el equipo en la tabla. Los jugadores ven los datos de su equipo sin tener que pedirlos.

### Mejoras en los modales y la experiencia

Renovamos todos los modales de gestión de jugadores. Agregar un jugador, editarlo, ver sus datos, todo es más rápido y con menos clics. La información está organizada y es fácil de encontrar.

---

## ¿Cuándo estará disponible?

Todo esto ya está funcionando en nuestro entorno de staging y estamos haciendo los ajustes finales. En aproximadamente **6 días** estará disponible en producción para todas las ligas.

Sabemos que la espera es larga, pero preferimos tomarnos el tiempo necesario para que todo funcione bien desde el día uno. Cuando volvamos, Cancha Libre va a ser una plataforma mucho más completa, rápida y profesional.

Mientras tanto, si querés ir chusmeando, visitá la sección del blog, que vamos a ir subiendo al detalle las funcionalidades. Y si tenés dudas o sugerencias, ya sabés dónde encontrarnos.

**Cancha Libre — Hecho por futboleros, para futboleros.**
