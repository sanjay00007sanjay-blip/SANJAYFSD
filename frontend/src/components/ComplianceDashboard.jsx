import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  PhoneCall,
  Send,
  MessageSquare,
  FileText,
  BadgeCheck,
  ExternalLink,
  Filter,
} from 'lucide-react';

export default function ComplianceDashboard({ onNavigateToReports }) {
  const { alerts, setAlerts } = useSocket();
  const { user } = useAuth();

  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, TRIGGERED, ACKNOWLEDGED, RESOLVED
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const handleResolveAlert = async (e) => {
    e.preventDefault();
    if (!selectedAlertForResolve) return;

    setResolving(true);
    try {
      const res = await api.resolveAlert(selectedAlertForResolve._id, {
        resolutionNotes,
        actorName: user?.name || 'Elena Rostova',
      });
      if (res.data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a._id === selectedAlertForResolve._id ? res.data.alert : a))
        );
        setSelectedAlertForResolve(null);
        setResolutionNotes('');
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setResolving(false);
    }
  };

  const triggeredCount = alerts.filter((a) => a.status === 'TRIGGERED').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-wrap items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white scada-font">
              ENVIRONMENTAL COMPLIANCE & DISCHARGE AUDIT
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Officer: {user?.name} (Lead Environmental Compliance Officer) • Permit: NPDES-CA-009412
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToReports}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <FileText className="w-4 h-4" />
            GENERATE OFFICIAL AUDIT REPORT
          </button>
        </div>
      </div>

      {/* KPI Compliance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-mono text-zinc-400 block mb-1">TOTAL RECORDED BREACHES</span>
          <span className="text-3xl font-mono font-bold text-white">{alerts.length}</span>
          <span className="text-[11px] font-mono text-zinc-500 block mt-2">All time cumulative</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-mono text-rose-400 block mb-1">CRITICAL PERMIT VIOLATIONS</span>
          <span className="text-3xl font-mono font-bold text-rose-400">{criticalCount}</span>
          <span className="text-[11px] font-mono text-rose-400/80 block mt-2">Requires EPA notice</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-mono text-amber-400 block mb-1">PENDING OPERATOR ACTION</span>
          <span className="text-3xl font-mono font-bold text-amber-400">{triggeredCount + acknowledgedCount}</span>
          <span className="text-[11px] font-mono text-zinc-500 block mt-2">Unresolved incidents</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-mono text-emerald-400 block mb-1">RESOLVED & AUDITED</span>
          <span className="text-3xl font-mono font-bold text-emerald-400">{resolvedCount}</span>
          <span className="text-[11px] font-mono text-emerald-400/80 block mt-2">Signed off with notes</span>
        </div>
      </div>

      {/* Environmental Compliance Envelope Specifications */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <h3 className="text-sm font-bold text-white scada-font mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-cyan-400" />
          EPA REGULATORY DISCHARGE ENVELOPE (TITLE 40 CFR PART 136)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
            <span className="text-zinc-400 block">Effluent pH Limit:</span>
            <span className="text-emerald-400 font-bold text-sm">6.50 – 8.50 pH</span>
            <span className="text-[10px] text-zinc-500 block mt-1">CWA Section 301 Standard</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
            <span className="text-zinc-400 block">Turbidity Discharge Cap:</span>
            <span className="text-emerald-400 font-bold text-sm">&le; 50.0 NTU</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Optimal clarity &lt; 10 NTU</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
            <span className="text-zinc-400 block">Biochemical Oxygen Demand:</span>
            <span className="text-emerald-400 font-bold text-sm">&le; 30.0 mg/L (BOD5)</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Secondary Treatment Reg.</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
            <span className="text-zinc-400 block">Emergency Alert Dispatch:</span>
            <span className="text-cyan-400 font-bold text-sm">Twilio SMS Fallback</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Dispatches within 5 seconds</span>
          </div>
        </div>
      </div>

      {/* Compliance Breaches Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-zinc-800 gap-3">
          <div>
            <h3 className="text-base font-bold text-white scada-font">
              COMPLIANCE BREACH LOG & RESOLUTION WORKFLOW
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Environmental violations flagged by AI telemetry engine and external Twilio dispatch status
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {['ALL', 'TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  filterStatus === status ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">PARAMETER</th>
                <th className="p-3">MEASURED / LIMIT</th>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">TWILIO NOTIFICATION</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No compliance breaches found matching status filter "{filterStatus}".
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-zinc-800/40 transition">
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">{alert.parameter}</td>
                    <td className="p-3">
                      <span className="text-rose-400 font-bold">{alert.measuredValue}</span>
                      <span className="text-zinc-500"> (Limit: {alert.regulatoryLimit})</span>
                    </td>
                    <td className="p-3 text-zinc-400">
                      {new Date(alert.triggeredAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      {alert.twilioNotification?.sent ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                          <PhoneCall className="w-3 h-3" />
                          SMS Dispatched ({alert.twilioNotification.mode})
                        </span>
                      ) : (
                        <span className="text-zinc-500">Not Dispatched</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.status === 'RESOLVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : alert.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800 led-pulse'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {alert.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => setSelectedAlertForResolve(alert)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold transition shadow-sm"
                        >
                          RESOLVE & SIGN OFF
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500">
                          Resolved by {alert.resolvedBy}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Sign-Off Modal */}
      {selectedAlertForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white scada-font">
                  OFFICIAL COMPLIANCE RESOLUTION SIGN-OFF
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertForResolve(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
              <div>
                <span className="text-zinc-500">Incident Parameter:</span>{' '}
                <span className="text-white font-bold">{selectedAlertForResolve.parameter}</span>
              </div>
              <div>
                <span className="text-zinc-500">Recorded Deviation:</span>{' '}
                <span className="text-rose-400 font-bold">{selectedAlertForResolve.measuredValue}</span>{' '}
                <span className="text-zinc-400">(Limit: {selectedAlertForResolve.regulatoryLimit})</span>
              </div>
              <div>
                <span className="text-zinc-500">Triggered At:</span>{' '}
                <span className="text-zinc-300">{new Date(selectedAlertForResolve.triggeredAt).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleResolveAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-300 font-bold mb-1.5">
                  Remediation & Corrective Actions Taken (Mandatory Audit Note):
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g., Neutralization loop engaged, caustic feed increased to 12.5 L/hr, pH restabilized to 7.18. Field sensors re-calibrated against EPA 150.1 buffer standard."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-zinc-600"
                />
              </div>

              <div className="text-[11px] font-mono text-zinc-500 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                Signing as: <strong className="text-zinc-300">{user?.name}</strong> (Environmental Compliance Lead, Cert #9142-CA).
                This action is permanently appended to the regulatory audit log.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForResolve(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !resolutionNotes.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold transition disabled:opacity-50"
                >
                  {resolving ? 'Certifying...' : 'COMMIT RESOLUTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
