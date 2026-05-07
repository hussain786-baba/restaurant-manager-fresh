import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const restaurantTablesTable = pgTable("restaurant_tables", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  label: text("label").notNull(),
  capacity: integer("capacity").notNull().default(2),
  status: varchar("status", { length: 32 }).notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RestaurantTableRow = typeof restaurantTablesTable.$inferSelect;
