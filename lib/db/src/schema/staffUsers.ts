import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const staffUsersTable = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("manager"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type StaffUserRow = typeof staffUsersTable.$inferSelect;
