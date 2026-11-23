import Papa from "papaparse";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

export const STAFF_CSV_HEADERS = [
  "職員番号",
  "氏名",
  "フリガナ",
  "所属",
  "役職",
  "メールアドレス",
] as const;

export const ORGANIZATION_CSV_HEADERS = [
  "所属",
  "場所",
  "その他",
  "役職",
  "内線番号",
  "外線番号",
  "FAX番号",
  "備考",
] as const;

type CsvRow = Record<string, string | undefined>;

function parseCsvRows(csvText: string): CsvRow[] {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = Papa.parse<CsvRow>(trimmed, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return parsed.data;
}

function normalizeCell(value: string | undefined): string {
  return value?.trim() ?? "";
}

function splitEmails(rawEmails: string | undefined): string[] {
  const normalized = normalizeCell(rawEmails);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/[,;\s]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * 職員 CSV テキストを StaffRecord 配列へ変換する
 */
export function parseStaffCsv(csvText: string): Omit<StaffRecord, "id">[] {
  return parseCsvRows(csvText).map((row) => ({
    staffId: normalizeCell(row["職員番号"]),
    name: normalizeCell(row["氏名"]),
    furigana: normalizeCell(row["フリガナ"] ?? row["ふりがな"]),
    department: normalizeCell(row["所属"]),
    title: normalizeCell(row["役職"]),
    emails: splitEmails(row["メールアドレス"]),
  }));
}

/**
 * 組織 CSV テキストを OrganizationRecord 配列へ変換する
 */
export function parseOrganizationCsv(
  csvText: string,
): Omit<OrganizationRecord, "id">[] {
  return parseCsvRows(csvText).map((row) => ({
    department: normalizeCell(row["所属"]),
    location: normalizeCell(row["場所"]),
    extra: normalizeCell(row["その他"]),
    title: normalizeCell(row["役職"]),
    extensionNumber: normalizeCell(row["内線番号"]),
    phoneNumber: normalizeCell(row["外線番号"]),
    faxNumber: normalizeCell(row["FAX番号"]),
    notes: normalizeCell(row["備考"]),
  }));
}

/**
 * 職員レコード配列を CSV テキストへシリアライズする
 */
export function serializeStaffCsv(records: StaffRecord[]): string {
  const rows = records.map((record) => [
    record.staffId,
    record.name,
    record.furigana ?? "",
    record.department,
    record.title,
    record.emails.join(", "),
  ]);

  return Papa.unparse({
    fields: [...STAFF_CSV_HEADERS],
    data: rows,
  });
}

/**
 * 組織レコード配列を CSV テキストへシリアライズする
 */
export function serializeOrganizationCsv(
  records: OrganizationRecord[],
): string {
  const rows = records.map((record) => [
    record.department,
    record.location,
    record.extra,
    record.title,
    record.extensionNumber,
    record.phoneNumber,
    record.faxNumber,
    record.notes,
  ]);

  return Papa.unparse({
    fields: [...ORGANIZATION_CSV_HEADERS],
    data: rows,
  });
}
