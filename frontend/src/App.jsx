import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import DJConsole from './components/DJConsole';
import OperatorDashboard from './components/OperatorDashboard';
import ComplianceDashboard from './components/ComplianceDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuditReports from './components/AuditReports';
import AlertBanner from './components/AlertBanner';
import { Droplets, Sliders, Shield, Terminal } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('operator');
  const [showDJConsole, setShowDJConsole] = useState(true);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showDJConsole={showDJConsole}
        setShowDJConsole={setShowDJConsole}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Interactive "DJ Console" Telemetry Simulator Panel */}
        {showDJConsole && (
          <div className="no-print">
            <DJConsole isOpen={showDJConsole} onClose={() => setShowDJConsole(false)} />
          </div>
        )}

        {/* View Switcher based on Active Role Tab */}
        {activeTab === 'operator' && <OperatorDashboard />}
        {activeTab === 'compliance' && (
          <ComplianceDashboard onNavigateToReports={() => setActiveTab('reports')} />
        )}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'reports' && <AuditReports />}
      </main>

      {/* Real-Time Floating Compliance Alarm Toast */}
      <AlertBanner />

      {/* Footer */}
      <footer className="no-print border-t border-zinc-800/80 bg-[#090a0f] py-6 mt-12 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-zinc-300">EcoFlow AI Platform</span>
            <span>• Industrial Water Treatment & Environmental Compliance (CWA Title 40 CFR)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Active Operator: <strong className="text-zinc-300">{user?.name}</strong></span>
            <span>Role: <strong className="text-cyan-400">{user?.role}</strong></span>
            <span>Microservice: <strong className="text-emerald-400">FastAPI :8000</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardContent />
      </SocketProvider>
    </AuthProvider>
  );
}
