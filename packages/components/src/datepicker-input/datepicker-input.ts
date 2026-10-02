import {
  LitElement,
  html,
  unsafeCSS,
  type HTMLTemplateResult,
} from "lit";
import { customElement, property, state, query } from "lit/decorators.js";

// Third-party UI (WebAwesome)
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/popover/popover.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import type WaPopover from "@awesome.me/webawesome/dist/components/popover/popover.js";

// Shared Utilities
import {
  dispatchCustomEvent,
  format,
  getJapaneseEraYear,
} from "@shared/utils";

import styles from "./datepicker-input.scss?inline";

/**
 * 日付変更時に発行されるカスタムイベントのペイロード型定義
 */
export interface DatePickerChangeEventDetail {
  /** yyyy-MM-dd 形式の文字列 */
  value: string;
  /** パースされた Date オブジェクト（未選択・クリア時は null） */
  date: Date | null;
}

import {
  normalizeWaSize,
  type ComponentSize,
} from "../utils/size.utils";

export type DatePickerInputSize = ComponentSize;

/**
 * カレンダーグリッドの日付セル情報
 */
interface CalendarCellData {
  year: number;
  month: number;
  day: number;
  dateStr: string;
  isCurrent: boolean;
  isToday: boolean;
  isOtherMonth: boolean;
  isWeekend: boolean;
}

/**
 * カレンダーセルの単一データを構築する純粋ヘルパー関数
 */
function createCalendarCell(
  year: number,
  month: number,
  day: number,
  isOtherMonth: boolean,
  selectedValue: string,
  todayStr: string,
): CalendarCellData {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  return {
    year,
    month,
    day,
    dateStr,
    isCurrent: dateStr === selectedValue,
    isToday: dateStr === todayStr,
    isOtherMonth,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  };
}

const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * 共通日付選択コンポーネント (DatePickerInput)
 *
 * Web Awesome の wa-input と wa-popover をベースとし、
 * 和暦・前年・翌年・当日ジャンプ機能を備えた高機能なカレンダー日付選択を提供します。
 *
 * @element datepicker-input
 * @fires datepicker-change - 日付選択確定時に発火
 */
@customElement("datepicker-input")
export class DatePickerInput extends LitElement {
  static formAssociated = true;
  static styles = unsafeCSS(styles);

