import { EventEmitter } from 'node:events'
import type { MouseEvent } from './types.js'

const EVENT = 'mouse'
const DEBUG = process.env.SALVETRON_MOUSE_DEBUG === '1'

const emitter = new EventEmitter()
// Many components (list rows, filter chips, tabs) subscribe at once.
emitter.setMaxListeners(0)

export const mouseBus = {
  publish(event: MouseEvent): void {
    if (DEBUG) {
      process.stderr.write(`[mouse] ${event.action} ${event.button} x=${event.x} y=${event.y}\n`)
    }
    emitter.emit(EVENT, event)
  },
  subscribe(listener: (event: MouseEvent) => void): () => void {
    emitter.on(EVENT, listener)
    return () => emitter.off(EVENT, listener)
  },
}
