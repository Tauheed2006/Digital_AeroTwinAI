
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse

from ecu_emulator import SENSORS, FAULTS, generate_telemetry
from ai_engine import evaluate

from reportlab.pdfgen import canvas
from datetime import datetime
import tempfile
import time
import json

from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from datetime import datetime
import tempfile

app = FastAPI(title="AeroTwin AI - 32 Sensor / 15 Fault Prototype")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

state = {
    "scenario": "normal",
    "tick": 0,
}


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "AeroTwin AI Backend Running",
        "sensors": len(SENSORS),
        "fault_scenarios": len(FAULTS) - 1,
    }


# --------------------------------------------------
# SENSOR LIST
# --------------------------------------------------

@app.get("/api/sensors")
def sensors():
    return {
        "count": len(SENSORS),
        "sensors": SENSORS,
    }


# --------------------------------------------------
# FAULT LIST
# --------------------------------------------------

@app.get("/api/faults")
def faults():
    return {
        "count": len(FAULTS) - 1,
        "faults": [
            {
                "id": k,
                "name": v["name"],
                "subsystem": v["subsystem"],
            }
            for k, v in FAULTS.items()
            if k != "normal"
        ],
    }


# --------------------------------------------------
# CHANGE SCENARIO
# --------------------------------------------------

@app.post("/api/scenario/{scenario}")
def set_scenario(scenario: str):

    if scenario not in FAULTS:
        return {
            "error": "Unknown scenario",
            "available": list(FAULTS),
        }

    state["scenario"] = scenario

    return {
        "scenario": scenario,
        "scenario_name": FAULTS[scenario]["name"],
    }


# --------------------------------------------------
# LIVE TELEMETRY
# --------------------------------------------------

@app.get("/api/telemetry")
def telemetry():

    state["tick"] += 1

    data = generate_telemetry(
        state["scenario"],
        state["tick"],
    )

    health, rul, fault, subsystem = evaluate(
        state["scenario"],
        data,
    )

    return {
        "timestamp": time.time(),
        "scenario": state["scenario"],
        "scenario_name": FAULTS[state["scenario"]]["name"],
        "sensors": data,
        "health": health,
        "rul_hours": rul,
        "fault": fault,
        "subsystem": subsystem,
    }


# --------------------------------------------------
# LIVE STREAM
# --------------------------------------------------

@app.get("/api/stream")
def stream():

    def generator():

        while True:

            state["tick"] += 1

            data = generate_telemetry(
                state["scenario"],
                state["tick"],
            )

            health, rul, fault, subsystem = evaluate(
                state["scenario"],
                data,
            )

            payload = {
                "timestamp": time.time(),
                "scenario": state["scenario"],
                "scenario_name": FAULTS[state["scenario"]]["name"],
                "sensors": data,
                "health": health,
                "rul_hours": rul,
                "fault": fault,
                "subsystem": subsystem,
            }

            yield f"data: {json.dumps(payload)}\n\n"

            time.sleep(1)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
    )


# --------------------------------------------------
# HEALTH
# --------------------------------------------------

@app.get("/api/health")
def health():

    data = generate_telemetry(
        state["scenario"],
        state["tick"],
    )

    h, r, f, s = evaluate(
        state["scenario"],
        data,
    )

    return {
        "health": h,
        "rul_hours": r,
        "fault": f,
        "subsystem": s,
    }


# --------------------------------------------------
# PDF REPORT
# --------------------------------------------------

