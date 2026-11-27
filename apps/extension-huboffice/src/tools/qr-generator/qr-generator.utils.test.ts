import { describe, it, expect, vi } from "vitest";
import {
  QR_ERROR_CORRECTION_LEVEL,
  QR_SIZE_PRESETS,
  QR_MAX_UTF8_BYTES,
  validateQrInput,
  buildQrFilename,
  calculateQuietZonePx,
  composeQrExportCanvas,
  type Canvas2DLike,
} from "./qr-generator.utils";

/**
 * テスト仕様: QRコード生成純粋ユーティリティ (qr-generator.utils.ts)
 *
 * - 仕様1: エラー訂正レベルが M 固定であり、サイズプリセットが S(128) / M(256) / L(512) の3種であること
 * - 仕様2: validateQrInput が空入力・有効入力・UTF-8バイト数上限超過を正しく判定すること
 * - 仕様3: buildQrFilename がサイズを含んだ PNG ファイル名を返すこと
 * - 仕様4: calculateQuietZonePx が出力サイズに応じた適切な白余白サイズを算出すること
 * - 仕様5: composeQrExportCanvas が白背景（#ffffff）を塗りつぶした上で余白付きでソース画像を描画すること
 */
describe("QR Generator Utils Tests", () => {
  it("エラー訂正レベルが M 固定で、サイズプリセットが S(128) / M(256) / L(512) であること", () => {
    expect(QR_ERROR_CORRECTION_LEVEL).toBe("M");
    expect(QR_SIZE_PRESETS.map((p) => ({ id: p.id, size: p.size }))).toEqual([
      { id: "s", size: 128 },
      { id: "m", size: 256 },
      { id: "l", size: 512 },
    ]);
  });

  it("validateQrInput が空文字・正常文字列・上限超過を正しく判定すること", () => {
    const empty = validateQrInput("   ");
    expect(empty.status).toBe("empty");
    expect(empty.byteLength).toBe(0);

    const valid = validateQrInput("https://example.local/docs\nメモ");
    expect(valid.status).toBe("valid");
    expect(valid.byteLength).toBeGreaterThan(20);

    const tooLong = validateQrInput(
      "あ".repeat(Math.ceil(QR_MAX_UTF8_BYTES / 3) + 1),
    );
    expect(tooLong.status).toBe("too-long");
    expect(tooLong.errorMessage).toBeTruthy();
  });

  it("buildQrFilename と calculateQuietZonePx が期待通りの値を返すこと", () => {
    expect(buildQrFilename(128)).toBe("qr-128x128.png");
    expect(buildQrFilename(256)).toBe("qr-256x256.png");
    expect(buildQrFilename(512)).toBe("qr-512x512.png");

    expect(calculateQuietZonePx(128)).toBeGreaterThanOrEqual(8);
    expect(calculateQuietZonePx(256)).toBeGreaterThan(
      calculateQuietZonePx(128),
    );
    expect(calculateQuietZonePx(512)).toBeGreaterThan(
      calculateQuietZonePx(256),
    );
  });

  it("composeQrExportCanvas が白背景を塗りつぶし、余白付きでソース画像を中央描画すること", () => {
    const fillRect = vi.fn();
    const drawImage = vi.fn();
    const ctx: Canvas2DLike = {
      fillStyle: "",
      imageSmoothingEnabled: true,
      fillRect,
      drawImage,
    };
    const fakeSource = {} as CanvasImageSource;

    composeQrExportCanvas(ctx, fakeSource, 256);

    const margin = calculateQuietZonePx(256);
    expect(ctx.fillStyle).toBe("#ffffff");
    expect(ctx.imageSmoothingEnabled).toBe(false);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
    expect(drawImage).toHaveBeenCalledWith(
      fakeSource,
      margin,
      margin,
      256 - margin * 2,
      256 - margin * 2,
    );
  });
});
