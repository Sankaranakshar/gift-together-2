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
