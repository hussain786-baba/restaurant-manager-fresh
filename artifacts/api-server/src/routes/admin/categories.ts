import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  ListCategoriesResponse,
  UpdateCategoryResponse,
} from "@workspace/api-zod";
import { serializeCategory } from "../../lib/serializers";

const router: IRouter = Router();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || `cat-${Date.now()}`;
}

router.get("/admin/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.sortOrder, categoriesTable.id);
  res.json(ListCategoriesResponse.parse(rows.map(serializeCategory)));
});

router.post("/admin/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, sortOrder } = parsed.data;
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 2;
  while (
    (await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug)))
      .length > 0
  ) {
    slug = `${baseSlug}-${i++}`;
  }
  const [row] = await db
    .insert(categoriesTable)
    .values({
      name,
      description: description ?? null,
      slug,
      sortOrder: sortOrder ?? 0,
    })
    .returning();
  res.status(201).json(serializeCategory(row));
});

router.patch("/admin/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, sortOrder } = parsed.data;
  const [row] = await db
    .update(categoriesTable)
    .set({
      name,
      description: description ?? null,
      sortOrder: sortOrder ?? 0,
    })
    .where(eq(categoriesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(UpdateCategoryResponse.parse(serializeCategory(row)));
});

router.delete("/admin/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
