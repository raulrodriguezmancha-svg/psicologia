import { pgTable, text, serial, bigint, timestamp } from "drizzle-orm/pg-core";

export const googleTokensTable = pgTable("google_tokens", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiryDate: bigint("expiry_date", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GoogleToken = typeof googleTokensTable.$inferSelect;
