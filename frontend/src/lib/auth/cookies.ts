const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? "ums_csrf";

export function getCookieValue(name: string) {
  const encodedName = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(encodedName));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(encodedName.length));
}

export function getCsrfToken() {
  return getCookieValue(CSRF_COOKIE_NAME);
}
