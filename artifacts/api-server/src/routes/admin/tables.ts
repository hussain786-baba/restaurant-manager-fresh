import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, restaurantTablesTable } from "@workspace/db";
import {
  CreateTableBody,
  UpdateTableBody,
  ListTablesResponse,
  UpdateTableResponse,
  MarkTableCleanResponse,
} from "@workspace/api-zod";
import { serializeTable } from "../../lib/serializers";

const router: IRouter = Router();

router.get("/admin/tables", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(restaurantTablesTable)
    .orderBy(restaurantTablesTable.id);
  res.json(ListTablesResponse.parse(rows.map(serializeTable)));
});

router.post("/admin/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, label, capacity, notes } = parsed.data;
  const codeUp = code.toUpperCase();
  const existing = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.code, codeUp));
  if (existing.length > 0) {
    res.status(400).json({ error: "Table code already exists" });
    return;
  }
  const [row] = await db
    .insert(restaurantTablesTable)
    .values({
      code: codeUp,
      label,
      capacity,
      notes: notes ?? null,
      status: "available",
    })
    .returning();
  res.status(201).json(serializeTable(row));
});

router.patch("/admin/tables/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, label, capacity, notes } = parsed.data;
  const [row] = await db
    .update(restaurantTablesTable)
    .set({
      code: code.toUpperCase(),
      label,
      capacity,
      notes: notes ?? null,
    })
    .where(eq(restaurantTablesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(UpdateTableResponse.parse(serializeTable(row)));
});

router.delete("/admin/tables/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .delete(restaurantTablesTable)
    .where(eq(restaurantTablesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/admin/tables/:id/mark-clean", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(restaurantTablesTable)
    .set({ status: "available" })
    .where(eq(restaurantTablesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(MarkTableCleanResponse.parse(serializeTable(row)));
});

export default router;
