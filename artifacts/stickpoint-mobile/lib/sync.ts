import { apiFetch } from './api';

/**
 * Snapshot sync against the API. The server is the source of truth once a
 * student signs in; conflicts resolve last-write-wins, and a 409 hands the
 * newer server copy back so the client can adopt it.
 */

export interface PulledState {
  state: Record<string, unknown>;
  updatedAt: number;
}

export async function pullState(): Promise<PulledState | 'empty' | null> {
  try {
    const res = await apiFetch('/sync');
    if (res.status === 404) return 'empty';
    if (!res.ok) return null;
    return (await res.json()) as PulledState;
  } catch {
    return null;
  }
}

export type PushResult =
  | { ok: true; updatedAt: number }
  | { ok: false; conflict?: PulledState };

export async function pushState(
  state: Record<string, unknown>,
  clientUpdatedAt: number,
): Promise<PushResult> {
  try {
    const res = await apiFetch('/sync', {
      method: 'PUT',
      body: JSON.stringify({ state, clientUpdatedAt }),
    });
    if (res.status === 409) {
      const body = (await res.json()) as { state: Record<string, unknown>; updatedAt: number };
      return { ok: false, conflict: { state: body.state, updatedAt: body.updatedAt } };
    }
    if (!res.ok) return { ok: false };
    const body = (await res.json()) as { updatedAt: number };
    return { ok: true, updatedAt: body.updatedAt };
  } catch {
    return { ok: false };
  }
}

/** Fire-and-forget product analytics. Never blocks or throws. */
export function postEvent(name: string, method?: string, props?: Record<string, unknown>): void {
  apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify({ name, ...(method ? { method } : {}), ...(props ? { props } : {}) }),
  }).catch(() => {});
}

export async function exportAccountData(): Promise<string | null> {
  try {
    const res = await apiFetch('/account/export');
    if (!res.ok) return null;
    return JSON.stringify(await res.json(), null, 2);
  } catch {
    return null;
  }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    const res = await apiFetch('/account/delete', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
