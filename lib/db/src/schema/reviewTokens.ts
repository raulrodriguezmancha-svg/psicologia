import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const reviewTokensTable = pgTable("review_tokens", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
