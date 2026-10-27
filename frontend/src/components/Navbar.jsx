import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Activity,
  ShieldAlert,
  Settings,
  FileText,
  Sliders,
  Wifi,
  WifiOff,
  User,
  ChevronDown,
  Droplets,
  Flame,
  BarChart3,
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, showDJConsole, setShowDJConsole }) {
  const { user, switchRole } = useAuth();
  const { isConnected, activeAlertsCount } = useSocket();

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Facility Identity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white scada-font flex items-center gap-1.5">
                  ECOFLOW <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block leading-tight">
                  Water SCADA & Compliance
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-zinc-800">
              <span className="text-xs font-mono text-zinc-400">FACILITY:</span>
              <span className="text-xs font-mono font-bold text-slate-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                FAC-001 // BAY OUTFLOW
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('operator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'operator'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              OPERATOR SCADA
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition relative ${
                activeTab === 'compliance'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              COMPLIANCE
              {activeAlertsCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'reports'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              AUDIT REPORTS
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              SYSTEM ADMIN
            </button>
          </nav>

          {/* Right Controls: DJ Console Toggle, Socket Status, Role Switcher */}
          <div className="flex items-center gap-3">
            {/* DJ Console Toggle Button */}
            <button
              onClick={() => setShowDJConsole(!showDJConsole)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition shadow-sm ${
                showDJConsole
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">DJ SIMULATOR</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  showDJConsole ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-zinc-600'
                }`}
              />
            </button>

            {/* WebSocket Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  <span className="text-zinc-300">WS LIVE</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-zinc-400">POLLING</span>
                </>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
              <span className="text-[11px] font-mono text-zinc-400 pl-2 hidden md:inline">ROLE:</span>
              <select
                value={user?.role || 'operator'}
                onChange={(e) => {
                  switchRole(e.target.value);
                  if (e.target.value === 'operator') setActiveTab('operator');
                  if (e.target.value === 'compliance_officer') setActiveTab('compliance');
                  if (e.target.value === 'admin') setActiveTab('admin');
                }}
                className="bg-zinc-800 text-xs font-mono font-bold text-white rounded-lg px-2.5 py-1 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="operator">Plant Operator</option>
                <option value="compliance_officer">Compliance Officer</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
