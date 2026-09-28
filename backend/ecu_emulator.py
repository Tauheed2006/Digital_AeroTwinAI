import time, random, math

SENSORS = [
  {
    "id": "rpm",
    "name": "Engine RPM",
    "unit": "RPM",
    "min": 2500,
    "max": 5200
  },
  {
    "id": "cht",
    "name": "Cylinder Head Temperature",
    "unit": "\u00b0C",
    "min": 80,
    "max": 180
  },
  {
    "id": "egt",
    "name": "Exhaust Gas Temperature",
    "unit": "\u00b0C",
    "min": 450,
    "max": 900
  },
  {
    "id": "oil_pressure",
    "name": "Oil Pressure",
    "unit": "bar",
    "min": 2.5,
    "max": 6.5
  },
  {
    "id": "oil_temperature",
    "name": "Oil Temperature",
    "unit": "\u00b0C",
    "min": 70,
    "max": 125
  },
  {
    "id": "vibration",
    "name": "Engine Vibration",
    "unit": "mm/s",
    "min": 1.0,
    "max": 12.0
  },
  {
    "id": "intake_air_temp",
    "name": "Intake Air Temperature",
    "unit": "\u00b0C",
    "min": 15,
    "max": 80
  },
  {
    "id": "manifold_pressure",
    "name": "Manifold Pressure",
    "unit": "kPa",
    "min": 70,
    "max": 180
  },
  {
    "id": "fuel_flow",
    "name": "Fuel Flow",
    "unit": "L/h",
    "min": 20,
    "max": 95
  },
  {
    "id": "fuel_pressure",
    "name": "Fuel Pressure",
    "unit": "bar",
    "min": 2.5,
    "max": 5.5
  },
  {
    "id": "torque",
    "name": "Engine Torque",
    "unit": "Nm",
    "min": 120,
    "max": 520
  },
  {
    "id": "throttle",
    "name": "Throttle Position",
    "unit": "%",
    "min": 10,
    "max": 100
  },
  {
    "id": "map",
    "name": "MAP",
    "unit": "kPa",
    "min": 75,
    "max": 185
  },
  {
    "id": "intake_pressure",
    "name": "Intake Pressure",
    "unit": "kPa",
    "min": 80,
    "max": 190
  },
  {
    "id": "exhaust_pressure",
    "name": "Exhaust Pressure",
    "unit": "kPa",
    "min": 90,
    "max": 180
  },
  {
    "id": "cylinder_pressure",
    "name": "Cylinder Pressure",
    "unit": "bar",
    "min": 6,
    "max": 16
  },
  {
    "id": "crankcase_pressure",
    "name": "Crankcase Pressure",
    "unit": "kPa",
    "min": 2,
    "max": 12
  },
  {
    "id": "coolant_temp",
    "name": "Coolant Temperature",
    "unit": "\u00b0C",
    "min": 65,
    "max": 110
  },
  {
    "id": "coolant_pressure",
    "name": "Coolant Pressure",
    "unit": "bar",
    "min": 0.7,
    "max": 1.8
  },
  {
    "id": "battery_voltage",
    "name": "Battery Voltage",
    "unit": "V",
    "min": 23,
    "max": 29
  },
  {
    "id": "alternator_voltage",
    "name": "Alternator Voltage",
    "unit": "V",
    "min": 25,
    "max": 30
  },
  {
    "id": "ecu_temperature",
    "name": "ECU Temperature",
    "unit": "\u00b0C",
    "min": 35,
    "max": 85
  },
  {
    "id": "ambient_temperature",
    "name": "Ambient Temperature",
    "unit": "\u00b0C",
    "min": 15,
    "max": 42
  },
  {
    "id": "ambient_pressure",
    "name": "Ambient Pressure",
    "unit": "kPa",
    "min": 92,
    "max": 104
  },
  {
    "id": "humidity",
    "name": "Humidity",
    "unit": "%",
    "min": 20,
    "max": 90
  },
  {
    "id": "propeller_rpm",
    "name": "Propeller RPM",
    "unit": "RPM",
    "min": 1400,
    "max": 2600
  },
  {
    "id": "propeller_torque",
    "name": "Propeller Torque",
    "unit": "Nm",
    "min": 100,
    "max": 430
  },
  {
    "id": "bearing_temperature",
    "name": "Bearing Temperature",
    "unit": "\u00b0C",
    "min": 55,
    "max": 115
  },
  {
    "id": "bearing_vibration",
    "name": "Bearing Vibration",
    "unit": "mm/s",
    "min": 0.5,
    "max": 10
  },
  {
    "id": "oil_debris",
    "name": "Oil Debris Level",
    "unit": "ppm",
    "min": 0,
    "max": 80
  },
  {
    "id": "fuel_temperature",
    "name": "Fuel Temperature",
    "unit": "\u00b0C",
    "min": 15,
    "max": 65
  },
  {
    "id": "oil_filter_differential_pressure",
    "name": "Oil Filter Differential Pressure",
    "unit": "bar",
    "min": 0.1,
    "max": 2.5
  }
]

