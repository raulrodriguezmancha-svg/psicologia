---
name: Psicologia web stack
description: Architecture decisions and gotchas for Alba García Santillana psychology site
---

# Key architecture

- Frontend: React+Vite static pages for home/servicios/resenas/about; DYNAMIC booking page uses direct fetch() to /api (no React Query hooks needed)
- Admin panel at /admin: no Navbar/Footer wrapper (full-page admin layout)
- Token review form at /resena/:token — public route but validates token server-side

# Environment variables required
- DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET — required for any backend functionality
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET — for real payments (without these, mock checkout is used)
- RESEND_API_KEY, FROM_EMAIL — for real emails (without these, emails are only logged)

# DB schema decisions
- reviews table has `hidden` + `booking_id` columns added in this session (drizzle push applied)
- available_slots = extra custom slots admin adds (on top of hardcoded Mon-Fri WORKING_HOURS)
- blocked_slots = day/time blocks; time=null means full day block
- review_tokens: 1 per completed booking, expire 30 days, invalidated after use

# Admin auth
- Simple password check: ADMIN_PASSWORD env var vs req.body.password (plain text comparison)
- JWT signed with JWT_SECRET, 7-day expiry, stored in localStorage as "admin_token"
- requireAdmin middleware in artifacts/api-server/src/middleware/auth.ts

# Stripe webhook
- Webhook route uses express.raw() middleware (set in app.ts BEFORE express.json())
- On checkout.session.completed: set status="confirmed", depositPaid=true, send confirmation email
- On checkout.session.expired: set status="cancelled"

# Review token flow
- Admin marks booking "completed" via PATCH /api/admin/bookings/:id/status
- Backend auto-generates crypto.randomBytes(32).toString("hex") token
- Token inserted into review_tokens table + email sent via Resend
- Token validated on GET/POST /api/reviews/form/:token (checks: exists, not used, not expired, booking completed)
- After review submitted: token.used = true (transaction with review insert)

**Why:** Prevents patients from leaving reviews without completing a session; prevents token reuse; no user account required.
