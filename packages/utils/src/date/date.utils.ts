/**
 * 日時を指定されたフォーマットで文字列に変換する。
 * @param date - 変換対象の日時
 * @param format - フォーマット形式 (yyyy/MM/dd HH:mm:ss, yyyy/MM/dd, HH:mm:ss)
 * @returns フォーマットされた日時文字列
 * @throws Error: formatがサポートされていない場合
 */
export function format(
  date: Date,
  format: string = "yyyy/MM/dd HH:mm:ss",
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear().toString();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  if (format === "yyyy/MM/dd HH:mm:ss") {
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }
  if (format === "yyyy/MM/dd") {
    return `${year}/${month}/${day}`;
  }
  if (format === "HH:mm:ss") {
    return `${hours}:${minutes}:${seconds}`;
  }
  throw new Error(`Unsupported format: ${format}`);
}

/**
 * 指定した日数が経過した未来日時を返す。
 * @param days - 日数
 * @returns
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date.getTime());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * 指定された基準日がシステム日付から見て期限切れかどうかを判定する。
 * @param expiryDate - 期限日
 * @returns 期限切れであれば true、そうでなければ false
 */
export function isOverdue(expiryDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(expiryDate.getTime());
  target.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
}

/**
 * 指定された基準日がシステム日付から見て期限当日かどうかを判定する。
 * @param expiryDate - 期限日
 * @returns 期限当日であれば true、そうでなければ false
 */
export function isAsap(expiryDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(expiryDate.getTime());
  target.setHours(0, 0, 0, 0);

  return target.getTime() === today.getTime();
}

/**
 * 指定された基準日がシステム日付から見て指定日付前（当日除く）であるかを判定する。
 * @param referenceDate - 判定のベースとなる基準日
 * @param days - 日数
 * @returns 当日+1〜any日前なら true、それ以外は false
 */
export function isWithinAnyDaysBefore(
  referenceDate: Date,
  days: number,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(referenceDate.getTime());
  target.setHours(0, 0, 0, 0);

  const start = new Date(target.getTime());
  start.setDate(start.getDate() - days);

  return today.getTime() >= start.getTime() && today.getTime() < target.getTime();
}

/**
 * 指定された範囲の年リストを取得する。
 * @param startYear - 開始年
 * @param endYear - 終了年
 * @param order - 並び順 ("asc" | "desc", デフォルト: "desc")
 * @returns 年のリスト
 */
export function getYearList(
  startYear: number,
  endYear: number,
  order: "asc" | "desc" = "desc",
): number[] {
  if (startYear > endYear) {
    return [];
  }
  const count = endYear - startYear + 1;
  if (order === "asc") {
    return Array.from({ length: count }, (_, i) => startYear + i);
  }
  return Array.from({ length: count }, (_, i) => endYear - i);
}

/**
 * 現在の年度（4月始まり）を返す。
 * @returns 年度（YYYY形式）
 */
export function getCurrentFiscalYear(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return month < 3 ? year - 1 : year;
}

/**
 * 指定された日付の日本語の曜日を返す。
 * @param date - 対象の日付
 * @param format - 曜日の形式 ("long": 日曜日, 月曜日, ... "short": 日, 月, ...)
 * @returns 日本語の曜日文字列
 */
export function getJapaneseWeekday(
  date: Date,
  format: "long" | "short" = "long",
): string {
  return new Intl.DateTimeFormat("ja-JP", { weekday: format }).format(date);
}

