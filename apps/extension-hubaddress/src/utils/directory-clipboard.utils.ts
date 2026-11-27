import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import { ORGANIZATION_CSV_HEADERS, STAFF_CSV_HEADERS } from "./csv-codec";

/**
 * 1件レコードコピー時の出力フォーマット型
 */
export type RecordCopyFormat = "labeled" | "tsv";

function escapeTsvCell(value: string): string {
  if (/[\t\r\n"]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function formatTsvRow(cells: readonly string[]): string {
  return cells.map(escapeTsvCell).join("\t");
}

function formatLabeledRecord(
  headers: readonly string[],
  cells: readonly string[],
): string {
  return headers.map((header, i) => `${header}: ${cells[i] ?? ""}`).join("\n");
}

function formatRecordsAsTsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  if (rows.length === 0) {
    return "";
  }
  return [formatTsvRow(headers), ...rows.map(formatTsvRow)].join("\n");
}

function toStaffCells(staff: StaffRecord): string[] {
  return [
    staff.staffId,
    staff.name,
    staff.furigana ?? "",
    staff.department,
    staff.title,
    staff.emails.join(", "),
  ];
}

function toOrganizationCells(org: OrganizationRecord): string[] {
  return [
    org.department,
    org.location,
    org.extra,
    org.title,
    org.extensionNumber,
    org.phoneNumber,
    org.faxNumber,
    org.notes,
  ];
}

/**
 * 職員レコード1件をクリップボード出力用テキスト（ラベル付き / 見出し付きTSV）へ整形する
 */
export function formatStaffForClipboard(
  staff: StaffRecord,
  format: RecordCopyFormat,
): string {
  const cells = toStaffCells(staff);
  if (format === "labeled") {
    return formatLabeledRecord(STAFF_CSV_HEADERS, cells);
  }
  return formatRecordsAsTsv(STAFF_CSV_HEADERS, [cells]);
}

/**
 * 組織レコード1件をクリップボード出力用テキスト（ラベル付き / 見出し付きTSV）へ整形する
 */
export function formatOrganizationForClipboard(
  org: OrganizationRecord,
  format: RecordCopyFormat,
): string {
  const cells = toOrganizationCells(org);
  if (format === "labeled") {
    return formatLabeledRecord(ORGANIZATION_CSV_HEADERS, cells);
  }
  return formatRecordsAsTsv(ORGANIZATION_CSV_HEADERS, [cells]);
}

/**
 * 職員レコード配列を見出し付きTSVテキストへ整形する（空配列時は空文字）
 */
export function formatStaffListAsTsv(records: readonly StaffRecord[]): string {
  return formatRecordsAsTsv(STAFF_CSV_HEADERS, records.map(toStaffCells));
}

/**
 * 組織レコード配列を見出し付きTSVテキストへ整形する（空配列時は空文字）
 */
export function formatOrganizationListAsTsv(
  records: readonly OrganizationRecord[],
): string {
  return formatRecordsAsTsv(
    ORGANIZATION_CSV_HEADERS,
    records.map(toOrganizationCells),
  );
}
