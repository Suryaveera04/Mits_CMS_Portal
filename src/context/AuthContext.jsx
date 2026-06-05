// src/context/AuthContext.jsx
import { useState, useEffect } from 'react';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // Ensure avatar is preserved (login.php returns it from SELECT *)
    const user = { ...userData, avatar: userData.avatar ?? null };
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    const updated = { ...user, ...userData };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const updateAvatar = (avatar) => {
    updateUser({ avatar });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}
