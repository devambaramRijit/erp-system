import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import type { SessionUser } from "@/../../packages/shared/schema/user";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await api.get<SessionUser>("/auth/me");
        if (mounted) setUser(me);
      } catch (_) {
        // not logged in
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ user: SessionUser }>("/auth/login", { email, password });
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post<unknown>("/auth/logout");
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (!loading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [user, loading, location, setLocation]);
}
