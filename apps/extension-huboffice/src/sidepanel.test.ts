import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { flattenTemplate } from "@shared/utils";
import { HubOfficeApp } from "./huboffice-app";
import { renderHomeView } from "./components/home-view";
import { renderSettingsView } from "./components/settings-view";
import { TOOL_REGISTRY } from "./tools/tool-registry";

/**
 * テスト仕様: HubOffice Side Panel シェル UI・規約・マニフェスト・配布パッケージ検証 (sidepanel.test.ts)
 *
 * - 仕様1: 全 SCSS ファイルにカラー直値（Hex / RGB / RGBA）・!important・@extend が含まれないこと
 * - 仕様2: テンプレート内の全 wa-tooltip に trigger="hover" が明示指定されていること
 * - 仕様3: テンプレート内で Web Awesome 非推奨の size 属性値（small / medium / large）が使われていないこと
 * - 仕様4: sidepanel.ts が huboffice-app より先に bootstrap-webawesome をインポートし、ResizeObserver ガードを登録・解除すること
 * - 仕様5: manifest.json に Side Panel・Alt+Shift+O ショートカット・icons (16/32/48/128) が設定され、PNG 実体が存在すること
 * - 仕様6: ホーム画面にフィルタ入力（with-clear）、ツールアイコン・ツール名・説明、ピン留めボタンが描画されること
 * - 仕様7: 設定画面にカラーテーマ切替（ライト/ダーク/システム）、Alt+Shift+O ショートカット案内、HubOffice バージョン情報が表示されること
 * - 仕様8: 西暦・和暦変換ツールで既存の datepicker-input を使用し、今日ボタンが存在しないこと
 * - 仕様9: QRコード生成ツールで wa-textarea・wa-qr-code（error-correction="M"）・S/M/L ダウンロードおよびクリップボードコピーが実装されていること
 * - 仕様10: 配布用 ZIP 生成スクリプトおよび huboffice-extension.zip（直下に manifest.json）が整備されていること
 */
