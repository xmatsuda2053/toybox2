import type { Plugin } from "unified";
import type { Root as MdastRoot, Text, Node } from "mdast";
import { visit } from "unist-util-visit";
import type { MarkdownFeatureExtension } from "../types.js";

/**
 * 独自構文 :badge[テキスト]: を認識する remark プラグイン
 */
export const remarkCustomBadgePlugin: Plugin<[], MdastRoot> = () => {
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

      parent.children.splice(index, 1, ...(newNodes as any[]));
    });
  };
};

/**
 * カスタムバッジ機能拡張パッケージ (Custom Badge Extension)
 */
export const customBadgeExtension: MarkdownFeatureExtension = {
  id: "custom-badge",
  label: "ステータスバッジ",
  description: "重要度や状態を表すカラーバッジを表示します",
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
      schema.attributes = {
        ...(schema.attributes || {}),
        span: [
          ...((schema.attributes && schema.attributes.span) || []),
          "className",
          "style",
        ],
      };
      return schema;
    },
  },
};
