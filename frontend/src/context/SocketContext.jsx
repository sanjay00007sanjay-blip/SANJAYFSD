import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL, api } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestMetric, setLatestMetric] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [lastTickTimestamp, setLastTickTimestamp] = useState(null);
  const audioContextRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketInstance = io(BACKEND_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to EcoFlow backend:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend');
      setIsConnected(false);
    });

    // Initial snapshot from server
    socketInstance.on('telemetry:snapshot', (data) => {
      if (data.latest) setLatestMetric(data.latest);
      if (data.recentHistory && data.recentHistory.length > 0) {
        setMetricsHistory(data.recentHistory);
      }
      if (data.activeAlerts) setAlerts(data.activeAlerts);
    });

    // Real-time telemetry stream
    socketInstance.on('telemetry:stream', (payload) => {
      const { metric, aiEvaluation: aiResult } = payload;
      setLatestMetric(metric);
      if (aiResult) setAiEvaluation(aiResult);
      setLastTickTimestamp(Date.now());

      setMetricsHistory((prev) => {
        const next = [...prev, metric];
        return next.length > 40 ? next.slice(-40) : next;
      });
    });

    // Real-time compliance alert trigger
    socketInstance.on('compliance:alert_triggered', (newAlert) => {
      setAlerts((prev) => {
        const exists = prev.some((a) => a._id === newAlert._id);
        if (exists) return prev;
        return [newAlert, ...prev];
      });
      playAlertBeep();
    });

    // Alert update (acknowledged / resolved)
    socketInstance.on('alert:updated', (updated) => {
      setAlerts((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    });

    setSocket(socketInstance);

    // Initial REST fallback fetch
    api.getTelemetryHistory('FAC-001', 30)
      .then((res) => {
        if (res.data.metrics && res.data.metrics.length > 0) {
          setMetricsHistory(res.data.metrics);
          setLatestMetric(res.data.metrics[res.data.metrics.length - 1]);
        }
      })
      .catch(() => {});

    api.getAlerts()
      .then((res) => {
        if (res.data.alerts) setAlerts(res.data.alerts);
      })
      .catch(() => {});

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Helper sound effect on critical alerts
  const playAlertBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Transmit DJ Console Simulated Telemetry Tick
  const sendSimulatorTick = (telemetryData) => {
    if (socket && isConnected) {
      socket.emit('telemetry:simulate_tick', telemetryData);
    } else {
      // Direct REST fallback
      api.ingestTelemetry(telemetryData)
        .then((res) => {
          if (res.data.metric) {
            setLatestMetric(res.data.metric);
            if (res.data.aiEvaluation) setAiEvaluation(res.data.aiEvaluation);
            setMetricsHistory((prev) => [...prev.slice(-39), res.data.metric]);
          }
        })
        .catch((err) => console.error('REST fallback telemetry send failed', err));
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId, actorName) => {
    if (socket && isConnected) {
      socket.emit('alert:acknowledge', { alertId, actorName });
    }
    try {
      const res = await api.acknowledgeAlert(alertId, actorName);
      if (res.data.alert) {
        setAlerts((prev) => prev.map((a) => (a._id === alertId ? res.data.alert : a)));
      }
    } catch (e) {}
  };

  // Apply preset notification
  const notifyPresetApplied = (presetName, operatorName, parameters) => {
    if (socket && isConnected) {
      socket.emit('dj:preset_applied', { presetName, operatorName, parameters });
    }
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'TRIGGERED').length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestMetric,
        metricsHistory,
        alerts,
        setAlerts,
        aiEvaluation,
        sendSimulatorTick,
        acknowledgeAlert,
        notifyPresetApplied,
        activeAlertsCount,
        lastTickTimestamp,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
