import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { Contact } from "@/types";
import { TaskContact, type ContactsChangeEventDetail } from "./task-contact.js";

/**
 * 【TaskContact 仕様 (関係者一覧・動的追加入力サブコンポーネント)】
 *
 * 1. 空状態（0件）の描画
 *    - 1-1. contacts が空配列の場合、空状態メッセージ（.task-contact__empty）が表示されること
 *    - 1-2. 空状態時、「関係者が登録されていません」の行（.task-contact__empty）にメッセージが出力され、追加アイコン（.task-contact__btn-add）が存在しないこと
 *    - 1-3. 空状態時に行要素（.task-contact__row）が存在しないこと
 *    - 1-4. 空状態時にフッター領域（.task-contact__footer）が出力されないこと
 *
 * 2. 一覧表示（1件以上）の描画
 *    - 2-1. contacts に要素がある場合、行（.task-contact__row）が件数分レンダリングされること
 *    - 2-2. 各行に 所属（div）、氏名（name）、連絡先（tel）の入力欄が存在し、値が反映されること
 *    - 2-3. 各行に削除用アイコン（wa-icon.task-contact__btn-remove）が存在し、wa-button による過度な幅占有が排除されていること
 *    - 2-4. 一覧時にもフッター領域（.task-contact__footer）が出力されず、無駄な余白が排除されていること
 *    - 2-5. 要素が存在する場合、空状態メッセージ（.task-contact__empty）が存在しないこと
 *    - 2-6. 所属、氏名、連絡先のラベル（.task-contact__label）が存在せず、プレースホルダーのみで明示されていること
 *    - 2-7. 各入力欄（所属: building-solid-full、氏名: user-solid-full、連絡先: phone-solid-full）の slot="start" に対応する wa-icon が描画されること
 *
 * 3. ユーザーインタラクションとイベント発火
 *    - 3-1. handleAdd 実行時に空行が追加された contacts 配列とともに contacts-change イベント（action: 'add'）がディスパッチされること
 *    - 3-2. handleRemove 実行時に該当行が削除された contacts 配列とともに contacts-change イベント（action: 'remove'）がディスパッチされること
 *    - 3-3. handleInputChange 実行時に所属（div）が更新された contacts 配列とともに contacts-change イベント（action: 'update'）がディスパッチされること
 *    - 3-4. handleInputChange 実行時に氏名（name）が更新された contacts 配列とともに contacts-change イベント（action: 'update'）がディスパッチされること
 *    - 3-5. handleInputChange 実行時に連絡先（tel）が更新された contacts 配列とともに contacts-change イベント（action: 'update'）がディスパッチされること
 *
 * 4. BEM設計およびSCSSスタイルの検証
 *    - 4-1. SCSSスタイルシート（task-contact.scss）が存在し、ルートブロック .task-contact および主要BEMセレクタが定義されていること
 *    - 4-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること
 *    - 4-3. task-contact.scss に !important 宣言が一切含まれていないこと
 *    - 4-4. task-contact.scss に @extend が一切含まれていないこと
 *    - 4-5. task-contact.scss 全体においてハードコードされたカラーコード（#[0-9a-fA-F]{3,8}, rgba(...)）が 0 件（完全ゼロ）であること
 *    - 4-6. task-contact.scss において .task-contact__btn-remove に cursor: pointer およびホバー時のトークン色が定義されていること
 *    - 4-7. task-contact.scss において .task-contact__footer および .task-contact__btn-add が存在しないこと
 *    - 4-8. task-contact.scss において .task-contact__empty が定義されていること
 *    - 4-9. task-contact.scss において .task-contact__input-icon に文字色トークンおよびサイズが定義されていること
 */
