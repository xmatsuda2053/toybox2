import type { ToolDefinition } from "../models/huboffice.model";

function normalizeSearchText(text: string): string {
  return text.normalize("NFKC").toLowerCase().trim();
}

function matchesToolQuery(
  tool: ToolDefinition,
  tokens: readonly string[],
): boolean {
  if (tokens.length === 0) {
    return true;
  }

  const haystack = normalizeSearchText(
    [tool.name, tool.description, ...(tool.keywords ?? [])].join(" "),
  );
  return tokens.every((token) => haystack.includes(token));
}

/**
 * ツール一覧をクエリで絞り込み、ピン留めされたツールを上部へ固定して返す
 */
export function filterAndSortTools(
  tools: readonly ToolDefinition[],
  query: string,
  pinnedIds: readonly string[],
): ToolDefinition[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery
    ? normalizedQuery.split(/\s+/).filter(Boolean)
    : [];
  const matched = tools.filter((tool) => matchesToolQuery(tool, tokens));

  const pinnedRank = new Map<string, number>();
  pinnedIds.forEach((id, index) => {
    pinnedRank.set(id, index);
  });

  const pinned: ToolDefinition[] = [];
  const unpinned: ToolDefinition[] = [];

  for (const tool of matched) {
    if (pinnedRank.has(tool.id)) {
      pinned.push(tool);
    } else {
      unpinned.push(tool);
    }
  }

  pinned.sort(
    (a, b) => (pinnedRank.get(a.id) ?? 0) - (pinnedRank.get(b.id) ?? 0),
  );

  return [...pinned, ...unpinned];
}

/**
 * ツール ID のピン留め状態をイミュータブルに切り替える
 */
export function togglePinnedToolId(
  pinnedIds: readonly string[],
  toolId: string,
): string[] {
  if (pinnedIds.includes(toolId)) {
    return pinnedIds.filter((id) => id !== toolId);
  }
  return [...pinnedIds, toolId];
}
