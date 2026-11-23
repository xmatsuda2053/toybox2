import type {
  OrganizationRecord,
  StaffRecord,
  StaffSortMode,
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

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    );
}

function splitSearchTokens(query: string): string[] {
  return normalizeSearchText(query)
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function matchesAllTokens(fields: string[], tokens: string[]): boolean {
  if (tokens.length === 0) {
    return true;
  }
  const haystack = normalizeSearchText(fields.join(" "));
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
        staff.furigana ?? "",
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

const JA_COLLATOR = new Intl.Collator("ja", { numeric: true });

function compareTextEmptyLast(a: string, b: string): number {
  const left = a.trim();
  const right = b.trim();
  if (left.length === 0 && right.length === 0) {
    return 0;
  }
  if (left.length === 0) {
    return 1;
  }
  if (right.length === 0) {
    return -1;
  }
  return JA_COLLATOR.compare(left, right);
}

function compareIdAsc(aId?: number, bId?: number): number {
  return (aId ?? Number.MAX_SAFE_INTEGER) - (bId ?? Number.MAX_SAFE_INTEGER);
}

function getStaffNameSortKey(staff: StaffRecord): string {
  const furigana = (staff.furigana ?? "").trim();
  return normalizeSearchText(furigana.length > 0 ? furigana : staff.name);
}

function compareStaffByDepartment(a: StaffRecord, b: StaffRecord): number {
  return (
    compareTextEmptyLast(a.department, b.department) ||
    compareTextEmptyLast(
      normalizeSearchText(a.furigana ?? ""),
      normalizeSearchText(b.furigana ?? ""),
    ) ||
    compareTextEmptyLast(a.name, b.name) ||
    compareIdAsc(a.id, b.id)
  );
}

function compareStaffByName(a: StaffRecord, b: StaffRecord): number {
  return (
    compareTextEmptyLast(getStaffNameSortKey(a), getStaffNameSortKey(b)) ||
    compareTextEmptyLast(a.name, b.name) ||
    compareTextEmptyLast(a.department, b.department) ||
    compareIdAsc(a.id, b.id)
  );
}

function compareStaffByStaffId(a: StaffRecord, b: StaffRecord): number {
  return (
    compareTextEmptyLast(a.staffId, b.staffId) ||
    compareTextEmptyLast(a.name, b.name) ||
    compareIdAsc(a.id, b.id)
  );
}

const STAFF_SORT_COMPARATORS: Record<
  StaffSortMode,
  (a: StaffRecord, b: StaffRecord) => number
> = {
  department: compareStaffByDepartment,
  name: compareStaffByName,
  staffId: compareStaffByStaffId,
};

/**
 * 職員レコードを指定されたソート順（昇順）でソートする
 */
export function sortStaff(
  records: StaffRecord[],
  sortMode: StaffSortMode = "department",
): StaffRecord[] {
  const comparator = STAFF_SORT_COMPARATORS[sortMode];
  return [...records].sort(comparator);
}

/**
 * 組織レコードを「組織名 → id昇順」でソートする
 */
export function sortOrganizations(
  records: OrganizationRecord[],
): OrganizationRecord[] {
  return [...records].sort(
    (a, b) =>
      compareTextEmptyLast(a.department, b.department) ||
      compareIdAsc(a.id, b.id),
  );
}
