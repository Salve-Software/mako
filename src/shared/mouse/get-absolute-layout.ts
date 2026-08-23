import type { DOMElement } from 'ink'

export interface AbsoluteLayout {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Ink's `measureElement()`/`useBoxMetrics()` only report a box's size and its
 * offset from its *parent* — there is no public API for a box's position
 * relative to the terminal. `DOMElement` does expose `parentNode` and
 * `yogaNode` though, so we walk the ancestor chain ourselves and accumulate
 * each level's computed offset to get an absolute (0-based) position.
 *
 * Returns `null` before the first layout pass (or once the node detaches),
 * mirroring `measureElement()`'s `{width: 0, height: 0}` "not measured yet"
 * convention but as an explicit `null` so callers can't accidentally hit-test
 * against a bogus (0,0) rect.
 */
export function getAbsoluteLayout(node: DOMElement | null | undefined): AbsoluteLayout | null {
  if (!node) return null

  let left = 0
  let top = 0
  let width = 0
  let height = 0
  let current: DOMElement | undefined = node
  let isSelf = true

  while (current) {
    const layout = current.yogaNode?.getComputedLayout()
    if (!layout) return null

    if (isSelf) {
      width = layout.width
      height = layout.height
      isSelf = false
    }

    left += layout.left
    top += layout.top
    current = current.parentNode
  }

  return { left, top, width, height }
}
