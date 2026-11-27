import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import {
  DatePickerInput,
  type DatePickerChangeEventDetail,
} from "./datepicker-input";

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
 *    - 1-7. 選択中の日付セルに、ホバー時にクリア案内を行う wa-tooltip（trigger="hover"）が付与され、「クリックして日付をクリア」と表示されること
 *    - 1-8. required: true が設定されている場合、選択中の日付セルにクリア案内の wa-tooltip が付与されないこと
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
 *    - 2-9. label プロパティが未指定の場合、wa-input に label 属性が付与されず、空ラベルによる上部余白が発生しないこと
 *    - 2-10. borderless プロパティ（デフォルト false）をサポートし、true を設定可能なこと
 *    - 2-11. icon プロパティ（デフォルト "calendar-solid-full"）をサポートし、指定したアイコン名が wa-icon に反映されること
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
 *    - 4-4. 選択中の日付セル（現在の value と一致する日付）を再クリックした際、required が false であれば value が空文字 "" にクリアされること
 *    - 4-5. 選択中の日付セルを再クリックしてクリアされた際、専用カスタムイベント datepicker-change が発火し、detail に { value: "", date: null } が渡されること
 *    - 4-6. required: true が設定されている場合、選択中の日付セルを再クリックしてもクリアされず日付選択状態（value）が維持されること
 *    - 4-7. clearable: false が設定されている場合、選択中の日付セルを再クリックしてもクリアされず日付選択状態（value）が維持されること
 *    - 4-8. handleClear を直接呼び出した際、value が空文字にクリアされ datepicker-change イベントが発火すること
 *
 * 5. SCSSスタイル設計規約（SCSS / BEM）
 *    - 5-1. SCSSスタイルシートが存在し、ルートブロック .datepicker-input および .datepicker-calendar の簡易BEMセレクタが定義されていること
 *    - 5-2. SCSSスタイルシートにおいて!important宣言が一切存在しないこと（0箇所であること）
 *    - 5-3. SCSSスタイルシートにおいてセレクタの深すぎるネスト（3階層以上）が存在せず、最大2階層に平坦化されていること
 *    - 5-4. SCSSスタイルシートにおいて :host の display が block に設定され、インラインブロックによる不要な上部余白が抑止されていること
 *    - 5-5. SCSSスタイルシートにおいて :host([borderless]) が定義され、--wa-form-control-border-color: transparent および --wa-form-control-background-color: transparent が設定されていること
 *    - 5-6. 年月ビュー切替用の簡易BEMセレクタ（.datepicker-calendar__months / __years / __eras / __year-jump）が定義されていること
 *    - 5-7. 狭い表示領域（Side Panel 等）でもヘッダーの西暦年月と和暦年が折り返さないよう、.datepicker-popover::part(body) のコンパクトパディング、レスポンシブ幅、&__title の white-space: nowrap、&__actions の flex-shrink: 0 が定義されていること
 *
 * 7. 年・月ビュー切替およびクイックジャンプ操作（View Switching & Quick Jump）
 *    - 7-1. 日ビューでヘッダー年月タイトルクリック（handleTitleClick）により月選択ビューへ切り替わり、1月〜12月の12セルが表示されること
 *    - 7-2. 月選択ビューで月セルを選択（handleMonthSelect）すると表示月が更新され日ビューへ戻ること
 *    - 7-3. 月選択ビューでヘッダー年タイトルクリック（handleTitleClick）により年選択ビューへ切り替わり、12年分の年セル（和暦併記）が表示されること
 *    - 7-4. 年選択ビューで前・次の12年移動（handlePrevYearRange / handleNextYearRange）により表示年範囲が12年単位で切り替わること
 *    - 7-5. 年選択ビューに元号クイックジャンプボタン（令和・平成・昭和・大正・明治）が表示され、クリック（handleEraJump）で該当元号の開始年から12年が表示されること
 *    - 7-6. 年選択ビューで年セルを選択（handleYearSelect）すると表示年が更新され月選択ビューへ遷移すること
 *    - 7-7. 年選択ビューに西暦年の直接入力欄が表示され、有効な年（全角含む）を入力して確定（handleYearJumpSubmit）すると該当年の月選択ビューへジャンプすること
 *    - 7-8. 西暦年の直接入力に無効な値を指定して確定した場合、エラーメッセージが表示され年選択ビューにとどまること
 *    - 7-9. 年選択ビューまたは月選択ビューから当日操作（handleToday）を実行すると現在年月の日ビューへ戻ること
 *    - 7-10. ポップオーバー終了（handlePopoverAfterHide）時にビュー状態が日ビューへリセットされ、入力バッファ・エラーがクリアされること
 *    - 7-11. ビュー切替や元号ジャンプ用の wa-tooltip にすべて trigger="hover" が指定されていること
 *    - 7-12. 子要素（wa-tooltip 等）からバブリングした wa-after-hide イベント（target !== currentTarget）では、年選択ビュー・月選択ビューが解除されないこと
 */

