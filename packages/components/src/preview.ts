import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/popover/popover.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import { registerIcons } from "@shared/icons";
import "./search-input/search-input";
import "./datepicker-input/datepicker-input";
import "./markdown/index";
import { type MarkdownEditorPreview, customBadgeExtension } from "./markdown/index";
import "./preview.scss";

// オフライン対応 SVG アイコンの登録
registerIcons();

// テーマ切り替え機能
const themeToggleBtn = document.getElementById("theme-toggle");
const root = document.documentElement;

let isDark =
  localStorage.getItem("preview_theme") === "dark" ||
  window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme(): void {
  const currentTheme = isDark ? "dark" : "light";
  if (isDark) {
    root.classList.add("wa-dark");
    root.setAttribute("data-theme", "dark");
    if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    root.classList.remove("wa-dark");
    root.setAttribute("data-theme", "light");
    if (themeToggleBtn) themeToggleBtn.textContent = "🌙 Dark Mode";
  }

  const previews = document.querySelectorAll<MarkdownEditorPreview>("markdown-editor-preview");
  previews.forEach((preview) => {
    preview.themeMode = currentTheme;
  });
}

applyTheme();

themeToggleBtn?.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("preview_theme", isDark ? "dark" : "light");
  applyTheme();
});

// イベントログ出力機能
const logContainer = document.getElementById("event-log");
const clearLogBtn = document.getElementById("clear-log");

function appendLog(sourceId: string, eventName: string, detail: unknown): void {
  if (!logContainer) return;
  const time = new Date().toLocaleTimeString();
  const entry =
    `[${time}] [${sourceId}] event: "${eventName}"\n` +
    `  payload: ${JSON.stringify(detail)}\n\n`;
  logContainer.textContent = entry + logContainer.textContent;
}

clearLogBtn?.addEventListener("click", () => {
  if (logContainer) logContainer.textContent = "";
});

// 各 search-input のイベント購読
const searchInputs = document.querySelectorAll("search-input");
searchInputs.forEach((el) => {
  el.addEventListener("search-input", (e: Event) => {
    const customEvt = e as CustomEvent;
    const id = el.id || "search-input";
    appendLog(id, "search-input", customEvt.detail);
  });
});

// 各 datepicker-input のイベント購読
const datepickerInputs = document.querySelectorAll("datepicker-input");
datepickerInputs.forEach((el) => {
  el.addEventListener("datepicker-change", (e: Event) => {
    const customEvt = e as CustomEvent;
    const id = el.id || "datepicker-input";
    appendLog(id, "datepicker-change", customEvt.detail);
  });
});

// 11. 標準 Markdown エディタ＆プレビューの初期設定
const markdownMain = document.getElementById("markdown-main") as MarkdownEditorPreview | null;
if (markdownMain) {
  markdownMain.value = `# タスク管理 & Markdown プレビュー機能の開発

オフライン環境で完全に動作し、**Open-Closed Principle (開放閉鎖原則)** に基づいた拡張可能なエディタです。

## 1. 主な機能一覧
- [x] GFM (GitHub Flavored Markdown) 完全対応
- [x] CodeMirror 6 によるシンタックスハイライト
- [x] XSS 防御サニタイズ（安全なHTMLのみ出力）
- [ ] 独自記法プラグインの外部注入 (DI)
- [ ] スクロール同期機能

## 2. 実装スケジュール

| フェーズ | 担当モジュール | 状態 |
| :--- | :--- | :--- |
| Phase 1 | unified パイプライン層 | **完了** |
| Phase 2 | \`<markdown-preview>\` | **完了** |
| Phase 3 | \`<markdown-editor>\` | **完了** |
| Phase 4 | \`<markdown-editor-preview>\` | **完了** |

## 3. サンプルコード
\`\`\`typescript
import { createMarkdownProcessor } from "@shared/components";

const processor = createMarkdownProcessor();
const html = await processor.process("# Hello World");
console.log(html);
\`\`\`

> **Note**: 上部のボタングループから「スプリット」「編集」「プレビュー」の表示モードを自由に切り替えられます。
`;

  markdownMain.addEventListener("markdown-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ value: string }>;
    appendLog("markdown-main", "markdown-change", {
      length: customEvt.detail.value.length,
      previewSnippet: customEvt.detail.value.slice(0, 30) + "...",
    });
  });

  markdownMain.addEventListener("mode-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ mode: string }>;
    appendLog("markdown-main", "mode-change", customEvt.detail);
  });

  markdownMain.addEventListener("height-mode-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ autoHeight: boolean }>;
    appendLog("markdown-main", "height-mode-change", customEvt.detail);
  });
}

