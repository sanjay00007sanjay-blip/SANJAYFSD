import sys
from typing import List, Optional, Dict, Any

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def dict(self):
            res = {}
            for k, v in self.__dict__.items():
                if isinstance(v, list):
                    res[k] = [item.dict() if hasattr(item, "dict") else item for item in v]
                elif hasattr(v, "dict"):
                    res[k] = v.dict()
                else:
                    res[k] = v
            return res

        def model_dump(self):
            return self.dict()

    def Field(*args, default=None, **kwargs):
        return default

class WaterTelemetryInput(BaseModel):
    def __init__(
        self,
        facility_id: str = "FAC-001",
        ph: float = 7.0,
        turbidity: float = 5.0,
        chemical_dosing: float = 45.0,
        effluent_flow: float = 120.0,
        bod: float = 20.0,
        cod: float = 45.0,
        tss: float = 15.0,
        temperature: float = 22.5,
        dissolved_oxygen: float = 6.8,
        is_offline: bool = False,
        **kwargs
    ):
        super().__init__(
            facility_id=facility_id,
            ph=float(ph),
            turbidity=float(turbidity),
            chemical_dosing=float(chemical_dosing),
            effluent_flow=float(effluent_flow),
            bod=float(bod) if bod is not None else 20.0,
            cod=float(cod) if cod is not None else 45.0,
            tss=float(tss) if tss is not None else 15.0,
            temperature=float(temperature) if temperature is not None else 22.5,
            dissolved_oxygen=float(dissolved_oxygen) if dissolved_oxygen is not None else 6.8,
            is_offline=bool(is_offline),
            **kwargs
        )

class ParameterViolation(BaseModel):
    def __init__(self, parameter: str, measured_value: float, regulatory_limit: str, severity: str, description: str, **kwargs):
        super().__init__(
            parameter=parameter,
            measured_value=measured_value,
            regulatory_limit=regulatory_limit,
            severity=severity,
            description=description,
            **kwargs
        )

class RiskScoreBreakdown(BaseModel):
    def __init__(self, ph_penalty: float, turbidity_penalty: float, chemical_ratio_penalty: float, bod_penalty: float, flow_stability_penalty: float, **kwargs):
        super().__init__(
            ph_penalty=ph_penalty,
            turbidity_penalty=turbidity_penalty,
            chemical_ratio_penalty=chemical_ratio_penalty,
            bod_penalty=bod_penalty,
            flow_stability_penalty=flow_stability_penalty,
            **kwargs
        )

class ComplianceEvaluationResult(BaseModel):
    def __init__(
        self,
        facility_id: str,
        compliance_status: str,
        risk_score: float,
        water_quality_index: float,
        violations: List[ParameterViolation],
        breakdown: RiskScoreBreakdown,
        remediation_recommendations: List[str],
        epa_discharge_permit_compliant: bool,
        evaluation_timestamp: str,
        **kwargs
    ):
        super().__init__(
            facility_id=facility_id,
            compliance_status=compliance_status,
            risk_score=risk_score,
            water_quality_index=water_quality_index,
            violations=violations,
            breakdown=breakdown,
            remediation_recommendations=remediation_recommendations,
            epa_discharge_permit_compliant=epa_discharge_permit_compliant,
            evaluation_timestamp=evaluation_timestamp,
            **kwargs
        )

class BatchEvaluationRequest(BaseModel):
    def __init__(self, records: List[Any] = None, **kwargs):
        super().__init__(records=records or [], **kwargs)

class BatchEvaluationResponse(BaseModel):
    def __init__(self, results: List[Any], total_evaluated: int, critical_count: int, warning_count: int, compliant_count: int, **kwargs):
        super().__init__(
            results=results,
            total_evaluated=total_evaluated,
            critical_count=critical_count,
            warning_count=warning_count,
            compliant_count=compliant_count,
            **kwargs
        )
