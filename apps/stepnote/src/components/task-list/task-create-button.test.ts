import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { TaskCreateButton } from "./task-create-button.js";

/**
 * 【TaskCreateButton 仕様 (タスク新規作成共通ボタンコンポーネント)】
 *
 * 1. 基本レンダリング仕様
 *    - 1-1. wa-button、wa-tooltip、wa-icon（plus-solid-full）がレンダリングされること
 *    - 1-2. デフォルトプロパティ（size="m", placement="bottom", buttonId="task-create-btn"）が反映されること
 *    - 1-3. wa-tooltip に trigger="hover" が設定され、ホバー時のみ表示されるよう制御されていること
 *
 * 2. プロパティによる設定反映
 *    - 2-1. size プロパティが wa-button の size 属性に反映されること（size="s" 等）
 *    - 2-2. placement プロパティが wa-tooltip の placement 属性に反映されること（placement="right" 等）
 *    - 2-3. buttonId プロパティが wa-button の id および wa-tooltip の for 属性に反映されること
 *    - 2-4. disabled プロパティが明示的に true の場合、ラベル有無にかかわらずボタンが無効化されること
 *
 * 3. ラベル登録状態（LabelsController）との連動仕様
 *    - 3-1. hasLabels が true（ラベルが1件以上存在）の場合、ボタンが活性化され、ツールチップに「新規タスクを作成 (Alt+N)」が表示されること
 *    - 3-2. hasLabels が false（ラベルが0件）の場合、ボタンが無効化（disabled）され、ツールチップに「ラベルを登録してください」が表示されること
 *    - 3-3. labelsController が未設定の場合、安全に hasLabels が false（無効化）として扱われること
 *
 * 4. クリック時のイベント発行仕様
 *    - 4-1. hasLabels が true の際、handleClick 呼び出しによってカスタムイベント request-task-create（bubbles: true, composed: true）がディスパッチされること
 *    - 4-2. hasLabels が false の際、handleClick を呼び出しても request-task-create イベントがディスパッチされないこと
 *    - 4-3. disabled プロパティが true の際、handleClick を呼び出しても request-task-create イベントがディスパッチされないこと
 *
 * 5. スタイル仕様（SCSS）
 *    - 5-1. task-create-button.scss が存在し、:host および .task-create-btn のスタイルが定義されていること
 */

describe("TaskCreateButton Component (タスク新規作成共通ボタン)", () => {
  let button: TaskCreateButton;

  beforeEach(() => {
    button = new TaskCreateButton();
  });

  describe("1. 基本レンダリング仕様", () => {
    it("1-1. wa-button、wa-tooltip、wa-icon（plus-solid-full）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain("wa-button");
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-icon");
      expect(htmlStr).toContain("plus-solid-full");
    });

    it("1-2. デフォルトプロパティ（size='m', placement='bottom', buttonId='task-create-btn'）が反映されること", () => {
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain('size="m"');
      expect(htmlStr).toContain('placement="bottom"');
      expect(htmlStr).toContain('id="task-create-btn"');
      expect(htmlStr).toContain('for="task-create-btn"');
    });

    it("1-3. wa-tooltip に trigger='hover' が設定され、ホバー時のみ表示されるよう制御されていること", () => {
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain('trigger="hover"');
    });
  });

  describe("2. プロパティによる設定反映", () => {
    it("2-1. size プロパティが wa-button の size 属性に反映されること", () => {
      button.size = "s";
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain('size="s"');
    });

    it("2-2. placement プロパティが wa-tooltip の placement 属性に反映されること", () => {
      button.placement = "right";
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain('placement="right"');
    });

    it("2-3. buttonId プロパティが wa-button の id および wa-tooltip の for 属性に反映されること", () => {
      button.buttonId = "task-list-btn-add";
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain('id="task-list-btn-add"');
      expect(htmlStr).toContain('for="task-list-btn-add"');
    });

    it("2-4. disabled プロパティが明示的に true の場合、ラベル有無にかかわらずボタンが無効化されること", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = { hasLabels: true };
      button.disabled = true;
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toMatch(/<wa-button[^>]*\bdisabled\b/);
    });
  });

  describe("3. ラベル登録状態（LabelsController）との連動仕様", () => {
    it("3-1. hasLabels が true（ラベルが1件以上存在）の場合、ボタンが活性化され、ツールチップに「新規タスクを作成 (Alt+N)」が表示されること", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = { hasLabels: true };
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain("新規タスクを作成 (Alt+N)");
      expect(htmlStr).not.toMatch(/<wa-button[^>]*\bdisabled\b/);
    });

    it("3-2. hasLabels が false（ラベルが0件）の場合、ボタンが無効化（disabled）され、ツールチップに「ラベルを登録してください」が表示されること", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = { hasLabels: false };
      const htmlStr = flattenTemplate(button.render());
      expect(htmlStr).toContain("ラベルを登録してください");
      expect(htmlStr).toMatch(/<wa-button[^>]*\bdisabled\b/);
    });

    it("3-3. labelsController が未設定の場合、安全に hasLabels が false（無効化）として扱われること", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = undefined;
      const htmlStr = flattenTemplate(button.render());
      expect(button.hasLabels).toBe(false);
      expect(htmlStr).toContain("ラベルを登録してください");
      expect(htmlStr).toMatch(/<wa-button[^>]*\bdisabled\b/);
    });
  });

  describe("4. クリック時のイベント発行仕様", () => {
    it("4-1. hasLabels が true の際、handleClick 呼び出しによってカスタムイベント request-task-create（bubbles: true, composed: true）がディスパッチされること", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = { hasLabels: true };
      let dispatchedEvent: CustomEvent | null = null;
      button.addEventListener("request-task-create", (e) => {
        dispatchedEvent = e as CustomEvent;
      });

      button.handleClick();

      expect(dispatchedEvent).not.toBeNull();
      expect(dispatchedEvent!.type).toBe("request-task-create");
      expect(dispatchedEvent!.bubbles).toBe(true);
      expect(dispatchedEvent!.composed).toBe(true);
    });

    it("4-2. hasLabels が false の際、handleClick を呼び出しても request-task-create イベントがディスパッチされないこと", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = { hasLabels: false };
      const listener = vi.fn();
      button.addEventListener("request-task-create", listener);

      button.handleClick();

      expect(listener).not.toHaveBeenCalled();
    });

    it("4-3. disabled プロパティが true の際、handleClick を呼び出しても request-task-create イベントがディスパッチされないこと", () => {
      (button as unknown as { labelsController?: { hasLabels: boolean } }).labelsController = { hasLabels: true };
      button.disabled = true;
      const listener = vi.fn();
      button.addEventListener("request-task-create", listener);

      button.handleClick();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("5. スタイル仕様（SCSS）", () => {
    it("5-1. task-create-button.scss が存在し、:host および .task-create-btn のスタイルが定義されていること", () => {
      const scssPath = new URL("./task-create-button.scss", import.meta.url);
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toContain(":host");
      expect(scss).toContain(".task-create-btn");
    });
  });
});
