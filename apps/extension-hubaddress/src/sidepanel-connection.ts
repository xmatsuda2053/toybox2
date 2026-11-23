const SIDEPANEL_PORT_NAME = "hubaddress-sidepanel";

export interface RuntimePortLike {
  postMessage: (message: unknown) => void;
  onMessage: { addListener: (cb: (message: unknown) => void) => void };
  onDisconnect: { addListener: (cb: () => void) => void };
  disconnect: () => void;
}

export interface SidePanelConnectionDeps {
  connect?: (options: { name: string }) => RuntimePortLike;
  getCurrentWindow?: () => Promise<{ id?: number }>;
  closeWindow?: () => void;
}

interface ChromeClientGlobalLike {
  runtime?: {
    connect?: (options: { name: string }) => RuntimePortLike;
  };
  windows?: {
    getCurrent?: () => Promise<{ id?: number }>;
  };
}

function resolveConnectionDeps(
  deps?: SidePanelConnectionDeps,
): SidePanelConnectionDeps {
  const chromeApi = (globalThis as { chrome?: ChromeClientGlobalLike }).chrome;
  return {
    connect:
      deps?.connect ?? chromeApi?.runtime?.connect?.bind(chromeApi.runtime),
    getCurrentWindow:
      deps?.getCurrentWindow ??
      chromeApi?.windows?.getCurrent?.bind(chromeApi.windows),
    closeWindow:
      deps?.closeWindow ??
      (() => {
        if (typeof globalThis.window !== "undefined") {
          globalThis.window.close();
        }
      }),
  };
}

function isCloseMessage(message: unknown): boolean {
  if (typeof message !== "object" || message === null) {
    return false;
  }
  return (message as { type?: unknown }).type === "close";
}

/**
 * Service Worker へ持続ポートを接続し、ウィンドウ紐付けとショートカット経由クローズを受け付ける
 */
export function connectSidePanelPort(
  deps?: SidePanelConnectionDeps,
): () => void {
  const resolved = resolveConnectionDeps(deps);
  if (!resolved.connect) {
    return () => {};
  }

  let disposed = false;
  const port = resolved.connect({ name: SIDEPANEL_PORT_NAME });

  port.onMessage.addListener((message: unknown) => {
    if (!disposed && isCloseMessage(message)) {
      resolved.closeWindow?.();
    }
  });

  if (resolved.getCurrentWindow) {
    void resolved
      .getCurrentWindow()
      .then((win) => {
        if (!disposed && typeof win?.id === "number") {
          port.postMessage({ type: "register", windowId: win.id });
        }
      })
      .catch(() => {});
  }

  return () => {
    disposed = true;
    try {
      port.disconnect();
    } catch {
      // ignore disconnect errors during page unload
    }
  };
}
