import type { CSSProperties } from "react"

export const DEFAULT_TAG_COLOR = "#6b7280"

export function normalizeHexColor(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`
  }

  return null
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHexColor(hex)
  if (!normalized) return null

  const value = normalized.slice(1)
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)

  if ([r, g, b].some(Number.isNaN)) return null
  return [r, g, b]
}

export function getTagBadgeStyles(color?: string | null): CSSProperties {
  const normalized = normalizeHexColor(color) ?? DEFAULT_TAG_COLOR
  const rgb = hexToRgb(normalized)
  const background =
    rgb != null ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.18)` : "rgba(255,255,255,0.1)"

  return {
    borderColor: normalized,
    backgroundColor: background,
    color: "#fff",
  }
}
