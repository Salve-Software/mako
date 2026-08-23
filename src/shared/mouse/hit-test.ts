import type { AbsoluteLayout } from './get-absolute-layout.js'

export interface RelativePoint {
  /** 0-based column within the rect. */
  relX: number
  /** 0-based row within the rect. */
  relY: number
}

/**
 * Converts a 1-based SGR mouse coordinate into a 0-based point relative to
 * `rect`'s top-left corner, or `null` when the point falls outside it.
 */
export function relativePoint(rect: AbsoluteLayout, x: number, y: number): RelativePoint | null {
  const relX = x - 1 - rect.left
  const relY = y - 1 - rect.top
  if (relX < 0 || relX >= rect.width || relY < 0 || relY >= rect.height) return null
  return { relX, relY }
}
