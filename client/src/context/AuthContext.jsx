import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    const handleExpiredSession = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:session-expired', handleExpiredSession);

    return () => {
      window.removeEventListener('auth:session-expired', handleExpiredSession);
    };
  }, []);

  const login = (currentUser, jwtToken) => {
    setUser(currentUser);
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
