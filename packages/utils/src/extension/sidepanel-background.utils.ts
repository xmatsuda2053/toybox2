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

export interface SidePanelBackgroundConfig {
  readonly commandName: string;
  readonly portName: string;
}

export interface SidePanelBackgroundController {
  clearRegisteredSidePanelPorts: () => void;
  registerSidePanelPort: (port: SidePanelPortLike) => void;
  initSidePanelBehavior: (sidePanel?: SidePanelBehaviorApi) => Promise<void>;
  handleCommand: (
    command: string,
    tab?: CommandTabLike,
    deps?: CommandHandlerDeps,
  ) => Promise<void>;
  registerServiceWorkerListeners: () => void;
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

interface PortRegistry {
  portsByWindow: Map<number, SidePanelPortLike>;
  unscopedPorts: Set<SidePanelPortLike>;
}

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

function findOpenPort(
  registry: PortRegistry,
  windowId: number | undefined,
): { port: SidePanelPortLike; windowId?: number } | undefined {
  if (typeof windowId === "number") {
    const matched = registry.portsByWindow.get(windowId);
    if (matched) {
      return { port: matched, windowId };
    }
  }

  const fallbackPort = registry.unscopedPorts.values().next().value;
  if (fallbackPort) {
    return { port: fallbackPort, windowId };
  }

  if (typeof windowId !== "number") {
    const firstEntry = registry.portsByWindow.entries().next().value;
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

function trackSidePanelPort(
  registry: PortRegistry,
  expectedPortName: string,
  port: SidePanelPortLike,
): void {
  if (port.name !== expectedPortName) {
    return;
  }

  let boundWindowId =
    port.sender?.windowId ?? port.sender?.tab?.windowId ?? undefined;

  if (typeof boundWindowId === "number") {
    registry.portsByWindow.set(boundWindowId, port);
  } else {
    registry.unscopedPorts.add(port);
  }

  port.onMessage.addListener((message: unknown) => {
    const windowId = readRegisterWindowId(message);
    if (typeof windowId === "number") {
      registry.unscopedPorts.delete(port);
      boundWindowId = windowId;
      registry.portsByWindow.set(windowId, port);
    }
  });

  port.onDisconnect.addListener(() => {
    registry.unscopedPorts.delete(port);
    if (
      typeof boundWindowId === "number" &&
      registry.portsByWindow.get(boundWindowId) === port
    ) {
      registry.portsByWindow.delete(boundWindowId);
    }
  });
}

function toggleSidePanelByCommand(
  registry: PortRegistry,
  expectedCommand: string,
  command: string,
  tab?: CommandTabLike,
  deps?: CommandHandlerDeps,
): Promise<void> {
  if (command !== expectedCommand) {
    return Promise.resolve();
  }

  const chromeApi = getChromeApi();
  const sidePanel = deps?.sidePanel ?? chromeApi?.sidePanel;
  if (!sidePanel?.open) {
    return Promise.resolve();
  }

  const openTarget = findOpenPort(registry, tab?.windowId);
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

function bindServiceWorkerListeners(
  registry: PortRegistry,
  registerSidePanelPort: (port: SidePanelPortLike) => void,
  handleCommand: (command: string, tab?: CommandTabLike) => Promise<void>,
): void {
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
    registry.portsByWindow.delete(windowId);
  });
  chromeApi.commands?.onCommand?.addListener(
    (command: string, tab?: CommandTabLike) => {
      void handleCommand(command, tab).catch((err: unknown) => {
        console.error("Failed to handle command:", err);
      });
    },
  );
}

/**
 * Chrome Side Panel 拡張機能向けの共通 Service Worker コントローラを生成する
 */
export function createSidePanelBackground(
  config: SidePanelBackgroundConfig,
): SidePanelBackgroundController {
  const registry: PortRegistry = {
    portsByWindow: new Map<number, SidePanelPortLike>(),
    unscopedPorts: new Set<SidePanelPortLike>(),
  };

  const clearRegisteredSidePanelPorts = (): void => {
    registry.portsByWindow.clear();
    registry.unscopedPorts.clear();
  };

  const registerSidePanelPort = (port: SidePanelPortLike): void => {
    trackSidePanelPort(registry, config.portName, port);
  };

  const handleCommand = (
    command: string,
    tab?: CommandTabLike,
    deps?: CommandHandlerDeps,
  ): Promise<void> =>
    toggleSidePanelByCommand(registry, config.commandName, command, tab, deps);

  const registerServiceWorkerListeners = (): void => {
    bindServiceWorkerListeners(registry, registerSidePanelPort, handleCommand);
  };

  return {
    clearRegisteredSidePanelPorts,
    registerSidePanelPort,
    initSidePanelBehavior,
    handleCommand,
    registerServiceWorkerListeners,
  };
}
