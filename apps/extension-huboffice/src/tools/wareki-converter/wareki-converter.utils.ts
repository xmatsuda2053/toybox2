import { getJapaneseWeekday } from "@shared/utils";

export type EraCode = "M" | "T" | "S" | "H" | "R";
export type ConversionPrecision = "day" | "month" | "year";

export interface EraDefinition {
  readonly code: EraCode;
  readonly kanji: string;
  readonly shortKanji: string;
  readonly startYear: number;
  readonly startMonth: number;
  readonly startDay: number;
  readonly endYear?: number;
  readonly endMonth?: number;
  readonly endDay?: number;
}

export interface WarekiConversionValue {
  readonly precision: ConversionPrecision;
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
  readonly isoDate?: string;
  readonly eraCode: EraCode;
  readonly eraKanji: string;
  readonly eraYear: number;
  readonly warekiFull: string;
  readonly warekiShort: string;
  readonly weekdayShort?: string;
  readonly fiscalYearLabel?: string;
  readonly warning?: string;
  readonly note?: string;
}

export type WarekiConversionResult =
  | { readonly ok: true; readonly value: WarekiConversionValue }
  | { readonly ok: false; readonly error: string };

export interface CopyFormatItem {
  readonly label: string;
  readonly value: string;
}

export const ERAS: readonly EraDefinition[] = [
  {
    code: "M",
    kanji: "明治",
    shortKanji: "明",
    startYear: 1868,
    startMonth: 9,
    startDay: 8,
    endYear: 1912,
    endMonth: 7,
    endDay: 29,
  },
  {
    code: "T",
    kanji: "大正",
    shortKanji: "大",
    startYear: 1912,
    startMonth: 7,
    startDay: 30,
    endYear: 1926,
    endMonth: 12,
    endDay: 24,
  },
  {
    code: "S",
    kanji: "昭和",
    shortKanji: "昭",
    startYear: 1926,
    startMonth: 12,
    startDay: 25,
    endYear: 1989,
    endMonth: 1,
    endDay: 7,
  },
  {
    code: "H",
    kanji: "平成",
    shortKanji: "平",
    startYear: 1989,
    startMonth: 1,
    startDay: 8,
    endYear: 2019,
    endMonth: 4,
    endDay: 30,
  },
  {
    code: "R",
    kanji: "令和",
    shortKanji: "令",
    startYear: 2019,
    startMonth: 5,
    startDay: 1,
  },
] as const;

const TRANSITION_YEAR_NOTES: Readonly<Record<number, string>> = {
  1912: "1912年は改元年です（〜7/29: 明治45年 / 7/30〜: 大正元年）",
  1926: "1926年は改元年です（〜12/24: 大正15年 / 12/25〜: 昭和元年）",
  1989: "1989年は改元年です（〜1/7: 昭和64年 / 1/8〜: 平成元年）",
  2019: "2019年は改元年です（〜4/30: 平成31年 / 5/1〜: 令和元年）",
};

const TRANSITION_MONTH_NOTES: Readonly<Record<string, string>> = {
  "1912-07":
    "1912年7月は月途中で改元があります（〜7/29: 明治45年7月 / 7/30〜: 大正元年7月）",
  "1926-12":
    "1926年12月は月途中で改元があります（〜12/24: 大正15年12月 / 12/25〜: 昭和元年12月）",
  "1989-01":
    "1989年1月は月途中で改元があります（〜1/7: 昭和64年1月 / 1/8〜: 平成元年1月）",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmdNum(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

function toYmNum(y: number, m: number): number {
  return y * 100 + m;
}

function formatEraYearKanji(eraYear: number): string {
  return eraYear === 1 ? "元" : String(eraYear);
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

function findEraByYmd(
  year: number,
  month: number,
  day: number,
): EraDefinition | undefined {
  const target = toYmdNum(year, month, day);
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    if (target >= toYmdNum(era.startYear, era.startMonth, era.startDay)) {
      return era;
    }
  }
  return undefined;
}

function findEraByYm(year: number, month: number): EraDefinition | undefined {
  const target = toYmNum(year, month);
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    if (target >= toYmNum(era.startYear, era.startMonth)) {
      return era;
    }
  }
  return undefined;
}

function findEraByYear(year: number): EraDefinition | undefined {
  for (let i = ERAS.length - 1; i >= 0; i--) {
    if (year >= ERAS[i].startYear) {
      return ERAS[i];
    }
  }
  return undefined;
}

function buildFiscalYearLabel(year: number, month: number): string {
  const fy = month < 4 ? year - 1 : year;
  const eraForFy = findEraByYmd(fy, 5, 1) ?? findEraByYear(fy);
  if (!eraForFy) {
    return `${fy}年度`;
  }
  const fyEraYear = fy - eraForFy.startYear + 1;
  return `${fy}年度（${eraForFy.kanji}${formatEraYearKanji(fyEraYear)}年度）`;
}

function formatWarekiLabel(
  era: EraDefinition,
  eraYear: number,
  month?: number,
  day?: number,
): { full: string; short: string } {
  const yearKanji = formatEraYearKanji(eraYear);
  if (month !== undefined && day !== undefined) {
    return {
      full: `${era.kanji}${yearKanji}年${month}月${day}日`,
      short: `${era.code}${eraYear}.${month}.${day}`,
    };
  }
  if (month !== undefined) {
    return {
      full: `${era.kanji}${yearKanji}年${month}月`,
      short: `${era.code}${eraYear}.${month}`,
    };
  }
  return {
    full: `${era.kanji}${yearKanji}年`,
    short: `${era.code}${eraYear}`,
  };
}

function normalizeWarekiInput(raw: string): string {
  const halfWidth = raw
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９．／－]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, " ");

  return halfWidth
    .replace(/\s*[(\uff08]\s*[日月火水木金土](?:曜|曜日)?\s*[)\uff09]\s*$/, "")
    .trim();
}