describe("TaskContact Component", () => {
  let element: TaskContact;
  const sampleContacts: Contact[] = [
    { div: "システム開発部", name: "山田太郎", tel: "03-1234-5678" },
    { div: "営業推進課", name: "佐藤花子", tel: "090-9876-5432" },
  ];

  beforeEach(() => {
    element = new TaskContact();
  });

  describe("1. 空状態（0件）の描画", () => {
    it("1-1. contacts が空配列の場合、空状態メッセージ（.task-contact__empty）が表示されること", () => {
      element.contacts = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-contact__empty");
      expect(htmlStr).toContain("関係者は未登録です");
    });

    it("1-2. 空状態時、「関係者が登録されていません」の行（.task-contact__empty）にメッセージが出力され、追加アイコン（.task-contact__btn-add）が存在しないこと", () => {
      element.contacts = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("関係者は未登録です");
      expect(htmlStr).not.toContain("task-contact__btn-add");
    });

    it("1-3. 空状態時に行要素（.task-contact__row）が存在しないこと", () => {
      element.contacts = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-contact__row");
    });

    it("1-4. 空状態時にはフッター領域（.task-contact__footer）が出力されず、空状態行の内部にのみ追加アイコンが存在すること", () => {
      element.contacts = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-contact__footer");
    });
  });

  describe("2. 一覧表示（1件以上）の描画", () => {
    beforeEach(() => {
      element.contacts = [...sampleContacts];
    });

    it("2-1. contacts に要素がある場合、行（.task-contact__row）が件数分レンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      const rowMatches = htmlStr.match(/class="[^"]*task-contact__row[^"]*"/g);
      expect(rowMatches).not.toBeNull();
      expect(rowMatches?.length).toBe(2);
    });

    it("2-2. 各行に 所属（div）、氏名（name）、連絡先（tel）の入力欄が存在し、値が反映されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-contact__input--div");
      expect(htmlStr).toContain("task-contact__input--name");
      expect(htmlStr).toContain("task-contact__input--tel");
      expect(htmlStr).toContain("システム開発部");
      expect(htmlStr).toContain("山田太郎");
      expect(htmlStr).toContain("03-1234-5678");
      expect(htmlStr).toContain("営業推進課");
      expect(htmlStr).toContain("佐藤花子");
      expect(htmlStr).toContain("090-9876-5432");
    });

    it("2-3. 各行に削除用アイコン（wa-icon.task-contact__btn-remove）が存在し、wa-button による過度な幅占有が排除されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*class="[^"]*task-contact__btn-remove[^"]*"[^>]*name="trash-solid-full"/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*class="[^"]*task-contact__btn-remove/,
      );
    });

    it("2-4. 一覧時にもフッター領域（.task-contact__footer）が出力されず、無駄な余白が排除されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-contact__footer");
      expect(htmlStr).not.toContain("task-contact__btn-add");
    });

    it("2-5. 要素が存在する場合、空状態メッセージ（.task-contact__empty）が存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-contact__empty");
    });

    it("2-6. 所属、氏名、連絡先のラベル（.task-contact__label）が存在せず、プレースホルダーのみで明示されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-contact__label");
      expect(htmlStr).toMatch(/placeholder=["']?所属["']?/);
      expect(htmlStr).toMatch(/placeholder=["']?氏名["']?/);
      expect(htmlStr).toMatch(/placeholder=["']?連絡先["']?/);
    });

    it("2-7. 各入力欄（所属: building-solid-full、氏名: user-solid-full、連絡先: phone-solid-full）の slot='start' に対応する wa-icon が描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']?start["']?[^>]*name=["']?building-solid-full["']?/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']?start["']?[^>]*name=["']?user-solid-full["']?/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']?start["']?[^>]*name=["']?phone-solid-full["']?/,
      );
    });
  });

  describe("3. ユーザーインタラクションとイベント発火", () => {
    it("3-1. handleAdd 実行時に空行が追加された contacts 配列とともに contacts-change イベント（action: 'add'）がディスパッチされること", () => {
      element.contacts = [...sampleContacts];
      const listener = vi.fn();
      element.addEventListener("contacts-change", listener);

      element.handleAdd();

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock
        .calls[0][0] as CustomEvent<ContactsChangeEventDetail>;
      expect(event.detail.action).toBe("add");
      expect(event.detail.contacts.length).toBe(3);
      expect(event.detail.contacts[2]).toEqual({ div: "", name: "", tel: "" });
    });

    it("3-2. handleRemove 実行時に該当行が削除された contacts 配列とともに contacts-change イベント（action: 'remove'）がディスパッチされること", () => {
      element.contacts = [...sampleContacts];
      const listener = vi.fn();
      element.addEventListener("contacts-change", listener);

      element.handleRemove(0);

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock
        .calls[0][0] as CustomEvent<ContactsChangeEventDetail>;
      expect(event.detail.action).toBe("remove");
      expect(event.detail.index).toBe(0);
      expect(event.detail.contacts.length).toBe(1);
      expect(event.detail.contacts[0].name).toBe("佐藤花子");
    });

    it("3-3. handleInputChange 実行時に所属（div）が更新された contacts 配列とともに contacts-change イベント（action: 'update'）がディスパッチされること", () => {
      element.contacts = [...sampleContacts];
      const listener = vi.fn();
      element.addEventListener("contacts-change", listener);

      element.handleInputChange(0, "div", "総務部");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock
        .calls[0][0] as CustomEvent<ContactsChangeEventDetail>;
      expect(event.detail.action).toBe("update");
      expect(event.detail.index).toBe(0);
      expect(event.detail.contacts[0].div).toBe("総務部");
      expect(event.detail.contacts[0].name).toBe("山田太郎");
    });

    it("3-4. handleInputChange 実行時に氏名（name）が更新された contacts 配列とともに contacts-change イベント（action: 'update'）がディスパッチされること", () => {
      element.contacts = [...sampleContacts];
      const listener = vi.fn();
      element.addEventListener("contacts-change", listener);

      element.handleInputChange(1, "name", "鈴木次郎");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock
        .calls[0][0] as CustomEvent<ContactsChangeEventDetail>;
      expect(event.detail.action).toBe("update");
      expect(event.detail.index).toBe(1);
      expect(event.detail.contacts[1].name).toBe("鈴木次郎");
      expect(event.detail.contacts[1].tel).toBe("090-9876-5432");
    });

    it("3-5. handleInputChange 実行時に連絡先（tel）が更新された contacts 配列とともに contacts-change イベント（action: 'update'）がディスパッチされること", () => {
      element.contacts = [...sampleContacts];
      const listener = vi.fn();
      element.addEventListener("contacts-change", listener);

      element.handleInputChange(0, "tel", "03-9999-8888");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock
        .calls[0][0] as CustomEvent<ContactsChangeEventDetail>;
      expect(event.detail.action).toBe("update");
      expect(event.detail.index).toBe(0);
      expect(event.detail.contacts[0].tel).toBe("03-9999-8888");
    });
  });

  describe("4. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./task-contact.scss");

    it("4-1. SCSSスタイルシート（task-contact.scss）が存在し、ルートブロック .task-contact および主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-contact");
      expect(content).toContain(".task-contact__row");
      expect(content).toContain(".task-contact__empty");
    });

    it("4-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hasThemeTransition =
        content.includes("--stepnote-transition-theme") ||
        content.includes("theme-transition");
      expect(hasThemeTransition).toBe(true);
    });

    it("4-3. task-contact.scss に !important 宣言が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
    });

    it("4-4. task-contact.scss に @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("@extend");
    });

    it("4-5. task-contact.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const rgbMatches = content.match(/rgba?\([^)]+\)/g) ?? [];
      expect(hexMatches.length).toBe(0);
      expect(rgbMatches.length).toBe(0);
    });

    it("4-6. task-contact.scss において .task-contact__btn-remove に cursor: pointer およびホバー時のトークン色が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.task-contact__btn-remove\s*\{[^}]*cursor:\s*pointer;/,
      );
      expect(content).toContain("var(--quick-access-icon-overdue)");
    });

    it("4-7. task-contact.scss において .task-contact__footer および .task-contact__btn-add が存在しないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain(".task-contact__footer");
      expect(content).not.toContain(".task-contact__btn-add");
    });

    it("4-8. task-contact.scss において .task-contact__empty が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-contact__empty");
    });

    it("4-9. task-contact.scss において .task-contact__input-icon に文字色トークンおよびフォントサイズが定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-contact__input-icon");
      expect(content).toMatch(
        /\.task-contact__input-icon\s*\{[^}]*color:\s*var\(--(stepnote-text-secondary|wa-color-text-quiet)/,
      );
      expect(content).toMatch(
        /\.task-contact__input-icon\s*\{[^}]*font-size:\s*var\(--wa-font-size-/,
      );
    });
  });
});
