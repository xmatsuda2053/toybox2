import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseStaffCsv, parseOrganizationCsv } from "./csv-parser";

/**
 * CSVパーサー関数テスト仕様
 *
 * - 仕様1: 職員CSVテキストを正しくStaffRecord配列に変換できること
 * - 仕様2: 職員CSVで複数のメールアドレス（カンマ/セミコロン/スペース区切り）が正しく配列化されること
 * - 仕様3: 組織CSVテキストを正しくOrganizationRecord配列に変換できること
 * - 仕様4: 空白行や前後の余白が正しくトリミングされること
 * - 仕様5: ヘッダー行のみや空文字列が渡された場合、空配列を返すこと
 */
describe("CSV Parser Tests", () => {
  describe("parseStaffCsv", () => {
    it("職員CSVテキストを正しくStaffRecord配列に変換できること", () => {
      const csv = `職員番号,氏名,所属,役職,メールアドレス
0012345,田中 太郎,営業一部,課長,tanaka@example.com
0012346,佐藤 花子,人事部,主査,sato@example.com`;

      const result = parseStaffCsv(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        staffId: "0012345",
        name: "田中 太郎",
        department: "営業一部",
        title: "課長",
        emails: ["tanaka@example.com"],
      });
      expect(result[1]).toEqual({
        staffId: "0012346",
        name: "佐藤 花子",
        department: "人事部",
        title: "主査",
        emails: ["sato@example.com"],
      });
    });

    it("職員CSVで複数のメールアドレス（カンマ/セミコロン/スペース区切り）が正しく配列化されること", () => {
      const csv = `職員番号,氏名,所属,役職,メールアドレス
0012345,田中 太郎,営業一部,課長,"user1@example.com, user2@example.com"
0012346,佐藤 花子,人事部,主査,"user3@example.com;user4@example.com user5@example.com"`;

      const result = parseStaffCsv(csv);
      expect(result).toHaveLength(2);
      expect(result[0].emails).toEqual(["user1@example.com", "user2@example.com"]);
      expect(result[1].emails).toEqual([
        "user3@example.com",
        "user4@example.com",
        "user5@example.com",
      ]);
    });

    it("ヘッダー行のみや空文字列が渡された場合、空配列を返すこと", () => {
      expect(parseStaffCsv("")).toEqual([]);
      expect(parseStaffCsv("   \n  \n  ")).toEqual([]);
      expect(parseStaffCsv("職員番号,氏名,所属,役職,メールアドレス\n")).toEqual([]);
    });
  });

  describe("parseOrganizationCsv", () => {
    it("組織CSVテキストを正しくOrganizationRecord配列に変換できること", () => {
      const csv = `所属,その他,場所,役職,内線番号,外線番号,FAX番号,備考
総務部 総務課,本庁舎 3階,3F-A,課長席,2101,03-1234-5678,03-1234-5679,代表窓口
営業推進部,新館 2階,2F-B,,3205,03-1234-2222,,特記なし`;

      const result = parseOrganizationCsv(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        department: "総務部 総務課",
        extra: "本庁舎 3階",
        location: "3F-A",
        title: "課長席",
        extensionNumber: "2101",
        phoneNumber: "03-1234-5678",
        faxNumber: "03-1234-5679",
        notes: "代表窓口",
      });
      expect(result[1]).toEqual({
        department: "営業推進部",
        extra: "新館 2階",
        location: "2F-B",
        title: "",
        extensionNumber: "3205",
        phoneNumber: "03-1234-2222",
        faxNumber: "",
        notes: "特記なし",
      });
    });

    it("空白行や前後の余白が正しくトリミングされること", () => {
      const csv = `所属,その他,場所,役職,内線番号,外線番号,FAX番号,備考
  総務課  , 3F , A , , 100 , 03-0000-0000 , ,

`;
      const result = parseOrganizationCsv(csv);
      expect(result).toHaveLength(1);
      expect(result[0].department).toBe("総務課");
      expect(result[0].extra).toBe("3F");
      expect(result[0].location).toBe("A");
      expect(result[0].title).toBe("");
      expect(result[0].extensionNumber).toBe("100");
      expect(result[0].phoneNumber).toBe("03-0000-0000");
      expect(result[0].faxNumber).toBe("");
      expect(result[0].notes).toBe("");
    });

    it("ヘッダー行のみや空文字列が渡された場合、空配列を返すこと", () => {
      expect(parseOrganizationCsv("")).toEqual([]);
      expect(parseOrganizationCsv("所属,その他,場所,役職,内線番号,外線番号,FAX番号,備考\n")).toEqual([]);
    });
  });

  describe("Sample CSV Integration Tests", () => {
    it("sample-staff.csv を正しく読み込んで全件パースできること", () => {
      const csvPath = resolve(__dirname, "../../test-data/sample-staff.csv");
      const csvText = readFileSync(csvPath, "utf-8");
      const result = parseStaffCsv(csvText);

      expect(result).toHaveLength(8);
      expect(result[0].staffId).toBe("0010001");
      expect(result[0].name).toBe("田中 太郎");
      expect(result[0].emails).toEqual([
        "tanaka.taro@example.com",
        "t-tanaka@sub.example.com",
      ]);
    });

    it("sample-organizations.csv を正しく読み込んで全件パースできること", () => {
      const csvPath = resolve(__dirname, "../../test-data/sample-organizations.csv");
      const csvText = readFileSync(csvPath, "utf-8");
      const result = parseOrganizationCsv(csvText);

      expect(result).toHaveLength(8);
      expect(result[0].department).toBe("総務部 総務課");
      expect(result[0].extensionNumber).toBe("2101");
      expect(result[0].phoneNumber).toBe("03-1234-2101");
    });
  });
});

