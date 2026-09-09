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
  private data: QuickAccessRecord = {
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

describe("QuickAccessController (TDD)", () => {
  let fakeRepository: FakeQuickAccessRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: QuickAccessController;

  /**
   * テストごとに初期化
   */
  beforeEach(async () => {
    fakeRepository = new FakeQuickAccessRepository();
    mockHost = createMockHost();
    controller = new QuickAccessController(
      mockHost.host,
      fakeRepository as any,
    );
    await controller.initialized;
  });

  describe("1. 初期化と読み込み", () => {
    it("初期化時に Repository から状態を取得し、全フラグが初期状態であること", async () => {
      expect(controller.state).toEqual({
        id: QUICK_ACCESS_STATIC_ID,
        ...DEFAULT_QUICK_ACCESS,
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. 単独・分類・ステータスフィルターのトグル操作", () => {
    it("ブックマークのトグル操作を網羅的に検証する", async () => {
      await controller.toggleBookmarkSelected();
      expect(controller.state.isBookmarkSelected).toBe(true);

      await controller.toggleBookmarkSelected();
      expect(controller.state.isBookmarkSelected).toBe(false);
    });

    it("未分類のトグル操作を網羅的に検証する", async () => {
      await controller.toggleUncategorizedSelected();
      expect(controller.state.isUncategorizedSelected).toBe(true);

      await controller.toggleUncategorizedSelected();
      expect(controller.state.isUncategorizedSelected).toBe(false);
    });

    it("完了のトグル操作を網羅的に検証する", async () => {
      await controller.toggleDoneSelected();
      expect(controller.state.isDoneSelected).toBe(false);

      await controller.toggleDoneSelected();
      expect(controller.state.isDoneSelected).toBe(true);
    });

    it("対応中のトグル操作を網羅的に検証する", async () => {
      await controller.toggleProgressSelected();
      expect(controller.state.isProgressSelected).toBe(false);

      await controller.toggleProgressSelected();
      expect(controller.state.isProgressSelected).toBe(true);
    });

    it("未着手のトグル操作を網羅的に検証する", async () => {
      await controller.togglePendingSelected();
      expect(controller.state.isPendingSelected).toBe(false);

      await controller.togglePendingSelected();
      expect(controller.state.isPendingSelected).toBe(true);
    });
  });

  describe("3. 期限フィルターの排他トグル操作（業務仕様検証）", () => {
    it("全false の状態から 期限切れのtoggle操作を実行し、期限切れのみtrueとなることを検証する", async () => {
      await controller.toggleOverdueSelected();
      expect(controller.state.isOverdueSelected).toBe(true);
      expect(controller.state.isAsapSelected).toBe(false);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });

    it("全false の状態から 当日のtoggle操作を実行し、当日のみtrueとなることを検証する", async () => {
      await controller.toggleAsapSelected();
      expect(controller.state.isAsapSelected).toBe(true);
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });

    it("全false の状態から 間近のtoggle操作を実行し、間近のみtrueとなることを検証する", async () => {
      await controller.toggleUpcomingSelected();
      expect(controller.state.isUpcomingSelected).toBe(true);
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isAsapSelected).toBe(false);
    });

    it("期限切れがtrueの状態で、当日をtoggleすると、期限切れがfalseになり当日のみtrueとなることを検証する", async () => {
      controller.state.isOverdueSelected = true;
      await controller.toggleAsapSelected();
      expect(controller.state.isOverdueSelected).toBe(false);
      expect(controller.state.isAsapSelected).toBe(true);
      expect(controller.state.isUpcomingSelected).toBe(false);
    });
  });
});
