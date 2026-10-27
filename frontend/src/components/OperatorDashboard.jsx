import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Droplet,
  Flame,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Check,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export default function OperatorDashboard() {
  const { latestMetric, metricsHistory, alerts, acknowledgeAlert, aiEvaluation } = useSocket();
  const { user } = useAuth();

  const [activeSeries, setActiveSeries] = useState('all'); // 'all', 'ph', 'turbidity', 'chemical'

  const currentPh = latestMetric?.ph ?? 7.2;
  const currentTurbidity = latestMetric?.turbidity ?? 4.5;
  const currentDosing = latestMetric?.chemicalDosing ?? 45.0;
  const currentFlow = latestMetric?.effluentFlow ?? 120.0;
  const currentBod = latestMetric?.bod ?? 18.5;
  const currentTemp = latestMetric?.temperature ?? 21.8;
  const isOffline = latestMetric?.isOffline ?? false;

  const wqi = latestMetric?.waterQualityIndex ?? 94.2;
  const riskScore = latestMetric?.aiRiskScore ?? 6.5;

  const activeAlerts = alerts.filter((a) => a.status === 'TRIGGERED' || a.status === 'ACKNOWLEDGED');

  // Format Recharts data
  const chartData = metricsHistory.map((m, idx) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ph: m.ph,
    turbidity: m.turbidity,
    dosing: m.chemicalDosing,
    flow: m.effluentFlow,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* pH Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentPh < 6.5 || currentPh > 8.5
              ? 'bg-rose-950/40 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
            <span>pH LEVEL</span>
            <span className="text-[10px] text-zinc-500">6.5 - 8.5</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-mono font-extrabold ${
                currentPh < 6.5 || currentPh > 8.5 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {isOffline ? '--.-' : currentPh.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] font-mono mt-2">
            {currentPh < 6.5 ? (
              <span className="text-rose-400">ACIDIC BREACH</span>
            ) : currentPh > 8.5 ? (
              <span className="text-rose-400">ALKALINE BREACH</span>
            ) : (
              <span className="text-emerald-400">OPTIMAL RANGE</span>
            )}
          </div>
        </div>

        {/* Turbidity Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentTurbidity > 50
              ? 'bg-rose-950/40 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
            <span>TURBIDITY</span>
            <span className="text-[10px] text-zinc-500">MAX 50.0</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-extrabold ${currentTurbidity > 50 ? 'text-rose-400' : 'text-white'}`}>
              {isOffline ? '--.-' : currentTurbidity.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">NTU</span>
          </div>
          <div className="text-[11px] font-mono mt-2">
            {currentTurbidity > 50 ? (
              <span className="text-rose-400">LIMIT EXCEEDED</span>
            ) : (
              <span className="text-emerald-400">CLEAR EFFLUENT</span>
            )}
          </div>
        </div>

        {/* Chemical Dosing Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentDosing > 350
              ? 'bg-rose-950/40 border-rose-500/80'
              : currentDosing > 200
              ? 'bg-amber-950/40 border-amber-500/80'
              : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
            <span>DOSING RATE</span>
            <span className="text-[10px] text-zinc-500">MAX 200</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-mono font-extrabold ${
                currentDosing > 350 ? 'text-rose-400' : currentDosing > 200 ? 'text-amber-400' : 'text-white'
              }`}
            >
              {isOffline ? '--.-' : currentDosing.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">mg/L</span>
          </div>
          <div className="text-[11px] font-mono mt-2">
            {currentDosing > 350 ? (
              <span className="text-rose-400">OVERDOSE SPIKE</span>
            ) : currentDosing > 200 ? (
              <span className="text-amber-400">ELEVATED FEED</span>
            ) : (
              <span className="text-emerald-400">STABLE FEED</span>
            )}
          </div>
        </div>

        {/* Effluent Flow Card */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
            <span>FLOW RATE</span>
            <span className="text-[10px] text-zinc-500">MAX 850</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-extrabold text-white">
              {isOffline ? '--.-' : currentFlow.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">L/s</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-2">HYDRAULIC SAFE</div>
        </div>

        {/* BOD Card */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
            <span>BOD ORGANICS</span>
            <span className="text-[10px] text-zinc-500">LIMIT 30</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-extrabold ${currentBod > 30 ? 'text-rose-400' : 'text-white'}`}>
              {isOffline ? '--.-' : currentBod.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">mg/L</span>
          </div>
          <div className="text-[11px] font-mono mt-2">
            {currentBod > 30 ? <span className="text-rose-400">EPA BREACH</span> : <span className="text-emerald-400">BIOLOGICAL SAFE</span>}
          </div>
        </div>

        {/* Water Quality Index (WQI) */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
            <span>WQI SCORE</span>
            <span className="text-[10px] text-zinc-500">INDEX</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-mono font-extrabold ${
                wqi >= 80 ? 'text-emerald-400' : wqi >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {isOffline ? '0.0' : wqi.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">/ 100</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 mt-2">
            {wqi >= 80 ? 'CERTIFIED GRADE A' : wqi >= 50 ? 'GRADE B - ADVISORY' : 'GRADE D - IMPAIRED'}
          </div>
        </div>
      </div>

      {/* Main SCADA Telemetry Live Trendline Chart */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-zinc-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white scada-font">
                REAL-TIME DISCHARGE TELEMETRY STREAM
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live WebSocket updates • EPA NPDES Compliance Envelope Tracking
            </p>
          </div>

          {/* Series Toggle Filters */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveSeries('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                activeSeries === 'all' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveSeries('ph')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                activeSeries === 'ph' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              pH ONLY
            </button>
            <button
              onClick={() => setActiveSeries('turbidity')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                activeSeries === 'turbidity' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              TURBIDITY
            </button>
            <button
              onClick={() => setActiveSeries('chemical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                activeSeries === 'chemical' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              DOSING
            </button>
          </div>
        </div>

        {/* Recharts Line Graph Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />

              {/* Reference Lines for Environmental Regulatory Caps */}
              {(activeSeries === 'all' || activeSeries === 'ph') && (
                <>
                  <ReferenceLine y={8.5} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'EPA pH Max 8.5', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine y={6.5} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'EPA pH Min 6.5', fill: '#f43f5e', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="ph"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    name="pH Level"
                    isAnimationActive={false}
                  />
                </>
              )}

              {(activeSeries === 'all' || activeSeries === 'turbidity') && (
                <>
                  <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'EPA Turbidity 50 NTU', fill: '#f59e0b', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="turbidity"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Turbidity (NTU)"
                    isAnimationActive={false}
                  />
                </>
              )}

              {(activeSeries === 'all' || activeSeries === 'chemical') && (
                <Line
                  type="monotone"
                  dataKey="dosing"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  dot={false}
                  name="Dosing (mg/L)"
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: AI Root Cause Recommendations + Active Alarms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python AI Analytics Root-Cause Advisory */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white scada-font">
                  AI COMPLIANCE & ROOT-CAUSE ADVISORY
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                FASTAPI MICROSERVICE v1.4
              </span>
            </div>

            {/* AI Status pill */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div
                className={`w-3 h-3 rounded-full ${
                  riskScore >= 60 ? 'bg-rose-500 led-pulse' : riskScore >= 25 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <div>
                <div className="text-xs font-mono font-bold text-white">
                  RISK ASSESSMENT: {riskScore >= 60 ? 'CRITICAL POLLUTION HAZARD' : riskScore >= 25 ? 'ELEVATED DISCHARGE RISK' : 'NORMAL COMPLIANCE BOUNDS'}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Calculated Risk Score: {riskScore.toFixed(1)}% • Water Quality Index: {wqi.toFixed(1)}/100
                </div>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                ENGINEERED OPERATOR REMEDIATIONS:
              </span>
              {(aiEvaluation?.remediation_recommendations || latestMetric?.remediationRecommendations || [
                'All primary environmental water parameters operating within certified regulatory bounds.',
              ]).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 border-t border-zinc-800 pt-3 flex justify-between">
            <span>EPA Discharge Permit: NPDES-CA-009412</span>
            <span>Microservice Endpoint: :8000/api/v1/evaluate</span>
          </div>
        </div>

        {/* Active SCADA Alarms Panel */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white scada-font">
                  ACTIVE REGULATORY ALARMS & BREACHES
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                {activeAlerts.length} Active
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2" />
                <span className="text-sm font-semibold text-white">No Active Compliance Alarms</span>
                <span className="text-xs text-zinc-400 font-mono mt-1">
                  Plant effluent meets all Federal & Regional clean water discharge standards.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {activeAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-950/30 border-rose-500/50'
                        : 'bg-amber-950/30 border-amber-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            alert.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">{alert.parameter}</span>
                        <span className="text-xs font-mono text-zinc-400">
                          ({alert.measuredValue} vs Limit {alert.regulatoryLimit})
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300">{alert.message}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
                        <span>{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                        {alert.twilioNotification?.sent && (
                          <span className="text-cyan-400">📲 Twilio SMS Dispatched</span>
                        )}
                        {alert.status === 'ACKNOWLEDGED' && (
                          <span className="text-amber-400">✓ Acknowledged by {alert.acknowledgedBy}</span>
                        )}
                      </div>
                    </div>

                    {alert.status === 'TRIGGERED' && (
                      <button
                        onClick={() => acknowledgeAlert(alert._id, user?.name)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold border border-zinc-700 transition flex items-center justify-center gap-1.5 flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ACKNOWLEDGE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-zinc-500 border-t border-zinc-800 pt-3 flex justify-between mt-4">
            <span>Automated Twilio SMS Trigger Active</span>
            <span className="text-zinc-400">Recipient: +1-555-019-9943</span>
          </div>
        </div>
      </div>
    </div>
  );
}
