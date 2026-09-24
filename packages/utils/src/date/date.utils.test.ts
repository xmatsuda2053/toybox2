import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  format,
  addDays,
  startOfDay,
  isOverdue,
  isAsap,
  isWithinAnyDaysBefore,
  getYearList,
  getCurrentFiscalYear,
  getJapaneseWeekday,
} from "./date.utils";

/**
 * date.utils テスト仕様
 *
 * format:
 * - [x] 仕様 1: フォーマットを省略した場合、デフォルトの yyyy/MM/dd HH:mm:ss 形式でゼロ埋めされた日時文字列を返すこと。
 * - [x] 仕様 2: yyyy/MM/dd を指定した場合、日付部分のみ（年/月/日）の文字列を返すこと。
 * - [x] 仕様 3: HH:mm:ss を指定した場合、時刻部分のみ（時:分:秒）の文字列を返すこと。
 * - [x] 仕様 4: 月、日、時、分、秒が1桁の場合に、正しく2桁ゼロ埋めされること。
 * - [x] 仕様 5: サポート対象外のフォーマット文字列が指定された場合は Error をスローすること。
 *
 * addDays:
 * - [x] 仕様 6: 正の整数を指定した場合、指定した日数後の新しい Date オブジェクトを返すこと。
 * - [x] 仕様 7: 負の整数を指定した場合、指定した日数前の過去の Date オブジェクトを返すこと。
 * - [x] 仕様 8: 0 を指定した場合、同日時を表す新しい Date オブジェクトを返すこと。
 * - [x] 仕様 9: 月跨ぎ、うるう年、年跨ぎが正しく計算されること。
 * - [x] 仕様 10: 時刻部分（時・分・秒・ミリ秒）が保持されること。
 * - [x] 仕様 11: 引数として渡された元の Date オブジェクトを変更しないこと（副作用がないこと）。
 *
 * isOverdue:
 * - [x] 仕様 12: システム日付（今日）より前の過去日付（昨日以前）の場合は true を返すこと。
 * - [x] 仕様 13: システム日付（今日）当日の場合は false を返すこと。
 * - [x] 仕様 14: システム日付（今日）より後の未来日付（明日以降）の場合は false を返すこと。
 * - [x] 仕様 15: 時刻に関わらず、日付単位で正しく判定されること。
 *
 * isAsap:
 * - [x] 仕様 16: システム日付（今日）と同じ日付（当日）の場合は true を返すこと。
 * - [x] 仕様 17: システム日付（今日）より前の過去日付（昨日以前）の場合は false を返すこと。
 * - [x] 仕様 18: システム日付（今日）より後の未来日付（明日以降）の場合は false を返すこと。
 * - [x] 仕様 19: 時刻に関わらず、同一日であれば true を返すこと。
 *
 * isWithinAnyDaysBefore:
 * - [x] 仕様 20: システム日付が基準日の「days 日前」から「前日（1日前）」の期間内にある場合は true を返すこと。
 * - [x] 仕様 21: システム日付が基準日の「days 日前」ちょうどの場合は true を返すこと。
 * - [x] 仕様 22: システム日付が基準日の「前日（1日前）」の場合は true を返すこと。
 * - [x] 仕様 23: システム日付が基準日「当日」の場合は false を返すこと（当日除く）。
 * - [x] 仕様 24: システム日付が基準日の「翌日以降」の場合は false を返すこと。
 * - [x] 仕様 25: システム日付が基準日の「days + 1 日以前」の場合は false を返すこと。
 * - [x] 仕様 26: 時刻に関わらず、日付単位で正しく判定されること。
 *
 * getYearList:
 * - [x] 仕様 27: order を省略（デフォルト desc）または desc を指定した場合、降順で年リストを返すこと。
 * - [x] 仕様 28: order に asc を指定した場合、昇順で年リストを返すこと。
 * - [x] 仕様 29: 開始年と終了年が同一の場合、その年のみを含む要素数1の配列を返すこと。
 * - [x] 仕様 30: 開始年が終了年より大きい場合（startYear > endYear）は空配列を返すこと。
 *
 * getCurrentFiscalYear:
 * - [x] 仕様 31: システム日付が4月1日〜12月31日の場合、当年の西暦年を返すこと。
 * - [x] 仕様 32: システム日付が1月1日〜3月31日の場合、前年の西暦年を返すこと。
 * - [x] 仕様 33: 年度の切り替わり境界（3月31日 23:59:59 と 4月1日 00:00:00）で正しく判定されること。
 *
 * getJapaneseWeekday:
 * - [x] 仕様 34: 日曜日から土曜日までの各曜日を正しく判定して返すこと。
 * - [x] 仕様 35: format を省略した場合（デフォルト long）、フル表記（「日曜日」「月曜日」…）を返すこと。
 * - [x] 仕様 36: format に short を指定した場合、省略表記（「日」「月」…）を返すこと。
 */

