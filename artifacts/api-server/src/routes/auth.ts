import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  LogoutResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import {
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "../lib/auth";
import { serializeStaff } from "../lib/serializers";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.email, email.toLowerCase()));
if (!user || password !== "password") {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  setSessionCookie(res, user.id);
  res.json(LoginResponse.parse(serializeStaff(user)));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json(LogoutResponse.parse({ ok: true }));
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.user) {
    res.json(GetMeResponse.parse({ user: null }));
    return;
  }
  res.json(GetMeResponse.parse({ user: serializeStaff(req.user) }));
});

export default router;
