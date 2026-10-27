import type { Plugin } from "unified";
import type { Root as MdastRoot, Text, Parent } from "mdast";
import { visit } from "unist-util-visit";
import type { MarkdownFeatureExtension } from "../types.js";

/**
 * カラーテキストの MDAST ノード型
 */
interface ColorNode extends Parent {
  type: "colorText";
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
  children: Text[];
}

declare module "mdast" {
  interface RootContentMap {
    colorText: ColorNode;
  }
}

/**
 * カラー構文の正規表現
 * /color:content/
 * color: 英字色名 (red等) または 16進数カラーコード (#999999等)
 * content: 改行・スラッシュを含まない文字列
 */
export const COLOR_SYNTAX_REGEX = /\/([a-zA-Z]+|#[0-9a-fA-F]{3,8}):([^/\n]+)\//g;

/**
 * テキスト文字列からカラー構文を解析し、Text ノードおよび ColorNode の配列を生成する純粋関数
 *
 * @param textNodeValue 入力テキスト
 * @returns 分割されたノードの配列
 */
export function parseColorTextNodes(textNodeValue: string): (Text | ColorNode)[] {
  const regex = new RegExp(COLOR_SYNTAX_REGEX.source, "g");
  const newNodes: (Text | ColorNode)[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(textNodeValue)) !== null) {
    if (match.index > lastIdx) {
      newNodes.push({
        type: "text",
        value: textNodeValue.slice(lastIdx, match.index),
      });
    }

    const color = match[1];
    const content = match[2];

    newNodes.push({
      type: "colorText",
      data: {
        hName: "span",
        hProperties: {
          style: `color:${color}`,
        },
      },
      children: [{ type: "text", value: content }],
    });

    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < textNodeValue.length) {
    newNodes.push({
      type: "text",
      value: textNodeValue.slice(lastIdx),
    });
  }

  return newNodes;
}

/**
 * 独自構文 /color:content/ を認識する remark プラグイン
 */
export const remarkColorPlugin: Plugin<[], MdastRoot> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      const regex = new RegExp(COLOR_SYNTAX_REGEX.source, "g");
      if (!regex.test(node.value) || !parent || typeof index !== "number") {
        return;
      }

      const newNodes = parseColorTextNodes(node.value);
      (parent as Parent).children.splice(index, 1, ...newNodes);
    });
  };
};

/**
 * カラー文字機能拡張パッケージ (Color Extension)
 */
export const colorExtension: MarkdownFeatureExtension = {
  id: "color",
  label: "文字色",
  description: "指定した色（色名またはカラーコード）でテキストを表示します",
  template: "/red:テキスト/",
  example: "/red:重要/ または /#999999:補足/",
  toolbarItem: {
    icon: "palette-solid-full",
    title: "文字色",
  },
  processor: {
    remarkPlugins: [remarkColorPlugin],
    sanitizeSchemaModifier: (baseSchema) => {
      const schema = JSON.parse(JSON.stringify(baseSchema));
      schema.attributes = {
        ...(schema.attributes || {}),
        span: [
          ...((schema.attributes && schema.attributes.span) || []),
          "style",
        ],
      };
      return schema;
    },
  },
};