  // ブラウザの Form 連携インターフェース
  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    if (typeof this.attachInternals === "function") {
      try {
        this._internals = this.attachInternals();
      } catch {
        this._internals = null;
      }
    }
  }

  private _value: string = "";

  /**
   * 選択中の日付文字列（yyyy-MM-dd 形式）
   */
  @property({ type: String })
  public get value(): string {
    return this._value;
  }

  public set value(val: string) {
    const oldVal = this._value;
    this._value = val;
    if (val) {
      const match = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match) {
        this._currentYear = parseInt(match[1], 10);
        this._currentMonth = parseInt(match[2], 10);
      }
    }
    this.requestUpdate("value", oldVal);
  }

  /**
   * 入力欄のラベル
   */
  @property({ type: String })
  public label?: string;

  /**
   * 必須入力フラグ
   */
  @property({ type: Boolean })
  public required: boolean = false;

  /**
   * 入力欄のサイズ
   */
  @property({ type: String })
  public size: DatePickerInputSize = "m";

  /**
   * プレースホルダー文字列
   */
  @property({ type: String })
  public placeholder: string = "日付を選択...";

  /**
   * 非活性状態フラグ
   */
  @property({ type: Boolean })
  public disabled: boolean = false;

  /**
   * フォーム連携時のフィールド名
   */
  @property({ type: String })
  public name: string = "";

  /**
   * カレンダー表示中の年
   */
  @state()
  private _currentYear: number = new Date().getFullYear();

  /**
   * カレンダー表示中の月（1〜12）
   */
  @state()
  private _currentMonth: number = new Date().getMonth() + 1;

  /**
   * ポップオーバー要素の参照
   */
  @query("#calendar-popover")
  private _calendarPopover?: WaPopover;

  /**
   * 前月へ移動
   */
  public handlePrevMonth = (): void => {
    if (this._currentMonth === 1) {
      this._currentMonth = 12;
      this._currentYear--;
    } else {
      this._currentMonth--;
    }
  };

  /**
   * 翌月へ移動
   */
  public handleNextMonth = (): void => {
    if (this._currentMonth === 12) {
      this._currentMonth = 1;
      this._currentYear++;
    } else {
      this._currentMonth++;
    }
  };

  /**
   * 前年へ移動
   */
  public handlePrevYear = (): void => {
    this._currentYear--;
  };

  /**
   * 翌年へ移動
   */
  public handleNextYear = (): void => {
    this._currentYear++;
  };

  /**
   * カレンダーの表示年月をシステム日付の現在年月にリセットする
   */
  private resetToCurrentYearMonth(): void {
    const today = new Date();
    this._currentYear = today.getFullYear();
    this._currentMonth = today.getMonth() + 1;
  }

  /**
   * 当日へ移動
   */
  public handleToday = (): void => {
    this.resetToCurrentYearMonth();
  };

  /**
   * 日付セルクリック時の選択処理
   */
  public handleDateClick = (dateStr: string): void => {
    if (this.disabled) return;

    this.value = dateStr;
    if (this._internals?.setFormValue) {
      this._internals.setFormValue(dateStr);
    }

    if (this._calendarPopover) {
      this._calendarPopover.open = false;
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);

    dispatchCustomEvent<DatePickerChangeEventDetail>(this, "datepicker-change", {
      detail: {
        value: dateStr,
        date: dateObj,
      },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
  };

  /**
   * 42日分のカレンダーセルデータを算出する
   */
  private getCalendarCells(): CalendarCellData[] {
    const year = this._currentYear;
    const month = this._currentMonth;
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const prevMonthLastDate = new Date(year, month - 1, 0).getDate();
    const currentMonthLastDate = new Date(year, month, 0).getDate();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const cells: CalendarCellData[] = [];

    // 1. 前月分の日付（パディング）
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      cells.push(
        createCalendarCell(prevYear, prevMonth, d, true, this.value, todayStr),
      );
    }

    // 2. 当月分の日付
    for (let d = 1; d <= currentMonthLastDate; d++) {
      cells.push(
        createCalendarCell(year, month, d, false, this.value, todayStr),
      );
    }

    // 3. 翌月分の日付（42個になるまでパディング）
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push(
        createCalendarCell(nextYear, nextMonth, d, true, this.value, todayStr),
      );
    }

    return cells;
  }

  /**
   * 入力欄の表示用テキストを取得する
   */
  private getDisplayValue(): string {
    if (!this.value) return "";
    const match = this.value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return this.value;
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return this.value;
    return format(dateObj, "yyyy-MM-dd (EEE)");
  }

  /**
   * ヘッダー部の年月表示文字列（和暦付き）を取得する
   */
  private getYearMonthTitle(): { western: string; japanese: string } {
    const dateObj = new Date(this._currentYear, this._currentMonth - 1, 1);
    const western = `${this._currentYear}年${this._currentMonth}月`;
    const japanese = getJapaneseEraYear(dateObj);
    return { western, japanese };
  }

  /**
   * 入力欄を描画する
   */
  private renderInput(): HTMLTemplateResult {
    return html`
      <wa-input
        id="input-date"
        exportparts="form-control-label, label, input"
        label=${this.label ?? ""}
        ?required=${this.required}
        size=${normalizeWaSize(this.size)}
        .value=${this.getDisplayValue()}
        placeholder=${this.placeholder}
        ?disabled=${this.disabled}
        readonly
      >
        <wa-icon
          slot="start"
          class="datepicker-input__icon"
          library="my-icons"
          name="calendar-solid-full"
        ></wa-icon>
      </wa-input>
    `;
  }

  /**
   * カレンダーのナビゲーション操作ボタンを描画する
   */
  private renderNavButton(
    id: string,
    label: string,
    icon: string,
    onClick: () => void,
    extraClass: string = "",
  ): HTMLTemplateResult {
    return html`
      <button
        type="button"
        id=${id}
        class="datepicker-calendar__btn ${extraClass}"
        aria-label=${label}
        @click=${onClick}
      >
        <wa-tooltip for=${id}>${label}</wa-tooltip>
        <wa-icon
          class="datepicker-calendar__btn-icon"
          library="my-icons"
          name=${icon}
        ></wa-icon>
      </button>
    `;
  }

  /**
   * カレンダーヘッダー部（年月・和暦および操作ボタン）を描画する
   */
  private renderCalendarHeader(): HTMLTemplateResult {
    const { western, japanese } = this.getYearMonthTitle();

    return html`
      <div class="datepicker-calendar__header">
        <div class="datepicker-calendar__title">
          ${western}<span class="datepicker-calendar__era">(${japanese})</span>
        </div>
        <div class="datepicker-calendar__actions">
          ${this.renderNavButton(
            "btn-prev-year",
            "前年",
            "angles-left-solid-full",
            this.handlePrevYear,
            "datepicker-calendar__btn-prev-year",
          )}
          ${this.renderNavButton(
            "btn-prev-month",
            "前月",
            "angle-left-solid-full",
            this.handlePrevMonth,
            "datepicker-calendar__btn-prev-month",
          )}
          ${this.renderNavButton(
            "btn-today",
            "当日",
            "location-dot-solid-full",
            this.handleToday,
            "datepicker-calendar__btn-today",
          )}
          ${this.renderNavButton(
            "btn-next-month",
            "翌月",
            "angle-right-solid-full",
            this.handleNextMonth,
            "datepicker-calendar__btn-next-month",
          )}
          ${this.renderNavButton(
            "btn-next-year",
            "翌年",
            "angles-right-solid-full",
            this.handleNextYear,
            "datepicker-calendar__btn-next-year",
          )}
        </div>
      </div>
    `;
  }

  /**
   * カレンダーの曜日ヘッダー部を描画する
   */
  private renderCalendarWeekdays(): HTMLTemplateResult {
    return html`
      <div class="datepicker-calendar__weekdays">
        ${WEEKDAY_NAMES.map(
          (w, i) => html`
            <div
              class="datepicker-calendar__weekday ${i === 0 || i === 6
                ? "datepicker-calendar__weekday--weekend"
                : ""}"
            >
              ${w}
            </div>
          `,
        )}
      </div>
    `;
  }

  /**
   * カレンダーの日付グリッド部（42セル）を描画する
   */
  private renderCalendarGrid(cells: CalendarCellData[]): HTMLTemplateResult {
    return html`
      <div class="datepicker-calendar__grid">
        ${cells.map(
          (c) => html`
            <button
              type="button"
              class="datepicker-calendar__cell ${c.isCurrent
                ? "datepicker-calendar__cell--current"
                : ""} ${c.isToday
                ? "datepicker-calendar__cell--today"
                : ""} ${c.isOtherMonth
                ? "datepicker-calendar__cell--other-month"
                : ""} ${c.isWeekend
                ? "datepicker-calendar__cell--weekend"
                : ""}"
              data-date=${c.dateStr}
              aria-label=${c.dateStr}
              aria-selected=${c.isCurrent ? "true" : "false"}
              @click=${() => this.handleDateClick(c.dateStr)}
            >
              ${c.day}
            </button>
          `,
        )}
      </div>
    `;
  }

  /**
   * カレンダーポップオーバーを描画する
   */
  private renderCalendar(): HTMLTemplateResult {
    const cells = this.getCalendarCells();

    return html`
      <wa-popover
        id="calendar-popover"
        for="input-date"
        placement="bottom-start"
      >
        <div class="datepicker-calendar">
          ${this.renderCalendarHeader()}
          <wa-divider class="datepicker-calendar__divider"></wa-divider>
          ${this.renderCalendarWeekdays()}
          ${this.renderCalendarGrid(cells)}
        </div>
      </wa-popover>
    `;
  }

  override render(): HTMLTemplateResult {
    return html`
      <div class="datepicker-input">
        ${this.renderInput()} ${this.renderCalendar()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "datepicker-input": DatePickerInput;
  }
}
