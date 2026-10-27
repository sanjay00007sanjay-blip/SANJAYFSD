import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Sliders,
  Radio,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Power,
  Volume2,
  Flame,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export default function DJConsole({ isOpen, onClose }) {
  const { sendSimulatorTick, notifyPresetApplied, aiEvaluation, lastTickTimestamp } = useSocket();
  const { user } = useAuth();

  // Channel Fader Values
  const [ph, setPh] = useState(7.2);
  const [turbidity, setTurbidity] = useState(4.5);
  const [chemicalDosing, setChemicalDosing] = useState(45.0);
  const [effluentFlow, setEffluentFlow] = useState(120.0);
  const [bod, setBod] = useState(18.5);
  const [isOffline, setIsOffline] = useState(false);

  // Auto-Tick Generator State
  const [autoTickActive, setAutoTickActive] = useState(true);
  const [enableJitter, setEnableJitter] = useState(true);
  const [activePreset, setActivePreset] = useState('NORMAL');
  const [tickFlash, setTickFlash] = useState(false);

  const autoTickIntervalRef = useRef(null);

  // Master State Calculation based on AI Evaluation or Local limits
  const riskScore = aiEvaluation?.risk_score ?? (ph < 6.5 || ph > 8.5 || turbidity > 50 || chemicalDosing > 350 ? 75 : 8);
  const complianceStatus = isOffline
    ? 'OFFLINE'
    : (aiEvaluation?.compliance_status ?? (riskScore >= 60 ? 'CRITICAL' : riskScore >= 25 ? 'WARNING' : 'COMPLIANT'));

  // Define Preset Modes
  const applyPreset = (type) => {
    setActivePreset(type);
    setIsOffline(false);

    let newParams = {};
    if (type === 'NORMAL') {
      newParams = { ph: 7.2, turbidity: 4.5, chemicalDosing: 45.0, effluentFlow: 120.0, bod: 18.0, isOffline: false };
    } else if (type === 'CHEMICAL_OVERDOSE') {
      newParams = { ph: 5.4, turbidity: 25.0, chemicalDosing: 420.0, effluentFlow: 85.0, bod: 28.0, isOffline: false };
    } else if (type === 'PH_BREACH') {
      newParams = { ph: 3.2, turbidity: 14.0, chemicalDosing: 60.0, effluentFlow: 130.0, bod: 22.0, isOffline: false };
    } else if (type === 'SENSOR_OFFLINE') {
      newParams = { ph: 0.0, turbidity: 0.0, chemicalDosing: 0.0, effluentFlow: 0.0, bod: 0.0, isOffline: true };
      setIsOffline(true);
    }

    setPh(newParams.ph);
    setTurbidity(newParams.turbidity);
    setChemicalDosing(newParams.chemicalDosing);
    setEffluentFlow(newParams.effluentFlow);
    setBod(newParams.bod);

    // Transmit instantly
    sendSimulatorTick({
      facilityCode: user?.facilityCode || 'FAC-001',
      ...newParams,
      source: 'SIMULATOR_DJ_CONSOLE',
      presetApplied: type,
    });

    notifyPresetApplied(type, user?.name, newParams);
    triggerTickAnimation();
  };

  const triggerTickAnimation = () => {
    setTickFlash(true);
    setTimeout(() => setTickFlash(false), 280);
  };

  // Perform single transmission tick
  const executeTick = (currentValues) => {
    const jitter = (range) => (enableJitter ? (Math.random() - 0.5) * range : 0);

    let nextPh = currentValues.isOffline ? 0 : Math.max(0, Math.min(14, Number((currentValues.ph + jitter(0.06)).toFixed(2))));
    let nextTurb = currentValues.isOffline ? 0 : Math.max(0, Math.min(100, Number((currentValues.turbidity + jitter(0.3)).toFixed(1))));
    let nextDosing = currentValues.isOffline ? 0 : Math.max(0, Math.min(500, Number((currentValues.chemicalDosing + jitter(1.5)).toFixed(1))));
    let nextFlow = currentValues.isOffline ? 0 : Math.max(0, Math.min(1000, Number((currentValues.effluentFlow + jitter(2.0)).toFixed(1))));

    // Update local state smoothly if jitter enabled
    if (enableJitter && !currentValues.isOffline) {
      setPh(nextPh);
      setTurbidity(nextTurb);
      setChemicalDosing(nextDosing);
      setEffluentFlow(nextFlow);
    }

    sendSimulatorTick({
      facilityCode: user?.facilityCode || 'FAC-001',
      ph: nextPh,
      turbidity: nextTurb,
      chemicalDosing: nextDosing,
      effluentFlow: nextFlow,
      bod: currentValues.bod,
      isOffline: currentValues.isOffline,
      source: 'SIMULATOR_DJ_CONSOLE',
    });

    triggerTickAnimation();
  };

  // Auto-Tick Generator (every 2.0 seconds)
  useEffect(() => {
    if (autoTickActive) {
      autoTickIntervalRef.current = setInterval(() => {
        executeTick({ ph, turbidity, chemicalDosing, effluentFlow, bod, isOffline });
      }, 2000);
    } else {
      if (autoTickIntervalRef.current) clearInterval(autoTickIntervalRef.current);
    }

    return () => {
      if (autoTickIntervalRef.current) clearInterval(autoTickIntervalRef.current);
    };
  }, [autoTickActive, ph, turbidity, chemicalDosing, effluentFlow, bod, isOffline, enableJitter]);

  // Console Frame Color Accent
  const getConsoleTheme = () => {
    if (isOffline) return 'border-zinc-700 bg-zinc-950/95 text-zinc-400';
    if (complianceStatus === 'CRITICAL') return 'border-rose-600/80 bg-zinc-950/95 ring-2 ring-rose-500/20';
    if (complianceStatus === 'WARNING') return 'border-amber-500/80 bg-zinc-950/95 ring-2 ring-amber-500/20';
    return 'border-cyan-600/60 bg-zinc-950/95 ring-2 ring-cyan-500/20';
  };

  const getStatusBadge = () => {
    if (isOffline) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 text-zinc-300 font-mono text-xs font-bold border border-zinc-600">
          <Power className="w-3.5 h-3.5 text-zinc-400" /> SENSOR OFFLINE
        </span>
      );
    }
    if (complianceStatus === 'CRITICAL') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/80 text-rose-300 font-mono text-xs font-bold border border-rose-500 led-pulse">
          <Flame className="w-3.5 h-3.5 text-rose-400" /> CRITICAL BREACH
        </span>
      );
    }
    if (complianceStatus === 'WARNING') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/80 text-amber-300 font-mono text-xs font-bold border border-amber-500">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> ELEVATED RISK
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/80 text-emerald-300 font-mono text-xs font-bold border border-emerald-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PERMIT COMPLIANT
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-all duration-300 shadow-2xl p-5 mb-8 backdrop-blur-xl ${getConsoleTheme()}`}
    >
      {/* Console Top Rack Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-inner">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-bold">
                • [RACK 04] // INDUSTRIAL SCADA SIMULATOR •
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white scada-font flex items-center gap-2">
              DJ CONSOLE TELEMETRY MIXER
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
                v2.4 AUDIO-SPEC
              </span>
            </h2>
          </div>
        </div>

        {/* Master AI Compliance Status & Auto-Tick Pulse */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                tickFlash
                  ? 'bg-cyan-300 scale-125 shadow-[0_0_12px_#38bdf8]'
                  : autoTickActive
                  ? 'bg-cyan-600 shadow-[0_0_4px_#0284c7]'
                  : 'bg-zinc-700'
              }`}
            />
            <span className="text-xs font-mono text-zinc-400 font-medium">
              {autoTickActive ? 'STREAMING (2s)' : 'PAUSED'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400">AI RISK SCORE:</span>
            <span
              className={`text-sm font-mono font-bold ${
                riskScore >= 60 ? 'text-rose-400' : riskScore >= 25 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {riskScore.toFixed(1)}%
            </span>
          </div>

          {getStatusBadge()}
        </div>
      </div>

      {/* Preset "Fader / Quick Switch" Rubber Push-Buttons */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            OPERATING PRESET SWITCHES (INSTANT INJECTION):
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">1-Click scenario testing for regulatory compliance</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            onClick={() => applyPreset('NORMAL')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
              activePreset === 'NORMAL' && !isOffline
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span>NORMAL OPERATIONS</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-normal">pH 7.2</span>
          </button>

          <button
            onClick={() => applyPreset('CHEMICAL_OVERDOSE')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
              activePreset === 'CHEMICAL_OVERDOSE' && !isOffline
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500/30'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <span>CHEMICAL OVERDOSE</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-normal">420 mg/L</span>
          </button>

          <button
            onClick={() => applyPreset('PH_BREACH')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
              activePreset === 'PH_BREACH' && !isOffline
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/30'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span>pH CRITICAL BREACH</span>
            </div>
            <span className="text-[10px] text-rose-400/80 font-normal">3.2 pH</span>
          </button>

          <button
            onClick={() => applyPreset('SENSOR_OFFLINE')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
              isOffline
                ? 'bg-zinc-800 border-zinc-500 text-zinc-100 ring-2 ring-zinc-500/30'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
              <span>SENSOR OFFLINE</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-normal">PROBE CUT</span>
          </button>
        </div>
      </div>

      {/* Main Physical DJ Console Fader Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/90 shadow-inner">
        {/* CHANNEL 1: pH LEVEL */}
        <div className="flex flex-col p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-zinc-400">CH 01 // ACIDITY</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              6.5 - 8.5 SAFE
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-white">pH Level</span>
            <span
              className={`text-2xl font-mono font-extrabold ${
                ph < 6.5 || ph > 8.5 ? 'text-rose-400' : 'text-cyan-400'
              }`}
            >
              {isOffline ? '--.-' : ph.toFixed(2)}
            </span>
          </div>

          {/* VU Meter & Fader Track */}
          <div className="relative my-2">
            <input
              type="range"
              min="0"
              max="14"
              step="0.05"
              value={ph}
              disabled={isOffline}
              onChange={(e) => {
                setPh(parseFloat(e.target.value));
                setActivePreset('CUSTOM');
              }}
              className="dj-fader w-full"
            />
            {/* Visual Safe Zone Indicator Track */}
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
              <span>0 (Acid)</span>
              <span className="text-emerald-400 font-bold">6.5-8.5</span>
              <span>14 (Base)</span>
            </div>
          </div>

          {/* Simulated LED Level Meter */}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-800">
            {[...Array(8)].map((_, i) => {
              const active = !isOffline && (i / 8) * 14 <= ph;
              const isWarning = i >= 5;
              const isDanger = i >= 7 || (i <= 2 && ph < 6.5);
              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm transition-all duration-150 ${
                    active
                      ? isDanger
                        ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                        : isWarning
                        ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]'
                        : 'bg-emerald-500 shadow-[0_0_4px_#10b981]'
                      : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* CHANNEL 2: TURBIDITY */}
        <div className="flex flex-col p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-zinc-400">CH 02 // CLARITY</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              MAX 50.0 NTU
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-white">Turbidity</span>
            <span className={`text-2xl font-mono font-extrabold ${turbidity > 50 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {isOffline ? '--.-' : turbidity.toFixed(1)}{' '}
              <span className="text-xs font-normal text-zinc-400">NTU</span>
            </span>
          </div>

          <div className="relative my-2">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={turbidity}
              disabled={isOffline}
              onChange={(e) => {
                setTurbidity(parseFloat(e.target.value));
                setActivePreset('CUSTOM');
              }}
              className="dj-fader w-full"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
              <span>0 (Clear)</span>
              <span className="text-amber-400 font-bold">50 Limit</span>
              <span>100 NTU</span>
            </div>
          </div>

          {/* Simulated LED Level Meter */}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-800">
            {[...Array(8)].map((_, i) => {
              const active = !isOffline && (i / 8) * 100 <= turbidity;
              const isDanger = i >= 4;
              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm transition-all duration-150 ${
                    active
                      ? isDanger
                        ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                        : 'bg-cyan-500 shadow-[0_0_4px_#06b6d4]'
                      : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* CHANNEL 3: CHEMICAL DOSING RATE */}
        <div className="flex flex-col p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-zinc-400">CH 03 // REAGENTS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              REAGENT PUMP
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-white">Chemical Dosing</span>
            <span
              className={`text-2xl font-mono font-extrabold ${
                chemicalDosing > 350 ? 'text-rose-400' : chemicalDosing > 200 ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {isOffline ? '--.-' : chemicalDosing.toFixed(1)}{' '}
              <span className="text-xs font-normal text-zinc-400">mg/L</span>
            </span>
          </div>

          <div className="relative my-2">
            <input
              type="range"
              min="0"
              max="500"
              step="1"
              value={chemicalDosing}
              disabled={isOffline}
              onChange={(e) => {
                setChemicalDosing(parseFloat(e.target.value));
                setActivePreset('CUSTOM');
              }}
              className="dj-fader w-full"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
              <span>0 mg/L</span>
              <span className="text-amber-400">200 Normal</span>
              <span className="text-rose-400 font-bold">500 Spike</span>
            </div>
          </div>

          {/* Simulated LED Level Meter */}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-800">
            {[...Array(8)].map((_, i) => {
              const active = !isOffline && (i / 8) * 500 <= chemicalDosing;
              const isDanger = i >= 6;
              const isWarning = i >= 3;
              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm transition-all duration-150 ${
                    active
                      ? isDanger
                        ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                        : isWarning
                        ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]'
                        : 'bg-cyan-500 shadow-[0_0_4px_#06b6d4]'
                      : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* CHANNEL 4: EFFLUENT FLOW RATE */}
        <div className="flex flex-col p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-zinc-400">CH 04 // DISCHARGE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              OUTFALL L/s
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-white">Effluent Flow</span>
            <span className="text-2xl font-mono font-extrabold text-cyan-400">
              {isOffline ? '--.-' : effluentFlow.toFixed(1)}{' '}
              <span className="text-xs font-normal text-zinc-400">L/s</span>
            </span>
          </div>

          <div className="relative my-2">
            <input
              type="range"
              min="0"
              max="1000"
              step="5"
              value={effluentFlow}
              disabled={isOffline}
              onChange={(e) => {
                setEffluentFlow(parseFloat(e.target.value));
                setActivePreset('CUSTOM');
              }}
              className="dj-fader w-full"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
              <span>0 L/s</span>
              <span>500</span>
              <span>1000 L/s</span>
            </div>
          </div>

          {/* Simulated LED Level Meter */}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-800">
            {[...Array(8)].map((_, i) => {
              const active = !isOffline && (i / 8) * 1000 <= effluentFlow;
              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm transition-all duration-150 ${
                    active ? 'bg-cyan-500 shadow-[0_0_4px_#06b6d4]' : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Master Bottom Control Deck & Auto-Tick Loop */}
      <div className="flex flex-wrap items-center justify-between mt-5 pt-4 border-t border-zinc-800 gap-4">
        <div className="flex items-center gap-4">
          {/* Auto-Tick 2s Switch */}
          <label className="flex items-center gap-3 cursor-pointer select-none bg-zinc-900/90 px-3.5 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700">
            <input
              type="checkbox"
              checked={autoTickActive}
              onChange={(e) => setAutoTickActive(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                autoTickActive ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoTickActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-white">AUTO-TICK GENERATOR</span>
              <span className="text-[10px] font-mono text-zinc-400">Transmit to backend every 2.0s</span>
            </div>
          </label>

          {/* Brownian Noise / Jitter Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-mono text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={enableJitter}
              onChange={(e) => setEnableJitter(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0"
            />
            <span>Realistic Industrial Signal Jitter</span>
          </label>
        </div>

        {/* Manual Instant Trigger Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => executeTick({ ph, turbidity, chemicalDosing, effluentFlow, bod, isOffline })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-xs font-bold transition shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${tickFlash ? 'animate-spin text-cyan-400' : ''}`} />
            FORCE TRANSMIT NOW
          </button>
        </div>
      </div>
    </div>
  );
}
