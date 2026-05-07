import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderItemsTable,
  restaurantTablesTable,
  alertsTable,
  menuItemsTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardRevenueQueryParams,
  GetDashboardRevenueResponse,
  GetTablesOverviewResponse,
  GetDashboardAlertsResponse,
  DismissAlertResponse,
  GetEarningsBreakdownResponse,
  GetTopItemsResponse,
} from "@workspace/api-zod";
import { serializeOrder, serializeAlert } from "../../lib/serializers";
import { computeOrderTotals, generateOrderCode } from "../../lib/orderCalc";

const router: IRouter = Router();

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

router.get("/admin/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = startOfWeek(now);
  const monthAgo = startOfMonth(now);

  const todayOrders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, today));
  const weekOrders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, weekAgo));
  const monthOrders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, monthAgo));

  const tables = await db.select().from(restaurantTablesTable);
  const activeTables = tables.filter(
    (t) => t.status === "dining" || t.status === "seated" || t.status === "billing",
  ).length;

  const revenueToday = todayOrders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + Number(o.total), 0);
  const ordersTodayCount = todayOrders.length;
  const pending = todayOrders.filter(
    (o) => o.status === "placed" || o.status === "preparing" || o.status === "ready",
  ).length;
  const paid = todayOrders.filter((o) => o.status === "paid");
  const avg = paid.length
    ? paid.reduce((s, o) => s + Number(o.total), 0) / paid.length
    : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      revenueToday: Math.round(revenueToday * 100) / 100,
      ordersToday: ordersTodayCount,
      activeTables,
      totalTables: tables.length,
      avgOrderValue: Math.round(avg * 100) / 100,
      pendingOrders: pending,
      weekRevenue: Math.round(
        weekOrders
          .filter((o) => o.status === "paid")
          .reduce((s, o) => s + Number(o.total), 0) * 100,
      ) / 100,
      monthRevenue: Math.round(
        monthOrders
          .filter((o) => o.status === "paid")
          .reduce((s, o) => s + Number(o.total), 0) * 100,
      ) / 100,
    }),
  );
});

router.get("/admin/dashboard/revenue", async (req, res): Promise<void> => {
  const parsed = GetDashboardRevenueQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { period } = parsed.data;
  const now = new Date();
  const points: { label: string; revenue: number; orders: number; from: Date; to: Date }[] = [];

  if (period === "daily") {
    for (let i = 6; i >= 0; i--) {
      const d = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      points.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: 0,
        orders: 0,
        from: d,
        to: next,
      });
    }
  } else if (period === "weekly") {
    const thisWeek = startOfWeek(now);
    for (let i = 7; i >= 0; i--) {
      const from = new Date(thisWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
      points.push({
        label: `W${Math.ceil(((from.getTime() - new Date(from.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`,
        revenue: 0,
        orders: 0,
        from,
        to,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      points.push({
        label: from.toLocaleDateString("en-IN", { month: "short" }),
        revenue: 0,
        orders: 0,
        from,
        to,
      });
    }
  }

  const earliest = points[0].from;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, earliest));
  for (const o of orders) {
    const created = new Date(o.createdAt);
    for (const p of points) {
      if (created >= p.from && created < p.to) {
        if (o.status === "paid") {
          p.revenue += Number(o.total);
        }
        p.orders += 1;
        break;
      }
    }
  }

  res.json(
    GetDashboardRevenueResponse.parse(
      points.map((p) => ({
        label: p.label,
        revenue: Math.round(p.revenue * 100) / 100,
        orders: p.orders,
      })),
    ),
  );
});

router.get(
  "/admin/dashboard/tables-overview",
  async (_req, res): Promise<void> => {
    const tables = await db
      .select()
      .from(restaurantTablesTable)
      .orderBy(restaurantTablesTable.id);
    const result = [];
    for (const t of tables) {
      const open = await db
        .select()
        .from(ordersTable)
        .where(
          and(
            eq(ordersTable.tableId, t.id),
            inArray(ordersTable.status, [
              "placed",
              "preparing",
              "ready",
              "served",
            ]),
          ),
        )
        .orderBy(desc(ordersTable.createdAt))
        .limit(1);
      const active = open[0];
      result.push({
        id: t.id,
        label: t.label,
        code: t.code,
        status: t.status,
        capacity: t.capacity,
        activeOrderId: active?.id ?? null,
        activeOrderTotal: active ? Number(active.total) : null,
        guestCount: active?.guestCount ?? null,
      });
    }
    res.json(GetTablesOverviewResponse.parse(result));
  },
);

