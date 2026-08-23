import type { DOMElement } from 'ink'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { mouseBus } from '../mouse/mouse-bus.js'
import { getAbsoluteLayout } from '../mouse/get-absolute-layout.js'
import { relativePoint } from '../mouse/hit-test.js'

interface UseMouseWheelOptions {
  isActive?: boolean
  /** Restricts scroll handling to wheel events over this box; omit for global. */
  ref?: RefObject<DOMElement | null>
}

/** Fires `onScroll('up' | 'down')` for wheel events, optionally scoped to `ref`'s bounds. */
export function useMouseWheel(onScroll: (direction: 'up' | 'down') => void, { isActive = true, ref }: UseMouseWheelOptions = {}) {
  const handlerRef = useRef(onScroll)
  handlerRef.current = onScroll

  useEffect(() => {
    if (!isActive) return
    return mouseBus.subscribe((event) => {
      if (event.action !== 'wheel') return
      if (ref) {
        const layout = getAbsoluteLayout(ref.current)
        if (!layout || !relativePoint(layout, event.x, event.y)) return
      }
      handlerRef.current(event.button === 'wheel-up' ? 'up' : 'down')
    })
  }, [isActive, ref])
}
