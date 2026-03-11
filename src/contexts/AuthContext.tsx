import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginUser, registerUser, getMe } from "@/lib/api";

interface AuthState {
  token: string | null;
  username: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem("auth_session");
    return saved ? JSON.parse(saved) : { token: null, username: null };
  });

  useEffect(() => {
    localStorage.setItem("auth_session", JSON.stringify(auth));
  }, [auth]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginUser(username, password);
    const me = await getMe(data.access_token);
    setAuth({ token: data.access_token, username: me.username });
  }, []);

  const register = useCallback(async (username: string, password: string, email: string) => {
    const data = await registerUser(username, password, email);
    setAuth({ token: data.access_token, username });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, username: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