FAULTS = {
  "normal": {
    "name": "Normal Operation",
    "subsystem": "None",
    "effects": {}
  },
  "bearing_wear": {
    "name": "Bearing Wear",
    "subsystem": "Bearing",
    "effects": {
      "bearing_temperature": 1.18,
      "bearing_vibration": 2.2,
      "vibration": 1.45
    }
  },
  "bearing_failure": {
    "name": "Bearing Failure",
    "subsystem": "Bearing",
    "effects": {
      "bearing_temperature": 1.45,
      "bearing_vibration": 4.0,
      "vibration": 2.3,
      "rpm": 0.92
    }
  },
  "oil_leak": {
    "name": "Oil Leak",
    "subsystem": "Lubrication",
    "effects": {
      "oil_pressure": 0.48,
      "oil_temperature": 1.25,
      "oil_debris": 2.5,
      "oil_filter_differential_pressure": 1.55,
      "cht": 1.12
    }
  },
  "low_oil_pressure": {
    "name": "Low Oil Pressure",
    "subsystem": "Lubrication",
    "effects": {
      "oil_pressure": 0.42,
      "oil_temperature": 1.2,
      "oil_filter_differential_pressure": 1.35,
      "bearing_temperature": 1.18
    }
  },
  "overheating": {
    "name": "Engine Overheating",
    "subsystem": "Thermal",
    "effects": {
      "cht": 1.32,
      "egt": 1.25,
      "oil_temperature": 1.25,
      "coolant_temp": 1.28
    }
  },
  "cooling_degradation": {
    "name": "Cooling System Degradation",
    "subsystem": "Cooling",
    "effects": {
      "coolant_temp": 1.3,
      "cht": 1.2,
      "coolant_pressure": 0.65,
      "egt": 1.12
    }
  },
  "fuel_system": {
    "name": "Fuel System Fault",
    "subsystem": "Fuel",
    "effects": {
      "fuel_flow": 0.7,
      "fuel_pressure": 0.72,
      "fuel_temperature": 1.18,
      "rpm": 0.9
    }
  },
  "fuel_pressure_drop": {
    "name": "Fuel Pressure Drop",
    "subsystem": "Fuel",
    "effects": {
      "fuel_pressure": 0.42,
      "fuel_flow": 0.72,
      "rpm": 0.86,
      "torque": 0.78
    }
  },
  "injector_fault": {
    "name": "Injector Fault",
    "subsystem": "Fuel",
    "effects": {
      "fuel_flow": 1.35,
      "egt": 1.2,
      "rpm": 0.9,
      "vibration": 1.3
    }
  },
  "misfire": {
    "name": "Misfire",
    "subsystem": "Combustion",
    "effects": {
      "rpm": 0.86,
      "torque": 0.7,
      "vibration": 2.1,
      "egt": 1.18,
      "cylinder_pressure": 0.78
    }
  },
  "excessive_vibration": {
    "name": "Excessive Vibration",
    "subsystem": "Mechanical",
    "effects": {
      "vibration": 2.8,
      "bearing_vibration": 3.0,
      "bearing_temperature": 1.18
    }
  },
  "overspeed": {
    "name": "Overspeed",
    "subsystem": "Engine Speed",
    "effects": {
      "rpm": 1.18,
      "propeller_rpm": 1.16,
      "egt": 1.12
    }
  },
  "underspeed": {
    "name": "Underspeed",
    "subsystem": "Engine Speed",
    "effects": {
      "rpm": 0.68,
      "propeller_rpm": 0.7,
      "torque": 0.78
    }
  },
  "electrical_ecu": {
    "name": "Electrical / ECU Fault",
    "subsystem": "Electrical",
    "effects": {
      "battery_voltage": 0.82,
      "alternator_voltage": 0.86,
      "ecu_temperature": 1.28
    }
  },
  "airflow_restriction": {
    "name": "Intake / Airflow Restriction",
    "subsystem": "Air Intake",
    "effects": {
      "manifold_pressure": 0.68,
      "map": 0.72,
      "intake_pressure": 0.7,
      "egt": 1.15,
      "rpm": 0.9
    }
  }
}

