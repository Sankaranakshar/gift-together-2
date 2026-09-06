// Unambiguous characters for 6-character human-friendly join codes
// Excludes: 0, O, 1, I, 5, S
const SHORT_CODE_CHARS = '2346789ABCDEFGHJKLMNPQRTUVWXYZ';

export function generateShortJoinCode(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SHORT_CODE_CHARS.length);
    result += SHORT_CODE_CHARS[randomIndex];
  }
  return result;
}

// Random non-sequential group ID generator
// e.g. 7xKp92LmQ
const GROUP_ID_CHARS = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateRandomGroupId(length = 9): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * GROUP_ID_CHARS.length);
    result += GROUP_ID_CHARS[randomIndex];
  }
  return result;
}

export function generateRecoveryToken(): string {
  return 'gt_rec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function hashRecoveryToken(token: string): Promise<string> {
  const clean = token.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}
