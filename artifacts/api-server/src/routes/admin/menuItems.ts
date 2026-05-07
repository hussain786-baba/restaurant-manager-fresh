import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable, categoriesTable } from "@workspace/db";
import {
  CreateMenuItemBody,
  UpdateMenuItemBody,
  ListMenuItemsResponse,
  UpdateMenuItemResponse,
} from "@workspace/api-zod";
import { serializeMenuItem } from "../../lib/serializers";

const router: IRouter = Router();

router.get("/admin/menu-items", async (_req, res): Promise<void> => {
  const rows = await db.select().from(menuItemsTable).orderBy(menuItemsTable.id);
  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  res.json(
    ListMenuItemsResponse.parse(
      rows.map((r) => serializeMenuItem(r, catMap.get(r.categoryId) ?? null)),
    ),
  );
});

router.post("/admin/menu-items", async (req, res): Promise<void> => {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [row] = await db
    .insert(menuItemsTable)
    .values({
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      price: String(d.price),
      imageEmoji: d.imageEmoji ?? null,
      isVeg: d.isVeg,
      isAvailable: d.isAvailable ?? true,
      isBestseller: d.isBestseller ?? false,
      prepTimeMinutes: d.prepTimeMinutes ?? 15,
      includes: d.includes ?? [],
    })
    .returning();
  const [cat] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, row.categoryId));
  res.status(201).json(serializeMenuItem(row, cat?.name ?? null));
});

router.patch("/admin/menu-items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [row] = await db
    .update(menuItemsTable)
    .set({
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      price: String(d.price),
      imageEmoji: d.imageEmoji ?? null,
      isVeg: d.isVeg,
      isAvailable: d.isAvailable ?? true,
      isBestseller: d.isBestseller ?? false,
      prepTimeMinutes: d.prepTimeMinutes ?? 15,
      includes: d.includes ?? [],
    })
    .where(eq(menuItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  const [cat] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, row.categoryId));
  res.json(
    UpdateMenuItemResponse.parse(serializeMenuItem(row, cat?.name ?? null)),
  );
});

router.delete("/admin/menu-items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .delete(menuItemsTable)
    .where(eq(menuItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
