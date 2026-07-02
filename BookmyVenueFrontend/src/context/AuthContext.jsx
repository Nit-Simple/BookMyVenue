import { createContext, useContext, useState, useEffect, useRef } from "react";
import { refresh as refreshTokens, decodeToken } from "../api/auth";
import { setAuthToken } from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // decoded JWT claims: { sub, role, exp, ... }
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  useEffect(() => {
    refreshTokens()
      .then((data) => applySession(data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));

    return () => clearTimeout(refreshTimer.current);
  }, []);

  function     applySession(data) {
    setAccessToken(data.access_token);
    setAuthToken(data.access_token); // <-- makes axiosClient attach it to future requests
    setUser(decodeToken(data.access_token));

    clearTimeout(refreshTimer.current);
    const refreshInMs = Math.max((data.expires_in - 60) * 1000, 5000);
    refreshTimer.current = setTimeout(() => {
      refreshTokens().then(applySession).catch(clearSession);
    }, refreshInMs);
  }

  function clearSession() {
    setUser(null);
    setAccessToken(null);
    setAuthToken(null); // <-- stop attaching a stale/invalid token
    clearTimeout(refreshTimer.current);
  }

  function signIn(data) {
    applySession(data);
  }

  function signOut() {
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}