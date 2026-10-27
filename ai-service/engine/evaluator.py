from datetime import datetime, timezone
from typing import List, Tuple
from models import (
    WaterTelemetryInput,
    ComplianceEvaluationResult,
    ParameterViolation,
    RiskScoreBreakdown,
)

# Regulatory Threshold Constants (EPA Clean Water Act & Industrial Pretreatment Standards)
PH_LOWER_SAFE = 6.5
PH_UPPER_SAFE = 8.5
PH_LOWER_WARN = 6.0
PH_UPPER_WARN = 9.0

TURBIDITY_LIMIT_NTU = 50.0
TURBIDITY_OPTIMAL_NTU = 10.0

CHEMICAL_DOSING_WARN_MGL = 200.0
CHEMICAL_DOSING_SPIKE_MGL = 350.0

BOD_LIMIT_MGL = 30.0
BOD_SPIKE_MGL = 75.0

def evaluate_water_telemetry(telemetry: WaterTelemetryInput) -> ComplianceEvaluationResult:
    now_iso = datetime.now(timezone.utc).isoformat()

    # If sensor is simulated as offline
    if telemetry.is_offline:
        return ComplianceEvaluationResult(
            facility_id=telemetry.facility_id,
            compliance_status="OFFLINE",
            risk_score=100.0,
            water_quality_index=0.0,
            violations=[
                ParameterViolation(
                    parameter="Telemetry Connection",
                    measured_value=0.0,
                    regulatory_limit="Active Real-time Stream",
                    severity="CRITICAL",
                    description="Industrial telemetry transmitter heartbeat lost or sensor offline."
                )
            ],
            breakdown=RiskScoreBreakdown(
                ph_penalty=30.0,
                turbidity_penalty=30.0,
                chemical_ratio_penalty=20.0,
                bod_penalty=20.0,
                flow_stability_penalty=0.0
            ),
            remediation_recommendations=[
                "Verify SCADA RTU field communication loop and power supply.",
                "Inspect sensor 4-20mA analog bus transmitters.",
                "Switch to secondary optical inline backup sensor."
            ],
            epa_discharge_permit_compliant=False,
            evaluation_timestamp=now_iso
        )

    violations: List[ParameterViolation] = []
    recommendations: List[str] = []

    # 1. pH Evaluation
    ph = telemetry.ph
    ph_penalty = 0.0
    if ph < PH_LOWER_WARN:
        ph_penalty = min(75.0, (PH_LOWER_WARN - ph) * 15.0 + 20.0)
        violations.append(
            ParameterViolation(
                parameter="pH Level",
                measured_value=round(ph, 2),
                regulatory_limit="6.5 - 8.5 pH",
                severity="CRITICAL",
                description=f"Critical acidic discharge (pH {round(ph, 2)}). Severe threat to municipal sewer and aquatic life."
            )
        )
        recommendations.append("Activate automated caustic soda (NaOH) / lime neutralization dosing pump immediately.")
    elif ph < PH_LOWER_SAFE:
        ph_penalty = (PH_LOWER_SAFE - ph) * 20.0
        violations.append(
            ParameterViolation(
                parameter="pH Level",
                measured_value=round(ph, 2),
                regulatory_limit="6.5 - 8.5 pH",
                severity="MEDIUM",
                description=f"Effluent pH is below regulatory threshold (pH {round(ph, 2)})."
            )
        )
        recommendations.append("Trim alkaline buffer injection to stabilize pH above 6.8.")
    elif ph > PH_UPPER_WARN:
        ph_penalty = min(75.0, (ph - PH_UPPER_WARN) * 15.0 + 20.0)
        violations.append(
            ParameterViolation(
                parameter="pH Level",
                measured_value=round(ph, 2),
                regulatory_limit="6.5 - 8.5 pH",
                severity="CRITICAL",
                description=f"Critical caustic alkaline discharge (pH {round(ph, 2)}). Violates environmental discharge permit."
            )
        )
        recommendations.append("Engage sulfuric acid / CO2 neutralization loop to reduce high alkalinity.")
    elif ph > PH_UPPER_SAFE:
        ph_penalty = (ph - PH_UPPER_SAFE) * 20.0
        violations.append(
            ParameterViolation(
                parameter="pH Level",
                measured_value=round(ph, 2),
                regulatory_limit="6.5 - 8.5 pH",
                severity="MEDIUM",
                description=f"Effluent pH is above regulatory threshold (pH {round(ph, 2)})."
            )
        )
        recommendations.append("Fine-tune acid metering to restore pH below 8.2.")

    # 2. Turbidity Evaluation
    turbidity = telemetry.turbidity
    turbidity_penalty = 0.0
    if turbidity > TURBIDITY_LIMIT_NTU:
        turbidity_penalty = min(30.0, 15.0 + (turbidity - TURBIDITY_LIMIT_NTU) * 0.35)
        violations.append(
            ParameterViolation(
                parameter="Turbidity",
                measured_value=round(turbidity, 1),
                regulatory_limit=f"<= {TURBIDITY_LIMIT_NTU} NTU",
                severity="CRITICAL",
                description=f"Turbidity level ({round(turbidity, 1)} NTU) exceeds EPA maximum allowed discharge cap of 50 NTU."
            )
        )
        recommendations.append("Inspect clarifier floc blanket; increase coagulant dosage or backwash multi-media sand filters.")
    elif turbidity > TURBIDITY_OPTIMAL_NTU:
        turbidity_penalty = ((turbidity - TURBIDITY_OPTIMAL_NTU) / 40.0) * 12.0
        violations.append(
            ParameterViolation(
                parameter="Turbidity",
                measured_value=round(turbidity, 1),
                regulatory_limit=f"<= {TURBIDITY_LIMIT_NTU} NTU (Ideal < 10 NTU)",
                severity="LOW",
                description=f"Turbidity ({round(turbidity, 1)} NTU) is elevated above optimal clarity standards."
            )
        )
        recommendations.append("Monitor settling retention time in primary sedimentation clarifier.")

    # 3. Chemical Dosing & Flow Ratio Evaluation
    dosing = telemetry.chemical_dosing
    flow = max(1.0, telemetry.effluent_flow)
    chem_ratio_penalty = 0.0
    if dosing >= CHEMICAL_DOSING_SPIKE_MGL:
        chem_ratio_penalty = min(25.0, 15.0 + (dosing - CHEMICAL_DOSING_SPIKE_MGL) * 0.1)
        violations.append(
            ParameterViolation(
                parameter="Chemical Dosing",
                measured_value=round(dosing, 1),
                regulatory_limit=f"<= {CHEMICAL_DOSING_WARN_MGL} mg/L",
                severity="HIGH",
                description=f"Critical chemical overdose ({round(dosing, 1)} mg/L). Excessive coagulant/polymer discharge risk."
            )
        )
        recommendations.append("Throttle chemical metering stroke rate; check PID controller setpoint to prevent overdosing.")
    elif dosing > CHEMICAL_DOSING_WARN_MGL:
        chem_ratio_penalty = ((dosing - CHEMICAL_DOSING_WARN_MGL) / 150.0) * 10.0

    # Interaction: High dosing with low effluent flow creates high concentration accumulation
    if dosing > 150.0 and flow < 30.0:
        chem_ratio_penalty = min(25.0, chem_ratio_penalty + 5.0)
        recommendations.append("Warning: Low effluent flow with high dosing will lead to chemical settling in discharge manifold.")

    # 4. BOD (Biochemical Oxygen Demand) Evaluation
    bod = telemetry.bod if telemetry.bod is not None else 20.0
    bod_penalty = 0.0
    if bod > BOD_SPIKE_MGL:
        bod_penalty = min(20.0, 10.0 + (bod - BOD_SPIKE_MGL) * 0.2)
        violations.append(
            ParameterViolation(
                parameter="Biological Oxygen Demand (BOD)",
                measured_value=round(bod, 1),
                regulatory_limit=f"<= {BOD_LIMIT_MGL} mg/L",
                severity="CRITICAL",
                description=f"Severe BOD spike ({round(bod, 1)} mg/L) detected. Exceeds biological treatment capacity."
            )
        )
        recommendations.append("Increase aeration blower output to supply supplemental oxygen to biological reactor.")
    elif bod > BOD_LIMIT_MGL:
        bod_penalty = ((bod - BOD_LIMIT_MGL) / 45.0) * 8.0
        violations.append(
            ParameterViolation(
                parameter="Biological Oxygen Demand (BOD)",
                measured_value=round(bod, 1),
                regulatory_limit=f"<= {BOD_LIMIT_MGL} mg/L",
                severity="MEDIUM",
                description=f"BOD ({round(bod, 1)} mg/L) above normal threshold of 30 mg/L."
            )
        )
        recommendations.append("Audit upstream industrial batch releases for high-sugar or solvent waste.")

    # 5. Flow Stability Penalty
    flow_stability_penalty = 0.0
    if telemetry.effluent_flow > 850.0:
        flow_stability_penalty = 5.0
        recommendations.append("Effluent flow approaching peak hydraulic capacity of UV disinfection channel.")

    # Calculate Composite Pollution Risk Score (0 - 100%)
    total_penalty = ph_penalty + turbidity_penalty + chem_ratio_penalty + bod_penalty + flow_stability_penalty
    risk_score = min(100.0, max(0.0, round(total_penalty, 1)))

    # Calculate Water Quality Index (WQI) (100 is pristine, 0 is heavily polluted)
    wqi = max(0.0, min(100.0, round(100.0 - (total_penalty * 0.95), 1)))

    # Determine Compliance Category
    has_critical = any(v.severity == "CRITICAL" for v in violations)
    has_high = any(v.severity == "HIGH" for v in violations)
    has_medium = any(v.severity == "MEDIUM" for v in violations)

    if has_critical or risk_score >= 60.0:
        compliance_status = "CRITICAL"
        permit_compliant = False
    elif has_high or has_medium or risk_score >= 25.0:
        compliance_status = "WARNING"
        permit_compliant = False
    else:
        compliance_status = "COMPLIANT"
        permit_compliant = True
        if not recommendations:
            recommendations.append("All primary environmental water parameters operating within certified regulatory bounds.")

    return ComplianceEvaluationResult(
        facility_id=telemetry.facility_id,
        compliance_status=compliance_status,
        risk_score=risk_score,
        water_quality_index=wqi,
        violations=violations,
        breakdown=RiskScoreBreakdown(
            ph_penalty=round(ph_penalty, 1),
            turbidity_penalty=round(turbidity_penalty, 1),
            chemical_ratio_penalty=round(chem_ratio_penalty, 1),
            bod_penalty=round(bod_penalty, 1),
            flow_stability_penalty=round(flow_stability_penalty, 1),
        ),
        remediation_recommendations=recommendations,
        epa_discharge_permit_compliant=permit_compliant,
        evaluation_timestamp=now_iso,
    )