function extractEraAndRemainder(
  normalized: string,
): { era: EraDefinition; remainder: string } | undefined {
  const match = normalized.match(
    /^(明治|大正|昭和|平成|令和|明|大|昭|平|令|[MTSHRmtshr])(.*)$/,
  );
  if (!match) {
    return undefined;
  }

  const token = match[1].toUpperCase();
  const era = ERAS.find(
    (e) => e.kanji === token || e.shortKanji === token || e.code === token,
  );
  if (!era) {
    return undefined;
  }
  return { era, remainder: match[2].trim() };
}

interface ParsedParts {
  eraYear: number;
  month?: number;
  day?: number;
}

function parseEraYearNumber(token: string): number | undefined {
  if (token === "元") {
    return 1;
  }
  const n = Number(token);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}

function parseCompactDigits(digits: string): ParsedParts | undefined {
  if (digits.length === 6) {
    return {
      eraYear: Number(digits.slice(0, 2)),
      month: Number(digits.slice(2, 4)),
      day: Number(digits.slice(4, 6)),
    };
  }
  if (digits.length === 5) {
    return {
      eraYear: Number(digits.slice(0, 1)),
      month: Number(digits.slice(1, 3)),
      day: Number(digits.slice(3, 5)),
    };
  }
  if (digits.length === 4) {
    const eraYear = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    if (eraYear >= 1 && eraYear <= 64 && month >= 1 && month <= 12) {
      return { eraYear, month };
    }
    return undefined;
  }
  return undefined;
}

function matchToParsedParts(
  match: RegExpMatchArray | null,
): ParsedParts | undefined {
  if (!match) {
    return undefined;
  }
  const eraYear = parseEraYearNumber(match[1]);
  if (!eraYear) {
    return undefined;
  }
  return {
    eraYear,
    month: match[2] ? Number(match[2]) : undefined,
    day: match[3] ? Number(match[3]) : undefined,
  };
}

function parseRemainder(remainder: string): ParsedParts | undefined {
  const cleaned = remainder.replace(/^\.\s*/, "");
  if (!cleaned) {
    return undefined;
  }

  const kanjiMatch = cleaned.match(
    /^(元|\d{1,2})\s*年(?:\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日?)?)?$/,
  );
  if (kanjiMatch) {
    return matchToParsedParts(kanjiMatch);
  }

  if (/^\d{4,6}$/.test(cleaned)) {
    const compact = parseCompactDigits(cleaned);
    return compact && compact.eraYear >= 1 ? compact : undefined;
  }

  return matchToParsedParts(
    cleaned.match(/^(元|\d{1,2})(?:[\s./-]+(\d{1,2})(?:[\s./-]+(\d{1,2}))?)?$/),
  );
}

