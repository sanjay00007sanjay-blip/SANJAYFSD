const { evaluateTelemetryWithAI } = require('../services/aiServiceClient');
const { checkAndTriggerComplianceAlerts } = require('../services/alertTriggerService');
const SensorMetric = require('../models/SensorMetric');
const ComplianceAlert = require('../models/ComplianceAlert');
const AuditLog = require('../models/AuditLog');
const memoryStore = require('../config/store');
const { isMongoConnected } = require('../config/db');

function initTelemetrySocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send initial snapshot on connect
    const latest = memoryStore.getLatestMetric('FAC-001');
    const recent = memoryStore.getRecentMetrics('FAC-001', 30);
    const activeAlerts = memoryStore.getAlerts({ status: 'TRIGGERED' });

    socket.emit('telemetry:snapshot', {
      latest,
      recentHistory: recent,
      activeAlerts,
    });

    // Handle real-time telemetry from DJ Console simulator
    socket.on('telemetry:simulate_tick', async (data) => {
      try {
        const facilityCode = data.facilityCode || 'FAC-001';

        // 1. Evaluate with AI microservice (or internal failsafe)
        const aiEvaluation = await evaluateTelemetryWithAI({
          facilityCode,
          ph: data.ph,
          turbidity: data.turbidity,
          chemicalDosing: data.chemicalDosing,
          effluentFlow: data.effluentFlow,
          bod: data.bod ?? 20.0,
          cod: data.cod ?? 45.0,
          tss: data.tss ?? 15.0,
          temperature: data.temperature ?? 22.0,
          dissolvedOxygen: data.dissolvedOxygen ?? 6.8,
          isOffline: Boolean(data.isOffline),
        });

        // 2. Prepare metric document
        const metricDoc = {
          facilityCode,
          timestamp: new Date(),
          ph: Number(data.ph),
          turbidity: Number(data.turbidity),
          chemicalDosing: Number(data.chemicalDosing),
          effluentFlow: Number(data.effluentFlow),
          bod: Number(data.bod ?? 20.0),
          cod: Number(data.cod ?? 45.0),
          tss: Number(data.tss ?? 15.0),
          temperature: Number(data.temperature ?? 22.0),
          dissolvedOxygen: Number(data.dissolvedOxygen ?? 6.8),
          isOffline: Boolean(data.isOffline),
          aiRiskScore: aiEvaluation.risk_score,
          aiComplianceStatus: aiEvaluation.compliance_status,
          waterQualityIndex: aiEvaluation.water_quality_index,
          violations: aiEvaluation.violations || [],
          remediationRecommendations: aiEvaluation.remediation_recommendations || [],
          source: data.source || 'SIMULATOR_DJ_CONSOLE',
        };

        // 3. Persist
        let savedMetric;
        if (isMongoConnected()) {
          try {
            savedMetric = await SensorMetric.create(metricDoc);
          } catch (err) {
            savedMetric = memoryStore.addMetric(metricDoc);
          }
        } else {
          savedMetric = memoryStore.addMetric(metricDoc);
        }

        // 4. Check compliance rules & trigger alerts / SMS fallback
        const triggeredAlerts = await checkAndTriggerComplianceAlerts(savedMetric, aiEvaluation, io);

        // 5. Broadcast to all active operator / compliance dashboards
        const payload = {
          metric: savedMetric,
          aiEvaluation,
          triggeredAlerts,
        };

        io.emit('telemetry:stream', payload);
      } catch (err) {
        console.error('[Socket.io] Error processing telemetry tick:', err.message);
        socket.emit('telemetry:error', { message: err.message });
      }
    });

    // Operator acknowledges alert via WebSocket
    socket.on('alert:acknowledge', async ({ alertId, actorName }) => {
      try {
        const updateData = {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: actorName || 'Operator',
        };

        let updatedAlert;
        if (isMongoConnected()) {
          updatedAlert = await ComplianceAlert.findByIdAndUpdate(alertId, updateData, { new: true });
        }
        if (!updatedAlert) {
          updatedAlert = memoryStore.updateAlert(alertId, updateData);
        }

        // Audit log
        const audit = {
          action: 'ALERT_ACKNOWLEDGED',
          facilityCode: updatedAlert ? updatedAlert.facilityCode : 'FAC-001',
          actor: { name: actorName || 'Operator', role: 'operator' },
          details: { alertId, status: 'ACKNOWLEDGED' },
        };
        memoryStore.addAuditLog(audit);
        if (isMongoConnected()) {
          try {
            await AuditLog.create(audit);
          } catch (e) {}
        }

        io.emit('alert:updated', updatedAlert);
      } catch (err) {
        console.error('Error acknowledging alert:', err.message);
      }
    });

    // Preset switch injection audit
    socket.on('dj:preset_applied', async ({ presetName, operatorName, parameters }) => {
      const audit = {
        action: 'DJ_SIMULATOR_PRESET_APPLIED',
        facilityCode: 'FAC-001',
        actor: { name: operatorName || 'Operator', role: 'operator' },
        details: { presetName, parameters },
      };
      memoryStore.addAuditLog(audit);
      if (isMongoConnected()) {
        try {
          await AuditLog.create(audit);
        } catch (e) {}
      }
      io.emit('audit:new_entry', audit);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initTelemetrySocket };
