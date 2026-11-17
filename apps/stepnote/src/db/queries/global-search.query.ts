import type { Database } from "@/db/schema/database.schema";
import type { TaskRecord, IssueRecord } from "@/db/models/task.model.js";
import type { NoteRecord, LogRecord } from "@/db/models/journal.model.js";
import type { TagRecord } from "@/db/models/tag.model.js";
import {
  extractSnippet,
  formatContactText,
  formatSourceLabel,
  parseSearchTerms,
  type ParsedSearchTerm,
  type SearchSnippetSourceType,
} from "@/utils/global-search.utils.js";
import { isSystemLog } from "@/utils/system-log.utils.js";

/**
 * 全体検索で合致したスニペット情報
 */
export interface GlobalSearchSnippet {
  sourceType: SearchSnippetSourceType;
  sourceLabel: string;
  snippet: string;
  subItemId?: number;
}

/**
 * 全体検索のタスク単位の抽出結果
 */
export interface GlobalSearchResultItem {
  task: TaskRecord;
  labelName?: string;
  tags?: TagRecord[];
  snippets: GlobalSearchSnippet[];
}

/**
 * タスク単位でのキーワード一致判定およびスニペット蓄積用インターフェース
 */
interface TaskMatchCollector {
  matchedTerms: Set<string>;
  snippets: GlobalSearchSnippet[];
  snippetKeys: Set<string>;
}

/**
 * 全会計年度および全ステータス（完了含む）のタスクを横断検索するクエリクラス
 *
 * @export
 * @class GlobalSearchQuery
 */
export class GlobalSearchQuery {
  constructor(private readonly db: Database) {}

  /**
   * 指定した検索キーワードに部分一致するタスクおよびスニペット一覧を全年度から検索して取得する。
   * スペースで区切られた複数キーワードは AND 条件として判定する。
   *
   * @param {string} keyword 検索キーワード
   * @returns {Promise<GlobalSearchResultItem[]>} 検索結果一覧
   * @memberof GlobalSearchQuery
   */
  public async search(keyword: string): Promise<GlobalSearchResultItem[]> {
    const terms = parseSearchTerms(keyword);
    if (terms.length === 0) {
      return [];
    }

    const [tasks, issues, notes, logs, labels, tags] = await Promise.all([
      this.db.tasks.toArray(),
      this.db.issues.toArray(),
      this.db.notes.toArray(),
      this.db.logs.toArray(),
      this.db.labels.toArray(),
      this.db.tags.toArray(),
    ]);

    const labelsMap = new Map<number, string>();
    for (const l of labels) {
      if (l.id !== undefined) {
        labelsMap.set(l.id, l.name);
      }
    }
    const tagsMap = new Map<number, TagRecord>();
    for (const tag of tags) {
      if (tag.id !== undefined) {
        tagsMap.set(tag.id, tag);
      }
    }

    const matchMap = new Map<number, TaskMatchCollector>();
    const generalValues = terms.filter((t) => !t.isTagOnly).map((t) => t.value);

    this.collectTaskTagMatches(terms, tasks, tagsMap, matchMap);
    if (generalValues.length > 0) {
      this.collectTaskMatches(generalValues, tasks, matchMap);
      this.collectIssueMatches(generalValues, issues, matchMap);
      this.collectNoteMatches(generalValues, notes, matchMap);
      this.collectLogMatches(generalValues, logs, matchMap);
    }

    return this.buildResultItems(tasks, terms.length, matchMap, labelsMap, tagsMap);
  }

  /**
   * タスクに付与されたタグからキーワード一致箇所（通常・#タグ名専用）を収集する
   */
  private collectTaskTagMatches(
    terms: readonly ParsedSearchTerm[],
    tasks: readonly TaskRecord[],
    tagsMap: Map<number, TagRecord>,
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    for (const task of tasks) {
      if (task.id === undefined || !Array.isArray(task.tagIds)) continue;
      for (const tagId of task.tagIds) {
        const tag = tagsMap.get(tagId);
        if (!tag) continue;
        this.matchTagWithTerms(task.id, tag, terms, matchMap);
      }
    }
  }

  /** 単一タグに対して全検索トークンを照合しスニペットを追加する */
  private matchTagWithTerms(
    taskId: number,
    tag: TagRecord,
    terms: readonly ParsedSearchTerm[],
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    const lowerName = tag.name.toLowerCase();
    for (const term of terms) {
      if (!lowerName.includes(term.value)) continue;
      this.addMatchSnippet(
        taskId,
        term.raw,
        {
          sourceType: "task_tags",
          sourceLabel: formatSourceLabel("task_tags"),
          snippet: `#${tag.name}`,
          subItemId: tag.id,
        },
        matchMap,
      );
    }
  }

  /**
   * tasks レコード群からキーワード一致箇所を収集する
   */
  private collectTaskMatches(
    terms: readonly string[],
    tasks: readonly TaskRecord[],
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    for (const task of tasks) {
      if (task.id === undefined) continue;
      for (const term of terms) {
        this.checkAndAppendTaskField(task.id, task.name, "task_name", term, matchMap);
        this.checkAndAppendTaskField(task.id, task.description, "task_description", term, matchMap);
        this.checkAndAppendFiscalYear(task.id, task.fiscalYear, term, matchMap);
        this.checkAndAppendContacts(task.id, task.contacts, term, matchMap);
      }
    }
  }

  /**
   * タスクの関係者情報（contacts）の一致確認とスニペット追加
   */
  private checkAndAppendContacts(
    taskId: number,
    contacts: TaskRecord["contacts"] | undefined,
    term: string,
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    if (!Array.isArray(contacts)) return;
    for (const contact of contacts) {
      const contactText = formatContactText(contact);
      if (contactText === "") continue;
      this.checkAndAppendTaskField(
        taskId,
        contactText,
        "task_contacts",
        term,
        matchMap,
      );
    }
  }

