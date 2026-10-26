import type { MarkdownDisplayMode, SearchInputEventDetail } from "@shared/components";

/**
 * キー単位でタイマーを管理し、デバウンス実行およびクリーンアップを行うマネージャー
 *
 * 各アイテムのインライン編集時などに、IDごとに独立してタイマーを持ち、
 * 指定待機時間の経過後に自動保存アクションを実行する。
 *
 * @export
 * @class KeyedDebounceManager
 * @template K - キーの型（デフォルトは number）
 */
export class KeyedDebounceManager<K = number> {
  private readonly timers = new Map<K, ReturnType<typeof setTimeout>>();

  /**
   * 指定キーのアクションをデバウンス実行する
   *
   * @param {K} key - 対象キー（アイテムID等）
   * @param {() => void | Promise<void>} action - 実行するアクション
   * @param {number} [wait=300] - 待機時間（ミリ秒）
   */
  public debounce(
    key: K,
    action: () => void | Promise<void>,
    wait: number = 300,
  ): void {
    this.cancel(key);

    const timer = setTimeout(async () => {
      try {
        await action();
      } finally {
        this.timers.delete(key);
      }
    }, wait);

    this.timers.set(key, timer);
  }

  /**
   * 指定キーの待機中タイマーをキャンセルする
   *
   * @param {K} key - 対象キー
   */
  public cancel(key: K): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * すべての待機中タイマーを一括破棄する
   */
  public clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

/**
 * リストアイテムのインライン排他アコーディオン展開制御を行うクラス
 *
 * 常に最大1つのアイテムのみを展開し、展開・折りたたみ時にアニメーション完了タイマー（320ms）を制御する。
 *
 * @export
 * @class ExclusiveAccordionController
 */
export class ExclusiveAccordionController {
  public expandedIds: Set<number> = new Set();
  public collapsingId: number | null = null;
  private collapseTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly durationMs: number;

  /**
   * @param {number} [durationMs=320] - 折りたたみアニメーションの継続時間（ミリ秒）
   */
  constructor(durationMs: number = 320) {
    this.durationMs = durationMs;
  }

  /**
   * アイテムの開閉状態を排他的にトグルする
   *
   * @param {number} id - 対象アイテムID
   * @param {(id: number) => void} [onExpand] - 新規展開時に呼び出されるコールバック
   * @param {(id: number) => void} [onAnimateEnd] - 折りたたみタイマー満了時に呼び出されるコールバック
   * @returns {{ expanded: boolean }} トグル後の展開状態
   */
  public toggle(
    id: number,
    onExpand?: (id: number) => void,
    onAnimateEnd?: (id: number) => void,
  ): { expanded: boolean } {
    this.clearCollapseTimer();

    const currentlyExpanded = Array.from(this.expandedIds)[0];

    // すでに展開中の同一アイテムをクリックした場合は閉じる
    if (currentlyExpanded === id) {
      this.expandedIds.clear();
      this.startCollapsing(id, onAnimateEnd);
      return { expanded: false };
    }

    // 別のアイテムが展開中だった場合は、それを折りたたみ状態に移行させる
    if (currentlyExpanded !== undefined) {
      this.startCollapsing(currentlyExpanded, onAnimateEnd);
    } else if (this.collapsingId === id) {
      this.collapsingId = null;
    }

    this.expandedIds = new Set([id]);
    onExpand?.(id);
    return { expanded: true };
  }

  /**
   * 詳細パネルの CSS アニメーション終了ハンドラー
   *
   * @param {number} id - 対象アイテムID
   * @returns {boolean} 折りたたみ対象と一致してクリアされた場合 true
   */
  public handleAnimationEnd(id: number): boolean {
    if (this.collapsingId === id) {
      this.clearCollapseTimer();
      this.collapsingId = null;
      return true;
    }
    return false;
  }

  /**
   * 展開状態およびタイマーを全リセットする
   */
  public reset(): void {
    this.clearCollapseTimer();
    this.expandedIds = new Set();
    this.collapsingId = null;
  }

  private startCollapsing(
    id: number,
    onAnimateEnd?: (id: number) => void,
  ): void {
    this.collapsingId = id;
    this.collapseTimer = setTimeout(() => {
      this.finishCollapse(id);
      onAnimateEnd?.(id);
    }, this.durationMs);
  }

  private clearCollapseTimer(): void {
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  private finishCollapse(id: number): void {
    if (this.collapsingId === id) {
      this.clearCollapseTimer();
      this.collapsingId = null;
    }
  }
}

/**
 * 削除確認ダイアログの表示状態および削除対象IDを管理するクラス
 *
 * @export
 * @class DeleteDialogState
 */
export class DeleteDialogState {
  public isOpen: boolean = false;
  public deletingId?: number;

  /**
   * 指定アイテムIDの削除確認ダイアログを開く
   *
   * @param {number} id - 削除対象アイテムID
   */
  public open(id: number): void {
    this.deletingId = id;
    this.isOpen = true;
  }

  /**
   * 削除確認ダイアログを閉じる
   */
  public close(): void {
    this.isOpen = false;
    this.deletingId = undefined;
  }
}

/**
 * マップ内に保持された全アイテムの Markdown エディタモードを 'preview' へ一括リセットする
 *
 * @export
 * @param {Map<number, MarkdownDisplayMode>} modeMap - エディタモードマップ
 */
export function resetModesToPreview(
  modeMap: Map<number, MarkdownDisplayMode>,
): void {
  for (const key of modeMap.keys()) {
    modeMap.set(key, "preview");
  }
}

/**
 * 検索入力イベントまたはクエリ文字列から検索語句を抽出する
 *
 * @export
 * @param {(CustomEvent<SearchInputEventDetail> | string)} eventOrQuery - 入力イベントまたは文字列
 * @returns {string} 抽出された検索キーワード
 */
export function extractSearchQuery(
  eventOrQuery: CustomEvent<SearchInputEventDetail> | string,
): string {
  if (typeof eventOrQuery === "string") {
    return eventOrQuery;
  }
  return eventOrQuery.detail?.keyword ?? "";
}
