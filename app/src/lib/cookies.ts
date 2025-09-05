export const getCookie = (param: string): string | null => {
  const cookieName = `${param}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const splitCookies = decodedCookie.split(';');

  for (let i = 0; i < splitCookies.length; i++) {
    let cookie = splitCookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }

  return null;
};

export const setCookie = (param: string, value?: string) => {
  const now = new Date();
  now.setTime(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  document.cookie = `${param}=${value}; expires=${now.toUTCString()}; path=/`;
};
