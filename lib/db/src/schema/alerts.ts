import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { restaurantTablesTable } from "./restaurantTables";
import { ordersTable } from "./orders";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  tableId: integer("table_id").references(() => restaurantTablesTable.id, {
    onDelete: "cascade",
  }),
  orderId: integer("order_id").references(() => ordersTable.id, {
    onDelete: "cascade",
  }),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AlertRow = typeof alertsTable.$inferSelect;
