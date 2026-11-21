import type { IdJumpDetail } from "@shared/components";
import type { AppViewMode } from "@/types";

type ScratchPaneHandle = HTMLElement & {
  navigateToScratch?: (id: number) => Promise<void> | void;
};

type TaskPaneHandle = HTMLElement & {
  navigateToIssue?: (id: number) => void;
  navigateToNote?: (id: number) => void;
};

/** ID ジャンプ遷移調停に必要な依存インターフェース */
export interface IdJumpCoordinatorDeps {
  getTaskById: (
    taskId: number,
  ) => Promise<{ id?: number; labelId?: number } | undefined>;
  getIssueById: (
    issueId: number,
  ) => Promise<{ id?: number; taskId: number } | undefined>;
  getNoteById: (
    noteId: number,
  ) => Promise<{ id?: number; taskId: number } | undefined>;
  getScratchById: (scratchId: number) => Promise<{ id?: number } | undefined>;
  getLayoutState: () => {
    isScratchMode: boolean;
    isSettingsMode: boolean;
    isJournalAreaOpen: boolean;
    viewMode?: AppViewMode;
  };
  setScratchMode: (isOpen: boolean) => void;
  setSettingsMode: (isOpen: boolean) => void;
  setJournalAreaOpen: (isOpen: boolean) => void;
  openListTaskDetail?: () => void;
  clearTableSelection?: () => void;
  selectLabel: (labelId: number) => Promise<void>;
  selectTask: (taskId: number) => Promise<void>;
  setTaskId: (taskId: number) => Promise<void>;
  hasSelectedTask: () => boolean;
  waitForUpdate: () => Promise<unknown>;
  queryPane: <T>(selector: string) => T | null;
}

/**
 * 指定したタスクを選択し、ラベル・タスク一覧・タスク詳細を同期更新する。
 */
export async function selectAndShowTask(
  deps: IdJumpCoordinatorDeps,
  taskId: number,
): Promise<boolean> {
  const task = await deps.getTaskById(taskId);
  if (!task) return false;

  if (task.labelId !== undefined) {
    try {
      await deps.selectLabel(task.labelId);
    } catch {
      // ラベルが存在しない場合はタスク選択を継続
    }
  }
  await deps.selectTask(taskId);
  await deps.setTaskId(taskId);
  if (deps.getLayoutState().viewMode === "list") {
    deps.clearTableSelection?.();
    deps.openListTaskDetail?.();
    await deps.waitForUpdate();
  }
  return true;
}

async function navigateToJournalScratch(
  deps: IdJumpCoordinatorDeps,
  scratchId: number,
): Promise<void> {
  if (!deps.getLayoutState().isJournalAreaOpen) {
    deps.setJournalAreaOpen(true);
  }
  await deps.waitForUpdate();

  const journalPane = deps.queryPane<ScratchPaneHandle>("journal-pane");
  await journalPane?.navigateToScratch?.(scratchId);
}

async function navigateToScratchPane(
  deps: IdJumpCoordinatorDeps,
  scratchId: number,
): Promise<void> {
  if (!deps.getLayoutState().isScratchMode) {
    deps.setScratchMode(true);
  }
  await deps.waitForUpdate();

  const scratchPane = deps.queryPane<ScratchPaneHandle>("scratch-pane");
  await scratchPane?.navigateToScratch?.(scratchId);
}

async function handleScratchJump(
  deps: IdJumpCoordinatorDeps,
  scratchId: number,
): Promise<void> {
  const scratch = await deps.getScratchById(scratchId);
  if (!scratch) return;

  const { isScratchMode, isSettingsMode } = deps.getLayoutState();
  const canUseJournalPane =
    !isScratchMode && !isSettingsMode && deps.hasSelectedTask();

  if (canUseJournalPane) {
    await navigateToJournalScratch(deps, scratchId);
    return;
  }

  await navigateToScratchPane(deps, scratchId);
}

async function handleTaskChildJump(
  deps: IdJumpCoordinatorDeps,
  target: "issue" | "note",
  recordId: number,
): Promise<void> {
  const record =
    target === "issue"
      ? await deps.getIssueById(recordId)
      : await deps.getNoteById(recordId);
  if (!record) return;

  await selectAndShowTask(deps, record.taskId);

  const taskPane = deps.queryPane<TaskPaneHandle>("task-pane");
  if (target === "issue") {
    taskPane?.navigateToIssue?.(recordId);
  } else {
    taskPane?.navigateToNote?.(recordId);
  }
}

/**
 * Markdown ID ジャンプ種別に応じて画面モード切替および対象ペイン遷移を実行する。
 */
export async function navigateByIdJump(
  deps: IdJumpCoordinatorDeps,
  detail: IdJumpDetail,
): Promise<void> {
  const { type, id } = detail;
  if (!id || typeof id !== "number") return;

  if (type === "scratch") {
    await handleScratchJump(deps, id);
    return;
  }

  const { isScratchMode, isSettingsMode } = deps.getLayoutState();
  if (isScratchMode) {
    deps.setScratchMode(false);
  }
  if (isSettingsMode) {
    deps.setSettingsMode(false);
  }

  if (type === "task") {
    await selectAndShowTask(deps, id);
  } else if (type === "issue" || type === "note") {
    await handleTaskChildJump(deps, type, id);
  }
}
