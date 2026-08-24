import type { Request, Response, NextFunction } from "express";

/**
 * Supabase-backed bearer auth. We verify tokens by asking Supabase Auth
 * itself (GET /auth/v1/user) rather than verifying JWT signatures locally:
 * it works regardless of the project's signing configuration and never
 * puts key material in this codebase. Verified results are cached briefly.
 *
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY. When they're unset, auth is
 * "not configured": requireAuth answers 503 and optionalAuth passes through
 * anonymously — the app degrades to local-only mode.
 */

export interface AuthedUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const cache = new Map<string, { user: AuthedUser; expires: number }>();
const CACHE_TTL_MS = 60_000;

export function authConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

async function verifyToken(token: string): Promise<AuthedUser | null> {
  const hit = cache.get(token);
  if (hit && hit.expires > Date.now()) return hit.user;

  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string; email?: string };
    if (!data.id) return null;
    const user = { id: data.id, email: data.email || "" };
    cache.set(token, { user, expires: Date.now() + CACHE_TTL_MS });
    // Bound the cache: drop the oldest entries past 5000 tokens.
    if (cache.size > 5000) {
      for (const key of cache.keys()) {
        cache.delete(key);
        if (cache.size <= 4000) break;
      }
    }
    return user;
  } catch {
    return null;
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

/** Attaches req.user when a valid token is present; never blocks. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = bearerToken(req);
  if (token && authConfigured()) {
    const user = await verifyToken(token);
    if (user) req.user = user;
  }
  next();
}

/** Blocks without a valid token; 503 when auth isn't configured at all. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!authConfigured()) {
    res.status(503).json({ error: "Accounts are not configured on this server" });
    return;
  }
  const token = bearerToken(req);
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    res.status(401).json({ error: "Sign in to use this" });
    return;
  }
  req.user = user;
  next();
}
