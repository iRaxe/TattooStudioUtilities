// Utility helpers for clipboard and sharing interactions with graceful fallbacks.
export async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Async clipboard API write failed, trying fallback.', error);
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (error) {
    console.error('Clipboard copy fallback failed.', error);
    return false;
  }
}

export async function shareLink({ title, text, url }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') {
        return 'dismissed';
      }
      console.warn('Native share failed, attempting copy fallback.', error);
    }
  }

  const copied = await copyToClipboard(url);
  return copied ? 'copied' : 'failed';
}
