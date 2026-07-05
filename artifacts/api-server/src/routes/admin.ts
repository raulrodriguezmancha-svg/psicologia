import { Router, type IRouter } from "express";
import { db, bookingsTable, servicesTable, reviewsTable, availableSlotsTable, blockedSlotsTable, reviewTokensTable } from "@workspace/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { requireAdmin } from "../middleware/auth";
import { sendEmail, reviewInvitationHtml } from "../lib/email";

const router: IRouter = Router();

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminPassword || !jwtSecret) {
    res.status(500).json({ error: "Credenciales de administrador no configuradas (ADMIN_PASSWORD y JWT_SECRET)" });
    return;
  }

  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Contraseña incorrecta" });
    return;
  }

  const token = jwt.sign({ admin: true }, jwtSecret, { expiresIn: "7d" });
  res.json({ token });
});

// ─── Reservas ─────────────────────────────────────────────────────────────────
router.get("/admin/bookings", requireAdmin, async (req, res): Promise<void> => {
  const { status, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(bookingsTable.status, status));
  if (dateFrom) conditions.push(gte(bookingsTable.appointmentDate, dateFrom));
  if (dateTo) conditions.push(lte(bookingsTable.appointmentDate, dateTo));

  const baseQuery = db
    .select({
      id: bookingsTable.id,
      clientName: bookingsTable.clientName,
      clientEmail: bookingsTable.clientEmail,
      clientPhone: bookingsTable.clientPhone,
      serviceId: bookingsTable.serviceId,
      serviceName: servicesTable.name,
      appointmentDate: bookingsTable.appointmentDate,
      appointmentTime: bookingsTable.appointmentTime,
      notes: bookingsTable.notes,
      status: bookingsTable.status,
      depositPaid: bookingsTable.depositPaid,
      depositAmount: bookingsTable.depositAmount,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .orderBy(desc(bookingsTable.appointmentDate));

  const bookings = conditions.length
    ? await baseQuery.where(and(...conditions))
    : await baseQuery;

  res.json(bookings.map(b => ({ ...b, createdAt: b.createdAt.toISOString() })));
});

router.patch("/admin/bookings/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body as { status?: string };

  const validStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Estado inválido" });
    return;
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({ status })
    .where(eq(bookingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Reserva no encontrada" });
    return;
  }

  // Cuando se marca como completada → generar token de reseña y enviar email
  if (status === "completed") {
    const existing = await db
      .select()
      .from(reviewTokensTable)
      .where(eq(reviewTokensTable.bookingId, id));

    if (existing.length === 0) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db.insert(reviewTokensTable).values({ bookingId: id, token, used: false, expiresAt });

      const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
      const baseUrl = domains.length > 0 ? `https://${domains[0]}` : "http://localhost";
      const reviewUrl = `${baseUrl}/resena/${token}`;

      await sendEmail({
        to: updated.clientEmail,
        subject: "¿Cómo fue tu experiencia? — Alba García Santillana",
        html: reviewInvitationHtml({
          clientName: updated.clientName,
          reviewUrl,
          expiresAt: expiresAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        }),
      });

      req.log.info({ bookingId: id }, "Token de reseña generado y email enviado");
    }
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

// ─── Horarios disponibles (custom) ───────────────────────────────────────────
router.get("/admin/slots/available", requireAdmin, async (req, res): Promise<void> => {
  const slots = await db
    .select()
    .from(availableSlotsTable)
    .orderBy(availableSlotsTable.date, availableSlotsTable.time);
  res.json(slots);
});

router.post("/admin/slots/available", requireAdmin, async (req, res): Promise<void> => {
  const { date, time } = req.body as { date?: string; time?: string };
  if (!date || !time) {
    res.status(400).json({ error: "Fecha y hora son requeridas" });
    return;
  }
  const [slot] = await db.insert(availableSlotsTable).values({ date, time }).returning();
  res.status(201).json(slot);
});

router.delete("/admin/slots/available/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(availableSlotsTable).where(eq(availableSlotsTable.id, id));
  res.sendStatus(204);
});

// ─── Bloqueos ─────────────────────────────────────────────────────────────────
router.get("/admin/slots/blocked", requireAdmin, async (req, res): Promise<void> => {
  const slots = await db
    .select()
    .from(blockedSlotsTable)
    .orderBy(blockedSlotsTable.date);
  res.json(slots);
});

router.post("/admin/slots/blocked", requireAdmin, async (req, res): Promise<void> => {
  const { date, time, reason } = req.body as { date?: string; time?: string; reason?: string };
  if (!date) {
    res.status(400).json({ error: "La fecha es requerida" });
    return;
  }
  const [slot] = await db
    .insert(blockedSlotsTable)
    .values({ date, time: time ?? null, reason: reason ?? null })
    .returning();
  res.status(201).json(slot);
});

router.delete("/admin/slots/blocked/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(blockedSlotsTable).where(eq(blockedSlotsTable.id, id));
  res.sendStatus(204);
});

// ─── Servicios ────────────────────────────────────────────────────────────────
router.get("/admin/services", requireAdmin, async (req, res): Promise<void> => {
  const services = await db.select().from(servicesTable);
  res.json(services);
});

router.post("/admin/services", requireAdmin, async (req, res): Promise<void> => {
  const { name, description, duration, price, depositAmount } = req.body as {
    name?: string; description?: string; duration?: number; price?: number; depositAmount?: number;
  };
  if (!name || !description || !duration || price == null || depositAmount == null) {
    res.status(400).json({ error: "Todos los campos son requeridos" });
    return;
  }
  const [service] = await db.insert(servicesTable).values({
    name, description, duration, price, depositAmount,
  }).returning();
  res.status(201).json(service);
});

router.patch("/admin/services/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { name, description, duration, price, depositAmount } = req.body as {
    name?: string; description?: string; duration?: number; price?: number; depositAmount?: number;
  };
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (duration !== undefined) updates.duration = duration;
  if (price !== undefined) updates.price = price;
  if (depositAmount !== undefined) updates.depositAmount = depositAmount;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No hay campos para actualizar" });
    return;
  }
  const [updated] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Servicio no encontrado" });
    return;
  }
  res.json(updated);
});

router.delete("/admin/services/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [deleted] = await db.delete(servicesTable).where(eq(servicesTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Servicio no encontrado" });
    return;
  }
  res.sendStatus(204);
});

// ─── Reseñas ──────────────────────────────────────────────────────────────────
router.get("/admin/reviews", requireAdmin, async (req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .orderBy(desc(reviewsTable.createdAt));
  res.json(reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.patch("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { approved, hidden } = req.body as { approved?: boolean; hidden?: boolean };

  const updates: Partial<{ approved: boolean; hidden: boolean }> = {};
  if (typeof approved === "boolean") updates.approved = approved;
  if (typeof hidden === "boolean") updates.hidden = hidden;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No hay campos para actualizar" });
    return;
  }

  const [updated] = await db
    .update(reviewsTable)
    .set(updates)
    .where(eq(reviewsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Reseña no encontrada" });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [deleted] = await db.delete(reviewsTable).where(eq(reviewsTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Reseña no encontrada" });
    return;
  }
  res.sendStatus(204);
});

export default router;
