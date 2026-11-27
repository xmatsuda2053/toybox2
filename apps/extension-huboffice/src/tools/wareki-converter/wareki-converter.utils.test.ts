import { describe, it, expect } from "vitest";
import {
  parseWarekiInput,
  convertSeirekiToWareki,
  buildCopyFormats,
} from "./wareki-converter.utils";

/**
 * テスト仕様: 西暦・和暦変換純粋ロジック (wareki-converter.utils.ts)
 *
 * - 仕様1: 漢字フル表記（令和・平成・昭和・大正・明治、元年/1年、全角数字、スペース混在、曜日付き）を西暦へ変換できること
 * - 仕様2: 漢字1文字略記（令/平/昭/大/明 ＋ 年月日 / . / / / - / スペース）を西暦へ変換できること
 * - 仕様3: 英字略記＋区切り（R/H/S/T/M、小文字・全角英字・元号直後ピリオド含む）を西暦へ変換できること
 * - 仕様4: 英字略記＋5〜6桁連続数字（YYMMDD / YMMDD）を西暦へ変換でき、曖昧な桁数はエラーとなること
 * - 仕様5: 年のみ・年月のみの入力に対応し、元号数字コード（5081127 等）は非対応としてエラーになること
 * - 仕様6: カレンダー上存在しない日付（2月30日、非うるう年2月29日、13月等）はエラーとなること
 * - 仕様7: 改元境界を超えた日付・年月・年は参考変換結果を返しつつ注意メッセージ（warning）を付与すること
 * - 仕様8: 改元年（年のみ入力）および月途中改元月（年月のみ入力）に改元境界の補足注記（note）を付与すること
 * - 仕様9: 西暦（yyyy-MM-dd）から和暦へ相互変換でき、明治以前（1868-09-07以前）は対象外エラーとなること
 * - 仕様10: 変換結果から1クリックコピー用フォーマット一覧（日付/年月/年それぞれの形式・年度）を生成できること
 */
