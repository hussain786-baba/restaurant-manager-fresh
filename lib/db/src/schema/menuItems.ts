import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { categoriesTable } from "./categories";

export const menuItemsTable = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageEmoji: text("image_emoji"),
  isVeg: boolean("is_veg").notNull().default(true),
  isAvailable: boolean("is_available").notNull().default(true),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  prepTimeMinutes: integer("prep_time_minutes").notNull().default(15),
  includes: text("includes").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type MenuItemRow = typeof menuItemsTable.$inferSelect;
