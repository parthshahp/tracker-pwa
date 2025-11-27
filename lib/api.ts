import { CreateEntryPayload, UpdateEntryPayload } from "@/db/ops";
const DEFAULT_BASE_URL = "http://localhost:8787";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_HOST ?? process.env.API_HOST ?? DEFAULT_BASE_URL;

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const API_ENDPOINTS = {
  tags: buildApiUrl("/api/tags"),
  timeEntries: buildApiUrl("/api/time-entries"),
} as const;

export async function apiCreateTimeEntry(body: CreateEntryPayload) {
  const res = await fetch(API_ENDPOINTS.timeEntries, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Create failed: ${res.status}`);
  }

  return res.json().catch(() => undefined);
}

export async function apiUpdateTimeEntry(id: string, body: UpdateEntryPayload) {
  const res = await fetch(`${API_ENDPOINTS.timeEntries}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Stop failed: ${res.status}`);
  }

  return res.json().catch(() => undefined);
}

export async function apiSoftDeleteTimeEntry(id: string) {
  const res = await fetch(`${API_ENDPOINTS.timeEntries}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Delete failed: ${res.status}`);
  }

  return res.json().catch(() => undefined);
}
