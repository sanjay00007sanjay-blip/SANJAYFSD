/**
 * Backend Automated Verification Suite
 */
const assert = require('assert');
const memoryStore = require('../src/config/store');
const { initialFacilities, seedUsers, initialMetrics, initialAlerts, initialAuditLogs } = require('../src/config/seedData');
const { evaluateTelemetryWithAI } = require('../src/services/aiServiceClient');
const { checkAndTriggerComplianceAlerts } = require('../src/services/alertTriggerService');

async function runTests() {
  console.log('🧪 Starting EcoFlow AI Backend Test Suite...\n');

  // Test 1: Data Store Initialization
  memoryStore.initSeedData({
    facilities: initialFacilities,
    users: seedUsers,
    metrics: initialMetrics,
    alerts: initialAlerts,
    auditLogs: initialAuditLogs,
  });
  assert(memoryStore.facilities.length >= 2, 'Facilities should be loaded');
  assert(memoryStore.users.length >= 3, 'Users should be loaded');
  assert(memoryStore.metrics.length > 0, 'Metrics should be loaded');
  console.log('✓ Test 1: In-memory store and seed fixtures verified.');

  // Test 2: AI Evaluator Integration (Normal Values)
  const normalEval = await evaluateTelemetryWithAI({
    facilityCode: 'FAC-001',
    ph: 7.3,
    turbidity: 6.2,
    chemicalDosing: 45.0,
    effluentFlow: 120.0,
    bod: 18.0,
  });
  assert.strictEqual(normalEval.compliance_status, 'COMPLIANT');
  assert(normalEval.risk_score < 25.0);
  console.log('✓ Test 2: AI evaluator correctly classifies normal operating conditions.');

  // Test 3: AI Evaluator Integration (pH Critical Breach)
  const breachEval = await evaluateTelemetryWithAI({
    facilityCode: 'FAC-001',
    ph: 3.1,
    turbidity: 12.0,
    chemicalDosing: 50.0,
    effluentFlow: 100.0,
  });
  assert.strictEqual(breachEval.compliance_status, 'CRITICAL');
  assert(breachEval.risk_score >= 50.0);
  assert(breachEval.violations.some((v) => v.parameter === 'pH Level'));
  console.log('✓ Test 3: AI evaluator flags acidic pH critical breach.');

  // Test 4: Turbidity Exceedance (> 50 NTU)
  const turbidEval = await evaluateTelemetryWithAI({
    facilityCode: 'FAC-001',
    ph: 7.2,
    turbidity: 58.4,
    chemicalDosing: 50.0,
    effluentFlow: 100.0,
  });
  assert.strictEqual(turbidEval.compliance_status, 'CRITICAL');
  assert(turbidEval.violations.some((v) => v.parameter === 'Turbidity'));
  console.log('✓ Test 4: Turbidity over 50 NTU triggers CRITICAL violation.');

  // Test 5: Alert Trigger Service & Notification Fallback
  const triggered = await checkAndTriggerComplianceAlerts(
    { facilityCode: 'FAC-001' },
    breachEval,
    null // no socket io in headless test
  );
  assert(triggered.length > 0, 'Should generate compliance alert');
  assert.strictEqual(triggered[0].alertType, 'PH_CRITICAL_BREACH');
  assert.strictEqual(triggered[0].twilioNotification.attempted, true);
  console.log('✓ Test 5: Automated compliance alert triggered with SMS notification fallback.');

  // Test 6: Report Generation Integrity
  const testMetrics = memoryStore.getRecentMetrics('FAC-001', 10);
  assert(Array.isArray(testMetrics) && testMetrics.length > 0);
  console.log('✓ Test 6: Report time-series query verified.');

  console.log('\n🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
