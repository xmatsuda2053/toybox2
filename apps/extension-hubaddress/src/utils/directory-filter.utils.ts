import type {
  OrganizationRecord,
  OrganizationSortMode,
  StaffRecord,
  StaffSortMode,
} from "../models/directory.model";

/**
 * 事前正規化済み検索インデックス要素
 */
export interface IndexedSearchItem<T> {
  readonly record: T;
  readonly haystack: string;
}

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

function buildStaffHaystack(staff: StaffRecord): string {
  return normalizeSearchText(
    [
      staff.staffId,
      formatStaffIdFiveDigits(staff.staffId),
      staff.name,
      staff.furigana ?? "",
      staff.department,
      staff.title,
      ...staff.emails,
    ].join(" "),
  );
}

function buildOrganizationHaystack(org: OrganizationRecord): string {
  return normalizeSearchText(
    [
      org.department,
      org.extra,
      org.location,
      org.title,
      org.extensionNumber,
      org.phoneNumber,
      org.faxNumber,
      org.notes,
    ].join(" "),
  );
}

/**
 * 職員レコード配列から事前正規化済み検索インデックスを構築する
 */
export function buildStaffSearchIndex(
  records: readonly StaffRecord[],
): IndexedSearchItem<StaffRecord>[] {
  return records.map((record) => ({
    record,
    haystack: buildStaffHaystack(record),
  }));
}

/**
 * 組織レコード配列から事前正規化済み検索インデックスを構築する
 */
export function buildOrganizationSearchIndex(
  records: readonly OrganizationRecord[],
): IndexedSearchItem<OrganizationRecord>[] {
  return records.map((record) => ({
    record,
    haystack: buildOrganizationHaystack(record),
  }));
}

function filterIndexedRecords<T>(
  indexed: readonly IndexedSearchItem<T>[],
  query: string,
): T[] {
  const tokens = splitSearchTokens(query);
  if (tokens.length === 0) {
    return indexed.map((item) => item.record);
  }

  const results: T[] = [];
  for (const item of indexed) {
    if (tokens.every((token) => item.haystack.includes(token))) {
      results.push(item.record);
    }
  }
  return results;
}

/**
 * 事前正規化インデックスを用いて職員レコードをフリーワード AND 検索で絞り込む
 */
export function filterIndexedStaff(
  indexed: readonly IndexedSearchItem<StaffRecord>[],
  query: string,
): StaffRecord[] {
  return filterIndexedRecords(indexed, query);
}

/**
 * 事前正規化インデックスを用いて組織レコードをフリーワード AND 検索で絞り込む
 */
export function filterIndexedOrganizations(
  indexed: readonly IndexedSearchItem<OrganizationRecord>[],
  query: string,
): OrganizationRecord[] {
  return filterIndexedRecords(indexed, query);
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

  return records.filter((staff) => {
    const haystack = buildStaffHaystack(staff);
    return tokens.every((token) => haystack.includes(token));
  });
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

  return records.filter((org) => {
    const haystack = buildOrganizationHaystack(org);
    return tokens.every((token) => haystack.includes(token));
  });
}

const JA_COLLATOR = new Intl.Collator("ja", { numeric: true });

