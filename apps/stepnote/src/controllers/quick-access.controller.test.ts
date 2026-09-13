import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { QuickAccessController } from "./quick-access.controller.js";
import { QuickAccessRecord } from "@/db/models";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants.js";

/**
 * RepositoryのMock
 */
class FakeQuickAccessRepository {
  public data: QuickAccessRecord = {
    id: QUICK_ACCESS_STATIC_ID,
    ...DEFAULT_QUICK_ACCESS,
  };

  async getQuickAccess(): Promise<QuickAccessRecord> {
    return { ...this.data };
  }

  async updateQuickAccess(
    partial: Partial<QuickAccessRecord>,
  ): Promise<QuickAccessRecord> {
    this.data = { ...this.data, ...partial };
    return { ...this.data };
  }
}

/**
 * モック作成
 *
 * @return {*}
 */
const createMockHost = () => {
  const requestUpdateMock = vi.fn();
  const host: ReactiveControllerHost = {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: requestUpdateMock,
    updateComplete: Promise.resolve(true),
  };
  return { host, requestUpdateMock };
};

/**
 * 【QuickAccessController 仕様】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. 初期化時に Repository から状態を取得し、全フラグが初期状態であること、および host.requestUpdate() が呼ばれること
 *    - [x] 1-2. refresh 実行時に Repository から最新状態を再取得して state が更新され、host.requestUpdate() が呼ばれること
 *
 * 2. 単独・分類・ステータスフィルターのトグル操作 (Independent Toggle Operations)
 *    - [x] 2-1. toggleBookmarkSelected 実行時にブックマークの選択状態が反転すること
 *    - [x] 2-2. toggleUncategorizedSelected 実行時に未分類の選択状態が反転すること
 *    - [x] 2-3. toggleDoneSelected 実行時に完了の選択状態が反転すること
 *    - [x] 2-4. toggleProgressSelected 実行時に対応中の選択状態が反転すること
 *    - [x] 2-5. togglePendingSelected 実行時に未着手の選択状態が反転すること
 *
 * 3. 期限フィルターの排他トグル操作 (Exclusive DueDate Filter Operations)
 *    - [x] 3-1. toggleOverdueSelected 実行時、期限切れのみが true となり他の期限フィルターは false となること
 *    - [x] 3-2. toggleAsapSelected 実行時、当日のみが true となり他の期限フィルターは false となること
 *    - [x] 3-3. toggleUpcomingSelected 実行時、間近のみが true となり他の期限フィルターは false となること
 *    - [x] 3-4. いずれかの期限フィルターが true の状態で別の期限フィルターを toggle した場合、旧フィルターが解除されて新フィルターのみが true となること
 *    - [x] 3-5. 選択中の期限フィルターを再度 toggle した場合、そのフィルターも false となり全て false となること
 */
describe("QuickAccessController (TDD)", () => {
  let fakeRepository: FakeQuickAccessRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: QuickAccessController;

  beforeEach(async () => {
    fakeRepository = new FakeQuickAccessRepository();
    mockHost = createMockHost();
    controller = new QuickAccessController(
      mockHost.host,
      fakeRepository as any,
    );
    await controller.initialized;
  });

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    it("1-1. 初期化時に Repository から状態を取得し、全フラグが初期状態であること、および host.requestUpdate() が呼ばれること", async () => {
      expect(controller.state).toEqual({
        id: QUICK_ACCESS_STATIC_ID,
        ...DEFAULT_QUICK_ACCESS,
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. refresh 実行時に Repository から最新状態を再取得して state が更新され、host.requestUpdate() が呼ばれること", async () => {
      await fakeRepository.updateQuickAccess({ isBookmarkSelected: true });
      mockHost.requestUpdateMock.mockClear();

      await controller.refresh();

      expect(controller.state.isBookmarkSelected).toBe(true);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. 単独・分類・ステータスフィルターのトグル操作 (Independent Toggle Operations)", () => {
    it("2-1. toggleBookmarkSelected 実行時にブックマークの選択状態が反転すること", async () => {
      await controller.toggleBookmarkSelected();
      expect(controller.state.isBookmarkSelected).toBe(true);

      await controller.toggleBookmarkSelected();
      expect(controller.state.isBookmarkSelected).toBe(false);
    });

    it("2-2. toggleUncategorizedSelected 実行時に未分類の選択状態が反転すること", async () => {
      await controller.toggleUncategorizedSelected();
      expect(controller.state.isUncategorizedSelected).toBe(true);

      await controller.toggleUncategorizedSelected();
      expect(controller.state.isUncategorizedSelected).toBe(false);
    });

    it("2-3. toggleDoneSelected 実行時に完了の選択状態が反転すること", async () => {
      await controller.toggleDoneSelected();
      expect(controller.state.isDoneSelected).toBe(false);

      await controller.toggleDoneSelected();
      expect(controller.state.isDoneSelected).toBe(true);
    });

    it("2-4. toggleProgressSelected 実行時に対応中の選択状態が反転すること", async () => {
      await controller.toggleProgressSelected();
      expect(controller.state.isProgressSelected).toBe(false);

      await controller.toggleProgressSelected();
      expect(controller.state.isProgressSelected).toBe(true);
    });

    it("2-5. togglePendingSelected 実行時に未着手の選択状態が反転すること", async () => {
      await controller.togglePendingSelected();
      expect(controller.state.isPendingSelected).toBe(false);

      await controller.togglePendingSelected();
      expect(controller.state.isPendingSelected).toBe(true);
    });
  });

  describe("3. 期限フィルターの排他トグル操作 (Exclusive DueDate Filter Operations)", () => {
    it("3-1. toggleOverdueSelected 実行時、期限切れのみが true となり他の期限フィルターは false となること", async () => {
      await controller.toggleOverdueSelected();
      expect(controller.state.isOverdueSelected).toBe(true);
      expect(controller.state.isAsapSelected).toBe(false);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });

    it("3-2. toggleAsapSelected 実行時、当日のみが true となり他の期限フィルターは false となること", async () => {
      await controller.toggleAsapSelected();
      expect(controller.state.isAsapSelected).toBe(true);
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });

    it("3-3. toggleUpcomingSelected 実行時、間近のみが true となり他の期限フィルターは false となること", async () => {
      await controller.toggleUpcomingSelected();
      expect(controller.state.isUpcomingSelected).toBe(true);
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isAsapSelected).toBe(false);
    });

    it("3-4. いずれかの期限フィルターが true の状態で別の期限フィルターを toggle した場合、旧フィルターが解除されて新フィルターのみが true となること", async () => {
      await controller.toggleOverdueSelected();
      expect(controller.state.isOverdueSelected).toBe(true);

      await controller.toggleAsapSelected();
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isAsapSelected).toBe(true);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });

    it("3-5. 選択中の期限フィルターを再度 toggle した場合、そのフィルターも false となり全て false となること", async () => {
      await controller.toggleOverdueSelected();
      expect(controller.state.isOverdueSelected).toBe(true);

      await controller.toggleOverdueSelected();
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isAsapSelected).toBe(false);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });
  });
});
