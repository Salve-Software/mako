import { useTerminalSize } from "../../../../../shared/hooks/use-terminal-size.js";
import {
  APP_HORIZONTAL_PADDING,
  LIST_COLUMN_FRACTION,
  DETAIL_CHROME_COLS,
  MIN_CONTENT_WIDTH,
  APP_OVERHEAD_ROWS,
  FOOTER_ROWS,
  PERF_PANEL_ROWS,
  STACKED_PANEL_COUNT,
  PANEL_CHROME_ROWS,
  MIN_PANEL_ROWS,
  NETWORK_HEADER_ROWS,
  DETAIL_FIXED_ROWS,
  MIN_DETAIL_BODY_ROWS,
} from "../../../library/constants.js";

export interface DashboardLayout {
  listColWidth: number;
  detailColWidth: number;
  detailContentWidth: number;
  logsPanelRows: number;
  nativePanelRows: number;
  networkPanelRows: number;
  detailRows: number;
  detailBodyVisibleRows: number;
}

export function useDashboardLayout(): DashboardLayout {
  const [cols, rows] = useTerminalSize();

  const rowWidth = Math.max(0, cols - APP_HORIZONTAL_PADDING);
  const listColWidth = Math.floor(rowWidth / LIST_COLUMN_FRACTION);
  const detailColWidth = rowWidth - listColWidth;
  const detailContentWidth = Math.max(MIN_CONTENT_WIDTH, detailColWidth - DETAIL_CHROME_COLS);

  // Ink doesn't clip overflow by default: if computed content height ever
  // exactly equals (or exceeds) the terminal's row count, the terminal
  // scrolls to accommodate the last line, which silently shifts every mouse
  // coordinate's row-1 reference (see getAbsoluteLayout). A fixed row-count
  // budget like APP_OVERHEAD_ROWS is inherently an estimate, so this margin
  // keeps a safety buffer rather than relying on that estimate being exact.
  const SAFETY_MARGIN_ROWS = 2;
  const availableRows = rows - APP_OVERHEAD_ROWS - FOOTER_ROWS - SAFETY_MARGIN_ROWS;
  const logsPanelRows = Math.max(
    MIN_PANEL_ROWS,
    Math.floor((availableRows - PERF_PANEL_ROWS) / STACKED_PANEL_COUNT) - PANEL_CHROME_ROWS,
  );
  const nativePanelRows = logsPanelRows;
  const networkPanelRows = Math.max(MIN_PANEL_ROWS, logsPanelRows - NETWORK_HEADER_ROWS);

  const detailRows = availableRows;
  const detailBodyVisibleRows = Math.max(MIN_DETAIL_BODY_ROWS, detailRows - DETAIL_FIXED_ROWS);

  return {
    listColWidth,
    detailColWidth,
    detailContentWidth,
    logsPanelRows,
    nativePanelRows,
    networkPanelRows,
    detailRows,
    detailBodyVisibleRows,
  };
}
