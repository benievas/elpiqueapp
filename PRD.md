# PRD — ElPiqueApp
> Plataforma de reservas de canchas deportivas — Argentina

**Última actualización:** 2026-04-18 (sesión activa)
**Estado del proyecto:** Alpha funcional en producción  
**Deploy:** Vercel → [elpiqueapp.com](https://elpiqueapp.com)  
**Repo:** privado — rama `main` → deploy automático  

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + RLS + Storage + Realtime) |
| Deploy | Vercel (desde GitHub, rama main) |
| PWA | manifest.json + service worker básico |

**Diseño:** Dark sports app — fondo `#040D07`, acento lima `#C8FF00`, glass morphism en cards (`backdrop-blur + border-white/10`). Componentes `liquid-panel` y `liquid-button` definidos en `globals.css`.

---

## Estructura de directorios clave

```
src/
  app/
    page.tsx                    — Home (slider inmersivo de complejos + promo slides)
    layout.tsx                  — Root layout: QueryProvider + CityProvider + BottomNav
    globals.css                 — Tailwind v4 + utilidades liquid-panel/button
    (auth)/                     — Login + Register (jugador y dueño)
    (owner)/owner/              — Panel owner (layout.tsx con sidebar)
      page.tsx                  — Dashboard con stats reales de DB
      complejo/                 — Editar info del complejo
      canchas/                  — CRUD de canchas
      reservas/                 — Lista reservas + Realtime + agregar manual
      caja/                     — Caja del día (estado local, no persiste en DB aún)
      stats/                    — Gráficos de ingresos/reservas
      mi-link/                  — Link público + QR generado
      settings/                 — Cambiar email y contraseña
      suscripcion/              — Estado del plan (trial/activo/vencido)
      activar-trial/            — Onboarding de trial para nuevos owners
    (admin)/                    — Panel superadmin
    complejo/[slug]/            — Detalle de complejo (galería, canchas, widget, reseñas)
    explorar/                   — Grid de complejos con filtros por deporte + búsqueda
    feed/                       — Feed de publicaciones de complejos
    mapa/                       — Mapa interactivo con Leaflet
    perfil/                     — Perfil del jugador (reservas + reseñas propias)
    torneos/                    — Lista de torneos con inscripción
    onboarding/                 — Bienvenida post-registro
  components/
    AvailabilityWidget.tsx      — Widget de reserva (cancha → fecha → hora → WhatsApp)
    BottomNav.tsx               — Nav móvil (5 items)
    TimelineAvailability.tsx    — Grilla de slots horarios
    DatePickerCustom.tsx        — Selector de fecha estilizado
    CityBanner.tsx              — Banner selector de ciudad
    MapaLeaflet.tsx             — Mapa (client-only)
    DeviceDetection.tsx         — Banner descarga iOS/Android
    ui/Skeleton.tsx             — Skeleton shimmer reutilizable
    providers/QueryProvider.tsx — React Query wrapper
  lib/
    supabase.ts                 — Cliente lazy (browser + admin server-side)
    hooks/useAuth.ts            — Auth hook (user, profile, role, signOut)
    context/CityContext.tsx     — Ciudad activa global
  types/
    database.ts                 — Tipos completos de todas las tablas DB
```

---

## Tablas en Supabase (DB)

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Usuarios: rol (jugador/propietario/admin/superadmin), nombre, teléfono, ciudad |
| `complexes` | Complejos: nombre, slug, deportes, horarios, ubicación, galería, whatsapp, owner_id |
| `courts` | Canchas: complex_id, deporte, precio_por_hora, superficie, estado, activa |
| `court_availability` | Slots de disponibilidad: court_id, fecha, hora_inicio, hora_fin, disponible, reservation_id |
| `reservations` | Reservas: court_id, complex_id, user_id, fecha, hora_inicio/fin, precio, estado, whatsapp_link |
| `reviews` | Reseñas: complex_id, user_id, estrellas (1-5), texto |
| `feed_posts` | Publicaciones: título, contenido, tipo, imagen, complex_id, visible |
| `tournaments` | Torneos: nombre, deporte, fechas, estado, complex_id |
| `tournament_teams` | Equipos inscritos |
| `tournament_matches` | Partidos del fixture |
| `subscriptions` | Plan del owner: estado (trial/active/expired), fechas |

---

## Estado actual — Qué funciona

