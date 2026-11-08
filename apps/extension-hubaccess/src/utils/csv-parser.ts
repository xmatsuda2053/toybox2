import Papa from "papaparse";
import { StaffRecord, OrganizationRecord } from "../models/directory.model";

/**
 * 文字列フィールドの前後の余白をトリムし、未定義なら空文字を返す
 */
export function cleanField(val: unknown): string {
  if (typeof val === "string") {
    return val.trim();
  }
  return "";
}

/**
 * カンマ・セミコロン・スペース等で区切られたメールアドレス文字列を配列に正規化する
 */
export function parseEmails(rawText: string | undefined): string[] {
  if (!rawText) {
    return [];
  }
  return rawText
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

/**
 * 職員CSVテキストをパースして StaffRecord 配列に変換する
 */
export function parseStaffCsv(csvText: string): StaffRecord[] {
  if (!csvText || !csvText.trim()) {
    return [];
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  return parsed.data
    .map((row) => ({
      staffId: cleanField(row["職員番号"]),
      name: cleanField(row["氏名"]),
      department: cleanField(row["所属"]),
      title: cleanField(row["役職"]),
      emails: parseEmails(row["メールアドレス"]),
    }))
    .filter((record) => record.staffId.length > 0 || record.name.length > 0);
}

/**
 * 組織CSVテキストをパースして OrganizationRecord 配列に変換する
 */
export function parseOrganizationCsv(csvText: string): OrganizationRecord[] {
  if (!csvText || !csvText.trim()) {
    return [];
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  return parsed.data
    .map((row) => ({
      department: cleanField(row["所属"]),
      extra: cleanField(row["その他"]),
      location: cleanField(row["場所"]),
      title: cleanField(row["役職"]),
      extensionNumber: cleanField(row["内線番号"]),
      phoneNumber: cleanField(row["外線番号"]),
      faxNumber: cleanField(row["FAX番号"]),
      notes: cleanField(row["備考"]),
    }))
    .filter((record) => record.department.length > 0);
}

