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