@app.get("/api/report")
def generate_report():

    # Get current live telemetry
    data = generate_telemetry(state["scenario"], state["tick"])
    health, rul, fault, subsystem = evaluate(state["scenario"], data)

    severity = (
        "NORMAL" if health >= 90 else
        "WARNING" if health >= 70 else
        "CRITICAL"
    )

    # Create temporary PDF
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    pdf_path = temp.name
    temp.close()

    c = canvas.Canvas(pdf_path)
    width, height = 595, 842

    # ==========================
    # HEADER
    # ==========================
    c.setFillColorRGB(0.09, 0.23, 0.63)
    c.rect(0, height-70, width, 70, fill=1, stroke=0)

    c.setFillColorRGB(1,1,1)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, height-35, "AeroTwin AI")

    c.setFont("Helvetica", 11)
    c.drawString(40, height-52, "Digital Twin Mission Health Report")

    # ==========================
    # MISSION DETAILS
    # ==========================
    y = height-100

    def info_row(label, value, color=None):
        nonlocal y

        # Left cell
        c.setFillColorRGB(0.86,0.90,0.95)
        c.rect(40, y-18, 150, 22, fill=1)

        # Right cell
        if color:
            c.setFillColor(color)
            c.rect(190, y-18, 365, 22, fill=1)
            c.setFillColorRGB(1,1,1)
        else:
            c.setFillColorRGB(1,1,1)
            c.rect(190, y-18, 365, 22, fill=1)
            c.setFillColorRGB(0,0,0)

        c.rect(40, y-18, 515, 22, fill=0)

        c.setFont("Helvetica-Bold", 9)
        c.drawString(48, y-10, label)

        if color:
            c.setFillColorRGB(1,1,1)
        else:
            c.setFillColorRGB(0,0,0)

        c.setFont("Helvetica", 9)
        c.drawString(198, y-10, str(value))

        y -= 26

    info_row("Mission", "Alpha-01")
    info_row("Scenario", FAULTS[state["scenario"]]["name"])
    info_row("Generated", datetime.now().strftime("%d %b %Y %H:%M"))

    from reportlab.lib.colors import Color

    if severity == "NORMAL":
        sev = Color(0,0.6,0)
    elif severity == "WARNING":
        sev = Color(1,0.6,0)
    else:
        sev = Color(0.8,0,0)

    info_row("Severity", severity, sev)

    # ==========================
    # PARAMETER TABLE
    # ==========================
    c.setFillColorRGB(0.10,0.24,0.65)
    c.rect(40, y-5, 515, 22, fill=1)

    c.setFillColorRGB(1,1,1)
    c.setFont("Helvetica-Bold",10)
    c.drawString(50, y+2, "Parameter")
    c.drawString(340, y+2, "Value")

    y -= 24

    rows = [
        ("RPM", round(data["rpm"])),
        ("CHT", f'{data["cht"]:.1f} °C'),
        ("Oil Pressure", f'{data["oil_pressure"]:.1f} bar'),
        ("Vibration", f'{data["vibration"]:.2f} mm/s'),
        ("Health", f"{health}%"),
        ("RUL", f"{rul} hrs"),
    ]

    for k,v in rows:
        c.setFillColorRGB(1,1,1)
        c.rect(40, y-5, 515, 22, fill=1, stroke=1)

        c.setFillColorRGB(0,0,0)
        c.setFont("Helvetica",9)

        c.drawString(50, y+2, str(k))
        c.drawString(340, y+2, str(v))

        y -= 22

    # ==========================
    # AI DIAGNOSIS
    # ==========================
    y -= 10

    diagnosis = [
        ("Detected Fault", fault),
        ("Affected Component", subsystem),
        ("Confidence", "99%"),
        ("Severity", severity),
    ]

    for k,v in diagnosis:
        c.rect(40, y-5, 515, 22)

        c.setFont("Helvetica-Bold",9)
        c.drawString(50, y+2, k)

        c.setFont("Helvetica",9)
        c.drawString(250, y+2, str(v))

        y -= 22

    # ==========================
    # MAINTENANCE
    # ==========================
    y -= 15

    c.setFont("Helvetica-Bold",13)
    c.drawString(40, y, "Maintenance Recommendation")

    y -= 20

    c.setFont("Helvetica",9)

    if health >= 90:
        recs = [
            "Continue normal operation.",
            "Inspect Healthy.",
            "Review vibration and oil telemetry.",
            "Validate repair using Mission Replay.",
        ]
    elif health >= 70:
        recs = [
            "Schedule preventive maintenance.",
            f"Inspect {subsystem}.",
            "Review engine temperature trends.",
            "Perform vibration analysis.",
        ]
    else:
        recs = [
            "Ground aircraft immediately.",
            f"Replace {subsystem}.",
            "Run complete AI diagnostics.",
            "Validate repair using Mission Replay.",
        ]

    for r in recs:
        c.drawString(50, y, u"\u2022 " + r)
        y -= 15

    # ==========================
    # FOOTER
    # ==========================
    c.setStrokeColorRGB(0.8,0.8,0.8)
    c.line(40,40,555,40)

    c.setFont("Helvetica-Oblique",8)
    c.drawString(40,25,"Generated by AeroTwin AI")
    c.drawRightString(555,25,"Page 1")

    c.save()

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="Mission_Health_Report.pdf"
    )

# --------------------------------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )