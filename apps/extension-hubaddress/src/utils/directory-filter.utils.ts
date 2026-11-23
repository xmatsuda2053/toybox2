import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

/**
 * 職員番号を表示用の5桁文字列へ整形する（5桁未満は0埋め、6桁以上は下5桁）
 */
export function formatStaffIdFiveDigits(staffId: string): string {
  const trimmed = staffId.trim();
  if (trimmed.length === 0) {
    return "";
  }
  if (trimmed.length < 5) {
    return trimmed.padStart(5, "0");
  }
  if (trimmed.length > 5) {
    return trimmed.slice(-5);
  }
  return trimmed;
}

/**
 * 職員レコード用の一意な識別キーを生成する
 */
export function getStaffKey(
  staff: Pick<StaffRecord, "staffId" | "name" | "department">,
): string {
  const id = staff.staffId.trim();
  if (id.length > 0) {
    return `staff:${id}`;
  }
  return `staff:${staff.name.trim()}::${staff.department.trim()}`;
}

/**
 * 組織レコード用の一意な識別キーを生成する
 */
export function getOrganizationKey(
  org: Pick<OrganizationRecord, "department" | "title">,
): string {
  return `org:${org.department.trim()}::${org.title.trim()}`;
}

function splitSearchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function matchesAllTokens(fields: string[], tokens: string[]): boolean {
  if (tokens.length === 0) {
    return true;
  }
  const haystack = fields.join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

/**
 * 職員レコードをフリーワード AND 検索で絞り込む
 */
export function filterStaff(
  records: StaffRecord[],
  query: string,
): StaffRecord[] {
  const tokens = splitSearchTokens(query);
  if (tokens.length === 0) {
    return records;
  }

  return records.filter((staff) =>
    matchesAllTokens(
      [
        staff.staffId,
        formatStaffIdFiveDigits(staff.staffId),
        staff.name,
        staff.department,
        staff.title,
        ...staff.emails,
      ],
      tokens,
    ),
  );
}

/**
 * 組織レコードをフリーワード AND 検索で絞り込む
 */
export function filterOrganizations(
  records: OrganizationRecord[],
  query: string,
): OrganizationRecord[] {
  const tokens = splitSearchTokens(query);
  if (tokens.length === 0) {
    return records;
  }

  return records.filter((org) =>
    matchesAllTokens(
      [
        org.department,
        org.extra,
        org.location,
        org.title,
        org.extensionNumber,
        org.phoneNumber,
        org.faxNumber,
        org.notes,
      ],
      tokens,
    ),
  );
}
