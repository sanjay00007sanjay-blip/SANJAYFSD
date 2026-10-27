const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

let isAiMicroserviceOnline = false;

/**
 * Fallback AI evaluator in JavaScript, mirrors Python FastAPI engine
 * if the microservice is temporarily offline.
 */
function localEvaluateWaterTelemetry(telemetry) {
  const violations = [];
  const recommendations = [];

  if (telemetry.is_offline || telemetry.isOffline) {
    return {
      facility_id: telemetry.facility_id || telemetry.facilityCode || 'FAC-001',
      compliance_status: 'OFFLINE',
      risk_score: 100.0,
      water_quality_index: 0.0,
      violations: [
        {
          parameter: 'Telemetry Connection',
          measured_value: 0.0,
          regulatory_limit: 'Active Real-time Stream',
          severity: 'CRITICAL',
          description: 'Industrial telemetry transmitter heartbeat lost or sensor offline.',
        },
      ],
      breakdown: {
        ph_penalty: 30.0,
        turbidity_penalty: 30.0,
        chemical_ratio_penalty: 20.0,
        bod_penalty: 20.0,
        flow_stability_penalty: 0.0,
      },
      remediation_recommendations: [
        'Verify SCADA RTU field communication loop and power supply.',
        'Inspect sensor 4-20mA analog bus transmitters.',
      ],
      epa_discharge_permit_compliant: false,
      evaluation_timestamp: new Date().toISOString(),
      engine_source: 'NODE_EMBEDDED_FAILSAFE',
    };
  }

  const ph = Number(telemetry.ph);
  let phPenalty = 0.0;
  if (ph < 6.0) {
    phPenalty = Math.min(75.0, (6.0 - ph) * 15.0 + 20.0);
    violations.push({
      parameter: 'pH Level',
      measured_value: Number(ph.toFixed(2)),
      regulatory_limit: '6.5 - 8.5 pH',
      severity: 'CRITICAL',
      description: `Critical acidic discharge (pH ${ph.toFixed(2)}). Severe threat to municipal sewer and aquatic life.`,
    });
    recommendations.push('Activate automated caustic soda (NaOH) / lime neutralization dosing pump immediately.');
  } else if (ph < 6.5) {
    phPenalty = (6.5 - ph) * 20.0;
    violations.push({
      parameter: 'pH Level',
      measured_value: Number(ph.toFixed(2)),
      regulatory_limit: '6.5 - 8.5 pH',
      severity: 'MEDIUM',
      description: `Effluent pH is below regulatory threshold (pH ${ph.toFixed(2)}).`,
    });
    recommendations.push('Trim alkaline buffer injection to stabilize pH above 6.8.');
  } else if (ph > 9.0) {
    phPenalty = Math.min(75.0, (ph - 9.0) * 15.0 + 20.0);
    violations.push({
      parameter: 'pH Level',
      measured_value: Number(ph.toFixed(2)),
      regulatory_limit: '6.5 - 8.5 pH',
      severity: 'CRITICAL',
      description: `Critical caustic alkaline discharge (pH ${ph.toFixed(2)}). Violates environmental discharge permit.`,
    });
    recommendations.push('Engage sulfuric acid / CO2 neutralization loop to reduce high alkalinity.');
  } else if (ph > 8.5) {
    phPenalty = (ph - 8.5) * 20.0;
    violations.push({
      parameter: 'pH Level',
      measured_value: Number(ph.toFixed(2)),
      regulatory_limit: '6.5 - 8.5 pH',
      severity: 'MEDIUM',
      description: `Effluent pH is above regulatory threshold (pH ${ph.toFixed(2)}).`,
    });
    recommendations.push('Fine-tune acid metering to restore pH below 8.2.');
  }

  // Turbidity
  const turbidity = Number(telemetry.turbidity);
  let turbidityPenalty = 0.0;
  if (turbidity > 50.0) {
    turbidityPenalty = Math.min(30.0, 15.0 + (turbidity - 50.0) * 0.35);
    violations.push({
      parameter: 'Turbidity',
      measured_value: Number(turbidity.toFixed(1)),
      regulatory_limit: '<= 50.0 NTU',
      severity: 'CRITICAL',
      description: `Turbidity level (${turbidity.toFixed(1)} NTU) exceeds EPA maximum allowed discharge cap of 50 NTU.`,
    });
    recommendations.push('Inspect clarifier floc blanket; increase coagulant dosage or backwash multi-media sand filters.');
  } else if (turbidity > 10.0) {
    turbidityPenalty = ((turbidity - 10.0) / 40.0) * 12.0;
    violations.push({
      parameter: 'Turbidity',
      measured_value: Number(turbidity.toFixed(1)),
      regulatory_limit: '<= 50.0 NTU (Ideal < 10 NTU)',
      severity: 'LOW',
      description: `Turbidity (${turbidity.toFixed(1)} NTU) is elevated above optimal clarity standards.`,
    });
  }

  // Chemical dosing
  const dosing = Number(telemetry.chemical_dosing ?? telemetry.chemicalDosing ?? 0);
  let chemPenalty = 0.0;
  if (dosing >= 350.0) {
    chemPenalty = Math.min(25.0, 15.0 + (dosing - 350.0) * 0.1);
    violations.push({
      parameter: 'Chemical Dosing',
      measured_value: Number(dosing.toFixed(1)),
      regulatory_limit: '<= 200.0 mg/L',
      severity: 'HIGH',
      description: `Critical chemical overdose (${dosing.toFixed(1)} mg/L). Excessive coagulant/polymer discharge risk.`,
    });
    recommendations.push('Throttle chemical metering stroke rate; check PID controller setpoint to prevent overdosing.');
  } else if (dosing > 200.0) {
    chemPenalty = ((dosing - 200.0) / 150.0) * 10.0;
  }

  // BOD
  const bod = Number(telemetry.bod ?? 20.0);
  let bodPenalty = 0.0;
  if (bod > 75.0) {
    bodPenalty = Math.min(20.0, 10.0 + (bod - 75.0) * 0.2);
    violations.push({
      parameter: 'Biological Oxygen Demand (BOD)',
      measured_value: Number(bod.toFixed(1)),
      regulatory_limit: '<= 30.0 mg/L',
      severity: 'CRITICAL',
      description: `Severe BOD spike (${bod.toFixed(1)} mg/L) detected. Exceeds biological treatment capacity.`,
    });
    recommendations.push('Increase aeration blower output to supply supplemental oxygen to biological reactor.');
  } else if (bod > 30.0) {
    bodPenalty = ((bod - 30.0) / 45.0) * 8.0;
    violations.push({
      parameter: 'Biological Oxygen Demand (BOD)',
      measured_value: Number(bod.toFixed(1)),
      regulatory_limit: '<= 30.0 mg/L',
      severity: 'MEDIUM',
      description: `BOD (${bod.toFixed(1)} mg/L) above normal threshold of 30 mg/L.`,
    });
  }

  const flow = Number(telemetry.effluent_flow ?? telemetry.effluentFlow ?? 100);
  let flowPenalty = flow > 850.0 ? 5.0 : 0.0;

  const totalPenalty = phPenalty + turbidityPenalty + chemPenalty + bodPenalty + flowPenalty;
  const riskScore = Math.min(100.0, Math.max(0.0, Number(totalPenalty.toFixed(1))));
  const wqi = Math.max(0.0, Math.min(100.0, Number((100.0 - totalPenalty * 0.95).toFixed(1))));

  const hasCritical = violations.some((v) => v.severity === 'CRITICAL');
  const hasHigh = violations.some((v) => v.severity === 'HIGH');
  const hasMedium = violations.some((v) => v.severity === 'MEDIUM');

  let complianceStatus = 'COMPLIANT';
  let permitCompliant = true;
  if (hasCritical || riskScore >= 60.0) {
    complianceStatus = 'CRITICAL';
    permitCompliant = false;
  } else if (hasHigh || hasMedium || riskScore >= 25.0) {
    complianceStatus = 'WARNING';
    permitCompliant = false;
  } else {
    complianceStatus = 'COMPLIANT';
    if (recommendations.length === 0) {
      recommendations.push('All primary environmental water parameters operating within certified regulatory bounds.');
    }
  }

  return {
    facility_id: telemetry.facility_id || telemetry.facilityCode || 'FAC-001',
    compliance_status: complianceStatus,
    risk_score: riskScore,
    water_quality_index: wqi,
    violations,
    breakdown: {
      ph_penalty: Number(phPenalty.toFixed(1)),
      turbidity_penalty: Number(turbidityPenalty.toFixed(1)),
      chemical_ratio_penalty: Number(chemPenalty.toFixed(1)),
      bod_penalty: Number(bodPenalty.toFixed(1)),
      flow_stability_penalty: Number(flowPenalty.toFixed(1)),
    },
    remediation_recommendations: recommendations,
    epa_discharge_permit_compliant: permitCompliant,
    evaluation_timestamp: new Date().toISOString(),
    engine_source: 'NODE_EMBEDDED_FAILSAFE',
  };
}

