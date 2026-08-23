/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import type { DOMElement } from 'ink'
import { forwardRef } from 'react'
import type { LogEvent } from '@salve-software/salvetron-types'
import type { CopyFeedback } from '../../../../../shared/hooks/use-detail-panel.js'
import { Clickable } from '../../../../../shared/components/clickable/index.js'

const LEVEL_COLOR: Record<string, string> = {
  error: 'red', warn: 'yellow', info: 'cyan', debug: 'gray', log: 'white',
}

interface LogDetailProps {
  log: LogEvent
  width: number
  metaLines: string[]
  metaScrollOffset: number
  metaVisibleRows: number
  copyFeedback?: CopyFeedback | null
  onCopy: () => void
}

export const LogDetail = forwardRef<DOMElement, LogDetailProps>(function LogDetail(
  { log, width, metaLines, metaScrollOffset, metaVisibleRows, copyFeedback, onCopy }, ref,
) {
  const color = LEVEL_COLOR[log.level] ?? 'white'
  const time = new Date(log.timestamp).toLocaleTimeString('en', { hour12: false })
  const visibleLines = metaLines.slice(metaScrollOffset, metaScrollOffset + metaVisibleRows)
  const canScroll = metaLines.length > metaVisibleRows

  return (
    <Box
      ref={ref}
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      borderTop={true}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
    >
      <Box gap={2}>
        <Text color={color} bold>[{log.level.toUpperCase()}]</Text>
        <Text color="gray">{time}</Text>
        <Text color="gray" dimColor>src: {log.source}</Text>
        {copyFeedback
          ? <Text color={copyFeedback.success ? 'green' : 'red'}>{copyFeedback.success ? '✓ Copied' : '✗ Copy failed'}</Text>
          : null
        }
      </Box>
      <Text wrap="wrap">{log.message.slice(0, width * 3)}</Text>
      {metaLines.length > 0
        ?
        <Box flexDirection="column">
          <Box>
            <Text color="whiteBright" dimColor>
              {'── metadata'}
              {canScroll ? `  [ = up   ] = down  ·  line ${metaScrollOffset + 1} of ${metaLines.length}  ·  ` : '  ·  '}
            </Text>
            <Clickable onClick={onCopy}>
              <Text color="whiteBright" dimColor underline>c copy</Text>
            </Clickable>
            <Text color="whiteBright" dimColor>{' ──'}</Text>
          </Box>
          {visibleLines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
        : null
      }
    </Box>
  )
})
