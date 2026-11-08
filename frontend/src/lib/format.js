export const formatKES = (n) => `KES ${new Intl.NumberFormat("en-KE").format(n)}`;

export const formatKESShort = (n) =>
  n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n);

/** Turn a Django REST Framework error response into one readable sentence. */
export function apiError(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!data) return error?.message === "Network Error" ? "Cannot reach the server. Check your connection." : fallback;
  if (typeof data === "string") return fallback;
  if (data.detail) return String(data.detail);
  const first = Object.values(data)[0];
  const message = Array.isArray(first) ? first[0] : first;
  return typeof message === "string" ? message : fallback;
}
