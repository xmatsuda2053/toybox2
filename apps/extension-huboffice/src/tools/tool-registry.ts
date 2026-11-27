import type { ToolDefinition } from "../models/huboffice.model";

/**
 * HubOffice ツールレジストリ
 * 新規ツールを追加する際はここへ 1 エントリ登録し、huboffice-app.ts のツール描画へ接続する
 */
export const TOOL_REGISTRY: readonly ToolDefinition[] = [
  {
    id: "wareki-converter",
    name: "西暦・和暦変換",
    description: "西暦日付と和暦（明治〜令和）を相互変換しワンクリックコピー",
    keywords: [
      "和暦",
      "西暦",
      "元号",
      "令和",
      "平成",
      "昭和",
      "大正",
      "明治",
      "日付",
      "年度",
      "wareki",
    ],
    icon: "calendar-solid-full",
  },
  {
    id: "qr-generator",
    name: "QRコード生成",
    description: "入力テキストをS/M/Lの3サイズPNG画像へ変換・コピー",
    keywords: ["qr", "qrcode", "バーコード", "画像", "png", "url"],
    icon: "qrcode-solid-full",
  },
] as const;

/**
 * ID からツール定義を取得する
 */
export function findToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}
