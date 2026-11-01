import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Plugin } from "unified";
import type { Root as MdastRoot, Text, Parent, Content } from "mdast";
import { visit } from "unist-util-visit";
import type { MarkdownFeatureExtension } from "../types.js";

export type IdLinkType = "task" | "issue" | "note";

export interface IdJumpDetail {
  type: IdLinkType;
  id: number;
}

/**
 * ID リンクバッジの MDAST ノード型
 */
export interface IdLinkBadgeNode extends Parent {
  type: "idLinkBadge";
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
  children: Content[];
}

declare module "mdast" {
  interface RootContentMap {
    idLinkBadge: IdLinkBadgeNode;
  }
}

/**
 * プレビュー画面で描画されるクリック可能な ID リンク Web Component
 */
@customElement("id-link-badge")
export class IdLinkBadge extends LitElement {
  public static override styles = css`
    :host {
      display: inline-block;
      vertical-align: baseline;
      margin: 0 2px;
    }
    .id-link-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.85em;
      font-family: inherit;
      font-weight: 500;
      line-height: 1.4;
      cursor: pointer;
      user-select: none;
      border: 1px solid var(--wa-color-neutral-30);
      background-color: var(--wa-color-neutral-10);
      color: var(--wa-color-primary-70);
      text-decoration: none;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .id-link-badge:hover {
      background-color: var(--wa-color-primary-10);
      border-color: var(--wa-color-primary-50);
      color: var(--wa-color-primary-80);
    }
    .id-link-badge--task {
      border-color: var(--wa-color-blue-30);
      background-color: var(--wa-color-blue-10);
      color: var(--wa-color-blue-70);
    }
    .id-link-badge--issue {
      border-color: var(--wa-color-amber-30);
      background-color: var(--wa-color-amber-10);
      color: var(--wa-color-amber-80);
    }
    .id-link-badge--note {
      border-color: var(--wa-color-emerald-30);
      background-color: var(--wa-color-emerald-10);
      color: var(--wa-color-emerald-70);
    }
  `;

  @property({ type: String })
  public type: IdLinkType = "task";

  @property({ type: Number, attribute: "item-id" })
  public itemId = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this.handleBadgeClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleBadgeClick);
  }

  public handleBadgeClick = (e?: Event): void => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    this.dispatchEvent(
      new CustomEvent<IdJumpDetail>("id-jump", {
        bubbles: true,
        composed: true,
        detail: {
          type: this.type,
          id: Number(this.itemId),
        },
      }),
    );
  };

  override render() {
    return html`
      <span
        class="id-link-badge id-link-badge--${this.type}"
        role="button"
        tabindex="0"
        @click=${this.handleBadgeClick}
      >
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "id-link-badge": IdLinkBadge;
  }
}

const ID_LINK_REGEX =
  /(?:#\{(\d+)\}|#\[(\d+)\]|#\((\d+)\))(?:\{([^}]*)\})?/g;

const TYPE_PREFIX_MAP: Record<IdLinkType, string> = {
  task: "Task",
  issue: "Issue",
  note: "Note",
};

/**
 * マッチ情報から種別と ID 文字列を抽出する純粋関数
 */
function extractMatchTarget(
  match: RegExpExecArray,
): { type: IdLinkType; idStr: string } | null {
  if (match[1]) return { type: "task", idStr: match[1] };
  if (match[2]) return { type: "issue", idStr: match[2] };
  if (match[3]) return { type: "note", idStr: match[3] };
  return null;
}

/**
 * プレビュー表示用のテキストを生成する純粋関数
 */
function formatDisplayText(
  type: IdLinkType,
  idStr: string,
  previewText?: string,
): string {
  const prefix = `[${TYPE_PREFIX_MAP[type]}#${idStr}]`;
  const cleanText = previewText?.trim();
  return cleanText ? `${prefix} ${cleanText}` : prefix;
}

/**
 * ID リンクノードを構築する純粋関数
 */
function createIdLinkNode(
  type: IdLinkType,
  idStr: string,
  previewText?: string,
): IdLinkBadgeNode {
  return {
    type: "idLinkBadge",
    data: {
      hName: "id-link-badge",
      hProperties: {
        type,
        "item-id": idStr,
      },
    },
    children: [
      {
        type: "text",
        value: formatDisplayText(type, idStr, previewText),
      },
    ],
  };
}

/**
 * テキスト文字列から ID リンクノードとテキストノードの配列を生成する純粋関数
 */
export function splitTextByIdLinks(value: string): (Text | IdLinkBadgeNode)[] {
  ID_LINK_REGEX.lastIndex = 0;
  const nodes: (Text | IdLinkBadgeNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ID_LINK_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        type: "text",
        value: value.slice(lastIndex, match.index),
      });
    }

    const target = extractMatchTarget(match);
    if (target) {
      nodes.push(createIdLinkNode(target.type, target.idStr, match[4]));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push({
      type: "text",
      value: value.slice(lastIndex),
    });
  }

  return nodes;
}

/**
 * ID リンク構文を id-link-badge ノードへ置換する remark プラグイン
 */
export const remarkIdLinkPlugin: Plugin<[], MdastRoot> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      ID_LINK_REGEX.lastIndex = 0;
      if (!ID_LINK_REGEX.test(node.value) || !parent || typeof index !== "number") {
        return;
      }

      const newNodes = splitTextByIdLinks(node.value);
      (parent as Parent).children.splice(index, 1, ...newNodes);
    });
  };
};

/**
 * ID リンク Markdown 機能拡張パッケージ (ID Link Feature Extension)
 */
export const idLinkExtension: MarkdownFeatureExtension = {
  id: "id-link",
  label: "IDリンク",
  description:
    "タスク・Issue・Noteへのリンクタグを挿入し、クリックで対象項目へジャンプします",
  template: "#{ID}{テキスト}",
  example: "#{3}{タスク概要}",
  toolbarItem: {
    icon: "link-solid-full",
    title: "IDリンク",
  },
  processor: {
    remarkPlugins: [remarkIdLinkPlugin],
    sanitizeSchemaModifier: (baseSchema) => {
      const schema = JSON.parse(JSON.stringify(baseSchema));
      schema.tagNames = [...(schema.tagNames || []), "id-link-badge"];
      schema.attributes = {
        ...(schema.attributes || {}),
        "id-link-badge": ["type", "item-id", "className", "class", "style"],
      };
      return schema;
    },
  },
};

