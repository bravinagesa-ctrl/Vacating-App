import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const ACCESS = "hama_access";
const REFRESH = "hama_refresh";

export const tokenStore = {
  get access() { return localStorage.getItem(ACCESS); },
  get refresh() { return localStorage.getItem(REFRESH); },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith("/auth/login") || original?.url?.startsWith("/auth/refresh");
    if (error.response?.status === 401 && !original._retry && !isAuthCall && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_URL}/auth/refresh/`, { refresh: tokenStore.refresh }).finally(() => {
            refreshing = null;
          });
        const { data } = await refreshing;
        tokenStore.set({ access: data.access });
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        tokenStore.clear();
        window.dispatchEvent(new Event("hama:logout"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