// 12. 独自記法拡張パッケージ (Feature Extension) 実証デモ
const markdownPluginDemo = document.getElementById("markdown-plugin-demo") as MarkdownEditorPreview | null;
if (markdownPluginDemo) {
  markdownPluginDemo.extensions = [customBadgeExtension];

  markdownPluginDemo.value = `### 独自記法プラグインの注入実証 (DI)

コアコードを変更することなく、独自記法 \`:badge[ラベル]:\` を解釈する remark プラグインおよびツールバー、構文ヘルプを 1 つの拡張パッケージとして注入しています。

- タスクA :badge[優先度:高]: - 本日中に完了させる必要があります。
- タスクB :badge[優先度:低]: - 来週以降に着手します。
- タスクC :badge[進行中]: - レビュー依頼待ち。

上部ツールバーのミートボールメニュー（…）、または「？」ボタン（構文ヘルプ）の「挿入」ボタンから \`:badge[ラベル]:\` をワンクリック挿入できます。
`;

  markdownPluginDemo.addEventListener("markdown-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ value: string }>;
    appendLog("markdown-plugin-demo", "markdown-change", {
      length: customEvt.detail.value.length,
      snippet: customEvt.detail.value.slice(0, 30) + "...",
    });
  });

  markdownPluginDemo.addEventListener("mode-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ mode: string }>;
    appendLog("markdown-plugin-demo", "mode-change", customEvt.detail);
  });

  markdownPluginDemo.addEventListener("height-mode-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ autoHeight: boolean }>;
    appendLog("markdown-plugin-demo", "height-mode-change", customEvt.detail);
  });
}

// 13. 空のエディタ (デフォルト編集モード & スプリット無効)
const markdownEmptyDemo = document.getElementById("markdown-empty-demo") as MarkdownEditorPreview | null;
if (markdownEmptyDemo) {
  markdownEmptyDemo.allowSplit = false;

  markdownEmptyDemo.addEventListener("markdown-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ value: string }>;
    appendLog("markdown-empty-demo", "markdown-change", {
      length: customEvt.detail.value.length,
      snippet: customEvt.detail.value.slice(0, 30) + "...",
    });
  });

  markdownEmptyDemo.addEventListener("mode-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ mode: string }>;
    appendLog("markdown-empty-demo", "mode-change", customEvt.detail);
  });
}

// 14. 既存メモエディタ (デフォルトプレビューモード & スプリット無効)
const markdownNoSplitDemo = document.getElementById("markdown-no-split-demo") as MarkdownEditorPreview | null;
if (markdownNoSplitDemo) {
  markdownNoSplitDemo.allowSplit = false;
  markdownNoSplitDemo.value = `### プロジェクト定例ミーティング議事録

- **日時**: 2026年10月4日 10:00 - 11:00
- **参加者**: 松田、佐藤、田中

#### アジェンダ
1. Step-Note UI コンポーネント開発進捗
2. Markdown エディタ＆プレビュー結合テスト結果
3. 次週リリース計画

> **Note**: このコンポーネントは \`allowSplit = false\` が設定されており、初期状態では入力内容があるため「プレビューモード」で表示されます。ヘッダーにはスプリットボタンが表示されず、編集とプレビューの2者間切り替えとなります。
`;

  markdownNoSplitDemo.addEventListener("markdown-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ value: string }>;
    appendLog("markdown-no-split-demo", "markdown-change", {
      length: customEvt.detail.value.length,
      snippet: customEvt.detail.value.slice(0, 30) + "...",
    });
  });

  markdownNoSplitDemo.addEventListener("mode-change", (e: Event) => {
    const customEvt = e as CustomEvent<{ mode: string }>;
    appendLog("markdown-no-split-demo", "mode-change", customEvt.detail);
  });
}
