/** @jsxRuntime automatic */
/** @jsxImportSource react */
import type { DOMElement } from "ink";
import type { RefObject } from "react";
import type { NativeLogEvent } from "@salve-software/salvetron-types";
import { Panel } from "../../../../../shared/components/panel/index.js";
import { NativeLogList } from "../../../../native-logs/ui/components/native-log-list/index.js";

interface NativePanelSectionProps {
  logs: NativeLogEvent[];
  selectedIndex: number;
  scrollOffset: number;
  visibleRows: number;
  maxMessageWidth: number;
  focused: boolean;
  listRef?: RefObject<DOMElement | null>;
}

export function NativePanelSection({
  logs,
  selectedIndex,
  scrollOffset,
  visibleRows,
  maxMessageWidth,
  focused,
  listRef,
}: NativePanelSectionProps) {
  return (
    <Panel title="Native" focused={focused} flexGrow={1}>
      <NativeLogList
        ref={listRef}
        logs={logs}
        visibleRows={visibleRows}
        selectedIndex={selectedIndex}
        scrollOffset={scrollOffset}
        showHeader={false}
        maxMessageWidth={maxMessageWidth}
      />
    </Panel>
  );
}
