# Alba García Santillana — Psicóloga y Neuropsicóloga

Web profesional completa de psicología online con sistema de reservas, pagos Stripe, panel de administración, reseñas verificadas y emails automáticos.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API (puerto 8080, proxiada en /api)
- `pnpm --filter @workspace/psicologia-web run dev` — Web React+Vite
- `pnpm run typecheck` — typecheck completo
- `pnpm --filter @workspace/db run push` — aplicar cambios de esquema a la BD

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Backend: Express 5 + Drizzle ORM + PostgreSQL
- Pagos: Stripe Checkout
- Emails: Resend (opcional)
- Enrutado: wouter
- Fuentes: Outfit + Playfair Display

## Where things live

- `artifacts/psicologia-web/src/pages/` — todas las páginas
- `artifacts/psicologia-web/src/data/static.ts` — datos hardcodeados (fallback)
- `artifacts/api-server/src/routes/` — todas las rutas API
- `lib/db/src/schema/` — esquema de base de datos (Drizzle ORM)

## Base de datos — Tablas

| Tabla | Descripción |
|-------|-------------|
| `services` | Servicios con precio, señal, duración |
| `bookings` | Reservas con datos del cliente, estado, Stripe ID |
| `reviews` | Reseñas con aprobación/ocultado |
| `review_tokens` | Tokens de reseña (1 por cita completada, expiran 30 días) |
| `available_slots` | Horarios extra añadidos por admin |
| `blocked_slots` | Días/horas bloqueados por admin |

## Páginas y rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio (estático) |
| `/servicios` | Lista de servicios (estático) |
| `/sobre-mi` | Sobre mí (estático) |
| `/resenas` | Reseñas públicas aprobadas (estático) |
| `/reservar` | Proceso de reserva en 4 pasos (dinámico, API) |
| `/reservar/confirmacion` | Confirmación tras pago |
| `/resena/:token` | Formulario de reseña con token único |
| `/admin` | Panel de administración (requiere contraseña) |

## API — Rutas principales

### Públicas
- `GET /api/services` — lista servicios
- `GET /api/availability?month=YYYY-MM` — disponibilidad (respeta bloqueos)
- `POST /api/bookings` — crear reserva
- `POST /api/payments/create-checkout` — crear sesión Stripe
- `POST /api/payments/webhook` — webhook Stripe (confirma reserva + envía email)
- `GET /api/reviews/form/:token` — validar token de reseña
- `POST /api/reviews/form/:token` — enviar reseña

### Admin (requieren Bearer token JWT)
- `POST /api/admin/login` — autenticación
- `GET/PATCH /api/admin/bookings` — gestión de reservas
- `PATCH /api/admin/bookings/:id/status` — cambiar estado (si → "completed": genera token + envía email)
- `GET/POST/DELETE /api/admin/slots/available` — horarios extra
- `GET/POST/DELETE /api/admin/slots/blocked` — bloqueos
- `GET/PATCH/DELETE /api/admin/reviews` — gestión de reseñas

## Environment Variables — Requeridas

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase o local) | ✅ Sí |
| `ADMIN_PASSWORD` | Contraseña del panel de admin | ✅ Sí |
| `JWT_SECRET` | Secreto para firmar tokens JWT (cadena aleatoria) | ✅ Sí |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | Para pagos reales |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe | Para pagos reales |
| `RESEND_API_KEY` | Clave de API de Resend | Para emails reales |
| `FROM_EMAIL` | Email remitente | Opcional |

## Para activar Stripe (pagos reales)

1. Crear cuenta en stripe.com
2. Obtener clave secreta (sk_live_... o sk_test_...)
3. Configurar webhook en Stripe Dashboard → apuntar a `https://TU_DOMINIO/api/payments/webhook`
4. Eventos a escuchar: `checkout.session.completed`, `checkout.session.expired`
5. Añadir `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` como secretos de entorno

## Para activar emails (Resend)

1. Crear cuenta en resend.com (3000 emails/mes gratis)
2. Verificar dominio o usar el sandbox
3. Añadir `RESEND_API_KEY` como secreto de entorno
4. Opcionalmente configurar `FROM_EMAIL`

## Para usar Supabase como base de datos

1. Crear proyecto en supabase.com
2. En Project Settings → Database → Connection string → URI
3. Cambiar `DATABASE_URL` a la URL de Supabase
4. Ejecutar `pnpm --filter @workspace/db run push` para crear las tablas

## Flujo de reserva

1. Paciente elige servicio → calendario → horario disponible
2. Rellena nombre, email, teléfono
3. Se crea reserva (status: "pending") y se redirige a Stripe Checkout
4. Stripe confirma pago → webhook → status: "confirmed" + email al paciente
5. Admin marca cita como "completed" → se genera token único + email al paciente
6. Paciente usa el enlace para escribir su reseña
7. Admin aprueba o rechaza la reseña desde el panel

## Seguridad implementada

- Admin: JWT (7 días) firmado con JWT_SECRET
- Anti-duplicados: verificación DB antes de crear reserva
- Tokens de reseña: únicos, de uso único, expiran en 30 días
- Validación de formularios en frontend y backend
- Toda la lógica crítica en el servidor (Node.js), nunca en el cliente
- Webhook Stripe verificado con firma criptográfica

## Gotchas

- El webhook de Stripe necesita `STRIPE_WEBHOOK_SECRET`. Sin él, solo se registra en logs.
- Sin `RESEND_API_KEY`, los emails se registran en los logs del servidor pero no se envían.
- Sin `ADMIN_PASSWORD` y `JWT_SECRET`, el panel de admin devuelve 500.
- `pnpm --filter @workspace/db run push` debe ejecutarse cada vez que se cambie el schema.

## User preferences

- Diseño: paleta dorada/crema que combina con el logo, tipografías Outfit + Playfair Display
- Idioma: español en toda la interfaz
- Terapia 100% online
