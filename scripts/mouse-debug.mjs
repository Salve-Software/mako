#!/usr/bin/env node
// Standalone mouse-report diagnostic — no Ink, no salvetron UI.
// Enables SGR mouse tracking on this terminal and prints every raw byte
// that arrives on stdin, decoded when it matches an SGR mouse sequence.
//
// Usage: node scripts/mouse-debug.mjs
// Then click / scroll inside this terminal pane and watch the output.
// Ctrl+C to exit (also disables mouse reporting on exit).

const ENABLE = '\x1b[?1000h\x1b[?1006h'
const DISABLE = '\x1b[?1006l\x1b[?1000l'

if (!process.stdin.isTTY) {
  console.error('stdin is not a TTY — run this directly in your terminal, not piped.')
  process.exit(1)
}

console.log(`stdout.isTTY=${process.stdout.isTTY} stdin.isTTY=${process.stdin.isTTY} columns=${process.stdout.columns} rows=${process.stdout.rows}`)
console.log('Enabling SGR mouse reporting... click or scroll in this pane now.')
console.log('If nothing prints below when you click, this terminal is not forwarding mouse events to the process.\n')

process.stdout.write(ENABLE)
process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding('utf8')

const SGR_PATTERN = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g

process.stdin.on('data', (chunk) => {
  const bytes = Buffer.from(chunk, 'utf8')
  console.log(`raw: ${JSON.stringify(chunk)}  hex: ${bytes.toString('hex')}`)

  SGR_PATTERN.lastIndex = 0
  let match
  while ((match = SGR_PATTERN.exec(chunk)) !== null) {
    const [, cb, x, y, final] = match
    console.log(`  -> decoded SGR mouse event: cb=${cb} x=${x} y=${y} ${final === 'M' ? 'press/wheel' : 'release'}`)
  }

  // Ctrl+C
  if (chunk === '\u0003') cleanup()
})

function cleanup() {
  process.stdout.write(DISABLE)
  process.stdin.setRawMode(false)
  console.log('\nMouse reporting disabled. Bye.')
  process.exit(0)
}

process.on('SIGINT', cleanup)
