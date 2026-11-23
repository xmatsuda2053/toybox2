import { describe, it, expect } from "vitest";
import {
  extractUniqueDepartments,
  filterOrganizations,
  filterStaff,
  findMatchingOrganization,
  getOrganizationFavoriteKey,
  getStaffFavoriteKey,
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
    staffId: "0010002",
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
 * テスト仕様: 一覧フィルタリング・検索・所属マッチング純粋関数 (directory-filter.utils.ts)
 *
 * - 仕様1: extractUniqueDepartments で職員と組織の所属を重複排除・ソートして取得できること
 * - 仕様2: filterStaff でスペース区切り AND 検索・所属絞り込み・お気に入り絞り込み・お気に入り優先ソートができること
 * - 仕様3: filterOrganizations で内線/外線/場所/備考などを含めた検索・絞り込み・お気に入り優先ソートができること
 * - 仕様4: findMatchingOrganization で職員の所属に一致する組織レコードを検索できること
 * - 仕様5: getStaffFavoriteKey / getOrganizationFavoriteKey が一意かつ安定したキー文字列を生成すること
 */
describe("Directory Filter Utils Tests", () => {
  it("extractUniqueDepartments で職員と組織から重複なしの所属一覧を取得できること", () => {
    const departments = extractUniqueDepartments(
      [
        ...SAMPLE_STAFF,
        {
          id: 4,
          staffId: "009",
          name: "追加 職員",
          department: "開発部",
          title: "",
          emails: [],
        },
      ],
      SAMPLE_ORGS,
    );

    expect(departments).toHaveLength(4);
    expect(departments).toContain("総務部 総務課");
    expect(departments).toContain("総務部 人事課");
    expect(departments).toContain("営業推進部 第一営業課");
    expect(departments).toContain("開発部");
  });

  it("filterStaff でフリーワード AND 検索・所属フィルタ・お気に入り絞り込みおよび優先表示ができること", () => {
    const favKey = getStaffFavoriteKey(SAMPLE_STAFF[2]);
    const favoriteKeys = new Set([favKey]);

    // クエリなし：お気に入りが先頭に並ぶこと
    const allSorted = filterStaff(SAMPLE_STAFF, {
      query: "",
      department: "",
      favoritesOnly: false,
      favoriteKeys,
    });
    expect(allSorted[0].staffId).toBe("0020001");

    // スペース区切り AND 検索（メールアドレス＋役職など横断）
    const searched = filterStaff(SAMPLE_STAFF, {
      query: "tanaka 課長",
      department: "",
      favoritesOnly: false,
      favoriteKeys,
    });
    expect(searched.map((s) => s.staffId)).toEqual(["0010001"]);

    // 所属フィルタ
    const byDept = filterStaff(SAMPLE_STAFF, {
      query: "",
      department: "総務部 人事課",
      favoritesOnly: false,
      favoriteKeys,
    });
    expect(byDept.map((s) => s.staffId)).toEqual(["0010002"]);

    // お気に入りのみ
    const favOnly = filterStaff(SAMPLE_STAFF, {
      query: "",
      department: "",
      favoritesOnly: true,
      favoriteKeys,
    });
    expect(favOnly.map((s) => s.staffId)).toEqual(["0020001"]);
  });

  it("filterOrganizations で内線・場所・備考検索およびお気に入り優先ソートができること", () => {
    const favKey = getOrganizationFavoriteKey(SAMPLE_ORGS[1]);
    const favoriteKeys = new Set([favKey]);

    const sorted = filterOrganizations(SAMPLE_ORGS, {
      query: "",
      department: "",
      favoritesOnly: false,
      favoriteKeys,
    });
    expect(sorted[0].department).toBe("総務部 人事課");

    const byExtension = filterOrganizations(SAMPLE_ORGS, {
      query: "3201 東日本",
      department: "",
      favoritesOnly: false,
      favoriteKeys,
    });
    expect(byExtension).toHaveLength(1);
    expect(byExtension[0].department).toBe("営業推進部 第一営業課");

    const favOnly = filterOrganizations(SAMPLE_ORGS, {
      query: "",
      department: "",
      favoritesOnly: true,
      favoriteKeys,
    });
    expect(favOnly).toHaveLength(1);
    expect(favOnly[0].department).toBe("総務部 人事課");
  });

  it("findMatchingOrganization で職員の所属文字列から該当組織を検索できること", () => {
    const matched = findMatchingOrganization(SAMPLE_ORGS, " 総務部 総務課 ");
    expect(matched?.extensionNumber).toBe("2101");

    const missing = findMatchingOrganization(SAMPLE_ORGS, "存在しない部署");
    expect(missing).toBeUndefined();
  });

  it("getStaffFavoriteKey / getOrganizationFavoriteKey が安定したキーを生成すること", () => {
    expect(getStaffFavoriteKey(SAMPLE_STAFF[0])).toBe("staff:0010001");
    expect(
      getStaffFavoriteKey({
        staffId: "",
        name: "名前のみ",
        department: "総務課",
      }),
    ).toBe("staff:名前のみ::総務課");
    expect(getOrganizationFavoriteKey(SAMPLE_ORGS[0])).toBe(
      "org:総務部 総務課::課長席",
    );
  });
});
