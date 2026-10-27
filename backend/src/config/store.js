/**
 * In-memory fallback and fast-cache store.
 * Ensures the application is 100% resilient and immediately interactive
 * even before an external MongoDB instance is provisioned.
 */

class DataStore {
  constructor() {
    this.facilities = [];
    this.metrics = [];
    this.alerts = [];
    this.auditLogs = [];
    this.users = [];
  }

  initSeedData(seeds) {
    if (seeds.facilities) this.facilities = [...seeds.facilities];
    if (seeds.users) this.users = [...seeds.users];
    if (seeds.metrics) this.metrics = [...seeds.metrics];
    if (seeds.alerts) this.alerts = [...seeds.alerts];
    if (seeds.auditLogs) this.auditLogs = [...seeds.auditLogs];
  }

  addMetric(metric) {
    const item = { ...metric, _id: metric._id || 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) };
    this.metrics.push(item);
    if (this.metrics.length > 500) {
      this.metrics.shift(); // Keep latest 500 records in memory
    }
    return item;
  }

  getRecentMetrics(facilityCode = 'FAC-001', limit = 50) {
    const filtered = this.metrics.filter((m) => !facilityCode || m.facilityCode === facilityCode);
    return filtered.slice(-limit);
  }

  getLatestMetric(facilityCode = 'FAC-001') {
    const filtered = this.metrics.filter((m) => !facilityCode || m.facilityCode === facilityCode);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  addAlert(alert) {
    const item = {
      ...alert,
      _id: alert._id || 'alt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      triggeredAt: alert.triggeredAt || new Date(),
      status: alert.status || 'TRIGGERED',
    };
    this.alerts.unshift(item); // Newest first
    return item;
  }

  getAlerts(filter = {}) {
    return this.alerts.filter((a) => {
      if (filter.status && a.status !== filter.status) return false;
      if (filter.facilityCode && a.facilityCode !== filter.facilityCode) return false;
      return true;
    });
  }

  updateAlert(id, updates) {
    const idx = this.alerts.findIndex((a) => a._id === id || a.id === id);
    if (idx !== -1) {
      this.alerts[idx] = { ...this.alerts[idx], ...updates, updatedAt: new Date() };
      return this.alerts[idx];
    }
    return null;
  }

  addAuditLog(log) {
    const item = {
      ...log,
      _id: log._id || 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: log.timestamp || new Date(),
    };
    this.auditLogs.unshift(item);
    if (this.auditLogs.length > 1000) this.auditLogs.pop();
    return item;
  }

  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }
}

const memoryStore = new DataStore();
module.exports = memoryStore;
