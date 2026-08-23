import type { MouseAction, MouseButton, MouseEvent } from './types.js'

// SGR mouse protocol (enabled via `\x1b[?1006h`): ESC [ < Cb ; Cx ; Cy M/m
// Cb encodes button + modifiers, M = press/wheel, m = release.
const SGR_MOUSE_PATTERN = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g

const SHIFT_BIT = 4
const META_BIT = 8
const CTRL_BIT = 16
const DRAG_BIT = 32
const WHEEL_UP = 64
const WHEEL_DOWN = 65

function decodeButton(cb: number, isRelease: boolean): { button: MouseButton; action: MouseAction } {
  const base = cb & ~(SHIFT_BIT | META_BIT | CTRL_BIT)
  const isDrag = (base & DRAG_BIT) !== 0
  const code = base & ~DRAG_BIT

  if (code === WHEEL_UP) return { button: 'wheel-up', action: 'wheel' }
  if (code === WHEEL_DOWN) return { button: 'wheel-down', action: 'wheel' }

  const button: MouseButton = code === 0 ? 'left' : code === 1 ? 'middle' : code === 2 ? 'right' : 'unknown'
  if (isRelease) return { button, action: 'release' }
  return { button, action: isDrag ? 'drag' : 'press' }
}

/** Parses every complete SGR mouse escape sequence found in a raw stdin chunk. */
export function parseMouseEvents(chunk: string): MouseEvent[] {
  const events: MouseEvent[] = []
  SGR_MOUSE_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = SGR_MOUSE_PATTERN.exec(chunk)) !== null) {
    const [, cbStr, xStr, yStr, final] = match
    const cb = Number(cbStr)
    const { button, action } = decodeButton(cb, final === 'm')

    events.push({
      x: Number(xStr),
      y: Number(yStr),
      button,
      action,
      shift: (cb & SHIFT_BIT) !== 0,
      meta: (cb & META_BIT) !== 0,
      ctrl: (cb & CTRL_BIT) !== 0,
    })
  }

  return events
}
