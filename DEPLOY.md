# Guía de Deploy - Alba García Psicología

## Requisitos previos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Render.com](https://render.com) (gratis)
- Cuenta en [Stripe](https://stripe.com) (opcional, para pagos reales)

---

## Paso 1: Crear base de datos en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Crea un nuevo proyecto
3. Nombre: `alba-psicologia`
4. Contraseña: elige una segura
5. Región: **Europa (West)** - más cerca de España
6. Ve a **SQL Editor** en el menú lateral
7. Copia y pega todo el contenido de `supabase-schema.sql`
8. Haz clic en **Run**
9. Ve a **Settings → Database** y copia la **Connection string → URI**
   - Debería verse algo como: `postgresql://postgres.xxxxx:tu_password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`

---

## Paso 2: Subir el código a GitHub

1. Crea un repositorio nuevo en GitHub llamado `alba-psicologia`
2. En tu PC, abre una terminal en la carpeta del proyecto:
```bash
cd C:\Users\Raul\Downloads\Alba-Psychology-Booking_OG\Alba-Psychology-Booking
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/alba-psicologia.git
git push -u origin main
```

---

## Paso 3: Deploy en Render.com

1. Ve a https://render.com y crea una cuenta (conecta tu GitHub)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio `alba-psicologia`
4. Configura:
   - **Name**: `alba-psicologia`
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     cd artifacts/psicologia-web && npm install && npm run build && cd ../../lib/db && npm install && cd ../../artifacts/api-server && npm install && npm run build
     ```
   - **Start Command**:
     ```
     cd artifacts/api-server && node dist/index.mjs
     ```
   - **Plan**: Free

5. En **Environment Variables** añade:
   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | (la URI de Supabase del Paso 1) |
   | `ADMIN_PASSWORD` | (elige una contraseña para el panel admin) |
   | `JWT_SECRET` | (elige una cadena aleatoria larga, ej: `misupersecreto123abc...`) |
   | `STRIPE_SECRET_KEY` | (de Stripe, o déjalo vacío para usar mock) |
   | `STRIPE_WEBHOOK_SECRET` | (de Stripe, o déjalo vacío) |
   | `RESEND_API_KEY` | (de Resend, o déjalo vacío para logs en consola) |
   | `FROM_EMAIL` | `noreply@albagarcia-psicologia.com` |
   | `PORT` | `10000` |
   | `NODE_ENV` | `production` |

6. Haz clic en **"Create Web Service"**
7. Espera a que termine el build (2-3 minutos)

---

## Paso 4: Verificar

1. Render te dará una URL como: `https://alba-psicologia.onrender.com`
2. Abre esa URL en tu navegador
3. Deberías ver la web de Alba
4. Prueba el panel de admin: `/admin`
5. Login con la contraseña que configuraste

---

## Variables de entorno opcionales

### Stripe (para pagos reales)
1. Crea cuenta en https://stripe.com
2. Ve a Developers → API Keys
3. Copia la **Secret key** (sk_test_... o sk_live_...)
4. Para webhooks: Developers → Webhooks → Add endpoint
   - URL: `https://alba-psicologia.onrender.com/api/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`

### Resend (para correos automáticos)
1. Crea cuenta en https://resend.com
2. Ve a API Keys → Create API Key
3. Copia la API key
4. (Opcional) Verifica tu dominio para enviar desde tu email

---

## Troubleshooting

### La web no carga
- Revisa los logs en Render → Logs
- Verifica que `DATABASE_URL` es correcto
- Asegúrate de que ejecutaste el SQL en Supabase

### Errores de build
- Verifica que tienes Node.js 22+ en Render
- Revisa que `pnpm-workspace.yaml` no tenga errores

### Panel admin no funciona
- Verifica que `ADMIN_PASSWORD` y `JWT_SECRET` estén configurados
- El panel está en `/admin`
