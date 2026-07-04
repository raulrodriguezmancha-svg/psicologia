import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GetAvailabilityQueryParams, GetAvailabilityResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Available time slots: Mon-Fri 9:00-19:00, every hour
const WORKING_HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00", "19:00"];

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const date = new Date(year, month - 1, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    // Only Mon-Fri (1-5)
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

  const days = getDaysInMonth(year, month);

  // Get existing bookings for this month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const existingBookings = await db
    .select({ date: bookingsTable.appointmentDate, time: bookingsTable.appointmentTime, status: bookingsTable.status })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "confirmed")
      )
    );

  const bookedSlots = new Set(
    existingBookings
      .filter(b => b.date >= startDate && b.date <= endDate)
      .map(b => `${b.date}_${b.time}`)
  );

  const slots: Array<{ date: string; time: string; available: boolean }> = [];
  for (const day of days) {
    for (const time of WORKING_HOURS) {
      slots.push({
        date: day,
        time,
        available: !bookedSlots.has(`${day}_${time}`),
      });
    }
  }

  res.json(GetAvailabilityResponse.parse(slots));
});

export default router;