router.get("/admin/dashboard/alerts", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.dismissed, false))
    .orderBy(desc(alertsTable.createdAt))
    .limit(50);
  const tables = await db.select().from(restaurantTablesTable);
  const tableMap = new Map(tables.map((t) => [t.id, t.label]));
  res.json(
    GetDashboardAlertsResponse.parse(
      rows.map((r) =>
        serializeAlert(r, r.tableId ? tableMap.get(r.tableId) ?? null : null),
      ),
    ),
  );
});

router.post(
  "/admin/dashboard/alerts/:id/dismiss",
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(String(raw), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db
      .update(alertsTable)
      .set({ dismissed: true })
      .where(eq(alertsTable.id, id));
    res.json(DismissAlertResponse.parse({ ok: true }));
  },
);

router.get("/admin/dashboard/earnings", async (_req, res): Promise<void> => {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = startOfWeek(now);
  const lastWeek = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = startOfMonth(now);
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);

  async function sum(from: Date, to: Date | null): Promise<number> {
    const conds = [
      gte(ordersTable.createdAt, from),
      eq(ordersTable.status, "paid"),
    ];
    if (to) conds.push(lte(ordersTable.createdAt, to));
    const rows = await db
      .select()
      .from(ordersTable)
      .where(and(...conds));
    return Math.round(rows.reduce((s, r) => s + Number(r.total), 0) * 100) / 100;
  }

  res.json(
    GetEarningsBreakdownResponse.parse({
      today: await sum(today, null),
      yesterday: await sum(yesterday, today),
      thisWeek: await sum(thisWeek, null),
      lastWeek: await sum(lastWeek, thisWeek),
      thisMonth: await sum(thisMonth, null),
      lastMonth: await sum(lastMonth, thisMonth),
    }),
  );
});

router.get("/admin/dashboard/top-items", async (_req, res): Promise<void> => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      menuItemId: orderItemsTable.menuItemId,
      name: orderItemsTable.name,
      imageEmoji: orderItemsTable.imageEmoji,
      totalSold: sql<number>`SUM(${orderItemsTable.quantity})`.as("total_sold"),
      revenue: sql<number>`SUM(${orderItemsTable.lineTotal})`.as("revenue"),
    })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(gte(ordersTable.createdAt, since))
    .groupBy(
      orderItemsTable.menuItemId,
      orderItemsTable.name,
      orderItemsTable.imageEmoji,
    )
    .orderBy(desc(sql`SUM(${orderItemsTable.quantity})`))
    .limit(8);
  res.json(
    GetTopItemsResponse.parse(
      rows.map((r) => ({
        menuItemId: r.menuItemId,
        name: r.name,
        imageEmoji: r.imageEmoji,
        totalSold: Number(r.totalSold),
        revenue: Number(r.revenue),
      })),
    ),
  );
});

router.post(
  "/admin/dashboard/simulate-order",
  async (_req, res): Promise<void> => {
    // Pick a random available table
    const tables = await db.select().from(restaurantTablesTable);
    const table = tables[Math.floor(Math.random() * tables.length)];
    const items = await db.select().from(menuItemsTable);
    const picks = [
      items[Math.floor(Math.random() * items.length)],
      items[Math.floor(Math.random() * items.length)],
    ].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
    const lineItems = picks.map((p) => ({
      unitPrice: Number(p.price),
      quantity: 1 + Math.floor(Math.random() * 2),
    }));
    const totals = computeOrderTotals(lineItems, 0);
    const [order] = await db
      .insert(ordersTable)
      .values({
        code: generateOrderCode(),
        tableId: table.id,
        sessionId: `sim-${Date.now()}`,
        status: "placed",
        guestName: "Demo Guest",
        guestCount: 2,
        subtotal: String(totals.subtotal),
        tax: String(totals.tax),
        tip: "0",
        total: String(totals.total),
      })
      .returning();
    const orderItems = await db
      .insert(orderItemsTable)
      .values(
        picks.map((p, i) => ({
          orderId: order.id,
          menuItemId: p.id,
          name: p.name,
          imageEmoji: p.imageEmoji,
          quantity: lineItems[i].quantity,
          unitPrice: String(p.price),
          lineTotal: String(Number(p.price) * lineItems[i].quantity),
          specialInstructions: null,
        })),
      )
      .returning();
    await db.insert(alertsTable).values({
      type: "new_order",
      title: "New order placed",
      message: `${table.label} placed order ${order.code}.`,
      tableId: table.id,
      orderId: order.id,
    });
    await db
      .update(restaurantTablesTable)
      .set({ status: "dining" })
      .where(eq(restaurantTablesTable.id, table.id));
    res.status(201).json(serializeOrder(order, table.label, orderItems));
  },
);

export default router;
