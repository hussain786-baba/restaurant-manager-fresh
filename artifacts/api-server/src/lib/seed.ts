import { db } from "@workspace/db";
import {
  staffUsersTable,
  restaurantTablesTable,
  categoriesTable,
  menuItemsTable,
  ordersTable,
  orderItemsTable,
  alertsTable,
} from "@workspace/db";
import { hashPassword } from "./auth";
import { computeOrderTotals, generateOrderCode } from "./orderCalc";
import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  const existingStaff = await db.select().from(staffUsersTable).limit(1);
  if (existingStaff.length > 0) {
    logger.info("Database already seeded, skipping");
    return;
  }

  logger.info("Seeding database...");

  // Staff
  await db.insert(staffUsersTable).values([
    {
      email: "owner@dineflow.test",
      passwordHash: await hashPassword("dineflow123"),
      name: "Aanya Sharma",
      role: "super_admin",
    },
    {
      email: "manager@dineflow.test",
      passwordHash: await hashPassword("dineflow123"),
      name: "Rohan Mehta",
      role: "manager",
    },
  ]);

  // Tables
  const tables = await db
    .insert(restaurantTablesTable)
    .values(
      Array.from({ length: 12 }, (_, i) => ({
        code: `T${String(i + 1).padStart(2, "0")}`,
        label: `Table ${i + 1}`,
        capacity: i % 4 === 0 ? 6 : i % 3 === 0 ? 4 : 2,
        status: "available",
        notes: i === 5 ? "By the window" : null,
      })),
    )
    .returning();

  // Categories
  const cats = await db
    .insert(categoriesTable)
    .values([
      { name: "Starters", slug: "starters", sortOrder: 1, description: "Small plates to begin" },
      { name: "Mains", slug: "mains", sortOrder: 2, description: "Hearty signature dishes" },
      { name: "Thalis", slug: "thalis", sortOrder: 3, description: "Complete platter meals" },
      { name: "Breads", slug: "breads", sortOrder: 4, description: "Tandoor-fresh breads" },
      { name: "Desserts", slug: "desserts", sortOrder: 5, description: "Sweet finales" },
      { name: "Drinks", slug: "drinks", sortOrder: 6, description: "Coolers, lassis & teas" },
    ])
    .returning();

  const byName = (n: string) => cats.find((c) => c.name === n)!.id;

  // Menu items
  const items = await db
    .insert(menuItemsTable)
    .values([
      {
        categoryId: byName("Starters"),
        name: "Paneer Tikka",
        description:
          "Charcoal-grilled cottage cheese marinated in hung yogurt, kasundi mustard, and ajwain.",
        price: "320",
        imageEmoji: "🧀",
        isVeg: true,
        isBestseller: true,
        prepTimeMinutes: 12,
        includes: ["Mint chutney", "Onion ringlets", "Lemon wedge"],
      },
      {
        categoryId: byName("Starters"),
        name: "Tandoori Wings",
        description:
          "Free-range chicken wings smoked in the tandoor with smoked paprika and garlic.",
        price: "380",
        imageEmoji: "🍗",
        isVeg: false,
        isBestseller: true,
        prepTimeMinutes: 14,
        includes: ["Burnt-garlic dip", "Pickled radish"],
      },
      {
        categoryId: byName("Starters"),
        name: "Galouti Kebab",
        description:
          "Awadhi melt-in-the-mouth lamb kebabs with cardamom and rose.",
        price: "440",
        imageEmoji: "🥩",
        isVeg: false,
        prepTimeMinutes: 16,
        includes: ["Mini ulte tawa parathas", "Saffron onion"],
      },
      {
        categoryId: byName("Mains"),
        name: "Butter Chicken",
        description:
          "House signature. Slow-simmered tomato gravy, fenugreek, single-origin butter.",
        price: "520",
        imageEmoji: "🍛",
        isVeg: false,
        isBestseller: true,
        prepTimeMinutes: 22,
        includes: ["Cream swirl", "Slivered ginger"],
      },
      {
        categoryId: byName("Mains"),
        name: "Dal Makhani",
        description:
          "Black urad dal cooked overnight with charcoal smoke, cream, and tomato.",
        price: "380",
        imageEmoji: "🥘",
        isVeg: true,
        isBestseller: true,
        prepTimeMinutes: 18,
        includes: ["Cream", "Julienned ginger"],
      },
      {
        categoryId: byName("Mains"),
        name: "Lamb Rogan Josh",
        description:
          "Slow-braised lamb shoulder in Kashmiri chili and ratan jot oil.",
        price: "620",
        imageEmoji: "🍖",
        isVeg: false,
        prepTimeMinutes: 26,
        includes: ["Steamed basmati", "Cucumber raita"],
      },
      {
        categoryId: byName("Mains"),
        name: "Palak Paneer",
        description:
          "Hand-blanched spinach with house-pressed paneer and garlic tempering.",
        price: "360",
        imageEmoji: "🥬",
        isVeg: true,
        prepTimeMinutes: 16,
        includes: ["Cream drizzle"],
      },
      {
        categoryId: byName("Thalis"),
        name: "Royal Veg Thali",
        description:
          "A complete vegetarian feast on a brass thali — six items, dessert, and bread.",
        price: "650",
        imageEmoji: "🍱",
        isVeg: true,
        isBestseller: true,
        prepTimeMinutes: 18,
        includes: [
          "Dal Makhani",
          "Paneer Butter Masala",
          "Aloo Gobi",
          "Jeera Rice",
          "2 Tandoori Rotis",
          "Mixed Pickle",
          "Boondi Raita",
          "Gulab Jamun",
        ],
      },
      {
        categoryId: byName("Thalis"),
        name: "Coastal Non-Veg Thali",
        description:
          "Fish curry, prawn fry, mutton sukka, and steamed rice — Mangalore style.",
        price: "780",
        imageEmoji: "🐟",
        isVeg: false,
        prepTimeMinutes: 22,
        includes: [
          "Fish curry",
          "Prawn fry",
          "Mutton sukka",
          "Neer dosa (2)",
          "Steamed rice",
          "Solkadhi",
          "Caramel custard",
        ],
      },
      {
        categoryId: byName("Breads"),
        name: "Tandoori Roti",
        description:
          "Whole-wheat bread blistered against the clay oven wall.",
        price: "60",
        imageEmoji: "🫓",
        isVeg: true,
        prepTimeMinutes: 6,
        includes: [],
      },
      {
        categoryId: byName("Breads"),
        name: "Garlic Naan",
        description:
          "Leavened naan brushed with cultured butter, raw garlic, and chopped coriander.",
        price: "120",
        imageEmoji: "🧄",
        isVeg: true,
        isBestseller: true,
        prepTimeMinutes: 7,
        includes: [],
      },
      {
        categoryId: byName("Breads"),
        name: "Laccha Paratha",
        description:
          "Flaky multi-layered paratha, brushed with ghee.",
        price: "90",
        imageEmoji: "🥞",
        isVeg: true,
        prepTimeMinutes: 8,
        includes: [],
      },
      {
        categoryId: byName("Desserts"),
        name: "Gulab Jamun",
        description:
          "Warm khoya dumplings in cardamom-saffron syrup. Two pieces.",
        price: "180",
        imageEmoji: "🍮",
        isVeg: true,
        prepTimeMinutes: 5,
        includes: ["Vanilla bean ice cream"],
      },
      {
        categoryId: byName("Desserts"),
        name: "Rasmalai",
        description:
          "Cottage-cheese discs in chilled saffron-pistachio milk.",
        price: "220",
        imageEmoji: "🍨",
        isVeg: true,
        prepTimeMinutes: 4,
        includes: ["Pistachio crumble"],
      },
      {
        categoryId: byName("Drinks"),
        name: "Mango Lassi",
        description:
          "Alphonso mango pulp blended with hung curd and a pinch of cardamom.",
        price: "180",
        imageEmoji: "🥭",
        isVeg: true,
        isBestseller: true,
        prepTimeMinutes: 4,
        includes: [],
      },
      {
        categoryId: byName("Drinks"),
        name: "Masala Chai",
        description:
          "Assam leaves brewed with fresh ginger, green cardamom, and clove.",
        price: "90",
        imageEmoji: "☕",
        isVeg: true,
        prepTimeMinutes: 5,
        includes: [],
      },
      {
        categoryId: byName("Drinks"),
        name: "Fresh Lime Soda",
        description:
          "Hand-pressed lime, sparkling water, your choice of sweet or salted.",
        price: "120",
        imageEmoji: "🍋",
        isVeg: true,
        prepTimeMinutes: 3,
        includes: [],
      },
    ])
    .returning();

  // A couple of past orders so the dashboard isn't empty
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000);

  async function makeOrder(
    tableId: number,
    pickedItems: { menuItemId: number; qty: number }[],
    status: string,
    when: Date,
    paid: boolean,
  ) {
    const lookups = pickedItems.map((p) => ({
      ...items.find((i) => i.id === p.menuItemId)!,
      qty: p.qty,
    }));
    const lineItems = lookups.map((l) => ({
      unitPrice: Number(l.price),
      quantity: l.qty,
    }));
    const totals = computeOrderTotals(lineItems, 0);
    const [order] = await db
      .insert(ordersTable)
      .values({
        code: generateOrderCode(),
        tableId,
        sessionId: `seed-session-${tableId}-${when.getTime()}`,
        status,
        guestName: "Guest",
        guestCount: 2,
        subtotal: String(totals.subtotal),
        tax: String(totals.tax),
        tip: "0",
        total: String(totals.total),
        paymentMethod: paid ? "card" : null,
        paidAt: paid ? when : null,
        createdAt: when,
        updatedAt: when,
      })
      .returning();
    await db.insert(orderItemsTable).values(
      lookups.map((l) => ({
        orderId: order.id,
        menuItemId: l.id,
        name: l.name,
        imageEmoji: l.imageEmoji,
        quantity: l.qty,
        unitPrice: String(l.price),
        lineTotal: String(Number(l.price) * l.qty),
        specialInstructions: null,
      })),
    );
    return order;
  }

  await makeOrder(
    tables[0].id,
    [
      { menuItemId: items.find((i) => i.name === "Butter Chicken")!.id, qty: 2 },
      { menuItemId: items.find((i) => i.name === "Garlic Naan")!.id, qty: 4 },
      { menuItemId: items.find((i) => i.name === "Mango Lassi")!.id, qty: 2 },
    ],
    "paid",
    yesterday,
    true,
  );

  await makeOrder(
    tables[2].id,
    [
      { menuItemId: items.find((i) => i.name === "Royal Veg Thali")!.id, qty: 2 },
      { menuItemId: items.find((i) => i.name === "Gulab Jamun")!.id, qty: 1 },
    ],
    "paid",
    new Date(now.getTime() - 4 * 60 * 60 * 1000),
    true,
  );

  await makeOrder(
    tables[4].id,
    [
      { menuItemId: items.find((i) => i.name === "Lamb Rogan Josh")!.id, qty: 1 },
      { menuItemId: items.find((i) => i.name === "Tandoori Roti")!.id, qty: 3 },
      { menuItemId: items.find((i) => i.name === "Masala Chai")!.id, qty: 2 },
    ],
    "preparing",
    oneHourAgo,
    false,
  );

  await makeOrder(
    tables[7].id,
    [
      { menuItemId: items.find((i) => i.name === "Paneer Tikka")!.id, qty: 1 },
      { menuItemId: items.find((i) => i.name === "Dal Makhani")!.id, qty: 1 },
      { menuItemId: items.find((i) => i.name === "Garlic Naan")!.id, qty: 2 },
    ],
    "ready",
    new Date(now.getTime() - 25 * 60 * 1000),
    false,
  );

  // Seed alerts
  await db.insert(alertsTable).values([
    {
      type: "waiter_call",
      title: "Waiter requested",
      message: "Table 8 needs assistance.",
      tableId: tables[7].id,
      orderId: null,
    },
    {
      type: "order_ready",
      title: "Order ready to serve",
      message: "Table 8's order is ready in the kitchen.",
      tableId: tables[7].id,
      orderId: null,
    },
  ]);

  // Mark some tables as occupied
  await db.execute(
    `UPDATE restaurant_tables SET status = 'dining' WHERE id IN (${tables[4].id}, ${tables[7].id})`,
  );

  logger.info("Seeding complete.");
}
