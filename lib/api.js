const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