  /**
   * タスクの年度（fiscalYear）の一致確認とスニペット追加
   */
  private checkAndAppendFiscalYear(
    taskId: number,
    fiscalYear: number,
    term: string,
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    const yearStr = `${fiscalYear}年度`;
    if (!yearStr.includes(term) && !String(fiscalYear).includes(term)) return;
    this.addMatchSnippet(
      taskId,
      term,
      {
        sourceType: "task_fiscal_year",
        sourceLabel: formatSourceLabel("task_fiscal_year"),
        snippet: yearStr,
      },
      matchMap,
    );
  }

  /**
   * 単一のタスクフィールドの一致確認とスニペット追加
   */
  private checkAndAppendTaskField(
    taskId: number,
    fieldValue: string,
    sourceType: SearchSnippetSourceType,
    term: string,
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    if (!fieldValue.toLowerCase().includes(term)) return;
    this.addMatchSnippet(
      taskId,
      term,
      {
        sourceType,
        sourceLabel: formatSourceLabel(sourceType),
        snippet: extractSnippet(fieldValue, term),
      },
      matchMap,
    );
  }

  /**
   * issues レコード群からキーワード一致箇所を収集する
   */
  private collectIssueMatches(
    terms: readonly string[],
    issues: readonly IssueRecord[],
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    for (const issue of issues) {
      if (issue.taskId === undefined) continue;
      for (const term of terms) {
        this.checkAndAppendIssue(issue, term, matchMap);
      }
    }
  }

  /**
   * 単一の issue レコードの一致確認とスニペット追加
   */
  private checkAndAppendIssue(
    issue: IssueRecord,
    term: string,
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    if (issue.taskId === undefined) return;
    const isTitleMatch = issue.title.toLowerCase().includes(term);
    const isValueMatch = issue.value.toLowerCase().includes(term);
    if (!isTitleMatch && !isValueMatch) return;

    const matchedText = isValueMatch ? issue.value : issue.title;
    this.addMatchSnippet(
      issue.taskId,
      term,
      {
        sourceType: "issue",
        sourceLabel: formatSourceLabel("issue", issue.title),
        snippet: extractSnippet(matchedText, term),
        subItemId: issue.id,
      },
      matchMap,
    );
  }

  /**
   * notes レコード群からキーワード一致箇所を収集する
   */
  private collectNoteMatches(
    terms: readonly string[],
    notes: readonly NoteRecord[],
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    for (const note of notes) {
      if (note.taskId === undefined) continue;
      for (const term of terms) {
        if (!note.value.toLowerCase().includes(term)) continue;
        this.addMatchSnippet(
          note.taskId,
          term,
          {
            sourceType: "note",
            sourceLabel: formatSourceLabel("note"),
            snippet: extractSnippet(note.value, term),
            subItemId: note.id,
          },
          matchMap,
        );
      }
    }
  }

  /**
   * logs レコード群からキーワード一致箇所を収集する
   */
  private collectLogMatches(
    terms: readonly string[],
    logs: readonly LogRecord[],
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    for (const log of logs) {
      if (log.taskId === undefined) continue;
      if (isSystemLog(log.value)) continue;
      for (const term of terms) {
        if (!log.value.toLowerCase().includes(term)) continue;
        this.addMatchSnippet(
          log.taskId,
          term,
          {
            sourceType: "log",
            sourceLabel: formatSourceLabel("log"),
            snippet: extractSnippet(log.value, term),
            subItemId: log.id,
          },
          matchMap,
        );
      }
    }
  }

  /**
   * スニペットマップへスニペットを追加するヘルパー
   */
  private addMatchSnippet(
    taskId: number,
    term: string,
    snippet: GlobalSearchSnippet,
    matchMap: Map<number, TaskMatchCollector>,
  ): void {
    let collector = matchMap.get(taskId);
    if (!collector) {
      collector = {
        matchedTerms: new Set<string>(),
        snippets: [],
        snippetKeys: new Set<string>(),
      };
      matchMap.set(taskId, collector);
    }

    collector.matchedTerms.add(term);
    const key = `${snippet.sourceType}:${snippet.subItemId ?? ""}:${snippet.snippet}`;
    if (!collector.snippetKeys.has(key)) {
      collector.snippetKeys.add(key);
      collector.snippets.push(snippet);
    }
  }

  /**
   * 一致したタスクとスニペット、ラベル名を統合してソート済み結果配列を生成する
   */
  private buildResultItems(
    tasks: readonly TaskRecord[],
    termsCount: number,
    matchMap: Map<number, TaskMatchCollector>,
    labelsMap: Map<number, string>,
    tagsMap: Map<number, TagRecord>,
  ): GlobalSearchResultItem[] {
    const results: GlobalSearchResultItem[] = [];

    for (const task of tasks) {
      if (task.id === undefined) continue;
      const collector = matchMap.get(task.id);
      if (!collector || collector.matchedTerms.size !== termsCount) continue;
      if (collector.snippets.length === 0) continue;

      const resolvedTags = (task.tagIds ?? [])
        .map((id) => tagsMap.get(id))
        .filter((t): t is TagRecord => Boolean(t));

      results.push({
        task,
        labelName:
          task.labelId !== undefined && task.labelId > 0
            ? labelsMap.get(task.labelId)
            : undefined,
        tags: resolvedTags,
        snippets: collector.snippets,
      });
    }

    return results.sort((a, b) => {
      if (a.task.fiscalYear !== b.task.fiscalYear) {
        return b.task.fiscalYear - a.task.fiscalYear;
      }
      return a.task.dueDate.getTime() - b.task.dueDate.getTime();
    });
  }
}
