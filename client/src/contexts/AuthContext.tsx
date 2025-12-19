import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  premium: boolean;
  price?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, username?: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Detectar ambiente automaticamente
function getApiBase(): string {
  const env = (import.meta as any)?.env || {};
  if (env.VITE_API_URL) return env.VITE_API_URL as string;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (hostname.includes('localhost')) return 'http://localhost:3000';
  if (hostname.includes('pokio.online')) return 'https://poker.pokio.online';
  return 'https://pokerwizard-api.onrender.com';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Começa true enquanto verifica token
  const [error, setError] = useState<string | null>(null);

  const API_BASE = getApiBase();

  // Load token/user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pokerwizard_token');
    const storedUser = localStorage.getItem('pokerwizard_user');
    
    if (stored) {
      setToken(stored);
      // Carregar usuário do localStorage imediatamente
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (_) {
          localStorage.removeItem('pokerwizard_user');
        }
      }
      // Validar token no servidor (em background)
      fetchUserInfo(stored).finally(() => setLoading(false));
    } else {
      // Sem token, não está logado
      setLoading(false);
    }
  }, []);

  async function fetchUserInfo(authToken: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) {
        // Se der erro 401, token inválido - fazer logout
        if (res.status === 401) {
          console.log('Token inválido, fazendo logout');
          localStorage.removeItem('pokerwizard_token');
          localStorage.removeItem('pokerwizard_user');
          setToken(null);
          setUser(null);
        }
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        try { localStorage.setItem('pokerwizard_user', JSON.stringify(data.user)); } catch (e) {}
      }
    } catch (err) {
      // Em caso de erro de rede, manter o usuário logado com os dados do localStorage
      console.log('Erro ao validar token (rede?), mantendo sessão local:', err);
    }
  }

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Login failed');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      try { localStorage.setItem('pokerwizard_token', data.token); } catch (e) {}
      try { localStorage.setItem('pokerwizard_user', JSON.stringify(data.user)); } catch (e) {}
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, name: string, password: string, username?: string) {
    const PRICE = 5.90;
    setLoading(true);
    setError(null);
    try {
      // Coletar fingerprint do dispositivo
      const { getDeviceFingerprint } = await import('../utils/deviceFingerprint');
      const deviceInfo = getDeviceFingerprint();

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name,
          username: username || undefined, // Envia username se fornecido
          password, 
          price: PRICE,
          deviceInfo // Envia fingerprint do dispositivo
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      try { localStorage.setItem('pokerwizard_token', data.token); } catch (e) {}
      try { localStorage.setItem('pokerwizard_user', JSON.stringify(data.user)); } catch (e) {}
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pokerwizard_token');
    localStorage.removeItem('pokerwizard_user');
  }

  async function refreshUser() {
    if (token) {
      await fetchUserInfo(token);
    }
  }

  // Login com token (usado no callback do Google OAuth)
  async function loginWithToken(authToken: string) {
    setLoading(true);
    setError(null);
    try {
      // Salvar token
      setToken(authToken);
      localStorage.setItem('pokerwizard_token', authToken);
      
      // Buscar dados do usuário
      await fetchUserInfo(authToken);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithToken, logout, refreshUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
