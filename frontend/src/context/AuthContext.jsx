import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const DEMO_USERS = {
  operator: {
    id: 'usr_op_01',
    name: 'Marcus Vance',
    email: 'operator@ecoflow.internal',
    role: 'operator',
    title: 'Senior Plant Operator',
    facilityCode: 'FAC-001',
    phone: '+1-555-019-2834',
  },
  compliance_officer: {
    id: 'usr_co_01',
    name: 'Elena Rostova',
    email: 'compliance@ecoflow.internal',
    role: 'compliance_officer',
    title: 'Environmental Compliance Lead',
    facilityCode: 'FAC-001',
    phone: '+1-555-019-9943',
  },
  admin: {
    id: 'usr_adm_01',
    name: 'Dr. Sarah Chen',
    email: 'admin@ecoflow.internal',
    role: 'admin',
    title: 'Systems & Environmental Admin',
    facilityCode: 'FAC-001',
    phone: '+1-555-019-1100',
  },
};

export const AuthProvider = ({ children }) => {
  // Default to operator for quick demonstration
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ecoflow_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.operator;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ecoflow_token') || 'demo-jwt-token-active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ecoflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ecoflow_user');
    }
  }, [user]);

  // Real API Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('ecoflow_token', res.data.token);
        return { success: true };
      }
    } catch (err) {
      // Fallback to demo profile matching if backend is in testing mode
      const matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setUser(matched);
        setToken('demo-jwt-token-' + matched.role);
        return { success: true };
      }
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Role Switcher (Operator, Compliance Officer, Admin)
  const switchRole = (newRole) => {
    if (DEMO_USERS[newRole]) {
      setUser(DEMO_USERS[newRole]);
      const mockToken = `demo-token-${newRole}-${Date.now()}`;
      setToken(mockToken);
      localStorage.setItem('ecoflow_token', mockToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ecoflow_user');
    localStorage.removeItem('ecoflow_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchRole,
        isAuthenticated: !!user,
        isOperator: user?.role === 'operator',
        isComplianceOfficer: user?.role === 'compliance_officer',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