function evaluateDayBoundaryWarning(
  era: EraDefinition,
  year: number,
  month: number,
  day: number,
): string | undefined {
  const current = toYmdNum(year, month, day);
  const start = toYmdNum(era.startYear, era.startMonth, era.startDay);
  const end =
    era.endYear !== undefined &&
    era.endMonth !== undefined &&
    era.endDay !== undefined
      ? toYmdNum(era.endYear, era.endMonth, era.endDay)
      : undefined;

  if (current < start) {
    const actual = findEraByYmd(year, month, day);
    if (!actual) {
      return "明治以前の日付です";
    }
    const label = formatWarekiLabel(
      actual,
      year - actual.startYear + 1,
      month,
      day,
    ).full;
    return `改元前の日付です（正しくは${label}）`;
  }

  if (end !== undefined && current > end) {
    const actual = findEraByYmd(year, month, day);
    if (!actual) {
      return "改元後の日付です";
    }
    const label = formatWarekiLabel(
      actual,
      year - actual.startYear + 1,
      month,
      day,
    ).full;
    return `改元後の日付です（正しくは${label}）`;
  }

  return undefined;
}

function evaluateMonthBoundaryInfo(
  era: EraDefinition,
  year: number,
  month: number,
): { warning?: string; note?: string } {
  const current = toYmNum(year, month);
  const start = toYmNum(era.startYear, era.startMonth);
  const end =
    era.endYear !== undefined && era.endMonth !== undefined
      ? toYmNum(era.endYear, era.endMonth)
      : undefined;

  if (current < start) {
    const actual = findEraByYm(year, month);
    const label = actual
      ? formatWarekiLabel(actual, year - actual.startYear + 1, month).full
      : `${year}年${month}月`;
    return { warning: `改元前の月です（正しくは${label}）` };
  }

  if (end !== undefined && current > end) {
    const actual = findEraByYm(year, month);
    const label = actual
      ? formatWarekiLabel(actual, year - actual.startYear + 1, month).full
      : `${year}年${month}月`;
    return { warning: `改元後の月です（正しくは${label}）` };
  }

  const ymKey = `${year}-${pad2(month)}`;
  return { note: TRANSITION_MONTH_NOTES[ymKey] };
}

function evaluateYearBoundaryInfo(
  era: EraDefinition,
  year: number,
): { warning?: string; note?: string } {
  if (era.endYear !== undefined && year > era.endYear) {
    const actual = findEraByYear(year);
    const label = actual
      ? formatWarekiLabel(actual, year - actual.startYear + 1).full
      : `${year}年`;
    return { warning: `改元後の年です（正しくは${label}）` };
  }

  return { note: TRANSITION_YEAR_NOTES[year] };
}

function buildParsedDayResult(
  era: EraDefinition,
  eraYear: number,
  year: number,
  month: number,
  day: number,
): WarekiConversionResult {
  if (!isValidCalendarDate(year, month, day)) {
    return { ok: false, error: "存在しない日付です。" };
  }
  const labels = formatWarekiLabel(era, eraYear, month, day);
  const dateObj = new Date(year, month - 1, day);
  return {
    ok: true,
    value: {
      precision: "day",
      year,
      month,
      day,
      isoDate: `${year}-${pad2(month)}-${pad2(day)}`,
      eraCode: era.code,
      eraKanji: era.kanji,
      eraYear,
      warekiFull: labels.full,
      warekiShort: labels.short,
      weekdayShort: getJapaneseWeekday(dateObj, "short"),
      fiscalYearLabel: buildFiscalYearLabel(year, month),
      warning: evaluateDayBoundaryWarning(era, year, month, day),
    },
  };
}

function buildParsedMonthResult(
  era: EraDefinition,
  eraYear: number,
  year: number,
  month: number,
): WarekiConversionResult {
  if (month < 1 || month > 12) {
    return { ok: false, error: "月は 1〜12 の範囲で入力してください。" };
  }
  const labels = formatWarekiLabel(era, eraYear, month);
  const boundary = evaluateMonthBoundaryInfo(era, year, month);
  return {
    ok: true,
    value: {
      precision: "month",
      year,
      month,
      eraCode: era.code,
      eraKanji: era.kanji,
      eraYear,
      warekiFull: labels.full,
      warekiShort: labels.short,
      fiscalYearLabel: buildFiscalYearLabel(year, month),
      warning: boundary.warning,
      note: boundary.note,
    },
  };
}

function buildParsedYearResult(
  era: EraDefinition,
  eraYear: number,
  year: number,
): WarekiConversionResult {
  const labels = formatWarekiLabel(era, eraYear);
  const boundary = evaluateYearBoundaryInfo(era, year);
  return {
    ok: true,
    value: {
      precision: "year",
      year,
      eraCode: era.code,
      eraKanji: era.kanji,
      eraYear,
      warekiFull: labels.full,
      warekiShort: labels.short,
      warning: boundary.warning,
      note: boundary.note,
    },
  };
}

