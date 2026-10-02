import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { DatePickerInput, type DatePickerChangeEventDetail } from "./datepicker-input";

/**
 * 【DatePickerInput 仕様 (共通日付選択コンポーネント実装)】
 *
 * 1. 基本構造およびレンダリング（Basic Rendering & Structure）
 *    - 1-1. wa-input がルート入力要素としてレンダリングされ、slot="start" にカレンダーアイコンが配置されていること
 *    - 1-2. wa-popover がレンダリングされ、placement="bottom-start" およびトリガー入力欄への連動設定がなされていること
 *    - 1-3. カレンダーヘッダー（.datepicker-calendar__header）に年月表示および5つの操作ボタン（前年・前月・当日・翌月・翌年）がレンダリングされること
 *    - 1-4. 曜日ヘッダー（.datepicker-calendar__weekdays）に日〜土の7曜日がレンダリングされること
 *    - 1-5. 日付グリッド（.datepicker-calendar__grid）に42個の日付セルがレンダリングされること
 *    - 1-6. wa-input に exportparts="form-control-label, label, input" が指定され、外側からのスタイリングが可能であること
 *
 * 2. プロパティ・フォーマット・初期表示（Properties & Formatting）
 *    - 2-1. value に指定された日付（例: "2026-04-15"）が入力欄にフォーマット（"2026-04-15 (水)"）されて反映されること
 *    - 2-2. size プロパティ（"s", "m", "l"）が wa-input の size 属性へ反映されること
 *    - 2-3. 現在年月表示に和暦（例: "2026年4月 (令和8年)"）が含まれていること
 *    - 2-4. 選択中の日付セルにアクティブ修飾子（datepicker-calendar__cell--current）が付与されること
 *    - 2-5. 今日の日付セルに当日修飾子（datepicker-calendar__cell--today）が付与されること
 *    - 2-6. 当月以外の日付セルに当月外修飾子（datepicker-calendar__cell--other-month）が付与されること
 *    - 2-7. label プロパティが wa-input の label 属性へ反映されること
 *    - 2-8. required プロパティが wa-input の required 属性へ反映されること
 *
 * 3. カレンダーナビゲーション操作（Navigation Handling）
 *    - 3-1. 前月操作（handlePrevMonth）により表示年月が1ヶ月前へ更新されること
 *    - 3-2. 翌月操作（handleNextMonth）により表示年月が1ヶ月先へ更新されること
 *    - 3-3. 前年操作（handlePrevYear）により表示年月が1年前へ更新されること
 *    - 3-4. 翌年操作（handleNextYear）により表示年月が1年先へ更新されること
 *    - 3-5. 当日操作（handleToday）により表示年月が現在のシステム年月に更新されること
 *
 * 4. 日付選択と専用カスタムイベント発行（Selection & Event Emission）
 *    - 4-1. 日付セルクリック（handleDateClick）時に value が選択された日付（"yyyy-MM-dd"）に更新されること
 *    - 4-2. 日付セルクリック時に専用カスタムイベント datepicker-change が発火し、detail に { value, date } が渡されること
 *    - 4-3. datepicker-change イベントは bubbles: true, composed: true で発火され、Shadow DOM 境界を越えて伝播すること
 *
 * 5. SCSSスタイル設計規約（SCSS / BEM）
 *    - 5-1. SCSSスタイルシートが存在し、ルートブロック .datepicker-input および .datepicker-calendar の簡易BEMセレクタが定義されていること
 *    - 5-2. SCSSスタイルシートにおいて!important宣言が一切存在しないこと（0箇所であること）
 *    - 5-3. SCSSスタイルシートにおいてセレクタの深すぎるネスト（3階層以上）が存在せず、最大2階層に平坦化されていること
 */

