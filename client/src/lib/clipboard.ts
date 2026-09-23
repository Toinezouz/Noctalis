/**
 * Copies text to the clipboard. Returns whether it worked.
 *
 * The modern API only exists on secure pages (https or localhost). When the
 * game is opened over plain http on a local network, the old
 * `execCommand('copy')` still does the job.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back below.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const done = document.execCommand('copy');
    area.remove();
    return done;
  } catch {
    return false;
  }
}

/**
 * True on phones and tablets that offer the system share sheet. On
 * desktops, copying the link is what people expect, even where the share
 * API exists.
 */
export function canShareNatively(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}
