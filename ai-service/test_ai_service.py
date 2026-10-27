"""
Unit tests for EcoFlow AI compliance evaluation engine.
Can be executed directly via Python.
"""
from models import WaterTelemetryInput, BatchEvaluationRequest
from engine.evaluator import evaluate_water_telemetry

def test_normal_operations():
    normal = WaterTelemetryInput(
        facility_id="FAC-001",
        ph=7.2,
        turbidity=4.5,
        chemical_dosing=45.0,
        effluent_flow=120.0,
        bod=18.0
    )
    result = evaluate_water_telemetry(normal)
    assert result.compliance_status == "COMPLIANT", f"Expected COMPLIANT, got {result.compliance_status}"
    assert result.risk_score < 25.0, f"Expected risk < 25%, got {result.risk_score}"
    assert result.epa_discharge_permit_compliant is True
    print("✓ test_normal_operations passed")

def test_ph_critical_breach():
    acidic = WaterTelemetryInput(
        facility_id="FAC-001",
        ph=3.2,
        turbidity=8.0,
        chemical_dosing=50.0,
        effluent_flow=120.0
    )
    result = evaluate_water_telemetry(acidic)
    assert result.compliance_status == "CRITICAL", f"Expected CRITICAL, got {result.compliance_status}"
    assert result.risk_score >= 50.0, f"Expected risk >= 50%, got {result.risk_score}"
    assert any(v.parameter == "pH Level" and v.severity == "CRITICAL" for v in result.violations)
    print("✓ test_ph_critical_breach passed")

def test_turbidity_violation():
    turbid = WaterTelemetryInput(
        facility_id="FAC-001",
        ph=7.4,
        turbidity=68.5,
        chemical_dosing=40.0,
        effluent_flow=110.0
    )
    result = evaluate_water_telemetry(turbid)
    assert result.compliance_status == "CRITICAL", f"Expected CRITICAL, got {result.compliance_status}"
    assert any(v.parameter == "Turbidity" and v.severity == "CRITICAL" for v in result.violations)
    print("✓ test_turbidity_violation passed")

def test_chemical_overdose():
    overdose = WaterTelemetryInput(
        facility_id="FAC-001",
        ph=5.8,
        turbidity=22.0,
        chemical_dosing=420.0,
        effluent_flow=80.0
    )
    result = evaluate_water_telemetry(overdose)
    assert result.compliance_status in ["WARNING", "CRITICAL"]
    assert any(v.parameter == "Chemical Dosing" for v in result.violations)
    print("✓ test_chemical_overdose passed")

def test_sensor_offline():
    offline = WaterTelemetryInput(
        facility_id="FAC-001",
        ph=7.0,
        turbidity=5.0,
        chemical_dosing=50.0,
        effluent_flow=100.0,
        is_offline=True
    )
    result = evaluate_water_telemetry(offline)
    assert result.compliance_status == "OFFLINE"
    assert result.risk_score == 100.0
    print("✓ test_sensor_offline passed")

if __name__ == "__main__":
    test_normal_operations()
    test_ph_critical_breach()
    test_turbidity_violation()
    test_chemical_overdose()
    test_sensor_offline()
    print("All AI Engine unit tests passed successfully!")