describe("Wareki Converter Utils Tests", () => {
  it("漢字フル表記（元年・全角・空白・曜日付き）を西暦日付へ変換できること", () => {
    const r1 = parseWarekiInput("令和8年11月27日");
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.value.precision).toBe("day");
      expect(r1.value.isoDate).toBe("2026-11-27");
      expect(r1.value.warekiFull).toBe("令和8年11月27日");
      expect(r1.value.warning).toBeUndefined();
    }

    const rGannen = parseWarekiInput("令和元年5月1日");
    expect(rGannen.ok).toBe(true);
    if (rGannen.ok) {
      expect(rGannen.value.isoDate).toBe("2019-05-01");
      expect(rGannen.value.warekiFull).toBe("令和元年5月1日");
    }

    const rFullWidth = parseWarekiInput("　令和 ８ 年 １１ 月 ２７ 日（金） ");
    expect(rFullWidth.ok).toBe(true);
    if (rFullWidth.ok) {
      expect(rFullWidth.value.isoDate).toBe("2026-11-27");
    }

    const meiji = parseWarekiInput("明治45年7月29日");
    expect(meiji.ok).toBe(true);
    if (meiji.ok) {
      expect(meiji.value.isoDate).toBe("1912-07-29");
    }

    const taisho = parseWarekiInput("大正15年12月24日");
    expect(taisho.ok).toBe(true);
    if (taisho.ok) {
      expect(taisho.value.isoDate).toBe("1926-12-24");
    }
  });

  it("漢字1文字略記および英字略記＋区切り文字の各種形式を変換できること", () => {
    const cases: Array<[string, string]> = [
      ["令8年11月27日", "2026-11-27"],
      ["令8.11.27", "2026-11-27"],
      ["令8/11/27", "2026-11-27"],
      ["令8-11-27", "2026-11-27"],
      ["令8 11 27", "2026-11-27"],
      ["令元.5.1", "2019-05-01"],
      ["R8.11.27", "2026-11-27"],
      ["R08/11/27", "2026-11-27"],
      ["r8-11-27", "2026-11-27"],
      ["Ｒ.８.１１.２７", "2026-11-27"],
      ["R8年11月27日(金)", "2026-11-27"],
      ["H.31.4.30", "2019-04-30"],
      ["S64/1/7", "1989-01-07"],
      ["T1.7.30", "1912-07-30"],
      ["M1.9.8", "1868-09-08"],
    ];

    for (const [input, expectedIso] of cases) {
      const result = parseWarekiInput(input);
      expect(result.ok, `failed for input: ${input}`).toBe(true);
      if (result.ok) {
        expect(result.value.isoDate).toBe(expectedIso);
      }
    }
  });

  it("英字略記＋5〜6桁連続数字を変換でき、曖昧な桁数はエラーになること", () => {
    const r6 = parseWarekiInput("R081127");
    expect(r6.ok).toBe(true);
    if (r6.ok) {
      expect(r6.value.isoDate).toBe("2026-11-27");
    }

    const r5 = parseWarekiInput("R81127");
    expect(r5.ok).toBe(true);
    if (r5.ok) {
      expect(r5.value.isoDate).toBe("2026-11-27");
    }

    const r5Zero = parseWarekiInput("R80401");
    expect(r5Zero.ok).toBe(true);
    if (r5Zero.ok) {
      expect(r5Zero.value.isoDate).toBe("2026-04-01");
    }

    const ambiguous = parseWarekiInput("R8112");
    expect(ambiguous.ok).toBe(false);
  });

  it("年のみ・年月のみの入力に対応し、元号数字コードはエラーになること", () => {
    const yearOnly = parseWarekiInput("S55");
    expect(yearOnly.ok).toBe(true);
    if (yearOnly.ok) {
      expect(yearOnly.value.precision).toBe("year");
      expect(yearOnly.value.year).toBe(1980);
      expect(yearOnly.value.warekiFull).toBe("昭和55年");
    }

    const yearKanji = parseWarekiInput("令和8年");
    expect(yearKanji.ok).toBe(true);
    if (yearKanji.ok) {
      expect(yearKanji.value.precision).toBe("year");
      expect(yearKanji.value.year).toBe(2026);
    }

    const yearMonth1 = parseWarekiInput("令和8年4月");
    expect(yearMonth1.ok).toBe(true);
    if (yearMonth1.ok) {
      expect(yearMonth1.value.precision).toBe("month");
      expect(yearMonth1.value.year).toBe(2026);
      expect(yearMonth1.value.month).toBe(4);
    }

    const yearMonth2 = parseWarekiInput("R0804");
    expect(yearMonth2.ok).toBe(true);
    if (yearMonth2.ok) {
      expect(yearMonth2.value.precision).toBe("month");
      expect(yearMonth2.value.year).toBe(2026);
      expect(yearMonth2.value.month).toBe(4);
    }

    // 元号数字コードは明示的に非対応
    expect(parseWarekiInput("5081127").ok).toBe(false);
    expect(parseWarekiInput("5.08.11.27").ok).toBe(false);
  });

  it("存在しない日付はエラーを返すこと", () => {
    expect(parseWarekiInput("令和8年2月30日").ok).toBe(false);
    expect(parseWarekiInput("令和7年2月29日").ok).toBe(false);
    expect(parseWarekiInput("令和6年2月29日").ok).toBe(true);
    expect(parseWarekiInput("令和8年13月1日").ok).toBe(false);
    expect(parseWarekiInput("令和0年5月1日").ok).toBe(false);
  });

  it("改元境界を超えた日付・年月・年は参考変換結果と注意メッセージを返すこと", () => {
    const overDay = parseWarekiInput("平成32年1月1日");
    expect(overDay.ok).toBe(true);
    if (overDay.ok) {
      expect(overDay.value.isoDate).toBe("2020-01-01");
      expect(overDay.value.warning).toContain("令和2年1月1日");
    }

    const beforeDay = parseWarekiInput("令和元年4月30日");
    expect(beforeDay.ok).toBe(true);
    if (beforeDay.ok) {
      expect(beforeDay.value.isoDate).toBe("2019-04-30");
      expect(beforeDay.value.warning).toContain("平成31年4月30日");
    }

    const overMonth = parseWarekiInput("平成31年5月");
    expect(overMonth.ok).toBe(true);
    if (overMonth.ok) {
      expect(overMonth.value.year).toBe(2019);
      expect(overMonth.value.month).toBe(5);
      expect(overMonth.value.warning).toContain("令和元年5月");
    }

    const overYear = parseWarekiInput("平成32年");
    expect(overYear.ok).toBe(true);
    if (overYear.ok) {
      expect(overYear.value.year).toBe(2020);
      expect(overYear.value.warning).toContain("令和2年");
    }
  });

  it("改元年の年のみ入力および月途中改元月の年月入力に補足注記を付与すること", () => {
    const h31 = parseWarekiInput("平成31年");
    expect(h31.ok).toBe(true);
    if (h31.ok) {
      expect(h31.value.year).toBe(2019);
      expect(h31.value.note).toContain("2019年は改元年です");
      expect(h31.value.note).toContain("平成31年");
      expect(h31.value.note).toContain("令和元年");
    }

    const s64Jan = parseWarekiInput("昭和64年1月");
    expect(s64Jan.ok).toBe(true);
    if (s64Jan.ok) {
      expect(s64Jan.value.year).toBe(1989);
      expect(s64Jan.value.month).toBe(1);
      expect(s64Jan.value.note).toContain("1989年1月は月途中で改元があります");
      expect(s64Jan.value.note).toContain("昭和64年1月");
      expect(s64Jan.value.note).toContain("平成元年1月");
    }
  });

  it("西暦 yyyy-MM-dd から和暦へ変換でき、明治以前はエラーを返すこと", () => {
    const converted = convertSeirekiToWareki("2026-11-27");
    expect(converted.ok).toBe(true);
    if (converted.ok) {
      expect(converted.value.warekiFull).toBe("令和8年11月27日");
      expect(converted.value.warekiShort).toBe("R8.11.27");
      expect(converted.value.fiscalYearLabel).toBe("2026年度（令和8年度）");
    }

    // 1〜3月は前年度扱い
    const jan = convertSeirekiToWareki("2026-03-31");
    expect(jan.ok).toBe(true);
    if (jan.ok) {
      expect(jan.value.fiscalYearLabel).toBe("2025年度（令和7年度）");
    }

    expect(convertSeirekiToWareki("1868-09-07").ok).toBe(false);
  });

  it("変換精度に応じた1クリックコピー用フォーマット一覧を生成すること", () => {
    const dayRes = convertSeirekiToWareki("2026-11-27");
    expect(dayRes.ok).toBe(true);
    if (dayRes.ok) {
      const items = buildCopyFormats(dayRes.value);
      expect(items.map((i) => i.value)).toEqual([
        "2026/11/27",
        "2026-11-27",
        "2026年11月27日(金)",
        "令和8年11月27日(金)",
        "R8.11.27",
        "2026年度（令和8年度）",
      ]);
    }

    const monthRes = parseWarekiInput("令和8年11月");
    expect(monthRes.ok).toBe(true);
    if (monthRes.ok) {
      const items = buildCopyFormats(monthRes.value);
      expect(items.map((i) => i.value)).toEqual([
        "2026/11",
        "2026-11",
        "2026年11月",
        "令和8年11月",
        "R8.11",
        "2026年度（令和8年度）",
      ]);
    }

    const yearRes = parseWarekiInput("令和8年");
    expect(yearRes.ok).toBe(true);
    if (yearRes.ok) {
      const items = buildCopyFormats(yearRes.value);
      expect(items.map((i) => i.value)).toEqual(["2026年", "令和8年", "R8"]);
    }
  });
});
