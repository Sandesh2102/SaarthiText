import { createContext, useContext, useEffect, useState } from "react";
import { authApi, metaApi } from "../api/auth";
import { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState({ languages: [], llm_configured: false, llm_provider: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const m = await metaApi.get();
        setMeta(m);
      } catch {
        /* backend may be offline; handled in UI */
      }
      if (tokenStore.get()) {
        try {
          const u = await authApi.me();
          setUser(u);
        } catch {
          tokenStore.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (payload) => {
    const u = await authApi.login(payload);
    setUser(u);
    return u;
  };
  const signup = async (payload) => {
    const u = await authApi.signup(payload);
    setUser(u);
    return u;
  };
  const logout = () => {
    authApi.logout();
    setUser(null);
  };
  const refreshUser = async () => {
    const u = await authApi.me();
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, meta, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
