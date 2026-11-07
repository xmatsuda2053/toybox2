import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  DEFAULT_TASK_HISTORY_MAX_COUNT,
  TASK_HISTORY_STORAGE_KEY,
  TASK_HISTORY_MAX_COUNT_STORAGE_KEY,
  type TaskHistoryItem,
} from "../types/domain/task-history.type.js";
import {
  clampMaxCount,
  parseMaxCount,
  parseTaskHistory,
  recordTaskHistory,
  cleanTaskHistory,
} from "../utils/task-history.utils.js";

/**
 * TaskHistoryController の初期化オプション
 */
export interface TaskHistoryControllerOptions {
  /** LocalStorage 互換ストレージ */
  storage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem?(key: string): void;
  };
  /** 履歴ストレージキー（省略時: "stepnote_task_history"） */
  storageKey?: string;
  /** 最大件数ストレージキー（省略時: "stepnote_task_history_max_count"） */
  maxCountStorageKey?: string;
  /** 現在時刻プロバイダー */
  nowProvider?: () => number;
}

/**
 * タスク閲覧履歴の記録・保持・永続化を管理する Reactive Controller
 */
export class TaskHistoryController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly storage?: TaskHistoryControllerOptions["storage"];
  private readonly storageKey: string;
  private readonly maxCountStorageKey: string;
  private readonly nowProvider: () => number;
  private readonly subscribers = new Set<() => void>();

  private _history: TaskHistoryItem[] = [];
  private _maxCount: number = DEFAULT_TASK_HISTORY_MAX_COUNT;

  constructor(
    host: ReactiveControllerHost,
    options?: TaskHistoryControllerOptions,
  ) {
    this.host = host;
    this.host.addController(this);

    this.storage =
      options?.storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    this.storageKey = options?.storageKey ?? TASK_HISTORY_STORAGE_KEY;
    this.maxCountStorageKey =
      options?.maxCountStorageKey ?? TASK_HISTORY_MAX_COUNT_STORAGE_KEY;
    this.nowProvider = options?.nowProvider ?? (() => Date.now());

    this.load();
  }

  public hostConnected(): void {
    // ライフサイクル連携用フック
  }

  public hostDisconnected(): void {
    // ライフサイクル解除用フック
  }

  /** 現在のタスク閲覧履歴一覧（新しい順） */
  public get history(): TaskHistoryItem[] {
    return this._history;
  }

  /** 現在の最大保持件数 */
  public get maxCount(): number {
    return this._maxCount;
  }

  /**
   * タスクIDを閲覧履歴に記録・更新する
   *
   * @param {number} taskId 閲覧したタスクID
   */
  public record(taskId: number): void {
    const updated = recordTaskHistory(
      this._history,
      taskId,
      this._maxCount,
      this.nowProvider(),
    );
    this._history = updated;
    this.saveHistory();
    this.notify();
  }

  /**
   * 指定したタスクIDを履歴から削除する
   *
   * @param {number} taskId 削除するタスクID
   */
  public remove(taskId: number): void {
    const updated = this._history.filter((item) => item.taskId !== taskId);
    if (updated.length !== this._history.length) {
      this._history = updated;
      this.saveHistory();
      this.notify();
    }
  }

  /**
   * 全てのタスク閲覧履歴をクリアする
   */
  public clear(): void {
    if (this._history.length === 0) return;
    this._history = [];
    this.saveHistory();
    this.notify();
  }

  /**
   * 履歴の最大保持件数を設定し、超過分を切り詰める
   *
   * @param {number} count 新しい最大件数
   */
  public setMaxCount(count: number): void {
    const clamped = clampMaxCount(count);
    this._maxCount = clamped;
    this.saveMaxCount();

    if (this._history.length > clamped) {
      this._history = this._history.slice(0, clamped);
      this.saveHistory();
    }
    this.notify();
  }

  /**
   * 有効なタスクID集合に基づき、存在しないタスクを履歴から除外する
   *
   * @param {Set<number>} validTaskIds 有効なタスクID一覧
   */
  public clean(validTaskIds: Set<number>): void {
    const updated = cleanTaskHistory(this._history, validTaskIds);
    if (updated.length !== this._history.length) {
      this._history = updated;
      this.saveHistory();
      this.notify();
    }
  }

  /**
   * 状態変更リスナーを登録する
   *
   * @param {() => void} callback コールバック関数
   * @return {() => void} 登録解除関数
   */
  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * ストレージから履歴と最大件数を復元する
   */
  private load(): void {
    if (!this.storage) return;

    const rawMaxCount = this.storage.getItem(this.maxCountStorageKey);
    this._maxCount = parseMaxCount(rawMaxCount, DEFAULT_TASK_HISTORY_MAX_COUNT);

    const rawHistory = this.storage.getItem(this.storageKey);
    const parsedHistory = parseTaskHistory(rawHistory);
    this._history = parsedHistory.slice(0, this._maxCount);
  }

  /**
   * 履歴配列をストレージに保存する
   */
  private saveHistory(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this._history));
    } catch (e) {
      console.warn("タスク閲覧履歴の保存に失敗しました:", e);
    }
  }

  /**
   * 最大件数設定をストレージに保存する
   */
  private saveMaxCount(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.maxCountStorageKey, String(this._maxCount));
    } catch (e) {
      console.warn("タスク履歴設定の保存に失敗しました:", e);
    }
  }

  /**
   * 状態変更をホストおよび購読者へ通知する
   */
  private notify(): void {
    this.host.requestUpdate();
    for (const callback of this.subscribers) {
      try {
        callback();
      } catch (e) {
        console.error("TaskHistoryController subscriber error:", e);
      }
    }
  }
}

