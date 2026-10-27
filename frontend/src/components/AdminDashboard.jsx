import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Settings,
  Server,
  Database,
  Cpu,
  Radio,
  Users,
  Shield,
  History,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Clock,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const [systemHealth, setSystemHealth] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable limits for FAC-001
  const [facilityForm, setFacilityForm] = useState({
    name: 'Bay Industrial Treatment Complex',
    phMin: 6.5,
    phMax: 8.5,
    turbidityMax: 50.0,
    chemicalDosingMax: 200.0,
    bodMax: 30.0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Health
      const healthRes = await api.getHealth();
      setSystemHealth(healthRes.data);

      // 2. Facilities
      const facRes = await api.getFacilities();
      if (facRes.data.facilities && facRes.data.facilities.length > 0) {
        setFacilities(facRes.data.facilities);
        const fac001 = facRes.data.facilities.find((f) => f.code === 'FAC-001') || facRes.data.facilities[0];
        if (fac001) {
          setFacilityForm({
            name: fac001.name,
            phMin: fac001.dischargeLimitProfile?.phMin ?? 6.5,
            phMax: fac001.dischargeLimitProfile?.phMax ?? 8.5,
            turbidityMax: fac001.dischargeLimitProfile?.turbidityMax ?? 50.0,
            chemicalDosingMax: fac001.dischargeLimitProfile?.chemicalDosingMax ?? 200.0,
            bodMax: fac001.dischargeLimitProfile?.bodMax ?? 30.0,
          });
        }
      }

      // 3. Users
      try {
        const usersRes = await api.getAllUsers();
        setUsersList(usersRes.data.users || []);
      } catch (e) {
        setUsersList([
          { name: 'Marcus Vance', email: 'operator@ecoflow.internal', role: 'operator', facilityCode: 'FAC-001' },
          { name: 'Elena Rostova', email: 'compliance@ecoflow.internal', role: 'compliance_officer', facilityCode: 'FAC-001' },
          { name: 'Dr. Sarah Chen', email: 'admin@ecoflow.internal', role: 'admin', facilityCode: 'FAC-001' },
        ]);
      }

      // 4. Audit Logs
      const auditRes = await api.getAuditLogs({ limit: 40 });
      setAuditLogs(auditRes.data.logs || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateLimits = async (e) => {
    e.preventDefault();
    try {
      await api.updateFacility('FAC-001', {
        dischargeLimitProfile: {
          phMin: Number(facilityForm.phMin),
          phMax: Number(facilityForm.phMax),
          turbidityMax: Number(facilityForm.turbidityMax),
          chemicalDosingMax: Number(facilityForm.chemicalDosingMax),
          bodMax: Number(facilityForm.bodMax),
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchData();
    } catch (err) {
      console.error('Failed to update facility limits', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white scada-font">
              SYSTEM CONFIGURATION & HEALTH DIAGNOSTICS
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Administrator: {user?.name} (Systems Engineering Admin) • Microservice Architecture Monitor
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold border border-zinc-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          REFRESH DIAGNOSTICS
        </button>
      </div>

      {/* Microservice Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Express Backend */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white">EXPRESS BACKEND</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>
          <div className="text-xl font-mono font-bold text-white">ONLINE (:5000)</div>
          <div className="text-[11px] font-mono text-zinc-400">
            Uptime: {systemHealth ? `${systemHealth.uptimeSeconds}s` : 'Active'} • REST API
          </div>
        </div>

        {/* WebSocket Telemetry */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white">SOCKET.IO STREAM</span>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {isConnected ? 'LIVE BIDIRECTIONAL' : 'DISCONNECTED'}
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            Transmitting 2.0s DJ ticks • Subscribed
          </div>
        </div>

        {/* Python AI Microservice */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold text-white">PYTHON AI SERVICE</span>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                systemHealth?.aiMicroservice?.online
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
              }`}
            />
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {systemHealth?.aiMicroservice?.online ? 'FASTAPI OPERATIONAL' : 'NODE FAILSAFE ACTIVE'}
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            {systemHealth?.aiMicroservice?.online
              ? 'Model: EPA-CleanWaterAct v1.4'
              : 'Zero-downtime resilient calculation mode'}
          </div>
        </div>

        {/* Database Layer */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-white">DATABASE LAYER</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {systemHealth?.database?.connected ? 'MONGODB CLUSTER' : 'RESILIENT PERSIST'}
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            {systemHealth?.database?.connected
              ? 'Mongoose Schemas Connected'
              : 'Auto In-Memory Store Active'}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Facility Discharge Calibration & User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facility Limits Configuration Form */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white scada-font">
                DISCHARGE PERMIT LIMITS (FAC-001)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">NPDES-CA-009412</span>
          </div>

          <form onSubmit={handleUpdateLimits} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">pH Minimum Floor</label>
                <input
                  type="number"
                  step="0.1"
                  value={facilityForm.phMin}
                  onChange={(e) => setFacilityForm({ ...facilityForm, phMin: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">pH Maximum Ceiling</label>
                <input
                  type="number"
                  step="0.1"
                  value={facilityForm.phMax}
                  onChange={(e) => setFacilityForm({ ...facilityForm, phMax: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Max Turbidity (NTU)</label>
                <input
                  type="number"
                  step="1"
                  value={facilityForm.turbidityMax}
                  onChange={(e) => setFacilityForm({ ...facilityForm, turbidityMax: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Max Dosing (mg/L)</label>
                <input
                  type="number"
                  step="5"
                  value={facilityForm.chemicalDosingMax}
                  onChange={(e) => setFacilityForm({ ...facilityForm, chemicalDosingMax: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Max BOD (mg/L)</label>
                <input
                  type="number"
                  step="1"
                  value={facilityForm.bodMax}
                  onChange={(e) => setFacilityForm({ ...facilityForm, bodMax: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-zinc-500">
                AI evaluation thresholds will automatically synchronize.
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {saveSuccess ? 'CALIBRATION SAVED!' : 'APPLY DISCHARGE PROFILE'}
              </button>
            </div>
          </form>
        </div>

        {/* User Roles & Access Management */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white scada-font">
                ROLE-BASED AUTHORIZATION USERS
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">{usersList.length} Active Accounts</span>
          </div>

          <div className="space-y-3">
            {usersList.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono"
              >
                <div>
                  <div className="font-bold text-white">{u.name}</div>
                  <div className="text-zinc-400 text-[11px]">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                        : u.role === 'compliance_officer'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    }`}
                  >
                    {u.role.toUpperCase()}
                  </span>
                  <span className="text-zinc-500 text-[10px]">FAC-001</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regulatory Audit Trail Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white scada-font">
              SYSTEM & REGULATORY AUDIT TRAIL LOG
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">Tamper-Evident Event Stream</span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto pr-1">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950 text-zinc-400 sticky top-0 border-b border-zinc-800">
              <tr>
                <th className="p-2.5">TIMESTAMP</th>
                <th className="p-2.5">ACTION</th>
                <th className="p-2.5">ACTOR</th>
                <th className="p-2.5">ROLE</th>
                <th className="p-2.5">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-zinc-800/40">
                  <td className="p-2.5 text-zinc-400">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="p-2.5 font-bold text-cyan-400">{log.action}</td>
                  <td className="p-2.5 text-white">{log.actor?.name || 'System'}</td>
                  <td className="p-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {log.actor?.role || 'system'}
                    </span>
                  </td>
                  <td className="p-2.5 text-zinc-400 truncate max-w-xs">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