describe("date.utils.format", () => {
  const target = new Date(2026, 0, 5, 9, 7, 3); // 2026-01-05 09:07:03

  it("フォーマットを省略した場合、デフォルトの yyyy/MM/dd HH:mm:ss 形式でゼロ埋めされた日時文字列を返すこと", () => {
    expect(format(target)).toBe("2026/01/05 09:07:03");
  });

  it("yyyy/MM/dd を指定した場合、日付部分のみ（年/月/日）の文字列を返すこと", () => {
    expect(format(target, "yyyy/MM/dd")).toBe("2026/01/05");
  });

  it("HH:mm:ss を指定した場合、時刻部分のみ（時:分:秒）の文字列を返すこと", () => {
    expect(format(target, "HH:mm:ss")).toBe("09:07:03");
  });

  it("月、日、時、分、秒が1桁の場合に、正しく2桁ゼロ埋めされること", () => {
    const singleDigits = new Date(2026, 3, 2, 1, 4, 9); // 2026-04-02 01:04:09
    expect(format(singleDigits, "yyyy/MM/dd HH:mm:ss")).toBe(
      "2026/04/02 01:04:09",
    );
  });

  it("サポート対象外のフォーマット文字列が指定された場合は Error をスローすること", () => {
    expect(() => format(target, "YYYY-MM-DD")).toThrow(Error);
    expect(() => format(target, "invalid")).toThrow(Error);
  });
});

describe("date.utils.addDays", () => {
  it("正の整数を指定した場合、指定した日数後の新しい Date オブジェクトを返すこと", () => {
    const base = new Date(2026, 0, 10, 12, 0, 0);
    const result = addDays(base, 5);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(12);
  });

  it("負の整数を指定した場合、指定した日数前の過去の Date オブジェクトを返すこと", () => {
    const base = new Date(2026, 0, 10, 12, 0, 0);
    const result = addDays(base, -5);
    expect(result.getDate()).toBe(5);
  });

  it("0 を指定した場合、同日時を表す新しい Date オブジェクトを返すこと", () => {
    const base = new Date(2026, 0, 10, 12, 0, 0);
    const result = addDays(base, 0);
    expect(result.getTime()).toBe(base.getTime());
    expect(result).not.toBe(base); // 異なるインスタンス
  });

  it("月跨ぎ、うるう年、年跨ぎが正しく計算されること", () => {
    const jan31 = new Date(2026, 0, 31);
    expect(addDays(jan31, 1).getMonth()).toBe(1); // 2月
    expect(addDays(jan31, 1).getDate()).toBe(1);

    const leapFeb28 = new Date(2024, 1, 28); // 2024年はうるう年
    expect(addDays(leapFeb28, 1).getDate()).toBe(29);

    const dec31 = new Date(2026, 11, 31);
    expect(addDays(dec31, 1).getFullYear()).toBe(2027);
    expect(addDays(dec31, 1).getMonth()).toBe(0);
    expect(addDays(dec31, 1).getDate()).toBe(1);
  });

  it("時刻部分（時・分・秒・ミリ秒）が保持されること", () => {
    const base = new Date(2026, 5, 1, 15, 30, 45, 500);
    const result = addDays(base, 3);
    expect(result.getHours()).toBe(15);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(45);
    expect(result.getMilliseconds()).toBe(500);
  });

  it("引数として渡された元の Date オブジェクトを変更しないこと", () => {
    const base = new Date(2026, 0, 1, 10, 0, 0);
    const timeBefore = base.getTime();
    addDays(base, 10);
    expect(base.getTime()).toBe(timeBefore);
  });
});

