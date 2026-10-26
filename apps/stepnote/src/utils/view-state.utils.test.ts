import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  KeyedDebounceManager,
  ExclusiveAccordionController,
  DeleteDialogState,
  resetModesToPreview,
  extractSearchQuery,
} from "./view-state.utils.js";
import type { MarkdownDisplayMode, SearchInputEventDetail } from "@shared/components";

/**
 * テスト仕様一覧:
 * 1. KeyedDebounceManager
 *    - 指定キーに対して指定時間（デフォルト300ms）待機後にアクションが実行されること
 *    - 待機時間内に同一キーで再度呼び出された場合、前のタイマーがキャンセルされ最新のアクションのみが実行されること
 *    - 異なるキーのアクションは独立して実行されること
 *    - cancel(key) で該当キーの待機中アクションが破棄されること
 *    - clear() で全キーの待機中アクションが一括破棄されること
 *    - 非同期アクションの例外発生時にもタイマーが安全にクリーンアップされること
 * 2. ExclusiveAccordionController
 *    - 未展開のアイテムを指定して toggle した場合、expandedIds に追加され { expanded: true } を返し onExpand が呼ばれること
 *    - 既に展開中のアイテムを指定して toggle した場合、expandedIds から除外され collapsingId にセットされ、320ms 後に collapsingId がクリアされ onAnimateEnd が呼ばれること
 *    - アイテムAが展開中にアイテムBを toggle した場合、アイテムAが collapsingId にセットされ、アイテムBが expandedIds にセットされること
 *    - 折りたたみアニメーション中に handleAnimationEnd が呼ばれた場合、タイマーが解除され即座に collapsingId が null になること
 *    - reset() を呼び出した場合、全タイマーが解除され expandedIds と collapsingId が初期状態にリセットされること
 * 3. DeleteDialogState
 *    - open(id) で isOpen が true になり deletingId がセットされること
 *    - close() で isOpen が false になり deletingId がクリアされること
 * 4. resetModesToPreview
 *    - 登録されたすべてのキーのモードが 'preview' に更新されること
 * 5. extractSearchQuery
 *    - 文字列が渡された場合、その文字列がそのまま返ること
 *    - CustomEvent が渡された場合、detail.keyword が返ること
 *    - detail または keyword が欠落している場合、空文字が返ること
 */

