import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  parseStaffCsv,
  parseOrganizationCsv,
  serializeStaffCsv,
  serializeOrganizationCsv,
} from "./csv-codec";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

/**
 * テスト仕様: CSV パーサー・シリアライザー (csv-codec.ts)
 *
 * - 仕様1: 職員 CSV を正しく StaffRecord 配列に変換できること（複数メールアドレスの分割・トリミング含む）
 * - 仕様2: 組織 CSV を正しく OrganizationRecord 配列に変換できること
 * - 仕様3: 空文字やヘッダーのみの CSV に対して空配列を返すこと
 * - 仕様4: serializeStaffCsv / serializeOrganizationCsv でエクスポートした CSV を再パースして元のデータを復元できること
 * - 仕様5: テスト用サンプル CSV (sample-staff.csv, sample-organizations.csv) を全件正しくパースできること
 */
describe("CSV Codec Tests", () => {
  describe("parseStaffCsv", () => {
    it("職員CSVテキストを正しく職員レコード配列に変換できること", () => {
      const csv = `職員番号,氏名,所属,役職,メールアドレス
0012345,田中 太郎,営業一部,課長,tanaka@example.com
0012346,佐藤 花子,人事部,主査,"sato@example.com, sub-sato@example.com"`;

      const result = parseStaffCsv(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        staffId: "0012345",
        name: "田中 太郎",
        furigana: "",
        department: "営業一部",
        title: "課長",
        emails: ["tanaka@example.com"],
      });
      expect(result[1]).toEqual({
        staffId: "0012346",
        name: "佐藤 花子",
        furigana: "",
        department: "人事部",
        title: "主査",
        emails: ["sato@example.com", "sub-sato@example.com"],
      });
    });

    it("フリガナ列を含む職員CSVテキストを正しくパースできること", () => {
      const csv = `職員番号,氏名,フリガナ,所属,役職,メールアドレス
0012345,田中 太郎,たなか たろう,営業一部,課長,tanaka@example.com`;

      const result = parseStaffCsv(csv);
      expect(result).toEqual([
        {
          staffId: "0012345",
          name: "田中 太郎",
          furigana: "たなか たろう",
          department: "営業一部",
          title: "課長",
          emails: ["tanaka@example.com"],
        },
      ]);
    });

    it("複数メールアドレスの区切り（カンマ・セミコロン・空白）と空文字を正規化できること", () => {
      const csv = `職員番号,氏名,所属,役職,メールアドレス
001,鈴木,開発部,,a@example.com; b@example.com  c@example.com
002,高橋,開発部,,`;

      const result = parseStaffCsv(csv);
      expect(result[0].emails).toEqual([
        "a@example.com",
        "b@example.com",
        "c@example.com",
      ]);
      expect(result[1].emails).toEqual([]);
    });

    it("ヘッダー行のみや空文字列が渡された場合、空配列を返すこと", () => {
      expect(parseStaffCsv("")).toEqual([]);
      expect(parseStaffCsv("   \n  \n  ")).toEqual([]);
      expect(parseStaffCsv("職員番号,氏名,所属,役職,メールアドレス\n")).toEqual(
        [],
      );
    });
  });

  describe("parseOrganizationCsv", () => {
    it("組織CSVテキストを正しく組織レコード配列に変換できること", () => {
      const csv = `所属,場所,その他,役職,内線番号,外線番号,FAX番号,備考
総務部 総務課,本庁舎,3階 3F-A,課長席,2101,03-1234-5678,03-1234-5679,代表窓口
営業推進部,新館,2階 2F-B,,3205,03-1234-2222,,特記なし`;

      const result = parseOrganizationCsv(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        department: "総務部 総務課",
        location: "本庁舎",
        extra: "3階 3F-A",
        title: "課長席",
        extensionNumber: "2101",
        phoneNumber: "03-1234-5678",
        faxNumber: "03-1234-5679",
        notes: "代表窓口",
      });
      expect(result[1]).toEqual({
        department: "営業推進部",
        location: "新館",
        extra: "2階 2F-B",
        title: "",
        extensionNumber: "3205",
        phoneNumber: "03-1234-2222",
        faxNumber: "",
        notes: "特記なし",
      });
    });

    it("ヘッダー行のみや空文字列が渡された場合、空配列を返すこと", () => {
      expect(parseOrganizationCsv("")).toEqual([]);
      expect(
        parseOrganizationCsv(
          "所属,場所,その他,役職,内線番号,外線番号,FAX番号,備考\n",
        ),
      ).toEqual([]);
    });
  });

  describe("CSV Serialize & Round-trip", () => {
    it("serializeStaffCsv で出力した CSV を parseStaffCsv で元どおり復元できること", () => {
      const staff: StaffRecord[] = [
        {
          id: 1,
          staffId: "0010001",
          name: "田中 太郎",
          furigana: "たなか たろう",
          department: "総務部 総務課",
          title: "課長",
          emails: ["tanaka@example.com", "t-tanaka@sub.example.com"],
        },
        {
          id: 2,
          staffId: "0010002",
          name: "佐藤 花子",
          department: "人事部, 第一課",
          title: "",
          emails: [],
        },
      ];

      const csv = serializeStaffCsv(staff);
      expect(
        csv.startsWith("職員番号,氏名,フリガナ,所属,役職,メールアドレス"),
      ).toBe(true);

      const restored = parseStaffCsv(csv);
      expect(restored).toEqual([
        {
          staffId: "0010001",
          name: "田中 太郎",
          furigana: "たなか たろう",
          department: "総務部 総務課",
          title: "課長",
          emails: ["tanaka@example.com", "t-tanaka@sub.example.com"],
        },
        {
          staffId: "0010002",
          name: "佐藤 花子",
          furigana: "",
          department: "人事部, 第一課",
          title: "",
          emails: [],
        },
      ]);
    });

    it("serializeOrganizationCsv で出力した CSV を parseOrganizationCsv で元どおり復元できること", () => {
      const organizations: OrganizationRecord[] = [
        {
          id: 10,
          department: "総務部 総務課",
          location: "本庁舎",
          extra: "3階 3F-A",
          title: "課長席",
          extensionNumber: "2101",
          phoneNumber: "03-1234-2101",
          faxNumber: "03-1234-2109",
          notes: "代表, 内線案内",
        },
      ];

      const csv = serializeOrganizationCsv(organizations);
      expect(
        csv.startsWith("所属,場所,その他,役職,内線番号,外線番号,FAX番号,備考"),
      ).toBe(true);

      const restored = parseOrganizationCsv(csv);
      expect(restored).toEqual([
        {
          department: "総務部 総務課",
          location: "本庁舎",
          extra: "3階 3F-A",
          title: "課長席",
          extensionNumber: "2101",
          phoneNumber: "03-1234-2101",
          faxNumber: "03-1234-2109",
          notes: "代表, 内線案内",
        },
      ]);
    });
  });

  describe("Sample CSV Integration Tests", () => {
    it("sample-staff.csv を正しく読み込んで全件パースできること", () => {
      const csvPath = resolve(__dirname, "../../test-data/sample-staff.csv");
      const csvText = readFileSync(csvPath, "utf-8");
      const result = parseStaffCsv(csvText);

      expect(result).toHaveLength(1500);
      expect(result[0].staffId).toBe("0010001");
      expect(result[0].emails).toEqual([
        "tanaka.taro@example.com",
        "t-tanaka@sub.example.com",
      ]);
    });

    it("sample-organizations.csv を正しく読み込んで全件パースできること", () => {
      const csvPath = resolve(
        __dirname,
        "../../test-data/sample-organizations.csv",
      );
      const csvText = readFileSync(csvPath, "utf-8");
      expect(
        csvText.startsWith(
          "所属,場所,その他,役職,内線番号,外線番号,FAX番号,備考",
        ),
      ).toBe(true);
      const result = parseOrganizationCsv(csvText);

      expect(result).toHaveLength(300);
      expect(result[0].department).toBe("総務部 総務課");
      expect(result[0].location).toBe("本庁舎");
      expect(result[0].extra).toBe("3階 3F-A");
      expect(result[0].extensionNumber).toBe("2101");
    });
  });
});
