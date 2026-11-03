/**
 * 時刻文字列が有効な "HH:mm" 形式（00:00〜23:59）であるかを検証します。
 *
 * @param time 検証対象の時刻文字列
 * @returns 有効な場合 true
 */
export function isValidTimeFormat(time: unknown): boolean {
  if (typeof time !== "string") {
    return false;
  }
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * スケジュール時刻リストの重複を排除し、形式チェックおよび昇順ソートを行って正規化します。
 *
 * @param times スケジュール時刻文字列の配列
 * @returns 正規化された時刻リスト
 */
export function normalizeScheduleTimes(times?: string[]): string[] {
  if (!Array.isArray(times)) {
    return [];
  }
  const validTimes = times.filter(isValidTimeFormat);
  const uniqueTimes = Array.from(new Set(validTimes));
  return uniqueTimes.sort();
}

/**
 * 2桁パディングヘルパー
 */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 指定の日時 Date からエクスポートスロット識別文字列（"yyyy-MM-dd HH:mm"）を生成します。
 *
 * @param date 基準日時
 * @returns スロット識別文字列
 */
export function formatExportSlot(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 現在時刻が自動エクスポート実行対象のスロットであるかを判定します（キャッチアップなし）。
 *
 * @param now 現在日時
 * @param scheduleTimes 登録済みスケジュール時刻一覧
 * @param lastExportedSlot 前回実行したスロット文字列
 * @returns 実行すべき場合 { due: true, slot }、不要な場合 { due: false }
 */
export function isExportSlotDue(
  now: Date,
  scheduleTimes: string[],
  lastExportedSlot?: string,
): { due: boolean; slot?: string } {
  if (!scheduleTimes || scheduleTimes.length === 0) {
    return { due: false };
  }

  const currentSlotTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (!scheduleTimes.includes(currentSlotTime)) {
    return { due: false };
  }

  const currentSlot = formatExportSlot(now);
  if (lastExportedSlot === currentSlot) {
    return { due: false };
  }

  return { due: true, slot: currentSlot };
}

/**
 * 次回自動エクスポート実行予定日時を算出します。
 *
 * @param now 現在日時
 * @param scheduleTimes 登録済みスケジュール時刻一覧
 * @returns 次回実行予定日時（設定なしの場合は null）
 */
export function getNextScheduledTime(
  now: Date,
  scheduleTimes: string[],
): Date | null {
  const normalized = normalizeScheduleTimes(scheduleTimes);
  if (normalized.length === 0) {
    return null;
  }

  const currentSlotTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  for (const time of normalized) {
    if (time > currentSlotTime) {
      const [hours, minutes] = time.split(":").map(Number);
      const target = new Date(now);
      target.setHours(hours, minutes, 0, 0);
      return target;
    }
  }

  const firstTime = normalized[0];
  const [hours, minutes] = firstTime.split(":").map(Number);
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

