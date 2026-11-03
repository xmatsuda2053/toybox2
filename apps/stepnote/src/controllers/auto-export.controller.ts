import type { ReactiveControllerHost } from "lit";
import { BaseReactiveController } from "./base-reactive.controller.js";
import {
  type AutoExportSettings,
  DEFAULT_AUTO_EXPORT_SETTINGS,
} from "../types/domain/backup.type.js";
import {
  isExportSlotDue,
  isValidTimeFormat,
  normalizeScheduleTimes,
  formatExportSlot,
} from "../utils/auto-export.utils.js";
import { generateBackupFileName } from "../services/database-backup.service.js";

/**
 * AutoExportController の依存注入（DI）オプション
 */
export interface AutoExportControllerOptions {
  /** LocalStorage 互換ストレージ */
  storage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
  /** LocalStorage のキー名（デフォルト: 'stepnote_auto_export_settings'） */
  storageKey?: string;
  /** 現在時刻プロバイダー */
  nowProvider?: () => Date;
  /** タイマープロバイダー */
  timerProvider?: {
    setInterval(handler: () => void, ms: number): unknown;
    clearInterval(handle: unknown): void;
  };
  /** タイマー監視間隔（ミリ秒、デフォルト: 30000 = 30秒） */
  intervalMs?: number;
  /** エクスポート実行コールバック */
  exportCallback?: () => Promise<Blob | void>;
  /** エクスポート完了通知コールバック */
  notifyCallback?: (fileName: string) => void;
}

/**
 * データ自動エクスポートのスケジュール監視と設定永続化を管理する Reactive Controller
 *
 * @export
 * @class AutoExportController
 * @extends {BaseReactiveController<AutoExportSettings>}
 */
export class AutoExportController extends BaseReactiveController<AutoExportSettings> {
  private storageKey: string;
  private storage?: AutoExportControllerOptions["storage"];
  private nowProvider: () => Date;
  private timerProvider: AutoExportControllerOptions["timerProvider"];
  private intervalMs: number;
  private exportCallback?: AutoExportControllerOptions["exportCallback"];
  private notifyCallback?: AutoExportControllerOptions["notifyCallback"];

  private timerHandle?: unknown;
  private _state: AutoExportSettings;

  /**
   * 現在の設定状態（読み取り専用）
   */
  public get state(): Readonly<AutoExportSettings> {
    return this._state;
  }

  constructor(
    host: ReactiveControllerHost,
    options?: AutoExportControllerOptions,
  ) {
    super(host);

    this.storageKey =
      options?.storageKey ?? "stepnote_auto_export_settings";
    this.storage =
      options?.storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    this.nowProvider = options?.nowProvider ?? (() => new Date());
    this.timerProvider =
      options?.timerProvider ??
      (typeof window !== "undefined"
        ? {
            setInterval: (fn, ms) => window.setInterval(fn, ms),
            clearInterval: (handle) =>
              window.clearInterval(handle as number),
          }
        : undefined);
    this.intervalMs = options?.intervalMs ?? 30000;
    this.exportCallback = options?.exportCallback;
    this.notifyCallback = options?.notifyCallback;

    this._state = this.loadInitialSettings();
  }

