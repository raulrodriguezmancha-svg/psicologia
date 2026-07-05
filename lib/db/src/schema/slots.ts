import { pgTable, text, serial, timestamp, date } from "drizzle-orm/pg-core";

export const availableSlotsTable = pgTable("available_slots", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blockedSlotsTable = pgTable("blocked_slots", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  time: text("time"), // null = bloqueo de día completo
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
