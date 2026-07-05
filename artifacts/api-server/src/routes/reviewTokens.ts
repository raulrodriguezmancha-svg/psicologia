import { Router, type IRouter } from "express";
import { db, reviewTokensTable, reviewsTable, bookingsTable, servicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/reviews/form/:token — validar token y devolver datos de la cita
router.get("/reviews/form/:token", async (req, res): Promise<void> => {
  const { token } = req.params as { token: string };

  const [tokenRow] = await db
    .select()
    .from(reviewTokensTable)
    .where(eq(reviewTokensTable.token, token));

  if (!tokenRow) {
    res.status(404).json({ error: "Enlace no válido o no encontrado" });
    return;
  }

  if (tokenRow.used) {
    res.status(400).json({ error: "Este enlace ya ha sido utilizado para enviar una reseña" });
    return;
  }

  if (new Date() > tokenRow.expiresAt) {
    res.status(400).json({ error: "Este enlace ha expirado (válido 30 días)" });
    return;
  }

  const [booking] = await db
    .select({
      id: bookingsTable.id,
      clientName: bookingsTable.clientName,
      serviceName: servicesTable.name,
      appointmentDate: bookingsTable.appointmentDate,
      status: bookingsTable.status,
    })
    .from(bookingsTable)
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(eq(bookingsTable.id, tokenRow.bookingId));

  if (!booking || booking.status !== "completed") {
    res.status(400).json({ error: "No se puede dejar una reseña para esta cita" });
    return;
  }

  res.json({
    valid: true,
    clientName: booking.clientName,
    serviceName: booking.serviceName,
    date: booking.appointmentDate,
  });
});

// POST /api/reviews/form/:token — enviar reseña
router.post("/reviews/form/:token", async (req, res): Promise<void> => {
  const { token } = req.params as { token: string };
  const { rating, comment, authorName } = req.body as {
    rating?: number | string;
    comment?: string;
    authorName?: string;
  };

  if (!rating || !comment || !authorName) {
    res.status(400).json({ error: "Nombre, valoración y comentario son obligatorios" });
    return;
  }

  const parsedRating = parseInt(String(rating), 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400).json({ error: "La valoración debe ser un número entre 1 y 5" });
    return;
  }

  if (comment.trim().length < 10) {
    res.status(400).json({ error: "El comentario debe tener al menos 10 caracteres" });
    return;
  }

  const [tokenRow] = await db
    .select()
    .from(reviewTokensTable)
    .where(eq(reviewTokensTable.token, token));

  if (!tokenRow || tokenRow.used || new Date() > tokenRow.expiresAt) {
    res.status(400).json({ error: "Enlace no válido o expirado" });
    return;
  }

  // Insertar reseña e invalidar token en una transacción
  await db.transaction(async (tx) => {
    await tx.insert(reviewsTable).values({
      bookingId: tokenRow.bookingId,
      authorName: authorName.trim(),
      rating: parsedRating,
      comment: comment.trim(),
      approved: false,
      hidden: false,
    });

    await tx
      .update(reviewTokensTable)
      .set({ used: true })
      .where(eq(reviewTokensTable.token, token));
  });

  res.status(201).json({ success: true, message: "Reseña enviada. Será publicada tras su revisión." });
});

export default router;