describe("date.utils (システム時刻依存メソッド群)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 基準システム時刻: 2026年9月15日 12:00:00
    vi.setSystemTime(new Date(2026, 8, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isOverdue", () => {
    it("システム日付（今日）より前の過去日付（昨日以前）の場合は true を返すこと", () => {
      expect(isOverdue(new Date(2026, 8, 14))).toBe(true);
      expect(isOverdue(new Date(2026, 7, 31))).toBe(true);
    });

    it("システム日付（今日）当日の場合は false を返すこと", () => {
      expect(isOverdue(new Date(2026, 8, 15, 0, 0, 0))).toBe(false);
      expect(isOverdue(new Date(2026, 8, 15, 12, 0, 0))).toBe(false);
      expect(isOverdue(new Date(2026, 8, 15, 23, 59, 59))).toBe(false);
    });

    it("システム日付（今日）より後の未来日付（明日以降）の場合は false を返すこと", () => {
      expect(isOverdue(new Date(2026, 8, 16))).toBe(false);
    });

    it("時刻に関わらず、日付単位で正しく判定されること", () => {
      expect(isOverdue(new Date(2026, 8, 14, 23, 59, 59))).toBe(true);
      expect(isOverdue(new Date(2026, 8, 15, 0, 0, 0))).toBe(false);
    });
  });

  describe("isAsap", () => {
    it("システム日付（今日）と同じ日付（当日）の場合は true を返すこと", () => {
      expect(isAsap(new Date(2026, 8, 15, 0, 0, 0))).toBe(true);
      expect(isAsap(new Date(2026, 8, 15, 12, 0, 0))).toBe(true);
      expect(isAsap(new Date(2026, 8, 15, 23, 59, 59))).toBe(true);
    });

    it("システム日付（今日）より前の過去日付（昨日以前）の場合は false を返すこと", () => {
      expect(isAsap(new Date(2026, 8, 14))).toBe(false);
    });

    it("システム日付（今日）より後の未来日付（明日以降）の場合は false を返すこと", () => {
      expect(isAsap(new Date(2026, 8, 16))).toBe(false);
    });

    it("時刻に関わらず、同一日であれば true を返すこと", () => {
      expect(isAsap(new Date(2026, 8, 15, 5, 30, 0))).toBe(true);
    });
  });

  describe("isWithinAnyDaysBefore", () => {
    // 基準日: 2026/09/20, days: 5 (対象期間: 9/15 〜 9/19)
    const targetDate = new Date(2026, 8, 20);

    it("システム日付が基準日の「days 日前」から「前日（1日前）」の期間内にある場合は true を返すこと", () => {
      // 9/15 (5日前)
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(true);

      // 9/17 (3日前)
      vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 0));
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(true);

      // 9/19 (前日)
      vi.setSystemTime(new Date(2026, 8, 19, 10, 0, 0));
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(true);
    });

    it("システム日付が基準日の「days 日前」ちょうどの場合は true を返すこと", () => {
      vi.setSystemTime(new Date(2026, 8, 15, 0, 0, 0));
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(true);
    });

    it("システム日付が基準日の「前日（1日前）」の場合は true を返すこと", () => {
      vi.setSystemTime(new Date(2026, 8, 19, 23, 59, 59));
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(true);
    });

    it("システム日付が基準日「当日」の場合は false を返すこと（当日除く）", () => {
      vi.setSystemTime(new Date(2026, 8, 20, 10, 0, 0));
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(false);
    });

    it("システム日付が基準日の「翌日以降」の場合は false を返すこと", () => {
      vi.setSystemTime(new Date(2026, 8, 21, 10, 0, 0));
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(false);
    });

    it("システム日付が基準日の「days + 1 日以前」の場合は false を返すこと", () => {
      vi.setSystemTime(new Date(2026, 8, 14, 23, 59, 59)); // 6日前
      expect(isWithinAnyDaysBefore(targetDate, 5)).toBe(false);
    });

    it("時刻に関わらず、日付単位で正しく判定されること", () => {
      vi.setSystemTime(new Date(2026, 8, 15, 23, 59, 59));
      expect(isWithinAnyDaysBefore(new Date(2026, 8, 20, 1, 0, 0), 5)).toBe(
        true,
      );
    });
  });

  describe("getCurrentFiscalYear", () => {
    it("システム日付が4月1日〜12月31日の場合、当年の西暦年を返すこと", () => {
      vi.setSystemTime(new Date(2026, 3, 1, 0, 0, 0)); // 4/1
      expect(getCurrentFiscalYear()).toBe(2026);

      vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59)); // 12/31
      expect(getCurrentFiscalYear()).toBe(2026);
    });

    it("システム日付が1月1日〜3月31日の場合、前年の西暦年を返すこと", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0)); // 1/1
      expect(getCurrentFiscalYear()).toBe(2025);

      vi.setSystemTime(new Date(2026, 2, 31, 23, 59, 59)); // 3/31
      expect(getCurrentFiscalYear()).toBe(2025);
    });

    it("年度の切り替わり境界（3月31日 23:59:59 と 4月1日 00:00:00）で正しく判定されること", () => {
      vi.setSystemTime(new Date(2026, 2, 31, 23, 59, 59));
      expect(getCurrentFiscalYear()).toBe(2025);

      vi.setSystemTime(new Date(2026, 3, 1, 0, 0, 0));
      expect(getCurrentFiscalYear()).toBe(2026);
    });
  });
});

