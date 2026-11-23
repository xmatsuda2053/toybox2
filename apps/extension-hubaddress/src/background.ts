export const OPEN_SIDEPANEL_COMMAND = "open-hubaddress-sidepanel";
export const SIDEPANEL_PORT_NAME = "hubaddress-sidepanel";

export interface SidePanelBehaviorApi {
  setPanelBehavior: (behavior: {
    openPanelOnActionClick: boolean;
  }) => Promise<void>;
}

export interface SidePanelOpenApi {
  open: (options: { windowId?: number; tabId?: number }) => Promise<void>;
  close?: (options: { windowId?: number; tabId?: number }) => Promise<void>;
}

export interface CommandTabLike {
  id?: number;
  windowId?: number;
}

export interface CommandHandlerDeps {
  sidePanel?: SidePanelOpenApi;
  getLastFocusedWindow?: () => Promise<{ id?: number }>;
}

export interface SidePanelPortLike {
  name: string;
  sender?: {
    windowId?: number;
    tab?: { windowId?: number };
  };
  postMessage: (message: unknown) => void;
  onMessage: {
    addListener: (cb: (message: unknown) => void) => void;
  };
  onDisconnect: {
    addListener: (cb: () => void) => void;
  };
}

interface ChromeGlobalLike {
  sidePanel?: SidePanelBehaviorApi & SidePanelOpenApi;
  runtime?: {
    onInstalled?: { addListener: (cb: () => void) => void };
    onStartup?: { addListener: (cb: () => void) => void };
    onConnect?: {
      addListener: (cb: (port: SidePanelPortLike) => void) => void;
    };
  };
  commands?: {
    onCommand?: {
      addListener: (
        cb: (command: string, tab?: CommandTabLike) => void,
      ) => void;
    };
  };
  windows?: {
    getLastFocused: () => Promise<{ id?: number }>;
    onRemoved?: { addListener: (cb: (windowId: number) => void) => void };
  };
}

const portsByWindow = new Map<number, SidePanelPortLike>();
const unscopedPorts = new Set<SidePanelPortLike>();

function getChromeApi(): ChromeGlobalLike | undefined {
  return (globalThis as { chrome?: ChromeGlobalLike }).chrome;
}

function readRegisterWindowId(message: unknown): number | undefined {
  if (typeof message !== "object" || message === null) {
    return undefined;
  }
  const msg = message as { type?: unknown; windowId?: unknown };
  if (msg.type === "register" && typeof msg.windowId === "number") {
    return msg.windowId;
  }
  return undefined;
}

/**
 * テスト用に登録済みポート状態を初期化する
 */
export function clearRegisteredSidePanelPorts(): void {
  portsByWindow.clear();
  unscopedPorts.clear();
}

/**
 * Side Panel ページからの接続ポートをウィンドウ単位で追跡する
 */
export function registerSidePanelPort(port: SidePanelPortLike): void {
  if (port.name !== SIDEPANEL_PORT_NAME) {
    return;
  }

  let boundWindowId =
    port.sender?.windowId ?? port.sender?.tab?.windowId ?? undefined;

  if (typeof boundWindowId === "number") {
    portsByWindow.set(boundWindowId, port);
  } else {
    unscopedPorts.add(port);
  }

  port.onMessage.addListener((message: unknown) => {
    const windowId = readRegisterWindowId(message);
    if (typeof windowId === "number") {
      unscopedPorts.delete(port);
      boundWindowId = windowId;
      portsByWindow.set(windowId, port);
    }
  });

  port.onDisconnect.addListener(() => {
    unscopedPorts.delete(port);
    if (
      typeof boundWindowId === "number" &&
      portsByWindow.get(boundWindowId) === port
    ) {
      portsByWindow.delete(boundWindowId);
    }
  });
}

/**
 * ツールバーアイコンクリックで Side Panel を開閉できるよう初期化する
 */
export async function initSidePanelBehavior(
  sidePanel: SidePanelBehaviorApi | undefined = getChromeApi()?.sidePanel,
): Promise<void> {
  if (!sidePanel?.setPanelBehavior) {
    return;
  }

  await sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

function findOpenPort(
  windowId: number | undefined,
): { port: SidePanelPortLike; windowId?: number } | undefined {
  if (typeof windowId === "number") {
    const matched = portsByWindow.get(windowId);
    if (matched) {
      return { port: matched, windowId };
    }
  }

  const fallbackPort = unscopedPorts.values().next().value;
  if (fallbackPort) {
    return { port: fallbackPort, windowId };
  }

  if (typeof windowId !== "number") {
    const firstEntry = portsByWindow.entries().next().value;
    if (firstEntry) {
      return { port: firstEntry[1], windowId: firstEntry[0] };
    }
  }

  return undefined;
}

function closeOpenSidePanel(
  sidePanel: SidePanelOpenApi,
  target: { port: SidePanelPortLike; windowId?: number },
): Promise<void> {
  if (
    typeof sidePanel.close === "function" &&
    typeof target.windowId === "number"
  ) {
    return sidePanel.close({ windowId: target.windowId }).catch(() => {
      target.port.postMessage({ type: "close" });
    });
  }

  target.port.postMessage({ type: "close" });
  return Promise.resolve();
}

/**
 * キーボードショートカット受信時に Side Panel の開く・閉じるをトグルする
 * ユーザー操作コンテキストを維持するため、開く際は tab.windowId を使って await せず同期呼び出しする
 */
export function handleCommand(
  command: string,
  tab?: CommandTabLike,
  deps?: CommandHandlerDeps,
): Promise<void> {
  if (command !== OPEN_SIDEPANEL_COMMAND) {
    return Promise.resolve();
  }

  const chromeApi = getChromeApi();
  const sidePanel = deps?.sidePanel ?? chromeApi?.sidePanel;
  if (!sidePanel?.open) {
    return Promise.resolve();
  }

  const openTarget = findOpenPort(tab?.windowId);
  if (openTarget) {
    return closeOpenSidePanel(sidePanel, openTarget);
  }

  if (typeof tab?.windowId === "number") {
    return sidePanel.open({ windowId: tab.windowId });
  }

  const getWindow: () => Promise<{ id?: number }> =
    deps?.getLastFocusedWindow ??
    (() =>
      chromeApi?.windows
        ? chromeApi.windows.getLastFocused()
        : Promise.resolve<{ id?: number }>({}));

  return getWindow().then((currentWindow) => {
    if (typeof currentWindow.id === "number") {
      return sidePanel.open({ windowId: currentWindow.id });
    }
    return undefined;
  });
}

function registerServiceWorkerListeners(): void {
  const chromeApi = getChromeApi();
  if (!chromeApi) {
    return;
  }

  const configure = () => {
    void initSidePanelBehavior().catch((err: unknown) => {
      console.error("Failed to configure sidePanel behavior:", err);
    });
  };

  configure();
  chromeApi.runtime?.onInstalled?.addListener(configure);
  chromeApi.runtime?.onStartup?.addListener(configure);
  chromeApi.runtime?.onConnect?.addListener(registerSidePanelPort);
  chromeApi.windows?.onRemoved?.addListener((windowId: number) => {
    portsByWindow.delete(windowId);
  });

  chromeApi.commands?.onCommand?.addListener(
    (command: string, tab?: CommandTabLike) => {
      void handleCommand(command, tab).catch((err: unknown) => {
        console.error("Failed to handle command:", err);
      });
    },
  );
}

registerServiceWorkerListeners();
