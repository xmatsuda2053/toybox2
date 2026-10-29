import type { Plugin } from "unified";
import type { Root as MdastRoot, Content, Paragraph, Text, Parent, Node } from "mdast";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import type {
  MarkdownFeatureExtension,
  MarkdownExtensionSubItem,
} from "../types.js";

/**
 * コールアウトアイコンの MDAST ノード型
 */
export interface CalloutIconNode extends Node {
  type: "calloutIcon";
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
}

/**
 * コールアウトの MDAST ノード型
 */
export interface CalloutNode extends Parent {
  type: "callout";
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
  children: Content[];
}

declare module "mdast" {
  interface RootContentMap {
    calloutIcon: CalloutIconNode;
    callout: CalloutNode;
  }
}

export interface CalloutMeta {
  readonly variant: "brand" | "success" | "neutral" | "warning" | "danger";
  readonly icon: string;
}

export const CALLOUT_TYPE_MAP: Record<string, CalloutMeta> = {
  info: { variant: "brand", icon: "circle-info-solid-full" },
  check: { variant: "success", icon: "circle-check-solid-full" },
  gear: { variant: "neutral", icon: "gear-solid-full" },
  warn: { variant: "warning", icon: "triangle-exclamation-solid-full" },
  alert: { variant: "danger", icon: "circle-exclamation-solid-full" },
};

export const DEFAULT_CALLOUT_META: CalloutMeta = {
  variant: "brand",
  icon: "circle-info-solid-full",
};

const CALLOUT_START_REGEX = /^(\/{3,})\s*([a-zA-Z0-9_-]*)\s*(?:\r?\n|$)/;
const CALLOUT_END_REGEX = /(?:\r?\n|^)\s*(\/{3,})\s*$/;

/**
 * キーワードからコールアウトのメタ情報（variant / icon）を解決する純粋関数
 */
export function resolveCalloutMeta(typeStr: string): CalloutMeta {
  const normalized = typeStr.trim().toLowerCase();
  return CALLOUT_TYPE_MAP[normalized] ?? DEFAULT_CALLOUT_META;
}

/**
 * wa-icon と wa-callout の MDAST ノードを構築する純粋関数
 */
function buildCalloutAstNode(meta: CalloutMeta, contentNodes: Content[]): CalloutNode {
  const iconNode: CalloutIconNode = {
    type: "calloutIcon",
    data: {
      hName: "wa-icon",
      hProperties: {
        library: "my-icons",
        name: meta.icon,
        slot: "icon",
      },
    },
  };

  return {
    type: "callout",
    data: {
      hName: "wa-callout",
      hProperties: {
        variant: meta.variant,
        size: "m",
      },
    },
    children: [iconNode, ...contentNodes],
  };
}

/**
 * 単一のテキストノードからコールアウトデリミタを除去してノードを構築する純粋関数
 */
function transformSingleTextNode(
  first: Text,
  startMatch: RegExpExecArray,
): Content | null {
  const textWithoutStart = first.value.slice(startMatch[0].length);
  const endMatch = CALLOUT_END_REGEX.exec(textWithoutStart);
  if (!endMatch) return null;

  const meta = resolveCalloutMeta(startMatch[2]);
  first.value = textWithoutStart.slice(0, endMatch.index).trim();
  const cleanChildren = first.value.length > 0 ? [first] : [];
  return buildCalloutAstNode(meta, cleanChildren as Content[]);
}

/**
 * 複数子ノードを持つ段落からコールアウトデリミタを除去してノードを構築する純粋関数
 */
function transformMultiChildParagraph(
  children: Content[],
  first: Text,
  last: Text,
  startMatch: RegExpExecArray,
): Content | null {
  const endMatch = CALLOUT_END_REGEX.exec(last.value);
  if (!endMatch) return null;

  const meta = resolveCalloutMeta(startMatch[2]);
  first.value = first.value.slice(startMatch[0].length).replace(/^\r?\n/, "");
  last.value = last.value.slice(0, endMatch.index).replace(/\r?\n$/, "");

  const cleanChildren = children.filter(
    (c) => c.type !== "text" || (c as Text).value.length > 0,
  );
  return buildCalloutAstNode(meta, cleanChildren as Content[]);
}

