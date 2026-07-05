import { Router, type IRouter } from "express";
import { db, bookingsTable, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePaymentCheckoutBody, CreatePaymentCheckoutResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { sendEmail, bookingConfirmationHtml } from "../lib/email";
import { createCalendarEvent } from "./google";

const router: IRouter = Router();

router.post("/payments/create-checkout", async (req, res): Promise<void> => {
  const parsed = CreatePaymentCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { bookingId, depositAmount } = parsed.data;

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId));

  if (!booking) {
    res.status(404).json({ error: "Reserva no encontrada" });
    return;
  }

  if (depositAmount <= 0) {
    const mockSessionId = `free_session_${bookingId}_${Date.now()}`;
    await db
      .update(bookingsTable)
      .set({ stripeSessionId: mockSessionId, depositPaid: true, status: "confirmed" })
      .where(eq(bookingsTable.id, bookingId));

    const [service] = await db
      .select({ name: servicesTable.name, duration: servicesTable.duration })
      .from(servicesTable)
      .where(eq(servicesTable.id, booking.serviceId));

    const dateFormatted = new Date(booking.appointmentDate + "T00:00:00").toLocaleDateString(
      "es-ES",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );

    let meetLink: string | null = null;
    try {
      meetLink = await createCalendarEvent({
        summary: `${service?.name ?? "Sesión"} — ${booking.clientName}`,
        description: `Sesión de psicología con ${booking.clientName}\nEmail: ${booking.clientEmail}\nTeléfono: ${booking.clientPhone}${booking.notes ? `\nNotas: ${booking.notes}` : ""}`,
        date: booking.appointmentDate,
        time: booking.appointmentTime,
        durationMinutes: service?.duration ?? 60,
      });
      if (meetLink) {
        await db.update(bookingsTable).set({ calendarEventId: meetLink }).where(eq(bookingsTable.id, bookingId));
      }
    } catch (err) {
      logger.error({ err, bookingId }, "Error al crear evento en Google Calendar (free)");
    }

    await sendEmail({
      to: booking.clientEmail,
      subject: "¡Tu cita está confirmada! — Alba García Santillana",
      html: bookingConfirmationHtml({
        clientName: booking.clientName,
        serviceName: service?.name ?? "Sesión de psicología",
        date: dateFormatted,
        time: booking.appointmentTime,
        depositAmount: 0,
        meetLink: meetLink ?? undefined,
      }),
    });

    logger.info({ bookingId }, "Reserva gratuita confirmada sin pago");

    res.json(
      CreatePaymentCheckoutResponse.parse({
        checkoutUrl: `${req.protocol}://${req.get("host")}/reservar/confirmacion?booking_id=${bookingId}&session_id=${mockSessionId}`,
        sessionId: mockSessionId,
      })
    );
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    req.log.warn("Stripe no configurado — devolviendo checkout simulado");
    const mockSessionId = `mock_session_${bookingId}_${Date.now()}`;
    await db
      .update(bookingsTable)
      .set({ stripeSessionId: mockSessionId, depositPaid: true, status: "confirmed" })
      .where(eq(bookingsTable.id, bookingId));

    const [service] = await db
      .select({ name: servicesTable.name, duration: servicesTable.duration })
      .from(servicesTable)
      .where(eq(servicesTable.id, booking.serviceId));

    const dateFormatted = new Date(booking.appointmentDate + "T00:00:00").toLocaleDateString(
      "es-ES",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );

    let meetLink: string | null = null;
    try {
      meetLink = await createCalendarEvent({
        summary: `${service?.name ?? "Sesión"} — ${booking.clientName}`,
        description: `Sesión de psicología con ${booking.clientName}\nEmail: ${booking.clientEmail}\nTeléfono: ${booking.clientPhone}${booking.notes ? `\nNotas: ${booking.notes}` : ""}`,
        date: booking.appointmentDate,
        time: booking.appointmentTime,
        durationMinutes: service?.duration ?? 60,
      });
      if (meetLink) {
        await db.update(bookingsTable).set({ calendarEventId: meetLink }).where(eq(bookingsTable.id, bookingId));
      }
    } catch (err) {
      logger.error({ err, bookingId }, "Error al crear evento en Google Calendar (mock)");
    }

    await sendEmail({
      to: booking.clientEmail,
      subject: "¡Tu cita está confirmada! — Alba García Santillana",
      html: bookingConfirmationHtml({
        clientName: booking.clientName,
        serviceName: service?.name ?? "Sesión de psicología",
        date: dateFormatted,
        time: booking.appointmentTime,
        depositAmount: booking.depositAmount ?? 0,
        meetLink: meetLink ?? undefined,
      }),
    });

    res.json(
      CreatePaymentCheckoutResponse.parse({
        checkoutUrl: `${req.protocol}://${req.get("host")}/reservar/confirmacion?booking_id=${bookingId}&session_id=${mockSessionId}`,
        sessionId: mockSessionId,
      })
    );
    return;
  }

  try {
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(stripeSecretKey);

    const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
    const baseUrl =
      domains.length > 0 ? `https://${domains[0]}` : `${req.protocol}://${req.get("host")}`;

    const [service] = await db
      .select({ name: servicesTable.name })
      .from(servicesTable)
      .where(eq(servicesTable.id, booking.serviceId));

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Señal de reserva — ${service?.name ?? "Sesión"} #${bookingId}`,
              description: "Señal para confirmar su cita con Alba García Santillana. El resto se abona en sesión.",
            },
            unit_amount: Math.round(depositAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/reservar/confirmacion?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/reservar?cancelled=true`,
      metadata: { bookingId: String(bookingId) },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min para pagar
    });

    await db
      .update(bookingsTable)
      .set({ stripeSessionId: session.id })
      .where(eq(bookingsTable.id, bookingId));

    res.json(
      CreatePaymentCheckoutResponse.parse({
        checkoutUrl: session.url!,
        sessionId: session.id,
      })
    );
  } catch (err) {
    req.log.error({ err }, "Error al crear sesión de Stripe");
    res.status(500).json({ error: "Error al crear la sesión de pago. Inténtalo de nuevo." });
  }
});

// Webhook de Stripe — necesita raw body (configurado en app.ts)
router.post("/payments/webhook", async (req, res): Promise<void> => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    res.sendStatus(200);
    return;
  }

  try {
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(stripeSecretKey);
    const sig = req.headers["stripe-signature"] as string;

    // req.body es Buffer gracias al middleware raw en app.ts
    const event = stripeClient.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { bookingId?: string };
        payment_status?: string;
      };

      if (session.payment_status !== "paid") {
        res.sendStatus(200);
        return;
      }

      const bookingId = session.metadata?.bookingId
        ? parseInt(session.metadata.bookingId, 10)
        : null;

      if (bookingId) {
        const [updated] = await db
          .update(bookingsTable)
          .set({ depositPaid: true, status: "confirmed" })
          .where(eq(bookingsTable.id, bookingId))
          .returning();

        if (updated) {
          const [service] = await db
            .select({ name: servicesTable.name, duration: servicesTable.duration })
            .from(servicesTable)
            .where(eq(servicesTable.id, updated.serviceId));

          const dateFormatted = new Date(updated.appointmentDate + "T00:00:00").toLocaleDateString(
            "es-ES",
            { weekday: "long", day: "numeric", month: "long", year: "numeric" }
          );

          let meetLink: string | null = null;
          try {
            meetLink = await createCalendarEvent({
              summary: `${service?.name ?? "Sesión"} — ${updated.clientName}`,
              description: `Sesión de psicología con ${updated.clientName}\nEmail: ${updated.clientEmail}\nTeléfono: ${updated.clientPhone}${updated.notes ? `\nNotas: ${updated.notes}` : ""}`,
              date: updated.appointmentDate,
              time: updated.appointmentTime,
              durationMinutes: service?.duration ?? 60,
            });
            if (meetLink) {
              await db.update(bookingsTable).set({ calendarEventId: meetLink }).where(eq(bookingsTable.id, bookingId));
            }
          } catch (err) {
            logger.error({ err, bookingId }, "Error al crear evento en Google Calendar");
          }

          await sendEmail({
            to: updated.clientEmail,
            subject: "¡Tu cita está confirmada! — Alba García Santillana",
            html: bookingConfirmationHtml({
              clientName: updated.clientName,
              serviceName: service?.name ?? "Sesión de psicología",
              date: dateFormatted,
              time: updated.appointmentTime,
              depositAmount: updated.depositAmount ?? 0,
              meetLink: meetLink ?? undefined,
            }),
          });

          logger.info({ bookingId }, "Reserva confirmada tras pago Stripe");
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as { metadata?: { bookingId?: string } };
      const bookingId = session.metadata?.bookingId
        ? parseInt(session.metadata.bookingId, 10)
        : null;

      if (bookingId) {
        await db
          .update(bookingsTable)
          .set({ status: "cancelled" })
          .where(eq(bookingsTable.id, bookingId));
        logger.info({ bookingId }, "Reserva cancelada por expiración de sesión Stripe");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Error en webhook de Stripe");
    res.status(400).json({ error: "Webhook error" });
  }
});

export default router;
