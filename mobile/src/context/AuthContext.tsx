/**
 * context/AuthContext.tsx
 *
 * React Context that holds the logged-in user state.
 *
 * WHY CONTEXT?
 * Without context, every screen would need to read the token from
 * AsyncStorage separately. With context, any component can call
 * `useAuth()` to get the current user or log out — no prop drilling.
 *
 * FLOW:
 * 1. On app launch, AuthProvider tries to restore a saved session
 *    from AsyncStorage (so the user doesn't re-login every time).
 * 2. If found, user is set and the app goes straight to Home.
 * 3. On login (after OTP verify), the Login screen calls setUser().
 * 4. On logout, user is cleared and the token is deleted.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {AuthUser} from '../types';
import {getStoredUser, logout as apiLogout} from '../services/api';

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;       // null = not logged in
  isLoading: boolean;          // true while restoring session on launch
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore a previously saved session
  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredUser();
        if (stored) {
          setUserState(stored);
        }
      } catch {
        // If restore fails, user just sees the login screen — that's fine
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function setUser(newUser: AuthUser) {
    setUserState(newUser);
  }

  async function logout() {
    await apiLogout();          // clears AsyncStorage
    setUserState(null);         // triggers navigation to Login
  }

  return (
    <AuthContext.Provider value={{user, isLoading, setUser, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
// Use this in any component: const { user, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
