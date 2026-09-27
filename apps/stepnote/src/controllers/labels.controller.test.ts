import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { LabelsController } from "./labels.controller.js";
import type { LabelRecord } from "@/db/models/navigation.model";

/**
 * RepositoryのMock（排他制御仕様）
 */
class FakeLabelsRepository {
  public data: LabelRecord[];
  constructor(data: LabelRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getAll(): Promise<LabelRecord[]> {
    return [...this.data];
  }

  async add(label: Omit<LabelRecord, "id">): Promise<number> {
    const id = this.data.length + 1;
    this.data.push({ id, ...label });
    return id;
  }

  async update(
    id: number,
    partial: Partial<Omit<LabelRecord, "id">>,
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

  async toggleLabel(id: number): Promise<void> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Label with id ${id} not found`);
    }
    const nextSelected = !this.data[index].isSelected;
    this.data.forEach((item) => {
      item.isSelected = false;
    });
    if (nextSelected) {
      this.data[index].isSelected = true;
    }
  }

  async clearAllSelected(): Promise<void> {
    this.data.forEach((item) => {
      item.isSelected = false;
    });
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
 * 【LabelsController 仕様】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. 初期化時に Repository から全ラベル一覧を取得して state に保持し、host.requestUpdate() が呼び出されること
 *    - [x] 1-2. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 2. CRUD 操作とUI再描画 (Label Management)
 *    - [x] 2-1. createLabel 実行時に新規ラベルが追加され、新しく採番された ID が返ること
 *    - [x] 2-2. createLabel 実行後に state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-3. updateLabel 実行時に対象ラベルが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-4. deleteLabel 実行時に対象ラベルが削除され、state が更新されて requestUpdate() が呼ばれること
 *
 * 3. 選択状態の操作と排他制御 (Selection Operations & Exclusivity)
 *    - [x] 3-1. toggleLabel 実行時に対象ラベルが排他的に選択され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 3-2. 既に選択中のラベルを再度 toggleLabel した際、選択解除されて未選択状態になること
 *    - [x] 3-3. clearAllSelected 実行時に全ラベルの選択状態が解除され、state が更新されて requestUpdate() が呼ばれること
 *
 * 4. 選択中ラベルの集計・判定ゲッター (Selected Labels Helpers)
 *    - [x] 4-1. ラベルが1つも選択されていない場合、selectedLabelIds は空配列 [] を返すこと
 *    - [x] 4-2. ラベルが1つも選択されていない場合、selectedLabelId は undefined を返すこと
 *    - [x] 4-3. ラベルが1つも選択されていない場合、hasSelectedLabels は false を返すこと
 *    - [x] 4-4. ラベルが選択されている場合、selectedLabelIds は単一のラベルID配列 [id] を返すこと
 *    - [x] 4-5. ラベルが選択されている場合、selectedLabelId は選択中のラベルIDを返すこと
 *    - [x] 4-6. ラベルが選択されている場合、hasSelectedLabels は true を返すこと
 *    - [x] 4-7. toggleLabel や clearAllSelected で選択状態が変わった際、ゲッターの戻り値も排他的に連動すること
 *
 * 5. 状態購読（subscribe）の検証
 *    - [x] 5-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること
 */
describe("LabelsController (TDD)", () => {
  let fakeRepository: FakeLabelsRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: LabelsController;

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    const init: LabelRecord[] = [
      { id: 1, name: "重要", description: "説明1", isSelected: false },
      { id: 2, name: "プライベート", description: "説明2", isSelected: true },
    ];

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLabelsRepository(init);
      controller = new LabelsController(mockHost.host, fakeRepository as any);
      await controller.initialized;
    });

    it("1-1. 初期化時に Repository から全ラベル一覧を取得して state に保持し、host.requestUpdate() が呼び出されること", async () => {
      expect(controller.state).toEqual(init);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること", async () => {
      fakeRepository.data.push({
        id: 3,
        name: "後から追加",
        description: "説明3",
        isSelected: false,
      });

      mockHost.requestUpdateMock.mockClear();
      await controller.refresh();

      expect(controller.state).toHaveLength(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. CRUD 操作とUI再描画 (Label Management)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLabelsRepository();
      controller = new LabelsController(mockHost.host, fakeRepository as any);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. createLabel 実行時に新規ラベルが追加され、新しく採番された ID が返ること", async () => {
      const newLabel: Omit<LabelRecord, "id" | "isSelected"> = {
        name: "新規",
        description: "説明",
      };

      const newId = await controller.createLabel(newLabel);
      expect(newId).toBe(1);
      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({ id: 1, ...newLabel, isSelected: false });
    });

    it("2-2. createLabel 実行後に state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createLabel({
        name: "新規",
        description: "説明",
      });

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. updateLabel 実行時に対象ラベルが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createLabel({
        name: "検証用",
        description: "説明",
      });
      mockHost.requestUpdateMock.mockClear();

      await controller.updateLabel(1, { name: "更新" });
      expect(controller.state.length).toBe(1);
      expect(controller.state[0].name).toBe("更新");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-4. deleteLabel 実行時に対象ラベルが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createLabel({
        name: "検証用",
        description: "説明",
      });
      mockHost.requestUpdateMock.mockClear();

      await controller.deleteLabel(1);
      expect(controller.state.length).toBe(0);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("3. 選択状態の操作と排他制御 (Selection Operations & Exclusivity)", () => {
    const init: LabelRecord[] = [
      { id: 1, name: "ラベル1", description: "説明1", isSelected: false },
      { id: 2, name: "ラベル2", description: "説明2", isSelected: true },
    ];

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLabelsRepository(init);
      controller = new LabelsController(mockHost.host, fakeRepository as any);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("3-1. toggleLabel 実行時に対象ラベルが排他的に選択され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.toggleLabel(1);
      expect(controller.state[0].isSelected).toBe(true);
      expect(controller.state[1].isSelected).toBe(false);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("3-2. 既に選択中のラベルを再度 toggleLabel した際、選択解除されて未選択状態になること", async () => {
      // 初期状態で id: 2 は選択中
      expect(controller.state[1].isSelected).toBe(true);

      await controller.toggleLabel(2);
      expect(controller.state[0].isSelected).toBe(false);
      expect(controller.state[1].isSelected).toBe(false);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("3-3. clearAllSelected 実行時に全ラベルの選択状態が解除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.clearAllSelected();
      expect(controller.state.every((label) => !label.isSelected)).toBe(true);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("4. 選択中ラベルの集計・判定ゲッター (Selected Labels Helpers)", () => {
    describe("ラベルが1つも選択されていない場合（全タスク表示モード）", () => {
      beforeEach(async () => {
        mockHost = createMockHost();
        fakeRepository = new FakeLabelsRepository([
          { id: 1, name: "ラベル1", description: "説明1", isSelected: false },
          { id: 2, name: "ラベル2", description: "説明2", isSelected: false },
        ]);
        controller = new LabelsController(mockHost.host, fakeRepository as any);
        await controller.initialized;
      });

      it("4-1. selectedLabelIds は空配列 [] を返すこと", () => {
        expect(controller.selectedLabelIds).toEqual([]);
      });

      it("4-2. selectedLabelId は undefined を返すこと", () => {
        expect(controller.selectedLabelId).toBeUndefined();
      });

      it("4-3. hasSelectedLabels は false を返すこと", () => {
        expect(controller.hasSelectedLabels).toBe(false);
      });
    });

    describe("ラベルが選択されている場合", () => {
      beforeEach(async () => {
        mockHost = createMockHost();
        fakeRepository = new FakeLabelsRepository([
          { id: 1, name: "ラベル1", description: "説明1", isSelected: true },
          { id: 2, name: "ラベル2", description: "説明2", isSelected: false },
        ]);
        controller = new LabelsController(mockHost.host, fakeRepository as any);
        await controller.initialized;
      });

      it("4-4. selectedLabelIds は単一のラベルID配列 [id] を返すこと", () => {
        expect(controller.selectedLabelIds).toEqual([1]);
      });

      it("4-5. selectedLabelId は選択中のラベルIDを返すこと", () => {
        expect(controller.selectedLabelId).toBe(1);
      });

      it("4-6. hasSelectedLabels は true を返すこと", () => {
        expect(controller.hasSelectedLabels).toBe(true);
      });

      it("4-7. toggleLabel や clearAllSelected で選択状態が変わった際、ゲッターの戻り値も排他的に連動すること", async () => {
        expect(controller.selectedLabelIds).toEqual([1]);
        expect(controller.selectedLabelId).toBe(1);
        expect(controller.hasSelectedLabels).toBe(true);

        // ラベル2を選択 -> ラベル1は解除され、ラベル2のみ選択
        await controller.toggleLabel(2);
        expect(controller.selectedLabelIds).toEqual([2]);
        expect(controller.selectedLabelId).toBe(2);
        expect(controller.hasSelectedLabels).toBe(true);

        // ラベル2を再トグル -> 選択解除
        await controller.toggleLabel(2);
        expect(controller.selectedLabelIds).toEqual([]);
        expect(controller.selectedLabelId).toBeUndefined();
        expect(controller.hasSelectedLabels).toBe(false);

        // ラベル1を選択後に一括解除
        await controller.toggleLabel(1);
        expect(controller.selectedLabelId).toBe(1);
        await controller.clearAllSelected();
        expect(controller.selectedLabelIds).toEqual([]);
        expect(controller.selectedLabelId).toBeUndefined();
        expect(controller.hasSelectedLabels).toBe(false);
      });
    });
  });

  describe("5. 状態購読（subscribe）の検証", () => {
    it("5-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLabelsRepository([
        { id: 1, name: "ラベル1", description: "説明1", isSelected: false },
      ]);
      controller = new LabelsController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      const listenerMock = vi.fn();
      const unsubscribe = controller.subscribe(listenerMock);
      expect(typeof unsubscribe).toBe("function");

      // 状態更新（toggleLabel）でリスナーが発火すること
      await controller.toggleLabel(1);
      expect(listenerMock).toHaveBeenCalledTimes(1);

      // 解除関数を実行
      unsubscribe();

      // 解除後は状態変更があってもリスナーが発火しないこと
      await controller.toggleLabel(1);
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });
});
