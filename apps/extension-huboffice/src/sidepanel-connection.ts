const SIDEPANEL_PORT_NAME = "huboffice-sidepanel";

const RESIZE_OBSERVER_LOOP_ERROR_MESSAGES = [
  "ResizeObserver loop completed with undelivered notifications",
  "ResizeObserver loop limit exceeded",
] as const;

/**
 * ブラウザ仕様上の無害な ResizeObserver loop 通知メッセージかどうかを判定する
 */
export function isResizeObserverLoopErrorMessage(message: unknown): boolean {
  if (typeof message !== "string" || message.length === 0) {
    return false;
  }
  return RESIZE_OBSERVER_LOOP_ERROR_MESSAGES.some((pattern) =>
    message.includes(pattern),
  );
}

/**
 * ResizeObserver 再計測時に発火する無害な loop 通知のみを抑制する
 */
export function installResizeObserverErrorGuard(
  target: EventTarget | undefined = typeof globalThis.window !== "undefined"
    ? globalThis.window
    : undefined,
): () => void {
  if (!target) {
    return () => {};
  }

  const listener = (event: Event): void => {
    const message = (event as { message?: unknown }).message;
    if (isResizeObserverLoopErrorMessage(message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  target.addEventListener("error", listener, { capture: true });
  return () => {
    target.removeEventListener("error", listener, { capture: true });
  };
}

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
