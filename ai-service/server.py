"""
EcoFlow AI Analytics Microservice - Pure Python HTTP Server
Provides zero-dependency, high-performance REST endpoints for telemetry evaluation
matching the FastAPI specification. Works on all Python runtimes including Python 3.15+.
"""
import sys
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from engine.evaluator import evaluate_water_telemetry
from models import WaterTelemetryInput

PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")

class EcoFlowAIHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send_json(self, status_code, data):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/" or path == "":
            response = {
                "service": "EcoFlow AI Analytics Microservice",
                "status": "healthy",
                "version": "1.0.0",
                "runtime": f"Python {sys.version.split()[0]}",
                "description": "Industrial Water Treatment & Environmental Compliance Engine",
            }
            self._send_json(200, response)

        elif path == "/api/v1/health":
            response = {
                "status": "operational",
                "model_version": "v1.4-industrial-compliance",
                "runtime": f"Python {sys.version.split()[0]}",
                "standards": ["EPA-CleanWaterAct", "EU-WaterFrameworkDirective", "ISO-14001"],
            }
            self._send_json(200, response)

        elif path == "/api/v1/regulatory-standards":
            response = {
                "ph": {"min": 6.5, "max": 8.5, "unit": "pH", "authority": "EPA CFR 403"},
                "turbidity": {"limit": 50.0, "optimal": 10.0, "unit": "NTU", "authority": "NPDES Standard"},
                "chemical_dosing": {"warning_threshold": 200.0, "critical_overdose": 350.0, "unit": "mg/L"},
                "bod": {"limit": 30.0, "spike_threshold": 75.0, "unit": "mg/L", "authority": "Secondary Treatment Standards"},
                "effluent_flow": {"rated_capacity_max": 850.0, "unit": "L/s"},
            }
            self._send_json(200, response)

        else:
            self._send_json(404, {"detail": "Not Found"})

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            body = json.loads(post_data)
        except Exception:
            body = {}

        if path == "/api/v1/evaluate":
            try:
                telemetry = WaterTelemetryInput(
                    facility_id=body.get("facility_id", body.get("facilityCode", "FAC-001")),
                    ph=float(body.get("ph", 7.0)),
                    turbidity=float(body.get("turbidity", 5.0)),
                    chemical_dosing=float(body.get("chemical_dosing", body.get("chemicalDosing", 45.0))),
                    effluent_flow=float(body.get("effluent_flow", body.get("effluentFlow", 120.0))),
                    bod=float(body.get("bod", 20.0)),
                    cod=float(body.get("cod", 45.0)),
                    tss=float(body.get("tss", 15.0)),
                    temperature=float(body.get("temperature", 22.5)),
                    dissolved_oxygen=float(body.get("dissolved_oxygen", body.get("dissolvedOxygen", 6.8))),
                    is_offline=bool(body.get("is_offline", body.get("isOffline", False))),
                )
                result = evaluate_water_telemetry(telemetry)
                data = result.dict() if hasattr(result, "dict") else result.__dict__
                self._send_json(200, data)
            except Exception as e:
                self._send_json(500, {"detail": f"Evaluation error: {str(e)}"})

        elif path == "/api/v1/batch-evaluate":
            try:
                records = body.get("records", [])
                results = []
                for rec in records:
                    t = WaterTelemetryInput(
                        facility_id=rec.get("facility_id", "FAC-001"),
                        ph=float(rec.get("ph", 7.0)),
                        turbidity=float(rec.get("turbidity", 5.0)),
                        chemical_dosing=float(rec.get("chemical_dosing", 45.0)),
                        effluent_flow=float(rec.get("effluent_flow", 120.0)),
                        bod=float(rec.get("bod", 20.0)),
                        is_offline=bool(rec.get("is_offline", False)),
                    )
                    r = evaluate_water_telemetry(t)
                    results.append(r.dict() if hasattr(r, "dict") else r.__dict__)

                critical_count = sum(1 for r in results if r.get("compliance_status") == "CRITICAL")
                warning_count = sum(1 for r in results if r.get("compliance_status") == "WARNING")
                compliant_count = sum(1 for r in results if r.get("compliance_status") == "COMPLIANT")

                data = {
                    "results": results,
                    "total_evaluated": len(results),
                    "critical_count": critical_count,
                    "warning_count": warning_count,
                    "compliant_count": compliant_count,
                }
                self._send_json(200, data)
            except Exception as e:
                self._send_json(500, {"detail": str(e)})

        else:
            self._send_json(404, {"detail": "Not Found"})

    def log_message(self, format, *args):
        # Clean logging format
        print(f"[AI Microservice] {self.command} {self.path} - {args[1]}")

def run():
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, EcoFlowAIHandler)
    print(f"====================================================")
    print(f"🧠 EcoFlow AI Analytics Microservice Running on http://localhost:{PORT}")
    print(f"🔬 Regulatory Standards: EPA CWA Title 40 CFR Part 136")
    print(f"====================================================")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