/**
 * Call Python AI microservice, fallback to local engine if service is unavailable
 */
async function evaluateTelemetryWithAI(telemetry) {
  const payload = {
    facility_id: telemetry.facilityCode || telemetry.facility_id || 'FAC-001',
    ph: Number(telemetry.ph),
    turbidity: Number(telemetry.turbidity),
    chemical_dosing: Number(telemetry.chemicalDosing ?? telemetry.chemical_dosing ?? 0),
    effluent_flow: Number(telemetry.effluentFlow ?? telemetry.effluent_flow ?? 100),
    bod: Number(telemetry.bod ?? 20.0),
    cod: Number(telemetry.cod ?? 45.0),
    tss: Number(telemetry.tss ?? 15.0),
    temperature: Number(telemetry.temperature ?? 22.0),
    dissolved_oxygen: Number(telemetry.dissolvedOxygen ?? telemetry.dissolved_oxygen ?? 6.8),
    is_offline: Boolean(telemetry.isOffline ?? telemetry.is_offline ?? false),
  };

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/evaluate`, payload, {
      timeout: 1800,
    });
    isAiMicroserviceOnline = true;
    return {
      ...response.data,
      engine_source: 'PYTHON_FASTAPI_AI_MICROSERVICE',
    };
  } catch (error) {
    isAiMicroserviceOnline = false;
    // Log fallback note periodically
    return localEvaluateWaterTelemetry(telemetry);
  }
}

async function checkAiMicroserviceHealth() {
  try {
    const res = await axios.get(`${AI_SERVICE_URL}/api/v1/health`, { timeout: 1000 });
    isAiMicroserviceOnline = true;
    return { online: true, details: res.data };
  } catch (err) {
    isAiMicroserviceOnline = false;
    return { online: false, fallbackMode: 'NODE_FAILSAFE_ACTIVE', error: err.message };
  }
}

module.exports = {
  evaluateTelemetryWithAI,
  checkAiMicroserviceHealth,
  isAiServiceOnline: () => isAiMicroserviceOnline,
};
