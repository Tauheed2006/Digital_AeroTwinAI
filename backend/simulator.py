from ai_engine import detect_fault
import random

rpm = 5200
cht = 92.0
oil = 68.0
vibration = 0.45     # <-- For testing

def generate_engine_data():
    global rpm, cht, oil, vibration

    rpm += random.randint(-10, 10)
    cht += random.uniform(-0.7, 0.7)
    oil += random.uniform(-0.4, 0.4)
    vibration += random.uniform(-0.01, 0.01)

    health = int(max(0, min(100,
        100 - (vibration * 100) - ((cht - 90) / 2))))

    # AI decides the fault here
    fault, confidence = detect_fault(rpm, cht, oil, vibration)

    return {
        "rpm": rpm,
        "cht": round(cht, 1),
        "oil": round(oil, 1),
        "vibration": round(vibration, 2),
        "health": health,
        "fault": fault,
        "confidence": confidence
    }