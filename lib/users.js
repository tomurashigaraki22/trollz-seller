import "server-only";

import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

const BCRYPT_PREFIX = /^\$2[aby]\$/;

function isBcryptHash(value) {
  return typeof value === "string" && BCRYPT_PREFIX.test(value);
}

export async function findUserByEmail(email) {
  const rows = await query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [String(email || "").trim()]
  );
  return rows[0] ?? null;
}

export async function verifyAndMigratePassword(user, password) {
  if (!user || typeof password !== "string") return false;
  if (isBcryptHash(user.password)) return bcrypt.compare(password, user.password);

  const matches = user.password === password;
  if (matches) {
    const hash = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
  }
  return matches;
}
