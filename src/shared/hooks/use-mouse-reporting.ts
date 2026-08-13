import { useStdin, useStdout } from 'ink'
import { useEffect } from 'react'
import { mouseBus } from '../mouse/mouse-bus.js'
import { parseMouseEvents } from '../mouse/parse-mouse-events.js'
import { disableMouseReporting, enableMouseReporting } from '../mouse/mouse-reporting.js'

// Mouse hit-testing maps 1-based SGR terminal coordinates directly onto
// 0-based yoga layout coordinates, which is only valid when Ink's root box
// starts at absolute terminal row 1. Neither plain rendering nor
// `alternateScreen: true` guarantees that on every terminal — some emulators
// (observed on Orca) leave the initial frame wherever the cursor already was
// (e.g. below prior shell output) instead of homing it, so row 1 in Ink's
// layout can silently be row 15+ on screen until something forces a
// clear+home. `use-terminal-size.ts` already does this on resize for a
// different reason (Ink's own line-erase math drifting); we do the same
// thing once up front so mouse coordinates are correct from the first frame.
const CLEAR_AND_HOME = '\x1b[2J\x1b[H'
let processExitHookInstalled = false
/**
 * Mount once at the app root. Enables SGR mouse reporting on the terminal,
 * decodes raw stdin mouse sequences, and republishes them on `mouseBus` for
 * any component to consume via `useClickable`/`useMouseWheel`.
 *
 * React's unmount cleanup handles the normal exit path (Ctrl+C via Ink's own
 * SIGINT handling unmounts the tree). An uncaught exception bypasses React
 * entirely though, so we also arm a process-level `exit` listener the first
 * time reporting is enabled — otherwise a crash leaves the user's terminal
 * emitting escape garbage on every mouse move after the app is gone.
 */
export function useMouseReporting(): void {
  const { stdin, isRawModeSupported } = useStdin()
  const { stdout } = useStdout()

  useEffect(() => {
    if (!stdin || !stdout || !isRawModeSupported || !stdout.isTTY) return

    enableMouseReporting(stdout)
    stdout.write(CLEAR_AND_HOME)
    if (!processExitHookInstalled) {
      processExitHookInstalled = true
      process.on('exit', () => disableMouseReporting(stdout))
    }

    const onData = (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
      if (!text.includes('\x1b[<')) return
      for (const event of parseMouseEvents(text)) mouseBus.publish(event)
    }

    stdin.on('data', onData)
    return () => {
      stdin.off('data', onData)
      disableMouseReporting(stdout)
    }
  }, [stdin, stdout, isRawModeSupported])
}
