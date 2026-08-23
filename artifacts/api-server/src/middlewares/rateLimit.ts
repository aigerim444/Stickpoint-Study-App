import type { Request, Response, NextFunction } from "express";

/**
 * Minimal in-memory sliding-window rate limiter, per client IP.
 *
 * Deliberately dependency-free: this is a Phase-0 stopgap until real
 * accounts + per-user quotas land. On autoscale deployments each instance
 * keeps its own counters, so the effective limit is per-instance — still
 * enough to stop someone scripting the endpoint in a loop.
 */
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  // Periodically drop stale entries so the map can't grow unbounded.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - opts.windowMs;
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, opts.windowMs);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || "unknown";
    const cutoff = Date.now() - opts.windowMs;
    const times = (hits.get(key) || []).filter((t) => t > cutoff);

    if (times.length >= opts.max) {
      res
        .status(429)
        .json({ error: "Too many requests, please slow down." });
      return;
    }

    times.push(Date.now());
    hits.set(key, times);
    next();
  };
}
