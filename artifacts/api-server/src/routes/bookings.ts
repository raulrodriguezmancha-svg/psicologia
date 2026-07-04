import { Router, type IRouter } from "express";
import { db, bookingsTable, servicesTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import {
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingStatusParams,
  UpdateBookingStatusBody,
  UpdateBookingStatusResponse,
  GetBookingStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookings/stats", async (req, res): Promise<void> => {
  const allBookings = await db.select({ status: bookingsTable.status, depositPaid: bookingsTable.depositPaid }).from(bookingsTable);

  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === "pending").length,
    confirmed: allBookings.filter(b => b.status === "confirmed").length,
    completed: allBookings.filter(b => b.status === "completed").length,
    cancelled: allBookings.filter(b => b.status === "cancelled").length,
    depositsPaid: allBookings.filter(b => b.depositPaid).length,
  };

  res.json(GetBookingStatsResponse.parse(stats));
});

router.get("/bookings", async (req, res): Promise<void> => {
  const bookings = await db
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
      stripeSessionId: bookingsTable.stripeSessionId,
      calendarEventId: bookingsTable.calendarEventId,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .orderBy(bookingsTable.createdAt);

  res.json(ListBookingsResponse.parse(bookings.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }))));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check service exists and get deposit amount
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsed.data.serviceId));
  if (!service) {
    res.status(400).json({ error: "Servicio no encontrado" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      ...parsed.data,
      status: "pending",
      depositPaid: false,
      depositAmount: service.depositAmount,
    })
    .returning();

  const result = {
    ...booking,
    serviceName: service.name,
    createdAt: booking.createdAt.toISOString(),
  };

  res.status(201).json(CreateBookingResponse.parse(result));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
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
      stripeSessionId: bookingsTable.stripeSessionId,
      calendarEventId: bookingsTable.calendarEventId,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Reserva no encontrada" });
    return;
  }

  res.json(GetBookingResponse.parse({ ...booking, createdAt: booking.createdAt.toISOString() }));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBookingStatusParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Reserva no encontrada" });
    return;
  }

  const [service] = await db.select({ name: servicesTable.name }).from(servicesTable).where(eq(servicesTable.id, updated.serviceId));

  res.json(UpdateBookingStatusResponse.parse({
    ...updated,
    serviceName: service?.name ?? null,
    createdAt: updated.createdAt.toISOString(),
  }));
});

export default router;
