// Normal tracking mode (button press/release + wheel, no motion) plus SGR
// extended coordinates. Deliberately omits `?1002h`/`?1003h` (drag/motion
// reporting): those modes make most terminals suppress native click-drag
// text selection entirely, and this app only needs discrete clicks + wheel.
const ENABLE_SEQUENCE = '\x1b[?1000h\x1b[?1006h'
const DISABLE_SEQUENCE = '\x1b[?1006l\x1b[?1000l'

export function enableMouseReporting(stream: NodeJS.WritableStream): void {
  stream.write(ENABLE_SEQUENCE)
}

export function disableMouseReporting(stream: NodeJS.WritableStream): void {
  stream.write(DISABLE_SEQUENCE)
}