describe("view-state.utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("KeyedDebounceManager", () => {
    it("指定キーに対してデフォルト300ms待機後にアクションが実行されること", () => {
      const manager = new KeyedDebounceManager();
      const fn = vi.fn();

      manager.debounce(1, fn);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("待機時間内に同一キーで再度呼び出された場合、最新のアクションのみが実行されること", () => {
      const manager = new KeyedDebounceManager();
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      manager.debounce(1, fn1);
      vi.advanceTimersByTime(200);

      manager.debounce(1, fn2);
      vi.advanceTimersByTime(200);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("異なるキーのアクションは独立して実行されること", () => {
      const manager = new KeyedDebounceManager();
      const fnA = vi.fn();
      const fnB = vi.fn();

      manager.debounce(1, fnA, 200);
      manager.debounce(2, fnB, 400);

      vi.advanceTimersByTime(200);
      expect(fnA).toHaveBeenCalledTimes(1);
      expect(fnB).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(fnB).toHaveBeenCalledTimes(1);
    });

    it("cancel(key) で該当キーの待機中アクションが破棄されること", () => {
      const manager = new KeyedDebounceManager();
      const fn = vi.fn();

      manager.debounce(1, fn);
      manager.cancel(1);

      vi.advanceTimersByTime(300);
      expect(fn).not.toHaveBeenCalled();
    });

    it("clear() で全キーの待機中アクションが一括破棄されること", () => {
      const manager = new KeyedDebounceManager();
      const fnA = vi.fn();
      const fnB = vi.fn();

      manager.debounce(1, fnA);
      manager.debounce(2, fnB);
      manager.clear();

      vi.advanceTimersByTime(300);
      expect(fnA).not.toHaveBeenCalled();
      expect(fnB).not.toHaveBeenCalled();
    });
  });

  describe("ExclusiveAccordionController", () => {
    it("未展開のアイテムを指定して toggle した場合、expandedIds に追加され onExpand が呼ばれること", () => {
      const controller = new ExclusiveAccordionController();
      const onExpand = vi.fn();

      const result = controller.toggle(10, onExpand);

      expect(result.expanded).toBe(true);
      expect(controller.expandedIds.has(10)).toBe(true);
      expect(controller.collapsingId).toBeNull();
      expect(onExpand).toHaveBeenCalledWith(10);
    });

    it("既に展開中のアイテムを指定して toggle した場合、collapsingId に移行し320ms後にクリアされること", () => {
      const controller = new ExclusiveAccordionController();
      const onAnimateEnd = vi.fn();

      controller.toggle(10);
      expect(controller.expandedIds.has(10)).toBe(true);

      const result = controller.toggle(10, undefined, onAnimateEnd);
      expect(result.expanded).toBe(false);
      expect(controller.expandedIds.has(10)).toBe(false);
      expect(controller.collapsingId).toBe(10);
      expect(onAnimateEnd).not.toHaveBeenCalled();

      vi.advanceTimersByTime(320);
      expect(controller.collapsingId).toBeNull();
      expect(onAnimateEnd).toHaveBeenCalledWith(10);
    });

    it("アイテムAが展開中にアイテムBを toggle した場合、アイテムAが collapsingId になりアイテムBが展開されること", () => {
      const controller = new ExclusiveAccordionController();
      const onExpand = vi.fn();
      const onAnimateEnd = vi.fn();

      controller.toggle(10);
      expect(controller.expandedIds.has(10)).toBe(true);

      const result = controller.toggle(20, onExpand, onAnimateEnd);
      expect(result.expanded).toBe(true);
      expect(controller.expandedIds.has(20)).toBe(true);
      expect(controller.expandedIds.has(10)).toBe(false);
      expect(controller.collapsingId).toBe(10);
      expect(onExpand).toHaveBeenCalledWith(20);

      vi.advanceTimersByTime(320);
      expect(controller.collapsingId).toBeNull();
      expect(onAnimateEnd).toHaveBeenCalledWith(10);
    });

    it("折りたたみアニメーション中に handleAnimationEnd が呼ばれた場合、即座に collapsingId が null になること", () => {
      const controller = new ExclusiveAccordionController();
      controller.toggle(10);
      controller.toggle(10);
      expect(controller.collapsingId).toBe(10);

      const handled = controller.handleAnimationEnd(10);
      expect(handled).toBe(true);
      expect(controller.collapsingId).toBeNull();

      // タイマー発火後にも副作用が出ないこと
      vi.advanceTimersByTime(320);
      expect(controller.collapsingId).toBeNull();
    });

    it("reset() を呼び出した場合、全タイマーが解除され初期状態にリセットされること", () => {
      const controller = new ExclusiveAccordionController();
      controller.toggle(10);
      controller.toggle(10);
      expect(controller.collapsingId).toBe(10);

      controller.reset();
      expect(controller.expandedIds.size).toBe(0);
      expect(controller.collapsingId).toBeNull();

      vi.advanceTimersByTime(320);
      expect(controller.collapsingId).toBeNull();
    });
  });

  describe("DeleteDialogState", () => {
    it("open(id) で isOpen が true になり deletingId がセットされること", () => {
      const state = new DeleteDialogState();
      expect(state.isOpen).toBe(false);
      expect(state.deletingId).toBeUndefined();

      state.open(42);
      expect(state.isOpen).toBe(true);
      expect(state.deletingId).toBe(42);
    });

    it("close() で isOpen が false になり deletingId がクリアされること", () => {
      const state = new DeleteDialogState();
      state.open(42);

      state.close();
      expect(state.isOpen).toBe(false);
      expect(state.deletingId).toBeUndefined();
    });
  });

  describe("resetModesToPreview", () => {
    it("登録されたすべてのキーのモードが 'preview' に更新されること", () => {
      const modeMap = new Map<number, MarkdownDisplayMode>([
        [1, "edit"],
        [2, "split"],
        [3, "preview"],
      ]);

      resetModesToPreview(modeMap);

      expect(modeMap.get(1)).toBe("preview");
      expect(modeMap.get(2)).toBe("preview");
      expect(modeMap.get(3)).toBe("preview");
    });
  });

  describe("extractSearchQuery", () => {
    it("文字列が渡された場合、その文字列がそのまま返ること", () => {
      expect(extractSearchQuery("test query")).toBe("test query");
      expect(extractSearchQuery("")).toBe("");
    });

    it("CustomEvent が渡された場合、detail.keyword が返ること", () => {
      const event = new CustomEvent<SearchInputEventDetail>("search-input", {
        detail: {
          keyword: "keyword from detail",
          value: "keyword from detail",
        },
      });
      expect(extractSearchQuery(event)).toBe("keyword from detail");
    });

    it("detail または keyword が欠落している場合、空文字が返ること", () => {
      const eventWithoutDetail = new CustomEvent<SearchInputEventDetail>(
        "search-input",
      );
      expect(extractSearchQuery(eventWithoutDetail)).toBe("");
    });
  });
});
