import { getJapaneseEraYear } from "@shared/utils";

/**
 * カレンダーポップオーバーの表示モード
 */
export type CalendarViewMode = "days" | "months" | "years";

/**
 * 年選択グリッドの1ページあたり表示年数（3列 × 4行）
 */
export const YEAR_GRID_SIZE = 12;

/**
 * 選択可能な最小・最大西暦年
 */
export const MIN_PICKER_YEAR = 1;
export const MAX_PICKER_YEAR = 9999;
export const MAX_YEAR_RANGE_START = MAX_PICKER_YEAR - YEAR_GRID_SIZE + 1;

/**
 * 和暦表示対象とする開始西暦年（明治元年）
 */
const MEIJI_START_YEAR = 1868;

/**
 * 元号クイックジャンプのプリセット定義
 */
export interface EraPreset {
  readonly id: string;
  readonly label: string;
  readonly startYear: number;
}

/**
 * 元号クイックジャンプ一覧（新しい元号順）
 */
export const JAPANESE_ERA_PRESETS: readonly EraPreset[] = [
  { id: "reiwa", label: "令和", startYear: 2019 },
  { id: "heisei", label: "平成", startYear: 1989 },
  { id: "showa", label: "昭和", startYear: 1926 },
  { id: "taisho", label: "大正", startYear: 1912 },
  { id: "meiji", label: "明治", startYear: 1868 },
] as const;

/**
 * 年選択グリッドの単一セルデータ
 */
export interface YearCellData {
  year: number;
  eraLabel: string;
  isCurrent: boolean;
  isToday: boolean;
}

/**
 * 月選択グリッドの単一セルデータ
 */
export interface MonthCellData {
  month: number;
  label: string;
  isCurrent: boolean;
  isToday: boolean;
}

/**
 * 年選択グリッドの開始年を有効範囲（1〜9988）にクランプする
 */
export function clampYearRangeStart(startYear: number): number {
  const truncated = Math.trunc(startYear);
  if (truncated < MIN_PICKER_YEAR) return MIN_PICKER_YEAR;
  if (truncated > MAX_YEAR_RANGE_START) return MAX_YEAR_RANGE_START;
  return truncated;
}

/**
 * 指定された年を含むキリの良い12年グリッド開始年（10年区切り）を算出する
 */
export function getYearRangeStart(year: number): number {
  const decadeStart = Math.floor(year / 10) * 10;
  return clampYearRangeStart(decadeStart);
}

/**
 * 年選択グリッドの開始年を前後12年単位で移動する
 */
export function shiftYearRange(
  currentStart: number,
  direction: -1 | 1,
): number {
  return clampYearRangeStart(currentStart + direction * YEAR_GRID_SIZE);
}

/**
 * 指定年の和暦ラベル（1868年以降、改元年は12月31日基準）を取得する
 */
export function getYearEraLabel(year: number): string {
  if (year < MEIJI_START_YEAR) return "";
  return getJapaneseEraYear(new Date(year, 11, 31));
}

/**
 * 12年分の年選択セルデータを生成する
 */
export function getYearCells(
  rangeStart: number,
  currentYear: number,
  todayYear: number,
): YearCellData[] {
  const start = clampYearRangeStart(rangeStart);
  const cells: YearCellData[] = [];

  for (let offset = 0; offset < YEAR_GRID_SIZE; offset++) {
    const year = start + offset;
    cells.push({
      year,
      eraLabel: getYearEraLabel(year),
      isCurrent: year === currentYear,
      isToday: year === todayYear,
    });
  }

  return cells;
}

/**
 * 1月〜12月の月選択セルデータを生成する
 */
export function getMonthCells(
  currentYear: number,
  currentMonth: number,
  todayYear: number,
  todayMonth: number,
): MonthCellData[] {
  const cells: MonthCellData[] = [];

  for (let month = 1; month <= 12; month++) {
    cells.push({
      month,
      label: `${month}月`,
      isCurrent: month === currentMonth,
      isToday: currentYear === todayYear && month === todayMonth,
    });
  }

  return cells;
}

/**
 * ユーザー入力の西暦年文字列（全角数字許容）をパースして数値に変換する
 */
export function parseYearInput(raw: string): number | null {
  const normalized = raw
    .trim()
    .replace(/[０-９]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    );

  if (!/^\d{1,4}$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (parsed < MIN_PICKER_YEAR || parsed > MAX_PICKER_YEAR) {
    return null;
  }

  return parsed;
}
