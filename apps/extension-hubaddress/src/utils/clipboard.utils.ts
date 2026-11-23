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

/**
 * 指定文字列をクリップボードへコピーする（空文字や失敗時は安全に false を返す）
 */
export async function copyTextToClipboard(
  text: string,
  clipboard?: ClipboardLike,
): Promise<boolean> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const target = resolveClipboard(clipboard);
  if (!target) {
    return false;
  }

  try {
    await target.writeText(trimmed);
    return true;
  } catch {
    return false;
  }
}
