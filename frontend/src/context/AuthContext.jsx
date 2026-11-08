import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.access));

  const loadUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStore.access) loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("hama:logout", onLogout);
    return () => window.removeEventListener("hama:logout", onLogout);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login/", { username, password });
    tokenStore.set(data);
    await loadUser();
  };

  const register = async (form) => {
    await api.post("/auth/register/", form);
    await login(form.username, form.password);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
