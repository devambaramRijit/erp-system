export const load = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
};

export const save = (key: string, value: any): void => {
  localStorage.setItem(key, JSON.stringify(value));
};
