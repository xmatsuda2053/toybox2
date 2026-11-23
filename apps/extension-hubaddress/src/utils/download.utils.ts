/**
 * ブラウザ上で指定データをファイルとしてダウンロード保存する
 */
export function triggerFileDownload(
  filename: string,
  data: Uint8Array | string,
  mimeType: string,
): void {
  const blobPart: BlobPart =
    typeof data === "string" ? data : new Uint8Array(data);
  const blob = new Blob([blobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
