import { Router, type IRouter } from "express";
import { db, bookingsTable, blockedSlotsTable, availableSlotsTable } from "@workspace/db";
import { and, gte, lte, eq } from "drizzle-orm";
import { GetAvailabilityQueryParams, GetAvailabilityResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Horario base de trabajo: lunes a viernes
const WORKING_HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00", "19:00"];

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const date = new Date(year, month - 1, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && date >= today) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      days.push(`${y}-${m}-${d}`);
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

router.get("/availability", async (req, res): Promise<void> => {
  const parsed = GetAvailabilityQueryParams.safeParse(req.query);
  const monthStr = parsed.success && parsed.data.month ? parsed.data.month : null;

  let year: number;
  let month: number;

  if (monthStr) {
    const parts = monthStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  const days = getDaysInMonth(year, month);

  // Reservas confirmadas (ocupan el slot)
  const confirmedBookings = await db
    .select({ date: bookingsTable.appointmentDate, time: bookingsTable.appointmentTime })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "confirmed"),
        gte(bookingsTable.appointmentDate, startDate),
        lte(bookingsTable.appointmentDate, endDate)
      )
    );

  // Bloqueos (días completos o horas concretas)
  const blocked = await db
    .select()
    .from(blockedSlotsTable)
    .where(and(gte(blockedSlotsTable.date, startDate), lte(blockedSlotsTable.date, endDate)));

  // Slots extra añadidos manualmente por admin
  const extraSlots = await db
    .select()
    .from(availableSlotsTable)
    .where(and(gte(availableSlotsTable.date, startDate), lte(availableSlotsTable.date, endDate)));

  const bookedKeys = new Set(confirmedBookings.map(b => `${b.date}_${b.time}`));
  const blockedDays = new Set(blocked.filter(b => !b.time).map(b => b.date));
  const blockedKeys = new Set(blocked.filter(b => b.time).map(b => `${b.date}_${b.time}`));

  const slots: Array<{ date: string; time: string; available: boolean }> = [];

  for (const day of days) {
    if (blockedDays.has(day)) {
      // Día completo bloqueado — incluir pero no disponibles
      for (const time of WORKING_HOURS) {
        slots.push({ date: day, time, available: false });
      }
      continue;
    }

    const times = new Set(WORKING_HOURS);
    for (const extra of extraSlots.filter(e => e.date === day)) {
      times.add(extra.time);
    }

    for (const time of Array.from(times).sort()) {
      const key = `${day}_${time}`;
      slots.push({
        date: day,
        time,
        available: !blockedKeys.has(key) && !bookedKeys.has(key),
      });
    }
  }

  res.json(GetAvailabilityResponse.parse(slots));
});

export default router;