### Jugador
- [x] Home con slider inmersivo de complejos + slides promocionales
- [x] Explorar — grid con filtros por deporte y búsqueda por nombre (datos reales de DB) + skeleton loading
- [x] Detalle de complejo — galería, info, canchas, servicios, horario, mapa inline + skeleton loading
- [x] Widget de reserva — selección de cancha/fecha/hora/duración → link WhatsApp pre-llenado
- [x] Modal post-WhatsApp — confirma envío, guarda reserva como `pendiente` en DB (si logueado)
- [x] Reseñas — lista de reseñas reales desde DB + formulario para dejar reseña (requiere login) + estado "¡Gracias!" post-envío
- [x] Feed — publicaciones de complejos con filtro por tipo + skeleton loading
- [x] Mapa — complejos en mapa interactivo con popups
- [x] Perfil — historial de reservas reales + reseñas propias desde DB (con estado y precio)
- [x] Login/Register — email+password + Google OAuth
- [x] Onboarding — flujo post-registro según rol

### Owner
- [x] Dashboard — stats reales: reservas hoy, canchas activas, ingresos del mes, rating
- [x] Sidebar con nombre del complejo + saludo personalizado
- [x] Mi Complejo — editar toda la info (datos reales de DB)
- [x] Canchas — CRUD completo (crear/editar/eliminar canchas)
- [x] Reservas — lista con filtros por estado + Realtime (nuevas reservas aparecen sin refresh) + agregar manual + completar/eliminar
- [x] Caja del día — registro de ingresos/egresos, total del día, cierre de caja (estado local — **no persiste en DB aún**)
- [x] Estadísticas — gráficos de ingresos por semana/mes y reservas por día
- [x] Mi Link / QR — link público del complejo + código QR descargable
- [x] Flyer deportivo — generador de flyer con diseño Impact + logo + franja lima (descargable)
- [x] Settings — cambiar email y contraseña
- [x] Suscripción — ver estado del plan (trial activo/vencido/pagado)
- [x] BottomNav incluye accesos directos a panel owner en móvil

### Infraestructura / Técnico
- [x] React Query (`@tanstack/react-query`) instalado + `QueryProvider` en root layout
- [x] `next/image` con `remotePatterns` para Unsplash + Supabase Storage (optimización de imágenes)
- [x] Componente `Skeleton` con shimmer animation reutilizable (`src/components/ui/Skeleton.tsx`)
- [x] Helper `cn()` con clsx + tailwind-merge (`src/lib/utils.ts`)
- [x] PWA — `manifest.json` + `apple-touch-icon` + meta `apple-mobile-web-app-title`

---

## Último trabajo realizado

**En vuelo (sin commit)** — estabilidad, disponibilidad real, UX:
- `next/image` reemplaza todos los `<img>` en complejo/[slug] y explorar (+ `remotePatterns` en next.config)
- `Skeleton` shimmer en loading states de complejo, explorar, feed y TimelineAvailability
- Reseñas reales en `/complejo/[slug]` — fetch desde DB + formulario + post-submit state
- Perfil con datos reales — reservas propias + reseñas propias desde DB
- `QueryProvider` wrapping el root layout — React Query activo
- Utility `cn()` con clsx + tailwind-merge
- **AvailabilityWidget disponibilidad real** — lee `reservations` (pendiente/confirmada) y `court_availability` desde DB para bloquear slots reales; ya no usa mock. Error visible en modal si falla el insert. Skeleton en timeline mientras carga.
- **Caja localStorage** — persiste movimientos del día con clave `caja_{fecha}`. Se recupera al recargar, se limpia al abrir nueva caja.
- **Precio reserva manual** — se recalcula automáticamente según cancha × duración (hora inicio → hora fin). Editable manualmente.
- **Error handling generalizado** — Promise.all con catch en dashboard y perfil; Explorar muestra error con botón "Reintentar" en vez de lista vacía silenciosa.

**Commit: `beb518a`** — `feat: reservas pendientes desde jugador + realtime en owner`
- Al confirmar reserva por WhatsApp → se guarda como `pendiente` en DB
- Realtime en panel owner: canal `reservas-owner-{complex_id}`

**Commits anteriores:**
- `8671790` — Fix hydration #418, redirect post-login, logout mejorado, modal post-WhatsApp
- `5313d24` — Estabilidad de sesión, datos reales en Explorar, feed resiliente
- `250fb60` — Precio $0 bug, signout modal, saludo con nombre del complejo, layout flyer
- `619def5` — Error 406 suscripción, canchas modal, login más rápido, flyer Impact + logo
- `fac8679` — Generador de flyer deportivo
- `fb45c1b` — Reservas manuales del owner + BottomNav owner
- `c42f6ed` — Sidebar con nombre del complejo

---

## Lo que falta implementar (ordenado por impacto)

