export const QR_ERROR_CORRECTION_LEVEL = "M" as const;

/** QR Version 40 / Error Correction M のバイトモード上限 */
export const QR_MAX_UTF8_BYTES = 2331;

export interface QrSizePreset {
  readonly id: "s" | "m" | "l";
  readonly label: string;
  readonly size: number;
  readonly description: string;
}

export const QR_SIZE_PRESETS: readonly QrSizePreset[] = [
  { id: "s", label: "S", size: 128, description: "Web・メール向け" },
  { id: "m", label: "M", size: 256, description: "資料貼り付け標準" },
  { id: "l", label: "L", size: 512, description: "印刷・配布物向け" },
] as const;

export interface QrInputValidation {
  readonly status: "empty" | "valid" | "too-long";
  readonly byteLength: number;
  readonly errorMessage?: string;
}

export interface Canvas2DLike {
  fillStyle: string | CanvasGradient | CanvasPattern;
  imageSmoothingEnabled: boolean;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  drawImage: (
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => void;
}

/**
 * 入力テキストの UTF-8 バイト数を計測し QR 生成可否を判定する
 */
export function validateQrInput(text: string): QrInputValidation {
  if (text.trim().length === 0) {
    return { status: "empty", byteLength: 0 };
  }

  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > QR_MAX_UTF8_BYTES) {
    return {
      status: "too-long",
      byteLength,
      errorMessage: `文字数が上限（${QR_MAX_UTF8_BYTES} バイト）を超えています（現在 ${byteLength} バイト）。`,
    };
  }

  return { status: "valid", byteLength };
}

/**
 * 指定サイズ用の PNG ダウンロードファイル名を生成する
 */
export function buildQrFilename(size: number): string {
  return `qr-${size}x${size}.png`;
}

/**
 * 出力サイズに応じた読み取り用白余白（クワイエットゾーン）を算出する
 */
export function calculateQuietZonePx(outputSize: number): number {
  return Math.max(8, Math.round(outputSize * 0.08));
}

/**
 * 白背景とクワイエットゾーンを付与してエクスポート用キャンバスへ QR コードを描画する
 */
export function composeQrExportCanvas(
  ctx: Canvas2DLike,
  source: CanvasImageSource,
  outputSize: number,
): void {
  const margin = calculateQuietZonePx(outputSize);
  const innerSize = outputSize - margin * 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, margin, margin, innerSize, innerSize);
}

/**
 * ソースキャンバスから指定サイズの白背景＋余白付き PNG Blob を生成する
 */
export async function exportQrPngBlob(
  sourceCanvas: HTMLCanvasElement,
  outputSize: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D コンテキストを取得できませんでした。");
  }

  composeQrExportCanvas(ctx, sourceCanvas, outputSize);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG 画像の生成に失敗しました。"));
      }
    }, "image/png");
  });
}
