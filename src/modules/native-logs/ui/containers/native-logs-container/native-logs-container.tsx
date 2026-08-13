/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTerminalSize } from '../../../../../shared/hooks/use-terminal-size.js'
import { useListNavigation } from '../../../../../shared/hooks/use-list-navigation.js'
import { useDetailPanel } from '../../../../../shared/hooks/use-detail-panel.js'
import { useSearchFilter } from '../../../../../shared/hooks/use-search-filter.js'
import { useFilterChips } from '../../../../../shared/hooks/use-filter-chips.js'
import { useClearConfirm } from '../../../../../shared/hooks/use-clear-confirm.js'
import { SearchBar } from '../../../../../shared/components/search-bar/index.js'
import { FilterBar } from '../../../../../shared/components/filter-bar/index.js'
import { useNativeLogs, useNativeLogsStore } from '../../../store/native-logs.store.js'
import { useSelectedDeviceId } from '../../../../../shared/store/device.store.js'
import { useIsDeviceSelectorOpen } from '../../../../../shared/store/device-selector.store.js'
import { NATIVE_LOG_FILTER_GROUPS, matchesNativeLog } from '../../../library/filters.js'
import { NativeLogList } from '../../components/native-log-list/index.js'
import { NativeLogDetail } from '../../components/native-log-detail/index.js'
import { formatBody, formatPlainBody } from '../../../../../shared/utils/format-body.js'
import type { NativeLogEvent } from '@salve-software/salvetron-types'

const OVERHEAD_ROWS = 7
const DETAIL_FIXED_ROWS = 3
const MIN_LIST_ROWS = 4
const BAR_BORDER_ROWS = 2
const BAR_CHROME_COLS = 4
// Ink doesn't clip overflow by default: if computed content height ever
// exactly equals (or exceeds) the terminal's row count, the terminal
// scrolls to accommodate the last line, which silently shifts every mouse
// coordinate's row-1 reference (see getAbsoluteLayout). A fixed row-count
// budget like OVERHEAD_ROWS is inherently an estimate, so this margin keeps
// a safety buffer rather than relying on that estimate being exact.
const SAFETY_MARGIN_ROWS = 2

export function NativeLogsContainer() {
  const [cols, rows] = useTerminalSize()
  const allLogs = useNativeLogs()
  const selectedDeviceId = useSelectedDeviceId()
  const logs = useMemo(
    () => selectedDeviceId ? allLogs.filter((log) => (log.deviceId ?? 'unknown') === selectedDeviceId) : allLogs,
    [allLogs, selectedDeviceId],
  )

  const isDeviceSelectorOpen = useIsDeviceSelectorOpen()
  const { isOpen, query, focusedGroupIndex, focusedChipIndex } = useSearchFilter({
    groups: NATIVE_LOG_FILTER_GROUPS,
    isActive: !isDeviceSelectorOpen,
  })
  const { active, toggle } = useFilterChips({
    groups: NATIVE_LOG_FILTER_GROUPS,
    focusedGroupIndex,
    focusedChipIndex,
    isActive: isOpen && focusedGroupIndex >= 0,
  })
  const { pending: clearPending } = useClearConfirm({
    onClear: () => useNativeLogsStore.getState().clear(),
    isActive: !isOpen && !isDeviceSelectorOpen,
  })

  const filtered = useMemo(
    () => logs.filter((log) => matchesNativeLog(log, query, active)),
    [logs, query, active],
  )

  const barRows = isOpen ? BAR_BORDER_ROWS + 1 + NATIVE_LOG_FILTER_GROUPS.length + 1 : 0
  const clearRows = clearPending ? 1 : 0
  const availableRows = rows - OVERHEAD_ROWS - barRows - clearRows - SAFETY_MARGIN_ROWS
  const detailHeight = Math.max(DETAIL_FIXED_ROWS + 2, availableRows - MIN_LIST_ROWS)
  const metaVisibleRows = detailHeight - DETAIL_FIXED_ROWS

  const metaLinesRef = useRef<string[]>([])
  const selectedLogRef = useRef<NativeLogEvent | null>(null)

  const onCopyBody = useCallback(() => {
    const log = selectedLogRef.current
    if (!log) return ''
    const meta = log.metadata ? formatPlainBody(JSON.stringify(log.metadata)) : ''
    return meta ? `${log.message}\n\n${meta}` : log.message
  }, [])

  const { detailOpen, detailScrollOffset, resetDetailScroll, copyFeedback, copyBody, detailRef, openDetail } = useDetailPanel({
    linesRef: metaLinesRef,
    visibleRows: metaVisibleRows,
    scrollStep: 5,
    isActive: !isOpen && !isDeviceSelectorOpen,
    onCopyBody,
  })

  const listRows = detailOpen
    ? Math.max(MIN_LIST_ROWS, availableRows - detailHeight)
    : availableRows

  const { selectedIndex, scrollOffset, listRef } = useListNavigation({
    count: filtered.length,
    visibleRows: listRows,
    isActive: !isOpen && !isDeviceSelectorOpen,
    headerRows: 1,
    onRowClick: openDetail,
  })

  const selectedLog = filtered[selectedIndex] ?? null
  const metaLines = selectedLog?.metadata ? formatBody(JSON.stringify(selectedLog.metadata)) : []
  metaLinesRef.current = metaLines
  selectedLogRef.current = selectedLog

  useEffect(() => {
    resetDetailScroll()
  }, [selectedIndex, resetDetailScroll])

  return (
    <Box flexDirection="column">
      {isOpen
        ?
        <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
          <SearchBar query={query} width={cols - BAR_CHROME_COLS} resultCount={filtered.length} totalCount={logs.length} />
          <FilterBar
            groups={NATIVE_LOG_FILTER_GROUPS}
            active={active}
            focusedGroupIndex={focusedGroupIndex}
            focusedChipIndex={focusedChipIndex}
            onToggle={toggle}
          />
        </Box>
        : null
      }
      <Box flexGrow={1}>
        <NativeLogList
          ref={listRef}
          logs={filtered}
          visibleRows={listRows}
          selectedIndex={selectedIndex}
          scrollOffset={scrollOffset}
          maxMessageWidth={Math.max(20, cols - 34)}
        />
      </Box>
      <Text color="whiteBright" dimColor>/ search · x clear</Text>
      {clearPending ? <Text color="yellow">⚠ press x again to clear · esc to cancel</Text> : null}
      {detailOpen && selectedLog
        ?
        <NativeLogDetail
          ref={detailRef}
          log={selectedLog}
          width={cols}
          metaLines={metaLines}
          metaScrollOffset={detailScrollOffset}
          metaVisibleRows={metaVisibleRows}
          copyFeedback={copyFeedback}
          onCopy={copyBody}
        />
        : null
      }
    </Box>
  )
}
