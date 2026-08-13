import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Readable, Writable } from 'node:stream'
import { render, Box, Text } from 'ink'
import type { Instance } from 'ink'
import { createElement, createRef } from 'react'
import type { DOMElement } from 'ink'
import { useClickable } from '../use-clickable.js'
import { useListNavigation } from '../use-list-navigation.js'
import type { UseListNavigationResult } from '../use-list-navigation.js'
import { mouseBus } from '../../mouse/mouse-bus.js'
import { getAbsoluteLayout } from '../../mouse/get-absolute-layout.js'

// Headless Ink render harness: a real terminal-sized yoga layout, no PTY.
function mountHeadless(node: Parameters<typeof render>[0]) {
  const stdout = new Writable({ write(_chunk, _enc, cb) { cb() } }) as NodeJS.WriteStream
  Object.assign(stdout, { columns: 80, rows: 24, isTTY: true })
  const stdin = new Readable({ read() {} }) as NodeJS.ReadStream
  Object.assign(stdin, { isTTY: true, setRawMode() {}, setEncoding() {}, ref() {}, unref() {} })
  return render(node, { stdout, stdin, patchConsole: false })
}

// Ink commits layout via react-reconciler + yoga asynchronously after mount,
// with no exposed hook to await "layout has settled" — a real wall-clock
// wait is the only way to let that scheduling complete in this harness.
// (`Promise.withResolvers` needs ES2024 lib; the project targets ES2022.)
async function settle() {
  await new Promise<void>((resolve) => setTimeout(resolve, 30))
}

let instance: Instance | undefined

afterEach(() => {
  instance?.unmount()
  instance = undefined
})

describe('mouse integration (real yoga layout)', () => {
  it('useClickable fires only when a press lands inside the box\'s absolute bounds', async () => {
    let clicks = 0
    const ref = createRef<DOMElement>()

    function Target() {
      const clickRef = useClickable(() => { clicks++ })
      return createElement(Box, { ref: (node: DOMElement | null) => {
        clickRef.current = node
        ref.current = node
      } }, createElement(Text, null, 'Click me'))
    }

    instance = mountHeadless(createElement(Box, { flexDirection: 'column', paddingTop: 2, paddingLeft: 3 },
      createElement(Target)))
    await settle()

    const layout = getAbsoluteLayout(ref.current)
    assert.ok(layout, 'expected the target box to be measured')

    // A press outside the box must not fire.
    mouseBus.publish({ x: 1, y: 1, button: 'left', action: 'press', shift: false, meta: false, ctrl: false })
    assert.equal(clicks, 0)

    // A press on the box's top-left cell (1-based SGR coordinates) must fire.
    mouseBus.publish({ x: layout!.left + 1, y: layout!.top + 1, button: 'left', action: 'press', shift: false, meta: false, ctrl: false })
    assert.equal(clicks, 1)

    // A right-click on the same cell must not fire (left-button only).
    mouseBus.publish({ x: layout!.left + 1, y: layout!.top + 1, button: 'right', action: 'press', shift: false, meta: false, ctrl: false })
    assert.equal(clicks, 1)
  })

  it('useListNavigation selects the clicked row and scrolls on wheel, accounting for a header row', async () => {
    const COUNT = 20
    const VISIBLE = 5
    let hook: UseListNavigationResult | undefined

    function List() {
      hook = useListNavigation({ count: COUNT, visibleRows: VISIBLE, headerRows: 1 })
      const visible = Array.from({ length: VISIBLE }, (_, i) => hook!.scrollOffset + i)
      return createElement(Box, { ref: hook.listRef, flexDirection: 'column' },
        createElement(Text, null, 'header'),
        ...visible.map((i) => createElement(Text, { key: i }, `row ${i}`)),
      )
    }

    instance = mountHeadless(createElement(List))
    await settle()

    assert.ok(hook)
    // New lists pin to the latest item: selection starts on the last row.
    assert.equal(hook!.selectedIndex, COUNT - 1)

    const layout = getAbsoluteLayout(hook!.listRef.current)
    assert.ok(layout)

    // Click the 3rd visible data row (0-based: header occupies row 0).
    const clickY = layout!.top + 1 /* header */ + 2 /* 0-based data row */ + 1 /* 1-based SGR */
    mouseBus.publish({ x: layout!.left + 1, y: clickY, button: 'left', action: 'press', shift: false, meta: false, ctrl: false })
    await settle()
    assert.equal(hook!.selectedIndex, hook!.scrollOffset + 2)

    const selectedAfterClick = hook!.selectedIndex

    // Wheel up over the list moves the selection up by one, same as the up arrow.
    mouseBus.publish({ x: layout!.left + 1, y: layout!.top + 1, button: 'wheel-up', action: 'wheel', shift: false, meta: false, ctrl: false })
    await settle()
    assert.equal(hook!.selectedIndex, selectedAfterClick - 1)
  })

  it('useListNavigation fires onRowClick with the clicked row index, but not on wheel or out-of-bounds clicks', async () => {
    const COUNT = 10
    const VISIBLE = 5
    const clickedIndexes: number[] = []
    let hook: UseListNavigationResult | undefined

    function List() {
      hook = useListNavigation({
        count: COUNT,
        visibleRows: VISIBLE,
        headerRows: 1,
        onRowClick: (index) => clickedIndexes.push(index),
      })
      const visible = Array.from({ length: VISIBLE }, (_, i) => hook!.scrollOffset + i)
      return createElement(Box, { ref: hook.listRef, flexDirection: 'column' },
        createElement(Text, null, 'header'),
        ...visible.map((i) => createElement(Text, { key: i }, `row ${i}`)),
      )
    }

    instance = mountHeadless(createElement(List))
    await settle()

    const layout = getAbsoluteLayout(hook!.listRef.current)
    assert.ok(layout)

    // Click the 2nd visible data row (0-based: header occupies row 0).
    const rowY = layout!.top + 1 /* header */ + 1 /* 0-based data row */ + 1 /* 1-based SGR */
    mouseBus.publish({ x: layout!.left + 1, y: rowY, button: 'left', action: 'press', shift: false, meta: false, ctrl: false })
    await settle()
    assert.deepEqual(clickedIndexes, [hook!.scrollOffset + 1])

    // A wheel event over the same list must select but never call onRowClick.
    mouseBus.publish({ x: layout!.left + 1, y: layout!.top + 1, button: 'wheel-up', action: 'wheel', shift: false, meta: false, ctrl: false })
    await settle()
    assert.equal(clickedIndexes.length, 1)

    // A press landing on the header row itself (not a data row) must not fire.
    mouseBus.publish({ x: layout!.left + 1, y: layout!.top + 1, button: 'left', action: 'press', shift: false, meta: false, ctrl: false })
    await settle()
    assert.equal(clickedIndexes.length, 1)
  })
})
