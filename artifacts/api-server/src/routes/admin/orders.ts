import { Router, type IRouter } from "express";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderItemsTable,
  restaurantTablesTable,
} from "@workspace/db";
import {
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  GetAdminOrderResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { serializeOrder } from "../../lib/serializers";

const router: IRouter = Router();

router.get("/admin/orders", async (req, res): Promise<void> => {
  const parsed = ListAdminOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search } = parsed.data;
  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(ordersTable.status, status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(ordersTable.code, `%${search}%`),
        ilike(ordersTable.guestName, `%${search}%`),
      )!,
    );
  }
  const rows = await db
    .select()
    .from(ordersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(200);

  const tables = await db.select().from(restaurantTablesTable);
  const tableMap = new Map(tables.map((t) => [t.id, t.label]));

  const result = [];
  for (const o of rows) {
    const its = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, o.id));
    result.push(serializeOrder(o, tableMap.get(o.tableId) ?? "Table", its));
  }
  res.json(ListAdminOrdersResponse.parse(result));
});

router.get("/admin/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
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
    GetAdminOrderResponse.parse(
      serializeOrder(order, table?.label ?? "Table", items),
    ),
  );
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status } = parsed.data;
  const [row] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (status === "paid") {
    await db
      .update(ordersTable)
      .set({ paidAt: new Date() })
      .where(eq(ordersTable.id, id));
  }
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.id, row.tableId));
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, row.id));
  res.json(
    UpdateOrderStatusResponse.parse(
      serializeOrder(row, table?.label ?? "Table", items),
    ),
  );
  void sql;
});

export default router;
