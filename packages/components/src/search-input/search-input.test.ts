import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SearchInput } from "./search-input";

/**
 * 【SearchInput 仕様 (共通検索入力コンポーネント実装)】
 *
 * 1. レンダリングおよびプロパティ設定仕様
 *    - 1-1. wa-input がルート入力要素としてレンダリングされること
 *    - 1-2. slot="start" に虫眼鏡アイコン（wa-icon[name="magnifying-glass-solid-full"]）がレンダリングされること
 *    - 1-3. wa-input に常時 with-clear 属性が設定されていること
 *    - 1-4. placeholder が未指定または空の場合、適切な英文のデフォルト値（"Search..."）が出力されること
 *    - 1-5. placeholder が明示的に指定された場合、その文字列が wa-input の placeholder 属性に反映されること
 *    - 1-6. value プロパティに指定された文字列が wa-input の value に反映されること
 *    - 1-7. loading が true の場合、slot="start" にローディング表示（wa-spinner）がレンダリングされること
 *
 * 2. 入力処理およびデバウンス仕様
 *    - 2-1. 入力イベント（handleInput）発生時、指定された debounceWait（ミリ秒）経過後にカスタムイベントが発火すること
 *    - 2-2. 連続入力時、最後の入力から debounceWait 経過するまでイベント発火が遅延（デバウンス）されること
 *    - 2-3. disconnectedCallback 呼び出し時、待機中のデバウンス処理がキャンセルされること
 *
 * 3. IME変換（日本語入力等）制御仕様
 *    - 3-1. compositionstart 発生中（日本語変換中）は、入力イベントが発生してもデバウンス検索が開始されないこと
 *    - 3-2. compositionend 発生（変換確定）時に、確定された入力値でデバウンス処理が開始されること
 *
 * 4. 専用カスタムイベント発行仕様
 *    - 4-1. 入力確定時、標準の input/change と区別可能な専用カスタムイベント（search-input）が発火すること
 *    - 4-2. search-input イベントの detail に検索キーワード（keyword / value）が含まれること
 *    - 4-3. search-input イベントは bubbles: true, composed: true で発火され、Shadow DOM 境界を越えて伝播すること
 *    - 4-4. クリア操作（値が空になった場合）時、直ちに空文字の search-input イベントが発火すること
 *
 * 5. 入力連動ローディング表示および最低表示時間制御仕様
 *    - 5-1. 文字入力時（handleInput）、即座にスピナー表示状態（wa-spinner）になること
 *    - 5-2. デバウンス待機時間（250ms）中に入力値が更新されても、スピナー表示状態が維持されること
 *    - 5-3. デバウンス完了（250ms経過）後も、最低表示時間（minLoadingDuration: 300ms）が経過するまではスピナー表示状態が維持されること
 *    - 5-4. 最低表示時間（minLoadingDuration: 300ms）経過後、自動的にスピナーが非表示になり虫眼鏡アイコンに復帰すること
 *    - 5-5. 連続入力時、デバウンス完了（450ms）までスピナー表示が維持され、完了後に復帰すること
 *    - 5-6. クリア操作（空文字入力）時、待機なしで即座にスピナーが非表示となり虫眼鏡アイコンが表示されること
 *    - 5-7. 日本語（IME）変換中はスピナーが表示されず、変換確定時に入力値でスピナー表示およびデバウンスが開始されること
 *    - 5-8. 外部から明示的に loading プロパティが true に指定されている場合、内部タイマー終了後もスピナー表示が維持されること
 *    - 5-9. disconnectedCallback 呼び出し時、待機中のローディングタイマーが安全にクリアされること
 */

