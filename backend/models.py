from pydantic import BaseModel
from typing import Dict, Optional

class FaultRequest(BaseModel):
    fault: str = "normal"

class ScenarioRequest(BaseModel):
    scenario: str = "normal"

class TelemetryResponse(BaseModel):
    timestamp: float
    scenario: str
    scenario_name: str
    sensors: Dict[str, float]
    health: float
    rul_hours: float
    fault: Optional[str]
    subsystem: Optional[str]