function compareNormalizedTextEmptyLast(left: string, right: string): number {
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

interface StaffSortEntry {
  readonly record: StaffRecord;
  readonly department: string;
  readonly furiganaKey: string;
  readonly nameSortKey: string;
  readonly name: string;
  readonly staffId: string;
  readonly id: number | undefined;
}

function buildStaffSortEntry(record: StaffRecord): StaffSortEntry {
  const trimmedFurigana = (record.furigana ?? "").trim();
  const trimmedName = record.name.trim();
  const furiganaKey = normalizeSearchText(trimmedFurigana);
  const nameSortKey =
    trimmedFurigana.length > 0 ? furiganaKey : normalizeSearchText(trimmedName);

  return {
    record,
    department: record.department.trim(),
    furiganaKey,
    nameSortKey,
    name: trimmedName,
    staffId: record.staffId.trim(),
    id: record.id,
  };
}

function compareStaffEntryByDepartment(
  a: StaffSortEntry,
  b: StaffSortEntry,
): number {
  return (
    compareNormalizedTextEmptyLast(a.department, b.department) ||
    compareNormalizedTextEmptyLast(a.furiganaKey, b.furiganaKey) ||
    compareNormalizedTextEmptyLast(a.name, b.name) ||
    compareIdAsc(a.id, b.id)
  );
}

function compareStaffEntryByName(a: StaffSortEntry, b: StaffSortEntry): number {
  return (
    compareNormalizedTextEmptyLast(a.nameSortKey, b.nameSortKey) ||
    compareNormalizedTextEmptyLast(a.name, b.name) ||
    compareNormalizedTextEmptyLast(a.department, b.department) ||
    compareIdAsc(a.id, b.id)
  );
}

function compareStaffEntryByStaffId(
  a: StaffSortEntry,
  b: StaffSortEntry,
): number {
  return (
    compareNormalizedTextEmptyLast(a.staffId, b.staffId) ||
    compareNormalizedTextEmptyLast(a.name, b.name) ||
    compareIdAsc(a.id, b.id)
  );
}

const STAFF_SORT_COMPARATORS: Record<
  StaffSortMode,
  (a: StaffSortEntry, b: StaffSortEntry) => number
> = {
  department: compareStaffEntryByDepartment,
  name: compareStaffEntryByName,
  staffId: compareStaffEntryByStaffId,
};

/**
 * 職員レコードを指定されたソート順（昇順）でソートする
 */
export function sortStaff(
  records: StaffRecord[],
  sortMode: StaffSortMode = "department",
): StaffRecord[] {
  const comparator = STAFF_SORT_COMPARATORS[sortMode];
  const entries = records.map(buildStaffSortEntry);
  entries.sort(comparator);
  return entries.map((entry) => entry.record);
}

interface OrganizationSortEntry {
  readonly record: OrganizationRecord;
  readonly department: string;
  readonly location: string;
  readonly extra: string;
  readonly id: number | undefined;
}

function buildOrganizationSortEntry(
  record: OrganizationRecord,
): OrganizationSortEntry {
  return {
    record,
    department: record.department.trim(),
    location: record.location.trim(),
    extra: record.extra.trim(),
    id: record.id,
  };
}

function compareOrganizationEntryByRegistered(
  a: OrganizationSortEntry,
  b: OrganizationSortEntry,
): number {
  return (
    compareIdAsc(a.id, b.id) ||
    compareNormalizedTextEmptyLast(a.department, b.department)
  );
}

function compareOrganizationEntryByDepartment(
  a: OrganizationSortEntry,
  b: OrganizationSortEntry,
): number {
  return (
    compareNormalizedTextEmptyLast(a.department, b.department) ||
    compareIdAsc(a.id, b.id)
  );
}

function compareOrganizationEntryByLocation(
  a: OrganizationSortEntry,
  b: OrganizationSortEntry,
): number {
  return (
    compareNormalizedTextEmptyLast(a.location, b.location) ||
    compareNormalizedTextEmptyLast(a.extra, b.extra) ||
    compareNormalizedTextEmptyLast(a.department, b.department) ||
    compareIdAsc(a.id, b.id)
  );
}

const ORGANIZATION_SORT_COMPARATORS: Record<
  OrganizationSortMode,
  (a: OrganizationSortEntry, b: OrganizationSortEntry) => number
> = {
  registered: compareOrganizationEntryByRegistered,
  department: compareOrganizationEntryByDepartment,
  location: compareOrganizationEntryByLocation,
};

/**
 * 組織レコードを指定されたソート順（昇順、デフォルトは登録順）でソートする
 */
export function sortOrganizations(
  records: OrganizationRecord[],
  sortMode: OrganizationSortMode = "registered",
): OrganizationRecord[] {
  const comparator = ORGANIZATION_SORT_COMPARATORS[sortMode];
  const entries = records.map(buildOrganizationSortEntry);
  entries.sort(comparator);
  return entries.map((entry) => entry.record);
}
