import type { DOMElement } from 'ink'
import { useEffect, useRef } from 'react'
import { mouseBus } from '../mouse/mouse-bus.js'
import { getAbsoluteLayout } from '../mouse/get-absolute-layout.js'
import { relativePoint } from '../mouse/hit-test.js'
import type { MouseEvent } from '../mouse/types.js'

interface UseClickableOptions {
  isActive?: boolean
}

/**
 * Returns a ref to attach to a `<Box>`. Fires `onClick` when a left-button
 * press lands inside that box's current absolute bounds.
 */
export function useClickable(onClick: (event: MouseEvent) => void, { isActive = true }: UseClickableOptions = {}) {
  const ref = useRef<DOMElement | null>(null)
  const handlerRef = useRef(onClick)
  handlerRef.current = onClick

  useEffect(() => {
    if (!isActive) return
    return mouseBus.subscribe((event) => {
      if (event.action !== 'press' || event.button !== 'left') return
      const layout = getAbsoluteLayout(ref.current)
      if (!layout || !relativePoint(layout, event.x, event.y)) return
      handlerRef.current(event)
    })
  }, [isActive])

  return ref
}
