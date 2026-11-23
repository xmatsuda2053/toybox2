import type {
  DirectorySnapshot,
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

export const DIRECTORY_JSON_VERSION = 1;

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTrimmedString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value.trim() : "";
}

function readEmails(obj: Record<string, unknown>): string[] {
  const value = obj.emails;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toCleanStaffRecord(record: StaffRecord): Omit<StaffRecord, "id"> {
  return {
    staffId: record.staffId.trim(),
    name: record.name.trim(),
    department: record.department.trim(),
    title: record.title.trim(),
    emails: record.emails
      .map((email) => email.trim())
      .filter((email) => email.length > 0),
  };
}

function toCleanOrganizationRecord(
  record: OrganizationRecord,
): Omit<OrganizationRecord, "id"> {
  return {
    department: record.department.trim(),
    extra: record.extra.trim(),
    location: record.location.trim(),
    title: record.title.trim(),
    extensionNumber: record.extensionNumber.trim(),
    phoneNumber: record.phoneNumber.trim(),
    faxNumber: record.faxNumber.trim(),
    notes: record.notes.trim(),
  };
}

function parseStaffItem(item: unknown, index: number): Omit<StaffRecord, "id"> {
  if (!isRecordObject(item)) {
    throw new Error(`staff[${index}] の形式が不正です。`);
  }

  return {
    staffId: readTrimmedString(item, "staffId"),
    name: readTrimmedString(item, "name"),
    department: readTrimmedString(item, "department"),
    title: readTrimmedString(item, "title"),
    emails: readEmails(item),
  };
}

function parseOrganizationItem(
  item: unknown,
  index: number,
): Omit<OrganizationRecord, "id"> {
  if (!isRecordObject(item)) {
    throw new Error(`organizations[${index}] の形式が不正です。`);
  }

  return {
    department: readTrimmedString(item, "department"),
    extra: readTrimmedString(item, "extra"),
    location: readTrimmedString(item, "location"),
    title: readTrimmedString(item, "title"),
    extensionNumber: readTrimmedString(item, "extensionNumber"),
    phoneNumber: readTrimmedString(item, "phoneNumber"),
    faxNumber: readTrimmedString(item, "faxNumber"),
    notes: readTrimmedString(item, "notes"),
  };
}

/**
 * 職員・組織データを一括 JSON 文字列へシリアライズする（内部 ID は除外）
 */
export function serializeDirectoryJson(
  staff: StaffRecord[],
  organizations: OrganizationRecord[],
  exportedAt = new Date().toISOString(),
): string {
  const snapshot: DirectorySnapshot = {
    version: DIRECTORY_JSON_VERSION,
    exportedAt,
    staff: staff.map(toCleanStaffRecord),
    organizations: organizations.map(toCleanOrganizationRecord),
  };

  return JSON.stringify(snapshot, null, 2);
}

/**
 * 一括 JSON 文字列を検証・パースして職員・組織レコード配列へ復元する
 */
export function parseDirectoryJson(jsonText: string): {
  staff: Omit<StaffRecord, "id">[];
  organizations: Omit<OrganizationRecord, "id">[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON の構文が不正です。");
  }

  if (!isRecordObject(parsed)) {
    throw new Error("JSON のルートはオブジェクトである必要があります。");
  }

  if (!Array.isArray(parsed.staff) || !Array.isArray(parsed.organizations)) {
    throw new Error(
      "JSON には staff および organizations の配列が含まれている必要があります。",
    );
  }

  return {
    staff: parsed.staff.map(parseStaffItem),
    organizations: parsed.organizations.map(parseOrganizationItem),
  };
}