### 🔴 Crítico / Core
1. ~~**Disponibilidad real en AvailabilityWidget**~~ ✅ — Lee `reservations` y `court_availability` de DB. Gap pendiente: cuando el owner confirma en el panel, los slots NO se escriben automáticamente en `court_availability` (el bloqueo viene de las reservas `confirmada`/`pendiente` — funciona, pero no bidireccional aún).
2. **Caja del día persiste en DB** — localStorage resuelve el problema de recarga (~90% del caso real); falta persistencia real en servidor para multi-device o recuperación post-borrado de caché.
3. **Google OAuth en producción** — configurar en Supabase Dashboard: `Site URL` y `Redirect URLs` a `https://elpiqueapp.com` (solo config, no código).

### 🟡 Alta prioridad
4. **Búsqueda por fecha en Explorar** — filtrar complejos que tienen canchas disponibles en una fecha/hora específica
5. **Onboarding del owner** — wizard paso a paso para la primera vez: crear complejo → agregar canchas → compartir link (hoy el owner llega al panel vacío sin guía)
6. **Multi-complejo** — si un owner tiene más de un complejo, el panel siempre usa el primero. Necesita selector global en el layout del panel.
7. **Fotos en canchas** — el formulario de crear/editar cancha no tiene upload de imagen (falta integración con Supabase Storage).
8. **Historial real en dashboard** — las últimas reservas que aparecen en el resumen del dashboard ya son reales pero podrían mostrar más detalle (nombre del jugador, hora, cancha).

### 🟢 Mejoras UX
9. **Agenda visual** — calendario semanal en el panel owner con franjas de colores por cancha (verde=libre, rojo=ocupado)
10. **Bloqueo manual de horarios** — el owner puede bloquear un slot desde el panel (mantenimiento, reserva privada fuera del sistema)
11. **Reservas recurrentes** — "todos los lunes a las 19hs" para jugadores fijos
12. **Lista de espera** — si un slot está ocupado, el jugador se anota y recibe aviso cuando se libera
13. **Link directo a reserva de cancha** — QR que pre-selecciona una cancha específica en el widget
14. **Notificaciones push** — aviso cuando el owner confirma/rechaza una reserva
15. **Reseñas con foto** — subir foto al dejar una reseña

### 🔵 Futuro / v2
- App nativa iOS/Android (PWA como base)
- Torneos con bracket automático y resultados en vivo
- Multi-ciudad escalable (hoy mono-ciudad)
- Marketplace de equipamiento deportivo
- Programa de fidelidad (puntos por reservas)
- API pública para complejos grandes

---

## Flujo de reserva completo (estado actual)

```
Jugador ve complejo → AvailabilityWidget
  → Selecciona cancha
  → Selecciona fecha (DatePickerCustom)
  → Selecciona hora (TimelineAvailability) — ⚠️ SLOTS MOCK, no reales
  → Selecciona duración (1-6h)
  → Ve precio total
  → Click "Confirmar por WhatsApp" → abre WhatsApp con mensaje pre-llenado
  → Modal "¿Enviaste el mensaje?"
    → "Sí, enviado" → guarda reserva pendiente en DB
    → "No pude" → cierra modal, no guarda nada

Owner ve nueva reserva en /owner/reservas (Realtime)
  → Confirma por WhatsApp directamente (fuera del sistema)
  → Marca como confirmada/completada en el panel
```

**Gap principal:** cuando el owner confirma, los slots NO se bloquean automáticamente en `court_availability`, por lo que otro jugador puede ver y seleccionar el mismo horario.

---

## Variables de entorno necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=https://aracmkttghzxdnujxuca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # solo server-side
NEXT_PUBLIC_APP_URL=https://elpiqueapp.com
```

---

## Notas técnicas importantes

- **Hydration:** `suppressHydrationWarning` en `<html>` y `<body>`. Estado que depende de fecha/hora (ej: `abierto`) se computa en `useEffect`, nunca en el render inicial.
- **Supabase client:** inicialización lazy (no se llama `createBrowserClient` al cargar el módulo). `window.__ENV` inyectado en `<head>` para tener variables en runtime sin exponer en el bundle.
- **Auth:** `useAuth()` hook centralizado. Rutas del owner protegidas por middleware + verificación de rol `propietario` en el layout del panel.
- **Realtime:** Canal `reservas-owner-{complex_id}` para nuevas reservas en el panel. No hay canal activo del lado del jugador aún.
- **React Query:** instalado, configurado (`staleTime: 30s, gcTime: 5min`) y activo en root layout. Las páginas aún usan `useEffect` + `useState` para fetches — migrar a `useQuery` es deuda técnica pendiente pero el proveedor ya está disponible.
- **Caja:** estado local con `useState`, se pierde al recargar. El owner debe mantener la pestaña abierta.
