import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, signOut as signOutRequest } from "./auth.functions";
import type { User } from "./local-types";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

let guestUserRequest: Promise<User | null> | undefined;

function getGuestUser(getUser: () => Promise<User | null>): Promise<User | null> {
  if (!guestUserRequest) {
    const request = getUser();
    guestUserRequest = request;
    void request.then(
      () => {
        if (guestUserRequest === request) guestUserRequest = undefined;
      },
      () => {
        if (guestUserRequest === request) guestUserRequest = undefined;
      },
    );
  }
  return guestUserRequest;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getUser = useServerFn(getCurrentUser);
  const requestSignOut = useServerFn(signOutRequest);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await getGuestUser(getUser);
      setUser(currentUser);
      setError(null);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Could not load your guest profile.";
      setError(message);
      throw reason;
    } finally {
      setLoading(false);
    }
  }, [getUser]);

  const signOut = useCallback(async () => {
    await requestSignOut();
    guestUserRequest = undefined;
    setUser(null);
  }, [requestSignOut]);

  useEffect(() => {
    let active = true;
    getGuestUser(getUser)
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          setError(null);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load the local account session.", error);
        if (active) {
          setError(error instanceof Error ? error.message : "Could not load your guest profile.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getUser]);

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