describe("SearchInput Component", () => {
  let element: SearchInput;

  beforeEach(() => {
    vi.useFakeTimers();
    element = new SearchInput();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. レンダリングおよびプロパティ設定仕様", () => {
    it("1-1. wa-input がルート入力要素としてレンダリングされること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-input");
    });

    it("1-2. slot=\"start\" に虫眼鏡アイコン（wa-icon[name=\"magnifying-glass-solid-full\"]）がレンダリングされること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain('slot="start"');
      expect(rendered).toContain('name="magnifying-glass-solid-full"');
    });

    it("1-3. wa-input に常時 with-clear 属性が設定されていること", () => {
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("with-clear");
    });

    it("1-4. placeholder が未指定または空の場合、適切な英文のデフォルト値（\"Search...\"）が出力されること", () => {
      element.placeholder = "";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("placeholder=Search...");
    });

    it("1-5. placeholder が明示的に指定された場合、その文字列が wa-input の placeholder 属性に反映されること", () => {
      element.placeholder = "Filter labels...";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("placeholder=Filter labels...");
    });

    it("1-6. value プロパティに指定された文字列が wa-input の value に反映されること", () => {
      element.value = "テスト検索";
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain(".value=テスト検索");
    });

    it("1-7. loading が true の場合、slot=\"start\" にローディング表示（wa-spinner）がレンダリングされること", () => {
      element.loading = true;
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-spinner");
      expect(rendered).toContain('slot="start"');
      expect(rendered).not.toContain('name="magnifying-glass-solid-full"');
    });
  });

  describe("2. 入力処理およびデバウンス仕様", () => {
    it("2-1. 入力イベント（handleInput）発生時、指定された debounceWait（ミリ秒）経過後にカスタムイベントが発火すること", () => {
      element.debounceWait = 300;
      const eventSpy = vi.fn();
      element.addEventListener("search-input", eventSpy);

      const mockInputEvent = {
        target: { value: "h" },
      } as unknown as Event;

      element.handleInput(mockInputEvent);
      expect(eventSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(eventSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it("2-2. 連続入力時、最後の入力から debounceWait 経過するまでイベント発火が遅延（デバウンス）されること", () => {
      element.debounceWait = 250;
      const eventSpy = vi.fn();
      element.addEventListener("search-input", eventSpy);

      element.handleInput({ target: { value: "he" } } as unknown as Event);
      vi.advanceTimersByTime(100);

      element.handleInput({ target: { value: "hel" } } as unknown as Event);
      vi.advanceTimersByTime(100);

      element.handleInput({ target: { value: "hello" } } as unknown as Event);
      vi.advanceTimersByTime(249);
      expect(eventSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        value: "hello",
        keyword: "hello",
      });
    });

    it("2-3. disconnectedCallback 呼び出し時、待機中のデバウンス処理がキャンセルされること", () => {
      element.debounceWait = 250;
      const eventSpy = vi.fn();
      element.addEventListener("search-input", eventSpy);

      element.handleInput({ target: { value: "cancel-test" } } as unknown as Event);
      element.disconnectedCallback();

      vi.advanceTimersByTime(300);
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe("3. IME変換（日本語入力等）制御仕様", () => {
    it("3-1. compositionstart 発生中（日本語変換中）は、入力イベントが発生してもデバウンス検索が開始されないこと", () => {
      const eventSpy = vi.fn();
      element.addEventListener("search-input", eventSpy);

      element.handleCompositionStart();
      element.handleInput({ target: { value: "とうきょう" } } as unknown as Event);

      vi.advanceTimersByTime(500);
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it("3-2. compositionend 発生（変換確定）時に、確定された入力値でデバウンス処理が開始されること", () => {
      element.debounceWait = 250;
      const eventSpy = vi.fn();
      element.addEventListener("search-input", eventSpy);

      element.handleCompositionStart();
      element.handleInput({ target: { value: "とうきょう" } } as unknown as Event);

      const mockCompositionEndEvent = {
        target: { value: "東京" },
      } as unknown as CompositionEvent;

      element.handleCompositionEnd(mockCompositionEndEvent);
      vi.advanceTimersByTime(250);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        value: "東京",
        keyword: "東京",
      });
    });
  });

  describe("4. 専用カスタムイベント発行仕様", () => {
    it("4-1. 入力確定時、標準の input/change と区別可能な専用カスタムイベント（search-input）が発火すること", () => {
      const searchSpy = vi.fn();
      const standardInputSpy = vi.fn();

      element.addEventListener("search-input", searchSpy);
      element.addEventListener("input", standardInputSpy);

      element.handleInput({ target: { value: "query" } } as unknown as Event);
      vi.advanceTimersByTime(250);

      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(standardInputSpy).not.toHaveBeenCalled();
    });

    it("4-2. search-input イベントの detail に検索キーワード（keyword / value）が含まれること", () => {
      let detailResult: unknown = null;
      element.addEventListener("search-input", ((e: CustomEvent) => {
        detailResult = e.detail;
      }) as EventListener);

      element.handleInput({ target: { value: "  search query  " } } as unknown as Event);
      vi.advanceTimersByTime(250);

      expect(detailResult).toEqual({
        value: "  search query  ",
        keyword: "search query",
      });
    });

    it("4-3. search-input イベントは bubbles: true, composed: true で発火され、Shadow DOM 境界を越えて伝播すること", () => {
      let eventInstance: CustomEvent | null = null;
      element.addEventListener("search-input", ((e: Event) => {
        eventInstance = e as CustomEvent;
      }) as EventListener);

      element.handleInput({ target: { value: "event-test" } } as unknown as Event);
      vi.advanceTimersByTime(250);

      expect(eventInstance).not.toBeNull();
      const customEvt = eventInstance as unknown as CustomEvent;
      expect(customEvt.bubbles).toBe(true);
      expect(customEvt.composed).toBe(true);
    });

    it("4-4. クリア操作（値が空になった場合）時、直ちに空文字の search-input イベントが発火すること", () => {
      element.value = "initial";
      const eventSpy = vi.fn();
      element.addEventListener("search-input", eventSpy);

      // クリアボタン押下（または空文字入力）
      element.handleInput({ target: { value: "" } } as unknown as Event);

      // 空文字の場合はデバウンス待機せず即座に発火する（UX向上のため）
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        value: "",
        keyword: "",
      });
    });
  });

  describe("5. 入力連動ローディング表示および最低表示時間制御仕様", () => {
    it("5-1. 文字入力時（handleInput）、即座にスピナー表示状態（wa-spinner）になること", () => {
      element.handleInput({ target: { value: "a" } } as unknown as Event);
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-spinner");
      expect(rendered).not.toContain('name="magnifying-glass-solid-full"');
    });

    it("5-2. デバウンス待機時間（250ms）中に入力値が更新されても、スピナー表示状態が維持されること", () => {
      element.handleInput({ target: { value: "a" } } as unknown as Event);
      vi.advanceTimersByTime(100);

      element.handleInput({ target: { value: "ab" } } as unknown as Event);
      vi.advanceTimersByTime(100);

      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-spinner");
      expect(rendered).not.toContain('name="magnifying-glass-solid-full"');
    });

    it("5-3. デバウンス完了（250ms経過）後も、最低表示時間（minLoadingDuration: 300ms）が経過するまではスピナー表示状態が維持されること", () => {
      element.debounceWait = 250;
      element.minLoadingDuration = 300;

      element.handleInput({ target: { value: "abc" } } as unknown as Event);

      // デバウンス完了（250ms）時点
      vi.advanceTimersByTime(250);
      const renderedAt250ms = flattenTemplate(element.render());
      expect(renderedAt250ms).toContain("<wa-spinner");
      expect(renderedAt250ms).not.toContain('name="magnifying-glass-solid-full"');

      // 299ms 時点（最低表示時間直前）
      vi.advanceTimersByTime(49);
      const renderedAt299ms = flattenTemplate(element.render());
      expect(renderedAt299ms).toContain("<wa-spinner");
    });

    it("5-4. 最低表示時間（minLoadingDuration: 300ms）経過後、自動的にスピナーが非表示になり虫眼鏡アイコンに復帰すること", () => {
      element.debounceWait = 250;
      element.minLoadingDuration = 300;

      element.handleInput({ target: { value: "abc" } } as unknown as Event);

      // 300ms 経過時点（最低表示時間を満了）
      vi.advanceTimersByTime(300);
      const rendered = flattenTemplate(element.render());
      expect(rendered).not.toContain("<wa-spinner");
      expect(rendered).toContain('name="magnifying-glass-solid-full"');
    });

    it("5-5. 連続入力時、デバウンス完了までスピナー表示が維持され、完了および最低表示時間経過後に復帰すること", () => {
      element.debounceWait = 250;
      element.minLoadingDuration = 300;

      element.handleInput({ target: { value: "a" } } as unknown as Event);
      vi.advanceTimersByTime(200);

      // 200ms 時点で追加打鍵（デバウンスが 450ms まで延長）
      element.handleInput({ target: { value: "ab" } } as unknown as Event);

      // 300ms 時点（最低表示時間は経過しているが、デバウンス待機中）
      vi.advanceTimersByTime(100);
      const renderedAt300ms = flattenTemplate(element.render());
      expect(renderedAt300ms).toContain("<wa-spinner");

      // 450ms 時点（デバウンス完了）
      vi.advanceTimersByTime(150);
      const renderedAt450ms = flattenTemplate(element.render());
      expect(renderedAt450ms).not.toContain("<wa-spinner");
      expect(renderedAt450ms).toContain('name="magnifying-glass-solid-full"');
    });

    it("5-6. クリア操作（空文字入力）時、待機なしで即座にスピナーが非表示となり虫眼鏡アイコンが表示されること", () => {
      element.handleInput({ target: { value: "abc" } } as unknown as Event);
      // クリア操作
      element.handleInput({ target: { value: "" } } as unknown as Event);
      const rendered = flattenTemplate(element.render());
      expect(rendered).not.toContain("<wa-spinner");
      expect(rendered).toContain('name="magnifying-glass-solid-full"');
    });

    it("5-7. 日本語（IME）変換中はスピナーが表示されず、変換確定時に入力値でスピナー表示およびデバウンスが開始されること", () => {
      element.debounceWait = 250;
      element.minLoadingDuration = 300;

      // IME 変換開始
      element.handleCompositionStart();
      element.handleInput({ target: { value: "かんじ" } } as unknown as Event);

      // 変換中はスピナー非表示
      expect(flattenTemplate(element.render())).not.toContain("<wa-spinner");
      expect(flattenTemplate(element.render())).toContain('name="magnifying-glass-solid-full"');

      // IME 確定
      element.handleCompositionEnd({ target: { value: "漢字" } } as unknown as CompositionEvent);

      // 確定直後はスピナー表示
      expect(flattenTemplate(element.render())).toContain("<wa-spinner");

      // 300ms 経過で虫眼鏡アイコンに復帰
      vi.advanceTimersByTime(300);
      expect(flattenTemplate(element.render())).not.toContain("<wa-spinner");
      expect(flattenTemplate(element.render())).toContain('name="magnifying-glass-solid-full"');
    });

    it("5-8. 外部から明示的に loading プロパティが true に指定されている場合、内部タイマー終了後もスピナー表示が維持されること", () => {
      element.loading = true;
      element.debounceWait = 250;
      element.minLoadingDuration = 300;

      element.handleInput({ target: { value: "abc" } } as unknown as Event);
      vi.advanceTimersByTime(500);

      // 内部タイマー終了後も外部の loading が優先されてスピナー維持
      const rendered = flattenTemplate(element.render());
      expect(rendered).toContain("<wa-spinner");
      expect(rendered).not.toContain('name="magnifying-glass-solid-full"');
    });

    it("5-9. disconnectedCallback 呼び出し時、待機中のローディングタイマーが安全にクリアされること", () => {
      element.debounceWait = 250;
      element.minLoadingDuration = 300;

      element.handleInput({ target: { value: "cancel-test" } } as unknown as Event);
      element.disconnectedCallback();

      // エラーなくタイマーが進められること
      expect(() => {
        vi.advanceTimersByTime(500);
      }).not.toThrow();
    });
  });
});