describe("DatePickerInput Component", () => {
  let element: DatePickerInput;

  beforeEach(() => {
    element = new DatePickerInput();
    element.value = "2026-04-15";
  });

  describe("1. 基本構造およびレンダリング（Basic Rendering & Structure）", () => {
    it('1-1. wa-input がルート入力要素としてレンダリングされ、slot="start" にカレンダーアイコンが配置されていること', () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-input");
      expect(rendered).toContain('slot="start"');
      expect(rendered).toContain('name="calendar-solid-full"');
    });

    it('1-2. wa-popover がレンダリングされ、placement="bottom-start" およびトリガー入力欄への連動設定がなされていること', () => {
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

    it('1-6. wa-input に exportparts="form-control-label, label, input" が指定され、外側からのスタイリングが可能であること', () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain(
        'exportparts="form-control-label, label, input"',
      );
    });

    it('1-7. 選択中の日付セルに、ホバー時にクリア案内を行う wa-tooltip（trigger="hover"）が付与され、「クリックして日付をクリア」と表示されること', () => {
      element.value = "2026-04-15";
      element.required = false;
      const rendered = flattenTemplate(element.render());
      expect(rendered).toMatch(
        /<wa-tooltip[^>]*trigger=["']hover["'][^>]*>\s*クリックして日付をクリア\s*<\/wa-tooltip\s*>/,
      );
    });

    it("1-8. required: true が設定されている場合、選択中の日付セルにクリア案内の wa-tooltip が付与されないこと", () => {
      element.value = "2026-04-15";
      element.required = true;
      const rendered = flattenTemplate(element.render());
      expect(rendered).not.toContain("クリックして日付をクリア");
    });
  });

  describe("2. プロパティ・フォーマット・初期表示（Properties & Formatting）", () => {
    it('2-1. value に指定された日付（例: "2026-04-15"）が入力欄にフォーマット（"2026-04-15 (水)"）されて反映されること', () => {
      element.value = "2026-04-15";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2026-04-15 (水)");
    });

    it('2-2. size プロパティ（"s", "m", "l"）が wa-input の size 属性へ反映されること', () => {
      element.size = "s";
      let rendered = flattenTemplate(element.render());
      expect(rendered).toMatch(/size=["']?s["']?/);

      element.size = "large";
      rendered = flattenTemplate(element.render());
      expect(rendered).toMatch(/size=["']?l["']?/);
    });

    it('2-3. 現在年月表示に和暦（例: "2026年4月 (令和8年)"）が含まれていること', () => {
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

    it("2-9. label プロパティが未指定の場合、wa-input に label 属性が付与されず、空ラベルによる上部余白が発生しないこと", () => {
      element.label = undefined;
      const rendered = flattenTemplate(element.render());
      expect(rendered).not.toContain('label=""');
      expect(rendered).not.toContain("label=''");
      expect(rendered).not.toMatch(/<wa-input[^>]*\blabel=/);
    });

    it("2-10. borderless プロパティ（デフォルト false）をサポートし、true を設定可能なこと", () => {
      expect(element.borderless).toBe(false);
      element.borderless = true;
      expect(element.borderless).toBe(true);
    });

    it('2-11. icon プロパティ（デフォルト "calendar-solid-full"）をサポートし、指定したアイコン名が wa-icon に反映されること', () => {
      expect(element.icon).toBe("calendar-solid-full");
      let rendered = flattenTemplate(element.render());
      expect(rendered).toContain('name="calendar-solid-full"');

      element.icon = "fire-solid-full";
      rendered = flattenTemplate(element.render());
      expect(rendered).toContain('name="fire-solid-full"');
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
    it('4-1. 日付セルクリック（handleDateClick）時に value が選択された日付（"yyyy-MM-dd"）に更新されること', () => {
      element.handleDateClick("2026-05-20");
      expect(element.value).toBe("2026-05-20");
    });

    it("4-2. 日付セルクリック時に専用カスタムイベント datepicker-change が発火し、detail に { value, date } が渡されること", () => {
      const listener = vi.fn();
      element.addEventListener("datepicker-change", listener);

      element.handleDateClick("2026-05-20");

      expect(listener).toHaveBeenCalledTimes(1);
      const customEvent = listener.mock
        .calls[0][0] as CustomEvent<DatePickerChangeEventDetail>;
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

    it('4-4. 選択中の日付セル（現在の value と一致する日付）を再クリックした際、required が false であれば value が空文字 "" にクリアされること', () => {
      element.value = "2026-04-15";
      element.required = false;

      element.handleDateClick("2026-04-15");

      expect(element.value).toBe("");
    });

    it('4-5. 選択中の日付セルを再クリックしてクリアされた際、専用カスタムイベント datepicker-change が発火し、detail に { value: "", date: null } が渡されること', () => {
      element.value = "2026-04-15";
      element.required = false;
      const listener = vi.fn();
      element.addEventListener("datepicker-change", listener);

      element.handleDateClick("2026-04-15");

      expect(listener).toHaveBeenCalledTimes(1);
      const customEvent = listener.mock
        .calls[0][0] as CustomEvent<DatePickerChangeEventDetail>;
      expect(customEvent.detail.value).toBe("");
      expect(customEvent.detail.date).toBeNull();
    });

    it("4-6. required: true が設定されている場合、選択中の日付セルを再クリックしてもクリアされず日付選択状態（value）が維持されること", () => {
      element.value = "2026-04-15";
      element.required = true;

      element.handleDateClick("2026-04-15");

      expect(element.value).toBe("2026-04-15");
    });

    it("4-7. clearable: false が設定されている場合、選択中の日付セルを再クリックしてもクリアされず日付選択状態（value）が維持されること", () => {
      element.value = "2026-04-15";
      element.required = false;
      (element as unknown as { clearable: boolean }).clearable = false;

      element.handleDateClick("2026-04-15");

      expect(element.value).toBe("2026-04-15");
    });

    it("4-8. handleClear を直接呼び出した際、value が空文字にクリアされ datepicker-change イベントが発火すること", () => {
      element.value = "2026-04-15";
      element.required = false;
      const listener = vi.fn();
      element.addEventListener("datepicker-change", listener);

      (element as unknown as { handleClear: () => void }).handleClear();

      expect(element.value).toBe("");
      expect(listener).toHaveBeenCalledTimes(1);
      const customEvent = listener.mock
        .calls[0][0] as CustomEvent<DatePickerChangeEventDetail>;
      expect(customEvent.detail.value).toBe("");
      expect(customEvent.detail.date).toBeNull();
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

    it("5-4. SCSSスタイルシートにおいて :host の display が block に設定され、インラインブロックによる不要な上部余白が抑止されていること", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toMatch(/:host\s*\{[^}]*\bdisplay:\s*block;/);
      expect(scssContent).not.toMatch(
        /:host\s*\{[^}]*\bdisplay:\s*inline-block;/,
      );
    });

    it("5-5. SCSSスタイルシートにおいて :host([borderless]) が定義され、--wa-form-control-border-color: transparent および --wa-form-control-background-color: transparent が設定されていること", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toMatch(
        /:host\(\[borderless\]\)\s*\{[^}]*--wa-form-control-border-color:\s*transparent;[^}]*--wa-form-control-background-color:\s*transparent;/,
      );
    });

    it("5-6. 年月ビュー切替用の簡易BEMセレクタ（__months / __years / __eras / __year-jump）が定義されていること", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain("&__months");
      expect(scssContent).toContain("&__years");
      expect(scssContent).toContain("&__eras");
      expect(scssContent).toContain("&__year-jump");
    });

    it("5-7. 狭い表示領域（Side Panel 等）でもヘッダーの西暦年月と和暦年が折り返さないよう、.datepicker-popover::part(body) のコンパクトパディング、レスポンシブ幅、&__title の white-space: nowrap、&__actions の flex-shrink: 0 が定義されていること", () => {
      const scssPath = new URL("./datepicker-input.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain('class="datepicker-popover"');
      expect(scssContent).toMatch(/\.datepicker-popover::part\(body\)/);
      expect(scssContent).toMatch(/width:\s*min\(320px,/);
      expect(scssContent).toMatch(/&__title\s*\{[^}]*white-space:\s*nowrap;/);
      expect(scssContent).toMatch(/&__actions\s*\{[^}]*flex-shrink:\s*0;/);
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

  describe("7. 年・月ビュー切替およびクイックジャンプ操作（View Switching & Quick Jump）", () => {
    it("7-1. 日ビューでヘッダー年月タイトルクリック（handleTitleClick）により月選択ビューへ切り替わり、1月〜12月の12セルが表示されること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__months");
      expect(rendered).toContain("2026年");
      expect(rendered).toContain("令和8年");
      const monthMatches = rendered.match(/data-month=/g) || [];
      expect(monthMatches.length).toBe(12);
      expect(rendered).toContain("1月");
      expect(rendered).toContain("12月");
    });

    it("7-2. 月選択ビューで月セルを選択（handleMonthSelect）すると表示月が更新され日ビューへ戻ること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleMonthSelect(11);
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__grid");
      expect(rendered).toContain("2026年11月");
      expect(rendered).not.toContain("datepicker-calendar__months");
    });

    it("7-3. 月選択ビューでヘッダー年タイトルクリック（handleTitleClick）により年選択ビューへ切り替わり、12年分の年セル（和暦併記）が表示されること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__years");
      expect(rendered).toContain("2020年 - 2031年");
      const yearMatches = rendered.match(/data-year=/g) || [];
      expect(yearMatches.length).toBe(12);
      expect(rendered).toContain("2026");
      expect(rendered).toContain("令和8年");
    });

    it("7-4. 年選択ビューで前・次の12年移動（handlePrevYearRange / handleNextYearRange）により表示年範囲が12年単位で切り替わること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();

      element.handlePrevYearRange();
      let rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2008年 - 2019年");

      element.handleNextYearRange();
      element.handleNextYearRange();
      rendered = flattenTemplate(element.render());
      expect(rendered).toContain("2032年 - 2043年");
    });

    it("7-5. 年選択ビューに元号クイックジャンプボタン（令和・平成・昭和・大正・明治）が表示され、クリック（handleEraJump）で該当元号の開始年から12年が表示されること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();
      let rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__eras");
      for (const era of ["令和", "平成", "昭和", "大正", "明治"]) {
        expect(rendered).toContain(era);
      }

      element.handleEraJump(1926);
      rendered = flattenTemplate(element.render());
      expect(rendered).toContain("1926年 - 1937年");
      expect(rendered).toContain("昭和");
    });

    it("7-6. 年選択ビューで年セルを選択（handleYearSelect）すると表示年が更新され月選択ビューへ遷移すること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();
      element.handleYearSelect(1985);
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__months");
      expect(rendered).toContain("1985年");
      expect(rendered).toContain("昭和60年");
    });

    it("7-7. 年選択ビューに西暦年の直接入力欄が表示され、有効な年（全角含む）を入力して確定（handleYearJumpSubmit）すると該当年の月選択ビューへジャンプすること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();
      let rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__year-jump");
      expect(rendered).toContain("datepicker-calendar__year-input");

      element.handleYearJumpInput("１９７５");
      element.handleYearJumpSubmit();
      rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__months");
      expect(rendered).toContain("1975年");
      expect(rendered).toContain("昭和50年");
    });

    it("7-8. 西暦年の直接入力に無効な値を指定して確定した場合、エラーメッセージが表示され年選択ビューにとどまること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();

      element.handleYearJumpInput("abc");
      element.handleYearJumpSubmit();
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__years");
      expect(rendered).toContain("datepicker-calendar__year-error");
      expect(rendered).toContain("1〜9999の西暦年を入力してください");
    });

    it("7-9. 年選択ビューまたは月選択ビューから当日操作（handleToday）を実行すると現在年月の日ビューへ戻ること", () => {
      element.value = "1985-04-15";
      element.handleTitleClick();
      element.handleTitleClick();

      element.handleToday();
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__grid");
      expect(rendered).toContain(currentYearMonth);
    });

    it("7-10. ポップオーバー終了（handlePopoverAfterHide）時にビュー状態が日ビューへリセットされ、入力バッファ・エラーがクリアされること", () => {
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();
      element.handleYearJumpInput("abc");
      element.handleYearJumpSubmit();

      element.handlePopoverAfterHide();
      const rendered = flattenTemplate(element.render());

      expect(rendered).toContain("datepicker-calendar__grid");
      expect(rendered).not.toContain("datepicker-calendar__years");
      expect(rendered).not.toContain("datepicker-calendar__year-error");
    });

    it('7-11. 日・月・年の各ビューに含まれるすべての wa-tooltip に trigger="hover" が指定されていること', () => {
      const checkAllTooltipsHaveHoverTrigger = (rendered: string) => {
        const tooltips = rendered.match(/<wa-tooltip[^>]*>/g) || [];
        expect(tooltips.length).toBeGreaterThan(0);
        for (const tag of tooltips) {
          expect(tag).toMatch(/trigger=["']hover["']/);
        }
      };

      element.value = "2026-04-15";
      checkAllTooltipsHaveHoverTrigger(flattenTemplate(element.render()));

      element.handleTitleClick();
      checkAllTooltipsHaveHoverTrigger(flattenTemplate(element.render()));

      element.handleTitleClick();
      checkAllTooltipsHaveHoverTrigger(flattenTemplate(element.render()));
    });

    it("7-12. 子要素（wa-tooltip 等）からバブリングした wa-after-hide イベント（target !== currentTarget）では、年選択ビュー・月選択ビューが解除されないこと", () => {
      const popoverTarget = new EventTarget();
      const tooltipTarget = new EventTarget();
      const bubbledEvent = {
        target: tooltipTarget,
        currentTarget: popoverTarget,
      } as unknown as Event;

      // 年選択ビューで子要素の wa-after-hide がバブリングした場合
      element.value = "2026-04-15";
      element.handleTitleClick();
      element.handleTitleClick();
      element.handlePopoverAfterHide(bubbledEvent);
      let rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__years");

      // 月選択ビューで子要素の wa-after-hide がバブリングした場合
      element.handleTitleClick();
      element.handlePopoverAfterHide(bubbledEvent);
      rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__months");

      // wa-popover 自身からの wa-after-hide（target === currentTarget）では日ビューへリセットされること
      const popoverOwnEvent = {
        target: popoverTarget,
        currentTarget: popoverTarget,
      } as unknown as Event;
      element.handlePopoverAfterHide(popoverOwnEvent);
      rendered = flattenTemplate(element.render());
      expect(rendered).toContain("datepicker-calendar__grid");
      expect(rendered).not.toContain("datepicker-calendar__months");
    });
  });
});
