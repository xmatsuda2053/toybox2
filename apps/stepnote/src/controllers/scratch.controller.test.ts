import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { ScratchController } from "@/controllers/scratch.controller";
import type { ScratchRecord } from "@/db/models/scratch.model";
import type { ScratchRepository } from "@/repositories/scratch.repository";

/**
 * ScratchRepository のモッククラス
 */
class FakeScratchRepository {
  public data: ScratchRecord[];

  constructor(data: ScratchRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getAll(): Promise<ScratchRecord[]> {
    return [...this.data];
  }

  async add(item: Omit<ScratchRecord, "id">): Promise<number> {
    const id = this.data.length + 1;
    this.data.push({ id, ...item });
    return id;
  }

  async update(
    id: number,
    partial: Partial<Omit<ScratchRecord, "id">>,
  ): Promise<void> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...partial };
    }
  }

  async delete(id: number): Promise<void> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
    }
  }
}

/**
 * モックホスト作成
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
 * 【ScratchController 仕様】
 *
 * 1. 初期化・状態取得 (Read)
 *    - 1-1. 初期化時に全件取得し、state が更新されること
 *    - 1-2. host.requestUpdate が呼び出されること
 *    - 1-3. subscribe で状態変更を検知できること
 *
 * 2. メモの作成 (Create)
 *    - 2-1. createNote で新規スクラッチが追加され、state が更新されること
 *
 * 3. メモの更新 (Update)
 *    - 3-1. updateNote で対象IDのスクラッチが更新され、state が反映されること
 *
 * 4. メモの削除 (Delete)
 *    - 4-1. deleteNote で対象IDのスクラッチが削除され、state が反映されること
 */
describe("ScratchController Tests", () => {
  let fakeRepo: FakeScratchRepository;

  beforeEach(() => {
    fakeRepo = new FakeScratchRepository([
      { id: 1, value: "Scratch 1", createdAt: new Date("2026-04-01T10:00:00") },
      { id: 2, value: "Scratch 2", createdAt: new Date("2026-04-02T11:00:00") },
    ]);
  });

  describe("1. 初期化・状態取得 (Read)", () => {
    it("1-1. 初期化時に全件取得し、state が更新されること", async () => {
      const { host } = createMockHost();
      const controller = new ScratchController(
        host,
        fakeRepo as unknown as ScratchRepository,
      );

      await controller.initialized;

      expect(controller.state).toHaveLength(2);
      expect(controller.state[0].value).toBe("Scratch 1");
      expect(controller.state[1].value).toBe("Scratch 2");
    });

    it("1-2. host.requestUpdate が呼び出されること", async () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new ScratchController(
        host,
        fakeRepo as unknown as ScratchRepository,
      );

      await controller.initialized;

      expect(requestUpdateMock).toHaveBeenCalled();
    });

    it("1-3. subscribe で状態変更を検知できること", async () => {
      const { host } = createMockHost();
      const controller = new ScratchController(
        host,
        fakeRepo as unknown as ScratchRepository,
      );
      await controller.initialized;

      const listener = vi.fn();
      const unsubscribe = controller.subscribe(listener);

      await controller.createNote({ value: "Scratch 3" });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe("2. メモの作成 (Create)", () => {
    it("2-1. createNote で新規スクラッチが追加され、state が更新されること", async () => {
      const { host } = createMockHost();
      const controller = new ScratchController(
        host,
        fakeRepo as unknown as ScratchRepository,
      );
      await controller.initialized;

      const newId = await controller.createNote({ value: "New Scratch" });

      expect(newId).toBe(3);
      expect(controller.state).toHaveLength(3);
      expect(controller.state[2].value).toBe("New Scratch");
    });
  });

  describe("3. メモの更新 (Update)", () => {
    it("3-1. updateNote で対象IDのスクラッチが更新され、state が反映されること", async () => {
      const { host } = createMockHost();
      const controller = new ScratchController(
        host,
        fakeRepo as unknown as ScratchRepository,
      );
      await controller.initialized;

      await controller.updateNote(1, { value: "Updated Scratch" });

      expect(controller.state[0].value).toBe("Updated Scratch");
      expect(fakeRepo.data[0].value).toBe("Updated Scratch");
    });
  });

  describe("4. メモの削除 (Delete)", () => {
    it("4-1. deleteNote で対象IDのスクラッチが削除され、state が反映されること", async () => {
      const { host } = createMockHost();
      const controller = new ScratchController(
        host,
        fakeRepo as unknown as ScratchRepository,
      );
      await controller.initialized;

      await controller.deleteNote(1);

      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(2);
      expect(fakeRepo.data).toHaveLength(1);
    });
  });
});
