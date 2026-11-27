export interface ClipboardLike {
  writeText: (text: string) => Promise<void>;
}

function resolveClipboard(injected?: ClipboardLike): ClipboardLike | undefined {
  if (injected) {
    return injected;
  }
  if (
    typeof globalThis.navigator !== "undefined" &&
    globalThis.navigator.clipboard
  ) {
    return globalThis.navigator.clipboard;
  }
  return undefined;
}

async function writeClipboardText(
  text: string,
  clipboard?: ClipboardLike,
): Promise<boolean> {
  const target = resolveClipboard(clipboard);
  if (!target) {
    return false;
  }

  try {
    await target.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 指定文字列をトリムしてクリップボードへコピーする（空文字や失敗時は安全に false を返す）
 */
export async function copyTextToClipboard(
  text: string,
  clipboard?: ClipboardLike,
): Promise<boolean> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }

  return writeClipboardText(trimmed, clipboard);
}

/**
 * 指定文字列を末尾タブ・改行を含めそのままクリップボードへコピーする（TSV / 複数行向け）
 */
export async function copyRawTextToClipboard(
  text: string,
  clipboard?: ClipboardLike,
): Promise<boolean> {
  if (text.length === 0) {
    return false;
  }

  return writeClipboardText(text, clipboard);
}