/**
 * 段落ノードが単一ブロックで callout を満たす場合に変換する純粋関数
 */
function tryTransformSingleParagraph(para: Paragraph): Content | null {
  const { children } = para;
  if (children.length === 0) return null;

  const first = children[0];
  const last = children[children.length - 1];
  if (first.type !== "text" || last.type !== "text") return null;

  const startMatch = CALLOUT_START_REGEX.exec(first.value);
  if (!startMatch) return null;

  if (first === last) {
    return transformSingleTextNode(first, startMatch);
  }

  return transformMultiChildParagraph(
    children as unknown as Content[],
    first,
    last,
    startMatch,
  );
}

/**
 * 親ノードの子要素リストを走査して callout を変換する純粋関数
 */
export function transformBlockContent(children: Content[]): Content[] {
  const newChildren: Content[] = [];

  for (const child of children) {
    if (child.type === "paragraph") {
      const calloutNode = tryTransformSingleParagraph(child as Paragraph);
      if (calloutNode) {
        newChildren.push(calloutNode);
        continue;
      }
    }

    if ("children" in child && Array.isArray((child as Parent).children)) {
      (child as Parent).children = transformBlockContent((child as Parent).children as Content[]);
    }
    newChildren.push(child);
  }

  return newChildren;
}

/**
 * 独自構文 /// {type} ... /// を認識する remark プラグイン
 */
export const remarkCalloutPlugin: Plugin<[], MdastRoot> = () => {
  return (tree) => {
    tree.children = transformBlockContent(tree.children as Content[]) as MdastRoot["children"];
  };
};

/**
 * コールアウト拡張機能のバリエーション（サブアイテム）定義一覧
 */
export const CALLOUT_SUB_ITEMS: readonly MarkdownExtensionSubItem[] = [
  {
    id: "info",
    label: "情報 (Info)",
    icon: "circle-info-solid-full",
    template: "/// info\n\n///",
  },
  {
    id: "check",
    label: "確認・成功 (Check)",
    icon: "circle-check-solid-full",
    template: "/// check\n\n///",
  },
  {
    id: "gear",
    label: "設定・中立 (Gear)",
    icon: "gear-solid-full",
    template: "/// gear\n\n///",
  },
  {
    id: "warn",
    label: "警告 (Warn)",
    icon: "triangle-exclamation-solid-full",
    template: "/// warn\n\n///",
  },
  {
    id: "alert",
    label: "注意・エラー (Alert)",
    icon: "circle-exclamation-solid-full",
    template: "/// alert\n\n///",
  },
];

/**
 * コールアウト拡張機能パッケージ (Callout Extension)
 */
export const calloutExtension: MarkdownFeatureExtension = {
  id: "callout",
  label: "コールアウト",
  description: "重要度に応じたコールアウトブロックを表示します",
  template: "/// info\n内容\n///",
  example: "/// warn\nご注意ください\n///",
  toolbarItem: {
    icon: "circle-info-solid-full",
    title: "コールアウト",
  },
  subItems: CALLOUT_SUB_ITEMS,
  processor: {
    remarkPlugins: [remarkCalloutPlugin],
    sanitizeSchemaModifier: (baseSchema) => {
      const schema = JSON.parse(JSON.stringify(baseSchema));
      schema.tagNames = [
        ...(schema.tagNames || []),
        "wa-callout",
        "wa-icon",
      ];
      schema.attributes = {
        ...(schema.attributes || {}),
        "wa-callout": [
          ...((schema.attributes && schema.attributes["wa-callout"]) || []),
          "variant",
          "size",
        ],
        "wa-icon": [
          ...((schema.attributes && schema.attributes["wa-icon"]) || []),
          "library",
          "name",
          "slot",
        ],
      };
      schema.clobber = (
        schema.clobber || ["ariaDescribedBy", "ariaLabelledBy", "id", "name"]
      ).filter((prop: string) => prop !== "name");
      return schema;
    },
  },
};
