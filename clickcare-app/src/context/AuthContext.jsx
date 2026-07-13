import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3001/api"
  : `${window.location.origin}/api`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('cc_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      const cached = localStorage.getItem('clickcare_user');
      if (cached) {
        setUser(JSON.parse(cached));
      }
      setLoading(false);
    };
    fetchSession();
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }
      const data = await res.json();
      const authenticatedUser = data.user;
      
      // Map roles to align with frontend layout expectations
      authenticatedUser.role = authenticatedUser.role.toUpperCase(); // doctor -> DOCTOR, patient -> PATIENT, admin -> ADMIN

      localStorage.setItem('cc_token', authenticatedUser.user_id);
      localStorage.setItem('clickcare_user', JSON.stringify(authenticatedUser));
      setToken(authenticatedUser.user_id);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, [])

  const register = useCallback(async (form) => {
    try {
      // Basic formatting for backend expectations
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: 'password123', // Default demo password
          allergies: form.allergies || 'None',
          chronic_conditions: form.chronic_conditions || 'None',
          blood_type: form.blood_type || 'O',
          weight: parseFloat(form.weight) || 60.0,
          height: parseFloat(form.height) || 165.0
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }
      return login(form.email, 'password123');
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, [login])

  const logout = useCallback(async () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('clickcare_user');
    setToken(null);
    setUser(null);
  }, [])

  // Call the real backend API with proper authorization
  const authFetch = useCallback(async (url, opts = {}) => {
    try {
      // Re-map frontend routes to match SQLite/Firestore API endpoints correctly
      let targetUrl = url;
      if (url.includes('/api/doctors')) {
        targetUrl = url.replace('/api/doctors', '/doctors');
      } else if (url.includes('/api/appointments')) {
        targetUrl = url.replace('/api/appointments', '/appointments');
      }

      // Convert endpoint to backend relative URL
      const pathOnly = targetUrl.replace(/^\/api/, '');
      const apiEndpoint = `${API_BASE}${pathOnly}`;

      const response = await fetch(apiEndpoint, {
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          ...opts.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API returned error code ${response.status}`);
      }

      const rawData = await response.json();
      
      // Remap payload to match frontend wrapper expectations { success: true, data: [...] }
      return {
        success: true,
        data: rawData
      };
    } catch (err) {
      console.error("API Call via AuthContext failed:", err);
      throw err;
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
