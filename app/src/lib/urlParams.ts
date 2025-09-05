export const getURLParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export const setURLParam = (param: string, value?: string) => {
  const url = new URL(window.location.href);
  if (typeof value === 'string') {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }
  history.replaceState(null, '', url.toString());
};
