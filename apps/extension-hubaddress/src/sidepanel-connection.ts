import {
  connectExtensionSidePanelPort,
  installResizeObserverErrorGuard,
  isResizeObserverLoopErrorMessage,
  type RuntimePortLike,
  type SidePanelConnectionDeps,
} from "@shared/utils";

const SIDEPANEL_PORT_NAME = "hubaddress-sidepanel";

export {
  installResizeObserverErrorGuard,
  isResizeObserverLoopErrorMessage,
  type RuntimePortLike,
  type SidePanelConnectionDeps,
};

/**
 * Service Worker へ持続ポートを接続し、ウィンドウ紐付けとショートカット経由クローズを受け付ける
 */
export function connectSidePanelPort(
  deps?: SidePanelConnectionDeps,
): () => void {
  return connectExtensionSidePanelPort(SIDEPANEL_PORT_NAME, deps);
}
