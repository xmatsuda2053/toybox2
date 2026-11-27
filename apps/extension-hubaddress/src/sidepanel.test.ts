import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { flattenTemplate } from "@shared/utils";
import type { TemplateResult } from "lit";
import { HubAddressApp } from "./hubaddress-app";
import {
  renderOrganizationCard,
  renderStaffCard,
} from "./components/directory-cards";

/**
 * テスト仕様: Side Panel シェル UI・カードレイアウト・SCSS 規約検証 (sidepanel.test.ts)
 *
 * - 仕様1: hubaddress-app.scss および directory-cards.scss にカラー直値（Hex / RGB / RGBA）・!important・@extend が含まれないこと
 * - 仕様2: テーマ切替時の点滅を防ぐため :host に背景色・文字色の transition が設定されていないこと、カードホバー背景色と中央揃えが定義されていること
 * - 仕様3: 検索入力に with-clear が設定され、「すべての所属」ドロップダウンが除去されていること、タブにアイコンがあること
 * - 仕様4: 職員カードは先頭に5桁職員番号が表示され、メール欄は初期非表示・展開操作時のみ表示されること
 * - 仕様5: 組織カードは「場所」が連絡先の下に配置されていること
 * - 仕様6: テンプレート内の全 wa-tooltip に trigger="hover" が明示指定されていること
 * - 仕様7: manifest.json に icons / action.default_icon (16/32/48/128) が設定され、PNG 実体が存在すること
 * - 仕様8: sidepanel.ts が ./hubaddress-app より先に ./bootstrap-webawesome をインポートし、アプリ内重複ヘッダーが削除されていること
 * - 仕様9: 職員・組織の追加ボタンがプラスアイコンのみで構成され、aria-label とホバーツールチップで説明が表示されること
 * - 仕様10: 職員カードにフリガナが表示されること
 * - 仕様11: 職員番号・職員氏名・組織名のクリックでクリップボードコピー（onCopy）が呼び出されること
 * - 仕様12: テンプレート内で Web Awesome 非推奨の size 属性値（small / medium / large）が使われていないこと
 * - 仕様13: 組織カードの連絡先および職員メールのチップにコピーアイコンやテキスト文字が出力されず、種別アイコンで表示されること
 * - 仕様14: HubAddress ブランドカラー（#036730 / wa-brand-green）がテーマ・追加ボタン・カードリンクへ適用されていること
 * - 仕様15: 設定ボタンが toggleSettingsTab を呼び出し再クリックで一覧画面へ戻れること
 * - 仕様16: 配布用 ZIP 生成スクリプト・PR 同梱ルール・hubaddress-extension.zip が整備されていること
 * - 仕様17: 職員一覧の追加ボタン左隣にソート順切替ドロップダウンが配置され、職員・組織の追加ボタンとソートボタンのサイズが size="xs" であること
 * - 仕様18: 職員一覧・組織一覧の描画に @lit-labs/virtualizer（<lit-virtualizer scroller>）が使用され、ツールバー固定＋独立スクロール構造であること
 * - 仕様19: 狭幅（< 680px）表示時は非アクティブなタブのリスト描画をスキップする仕組みを持つこと
 * - 仕様20: カード内の繰り返し要素には <wa-tooltip> を量産せず軽量なネイティブ title 属性を使用し、ツールバー固定ボタンの <wa-tooltip trigger="hover"> は維持すること
 * - 仕様21: 初期データ読み込み中（isLoading）は <wa-spinner> によるローディング表示を行い、空データ表示と区別すること
 * - 仕様22: 職員カードの役職（.directory-card__sub）が氏名の下の行に配置され、幅不足時は 1行で省略表示（text-overflow: ellipsis）されること
 * - 仕様23: .hubaddress-shell__column に overflow: hidden が設定されず、検索フィルタ欄のフォーカスアウトラインが左右でクリップされないこと
 * - 仕様24: sidepanel.ts が ResizeObserver loop エラーガードを起動時に登録・pagehide で解除し、.directory-card-list に scrollbar-gutter: stable が設定されていること
 * - 仕様25: 職員カードの組織名・メール展開ボタン行が折り返さず、幅不足時は組織名が1行省略表示されリサイズ・2カラム切替へ追従し、title 属性で完全な組織名を確認できること
 * - 仕様26: 組織一覧の追加ボタン左隣に size="xs" のソート順切替ドロップダウン（登録順・組織名・場所）とホバーツールチップが配置されていること
 */