BASE = {
"rpm":3800,"cht":112,"egt":650,"oil_pressure":4.2,"oil_temperature":92,"vibration":2.2,
"intake_air_temp":35,"manifold_pressure":125,"fuel_flow":48,"fuel_pressure":3.8,"torque":290,
"throttle":62,"map":130,"intake_pressure":132,"exhaust_pressure":118,"cylinder_pressure":11,
"crankcase_pressure":6,"coolant_temp":82,"coolant_pressure":1.15,"battery_voltage":26,
"alternator_voltage":28,"ecu_temperature":52,"ambient_temperature":28,"ambient_pressure":99,
"humidity":55,"propeller_rpm":1980,"propeller_torque":245,"bearing_temperature":72,
"bearing_vibration":1.5,"oil_debris":8,"fuel_temperature":31,"oil_filter_differential_pressure":0.45
}

def generate_telemetry(scenario="normal", tick=0):
    effect = FAULTS.get(scenario, FAULTS["normal"])["effects"]
    data = {}
    phase = tick / 8.0
    for s in SENSORS:
        k = s["id"]
        base = BASE[k]
        noise = random.uniform(-0.025,0.025)
        wave = 1 + 0.012 * math.sin(phase + len(k))
        val = base * wave * (effect.get(k,1.0)) * (1+noise)
        lo, hi = s["min"], s["max"]
        data[k] = round(max(lo, min(hi, val)), 2)
    return data

FAULT_SEVERITY = {
    "bearing_wear": 0.35, "bearing_failure": 0.72, "oil_leak": 0.50,
    "low_oil_pressure": 0.48, "overheating": 0.58, "cooling_degradation": 0.46,
    "fuel_system": 0.42, "fuel_pressure_drop": 0.50, "injector_fault": 0.45,
    "misfire": 0.65, "excessive_vibration": 0.70, "overspeed": 0.55,
    "underspeed": 0.50, "electrical_ecu": 0.40, "airflow_restriction": 0.44,
}

def diagnose(scenario, data):
    if scenario == "normal":
        return 100.0, 1200.0, None, None
    fault = FAULTS[scenario]
    severity = FAULT_SEVERITY.get(scenario, 0.5)
    vib_excess = max(0.0, (data.get("vibration", 2.2) - 2.2) / 20.0)
    severity = min(0.90, severity + min(0.12, vib_excess))
    health = round(max(10.0, 100.0 * (1.0 - severity)), 1)
    rul = round(max(20.0, 1200.0 * health / 100.0), 1)
    return health, rul, fault["name"], fault["subsystem"]
