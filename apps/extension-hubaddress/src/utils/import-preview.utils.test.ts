import { describe, it, expect } from "vitest";
import { prepareImportPreview } from "./import-preview.utils";

/**
 * テスト仕様: インポートプレビュー生成 (import-preview.utils.ts)
 *
 * - 仕様1: 職員 CSV バイト列（UTF-8 / Shift_JIS）から件数付きプレビューを生成できること
 * - 仕様2: 組織 CSV バイト列から件数付きプレビューを生成できること
 * - 仕様3: 一括 JSON バイト列から職員・組織両方の件数付きプレビューを生成できること
 * - 仕様4: 0件データや不正 JSON の場合にエラーをスローすること
 */
describe("Import Preview Utils Tests", () => {
  it("職員 CSV からプレビュー情報（エンコーディングと件数）を生成できること", () => {
    const csv = `職員番号,氏名,所属,役職,メールアドレス\n001,田中 太郎,総務課,課長,tanaka@example.com`;
    const bytes = new TextEncoder().encode(csv);

    const preview = prepareImportPreview("staff.csv", bytes, "staff-csv", {
      staff: 5,
      organizations: 2,
    });

    expect(preview.kind).toBe("staff-csv");
    expect(preview.fileName).toBe("staff.csv");
    expect(preview.encoding).toBe("utf-8");
    expect(preview.staffCount).toBe(1);
    expect(preview.currentStaffCount).toBe(5);
    expect(preview.staffRecords?.[0].name).toBe("田中 太郎");
  });

  it("組織 CSV からプレビュー情報を生成できること", () => {
    const csv = `所属,場所,その他,役職,内線番号,外線番号,FAX番号,備考\n総務課,本庁舎,3階,,2101,,,`;
    const bytes = new TextEncoder().encode(csv);

    const preview = prepareImportPreview("orgs.csv", bytes, "org-csv", {
      staff: 3,
      organizations: 1,
    });

    expect(preview.kind).toBe("org-csv");
    expect(preview.organizationCount).toBe(1);
    expect(preview.currentOrganizationCount).toBe(1);
    expect(preview.organizationRecords?.[0].extensionNumber).toBe("2101");
  });

  it("一括 JSON から職員・組織両方のプレビュー情報を生成できること", () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: "2026-11-23T00:00:00.000Z",
      staff: [
        {
          staffId: "001",
          name: "田中",
          department: "総務課",
          title: "",
          emails: [],
        },
      ],
      organizations: [
        {
          department: "総務課",
          extra: "",
          location: "",
          title: "",
          extensionNumber: "100",
          phoneNumber: "",
          faxNumber: "",
          notes: "",
        },
      ],
    });
    const bytes = new TextEncoder().encode(json);

    const preview = prepareImportPreview("backup.json", bytes, "json", {
      staff: 10,
      organizations: 4,
    });

    expect(preview.kind).toBe("json");
    expect(preview.staffCount).toBe(1);
    expect(preview.organizationCount).toBe(1);
  });

  it("レコード0件の CSV や不正 JSON 時にエラーをスローすること", () => {
    const emptyCsv = new TextEncoder().encode(
      "職員番号,氏名,所属,役職,メールアドレス\n",
    );
    expect(() =>
      prepareImportPreview("empty.csv", emptyCsv, "staff-csv", {
        staff: 0,
        organizations: 0,
      }),
    ).toThrow();

    const invalidJson = new TextEncoder().encode("{broken");
    expect(() =>
      prepareImportPreview("broken.json", invalidJson, "json", {
        staff: 0,
        organizations: 0,
      }),
    ).toThrow();
  });
});
