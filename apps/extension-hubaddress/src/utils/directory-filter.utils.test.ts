import { describe, it, expect } from "vitest";
import {
  filterOrganizations,
  filterStaff,
  formatStaffIdFiveDigits,
  getOrganizationKey,
  getStaffKey,
} from "./directory-filter.utils";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

const SAMPLE_STAFF: StaffRecord[] = [
  {
    id: 1,
    staffId: "0010001",
    name: "田中 太郎",
    department: "総務部 総務課",
    title: "課長",
    emails: ["tanaka.taro@example.com", "t-tanaka@sub.example.com"],
  },
  {
    id: 2,
    staffId: "123",
    name: "佐藤 花子",
    department: "総務部 人事課",
    title: "主査",
    emails: ["sato.hanako@example.com"],
  },
  {
    id: 3,
    staffId: "0020001",
    name: "鈴木 一郎",
    department: "営業推進部 第一営業課",
    title: "課長補佐",
    emails: ["suzuki.ichiro@example.com"],
  },
];

const SAMPLE_ORGS: OrganizationRecord[] = [
  {
    id: 1,
    department: "総務部 総務課",
    extra: "本庁舎 3階",
    location: "3F-A",
    title: "課長席",
    extensionNumber: "2101",
    phoneNumber: "03-1234-2101",
    faxNumber: "03-1234-2109",
    notes: "代表窓口",
  },
  {
    id: 2,
    department: "総務部 人事課",
    extra: "本庁舎 3階",
    location: "3F-B",
    title: "係長席",
    extensionNumber: "2102",
    phoneNumber: "03-1234-2102",
    faxNumber: "03-1234-2109",
    notes: "採用・研修窓口",
  },
  {
    id: 3,
    department: "営業推進部 第一営業課",
    extra: "新館 2階",
    location: "2F-E1",
    title: "",
    extensionNumber: "3201",
    phoneNumber: "03-1234-3201",
    faxNumber: "03-1234-3209",
    notes: "東日本エリア担当",
  },
];

/**
 * テスト仕様: 一覧フィルタリング・検索・職員番号フォーマット純粋関数 (directory-filter.utils.ts)
 *
 * - 仕様1: formatStaffIdFiveDigits で 5桁未満は0埋め、6桁以上は下5桁へ整形できること
 * - 仕様2: filterStaff でフリーワード AND 検索ができ、5桁表示値でも検索ヒットすること
 * - 仕様3: filterOrganizations で所属・内線・場所・備考などを含めたフリーワード AND 検索ができること
 * - 仕様4: getStaffKey / getOrganizationKey が一意かつ安定したキー文字列を生成すること
 */
describe("Directory Filter Utils Tests", () => {
  it("formatStaffIdFiveDigits で 5桁表示（5桁未満0埋め・6桁以上は下5桁）へ整形できること", () => {
    expect(formatStaffIdFiveDigits("")).toBe("");
    expect(formatStaffIdFiveDigits("   ")).toBe("");
    expect(formatStaffIdFiveDigits("123")).toBe("00123");
    expect(formatStaffIdFiveDigits("12345")).toBe("12345");
    expect(formatStaffIdFiveDigits("0010001")).toBe("10001");
    expect(formatStaffIdFiveDigits(" 99 ")).toBe("00099");
  });

  it("filterStaff でフリーワード AND 検索（5桁/元職員番号両方含む）ができること", () => {
    expect(filterStaff(SAMPLE_STAFF, "").map((s) => s.staffId)).toEqual([
      "0010001",
      "123",
      "0020001",
    ]);

    expect(
      filterStaff(SAMPLE_STAFF, "tanaka 課長").map((s) => s.staffId),
    ).toEqual(["0010001"]);

    expect(filterStaff(SAMPLE_STAFF, "00123").map((s) => s.staffId)).toEqual([
      "123",
    ]);
  });

  it("filterOrganizations で所属・内線・場所・備考検索ができること", () => {
    const byExtension = filterOrganizations(SAMPLE_ORGS, "3201 東日本");
    expect(byExtension).toHaveLength(1);
    expect(byExtension[0].department).toBe("営業推進部 第一営業課");

    const byDept = filterOrganizations(SAMPLE_ORGS, "総務部 人事課");
    expect(byDept).toHaveLength(1);
    expect(byDept[0].extensionNumber).toBe("2102");
  });

  it("getStaffKey / getOrganizationKey が安定したキーを生成すること", () => {
    expect(getStaffKey(SAMPLE_STAFF[0])).toBe("staff:0010001");
    expect(
      getStaffKey({
        staffId: "",
        name: "名前のみ",
        department: "総務課",
      }),
    ).toBe("staff:名前のみ::総務課");
    expect(getOrganizationKey(SAMPLE_ORGS[0])).toBe(
      "org:総務部 総務課::課長席",
    );
  });
});
