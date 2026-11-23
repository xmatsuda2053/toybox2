import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

export interface DirectoryFilterOptions {
  query: string;
  department: string;
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

/**
 * 職員・組織一覧から重複排除・昇順ソートされた所属リストを抽出する
 */
export function extractUniqueDepartments(
  staff: StaffRecord[],
  organizations: OrganizationRecord[],
): string[] {
  const set = new Set<string>();
  for (const item of staff) {
    const dept = item.department.trim();
    if (dept.length > 0) {
      set.add(dept);
    }
  }
  for (const item of organizations) {
    const dept = item.department.trim();
    if (dept.length > 0) {
      set.add(dept);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ja"));
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

function applyDirectoryFilter<T extends { department: string }>(
  records: T[],
  options: DirectoryFilterOptions,
  getSearchFields: (record: T) => string[],
): T[] {
  const tokens = splitSearchTokens(options.query);
  const deptFilter = options.department.trim();

  return records.filter((record) => {
    if (deptFilter.length > 0 && record.department.trim() !== deptFilter) {
      return false;
    }
    return matchesAllTokens(getSearchFields(record), tokens);
  });
}

/**
 * 職員レコードを検索条件・所属で絞り込む
 */
export function filterStaff(
  records: StaffRecord[],
  options: DirectoryFilterOptions,
): StaffRecord[] {
  return applyDirectoryFilter(records, options, (staff) => [
    staff.staffId,
    staff.name,
    staff.department,
    staff.title,
    ...staff.emails,
  ]);
}

/**
 * 組織レコードを検索条件・所属で絞り込む
 */
export function filterOrganizations(
  records: OrganizationRecord[],
  options: DirectoryFilterOptions,
): OrganizationRecord[] {
  return applyDirectoryFilter(records, options, (org) => [
    org.department,
    org.extra,
    org.location,
    org.title,
    org.extensionNumber,
    org.phoneNumber,
    org.faxNumber,
    org.notes,
  ]);
}

/**
 * 指定された所属名に一致する組織レコードを検索する
 */
export function findMatchingOrganization(
  organizations: OrganizationRecord[],
  department: string,
): OrganizationRecord | undefined {
  const target = department.trim();
  if (target.length === 0) {
    return undefined;
  }

  return (
    organizations.find((org) => org.department.trim() === target) ??
    organizations.find((org) => org.department.trim().includes(target))
  );
}
