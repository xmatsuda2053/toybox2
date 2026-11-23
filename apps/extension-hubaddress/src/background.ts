export const OPEN_SIDEPANEL_COMMAND = "open-hubaddress-sidepanel";

export interface SidePanelBehaviorApi {
  setPanelBehavior: (behavior: {
    openPanelOnActionClick: boolean;
  }) => Promise<void>;
}

export interface SidePanelOpenApi {
  open: (options: { windowId?: number; tabId?: number }) => Promise<void>;
}

export interface CommandHandlerDeps {
  sidePanel?: SidePanelOpenApi;
  getLastFocusedWindow?: () => Promise<{ id?: number }>;
}

interface ChromeGlobalLike {
  sidePanel?: SidePanelBehaviorApi & SidePanelOpenApi;
  runtime?: {
    onInstalled?: {
      addListener: (cb: () => void) => void;
    };
  };
  commands?: {
    onCommand?: {
      addListener: (cb: (command: string) => void) => void;
    };
  };
  windows?: {
    getLastFocused: () => Promise<{ id?: number }>;
  };
}

function getChromeApi(): ChromeGlobalLike | undefined {
  return (globalThis as { chrome?: ChromeGlobalLike }).chrome;
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

/**
 * キーボードショートカットコマンド受信時にアクティブウィンドウで Side Panel を開く
 */
export async function handleCommand(
  command: string,
  deps?: CommandHandlerDeps,
): Promise<void> {
  if (command !== OPEN_SIDEPANEL_COMMAND) {
    return;
  }

  const chromeApi = getChromeApi();
  const sidePanel = deps?.sidePanel ?? chromeApi?.sidePanel;
  const getWindow: () => Promise<{ id?: number }> =
    deps?.getLastFocusedWindow ??
    (() =>
      chromeApi?.windows
        ? chromeApi.windows.getLastFocused()
        : Promise.resolve<{ id?: number }>({}));

  if (!sidePanel?.open) {
    return;
  }

  const currentWindow = await getWindow();
  if (typeof currentWindow.id === "number") {
    await sidePanel.open({ windowId: currentWindow.id });
  }
}

function registerServiceWorkerListeners(): void {
  const chromeApi = getChromeApi();
  if (!chromeApi) {
    return;
  }

  chromeApi.runtime?.onInstalled?.addListener(() => {
    void initSidePanelBehavior().catch((err: unknown) => {
      console.error("Failed to configure sidePanel behavior:", err);
    });
  });

  chromeApi.commands?.onCommand?.addListener((command: string) => {
    void handleCommand(command).catch((err: unknown) => {
      console.error("Failed to handle command:", err);
    });
  });
}

registerServiceWorkerListeners();
