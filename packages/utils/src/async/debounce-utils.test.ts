import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "./debounce-utils";

/**
 * - [x] 仕様 1: 呼び出された直後には実行されず、指定した wait（ms）経過後に実行されること。
 * - [x] 仕様 2: wait 時間内に連続して呼び出された場合、タイマーがリセットされ、最後の呼び出しから wait 時間後に1度だけ実行されること。
 * - [x] 仕様 3: 呼び出し時の引数が、実行される関数へ正しく渡されること。
 * - [x] 仕様 4: cancel メソッドを呼び出すことで、待機中の実行をキャンセルできること。
 */
describe("debounce-utils", () => {
  beforeEach(() => {
    // 擬似タイマーを有効化（時間を手動操作できるようにする）
    vi.useFakeTimers();
  });

  afterEach(() => {
    // テスト終了後にタイマーを元に戻す
    vi.restoreAllMocks();
  });

  it("指定した待機時間（ms）が経過するまで実行されないこと", () => {
    const callback = vi.fn(); // ① 呼び出し状況を記録するモック関数
    const debouncedFn = debounce(callback, 200);

    debouncedFn(); // 関数の呼び出し（まだ実行はされないはず）

    // ② 呼び出し直後の検証
    expect(callback).not.toHaveBeenCalled();

    // ③ 199ms 進める（まだ実行されないはず）
    vi.advanceTimersByTime(199);
    expect(callback).not.toHaveBeenCalled();

    // ④ さらに 1ms 進めて計 200ms（ここで実行されるはず）
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("待機時間内に連続呼び出しされた場合、タイマーがリセットされ最後の1回のみ実行されること", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 200);

    debouncedFn();
    vi.advanceTimersByTime(100); // 100ms 経過

    debouncedFn(); // 100ms 時点で再度呼び出し（ここでタイマーがリセットされるはず）
    vi.advanceTimersByTime(100); // さらに 100ms 経過（合計 200ms）

    // 最初の呼び出しから計200ms経っているが、リセットされたためまだ未実行であるべき
    expect(callback).not.toHaveBeenCalled();

    // 再呼び出しから計200ms経つタイミング（さらに100ms後）
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1); // ここで初めて1回だけ実行される
  });

  it("最後の呼び出し時の引数が実行対象の関数へ渡されること", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 200);

    debouncedFn("first"); // 1回目の呼び出し
    debouncedFn("second"); // 2回目の呼び出し（上書き）

    vi.advanceTimersByTime(200);

    // 実際に実行された callback に 'second' が渡されたか検証
    expect(callback).toHaveBeenCalledWith("second");
  });

  it("cancel メソッドを呼び出すと、待機中の実行がキャンセルされること", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 200);

    debouncedFn();
    vi.advanceTimersByTime(100); // 100ms 待機中に…

    debouncedFn.cancel(); // キャンセルを実行

    vi.advanceTimersByTime(200); // 十分な時間が経過しても…
    expect(callback).not.toHaveBeenCalled(); // 実行されていないこと
  });
});