describe("DatePickerInput Component", () => {
  let element: DatePickerInput;

  beforeEach(() => {
    element = new DatePickerInput();
    element.value = "2026-04-15";
  });

  describe("1. 基本構造およびレンダリング（Basic Rendering & Structure）", () => {
    it("1-1. wa-input がルート入力要素としてレンダリングされ、slot=\"start\" にカレンダーアイコンが配置されていること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-input");
      expect(rendered).toContain('slot="start"');
      expect(rendered).toContain('name="calendar-solid-full"');
    });

    it("1-2. wa-popover がレンダリングされ、placement=\"bottom-start\" およびトリガー入力欄への連動設定がなされていること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-popover");
      expect(rendered).toContain('placement="bottom-start"');
      expect(rendered).toContain('for="input-date"');
    });

    it("1-3. カレンダーヘッダー（.datepicker-calendar__header）に年月表示および5つの操作ボタン（前年・前月・当日・翌月・翌年）がレンダリングされること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__header");
      expect(rendered).toContain("datepicker-calendar__title");
      expect(rendered).toContain("datepicker-calendar__btn-prev-year");
      expect(rendered).toContain("datepicker-calendar__btn-prev-month");
      expect(rendered).toContain("datepicker-calendar__btn-today");
      expect(rendered).toContain("datepicker-calendar__btn-next-month");
      expect(rendered).toContain("datepicker-calendar__btn-next-year");
    });

    it("1-4. 曜日ヘッダー（.datepicker-calendar__weekdays）に日〜土の7曜日がレンダリングされること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__weekdays");
      expect(rendered).toContain("日");
      expect(rendered).toContain("月");
      expect(rendered).toContain("火");
      expect(rendered).toContain("水");
      expect(rendered).toContain("木");
      expect(rendered).toContain("金");
      expect(rendered).toContain("土");
    });

    it("1-5. 日付グリッド（.datepicker-calendar__grid）に42個の日付セルがレンダリングされること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__grid");
      const matches = rendered.match(/data-date=/g) || [];
      expect(matches.length).toBe(42);
    });

    it("1-6. wa-input に exportparts=\"form-control-label, label, input\" が指定され、外側からのスタイリングが可能であること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain('exportparts="form-control-label, label, input"');
    });
  });

  describe("2. プロパティ・フォーマット・初期表示（Properties & Formatting）", () => {
    it("2-1. value に指定された日付（例: \"2026-04-15\"）が入力欄にフォーマット（\"2026-04-15 (水)\"）されて反映されること", () => {
      element.value = "2026-04-15";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2026-04-15 (水)");
    });

    it("2-2. size プロパティ（\"s\", \"m\", \"l\"）が wa-input の size 属性へ反映されること", () => {
      element.size = "s";
      let rendered = flattenTemplate(element.render());
      expect(rendered).toMatch(/size=["']?s["']?/);

      element.size = "large";
      rendered = flattenTemplate(element.render());
      expect(rendered).toMatch(/size=["']?l["']?/);
    });

    it("2-3. 現在年月表示に和暦（例: \"2026年4月 (令和8年)\"）が含まれていること", () => {
      element.value = "2026-04-15";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2026年4月");
      expect(rendered).toContain("令和8年");
    });

    it("2-4. 選択中の日付セルにアクティブ修飾子（datepicker-calendar__cell--current）が付与されること", () => {
      element.value = "2026-04-15";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__cell--current");
    });

    it("2-5. 今日の日付セルに当日修飾子（datepicker-calendar__cell--today）が付与されること", () => {
      element.handleToday();
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__cell--today");
    });

    it("2-6. 当月以外の日付セルに当月外修飾子（datepicker-calendar__cell--other-month）が付与されること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__cell--other-month");
    });

    it("2-7. label プロパティが wa-input の label 属性へ反映されること", () => {
      element.label = "期日";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toMatch(/label=["']?期日["']?/);
    });

    it("2-8. required プロパティが wa-input の required 属性へ反映されること", () => {
      element.required = true;
      let rendered = flattenTemplate(element.render());
      expect(rendered).toContain("required");

      element.required = false;
      rendered = flattenTemplate(element.render());
      expect(rendered).not.toContain("required");
    });
  });

  describe("3. カレンダーナビゲーション操作（Navigation Handling）", () => {
    it("3-1. 前月操作（handlePrevMonth）により表示年月が1ヶ月前へ更新されること", () => {
      element.value = "2026-04-15";
      element.handlePrevMonth();
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2026年3月");
    });

    it("3-2. 翌月操作（handleNextMonth）により表示年月が1ヶ月先へ更新されること", () => {
      element.value = "2026-04-15";
      element.handleNextMonth();
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2026年5月");
    });

    it("3-3. 前年操作（handlePrevYear）により表示年月が1年前へ更新されること", () => {
      element.value = "2026-04-15";
      element.handlePrevYear();
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2025年4月");
    });

    it("3-4. 翌年操作（handleNextYear）により表示年月が1年先へ更新されること", () => {
      element.value = "2026-04-15";
      element.handleNextYear();
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2027年4月");
    });

    it("3-5. 当日操作（handleToday）により表示年月が現在のシステム年月に更新されること", () => {
      element.value = "2020-01-01";
      element.handleToday();
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain(currentYearMonth);
    });
  });

  describe("4. 日付選択と専用カスタムイベント発行（Selection & Event Emission）", () => {
    it("4-1. 日付セルクリック（handleDateClick）時に value が選択された日付（\"yyyy-MM-dd\"）に更新されること", () => {
      element.handleDateClick("2026-05-20");
      expect(element.value).toBe("2026-05-20");
    });

    it("4-2. 日付セルクリック時に専用カスタムイベント datepicker-change が発火し、detail に { value, date } が渡されること", () => {
      const listener = vi.fn();
      element.addEventListener("datepicker-change", listener);

      element.handleDateClick("2026-05-20");

      expect(listener).toHaveBeenCalledTimes(1);
      const customEvent = listener.mock.calls[0][0] as CustomEvent<DatePickerChangeEventDetail>;
      expect(customEvent.detail.value).toBe("2026-05-20");
      expect(customEvent.detail.date).toBeInstanceOf(Date);
      expect(customEvent.detail.date?.getFullYear()).toBe(2026);
      expect(customEvent.detail.date?.getMonth()).toBe(4); // 5月 (0-indexed)
      expect(customEvent.detail.date?.getDate()).toBe(20);
    });

    it("4-3. datepicker-change イベントは bubbles: true, composed: true で発火され、Shadow DOM 境界を越えて伝播すること", () => {
      const listener = vi.fn();
      element.addEventListener("datepicker-change", listener);

      element.handleDateClick("2026-05-20");

      const customEvent = listener.mock.calls[0][0] as CustomEvent;
      expect(customEvent.bubbles).toBe(true);
      expect(customEvent.composed).toBe(true);
    });
  });

  describe("5. SCSSスタイル設計規約（SCSS / BEM）", () => {
    it("5-1. SCSSスタイルシートが存在し、ルートブロック .datepicker-input および .datepicker-calendar の簡易BEMセレクタが定義されていること", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      expect(fs.existsSync(scssPath)).toBe(true);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain(".datepicker-input");
      expect(scssContent).toContain(".datepicker-calendar");
      expect(scssContent).toContain("&__header");
      expect(scssContent).toContain("&__grid");
      expect(scssContent).toContain("&__cell");
    });

    it("5-2. SCSSスタイルシートにおいて!important宣言が一切存在しないこと（0箇所であること）", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const matches = scssContent.match(/!important/g) || [];
      expect(matches.length).toBe(0);
    });

    it("5-3. SCSSスタイルシートにおいてセレクタの深すぎるネスト（3階層以上）が存在せず、最大2階層に平坦化されていること", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const lines = scssContent.split("\n");
      let currentNesting = 0;
      let maxNestingOnSelector = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("/*") ||
          trimmed.startsWith("*")
        ) {
          continue;
        }
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        currentNesting += openBraces - closeBraces;
        if (openBraces > 0 && currentNesting > maxNestingOnSelector) {
          maxNestingOnSelector = currentNesting;
        }
      }
      expect(maxNestingOnSelector).toBeLessThanOrEqual(2);
    });
  });

  describe("6. カレンダー描画メソッド分割（renderCalendarHeader / renderCalendarWeekdays / renderCalendarGrid）の検証", () => {
    it("6-1. renderCalendarHeader により年月表示と操作ボタンがレンダリングされること", () => {
      const htmlStr = flattenTemplate(
        (
          element as unknown as { renderCalendarHeader: () => unknown }
        ).renderCalendarHeader(),
      );
      expect(htmlStr).toContain("datepicker-calendar__header");
      expect(htmlStr).toContain("datepicker-calendar__title");
      expect(htmlStr).toContain("datepicker-calendar__actions");
    });

    it("6-2. renderCalendarWeekdays により曜日ヘッダーがレンダリングされること", () => {
      const htmlStr = flattenTemplate(
        (
          element as unknown as { renderCalendarWeekdays: () => unknown }
        ).renderCalendarWeekdays(),
      );
      expect(htmlStr).toContain("datepicker-calendar__weekdays");
    });

    it("6-3. renderCalendarGrid により日付グリッドがレンダリングされること", () => {
      const cells = (
        element as unknown as { getCalendarCells: () => unknown[] }
      ).getCalendarCells();
      const htmlStr = flattenTemplate(
        (
          element as unknown as {
            renderCalendarGrid: (c: unknown[]) => unknown;
          }
        ).renderCalendarGrid(cells),
      );
      expect(htmlStr).toContain("datepicker-calendar__grid");
    });
  });
});
