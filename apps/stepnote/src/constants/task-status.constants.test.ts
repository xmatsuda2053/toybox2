import { describe, it, expect } from "vitest";
import {
  TASK_STATUS_CODE,
  TASK_STATUS_MAP,
  TASK_STATUS_LIST,
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_TYPE_MAP,
} from "./task-status.constants.js";

/**
 * テスト仕様:
 * 1. TASK_STATUS_CODE の各定数値が想定通り定義されていること
 * 2. TASK_STATUS_MAP に全ステータスコードの定義が存在すること
 * 3. TASK_STATUS_LIST が定義順に正しく格納されていること
 * 4. TASK_STATUS_ICON_MAP に各ステータスコードに対応するアイコン名が定義されていること
 * 5. TASK_STATUS_TYPE_MAP に各ステータスコードに対応するタイプ識別子が定義されていること
 */
describe("task-status.constants", () => {
  it("TASK_STATUS_CODE が想定通りの数値を保持していること", () => {
    expect(TASK_STATUS_CODE.PENDING).toBe(0);
    expect(TASK_STATUS_CODE.PROGRESS).toBe(5);
    expect(TASK_STATUS_CODE.DONE).toBe(9);
  });

  it("TASK_STATUS_MAP にすべての状態定義が含まれること", () => {
    expect(TASK_STATUS_MAP[0].labelJa).toBe("開始待ち");
    expect(TASK_STATUS_MAP[5].labelJa).toBe("対応中");
    expect(TASK_STATUS_MAP[9].labelJa).toBe("完了");
  });

  it("TASK_STATUS_LIST がすべての定義を配列として提供すること", () => {
    expect(TASK_STATUS_LIST).toHaveLength(3);
    expect(TASK_STATUS_LIST.map((s) => s.code)).toEqual([0, 5, 9]);
  });

  it("TASK_STATUS_ICON_MAP が各ステータスに対応するアイコンを保持していること", () => {
    expect(TASK_STATUS_ICON_MAP[TASK_STATUS_CODE.PENDING]).toBe("circle-stop-solid-full");
    expect(TASK_STATUS_ICON_MAP[TASK_STATUS_CODE.PROGRESS]).toBe("circle-play-solid-full");
    expect(TASK_STATUS_ICON_MAP[TASK_STATUS_CODE.DONE]).toBe("circle-check-solid-full");
  });

  it("TASK_STATUS_TYPE_MAP が各ステータスに対応する種別文字列を保持していること", () => {
    expect(TASK_STATUS_TYPE_MAP[TASK_STATUS_CODE.PENDING]).toBe("pending");
    expect(TASK_STATUS_TYPE_MAP[TASK_STATUS_CODE.PROGRESS]).toBe("progress");
    expect(TASK_STATUS_TYPE_MAP[TASK_STATUS_CODE.DONE]).toBe("done");
  });
});
