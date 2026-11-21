import { describe, it, expect, vi } from "vitest";
import {
  selectAndShowTask,
  navigateByIdJump,
  type IdJumpCoordinatorDeps,
} from "./app-root.navigation.js";

/**
 * 【app-root.navigation 仕様】
 *
 * 1. タスク選択（selectAndShowTask）
 *    - 1-1. 指定した taskId が存在する場合、ラベル選択・タスク一覧選択・詳細表示を連携し true を返すこと
 *    - 1-2. 指定した taskId が存在しない場合、Controller を更新せず false を返すこと
 *
 * 2. ID ジャンプ調停（navigateByIdJump）
 *    - 2-1. type="scratch" かつ通常タスク画面表示中なら Journal ペインを開いて Scratch に遷移すること
 *    - 2-2. type="scratch" かつ設定モード/タスク未選択時は全画面 Scratch ペインへ切り替えて遷移すること
 *    - 2-3. type="issue" または type="note" の場合、全画面モードを解除し親タスク選択後に task-pane の遷移メソッドを呼ぶこと
 *    - 2-4. 不正な id の場合は早期リターンしリポジトリを参照しないこと
 */
function createMockDeps(
  overrides: Partial<IdJumpCoordinatorDeps> = {},
): IdJumpCoordinatorDeps {
  return {
    getTaskById: vi.fn().mockResolvedValue(undefined),
    getIssueById: vi.fn().mockResolvedValue(undefined),
    getNoteById: vi.fn().mockResolvedValue(undefined),
    getScratchById: vi.fn().mockResolvedValue(undefined),
    getLayoutState: () => ({
      isScratchMode: false,
      isSettingsMode: false,
      isJournalAreaOpen: true,
    }),
    setScratchMode: vi.fn(),
    setSettingsMode: vi.fn(),
    setJournalAreaOpen: vi.fn(),
    selectLabel: vi.fn().mockResolvedValue(undefined),
    selectTask: vi.fn().mockResolvedValue(undefined),
    setTaskId: vi.fn().mockResolvedValue(undefined),
    hasSelectedTask: () => true,
    waitForUpdate: vi.fn().mockResolvedValue(true),
    queryPane: vi.fn().mockReturnValue(null),
    ...overrides,
  };
}

describe("app-root.navigation", () => {
  it("1-1. selectAndShowTask が存在するタスクのラベル・一覧・詳細を連携更新して true を返すこと", async () => {
    const deps = createMockDeps({
      getTaskById: vi.fn().mockResolvedValue({ id: 10, labelId: 3 }),
    });

    const result = await selectAndShowTask(deps, 10);

    expect(result).toBe(true);
    expect(deps.selectLabel).toHaveBeenCalledWith(3);
    expect(deps.selectTask).toHaveBeenCalledWith(10);
    expect(deps.setTaskId).toHaveBeenCalledWith(10);
  });

  it("1-2. selectAndShowTask が存在しないタスクの場合に false を返すこと", async () => {
    const deps = createMockDeps();

    const result = await selectAndShowTask(deps, 999);

    expect(result).toBe(false);
    expect(deps.selectTask).not.toHaveBeenCalled();
  });

  it("2-1. type='scratch' かつ通常表示時は Journal ペインを開いて navigateToScratch を呼ぶこと", async () => {
    const navigateToScratch = vi.fn();
    const deps = createMockDeps({
      getScratchById: vi.fn().mockResolvedValue({ id: 5 }),
      getLayoutState: () => ({
        isScratchMode: false,
        isSettingsMode: false,
        isJournalAreaOpen: false,
      }),
      hasSelectedTask: () => true,
      queryPane: vi.fn().mockImplementation((sel) =>
        sel === "journal-pane" ? { navigateToScratch } : null,
      ),
    });

    await navigateByIdJump(deps, { type: "scratch", id: 5 });

    expect(deps.setJournalAreaOpen).toHaveBeenCalledWith(true);
    expect(deps.waitForUpdate).toHaveBeenCalled();
    expect(navigateToScratch).toHaveBeenCalledWith(5);
  });

  it("2-2. type='scratch' かつ設定モード時は全画面 Scratch ペインへ切り替えて遷移すること", async () => {
    const navigateToScratch = vi.fn();
    const deps = createMockDeps({
      getScratchById: vi.fn().mockResolvedValue({ id: 7 }),
      getLayoutState: () => ({
        isScratchMode: false,
        isSettingsMode: true,
        isJournalAreaOpen: true,
      }),
      queryPane: vi.fn().mockImplementation((sel) =>
        sel === "scratch-pane" ? { navigateToScratch } : null,
      ),
    });

    await navigateByIdJump(deps, { type: "scratch", id: 7 });

    expect(deps.setScratchMode).toHaveBeenCalledWith(true);
    expect(navigateToScratch).toHaveBeenCalledWith(7);
  });

  it("2-3. type='issue' / 'note' で全画面モードを解除し、親タスク選択後に task-pane へ遷移すること", async () => {
    const navigateToIssue = vi.fn();
    const navigateToNote = vi.fn();
    const deps = createMockDeps({
      getLayoutState: () => ({
        isScratchMode: true,
        isSettingsMode: true,
        isJournalAreaOpen: true,
      }),
      getIssueById: vi.fn().mockResolvedValue({ id: 20, taskId: 10 }),
      getNoteById: vi.fn().mockResolvedValue({ id: 30, taskId: 10 }),
      getTaskById: vi.fn().mockResolvedValue({ id: 10 }),
      queryPane: vi.fn().mockImplementation((sel) =>
        sel === "task-pane" ? { navigateToIssue, navigateToNote } : null,
      ),
    });

    await navigateByIdJump(deps, { type: "issue", id: 20 });
    expect(deps.setScratchMode).toHaveBeenCalledWith(false);
    expect(deps.setSettingsMode).toHaveBeenCalledWith(false);
    expect(deps.selectTask).toHaveBeenCalledWith(10);
    expect(navigateToIssue).toHaveBeenCalledWith(20);

    await navigateByIdJump(deps, { type: "note", id: 30 });
    expect(navigateToNote).toHaveBeenCalledWith(30);
  });

  it("2-4. 無効な ID の場合は早期リターンし、検索を行わないこと", async () => {
    const deps = createMockDeps();

    await navigateByIdJump(deps, { type: "task", id: 0 });

    expect(deps.getTaskById).not.toHaveBeenCalled();
  });

  it("2-5. viewMode='list' の場合、selectAndShowTask および id-jump で一覧詳細ビューが開きテーブル選択がクリアされること", async () => {
    const navigateToIssue = vi.fn();
    const openListTaskDetail = vi.fn();
    const clearTableSelection = vi.fn();
    const deps = createMockDeps({
      getLayoutState: () => ({
        isScratchMode: false,
        isSettingsMode: false,
        isJournalAreaOpen: true,
        viewMode: "list",
      }),
      openListTaskDetail,
      clearTableSelection,
      getIssueById: vi.fn().mockResolvedValue({ id: 30, taskId: 10 }),
      getTaskById: vi.fn().mockResolvedValue({ id: 10, labelId: 1 }),
      queryPane: vi.fn().mockImplementation((sel) =>
        sel === "task-pane" ? { navigateToIssue } : null,
      ),
    });

    await navigateByIdJump(deps, { type: "issue", id: 30 });

    expect(openListTaskDetail).toHaveBeenCalledTimes(1);
    expect(clearTableSelection).toHaveBeenCalledTimes(1);
    expect(deps.waitForUpdate).toHaveBeenCalled();
    expect(navigateToIssue).toHaveBeenCalledWith(30);
  });
});
