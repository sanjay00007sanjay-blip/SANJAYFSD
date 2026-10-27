import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecoflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  getAllUsers: () => apiClient.get('/auth/users'),
  getDemoCredentials: () => apiClient.get('/auth/demo-credentials'),

  // Telemetry
  ingestTelemetry: (data) => apiClient.post('/telemetry/ingest', data),
  getTelemetryHistory: (facilityCode = 'FAC-001', limit = 50) =>
    apiClient.get(`/telemetry/history?facilityCode=${facilityCode}&limit=${limit}`),
  getLatestTelemetry: (facilityCode = 'FAC-001') =>
    apiClient.get(`/telemetry/latest?facilityCode=${facilityCode}`),
  evaluatePreview: (data) => apiClient.post('/telemetry/evaluate-preview', data),

  // Alerts
  getAlerts: (params = {}) => apiClient.get('/alerts', { params }),
  getAlertStats: () => apiClient.get('/alerts/stats'),
  acknowledgeAlert: (id, actorName) => apiClient.patch(`/alerts/${id}/acknowledge`, { actorName }),
  resolveAlert: (id, data) => apiClient.patch(`/alerts/${id}/resolve`, data),

  // Reports
  getComplianceReport: (params) => apiClient.get('/reports/compliance', { params }),

  // Facilities
  getFacilities: () => apiClient.get('/facilities'),
  getFacility: (code) => apiClient.get(`/facilities/${code}`),
  updateFacility: (code, data) => apiClient.put(`/facilities/${code}`, data),

  // Audit Logs
  getAuditLogs: (params) => apiClient.get('/audit-logs', { params }),
  createAuditLog: (data) => apiClient.post('/audit-logs', data),

  // Diagnostics
  getHealth: () => apiClient.get('/health'),
};

export { BACKEND_URL };
export default apiClient;
