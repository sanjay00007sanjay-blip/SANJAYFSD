import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Flame, AlertTriangle, X, Check, PhoneCall } from 'lucide-react';

export default function AlertBanner() {
  const { alerts, acknowledgeAlert } = useSocket();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState({});

  // Find the latest unacknowledged critical or high alert
  const activeCriticalAlert = alerts.find(
    (a) => (a.status === 'TRIGGERED') && (a.severity === 'CRITICAL' || a.severity === 'HIGH') && !dismissed[a._id]
  );

  if (!activeCriticalAlert) return null;

  return (
    <div className="no-print fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="p-4 rounded-2xl bg-rose-950/95 border-2 border-rose-500 shadow-2xl text-white backdrop-blur-xl ring-4 ring-rose-500/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 shadow-lg shadow-rose-500/50">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900 border border-rose-400 font-bold uppercase">
                  {activeCriticalAlert.severity} ENVIRONMENTAL BREACH
                </span>
              </div>
              <h4 className="text-sm font-bold scada-font text-white mt-1">
                {activeCriticalAlert.parameter} Out of Regulatory Bounds!
              </h4>
            </div>
          </div>

          <button
            onClick={() => setDismissed((prev) => ({ ...prev, [activeCriticalAlert._id]: true }))}
            className="text-rose-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-rose-200 font-mono mt-2.5">
          {activeCriticalAlert.message}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-rose-300">
            {activeCriticalAlert.twilioNotification?.sent && (
              <>
                <PhoneCall className="w-3.5 h-3.5 text-cyan-300" />
                <span>Twilio SMS Fallback Dispatched</span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              acknowledgeAlert(activeCriticalAlert._id, user?.name);
              setDismissed((prev) => ({ ...prev, [activeCriticalAlert._id]: true }));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-950 font-bold font-mono text-xs transition shadow"
          >
            <Check className="w-3.5 h-3.5" />
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}
