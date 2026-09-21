import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * テーマ選択モード（システム連動 / ライト / ダーク）
 */
export type ThemeMode = "system" | "light" | "dark";

/**
 * 実際に適用されるテーマ（ライト / ダーク）
 */
export type ResolvedTheme = "light" | "dark";

/**
 * テーマ状態オブジェクト
 */
export interface ThemeState {
  /** ユーザー選択モード */
  theme: ThemeMode;
  /** 実際に画面へ適用されるテーマ */
  resolvedTheme: ResolvedTheme;
}

/**
 * ThemeController の DI（依存性注入）オプション
 */
export interface ThemeControllerOptions {
  /** ストレージ（デフォルト: window.localStorage） */
  storage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
  /** メディアクエリ解決関数（デフォルト: window.matchMedia） */
  matchMedia?: (query: string) => {
    matches: boolean;
    addEventListener(
      type: string,
      listener: (e: { matches: boolean }) => void,
    ): void;
    removeEventListener(
      type: string,
      listener: (e: { matches: boolean }) => void,
    ): void;
  };
  /** テーマ属性・クラスを反映するルート要素（デフォルト: document.documentElement） */
  targetElement?: {
    classList: {
      add(...tokens: string[]): void;
      remove(...tokens: string[]): void;
    };
    setAttribute(qualifiedName: string, value: string): void;
  };
  /** LocalStorage のキー名（デフォルト: 'stepnote_theme'） */
  storageKey?: string;
}

/**
 * アプリケーションのテーマ（System / Light / Dark）を管理する Reactive Controller
 *
 * @export
 * @class ThemeController
 * @implements {ReactiveController}
 */
export class ThemeController implements ReactiveController {
  private host: ReactiveControllerHost;
  private storageKey: string;
  private storage?: ThemeControllerOptions["storage"];
  private matchMediaFn?: ThemeControllerOptions["matchMedia"];
  private targetElement?: ThemeControllerOptions["targetElement"];
  private mediaQueryList?: ReturnType<
    NonNullable<ThemeControllerOptions["matchMedia"]>
  >;

  private _state: ThemeState;
  private listeners: Set<(state: ThemeState) => void> = new Set();

  /**
   * 現在のテーマ状態（読み取り専用）
   */
  public get state(): Readonly<ThemeState> {
    return this._state;
  }

  /**
   * 現在のユーザー選択テーマモード
   */
  public get theme(): ThemeMode {
    return this._state.theme;
  }

  /**
   * 実際に適用されている解決済みテーマ（'light' | 'dark'）
   */
  public get resolvedTheme(): ResolvedTheme {
    return this._state.resolvedTheme;
  }

  constructor(host: ReactiveControllerHost, options?: ThemeControllerOptions) {
    this.host = host;
    this.host.addController(this);

    this.storageKey = options?.storageKey ?? "stepnote_theme";
    this.storage =
      options?.storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    this.matchMediaFn =
      options?.matchMedia ??
      (typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia.bind(window)
        : undefined);
    this.targetElement =
      options?.targetElement ??
      (typeof document !== "undefined"
        ? document.documentElement
        : undefined);

    // 1. OS 設定監視用の MediaQueryList を取得
    if (this.matchMediaFn) {
      this.mediaQueryList = this.matchMediaFn("(prefers-color-scheme: dark)");
      this.mediaQueryList.addEventListener?.("change", this.handleMediaChange);
    }

    // 2. 初期テーマの決定（Storage の保存値を優先、なければ 'system'）
    const savedTheme = this.storage?.getItem(this.storageKey) as ThemeMode | null;
    const initialTheme: ThemeMode =
      savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
        ? savedTheme
        : "system";

    const initialResolved = this.resolveTheme(initialTheme);
    this._state = {
      theme: initialTheme,
      resolvedTheme: initialResolved,
    };

    // 3. DOM への初期反映
    this.applyThemeToDom(initialResolved);
  }

  /**
   * LitElement 接続時ライフサイクル
   */
  public hostConnected(): void {
    // 接続時に必要であれば再度リスナー登録を確認
    if (this.mediaQueryList && !this.mediaQueryList.addEventListener) {
      // noop
    }
  }

  /**
   * LitElement 切断時ライフサイクル
   */
  public hostDisconnected(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener?.(
        "change",
        this.handleMediaChange,
      );
    }
  }

  /**
   * 状態変更を購読するリスナー関数を登録する。
   *
   * @param listener 状態変更時に呼び出されるコールバック
   * @returns 購読解除関数
   */
  public subscribe = (listener: (state: ThemeState) => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * テーマを切り替える。
   *
   * @param newTheme 切り替え先のテーマモード ('system' | 'light' | 'dark')
   */
  public setTheme = (newTheme: ThemeMode): void => {
    if (this._state.theme === newTheme) {
      return;
    }

    const resolved = this.resolveTheme(newTheme);
    this._state = {
      theme: newTheme,
      resolvedTheme: resolved,
    };

    // Storage への永続化
    this.storage?.setItem(this.storageKey, newTheme);

    // DOM への反映
    this.applyThemeToDom(resolved);

    // ホストおよびリスナーへの通知
    this.notify();
  };

  /**
   * OS のカラーモード変更イベントハンドラー
   */
  private handleMediaChange = (e: { matches: boolean }): void => {
    // 'system' 設定時のみ自動追従する
    if (this._state.theme !== "system") {
      return;
    }

    const newResolved: ResolvedTheme = e.matches ? "dark" : "light";
    if (this._state.resolvedTheme !== newResolved) {
      this._state = {
        ...this._state,
        resolvedTheme: newResolved,
      };
      this.applyThemeToDom(newResolved);
      this.notify();
    }
  };

  /**
   * 指定されたテーマモードから実際の適用テーマ ('light' | 'dark') を算出する。
   */
  private resolveTheme(mode: ThemeMode): ResolvedTheme {
    if (mode === "dark") {
      return "dark";
    }
    if (mode === "light") {
      return "light";
    }
    // 'system' の場合は OS 設定を判定
    const isDark = this.mediaQueryList?.matches ?? false;
    return isDark ? "dark" : "light";
  }

  /**
   * DOM ルート要素およびホスト要素へテーマクラスおよび属性を反映する。
   */
  private applyThemeToDom(resolved: ResolvedTheme): void {
    const targets: Array<{
      classList?: {
        add(...tokens: string[]): void;
        remove(...tokens: string[]): void;
      };
      setAttribute?(name: string, value: string): void;
    }> = [];

    if (this.targetElement) {
      targets.push(this.targetElement);
    }

    if (
      this.host &&
      typeof (this.host as unknown as HTMLElement).setAttribute ===
        "function" &&
      (this.host as unknown as HTMLElement).classList
    ) {
      targets.push(this.host as unknown as HTMLElement);
    }

    for (const target of targets) {
      if (resolved === "dark") {
        target.classList?.remove("wa-light");
        target.classList?.add("wa-dark");
        target.setAttribute?.("data-theme", "dark");
      } else {
        target.classList?.remove("wa-dark");
        target.classList?.add("wa-light");
        target.setAttribute?.("data-theme", "light");
      }
    }
  }

  /**
   * ホストへの再描画通知および全リスナーへの通知
   */
  private notify(): void {
    this.host.requestUpdate();
    this.listeners.forEach((listener) => listener(this._state));
  }
}
