import { describe, it, expect, vi } from "vitest";
import { LitElement } from "lit";
import { WithDialogBase } from "./dialog-element.mixin";

/**
 * 【WithDialogBase Mixin 仕様】
 *
 * 1. 基本プロパティ仕様
 *    - 1-1. open プロパティの初期値が false であること
 *    - 1-2. dataTheme プロパティが正しく保持・設定されること
 *
 * 2. クローズ・イベント連携仕様
 *    - 2-1. closeDialog() 実行時に open が false に設定されること
 *    - 2-2. closeDialog(eventName) 実行時に指定したイベントがディスパッチされること
 */
describe("WithDialogBase Mixin (TDD)", () => {
  class TestDialogElement extends WithDialogBase(LitElement) {}

  it("1-1. open プロパティの初期値が false であること", () => {
    const element = new TestDialogElement();
    expect(element.open).toBe(false);

    element.open = true;
    expect(element.open).toBe(true);
  });

  it("1-2. dataTheme プロパティが正しく保持・設定されること", () => {
    const element = new TestDialogElement();
    expect(element.dataTheme).toBeUndefined();

    element.dataTheme = "dark";
    expect(element.dataTheme).toBe("dark");
  });

  it("2-1. closeDialog() 実行時に open が false に設定されること", () => {
    const element = new TestDialogElement();
    element.open = true;

    element.closeDialog();
    expect(element.open).toBe(false);
  });

  it("2-2. closeDialog(eventName) 実行時に指定したイベントがディスパッチされること", () => {
    const element = new TestDialogElement();
    element.open = true;

    const listener = vi.fn();
    element.addEventListener("test-dialog-close", listener);

    element.closeDialog("test-dialog-close");

    expect(element.open).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
