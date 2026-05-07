import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import {
  CreateStaffBody,
  UpdateStaffBody,
  ListStaffResponse,
  UpdateStaffResponse,
} from "@workspace/api-zod";
import { serializeStaff } from "../../lib/serializers";
import { hashPassword, requireSuperAdmin } from "../../lib/auth";

const router: IRouter = Router();

router.get("/admin/staff", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(staffUsersTable)
    .orderBy(staffUsersTable.id);
  res.json(ListStaffResponse.parse(rows.map(serializeStaff)));
});

router.post(
  "/admin/staff",
  requireSuperAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateStaffBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { email, password, name, role } = parsed.data;
    const lower = email.toLowerCase();
    const existing = await db
      .select()
      .from(staffUsersTable)
      .where(eq(staffUsersTable.email, lower));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [row] = await db
      .insert(staffUsersTable)
      .values({ email: lower, passwordHash, name, role })
      .returning();
    res.status(201).json(serializeStaff(row));
  },
);

router.patch(
  "/admin/staff/:id",
  requireSuperAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(String(raw), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateStaffBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { name, role, password } = parsed.data;
    const updates: Record<string, unknown> = { name, role };
    if (password) {
      updates.passwordHash = await hashPassword(password);
    }
    const [row] = await db
      .update(staffUsersTable)
      .set(updates)
      .where(eq(staffUsersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Staff user not found" });
      return;
    }
    res.json(UpdateStaffResponse.parse(serializeStaff(row)));
  },
);

router.delete(
  "/admin/staff/:id",
  requireSuperAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(String(raw), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .delete(staffUsersTable)
      .where(eq(staffUsersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Staff user not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
