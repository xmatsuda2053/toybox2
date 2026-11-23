import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import { parseOrganizationCsv, parseStaffCsv } from "./csv-codec";
import { decodeCsvBytes, type DetectedCsvEncoding } from "./encoding.utils";
import { parseDirectoryJson } from "./json-codec";

export type ImportKind = "staff-csv" | "org-csv" | "json";

export interface ImportPreview {
  kind: ImportKind;
  fileName: string;
  encoding?: DetectedCsvEncoding;
  staffRecords?: Omit<StaffRecord, "id">[];
  organizationRecords?: Omit<OrganizationRecord, "id">[];
  staffCount: number;
  organizationCount: number;
  currentStaffCount: number;
  currentOrganizationCount: number;
}

function buildStaffCsvPreview(
  fileName: string,
  bytes: Uint8Array,
  currentCounts: { staff: number; organizations: number },
): ImportPreview {
  const decoded = decodeCsvBytes(bytes);
  const staffRecords = parseStaffCsv(decoded.text);
  if (staffRecords.length === 0) {
    throw new Error("職員 CSV にインポート可能なレコードが含まれていません。");
  }

  return {
    kind: "staff-csv",
    fileName,
    encoding: decoded.encoding,
    staffRecords,
    staffCount: staffRecords.length,
    organizationCount: 0,
    currentStaffCount: currentCounts.staff,
    currentOrganizationCount: currentCounts.organizations,
  };
}

function buildOrgCsvPreview(
  fileName: string,
  bytes: Uint8Array,
  currentCounts: { staff: number; organizations: number },
): ImportPreview {
  const decoded = decodeCsvBytes(bytes);
  const organizationRecords = parseOrganizationCsv(decoded.text);
  if (organizationRecords.length === 0) {
    throw new Error("組織 CSV にインポート可能なレコードが含まれていません。");
  }

  return {
    kind: "org-csv",
    fileName,
    encoding: decoded.encoding,
    organizationRecords,
    staffCount: 0,
    organizationCount: organizationRecords.length,
    currentStaffCount: currentCounts.staff,
    currentOrganizationCount: currentCounts.organizations,
  };
}

function buildJsonPreview(
  fileName: string,
  bytes: Uint8Array,
  currentCounts: { staff: number; organizations: number },
): ImportPreview {
  const jsonText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const parsed = parseDirectoryJson(jsonText);

  return {
    kind: "json",
    fileName,
    staffRecords: parsed.staff,
    organizationRecords: parsed.organizations,
    staffCount: parsed.staff.length,
    organizationCount: parsed.organizations.length,
    currentStaffCount: currentCounts.staff,
    currentOrganizationCount: currentCounts.organizations,
  };
}

/**
 * インポートファイルのバイト列を解析し、確認ダイアログ用のプレビューを生成する
 */
export function prepareImportPreview(
  fileName: string,
  bytes: Uint8Array,
  kind: ImportKind,
  currentCounts: { staff: number; organizations: number },
): ImportPreview {
  if (kind === "staff-csv") {
    return buildStaffCsvPreview(fileName, bytes, currentCounts);
  }
  if (kind === "org-csv") {
    return buildOrgCsvPreview(fileName, bytes, currentCounts);
  }
  return buildJsonPreview(fileName, bytes, currentCounts);
}
