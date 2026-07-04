import { pgTable, text, serial, boolean, real, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone").notNull(),
  serviceId: integer("service_id").notNull(),
  appointmentDate: date("appointment_date", { mode: "string" }).notNull(),
  appointmentTime: text("appointment_time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  depositAmount: real("deposit_amount"),
  stripeSessionId: text("stripe_session_id"),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, status: true, depositPaid: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
