import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, signOut as signOutRequest } from "./auth.functions";
import type { User } from "./local-types";

type AuthState = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const getUser = useServerFn(getCurrentUser);
  const requestSignOut = useServerFn(signOutRequest);

  const refresh = useCallback(async () => {
    const currentUser = await getUser();
    setUser(currentUser);
    setLoading(false);
  }, [getUser]);

  const signOut = useCallback(async () => {
    await requestSignOut();
    setUser(null);
  }, [requestSignOut]);

  useEffect(() => {
    let active = true;
    getUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        console.error("Could not load the local account session.", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
