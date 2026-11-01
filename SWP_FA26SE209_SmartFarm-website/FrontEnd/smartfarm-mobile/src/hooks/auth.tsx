import { createContext, useContext, useState, type ReactNode } from "react";

type User = { name: string; email: string };
type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  signUp: (name: string, email: string, password: string) => boolean;
  updateUser: (name: string, email: string) => void;
  requestReset: (email: string) => boolean;
  resetPassword: (password: string) => boolean;
  changePassword: (current: string, next: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState([{ name: "Minh Anh", email: "user@smartfarm.vn", password: "User123!" }]);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  function signIn(email: string, password: string) {
    const account = accounts.find((item) => item.email === email.trim().toLowerCase() && item.password === password);
    if (!account) return false;
    setUser({ name: account.name, email: account.email });
    return true;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp: (name, email, password) => {
          if (!name.trim() || !email.includes("@") || password.length < 6)
            return false;
          const normalized = email.trim().toLowerCase();
          if (accounts.some((item) => item.email === normalized)) return false;
          setAccounts((items) => [...items, { name: name.trim(), email: normalized, password }]);
          return true;
        },
        requestReset: (email) => { const normalized = email.trim().toLowerCase(); if (!accounts.some((item) => item.email === normalized)) return false; setResetEmail(normalized); return true; },
        resetPassword: (password) => { if (!resetEmail || password.length < 6) return false; setAccounts((items) => items.map((item) => item.email === resetEmail ? { ...item, password } : item)); setResetEmail(null); return true; },
        changePassword: (current, next) => { if (!user || next.length < 6 || !accounts.some((item) => item.email === user.email && item.password === current)) return false; setAccounts((items) => items.map((item) => item.email === user.email ? { ...item, password: next } : item)); return true; },
        updateUser: (name, email) => { if (!user) return; const normalized = email.trim().toLowerCase(); setAccounts((items) => items.map((item) => item.email === user.email ? { ...item, name, email: normalized } : item)); setUser({ name, email: normalized }); },
        signOut: () => setUser(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
