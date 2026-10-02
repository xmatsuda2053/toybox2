import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { debounce, dispatchCustomEvent, type DebouncedFunction } from "@shared/utils";
import styles from "./search-input.scss?inline";

import {
  normalizeWaSize,
  type ComponentSize,
} from "../utils/size.utils";

/**
 * 検索入力完了時に発行されるカスタムイベントのペイロード型定義
 */
export interface SearchInputEventDetail {
  /** 入力された文字列（前後の空白を含む生の値） */
  value: string;
  /** 検索用にトリムされたキーワード文字列 */
  keyword: string;
}

export type SearchInputSize = ComponentSize;

/**
 * 共通検索条件入力コンポーネント
 *
 * Web Awesome の wa-input をベースとし、虫眼鏡アイコン、クリアボタン（with-clear）、
 * プレースホルダー、共通ユーティリティによるデバウンス制御、IME変換制御、
 * および検索確定時の専用カスタムイベント（search-input）発行機能を提供します。
 *
 * @element search-input
 * @fires search-input - 入力完了時（デバウンス後またはクリア時）に発火
 */
@customElement("search-input")
export class SearchInput extends LitElement {
  static styles = unsafeCSS(styles);

  /**
   * プレースホルダー文字列
   * 未指定または空の場合はデフォルト値（"Search..."）が適用されます。
   */
  @property({ type: String })
  placeholder = "";

  /**
   * 現在の入力値
   */
  @property({ type: String })
  value = "";

  /**
   * デバウンス待機時間（ミリ秒）
   * デフォルトは 250ms です。
   */
  @property({ type: Number })
  debounceWait = 250;

  /**
   * スピナー（ローディング表示）の最低表示時間（ミリ秒）
   * 高速なインメモリ検索やローカルDB検索時の一瞬のチラつきを防ぎ、視認性を担保します。
   * デフォルトは 300ms です。
   */
  @property({ type: Number })
  minLoadingDuration = 300;

  /**
   * 検索中ローディング状態フラグ
   * true の場合、虫眼鏡アイコンの代わりにスピナーが表示されます。
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * 入力欄のサイズ
   */
  @property({ type: String })
  size: SearchInputSize = "s";

  /**
   * 日本語などのIME入力（変換中）フラグ
   */
  @state()
  private _isComposing = false;

  /**
   * デバウンス待機中および最低表示時間の内部ローディング状態フラグ
   */
  @state()
  private _isDebounceLoading = false;

  /**
   * 現在デバウンスの待機中かどうかのフラグ
   */
  private _isWaitingDebounce = false;

  /**
   * ローディング表示を開始した時刻（ミリ秒タイムスタンプ）
   */
  private _loadingStartTime: number | null = null;

  /**
   * 最低表示時間完了を待つタイマーID
   */
  private _minDurationTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 内部デバウンス実行関数インスタンス
   */
  private _debouncedSearch: DebouncedFunction<(val: string) => void> | null = null;
  private _currentWait = 0;

  constructor() {
    super();
    this._initDebounce();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._debouncedSearch?.cancel();
    this._stopLoading();
  }

  /**
   * ローディング表示を開始する
   */
  private _startLoading(): void {
    this._isDebounceLoading = true;
    this._isWaitingDebounce = true;
    if (this._loadingStartTime === null) {
      this._loadingStartTime = Date.now();
    }
  }

  /**
   * デバウンス完了後に最低表示時間を考慮してローディング終了をスケジュールする
  /**
   * 最低表示時間タイマーを安全に停止・リセットする
   */
  private _clearMinDurationTimer(): void {
    if (this._minDurationTimer) {
      clearTimeout(this._minDurationTimer);
      this._minDurationTimer = null;
    }
  }

  /**
   * デバウンス完了後に最低表示時間を考慮してローディング終了をスケジュールする
   */
  private _scheduleLoadingEnd(): void {
    if (this._isWaitingDebounce) {
      return;
    }

    this._clearMinDurationTimer();

    const elapsed =
      this._loadingStartTime !== null ? Date.now() - this._loadingStartTime : 0;
    const remaining = Math.max(0, this.minLoadingDuration - elapsed);

    if (remaining > 0) {
      this._minDurationTimer = setTimeout(() => {
        this._stopLoading();
      }, remaining);
    } else {
      this._stopLoading();
    }
  }

  /**
   * ローディング状態を即時終了・リセットする
   */
  private _stopLoading(): void {
    this._clearMinDurationTimer();
    this._isDebounceLoading = false;
    this._isWaitingDebounce = false;
    this._loadingStartTime = null;
  }

  /**
   * デバウンス待機時間の変更を検知してデバウンス関数を再初期化する
   */
  private _initDebounce(): void {
    if (this._debouncedSearch && this._currentWait === this.debounceWait) {
      return;
    }
    this._debouncedSearch?.cancel();
    this._currentWait = this.debounceWait;
    this._debouncedSearch = debounce((val: string) => {
      this._isWaitingDebounce = false;
      this._emitSearch(val);
      this._scheduleLoadingEnd();
    }, this.debounceWait);
  }

  /**
   * 検索確定カスタムイベント（search-input）を発行する
   */
  private _emitSearch(val: string): void {
    dispatchCustomEvent<SearchInputEventDetail>(this, "search-input", {
      detail: {
        value: val,
        keyword: val.trim(),
      },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
  }

  /**
   * IME変換開始イベントハンドラー
   */
  handleCompositionStart = (): void => {
    this._isComposing = true;
  };

  /**
   * IME変換確定イベントハンドラー
   */
  handleCompositionEnd = (e: CompositionEvent): void => {
    this._isComposing = false;
    const target = e.target as HTMLInputElement | null;
    const val = target?.value ?? "";
    this.value = val;
    if (val !== "") {
      this._startLoading();
    }
    this._initDebounce();
    this._debouncedSearch?.(val);
  };

  /**
   * 入力イベントハンドラー
   */
  handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement | null;
    const val = target?.value ?? "";
    this.value = val;

    // 空文字（クリア操作等）の場合は待機せずに即座に発火し、ローディングも即時停止
    if (val === "") {
      this._debouncedSearch?.cancel();
      this._stopLoading();
      this._emitSearch(val);
      return;
    }

    // IME変換中は発火およびローディング表示をスキップ
    if (this._isComposing) {
      return;
    }

    this._startLoading();
    this._initDebounce();
    this._debouncedSearch?.(val);
  };

  override render(): HTMLTemplateResult {
    const effectivePlaceholder = this.placeholder || "Search...";
    const isLoading = this.loading || this._isDebounceLoading;

    return html`
      <wa-input
        class="search-input"
        size=${normalizeWaSize(this.size)}
        placeholder=${effectivePlaceholder}
        .value=${this.value}
        with-clear
        @input=${this.handleInput}
        @compositionstart=${this.handleCompositionStart}
        @compositionend=${this.handleCompositionEnd}
      >
        ${isLoading
          ? html`<wa-spinner
              slot="start"
              class="search-input__spinner"
            ></wa-spinner>`
          : html`<wa-icon
              slot="start"
              class="search-input__icon"
              library="my-icons"
              name="magnifying-glass-solid-full"
            ></wa-icon>`}
      </wa-input>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "search-input": SearchInput;
  }
}
