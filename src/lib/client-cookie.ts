const ONE_YEAR = 60 * 60 * 24 * 365;

/** Saves a cookie from the browser, kept for a year. Browser only. */
export function setClientCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}
