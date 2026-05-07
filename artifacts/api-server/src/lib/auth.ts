import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { db, staffUsersTable, type StaffUserRow } from "@workspace/db";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "dineflow_session";
const SECRET = process.env.SESSION_SECRET ?? "dineflow-dev-secret";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

function makeToken(userId: number): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function readToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userIdStr, ts, sig] = parts;
  if (sign(`${userIdStr}.${ts}`) !== sig) return null;
  const userId = Number(userIdStr);
  if (!Number.isFinite(userId)) return null;
  return userId;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidate, "hex"),
      Buffer.from(hash, "hex"),
    );
  } catch {
    return false;
  }
}

export function setSessionCookie(res: Response, userId: number): void {
  const token = makeToken(userId);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

declare module "express" {
  interface Request {
    user?: StaffUserRow;
  }
}

export async function loadUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    next();
    return;
  }
  const userId = readToken(token);
  if (!userId) {
    next();
    return;
  }
  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.id, userId));
  if (user) {
    req.user = user;
  }
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "super_admin") {
    res.status(403).json({ error: "Super admin only" });
    return;
  }
  next();
}
