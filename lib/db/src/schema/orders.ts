import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";
import { restaurantTablesTable } from "./restaurantTables";
import { menuItemsTable } from "./menuItems";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  tableId: integer("table_id")
    .notNull()
    .references(() => restaurantTablesTable.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("placed"),
  guestName: text("guest_name"),
  guestCount: integer("guest_count"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  tip: numeric("tip", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: varchar("payment_method", { length: 32 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItemsTable.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  imageEmoji: text("image_emoji"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OrderRow = typeof ordersTable.$inferSelect;
export type OrderItemRow = typeof orderItemsTable.$inferSelect;
