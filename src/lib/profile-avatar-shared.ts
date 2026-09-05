export const PROFILE_AVATAR_API_PATH = "/api/account/avatar";
export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function isCustomAvatarUrl(image: string | null | undefined): boolean {
  return Boolean(image?.startsWith(PROFILE_AVATAR_API_PATH));
}

export function profileAvatarUrl(cacheBust?: Date | number | null): string {
  const v =
    cacheBust != null ? new Date(cacheBust).getTime() : Date.now();
  return `${PROFILE_AVATAR_API_PATH}?v=${v}`;
}