describe("HubOffice Side Panel Shell & Compliance Tests", () => {
  const srcRoot = resolve(__dirname);
  const scssFiles = [
    resolve(srcRoot, "huboffice-app.scss"),
    resolve(srcRoot, "components/home-view.scss"),
    resolve(srcRoot, "components/settings-view.scss"),
    resolve(srcRoot, "tools/wareki-converter/wareki-converter-tool.scss"),
    resolve(srcRoot, "tools/qr-generator/qr-generator-tool.scss"),
  ];
  const templateFiles = [
    resolve(srcRoot, "huboffice-app.ts"),
    resolve(srcRoot, "components/home-view.ts"),
    resolve(srcRoot, "components/settings-view.ts"),
    resolve(srcRoot, "tools/wareki-converter/wareki-converter-tool.ts"),
    resolve(srcRoot, "tools/qr-generator/qr-generator-tool.ts"),
  ];

  it("全 SCSS ファイルにカラー直値・!important・@extend が含まれないこと", () => {
    for (const filePath of scssFiles) {
      const scss = readFileSync(filePath, "utf-8");
      expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss).not.toMatch(/\brgba?\(/i);
      expect(scss).not.toMatch(/!important/i);
      expect(scss).not.toMatch(/@extend\b/);
    }
  });

  it("テンプレート内の全 wa-tooltip に trigger='hover' が明示指定され、非推奨サイズ属性がないこと", () => {
    let tooltipCount = 0;
    for (const filePath of templateFiles) {
      const content = readFileSync(filePath, "utf-8");
      const matches = content.match(/<wa-tooltip\b[^>]*>/g) ?? [];
      for (const tag of matches) {
        tooltipCount++;
        expect(tag).toContain('trigger="hover"');
      }
      expect(content).not.toMatch(/size\s*=\s*["'](?:small|medium|large)["']/);
    }
    expect(tooltipCount).toBeGreaterThan(0);
  });

  it("sidepanel.ts が bootstrap-webawesome を先に読み込み、ResizeObserver ガードを登録・解除すること", () => {
    const sidepanelSource = readFileSync(
      resolve(srcRoot, "sidepanel.ts"),
      "utf-8",
    );
    const bootstrapIdx = sidepanelSource.indexOf(
      'import "./bootstrap-webawesome"',
    );
    const appIdx = sidepanelSource.indexOf('import "./huboffice-app"');
    expect(bootstrapIdx).toBeGreaterThan(-1);
    expect(appIdx).toBeGreaterThan(bootstrapIdx);
    expect(sidepanelSource).toContain("installResizeObserverErrorGuard");
    expect(sidepanelSource).toContain("removeResizeObserverGuard()");
  });

  it("manifest.json に Side Panel・Alt+Shift+O・16/32/48/128 アイコンが定義され PNG が存在すること", () => {
    const publicDir = resolve(srcRoot, "../public");
    const manifest = JSON.parse(
      readFileSync(resolve(publicDir, "manifest.json"), "utf-8"),
    ) as {
      name?: string;
      permissions?: string[];
      side_panel?: { default_path?: string };
      commands?: Record<string, { suggested_key?: { default?: string } }>;
      icons?: Record<string, string>;
      action?: { default_icon?: Record<string, string> };
    };

    expect(manifest.name).toBe("HubOffice");
    expect(manifest.permissions).toContain("sidePanel");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.side_panel?.default_path).toBe("sidepanel.html");
    expect(
      manifest.commands?.["open-huboffice-sidepanel"]?.suggested_key?.default,
    ).toBe("Alt+Shift+O");

    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (const size of ["16", "32", "48", "128"]) {
      const iconPath = manifest.icons?.[size];
      expect(iconPath).toBeTruthy();
      expect(manifest.action?.default_icon?.[size]).toBe(iconPath);
      const fullPath = resolve(publicDir, iconPath!);
      expect(existsSync(fullPath)).toBe(true);
      expect(Array.from(readFileSync(fullPath).subarray(0, 8))).toEqual(
        pngSignature,
      );
    }
  });

  it("ホーム画面にフィルタ入力・ツール一覧・ピン留めボタンが描画され、ホームヘッダーアイコンが house-solid-full であること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "huboffice-app.ts"),
      "utf-8",
    );
    expect(appSource).not.toContain("cubes-stacked-solid-full");
    expect(appSource).toMatch(
      /class="huboffice-shell__brand-icon"[\s\S]*?name="house-solid-full"/,
    );

    const htmlStr = flattenTemplate(
      renderHomeView({
        tools: TOOL_REGISTRY,
        filterQuery: "",
        pinnedToolIds: ["qr-generator"],
        onFilterChange: vi.fn(),
        onFilterClear: vi.fn(),
        onOpenTool: vi.fn(),
        onTogglePin: vi.fn(),
      }),
    );

    expect(htmlStr).toContain("with-clear");
    expect(htmlStr).toContain("西暦・和暦変換");
    expect(htmlStr).toContain("QRコード生成");
    expect(htmlStr).toContain("ピン留め");
  });

  it("設定画面にカラーテーマ・Alt+Shift+O・HubOffice バージョン情報が表示されること", () => {
    const htmlStr = flattenTemplate(
      renderSettingsView({
        themeMode: "system",
        appVersion: "0.1.0",
        onChangeTheme: vi.fn(),
      }),
    );

    expect(htmlStr).toContain("カラーテーマ");
    expect(htmlStr).toContain("Alt+Shift+O");
    expect(htmlStr).toContain("HubOffice");
    expect(htmlStr).toContain("v0.1.0");
  });

  it("西暦・和暦変換ツールが datepicker-input を利用し今日ボタンを持たず、変換結果の値が左揃えで整列すること", () => {
    const warekiSource = readFileSync(
      resolve(srcRoot, "tools/wareki-converter/wareki-converter-tool.ts"),
      "utf-8",
    );
    expect(warekiSource).toContain("<datepicker-input");
    expect(warekiSource).toContain("up-down-solid-full");
    expect(warekiSource).not.toContain("今日");

    const warekiScss = readFileSync(
      resolve(srcRoot, "tools/wareki-converter/wareki-converter-tool.scss"),
      "utf-8",
    );
    expect(warekiScss).toMatch(
      /\.wareki-tool__copy-row\s*\{[^}]*display:\s*grid/s,
    );
    expect(warekiScss).toMatch(
      /\.wareki-tool__copy-row\s*\{[^}]*grid-template-columns:/s,
    );
    expect(warekiScss).toMatch(
      /\.wareki-tool__copy-value\s*\{[^}]*text-align:\s*left/s,
    );
  });

  it("QRコード生成ツールが wa-textarea・wa-qr-code (M固定)・PNG保存と画像コピーを備えること", () => {
    const qrSource = readFileSync(
      resolve(srcRoot, "tools/qr-generator/qr-generator-tool.ts"),
      "utf-8",
    );
    expect(qrSource).toContain("<wa-textarea");
    expect(qrSource).toContain("<wa-qr-code");
    expect(qrSource).toContain("QR_ERROR_CORRECTION_LEVEL");
    expect(qrSource).toContain("ClipboardItem");
    expect(HubOfficeApp).toBeDefined();
  });

  it("配布用 ZIP スクリプトが整備され huboffice-extension.zip 直下に manifest.json が格納されていること", () => {
    const extRoot = resolve(srcRoot, "..");
    const repoRoot = resolve(extRoot, "../..");

    const extPkg = JSON.parse(
      readFileSync(resolve(extRoot, "package.json"), "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(extPkg.scripts?.package).toContain(
      "dist-zip/huboffice-extension.zip",
    );

    const rootPkg = JSON.parse(
      readFileSync(resolve(repoRoot, "package.json"), "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(rootPkg.scripts?.["package:ext-huboffice"]).toBeTruthy();

    const zipPath = resolve(extRoot, "dist-zip/huboffice-extension.zip");
    expect(existsSync(zipPath)).toBe(true);
    const zipBuf = readFileSync(zipPath);
    expect(Array.from(zipBuf.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(zipBuf.includes(Buffer.from("manifest.json"))).toBe(true);
    expect(zipBuf.includes(Buffer.from("dist/manifest.json"))).toBe(false);
    expect(zipBuf.includes(Buffer.from("dist\\manifest.json"))).toBe(false);
  });
});
