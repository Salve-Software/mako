import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseMouseEvents } from '../parse-mouse-events.js'

describe('parseMouseEvents', () => {
  it('decodes a left-button press', () => {
    const [event] = parseMouseEvents('\x1b[<0;12;5M')
    assert.deepEqual(event, {
      x: 12, y: 5, button: 'left', action: 'press', shift: false, meta: false, ctrl: false,
    })
  })

  it('decodes a release (lowercase final byte)', () => {
    const [event] = parseMouseEvents('\x1b[<0;12;5m')
    assert.equal(event?.action, 'release')
    assert.equal(event?.button, 'left')
  })

  it('decodes right and middle button presses', () => {
    const [right] = parseMouseEvents('\x1b[<2;1;1M')
    const [middle] = parseMouseEvents('\x1b[<1;1;1M')
    assert.equal(right?.button, 'right')
    assert.equal(middle?.button, 'middle')
  })

  it('decodes wheel up and wheel down as their own action, never a release', () => {
    const [up] = parseMouseEvents('\x1b[<64;3;3M')
    const [down] = parseMouseEvents('\x1b[<65;3;3m')
    assert.deepEqual(up, { x: 3, y: 3, button: 'wheel-up', action: 'wheel', shift: false, meta: false, ctrl: false })
    assert.deepEqual(down, { x: 3, y: 3, button: 'wheel-down', action: 'wheel', shift: false, meta: false, ctrl: false })
  })

  it('decodes modifier bits independently of the button', () => {
    // 0 (left) + 4 (shift) + 8 (meta) + 16 (ctrl) = 28
    const [event] = parseMouseEvents('\x1b[<28;7;9M')
    assert.equal(event?.button, 'left')
    assert.equal(event?.shift, true)
    assert.equal(event?.meta, true)
    assert.equal(event?.ctrl, true)
  })

  it('flags drag as its own action distinct from press', () => {
    // 0 (left) + 32 (motion) = 32
    const [event] = parseMouseEvents('\x1b[<32;10;10M')
    assert.equal(event?.action, 'drag')
    assert.equal(event?.button, 'left')
  })

  it('extracts every sequence from a chunk with mixed keyboard and mouse bytes', () => {
    const events = parseMouseEvents('a\x1b[<0;1;1Mb\x1b[<0;2;2mc')
    assert.equal(events.length, 2)
    assert.deepEqual(events.map((e) => [e.x, e.y, e.action]), [[1, 1, 'press'], [2, 2, 'release']])
  })

  it('returns no events for plain keyboard input', () => {
    assert.deepEqual(parseMouseEvents('hello\x1b[A'), [])
  })
})
