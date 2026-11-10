import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./session";
import type { Role } from "./constants";

export type Staff = { id: string; email: string; name: string; role: Role };

/** The signed-in staff member, re-checked against the database (so deactivation is immediate). */
export async function getStaff(): Promise<Staff | null> {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || !user.active) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

/** Use at the top of every admin page and server action. */
export async function requireStaff(role?: Role): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (role === "ADMIN" && staff.role !== "ADMIN") redirect("/admin?error=forbidden");
  return staff;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

// Simple in-memory login throttle: 8 failed attempts per email+IP per 15 minutes.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 15 * 60 * 1000;
export function tooManyAttempts(key: string) {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW) {
    attempts.delete(key);
    return false;
  }
  return a.count >= 8;
}
function recordFailure(key: string) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW) attempts.set(key, { count: 1, first: Date.now() });
  else a.count++;
}

export async function login(email: string, password: string, ip: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = `${email.toLowerCase()}|${ip}`;
  if (tooManyAttempts(key)) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Always run bcrypt so timing does not reveal whether the account exists.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
  if (!user || !ok || !user.active) {
    recordFailure(key);
    return { ok: false, error: "Incorrect email or password." };
  }
  attempts.delete(key);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await signSession({ uid: user.id, role: user.role, name: user.name });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIES,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
