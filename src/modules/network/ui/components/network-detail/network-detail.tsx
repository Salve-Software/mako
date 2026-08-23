/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import type { DOMElement } from 'ink'
import { forwardRef } from 'react'
import type { NetworkLog } from '@salve-software/salvetron-types'
import { METHOD_COLOR, getStatusColor } from '../../../library/constants.js'
import type { CopyFeedback } from '../../../../../shared/hooks/use-detail-panel.js'
import { Clickable } from '../../../../../shared/components/clickable/index.js'

interface NetworkDetailProps {
  log: NetworkLog
  width: number
  bodyLines: string[]
  bodyScrollOffset: number
  bodyVisibleRows: number
  copyFeedback?: CopyFeedback | null
  onCopy: () => void
  onCopyCurl: () => void
}

export const NetworkDetail = forwardRef<DOMElement, NetworkDetailProps>(function NetworkDetail(
  { log, width, bodyLines, bodyScrollOffset, bodyVisibleRows, copyFeedback, onCopy, onCopyCurl }, ref,
) {
  const time = new Date(log.requestTimestamp).toLocaleTimeString('en', { hour12: false })
  const reqHeaders = Object.entries(log.requestHeaders ?? {})
  const resHeaders = Object.entries(log.responseHeaders ?? {})
  const visibleLines = bodyLines.slice(bodyScrollOffset, bodyScrollOffset + bodyVisibleRows)
  const canScroll = bodyLines.length > bodyVisibleRows

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
        <Text color={METHOD_COLOR[log.method] ?? 'white'} bold>{log.method}</Text>
        <Text color={getStatusColor(log.statusCode)} bold>
          {log.statusCode ?? 'pending'}
        </Text>
        {log.duration ? <Text color="gray">{log.duration}ms</Text> : null}
        <Text color="gray" dimColor>{time}</Text>
        {copyFeedback
          ?
          <Text color={copyFeedback.success ? 'green' : 'red'}>
            {copyFeedback.success
              ? (copyFeedback.kind === 'extra' ? '✓ curl copied' : '✓ Copied')
              : '✗ Copy failed'}
          </Text>
          : null
        }
      </Box>
      <Text color="whiteBright" wrap="truncate-end">{log.url.slice(0, width - 2)}</Text>
      {reqHeaders.length > 0
        ?
        <Text color="whiteBright" dimColor wrap="truncate-end">
          req: {reqHeaders.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('  ')}
        </Text>
        : null
      }
      {resHeaders.length > 0
        ?
        <Text color="whiteBright" dimColor wrap="truncate-end">
          res: {resHeaders.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('  ')}
        </Text>
        : null
      }
      {bodyLines.length > 0
        ?
        <Box flexDirection="column">
          <Box>
            <Text color="whiteBright" dimColor>
              {'── body'}
              {canScroll ? `  [ = scroll up   ] = scroll down  ·  line ${bodyScrollOffset + 1} of ${bodyLines.length}  ·  ` : '  ·  '}
            </Text>
            <Clickable onClick={onCopy}>
              <Text color="whiteBright" dimColor underline>c copy</Text>
            </Clickable>
            <Text color="whiteBright" dimColor>{'  ·  '}</Text>
            <Clickable onClick={onCopyCurl}>
              <Text color="whiteBright" dimColor underline>u curl</Text>
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