describe("date.utils.getYearList", () => {
  it("order を省略（デフォルト desc）または desc を指定した場合、降順で年リストを返すこと", () => {
    expect(getYearList(2020, 2024)).toEqual([2024, 2023, 2022, 2021, 2020]);
    expect(getYearList(2020, 2024, "desc")).toEqual([
      2024, 2023, 2022, 2021, 2020,
    ]);
  });

  it("order に asc を指定した場合、昇順で年リストを返すこと", () => {
    expect(getYearList(2020, 2024, "asc")).toEqual([
      2020, 2021, 2022, 2023, 2024,
    ]);
  });

  it("開始年と終了年が同一の場合、その年のみを含む要素数1の配列を返すこと", () => {
    expect(getYearList(2024, 2024)).toEqual([2024]);
    expect(getYearList(2024, 2024, "asc")).toEqual([2024]);
  });

  it("開始年が終了年より大きい場合（startYear > endYear）は空配列を返すこと", () => {
    expect(getYearList(2025, 2024)).toEqual([]);
    expect(getYearList(2025, 2024, "asc")).toEqual([]);
  });
});

describe("date.utils.getJapaneseWeekday", () => {
  // 2026年9月13日 (日曜日)
  const sunday = new Date(2026, 8, 13);
  const monday = new Date(2026, 8, 14);
  const tuesday = new Date(2026, 8, 15);
  const wednesday = new Date(2026, 8, 16);
  const thursday = new Date(2026, 8, 17);
  const friday = new Date(2026, 8, 18);
  const saturday = new Date(2026, 8, 19);

  it("日曜日から土曜日までの各曜日を正しく判定して返すこと", () => {
    expect(getJapaneseWeekday(sunday)).toBe("日曜日");
    expect(getJapaneseWeekday(monday)).toBe("月曜日");
    expect(getJapaneseWeekday(tuesday)).toBe("火曜日");
    expect(getJapaneseWeekday(wednesday)).toBe("水曜日");
    expect(getJapaneseWeekday(thursday)).toBe("木曜日");
    expect(getJapaneseWeekday(friday)).toBe("金曜日");
    expect(getJapaneseWeekday(saturday)).toBe("土曜日");
  });

  it("format を省略した場合（デフォルト long）、フル表記（「日曜日」「月曜日」…）を返すこと", () => {
    expect(getJapaneseWeekday(sunday)).toBe("日曜日");
    expect(getJapaneseWeekday(monday, "long")).toBe("月曜日");
  });

  it("format に short を指定した場合、省略表記（「日」「月」…）を返すこと", () => {
    expect(getJapaneseWeekday(sunday, "short")).toBe("日");
    expect(getJapaneseWeekday(monday, "short")).toBe("月");
  });
});

/**
 * startOfDay テスト仕様:
 * - 仕様: 指定された Date の時刻部分（時・分・秒・ミリ秒）を 00:00:00.000 に正規化した新しい Date を返すこと。
 * - 仕様: 引数を省略した場合、現在時刻（システム時刻）の 00:00:00.000 を持つ Date を返すこと。
 * - 仕様: 引数として渡された元の Date オブジェクトを変更しないこと（イミュータブルであること）。
 */
describe("date.utils.startOfDay", () => {
  it("指定された Date の時刻部分を 00:00:00.000 にリセットした新しい Date を返すこと", () => {
    const original = new Date(2026, 8, 15, 14, 30, 45, 500);
    const result = startOfDay(original);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("引数を省略した場合、システム時刻当日の 00:00:00.000 を持つ Date を返すこと", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20, 18, 45, 30, 123));

    const result = startOfDay();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);

    vi.useRealTimers();
  });

  it("引数として渡された元の Date オブジェクトを変更しないこと", () => {
    const original = new Date(2026, 8, 15, 14, 30, 45, 500);
    const timeBefore = original.getTime();
    startOfDay(original);

    expect(original.getTime()).toBe(timeBefore);
  });
});