/**
 * 和暦文字列を西暦および各種表現へ変換する
 */
export function parseWarekiInput(input: string): WarekiConversionResult {
  const normalized = normalizeWarekiInput(input);
  if (!normalized) {
    return { ok: false, error: "和暦を入力してください。" };
  }

  const extracted = extractEraAndRemainder(normalized);
  if (!extracted) {
    return {
      ok: false,
      error: "元号（明治〜令和 / M,T,S,H,R）から入力してください。",
    };
  }

  const parts = parseRemainder(extracted.remainder);
  if (!parts) {
    return {
      ok: false,
      error:
        "日付の形式を解釈できません（例: 令和8年11月27日 / R8.11.27 / R081127）。",
    };
  }

  const { era } = extracted;
  const year = era.startYear + parts.eraYear - 1;

  if (parts.month !== undefined && parts.day !== undefined) {
    return buildParsedDayResult(
      era,
      parts.eraYear,
      year,
      parts.month,
      parts.day,
    );
  }
  if (parts.month !== undefined) {
    return buildParsedMonthResult(era, parts.eraYear, year, parts.month);
  }

  return buildParsedYearResult(era, parts.eraYear, year);
}

/**
 * 西暦文字列（yyyy-MM-dd）を和暦へ変換する
 */
export function convertSeirekiToWareki(
  isoDate: string,
): WarekiConversionResult {
  const match = isoDate.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return {
      ok: false,
      error: "西暦日付を yyyy-MM-dd 形式で指定してください。",
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) {
    return { ok: false, error: "存在しない日付です。" };
  }

  const era = findEraByYmd(year, month, day);
  if (!era) {
    return {
      ok: false,
      error: "明治（1868年9月8日）以降の日付を指定してください。",
    };
  }

  const eraYear = year - era.startYear + 1;
  const labels = formatWarekiLabel(era, eraYear, month, day);
  const dateObj = new Date(year, month - 1, day);

  return {
    ok: true,
    value: {
      precision: "day",
      year,
      month,
      day,
      isoDate: `${year}-${pad2(month)}-${pad2(day)}`,
      eraCode: era.code,
      eraKanji: era.kanji,
      eraYear,
      warekiFull: labels.full,
      warekiShort: labels.short,
      weekdayShort: getJapaneseWeekday(dateObj, "short"),
      fiscalYearLabel: buildFiscalYearLabel(year, month),
    },
  };
}

/**
 * 変換結果からワンクリックコピー用フォーマット一覧を生成する
 */
export function buildCopyFormats(
  value: WarekiConversionValue,
): CopyFormatItem[] {
  if (
    value.precision === "day" &&
    value.month !== undefined &&
    value.day !== undefined
  ) {
    const mm = pad2(value.month);
    const dd = pad2(value.day);
    const wd = value.weekdayShort ? `(${value.weekdayShort})` : "";
    const items: CopyFormatItem[] = [
      { label: "西暦（スラッシュ）", value: `${value.year}/${mm}/${dd}` },
      { label: "西暦（ハイフン）", value: `${value.year}-${mm}-${dd}` },
      {
        label: "西暦（日本語）",
        value: `${value.year}年${value.month}月${value.day}日${wd}`,
      },
      { label: "和暦（日本語）", value: `${value.warekiFull}${wd}` },
      { label: "和暦（略記）", value: value.warekiShort },
    ];
    if (value.fiscalYearLabel) {
      items.push({ label: "年度", value: value.fiscalYearLabel });
    }
    return items;
  }

  if (value.precision === "month" && value.month !== undefined) {
    const mm = pad2(value.month);
    const items: CopyFormatItem[] = [
      { label: "西暦（スラッシュ）", value: `${value.year}/${mm}` },
      { label: "西暦（ハイフン）", value: `${value.year}-${mm}` },
      { label: "西暦（日本語）", value: `${value.year}年${value.month}月` },
      { label: "和暦（日本語）", value: value.warekiFull },
      { label: "和暦（略記）", value: value.warekiShort },
    ];
    if (value.fiscalYearLabel) {
      items.push({ label: "年度", value: value.fiscalYearLabel });
    }
    return items;
  }

  return [
    { label: "西暦", value: `${value.year}年` },
    { label: "和暦（日本語）", value: value.warekiFull },
    { label: "和暦（略記）", value: value.warekiShort },
  ];
}
