import { useInput } from 'ink'
import type { DOMElement } from 'ink'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { mouseBus } from '../mouse/mouse-bus.js'
import { getAbsoluteLayout } from '../mouse/get-absolute-layout.js'
import { relativePoint } from '../mouse/hit-test.js'

interface UseListNavigationParams {
  count: number
  visibleRows: number
  isActive?: boolean
  /**
   * Gates the mouse click/wheel subscription independently of `isActive`.
   * Defaults to `isActive`. Dashboard panel sections pass this as "the
   * dashboard tab is active" (regardless of which panel is *focused*) so a
   * click can focus an unfocused panel and act on it in one gesture —
   * keyboard nav (arrows) still only responds while the panel is focused.
   */
  mouseActive?: boolean
  /** Rows occupied by a header above the data rows (e.g. a column title). */
  headerRows?: number
  /** Fired with the clicked row's absolute index when a data row is clicked. */
  onRowClick?: (index: number) => void
}

export interface UseListNavigationResult {
  selectedIndex: number
  scrollOffset: number
  listRef: RefObject<DOMElement | null>
}

export function useListNavigation({ count, visibleRows, isActive = true, mouseActive = isActive, headerRows = 0, onRowClick }: UseListNavigationParams): UseListNavigationResult {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const pinnedToLatestRef = useRef(true)
  const listRef = useRef<DOMElement | null>(null)
  const onRowClickRef = useRef(onRowClick)
  onRowClickRef.current = onRowClick

  // Follow the newest item as it arrives, unless the user scrolled away
  // from the bottom — then stay put until they navigate back down to it.
  useEffect(() => {
    if (count === 0) return
    if (pinnedToLatestRef.current) {
      const last = count - 1
      setSelectedIndex(last)
      setScrollOffset(Math.max(0, last - visibleRows + 1))
    } else if (selectedIndex > count - 1) {
      setSelectedIndex(Math.max(0, count - 1))
    }
  }, [count, visibleRows])

  const moveSelection = useCallback((delta: -1 | 1) => {
    setSelectedIndex((current) => {
      const next = delta < 0 ? Math.max(0, current - 1) : Math.min(count - 1, current + 1)
      pinnedToLatestRef.current = delta > 0 && next >= count - 1
      setScrollOffset((offset) => {
        if (next < offset) return next
        if (next >= offset + visibleRows) return next - visibleRows + 1
        return offset
      })
      return next
    })
  }, [count, visibleRows])

  useInput((_input, key) => {
    if (key.upArrow) moveSelection(-1)
    if (key.downArrow) moveSelection(1)
  }, { isActive })

  // Mouse: click a visible row to select it; wheel scrolls one row at a
  // time, reusing the same pin/scroll bookkeeping as the arrow keys.
  useEffect(() => {
    if (!mouseActive) return
    return mouseBus.subscribe((event) => {
      const layout = getAbsoluteLayout(listRef.current)
      if (!layout) return
      const hit = relativePoint(layout, event.x, event.y)
      if (!hit) return

      if (event.action === 'wheel') {
        moveSelection(event.button === 'wheel-up' ? -1 : 1)
        return
      }
      if (event.action !== 'press' || event.button !== 'left') return

      const dataRow = hit.relY - headerRows
      if (dataRow < 0) return
      const index = scrollOffset + dataRow
      if (index >= count) return
      pinnedToLatestRef.current = false
      setSelectedIndex(index)
      onRowClickRef.current?.(index)
    })
  }, [mouseActive, headerRows, scrollOffset, count, moveSelection])

  return { selectedIndex, scrollOffset, listRef }
}
