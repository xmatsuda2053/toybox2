import { describe, it, expect } from "vitest";
import {
  formatOrganizationForClipboard,
  formatOrganizationListAsTsv,
  formatStaffForClipboard,
  formatStaffListAsTsv,
} from "./directory-clipboard.utils";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

const SAMPLE_STAFF: StaffRecord = {
  id: 1,
  staffId: "0010001",
  name: "田中 太郎",
  furigana: "たなか たろう",
  department: "総務部 総務課",
  title: "課長",
  emails: ["tanaka@example.com", "taro@sub.example.com"],
};

const SAMPLE_ORG: OrganizationRecord = {
  id: 1,
  department: "総務部 総務課",
  location: "本庁舎",
  extra: "3階 3F-A",
  title: "課長席",
  extensionNumber: "2101",
  phoneNumber: "03-1234-2101",
  faxNumber: "03-1234-2109",
  notes: "代表窓口",
};

/**
 * テスト仕様: 職員・組織クリップボード出力フォーマッタ (directory-clipboard.utils.ts)
 *
 * - 仕様1: formatStaffForClipboard で職員1件を「ラベル付きテキスト」と「見出し付きTSV」へ整形でき、職員番号はDB登録値そのまま出力されること
 * - 仕様2: formatOrganizationForClipboard で組織1件を「ラベル付きテキスト」と「見出し付きTSV」へ整形でき、空項目も含めて全項目出力されること
 * - 仕様3: formatStaffListAsTsv / formatOrganizationListAsTsv で複数件を見出し付きTSVへ整形でき、空配列時は空文字を返すこと
 * - 仕様4: TSV出力時にタブ・改行・ダブルクォートを含むセルがExcel互換で適切にエスケープされ、末尾の空列タブが保持されること
 */
describe("Directory Clipboard Utils Tests", () => {
  it("formatStaffForClipboard で職員1件をラベル付きテキストと見出し付きTSVへ整形できること", () => {
    const labeled = formatStaffForClipboard(SAMPLE_STAFF, "labeled");
    expect(labeled).toBe(
      [
        "職員番号: 0010001",
        "氏名: 田中 太郎",
        "フリガナ: たなか たろう",
        "所属: 総務部 総務課",
        "役職: 課長",
        "メールアドレス: tanaka@example.com, taro@sub.example.com",
      ].join("\n"),
    );

    const tsv = formatStaffForClipboard(SAMPLE_STAFF, "tsv");
    expect(tsv).toBe(
      [
        "職員番号\t氏名\tフリガナ\t所属\t役職\tメールアドレス",
        "0010001\t田中 太郎\tたなか たろう\t総務部 総務課\t課長\ttanaka@example.com, taro@sub.example.com",
      ].join("\n"),
    );
  });

  it("formatOrganizationForClipboard で組織1件をラベル付きテキストと見出し付きTSVへ整形でき空項目も出力されること", () => {
    const emptyTailOrg: OrganizationRecord = {
      ...SAMPLE_ORG,
      faxNumber: "",
      notes: "",
    };

    const labeled = formatOrganizationForClipboard(emptyTailOrg, "labeled");
    expect(labeled).toBe(
      [
        "所属: 総務部 総務課",
        "場所: 本庁舎",
        "その他: 3階 3F-A",
        "役職: 課長席",
        "内線番号: 2101",
        "外線番号: 03-1234-2101",
        "FAX番号: ",
        "備考: ",
      ].join("\n"),
    );

    const tsv = formatOrganizationForClipboard(emptyTailOrg, "tsv");
    expect(tsv).toBe(
      [
        "所属\t場所\tその他\t役職\t内線番号\t外線番号\tFAX番号\t備考",
        "総務部 総務課\t本庁舎\t3階 3F-A\t課長席\t2101\t03-1234-2101\t\t",
      ].join("\n"),
    );
  });

  it("formatStaffListAsTsv / formatOrganizationListAsTsv で複数件を見出し付きTSVへ整形し空配列時は空文字を返すこと", () => {
    expect(formatStaffListAsTsv([])).toBe("");
    expect(formatOrganizationListAsTsv([])).toBe("");

    const secondStaff: StaffRecord = {
      id: 2,
      staffId: "0000042",
      name: "佐藤 花子",
      department: "人事課",
      title: "",
      emails: [],
    };
    const staffTsv = formatStaffListAsTsv([SAMPLE_STAFF, secondStaff]);
    expect(staffTsv.split("\n")).toEqual([
      "職員番号\t氏名\tフリガナ\t所属\t役職\tメールアドレス",
      "0010001\t田中 太郎\tたなか たろう\t総務部 総務課\t課長\ttanaka@example.com, taro@sub.example.com",
      "0000042\t佐藤 花子\t\t人事課\t\t",
    ]);

    const orgTsv = formatOrganizationListAsTsv([SAMPLE_ORG]);
    expect(orgTsv.split("\n")).toEqual([
      "所属\t場所\tその他\t役職\t内線番号\t外線番号\tFAX番号\t備考",
      "総務部 総務課\t本庁舎\t3階 3F-A\t課長席\t2101\t03-1234-2101\t03-1234-2109\t代表窓口",
    ]);
  });

  it("TSV出力でタブ・改行・ダブルクォートを含むセルが適切にエスケープされること", () => {
    const specialOrg: OrganizationRecord = {
      ...SAMPLE_ORG,
      notes: '1行目\n"特別"\t窓口',
    };
    const tsv = formatOrganizationForClipboard(specialOrg, "tsv");
    expect(tsv).toBe(
      [
        "所属\t場所\tその他\t役職\t内線番号\t外線番号\tFAX番号\t備考",
        '総務部 総務課\t本庁舎\t3階 3F-A\t課長席\t2101\t03-1234-2101\t03-1234-2109\t"1行目\n""特別""\t窓口"',
      ].join("\n"),
    );
  });
});
