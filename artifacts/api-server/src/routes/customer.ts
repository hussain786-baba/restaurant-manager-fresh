import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  restaurantTablesTable,
  categoriesTable,
  menuItemsTable,
  ordersTable,
  orderItemsTable,
  alertsTable,
} from "@workspace/db";
import {
  ListPublicTablesResponse,
  GetTableByCodeResponse,
  GetCustomerMenuResponse,
  CreateCustomerOrderBody,
  GetCustomerOrderResponse,
  GetOrdersBySessionResponse,
  CallWaiterResponse,
  PayOrderBody,
  PayOrderResponse,
} from "@workspace/api-zod";
import {
  serializeTable,
  serializeCategory,
  serializeMenuItem,
  serializeOrder,
} from "../lib/serializers";
import { computeOrderTotals, generateOrderCode } from "../lib/orderCalc";

const router: IRouter = Router();

router.get("/customer/tables", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: restaurantTablesTable.id,
      code: restaurantTablesTable.code,
      label: restaurantTablesTable.label,
      capacity: restaurantTablesTable.capacity,
    })
    .from(restaurantTablesTable)
    .orderBy(restaurantTablesTable.id);
  res.json(ListPublicTablesResponse.parse(rows));
});

router.get("/customer/tables/:code", async (req, res): Promise<void> => {
  const code = String(req.params.code).toUpperCase();
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.code, code));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(GetTableByCodeResponse.parse(serializeTable(table)));
});

router.get("/customer/menu", async (_req, res): Promise<void> => {
  const cats = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.sortOrder, categoriesTable.id);
  const items = await db
    .select()
    .from(menuItemsTable)
    .orderBy(menuItemsTable.id);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  res.json(
    GetCustomerMenuResponse.parse({
      categories: cats.map(serializeCategory),
      items: items.map((i) => serializeMenuItem(i, catMap.get(i.categoryId) ?? null)),
    }),
  );
});

router.post("/customer/orders", async (req, res): Promise<void> => {
  const parsed = CreateCustomerOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tableCode, sessionId, items, guestCount, guestName } = parsed.data;
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.code, tableCode.toUpperCase()));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  if (items.length === 0) {
    res.status(400).json({ error: "Order must have at least one item" });
    return;
  }
  const itemIds = items.map((i) => i.menuItemId);
  const menuRows = await db
    .select()
    .from(menuItemsTable);
  const menuMap = new Map(menuRows.map((m) => [m.id, m]));
  const lineItems = items.map((i) => {
    const m = menuMap.get(i.menuItemId);
    if (!m) {
      throw new Error(`Menu item ${i.menuItemId} not found`);
    }
    return {
      menuItem: m,
      quantity: i.quantity,
      specialInstructions: i.specialInstructions ?? null,
      unitPrice: Number(m.price),
    };
  });
  const totals = computeOrderTotals(
    lineItems.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    0,
  );

  const [order] = await db
    .insert(ordersTable)
    .values({
      code: generateOrderCode(),
      tableId: table.id,
      sessionId,
      status: "placed",
      guestName: guestName ?? null,
      guestCount: guestCount ?? null,
      subtotal: String(totals.subtotal),
      tax: String(totals.tax),
      tip: "0",
      total: String(totals.total),
    })
    .returning();

  const orderItems = await db
    .insert(orderItemsTable)
    .values(
      lineItems.map((l) => ({
        orderId: order.id,
        menuItemId: l.menuItem.id,
        name: l.menuItem.name,
        imageEmoji: l.menuItem.imageEmoji,
        quantity: l.quantity,
        unitPrice: String(l.unitPrice),
        lineTotal: String(l.unitPrice * l.quantity),
        specialInstructions: l.specialInstructions,
      })),
    )
    .returning();

  // Update table status
  await db
    .update(restaurantTablesTable)
    .set({ status: "dining" })
    .where(eq(restaurantTablesTable.id, table.id));

  // Create alert for new order
  await db.insert(alertsTable).values({
    type: "new_order",
    title: "New order placed",
    message: `${table.label} placed order ${order.code}.`,
    tableId: table.id,
    orderId: order.id,
  });

  res
    .status(201)
    .json(serializeOrder(order, table.label, orderItems));
  void itemIds;
});

router.get(
  "/customer/orders/by-session/:sessionId",
  async (req, res): Promise<void> => {
    const sessionId = String(req.params.sessionId);
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.sessionId, sessionId))
      .orderBy(desc(ordersTable.createdAt));
    if (orders.length === 0) {
      res.json(GetOrdersBySessionResponse.parse([]));
      return;
    }
    const tables = await db.select().from(restaurantTablesTable);
    const tableMap = new Map(tables.map((t) => [t.id, t.label]));
    const result = [];
    for (const o of orders) {
      const its = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, o.id));
      result.push(serializeOrder(o, tableMap.get(o.tableId) ?? "Table", its));
    }
    res.json(result);
  },
);

router.get("/customer/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.id, order.tableId));
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));
  res.json(
    GetCustomerOrderResponse.parse(
      serializeOrder(order, table?.label ?? "Table", items),
    ),
  );
});

router.post(
  "/customer/orders/:id/call-waiter",
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(String(raw), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const [table] = await db
      .select()
      .from(restaurantTablesTable)
      .where(eq(restaurantTablesTable.id, order.tableId));
    await db.insert(alertsTable).values({
      type: "waiter_call",
      title: "Waiter requested",
      message: `${table?.label ?? "A table"} is requesting a waiter.`,
      tableId: order.tableId,
      orderId: order.id,
    });
    res.json(CallWaiterResponse.parse({ ok: true }));
  },
);

router.post("/customer/orders/:id/pay", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = PayOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { method, tip } = parsed.data;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const subtotal = Number(order.subtotal);
  const tax = Number(order.tax);
  const total = Math.round((subtotal + tax + tip) * 100) / 100;
  const [updated] = await db
    .update(ordersTable)
    .set({
      status: "paid",
      paymentMethod: method,
      tip: String(tip),
      total: String(total),
      paidAt: new Date(),
    })
    .where(eq(ordersTable.id, id))
    .returning();
  // Mark table for cleaning if no other open orders
  const openOrders = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.tableId, order.tableId),
        eq(ordersTable.status, "preparing"),
      ),
    );
  if (openOrders.length === 0) {
    await db
      .update(restaurantTablesTable)
      .set({ status: "cleaning" })
      .where(eq(restaurantTablesTable.id, order.tableId));
  }
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.id, order.tableId));
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id));
  res.json(
    PayOrderResponse.parse(
      serializeOrder(updated, table?.label ?? "Table", items),
    ),
  );
});

export default router;
