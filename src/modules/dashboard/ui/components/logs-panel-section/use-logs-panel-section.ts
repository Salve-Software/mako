import { useCallback, useEffect, useMemo, useRef } from "react";
import type { LogEvent } from "@salve-software/salvetron-types";
import { useJsLogs } from "../../../../js-logs/store/js-logs.store.js";
import { useListNavigation } from "../../../../../shared/hooks/use-list-navigation.js";
import { useDetailPanel } from "../../../../../shared/hooks/use-detail-panel.js";
import { useDeviceFiltered } from "../../../../../shared/hooks/use-device-filtered.js";
import { formatBody, formatPlainBody } from "../../../../../shared/utils/format-body.js";
import {
  PANEL_CHROME_COLS,
  MIN_PANEL_INNER_WIDTH,
  MIN_LOGS_MESSAGE_WIDTH,
  LOGS_MESSAGE_WIDTH_OFFSET,
  DETAIL_SCROLL_STEP,
} from "../../../library/constants.js";

function getLogDeviceId(log: LogEvent): string | undefined {
  return log.deviceId;
}

interface UseLogsPanelSectionParams {
  focused: boolean;
  isActive: boolean;
  listColWidth: number;
  listVisibleRows: number;
  detailVisibleRows: number;
  /** Called when a click lands on this panel while it isn't the focused one. */
  onFocus: () => void;
}

export function useLogsPanelSection({
  focused,
  isActive,
  listColWidth,
  listVisibleRows,
  detailVisibleRows,
  onFocus,
}: UseLogsPanelSectionParams) {
  const allLogs = useJsLogs();
  const logs = useDeviceFiltered(allLogs, getLogDeviceId);

  const panelInner = Math.max(MIN_PANEL_INNER_WIDTH, listColWidth - PANEL_CHROME_COLS);
  const maxMessageWidth = Math.max(MIN_LOGS_MESSAGE_WIDTH, panelInner - LOGS_MESSAGE_WIDTH_OFFSET);

  const linesRef = useRef<string[]>([]);
  const selectedLogRef = useRef<LogEvent | null>(null);

  const onCopyBody = useCallback(() => {
    const log = selectedLogRef.current;
    if (!log) return "";
    const meta = log.metadata ? formatPlainBody(JSON.stringify(log.metadata)) : "";
    return meta ? `${log.message}\n\n${meta}` : log.message;
  }, []);

  const detail = useDetailPanel({
    linesRef,
    visibleRows: detailVisibleRows,
    scrollStep: DETAIL_SCROLL_STEP,
    isActive: focused && isActive,
    onCopyBody,
  });

  const nav = useListNavigation({
    count: logs.length,
    visibleRows: listVisibleRows,
    isActive: focused && isActive,
    mouseActive: isActive,
    onRowClick: () => {
      if (!focused) onFocus();
      detail.openDetail();
    },
  });

  const selectedLog = logs[nav.selectedIndex] ?? null;
  const metaLines = useMemo(
    () => (selectedLog?.metadata ? formatBody(JSON.stringify(selectedLog.metadata)) : []),
    [selectedLog],
  );
  linesRef.current = metaLines;
  selectedLogRef.current = selectedLog;

  useEffect(() => {
    detail.resetDetailScroll();
  }, [nav.selectedIndex, detail.resetDetailScroll]);

  return {
    logs,
    selectedIndex: nav.selectedIndex,
    scrollOffset: nav.scrollOffset,
    listRef: nav.listRef,
    selectedLog,
    metaLines,
    maxMessageWidth,
    detailOpen: detail.detailOpen,
    detailScrollOffset: detail.detailScrollOffset,
    copyFeedback: detail.copyFeedback,
    copyBody: detail.copyBody,
    detailRef: detail.detailRef,
  };
}
