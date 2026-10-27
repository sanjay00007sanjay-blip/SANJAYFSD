const SensorMetric = require('../models/SensorMetric');
const memoryStore = require('../config/store');
const { isMongoConnected } = require('../config/db');
const { evaluateTelemetryWithAI } = require('../services/aiServiceClient');
const { checkAndTriggerComplianceAlerts } = require('../services/alertTriggerService');

// @route POST /api/telemetry/ingest
exports.ingestTelemetry = async (req, res) => {
  try {
    const data = req.body;
    const facilityCode = data.facilityCode || 'FAC-001';

    // 1. Evaluate with AI
    const aiEvaluation = await evaluateTelemetryWithAI({
      facilityCode,
      ph: data.ph,
      turbidity: data.turbidity,
      chemicalDosing: data.chemicalDosing,
      effluentFlow: data.effluentFlow,
      bod: data.bod,
      cod: data.cod,
      tss: data.tss,
      temperature: data.temperature,
      dissolvedOxygen: data.dissolvedOxygen,
      isOffline: Boolean(data.isOffline),
    });

    // 2. Build metric
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
      source: data.source || 'REST_API',
    };

    let savedMetric;
    if (isMongoConnected()) {
      try {
        savedMetric = await SensorMetric.create(metricDoc);
      } catch (e) {
        savedMetric = memoryStore.addMetric(metricDoc);
      }
    } else {
      savedMetric = memoryStore.addMetric(metricDoc);
    }

    // 3. Trigger alert check
    const io = req.app.get('io');
    const triggeredAlerts = await checkAndTriggerComplianceAlerts(savedMetric, aiEvaluation, io);

    // 4. Socket broadcast
    if (io) {
      io.emit('telemetry:stream', {
        metric: savedMetric,
        aiEvaluation,
        triggeredAlerts,
      });
    }

    return res.status(201).json({
      success: true,
      metric: savedMetric,
      aiEvaluation,
      triggeredAlerts,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/telemetry/history
exports.getRecentHistory = async (req, res) => {
  try {
    const { facilityCode = 'FAC-001', limit = 50 } = req.query;
    const numLimit = Math.min(200, parseInt(limit, 10) || 50);

    let metrics = [];
    if (isMongoConnected()) {
      try {
        metrics = await SensorMetric.find({ facilityCode })
          .sort({ timestamp: -1 })
          .limit(numLimit);
        metrics = metrics.reverse(); // chronological order
      } catch (e) {
        metrics = memoryStore.getRecentMetrics(facilityCode, numLimit);
      }
    } else {
      metrics = memoryStore.getRecentMetrics(facilityCode, numLimit);
    }

    return res.status(200).json({
      success: true,
      count: metrics.length,
      metrics,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/telemetry/latest
exports.getLatestMetric = async (req, res) => {
  try {
    const { facilityCode = 'FAC-001' } = req.query;

    let latest = null;
    if (isMongoConnected()) {
      try {
        latest = await SensorMetric.findOne({ facilityCode }).sort({ timestamp: -1 });
      } catch (e) {
        latest = memoryStore.getLatestMetric(facilityCode);
      }
    } else {
      latest = memoryStore.getLatestMetric(facilityCode);
    }

    return res.status(200).json({
      success: true,
      metric: latest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/telemetry/evaluate-preview
exports.evaluateParametersPreview = async (req, res) => {
  try {
    const aiEvaluation = await evaluateTelemetryWithAI(req.body);
    return res.status(200).json({
      success: true,
      evaluation: aiEvaluation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
