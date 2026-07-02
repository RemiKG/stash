"use client";
// tiny client fetch helper + cookie reader
export async function api<T = unknown>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error((body.message as string) || (body.error as string) || res.statusText);
    (err as Error & { status?: number; body?: unknown }).status = res.status;
    (err as Error & { status?: number; body?: unknown }).body = body;
    throw err;
  }
  return body as T;
}

export function currentSlugClient(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/(?:^|; )stash_shop=([^;]+)/)?.[1] ?? null;
}

export function post<T = unknown>(url: string, data?: unknown) {
  return api<T>(url, { method: "POST", body: JSON.stringify(data ?? {}) });
}
export function put<T = unknown>(url: string, data?: unknown) {
  return api<T>(url, { method: "PUT", body: JSON.stringify(data ?? {}) });
}
