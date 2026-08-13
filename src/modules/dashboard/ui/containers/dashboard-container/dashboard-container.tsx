/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { useDashboardLayout } from "./use-dashboard-layout.js";
import { PerformancePanel, usePerformancePanel } from "../../components/performance-panel/index.js";
import { LogsPanelSection, useLogsPanelSection } from "../../components/logs-panel-section/index.js";
import { LogDetail } from "../../../../js-logs/ui/components/log-detail/index.js";
import { NetworkPanelSection, useNetworkPanelSection } from "../../components/network-panel-section/index.js";
import { NetworkDetail } from "../../../../network/ui/components/network-detail/index.js";
import { NativePanelSection, useNativePanelSection } from "../../components/native-panel-section/index.js";
import { NativeLogDetail } from "../../../../native-logs/ui/components/native-log-detail/index.js";
import { useIsDeviceSelectorOpen } from "../../../../../shared/store/device-selector.store.js";
import { PERF_PANEL_ROWS } from "../../../library/constants.js";

type FocusPanel = "logs" | "network" | "native";
const PANELS: FocusPanel[] = ["logs", "network", "native"];

export function DashboardContainer() {
  const [focused, setFocused] = useState<FocusPanel>("logs");

  const isDeviceSelectorOpen = useIsDeviceSelectorOpen();
  const isActive = !isDeviceSelectorOpen;

  const layout = useDashboardLayout();
  const { listColWidth, detailColWidth, detailContentWidth, logsPanelRows, nativePanelRows, networkPanelRows, detailRows, detailBodyVisibleRows } = layout;

  const perf = usePerformancePanel({ listColWidth });

  const logs = useLogsPanelSection({
    focused: focused === "logs",
    isActive,
    listColWidth,
    listVisibleRows: logsPanelRows,
    detailVisibleRows: detailBodyVisibleRows,
    onFocus: () => setFocused("logs"),
  });
  const network = useNetworkPanelSection({
    focused: focused === "network",
    isActive,
    listColWidth,
    listVisibleRows: networkPanelRows,
    detailVisibleRows: detailBodyVisibleRows,
    onFocus: () => setFocused("network"),
  });
  const native = useNativePanelSection({
    focused: focused === "native",
    isActive,
    listColWidth,
    listVisibleRows: nativePanelRows,
    detailVisibleRows: detailBodyVisibleRows,
    onFocus: () => setFocused("native"),
  });

  const focusedDetailOpen =
    (focused === "logs" && logs.detailOpen) ||
    (focused === "network" && network.detailOpen) ||
    (focused === "native" && native.detailOpen);

  useInput((_input, key) => {
    if (key.leftArrow) {
      const i = PANELS.indexOf(focused);
      setFocused(PANELS[(i - 1 + PANELS.length) % PANELS.length]);
    }
    if (key.rightArrow) {
      const i = PANELS.indexOf(focused);
      setFocused(PANELS[(i + 1) % PANELS.length]);
    }
  }, { isActive });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" width={listColWidth} flexShrink={0} overflow="hidden">
          <PerformancePanel
            latest={perf.latest}
            snapshots={perf.snapshots}
            sparkWidth={perf.sparkWidth}
            height={PERF_PANEL_ROWS}
          />

          <LogsPanelSection
            logs={logs.logs}
            selectedIndex={logs.selectedIndex}
            scrollOffset={logs.scrollOffset}
            visibleRows={logsPanelRows}
            maxMessageWidth={logs.maxMessageWidth}
            focused={focused === "logs"}
            listRef={logs.listRef}
          />

          <NetworkPanelSection
            logs={network.logs}
            selectedIndex={network.selectedIndex}
            scrollOffset={network.scrollOffset}
            visibleRows={networkPanelRows}
            urlMaxWidth={network.urlMaxWidth}
            focused={focused === "network"}
            listRef={network.listRef}
          />

          <NativePanelSection
            logs={native.logs}
            selectedIndex={native.selectedIndex}
            scrollOffset={native.scrollOffset}
            visibleRows={nativePanelRows}
            maxMessageWidth={native.maxMessageWidth}
            focused={focused === "native"}
            listRef={native.listRef}
          />
        </Box>
        <Box
          flexDirection="column"
          height={focusedDetailOpen ? undefined : 0}
          maxHeight={focusedDetailOpen ? detailRows : 0}
          width={detailColWidth}
          flexShrink={0}
          overflow="hidden"
          borderStyle="single"
          borderColor="gray"
          paddingX={2}
        >
          {focused === "logs" && logs.detailOpen && logs.selectedLog ? (
            <LogDetail
              ref={logs.detailRef}
              log={logs.selectedLog}
              width={detailContentWidth}
              metaLines={logs.metaLines}
              metaScrollOffset={logs.detailScrollOffset}
              metaVisibleRows={detailBodyVisibleRows}
              copyFeedback={logs.copyFeedback}
              onCopy={logs.copyBody}
            />
          ) : null}
          {focused === "network" && network.detailOpen && network.selectedLog ? (
            <NetworkDetail
              ref={network.detailRef}
              log={network.selectedLog}
              width={detailContentWidth}
              bodyLines={network.bodyLines}
              bodyScrollOffset={network.detailScrollOffset}
              bodyVisibleRows={detailBodyVisibleRows}
              copyFeedback={network.copyFeedback}
              onCopy={network.copyBody}
              onCopyCurl={network.copyExtra}
            />
          ) : null}
          {focused === "native" && native.detailOpen && native.selectedLog ? (
            <NativeLogDetail
              ref={native.detailRef}
              log={native.selectedLog}
              width={detailContentWidth}
              metaLines={native.metaLines}
              metaScrollOffset={native.detailScrollOffset}
              metaVisibleRows={detailBodyVisibleRows}
              copyFeedback={native.copyFeedback}
              onCopy={native.copyBody}
            />
          ) : null}
        </Box>
      </Box>
      <Box>
        <Text color="whiteBright" dimColor>
          ←→ panel · ↑↓ navigate · ↵ open · esc close · [ ] scroll detail · c copy{focused === "network" ? " · u curl" : ""}
        </Text>
      </Box>
    </Box>
  );
}
