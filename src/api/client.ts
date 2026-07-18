import type { Profile, ResearchResult, Stats, User } from "../types";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  me: () => request<{ user: User | null }>("/api/me"),

  register: (username: string, password: string) =>
    request<{ user: User }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<{ user: User }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: boolean }>("/api/logout", { method: "POST" }),

  research: (chords: string[]) =>
    request<ResearchResult>("/api/research", {
      method: "POST",
      body: JSON.stringify({ chords }),
    }),

  stats: () => request<Stats>("/api/stats"),

  profile: (username: string) => request<Profile>(`/api/profile/${username}`),

  favorite: (progressionId: number, favorite: boolean) =>
    request<{ ok: boolean }>("/api/favorite", {
      method: "POST",
      body: JSON.stringify({ progression_id: progressionId, favorite }),
    }),
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function chordLabel(chords: string[]): string {
  return chords.join(" – ");
}
