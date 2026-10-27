import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import (
    WaterTelemetryInput,
    ComplianceEvaluationResult,
    BatchEvaluationRequest,
    BatchEvaluationResponse,
)
from engine.evaluator import evaluate_water_telemetry

app = FastAPI(
    title="EcoFlow AI Analytics Microservice",
    description="Real-time Industrial Water Treatment Telemetry Evaluator & Pollution Risk Engine",
    version="1.0.0",
)

# Enable CORS for backend communication and direct testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "EcoFlow AI Analytics Microservice",
        "status": "healthy",
        "version": "1.0.0",
        "description": "Industrial Water Treatment & Environmental Compliance Engine",
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "operational",
        "model_version": "v1.4-industrial-compliance",
        "standards": ["EPA-CleanWaterAct", "EU-WaterFrameworkDirective", "ISO-14001"],
    }

@app.post("/api/v1/evaluate", response_model=ComplianceEvaluationResult)
def evaluate_telemetry(payload: WaterTelemetryInput):
    """
    Evaluates a single telemetry frame against environmental compliance standards,
    computing real-time pollution risk score, Water Quality Index (WQI), and remediation advice.
    """
    try:
        result = evaluate_water_telemetry(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI evaluation failure: {str(e)}")

@app.post("/api/v1/batch-evaluate", response_model=BatchEvaluationResponse)
def batch_evaluate(payload: BatchEvaluationRequest):
    """
    Evaluates historical or batch telemetry records.
    """
    results = [evaluate_water_telemetry(item) for item in payload.records]
    critical_count = sum(1 for r in results if r.compliance_status == "CRITICAL")
    warning_count = sum(1 for r in results if r.compliance_status == "WARNING")
    compliant_count = sum(1 for r in results if r.compliance_status == "COMPLIANT")

    return BatchEvaluationResponse(
        results=results,
        total_evaluated=len(results),
        critical_count=critical_count,
        warning_count=warning_count,
        compliant_count=compliant_count,
    )

@app.get("/api/v1/regulatory-standards")
def get_regulatory_standards():
    return {
        "ph": {"min": 6.5, "max": 8.5, "unit": "pH", "authority": "EPA CFR 403"},
        "turbidity": {"limit": 50.0, "optimal": 10.0, "unit": "NTU", "authority": "NPDES Standard"},
        "chemical_dosing": {"warning_threshold": 200.0, "critical_overdose": 350.0, "unit": "mg/L"},
        "bod": {"limit": 30.0, "spike_threshold": 75.0, "unit": "mg/L", "authority": "Secondary Treatment Standards"},
        "effluent_flow": {"rated_capacity_max": 850.0, "unit": "L/s"},
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