describe("Side Panel Shell & SCSS Compliance Tests", () => {
  const srcRoot = resolve(__dirname);
  const scssFiles = [
    resolve(srcRoot, "hubaddress-app.scss"),
    resolve(srcRoot, "components/directory-cards.scss"),
  ];
  const templateFiles = [
    resolve(srcRoot, "hubaddress-app.ts"),
    resolve(srcRoot, "components/directory-cards.ts"),
  ];

  it("SCSS ファイルにカラー直値・!important・@extend が含まれないこと", () => {
    for (const filePath of scssFiles) {
      const scss = readFileSync(filePath, "utf-8");
      expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss).not.toMatch(/\brgba?\(/i);
      expect(scss).not.toMatch(/!important/i);
      expect(scss).not.toMatch(/@extend\b/);
    }
  });

  it("点滅防止・ホバー背景色・カードヘッダー中央揃え・文字サイズ拡大・並列レイアウトが定義されていること", () => {
    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    expect(shellScss).toMatch(/@media\s*\(\s*min-width:\s*680px\s*\)/);
    expect(shellScss).toContain(".hubaddress-shell__split-grid");
    expect(shellScss).not.toMatch(/:host\s*\{[^}]*transition:/s);

    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    expect(cardScss).toContain(".directory-card:hover");
    expect(cardScss).toMatch(
      /\.directory-card__header\s*\{[^}]*align-items:\s*center/s,
    );
    expect(cardScss).toContain("--wa-font-size-m");
    expect(cardScss).toMatch(
      /\.directory-card__staff-id\s*\{[^}]*font-size:\s*var\(--wa-font-size-s\)/s,
    );
  });

  it("検索入力に with-clear が設定され、すべての所属ドロップダウンがなく、タブにアイコンが設定されていること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    expect(appSource).toContain("with-clear");
    expect(appSource).not.toContain("clearable");
    expect(appSource).not.toContain("すべての所属");
    expect(appSource).not.toContain("<wa-select");
    expect(appSource).toContain("user-solid-full");
    expect(appSource).toContain("building-solid-full");
  });

  it("職員カード先頭に5桁職員番号が表示され、メールは初期非表示・展開時のみ表示されること", () => {
    const staff = {
      id: 1,
      staffId: "0010001",
      name: "田中 太郎",
      department: "総務部 総務課",
      title: "課長",
      emails: ["tanaka@example.com"],
    };

    const collapsedHtml = flattenTemplate(
      renderStaffCard(staff, 0, {
        isEmailsExpanded: false,
        onToggleEmails: () => {},
        onJumpToDepartment: () => {},
        onCopy: () => {},
      }),
    );
    const idIdx = collapsedHtml.indexOf("10001");
    const nameIdx = collapsedHtml.indexOf("田中 太郎");
    expect(idIdx).toBeGreaterThan(-1);
    expect(nameIdx).toBeGreaterThan(idIdx);
    expect(collapsedHtml).toContain("envelope-solid-full");
    expect(collapsedHtml).toContain("angle-down-solid-full");
    expect(collapsedHtml).not.toContain("tanaka@example.com");

    const expandedHtml = flattenTemplate(
      renderStaffCard(staff, 0, {
        isEmailsExpanded: true,
        onToggleEmails: () => {},
        onJumpToDepartment: () => {},
        onCopy: () => {},
      }),
    );
    expect(expandedHtml).toContain("tanaka@example.com");
  });

  it("組織カードでは場所が連絡先の下に配置され、場所 / その他の順で表示されること", () => {
    const org = {
      id: 1,
      department: "総務部 総務課",
      location: "本庁舎",
      extra: "3階 3F-A",
      title: "課長席",
      extensionNumber: "2101",
      phoneNumber: "03-1234-2101",
      faxNumber: "03-1234-2109",
      notes: "代表窓口",
    };

    const htmlStr = flattenTemplate(
      renderOrganizationCard(org, 0, {
        onCopy: () => {},
      }),
    );
    const contactsIdx = htmlStr.indexOf("2101");
    const placeIdx = htmlStr.indexOf("本庁舎 / 3階 3F-A");
    expect(contactsIdx).toBeGreaterThan(-1);
    expect(placeIdx).toBeGreaterThan(contactsIdx);
  });

  it("テンプレート内の全 wa-tooltip に trigger='hover' が明示指定されていること", () => {
    let tooltipCount = 0;
    for (const filePath of templateFiles) {
      const content = readFileSync(filePath, "utf-8");
      const matches = content.match(/<wa-tooltip\b[^>]*>/g) ?? [];
      for (const tag of matches) {
        tooltipCount++;
        expect(tag).toContain('trigger="hover"');
      }
    }
    expect(tooltipCount).toBeGreaterThan(0);
  });

  it("manifest.json にツールバー・拡張機能アイコン (16/32/48/128) が設定され、PNG ファイルが存在すること", () => {
    const publicDir = resolve(srcRoot, "../public");
    const manifest = JSON.parse(
      readFileSync(resolve(publicDir, "manifest.json"), "utf-8"),
    ) as {
      icons?: Record<string, string>;
      action?: { default_icon?: Record<string, string> };
    };

    const requiredSizes = ["16", "32", "48", "128"];
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    for (const size of requiredSizes) {
      const iconPath = manifest.icons?.[size];
      const actionIconPath = manifest.action?.default_icon?.[size];
      expect(iconPath).toBeTruthy();
      expect(actionIconPath).toBe(iconPath);

      const fullPath = resolve(publicDir, iconPath!);
      expect(existsSync(fullPath)).toBe(true);
      const header = Array.from(readFileSync(fullPath).subarray(0, 8));
      expect(header).toEqual(pngSignature);
    }
  });

  it("sidepanel.ts が hubaddress-app より先にアイコン登録ブートストラップを読み込み、アプリ内重複ヘッダーが削除されていること", () => {
    const bootstrapPath = resolve(srcRoot, "bootstrap-webawesome.ts");
    expect(existsSync(bootstrapPath)).toBe(true);
    const bootstrapSource = readFileSync(bootstrapPath, "utf-8");
    expect(bootstrapSource).toContain("registerWebAwesome()");

    const sidepanelSource = readFileSync(
      resolve(srcRoot, "sidepanel.ts"),
      "utf-8",
    );
    const bootstrapImportIdx = sidepanelSource.indexOf(
      'import "./bootstrap-webawesome"',
    );
    const appImportIdx = sidepanelSource.indexOf('import "./hubaddress-app"');
    expect(bootstrapImportIdx).toBeGreaterThan(-1);
    expect(appImportIdx).toBeGreaterThan(bootstrapImportIdx);

    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    expect(appSource).not.toContain("hubaddress-shell__header");
    expect(appSource).not.toContain("hubaddress-shell__brand");
    expect(appSource).not.toContain("hubaddress-shell__title");
    expect(appSource).not.toContain("renderHeader");

    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    expect(shellScss).not.toContain(".hubaddress-shell__header");
    expect(shellScss).not.toContain(".hubaddress-shell__brand");
    expect(shellScss).not.toContain(".hubaddress-shell__title");
  });

  it("職員・組織の追加ボタンがプラスアイコンのみで、ホバーツールチップにより説明が表示されること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );

    const staffBtnMatch = appSource.match(
      /<wa-button[^>]*id="add-staff-btn"[^>]*>([\s\S]*?)<\/wa-button>/,
    );
    expect(staffBtnMatch).not.toBeNull();
    expect(staffBtnMatch?.[0]).toContain('aria-label="職員を追加"');
    expect(staffBtnMatch?.[1]).toContain('name="plus-solid-full"');
    expect(staffBtnMatch?.[1]).not.toContain("職員を追加");
    expect(appSource).toMatch(
      /<wa-tooltip\s+for="add-staff-btn"\s+trigger="hover"\s*>\s*職員を追加\s*<\/wa-tooltip\s*>/,
    );

    const orgBtnMatch = appSource.match(
      /<wa-button[^>]*id="add-organization-btn"[^>]*>([\s\S]*?)<\/wa-button>/,
    );
    expect(orgBtnMatch).not.toBeNull();
    expect(orgBtnMatch?.[0]).toContain('aria-label="組織を追加"');
    expect(orgBtnMatch?.[1]).toContain('name="plus-solid-full"');
    expect(orgBtnMatch?.[1]).not.toContain("組織を追加");
    expect(appSource).toMatch(
      /<wa-tooltip\s+for="add-organization-btn"\s+trigger="hover"\s*>\s*組織を追加\s*<\/wa-tooltip\s*>/,
    );
  });

  it("職員カードにフリガナが表示され、職員番号・氏名・組織名クリックでコピーできること", () => {
    function collectClickHandlers(
      value: unknown,
      handlers: (() => void)[],
    ): void {
      if (typeof value === "function") {
        handlers.push(value as () => void);
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          collectClickHandlers(item, handlers);
        }
        return;
      }
      if (value && typeof value === "object" && "values" in value) {
        for (const inner of (value as TemplateResult).values) {
          collectClickHandlers(inner, handlers);
        }
      }
    }

    const onStaffCopy = vi.fn();
    const staff = {
      id: 1,
      staffId: "0010001",
      name: "田中 太郎",
      furigana: "たなか たろう",
      department: "総務部 総務課",
      title: "課長",
      emails: ["tanaka@example.com"],
    };

    const staffTemplate = renderStaffCard(staff, 0, {
      isEmailsExpanded: false,
      onToggleEmails: () => {},
      onJumpToDepartment: () => {},
      onCopy: onStaffCopy,
    });
    const staffHtml = flattenTemplate(staffTemplate);
    expect(staffHtml).toContain('class="directory-card__furigana"');
    expect(staffHtml).toContain('class="directory-card__name-row"');
    expect(staffHtml).toContain("たなか たろう");
    expect(staffHtml).toContain("氏名をコピー");
    expect(staffHtml.indexOf("たなか たろう")).toBeLessThan(
      staffHtml.indexOf("田中 太郎"),
    );
    expect(
      staffHtml.indexOf('class="directory-card__name-row"'),
    ).toBeGreaterThan(staffHtml.indexOf("たなか たろう"));
    // 役職（.directory-card__sub）は氏名行（.directory-card__name-row）の閉じタグより後ろ（氏名の下の行）に配置されること
    const nameRowStart = staffHtml.indexOf('class="directory-card__name-row"');
    const nameRowEnd = staffHtml.indexOf("</div>", nameRowStart);
    const subIdx = staffHtml.indexOf('class="directory-card__sub"');
    expect(nameRowEnd).toBeGreaterThan(nameRowStart);
    expect(subIdx).toBeGreaterThan(nameRowEnd);
    expect(staffHtml).toMatch(/title="?課長"?/);

    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    expect(cardScss).toMatch(
      /\.directory-card__title-group--staff\s*\{[^}]*align-items:\s*stretch/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__staff-id\s*\{[^}]*height:\s*100%/s,
    );

    const staffHandlers: (() => void)[] = [];
    collectClickHandlers(staffTemplate, staffHandlers);
    for (const fn of staffHandlers) {
      fn();
    }
    expect(onStaffCopy).toHaveBeenCalledWith("職員番号", "10001");
    expect(onStaffCopy).toHaveBeenCalledWith("氏名", "田中 太郎");

    const onOrgCopy = vi.fn();
    const org = {
      id: 1,
      department: "総務部 総務課",
      extra: "本庁舎 3階",
      location: "3F-A",
      title: "課長席",
      extensionNumber: "2101",
      phoneNumber: "03-1234-2101",
      faxNumber: "03-1234-2109",
      notes: "代表窓口",
    };
    const orgTemplate = renderOrganizationCard(org, 0, {
      onCopy: onOrgCopy,
    });
    const orgHandlers: (() => void)[] = [];
    collectClickHandlers(orgTemplate, orgHandlers);
    for (const fn of orgHandlers) {
      fn();
    }
    expect(onOrgCopy).toHaveBeenCalledWith("組織名", "総務部 総務課");
  });

  it("テンプレート内で Web Awesome 非推奨の size='small' / 'medium' / 'large' が使われていないこと", () => {
    for (const filePath of templateFiles) {
      const content = readFileSync(filePath, "utf-8");
      expect(content).not.toMatch(/size\s*=\s*["'](?:small|medium|large)["']/);
    }
  });

  it("組織カードの連絡先および職員メールのチップにコピーアイコン・ラベル文字がなく種別アイコンで表示されること", () => {
    const orgHtml = flattenTemplate(
      renderOrganizationCard(
        {
          id: 1,
          department: "総務部 総務課",
          extra: "",
          location: "",
          title: "",
          extensionNumber: "2101",
          phoneNumber: "03-1234-2101",
          faxNumber: "03-1234-2109",
          notes: "",
        },
        0,
        { onCopy: () => {} },
      ),
    );
    expect(orgHtml).not.toContain("copy-solid-full");
    expect(orgHtml).not.toContain("内線:");
    expect(orgHtml).not.toContain("外線:");
    expect(orgHtml).not.toContain("FAX:");
    expect(orgHtml).toContain("hashtag-solid-full");
    expect(orgHtml).toContain("phone-solid-full");
    expect(orgHtml).toContain("fax-solid-full");
    expect(orgHtml).toContain("内線をコピー");
    expect(orgHtml).toContain("外線をコピー");
    expect(orgHtml).toContain("FAXをコピー");

    const staffHtml = flattenTemplate(
      renderStaffCard(
        {
          id: 1,
          staffId: "0010001",
          name: "田中 太郎",
          department: "総務部",
          title: "課長",
          emails: ["tanaka@example.com"],
        },
        0,
        {
          isEmailsExpanded: true,
          onToggleEmails: () => {},
          onJumpToDepartment: () => {},
          onCopy: () => {},
        },
      ),
    );
    expect(staffHtml).not.toContain("copy-solid-full");
    expect(staffHtml).not.toContain("メール:");
    expect(staffHtml).toContain("tanaka@example.com");
    expect(staffHtml).toContain("メールをコピー");
  });

  it("HubAddress ブランドカラー（#036730 / wa-brand-green）がテーマ・追加ボタン・カードリンクへ適用されていること", () => {
    const htmlSource = readFileSync(
      resolve(srcRoot, "../sidepanel.html"),
      "utf-8",
    );
    expect(htmlSource).toMatch(/<html[^>]*class="[^"]*\bwa-brand-green\b/);

    const bootstrapSource = readFileSync(
      resolve(srcRoot, "bootstrap-webawesome.ts"),
      "utf-8",
    );
    expect(bootstrapSource).toContain(
      "@awesome.me/webawesome/dist/styles/color/variants/brand.css",
    );
    expect(bootstrapSource).toContain("./styles/theme.css");

    const themePath = resolve(srcRoot, "styles/theme.css");
    expect(existsSync(themePath)).toBe(true);
    const themeCss = readFileSync(themePath, "utf-8");
    expect(themeCss).toContain(
      "--wa-color-brand-fill-loud: var(--wa-color-green-40)",
    );

    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    expect(cardScss).not.toContain("--wa-color-brand-text-normal");
    expect(cardScss).toContain("--wa-color-brand-on-quiet");
    expect(cardScss).toMatch(
      /\.directory-card__dept-btn\s*\{[^}]*color:\s*var\(--wa-color-text-normal\)/s,
    );

    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    const staffAddMatch = appSource.match(
      /<wa-button[^>]*id="add-staff-btn"[^>]*>/,
    );
    const orgAddMatch = appSource.match(
      /<wa-button[^>]*id="add-organization-btn"[^>]*>/,
    );
    expect(staffAddMatch?.[0]).toContain('variant="brand"');
    expect(orgAddMatch?.[0]).toContain('variant="brand"');
  });

  it("設定ボタンクリックで toggleSettingsTab が呼ばれ、再クリックで元の画面へ戻れること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    expect(appSource).toContain("this.controller.toggleSettingsTab()");
    expect(appSource).toContain(
      'aria-pressed=${String(activeTab === "settings")}',
    );
  });

  it("配布用 ZIP 生成スクリプトと PR 同梱ルールが整備され、hubaddress-extension.zip 直下に manifest.json が含まれること", () => {
    const extRoot = resolve(srcRoot, "..");
    const repoRoot = resolve(extRoot, "../..");

    const extPkg = JSON.parse(
      readFileSync(resolve(extRoot, "package.json"), "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(extPkg.scripts?.package).toBeTruthy();
    expect(extPkg.scripts?.package).toContain(
      "dist-zip/hubaddress-extension.zip",
    );

    const rootPkg = JSON.parse(
      readFileSync(resolve(repoRoot, "package.json"), "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(rootPkg.scripts?.["package:ext-hubaddress"]).toBeTruthy();

    const commonRule = readFileSync(
      resolve(repoRoot, ".agents/rules/code-style-common.md"),
      "utf-8",
    );
    expect(commonRule).toContain("dist-zip/hubaddress-extension.zip");
    expect(commonRule).toContain("package:ext-hubaddress");

    expect(existsSync(resolve(extRoot, "hubaddress-extension.zip"))).toBe(
      false,
    );
    const zipPath = resolve(extRoot, "dist-zip/hubaddress-extension.zip");
    expect(existsSync(zipPath)).toBe(true);
    const zipBuf = readFileSync(zipPath);
    expect(Array.from(zipBuf.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(zipBuf.includes(Buffer.from("manifest.json"))).toBe(true);
    expect(zipBuf.includes(Buffer.from("dist/manifest.json"))).toBe(false);
    expect(zipBuf.includes(Buffer.from("dist\\manifest.json"))).toBe(false);
  });

  it("HubAddressApp カスタム要素クラスが定義されていること", () => {
    expect(HubAddressApp).toBeDefined();
  });

  it("職員一覧の追加ボタン左隣に size='xs' のソートドロップダウンが配置され、組織一覧の追加ボタンも size='xs' であること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );

    const staffAddMatch = appSource.match(
      /<wa-button[^>]*id="add-staff-btn"[^>]*>/,
    );
    const orgAddMatch = appSource.match(
      /<wa-button[^>]*id="add-organization-btn"[^>]*>/,
    );
    const sortBtnMatch = appSource.match(
      /<wa-button[^>]*id="sort-staff-btn"[^>]*>/,
    );

    expect(staffAddMatch?.[0]).toContain('size="xs"');
    expect(staffAddMatch?.[0]).not.toContain('size="s"');
    expect(orgAddMatch?.[0]).toContain('size="xs"');
    expect(orgAddMatch?.[0]).not.toContain('size="s"');

    expect(sortBtnMatch).not.toBeNull();
    expect(sortBtnMatch?.[0]).toContain('size="xs"');
    expect(sortBtnMatch?.[0]).toContain('slot="trigger"');
    expect(sortBtnMatch?.[0]).not.toContain("with-caret");

    const sortIndex = appSource.indexOf('id="sort-staff-btn"');
    const addIndex = appSource.indexOf('id="add-staff-btn"');
    expect(sortIndex).toBeGreaterThan(-1);
    expect(addIndex).toBeGreaterThan(sortIndex);

    expect(appSource).toContain('name="arrow-down-wide-short-solid-full"');
    expect(appSource).toMatch(
      /<wa-tooltip[^>]*for="sort-staff-btn"[^>]*trigger="hover"/,
    );
    expect(appSource).toContain("<wa-dropdown");
    expect(appSource).toContain("wa-dropdown-item");
    expect(appSource).toContain("value=${option.value}");
    expect(appSource).toContain('value: "department"');
    expect(appSource).toContain('value: "name"');
    expect(appSource).toContain('value: "staffId"');
    expect(appSource).toContain("所属部署・氏名");
    expect(appSource).toContain("職員番号");
    expect(appSource).toContain('type="checkbox"');
    expect(appSource).toContain("hubaddress-shell__column-actions");
    expect(shellScss).toContain(".hubaddress-shell__column-actions");
  });

  it("職員・組織一覧に lit-virtualizer (scroller) が導入され、ツールバー固定＋独立スクロール構造であること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );

    expect(appSource).toContain('"@lit-labs/virtualizer"');
    const virtualizerMatches = appSource.match(/<lit-virtualizer\b/g) ?? [];
    expect(virtualizerMatches.length).toBeGreaterThanOrEqual(2);
    expect(appSource).toContain("scroller");
    expect(appSource).toContain(".items=");
    expect(appSource).toContain(".renderItem=");
    expect(appSource).toContain(".keyFunction=");

    expect(shellScss).toMatch(
      /\.hubaddress-shell__body\s*\{[^}]*overflow:\s*hidden/s,
    );
    expect(shellScss).toMatch(
      /\.hubaddress-shell__column-toolbar\s*\{[^}]*flex-shrink:\s*0/s,
    );
    expect(cardScss).toContain(".directory-card-list__item");
  });

  it("狭幅表示時は非アクティブなカラムのリスト描画をスキップし、読み込み中は wa-spinner を表示すること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );

    expect(appSource).toContain("(min-width: 680px)");
    expect(appSource).toContain("isWideLayout");
    expect(appSource).toContain("this.controller.isLoading");
    expect(appSource).toContain("<wa-spinner");
    expect(appSource).toContain("scheduleStaffSearchQuery");
    expect(appSource).toContain("scheduleOrganizationSearchQuery");
  });

  it("カード内には wa-tooltip を生成せずネイティブ title 属性で軽量化されていること", () => {
    const cardSource = readFileSync(
      resolve(srcRoot, "components/directory-cards.ts"),
      "utf-8",
    );
    expect(cardSource).not.toContain("<wa-tooltip");
    expect(cardSource).toContain("title=");

    const staffHtml = flattenTemplate(
      renderStaffCard(
        {
          id: 1,
          staffId: "0010001",
          name: "田中 太郎",
          furigana: "たなか たろう",
          department: "総務部 総務課",
          title: "とても長い役職名のテスト部長代理補佐",
          emails: ["tanaka@example.com"],
        },
        0,
        {
          isEmailsExpanded: true,
          onToggleEmails: () => {},
          onJumpToDepartment: () => {},
          onCopy: () => {},
          onEdit: () => {},
          onDelete: () => {},
        },
      ),
    );
    expect(staffHtml).not.toContain("<wa-tooltip");
    expect(staffHtml).toMatch(/title="?職員番号をコピー"?/);
    expect(staffHtml).toMatch(/title="?氏名をコピー"?/);
    expect(staffHtml).toMatch(/title="?総務部 総務課（組織を検索）"?/);
    expect(staffHtml).toMatch(/title="?編集"?/);
    expect(staffHtml).toMatch(/title="?削除"?/);
    expect(staffHtml).toMatch(/title="?メールをコピー"?/);
  });

  it("職員カードの役職（.directory-card__sub）が幅不足時に1行で省略表示されるスタイルを持つこと", () => {
    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    expect(cardScss).toMatch(
      /\.directory-card__sub\s*\{[^}]*overflow:\s*hidden/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__sub\s*\{[^}]*text-overflow:\s*ellipsis/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__sub\s*\{[^}]*white-space:\s*nowrap/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__title-group--staff\s*\{[^}]*flex:\s*1/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__name-stack\s*\{[^}]*flex:\s*1/s,
    );
  });

  it("検索フィルタ欄のフォーカスアウトラインが左右で途切れないよう .hubaddress-shell__column に overflow: hidden が設定されていないこと", () => {
    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    const columnBlockMatch = shellScss.match(
      /\.hubaddress-shell__column\s*\{([^}]*)\}/,
    );
    expect(columnBlockMatch).not.toBeNull();
    expect(columnBlockMatch?.[1]).not.toMatch(/\boverflow:\s*hidden\b/);
    expect(columnBlockMatch?.[1]).toMatch(/\bmin-width:\s*0\b/);
    expect(columnBlockMatch?.[1]).toMatch(/\bmin-height:\s*0\b/);
  });

  it("sidepanel.ts が ResizeObserver loop ガードを登録・解除し、仮想リスト領域に scrollbar-gutter: stable が設定されていること", () => {
    const sidepanelSource = readFileSync(
      resolve(srcRoot, "sidepanel.ts"),
      "utf-8",
    );
    expect(sidepanelSource).toContain("installResizeObserverErrorGuard");
    expect(sidepanelSource).toContain("removeResizeObserverGuard()");

    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    const listBlockMatch = cardScss.match(
      /\.directory-card-list\s*\{([^}]*)\}/,
    );
    expect(listBlockMatch).not.toBeNull();
    expect(listBlockMatch?.[1]).toMatch(/\bscrollbar-gutter:\s*stable\b/);
    expect(listBlockMatch?.[1]).toMatch(/\boverflow-x:\s*hidden\b/);
    expect(listBlockMatch?.[1]).toMatch(/\boverflow-y:\s*auto\b/);
  });

  it("職員カードの組織名ボタンにアイコン・ラベル用クラスと完全な組織名を含む title 属性が付与されていること", () => {
    const longDept =
      "総務企画局 デジタル推進統括部 情報システム基盤整備課 クラウド運用管理係";
    const staffHtml = flattenTemplate(
      renderStaffCard(
        {
          id: 1,
          staffId: "0010001",
          name: "田中 太郎",
          furigana: "たなか たろう",
          department: longDept,
          title: "係長",
          emails: ["tanaka@example.com"],
        },
        0,
        {
          isEmailsExpanded: false,
          onToggleEmails: () => {},
          onJumpToDepartment: () => {},
          onCopy: () => {},
        },
      ),
    );
    expect(staffHtml).toContain('class="directory-card__dept-icon"');
    expect(staffHtml).toContain('class="directory-card__dept-label"');
    expect(staffHtml).toMatch(
      new RegExp(`title="?${longDept}（組織を検索）"?`),
    );
  });

  it("職員カードの組織名とメール展開ボタンが同一行に収まり、幅不足時は1行省略表示されリサイズへ追従するスタイルを持つこと", () => {
    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    expect(cardScss).toMatch(
      /\.directory-card__meta-row\s*\{[^}]*flex-wrap:\s*nowrap/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__meta-row\s*\{[^}]*min-width:\s*0/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-btn\s*\{[^}]*flex:\s*0\s+1\s+auto/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-btn\s*\{[^}]*min-width:\s*0/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-btn\s*\{[^}]*max-width:\s*100%/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-icon\s*\{[^}]*flex-shrink:\s*0/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-label\s*\{[^}]*min-width:\s*0/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-label\s*\{[^}]*overflow:\s*hidden/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-label\s*\{[^}]*text-overflow:\s*ellipsis/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__dept-label\s*\{[^}]*white-space:\s*nowrap/s,
    );
    expect(cardScss).toMatch(
      /\.directory-card__toggle-btn\s*\{[^}]*flex-shrink:\s*0/s,
    );

    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    expect(shellScss).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/,
    );
  });

  it("組織一覧の追加ボタン左隣に size='xs' のソートドロップダウン（登録順・組織名・場所）とホバーツールチップが配置されていること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );

    expect(appSource).toContain('id="sort-organization-btn"');
    expect(appSource).toContain("renderOrganizationSortDropdown");
    expect(appSource).toContain("ORGANIZATION_SORT_OPTIONS");
    expect(appSource).toContain('value: "registered"');
    expect(appSource).toContain("登録順");
    expect(appSource).toContain("組織名");
    expect(appSource).toContain('value: "location"');
    expect(appSource).toContain("場所");
    expect(appSource).toContain("setOrganizationSortMode");
    expect(appSource).toContain("組織一覧の並び順を切り替え");

    const orgColumnIdx = appSource.indexOf("private renderOrganizationColumn");
    const orgSortIdx = appSource.indexOf(
      "renderOrganizationSortDropdown()",
      orgColumnIdx,
    );
    const orgAddIdx = appSource.indexOf(
      'id="add-organization-btn"',
      orgColumnIdx,
    );
    expect(orgSortIdx).toBeGreaterThan(orgColumnIdx);
    expect(orgAddIdx).toBeGreaterThan(orgSortIdx);
  });
});
