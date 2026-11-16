import type { Plugin } from "unified";
import type { Root as MdastRoot, Text, Parent } from "mdast";
import { visit } from "unist-util-visit";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import type { MarkdownFeatureExtension } from "../types.js";

/**
 * ステータスバッジのバリアント種別
 */
export type BadgeVariant = "brand" | "neutral" | "success" | "warning" | "danger";

interface BadgeVariantRule {
  readonly variant: BadgeVariant;
  readonly keywords: readonly string[];
}

/**
 * 評価優先順位付きのキーワード別バリアント判定ルール
 * （「未完了」等が「完了」に誤一致しないよう neutral を先行評価し、danger を warning より優先する）
 */
export const BADGE_VARIANT_RULES: readonly BadgeVariantRule[] = [
  {
    variant: "neutral",
    keywords: [
      "保留",
      "中止",
      "停止",
      "無効",
      "未着手",
      "未完了",
      "未対応",
      "下書き",
      "メモ",
      "参考",
    ],
  },
  {
    variant: "danger",
    keywords: ["緊急", "至急", "危険", "エラー", "障害", "高", "不可"],
  },
  {
    variant: "warning",
    keywords: ["重要", "注意", "警告", "要確認", "確認待ち", "要対応", "期限"],
  },
  {
    variant: "success",
    keywords: ["完了", "成功", "解決", "承認", "済"],
  },
];

const BADGE_SYNTAX_REGEX = /:badge\[([^\]]+)\]:/;

/**
 * カスタムバッジの MDAST ノード型
 */
interface CustomBadgeNode extends Parent {
  type: "customBadge";
  data?: {
    hName?: string;
    hProperties?: Record<string, string | boolean>;
  };
  children: Text[];
}

declare module "mdast" {
  interface RootContentMap {
    customBadge: CustomBadgeNode;
  }
}

/**
 * ラベル文字列からステータスバッジのバリアントを解決する純粋関数
 */
export function resolveBadgeVariant(label: string): BadgeVariant {
  const matched = BADGE_VARIANT_RULES.find((rule) =>
    rule.keywords.some((keyword) => label.includes(keyword)),
  );
  return matched ? matched.variant : "brand";
}

/**
 * バッジテキストから wa-badge の MDAST ノードを構築する純粋関数
 */
function buildBadgeAstNode(badgeText: string): CustomBadgeNode {
  return {
    type: "customBadge",
    data: {
      hName: "wa-badge",
      hProperties: {
        variant: resolveBadgeVariant(badgeText),
        appearance: "filled",
        pill: true,
      },
    },
    children: [{ type: "text", value: badgeText }],
  };
}

/**
 * テキスト文字列から :badge[...]: 構文を抽出し、Text / CustomBadgeNode 配列へ分割する純粋関数
 */
export function splitTextByBadges(value: string): (Text | CustomBadgeNode)[] {
  const regex = new RegExp(BADGE_SYNTAX_REGEX.source, "g");
  const newNodes: (Text | CustomBadgeNode)[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIdx) {
      newNodes.push({
        type: "text",
        value: value.slice(lastIdx, match.index),
      });
    }
    newNodes.push(buildBadgeAstNode(match[1]));
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < value.length) {
    newNodes.push({
      type: "text",
      value: value.slice(lastIdx),
    });
  }

  return newNodes;
}

/**
 * 独自構文 :badge[テキスト]: を認識する remark プラグイン
 */
export const remarkCustomBadgePlugin: Plugin<[], MdastRoot> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!BADGE_SYNTAX_REGEX.test(node.value) || !parent || typeof index !== "number") {
        return;
      }
      const newNodes = splitTextByBadges(node.value);
      (parent as Parent).children.splice(index, 1, ...newNodes);
    });
  };
};

const BADGE_HELP_COLOR_ORDER: readonly {
  readonly variant: Exclude<BadgeVariant, "brand">;
  readonly colorLabel: string;
}[] = [
  { variant: "danger", colorLabel: "赤" },
  { variant: "warning", colorLabel: "黄" },
  { variant: "success", colorLabel: "緑" },
  { variant: "neutral", colorLabel: "灰" },
];

/**
 * 構文ヘルプ向けのカラー別キーワード説明文を生成する純粋関数
 */
function buildBadgeHelpDescription(): string {
  const colorLines = BADGE_HELP_COLOR_ORDER.map(({ variant, colorLabel }) => {
    const rule = BADGE_VARIANT_RULES.find((r) => r.variant === variant);
    return `・${colorLabel}: ${rule ? rule.keywords.join(", ") : ""}`;
  });
  return [
    "重要度や状態を表すカラーバッジを表示します。",
    ...colorLines,
    "・青: 上記以外",
  ].join("\n");
}

/**
 * カスタムバッジ機能拡張パッケージ (Custom Badge Extension)
 */
export const customBadgeExtension: MarkdownFeatureExtension = {
  id: "custom-badge",
  label: "ステータスバッジ",
  description: buildBadgeHelpDescription(),
  template: ":badge[ラベル]:",
  example: ":badge[優先度:高]:",
  toolbarItem: {
    icon: "tag-solid-full",
    title: "ステータスバッジ",
  },
  processor: {
    remarkPlugins: [remarkCustomBadgePlugin],
    sanitizeSchemaModifier: (baseSchema) => {
      const schema = JSON.parse(JSON.stringify(baseSchema));
      schema.tagNames = [...(schema.tagNames || []), "wa-badge"];
      schema.attributes = {
        ...(schema.attributes || {}),
        "wa-badge": [
          ...((schema.attributes && schema.attributes["wa-badge"]) || []),
          "variant",
          "appearance",
          "pill",
        ],
      };
      return schema;
    },
  },
};