  /**
   * ストレージから初期設定を読み込みます。
   */
  private loadInitialSettings(): AutoExportSettings {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) {
      return { ...DEFAULT_AUTO_EXPORT_SETTINGS };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AutoExportSettings>;
      return {
        enabled: parsed.enabled ?? DEFAULT_AUTO_EXPORT_SETTINGS.enabled,
        scheduleTimes: normalizeScheduleTimes(
          parsed.scheduleTimes ?? DEFAULT_AUTO_EXPORT_SETTINGS.scheduleTimes,
        ),
        lastExportedSlot: parsed.lastExportedSlot,
        lastExportedAt: parsed.lastExportedAt,
      };
    } catch {
      return { ...DEFAULT_AUTO_EXPORT_SETTINGS };
    }
  }

  /**
   * 現在の状態をストレージへ保存します。
   */
  private persistSettings(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this._state));
    } catch (e) {
      console.error("自動エクスポート設定の保存に失敗しました:", e);
    }
  }

  /**
   * 状態変更を通知し再描画を要求します。
   */
  private commitUpdate(): void {
    this.persistSettings();
    this.host.requestUpdate();
    this.notify(this._state);
  }

  /**
   * LitElement 接続時ライフサイクル
   */
  public override hostConnected(): void {
    if (this.timerProvider && !this.timerHandle) {
      this.timerHandle = this.timerProvider.setInterval(() => {
        void this.checkAndExport("timer");
      }, this.intervalMs);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  /**
   * LitElement 切断時ライフサイクル
   */
  public override hostDisconnected(): void {
    if (this.timerProvider && this.timerHandle) {
      this.timerProvider.clearInterval(this.timerHandle);
      this.timerHandle = undefined;
    }
    if (typeof document !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
    }
  }

  /**
   * タブ可視性復帰ハンドラー
   */
  private handleVisibilityChange = (): void => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      void this.checkAndExport("timer");
    }
  };

  /**
   * 自動エクスポート有効/無効の切り替え
   */
  public setEnabled(enabled: boolean): void {
    if (this._state.enabled === enabled) return;
    this._state = { ...this._state, enabled };
    this.commitUpdate();
  }

  /**
   * スケジュール時刻の新規追加
   */
  public addScheduleTime(time: string): boolean {
    if (!isValidTimeFormat(time)) return false;
    if (this._state.scheduleTimes.includes(time)) return false;

    const nextTimes = normalizeScheduleTimes([
      ...this._state.scheduleTimes,
      time,
    ]);
    this._state = { ...this._state, scheduleTimes: nextTimes };
    this.commitUpdate();
    return true;
  }

  /**
   * スケジュール時刻の削除
   */
  public removeScheduleTime(time: string): void {
    const nextTimes = this._state.scheduleTimes.filter((t) => t !== time);
    if (nextTimes.length === this._state.scheduleTimes.length) return;

    this._state = { ...this._state, scheduleTimes: nextTimes };
    this.commitUpdate();
  }

  /**
   * スケジュール時刻リストの一括更新
   */
  public setScheduleTimes(times: string[]): void {
    const nextTimes = normalizeScheduleTimes(times);
    this._state = { ...this._state, scheduleTimes: nextTimes };
    this.commitUpdate();
  }

  /**
   * 手動での即時エクスポート実行
   */
  public async triggerManualExport(): Promise<boolean> {
    return this.checkAndExport("manual");
  }

  /**
   * スケジュール監視または手動実行によるエクスポート処理
   */
  public async checkAndExport(
    trigger: "timer" | "manual" = "timer",
  ): Promise<boolean> {
    const now = this.nowProvider();

    if (trigger === "timer") {
      if (!this._state.enabled) return false;
      const { due, slot } = isExportSlotDue(
        now,
        this._state.scheduleTimes,
        this._state.lastExportedSlot,
      );
      if (!due || !slot) return false;
      return this.executeExport(now, slot);
    }

    // manual 実行
    const currentSlot = formatExportSlot(now);
    return this.executeExport(now, currentSlot);
  }

  /**
   * エクスポート実行本体
   */
  private async executeExport(now: Date, slot: string): Promise<boolean> {
    try {
      if (this.exportCallback) {
        await this.exportCallback();
      }
      const fileName = generateBackupFileName(now);
      this._state = {
        ...this._state,
        lastExportedSlot: slot,
        lastExportedAt: now.toISOString(),
      };
      this.commitUpdate();
      this.notifyCallback?.(fileName);
      return true;
    } catch (e) {
      console.error("エクスポート実行中にエラーが発生しました:", e);
      return false;
    }
  }
}

