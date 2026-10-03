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
import type { MarkdownEditorPreview } from "./markdown/index";
import type { Plugin } from "unified";
import type { Root as MdastRoot, Text, Node } from "mdast";
import { visit } from "unist-util-visit";
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
  if (isDark) {
    root.classList.add("wa-dark");
    root.setAttribute("data-theme", "dark");
    if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    root.classList.remove("wa-dark");
    root.setAttribute("data-theme", "light");
    if (themeToggleBtn) themeToggleBtn.textContent = "🌙 Dark Mode";
  }
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
}

// 12. 独自記法プラグイン DI 実証デモ
const markdownPluginDemo = document.getElementById("markdown-plugin-demo") as MarkdownEditorPreview | null;
if (markdownPluginDemo) {
  // 独自構文 :badge[テキスト]: を認識する remark プラグイン
  const remarkBadgePlugin: Plugin<[], MdastRoot> = () => {
    return (tree) => {
      visit(tree, "text", (node: Text, index, parent) => {
        const regex = /:badge\[([^\]]+)\]:/g;
        if (!regex.test(node.value) || !parent || typeof index !== "number") return;

        regex.lastIndex = 0;
        const newNodes: Node[] = [];
        let lastIdx = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(node.value)) !== null) {
          if (match.index > lastIdx) {
            newNodes.push({
              type: "text",
              value: node.value.slice(lastIdx, match.index),
            } as Text);
          }
          const badgeText = match[1];
          const isHigh = badgeText.includes("高") || badgeText.includes("緊急");
          newNodes.push({
            type: "customBadge",
            data: {
              hName: "span",
              hProperties: {
                className: `custom-badge ${isHigh ? "custom-badge--danger" : "custom-badge--info"}`,
                style: `display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; background: ${isHigh ? "#fee2e2" : "#e0f2fe"}; color: ${isHigh ? "#991b1b" : "#0369a1"}; margin: 0 4px; vertical-align: middle;`,
              },
            },
            children: [{ type: "text", value: badgeText }],
          } as any);
          lastIdx = match.index + match[0].length;
        }

        if (lastIdx < node.value.length) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIdx),
          } as Text);
        }

        parent.children.splice(index, 1, ...newNodes as any[]);
      });
    };
  };

  markdownPluginDemo.processorOptions = {
    remarkPlugins: [remarkBadgePlugin],
    sanitizeSchemaModifier: (baseSchema) => {
      const schema = JSON.parse(JSON.stringify(baseSchema));
      schema.attributes = {
        ...(schema.attributes || {}),
        span: ["className", "style"],
      };
      return schema;
    },
  };

  markdownPluginDemo.value = `### 独自記法プラグインの注入実証 (DI)

コアコードを変更することなく、独自記法 \`:badge[ラベル]:\` を解釈する remark プラグインを注入しています。

- タスクA :badge[優先度:高]: - 本日中に完了させる必要があります。
- タスクB :badge[優先度:低]: - 来週以降に着手します。
- タスクC :badge[進行中]: - レビュー依頼待ち。

左のエディタで \`:badge[緊急]:\` と入力すると、右側のプレビューで即座にカスタムバッジとして描画されます。
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
}
