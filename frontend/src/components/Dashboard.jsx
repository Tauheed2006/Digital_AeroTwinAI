import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  Gauge,
  RefreshCw,
  Search,
  ShieldAlert,
  Thermometer,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import DigitalTwin3D from "./DigitalTwin3D";
import "./Dashboard.css";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  ""
);

/* -------------------------------------------------------
   FRONTEND FAULT → SENSOR RELATIONSHIP
   Mirrors the effects in ecu_emulator.py.
------------------------------------------------------- */

const FAULT_SENSOR_MAP = {
  normal: [],

  bearing_wear: [
    "bearing_temperature",
    "bearing_vibration",
    "vibration",
  ],

  bearing_failure: [
    "bearing_temperature",
    "bearing_vibration",
    "vibration",
    "rpm",
  ],

  oil_leak: [
    "oil_pressure",
    "oil_temperature",
    "oil_debris",
    "oil_filter_differential_pressure",
    "cht",
  ],

  low_oil_pressure: [
    "oil_pressure",
    "oil_temperature",
    "oil_filter_differential_pressure",
    "bearing_temperature",
  ],

  overheating: [
    "cht",
    "egt",
    "oil_temperature",
    "coolant_temp",
  ],

  cooling_degradation: [
    "coolant_temp",
    "cht",
    "coolant_pressure",
    "egt",
  ],

  fuel_system: [
    "fuel_flow",
    "fuel_pressure",
    "fuel_temperature",
    "rpm",
  ],

  fuel_pressure_drop: [
    "fuel_pressure",
    "fuel_flow",
    "rpm",
    "torque",
  ],

  injector_fault: [
    "fuel_flow",
    "egt",
    "rpm",
    "vibration",
  ],

  misfire: [
    "rpm",
    "torque",
    "vibration",
    "egt",
    "cylinder_pressure",
  ],

  excessive_vibration: [
    "vibration",
    "bearing_vibration",
    "bearing_temperature",
  ],

  overspeed: [
    "rpm",
    "propeller_rpm",
    "egt",
  ],

  underspeed: [
    "rpm",
    "propeller_rpm",
    "torque",
  ],

  electrical_ecu: [
    "battery_voltage",
    "alternator_voltage",
    "ecu_temperature",
  ],

  airflow_restriction: [
    "manifold_pressure",
    "map",
    "intake_pressure",
    "egt",
    "rpm",
  ],
};

const BASELINE = {
  rpm: 3800,
  cht: 112,
  egt: 650,
  oil_pressure: 4.2,
  oil_temperature: 92,
  vibration: 2.2,
  intake_air_temp: 35,
  manifold_pressure: 125,
  fuel_flow: 48,
  fuel_pressure: 3.8,
  torque: 290,
  throttle: 62,
  map: 130,
  intake_pressure: 132,
  exhaust_pressure: 118,
  cylinder_pressure: 11,
  crankcase_pressure: 6,
  coolant_temp: 82,
  coolant_pressure: 1.15,
  battery_voltage: 26,
  alternator_voltage: 28,
  ecu_temperature: 52,
  ambient_temperature: 28,
  ambient_pressure: 99,
  humidity: 55,
  propeller_rpm: 1980,
  propeller_torque: 245,
  bearing_temperature: 72,
  bearing_vibration: 1.5,
  oil_debris: 8,
  fuel_temperature: 31,
  oil_filter_differential_pressure: 0.45,
};

const FALLBACK_SENSORS = [
  ["rpm", "Engine RPM", "RPM", 2500, 5200],
  ["cht", "Cylinder Head Temperature", "°C", 80, 180],
  ["egt", "Exhaust Gas Temperature", "°C", 450, 900],
  ["oil_pressure", "Oil Pressure", "bar", 2.5, 6.5],
  ["oil_temperature", "Oil Temperature", "°C", 70, 125],
  ["vibration", "Engine Vibration", "mm/s", 1, 12],
  ["intake_air_temp", "Intake Air Temperature", "°C", 15, 80],
  ["manifold_pressure", "Manifold Pressure", "kPa", 70, 180],
  ["fuel_flow", "Fuel Flow", "L/h", 20, 95],
  ["fuel_pressure", "Fuel Pressure", "bar", 2.5, 5.5],
  ["torque", "Engine Torque", "Nm", 120, 520],
  ["throttle", "Throttle Position", "%", 10, 100],
  ["map", "MAP", "kPa", 75, 185],
  ["intake_pressure", "Intake Pressure", "kPa", 80, 190],
  ["exhaust_pressure", "Exhaust Pressure", "kPa", 90, 180],
  ["cylinder_pressure", "Cylinder Pressure", "bar", 6, 16],
  ["crankcase_pressure", "Crankcase Pressure", "kPa", 2, 12],
  ["coolant_temp", "Coolant Temperature", "°C", 65, 110],
  ["coolant_pressure", "Coolant Pressure", "bar", 0.7, 1.8],
  ["battery_voltage", "Battery Voltage", "V", 23, 29],
  ["alternator_voltage", "Alternator Voltage", "V", 25, 30],
  ["ecu_temperature", "ECU Temperature", "°C", 35, 85],
  ["ambient_temperature", "Ambient Temperature", "°C", 15, 42],
  ["ambient_pressure", "Ambient Pressure", "kPa", 92, 104],
  ["humidity", "Humidity", "%", 20, 90],
  ["propeller_rpm", "Propeller RPM", "RPM", 1400, 2600],
  ["propeller_torque", "Propeller Torque", "Nm", 100, 430],
  ["bearing_temperature", "Bearing Temperature", "°C", 55, 115],
  ["bearing_vibration", "Bearing Vibration", "mm/s", 0.5, 10],
  ["oil_debris", "Oil Debris Level", "ppm", 0, 80],
  ["fuel_temperature", "Fuel Temperature", "°C", 15, 65],
  [
    "oil_filter_differential_pressure",
    "Oil Filter Differential Pressure",
    "bar",
    0.1,
    2.5,
  ],
].map(([id, name, unit, min, max]) => ({
  id,
  name,
  unit,
  min,
  max,
}));

const FALLBACK_FAULTS = [
  ["normal", "Normal Operation", "None"],
  ["bearing_wear", "Bearing Wear", "Bearing"],
  ["bearing_failure", "Bearing Failure", "Bearing"],
  ["oil_leak", "Oil Leak", "Lubrication"],
  ["low_oil_pressure", "Low Oil Pressure", "Lubrication"],
  ["overheating", "Engine Overheating", "Thermal"],
  ["cooling_degradation", "Cooling System Degradation", "Cooling"],
  ["fuel_system", "Fuel System Fault", "Fuel"],
  ["fuel_pressure_drop", "Fuel Pressure Drop", "Fuel"],
  ["injector_fault", "Injector Fault", "Fuel"],
  ["misfire", "Misfire", "Combustion"],
  ["excessive_vibration", "Excessive Vibration", "Mechanical"],
  ["overspeed", "Overspeed", "Engine Speed"],
  ["underspeed", "Underspeed", "Engine Speed"],
  ["electrical_ecu", "Electrical / ECU Fault", "Electrical"],
  ["airflow_restriction", "Intake / Airflow Restriction", "Air Intake"],
].map(([id, name, subsystem]) => ({ id, name, subsystem }));

function severityFor(health, scenario) {
  if (scenario === "normal") return "normal";
  if (health < 40) return "emergency";
  if (health < 60) return "critical";
  return "warning";
}

function severityLabel(severity) {
  return {
    normal: "NORMAL",
    warning: "WARNING",
    critical: "CRITICAL",
    emergency: "EMERGENCY",
  }[severity];
}

function advisoryFor(severity) {
  if (severity === "emergency") return "IMMEDIATE LANDING ADVISED";
  if (severity === "critical") return "RETURN TO BASE";
  if (severity === "warning") return "CONTINUE WITH MONITORING";
  return "MISSION NOMINAL";
}

function componentFor(subsystem, scenario) {
  if (subsystem === "Bearing") return "Turbine Bearing Assembly";
  if (subsystem === "Lubrication") return "Lubrication Oil Line";
  if (subsystem === "Thermal") return "Combustion Chamber";
  if (subsystem === "Cooling") return "Cooling System";
  if (subsystem === "Combustion") return "Combustion Chamber";
  if (subsystem === "Fuel") {
    return scenario === "injector_fault"
      ? "Fuel Injector"
      : "Fuel System";
  }
  if (subsystem === "Mechanical") return "Crankshaft / Bearing";
  if (subsystem === "Engine Speed") return "Propeller / Engine Shaft";
  if (subsystem === "Electrical") return "ECU Controller";
  if (subsystem === "Air Intake") return "Air Intake Filter";
  return subsystem || "Engine";
}

function SensorCard({ sensor, value, scenario }) {
  const affected = FAULT_SENSOR_MAP[scenario]?.includes(sensor.id);

  const numeric = Number(value);
  const percentage = Number.isFinite(numeric)
    ? Math.max(
        0,
        Math.min(
          100,
          ((numeric - sensor.min) / (sensor.max - sensor.min)) * 100
        )
      )
    : 0;

  const baseline = BASELINE[sensor.id];

  let condition = "normal";

  if (affected) {
    const difference =
      baseline !== undefined
        ? Math.abs(numeric - baseline) / Math.max(Math.abs(baseline), 0.001)
        : 0;

    condition = difference > 0.25 ? "critical" : "warning";
  }

  return (
    <div className={`sensor-tile ${affected ? "affected" : ""}`}>
      <div className="sensor-label">
        <span title={sensor.name}>{sensor.name}</span>

        <i className={condition}>
          {affected ? "AFFECTED" : "LIVE"}
        </i>
      </div>

      <div className="sensor-value">
        {Number.isFinite(numeric) ? numeric.toFixed(2) : "--"}
        <small> {sensor.unit}</small>
      </div>

      <div className="sensor-range">
        <span>{sensor.min}</span>
        <span>{sensor.max}</span>
      </div>

      <div className="sensor-track">
        <i
          className={condition}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SummaryCard({ icon, title, value, subtitle, type = "" }) {
  return (
    <div className="summary-card">
      <div className="summary-top">
        <span>{title}</span>
        <i className={type}>{icon}</i>
      </div>

      <b>{value}</b>
      <small>{subtitle}</small>
    </div>
  );
}

export default function Dashboard() {
  const [sensors, setSensors] = useState(FALLBACK_SENSORS);
  const [faults, setFaults] = useState(FALLBACK_FAULTS);
  const [values, setValues] = useState({});
  const [scenario, setScenario] = useState("normal");
  const [faultName, setFaultName] = useState("Normal Operation");
  const [subsystem, setSubsystem] = useState("None");
  const [health, setHealth] = useState(100);
  const [rul, setRul] = useState(1200);
  const [connected, setConnected] = useState(false);

  const [metric, setMetric] = useState("rpm");
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  const [xrayMode, setXrayMode] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [busy, setBusy] = useState(false);

  const severity = severityFor(health, scenario);
  const component = componentFor(subsystem, scenario);

  const affectedSensors = FAULT_SENSOR_MAP[scenario] || [];

  const visibleSensors = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return sensors;

    return sensors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [sensors, search]);

  const selectedSensor =
    sensors.find((s) => s.id === metric) || FALLBACK_SENSORS[0];

  async function receiveTelemetry() {
    try {
      const response = await fetch(`${API}/api/telemetry`);

      if (!response.ok) throw new Error("Telemetry unavailable");

      const data = await response.json();

      setConnected(true);
      setValues(data.sensors || {});
      setHealth(Number(data.health ?? 100));
      setRul(Number(data.rul_hours ?? 1200));
      setScenario(data.scenario || "normal");
      setFaultName(
        data.scenario_name || data.fault || "Normal Operation"
      );
      setSubsystem(data.subsystem || "None");

      setHistory((previous) => {
        const point = {
          time: new Date().toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          value: Number(data.sensors?.[metric] ?? 0),
        };

        return [...previous, point].slice(-30);
      });
    } catch {
      setConnected(false);
    }
  }

  async function loadConfiguration() {
    try {
      const [sensorResponse, faultResponse] = await Promise.all([
        fetch(`${API}/api/sensors`),
        fetch(`${API}/api/faults`),
      ]);

      if (sensorResponse.ok) {
        const data = await sensorResponse.json();
        if (Array.isArray(data.sensors)) {
          setSensors(data.sensors);
        }
      }

      if (faultResponse.ok) {
        const data = await faultResponse.json();
        if (Array.isArray(data.faults)) {
          setFaults([
            { id: "normal", name: "Normal Operation", subsystem: "None" },
            ...data.faults,
          ]);
        }
      }
    } catch {
      // Fallback configuration remains active.
    }
  }

  async function chooseScenario(id) {
    if (busy) return;

    setBusy(true);

    try {
      const response = await fetch(`${API}/api/scenario/${id}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Scenario change failed");

      const data = await response.json();

      setScenario(data.scenario || id);
      setFaultName(data.scenario_name || "Scenario");

      await receiveTelemetry();
    } catch {
      setConnected(false);
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    await receiveTelemetry();
  }

  useEffect(() => {
    loadConfiguration();
    receiveTelemetry();

    const interval = setInterval(receiveTelemetry, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHistory([]);
  }, [metric]);

  const generateReport = async () => {
  const res = await fetch(`${API}/api/report`);
  const blob = await res.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Mission_Health_Report.pdf";

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

  const currentMetricValue = Number(values[metric] ?? 0);

  const filteredFaults = faults;

  return (
    <div className="aero-dashboard">
      {/* HEADER */}
      <header className="aero-top">
        <div className="aero-brand">
          <div className="brand-symbol">
            <Activity size={17} />
          </div>

          <div>
            <b>
              AeroTwin <em>AI</em>
            </b>
            <small>MISSION ENGINE INTELLIGENCE</small>
          </div>
        </div>

        <div className="aircraft">
          <span>UAV</span>

          <div>
            <b>MALE UAV ENGINE</b>
            <small>ATLAS 3200 / DIGITAL TWIN</small>
          </div>

          <Gauge size={15} />
        </div>

        <div className="backend-state">
          <i className={connected ? "connected" : ""} />
          {connected ? "BACKEND CONNECTED" : "BACKEND OFFLINE"}
        </div>
      </header>

      <main className="aero-content">
        {/* PAGE HEADING */}
        <div className="aero-heading">
          <div>
            <div className="section-kicker">REAL-TIME ENGINE MONITORING</div>

            <h1>Engine Health Overview</h1>

            <p>
              Live digital twin telemetry, fault localization and
              mission reliability monitoring.
            </p>
          </div>

          <button className="refresh-button" onClick={refresh}>
            <RefreshCw size={13} />
            Refresh
          </button>
         <button className="report-button" onClick={generateReport}>
  📄 Generate Report
</button>
        </div>

        {/* SUMMARY */}
        <section className="summary-grid">
          <SummaryCard
            title="ENGINE HEALTH"
            value={`${health.toFixed(1)}%`}
            subtitle={`System condition: ${severityLabel(severity)}`}
            type="green"
            icon={<Activity size={14} />}
          />

          <SummaryCard
            title="REMAINING USEFUL LIFE"
            value={`${rul.toFixed(0)} h`}
            subtitle="Estimated operating hours"
            type="blue"
            icon={<Gauge size={14} />}
          />

          <SummaryCard
            title="ACTIVE CONDITION"
            value={scenario === "normal" ? "NORMAL" : faultName}
            subtitle={`Subsystem: ${subsystem}`}
            type="amber"
            icon={
              severity === "normal" ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertTriangle size={14} />
              )
            }
          />

          <SummaryCard
            title="SENSOR NETWORK"
            value={`${sensors.length}/32`}
            subtitle={`${affectedSensors.length} directly affected`}
            type="violet"
            icon={<Cpu size={14} />}
          />
        </section>

        {/* MAIN AREA */}
        <section className="primary-grid">
          {/* DIGITAL TWIN */}
          <div className="aero-panel twin-panel">
            <div className="panel-title">
              <div>
                <div className="section-kicker">3D VISUALIZATION</div>
                <h2>Digital Twin</h2>
                <p>Live engine state and fault localization</p>
              </div>

              <div className={`severity-tag ${severity}`}>
                {severityLabel(severity)}
              </div>
            </div>

            <DigitalTwin3D
              component={component}
              severity={severityLabel(severity)}
              health={health}
              rpm={Number(values.rpm || 3800)}
              cht={Number(values.cht || 112)}
              oil={Number(values.oil_pressure || 4.2)}
              vibration={Number(values.vibration || 2.2)}
              confidence={100}
              xrayMode={xrayMode}
              showComponents={showComponents}
              faultId={scenario}
            />

            <div className="twin-tools">
              <button
                className={xrayMode ? "on" : ""}
                onClick={() => setXrayMode((v) => !v)}
              >
                X-RAY
              </button>

              <button
                className={showComponents ? "on" : ""}
                onClick={() => setShowComponents((v) => !v)}
              >
                LABELS
              </button>

              <span>
                <i className={connected ? "connected" : ""} />
                LIVE MODEL
              </span>
            </div>
          </div>

          {/* TELEMETRY */}
          <div className="aero-panel live-panel">
            <div className="panel-title">
              <div>
                <div className="section-kicker">TELEMETRY STREAM</div>
                <h2>Live Sensor Analysis</h2>
                <p>Backend telemetry sampled every second</p>
              </div>

              <div className="live-pill">
                <i className={connected ? "connected" : ""} />
                LIVE
              </div>
            </div>

            <div className="live-stat">
              <small>{selectedSensor.name}</small>

              <b>
                {currentMetricValue.toFixed(2)}{" "}
                <small>{selectedSensor.unit}</small>
              </b>
            </div>

            <div className="metric-tabs">
              {[
                ["rpm", "RPM"],
                ["vibration", "VIB"],
                ["cht", "CHT"],
                ["oil_pressure", "OIL"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={metric === id ? "active" : ""}
                  onClick={() => setMetric(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="aero-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid
                    stroke="#20303c"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 8, fill: "#738491" }}
                    hide
                  />

                  <YAxis
                    tick={{ fontSize: 8, fill: "#738491" }}
                    width={35}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#0d1924",
                      border: "1px solid #29404e",
                      fontSize: "10px",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4bd8b2"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="quick-values">
              <div className="quick-item">
                <Gauge size={13} />

                <span>RPM</span>
                <b>{Number(values.rpm ?? 0).toFixed(0)}</b>
              </div>

              <div className="quick-item">
                <Thermometer size={13} />

                <span>CHT</span>
                <b>{Number(values.cht ?? 0).toFixed(1)} °C</b>
              </div>

              <div className="quick-item">
                <Zap size={13} />

                <span>OIL</span>
                <b>{Number(values.oil_pressure ?? 0).toFixed(2)} bar</b>
              </div>
            </div>

            <div className="condition-note">
              <span>Mission Advisory</span>
              <b>{advisoryFor(severity)}</b>
            </div>

            <div className="condition-note">
              <span>Localized Component</span>
              <b>{component}</b>
            </div>
          </div>
        </section>

        {/* SENSOR NETWORK */}
        <section className="aero-panel sensor-panel">
          <div className="panel-title">
            <div>
              <div className="section-kicker">ENGINE SENSOR NETWORK</div>

              <h2>
                32 Live Sensors
                <i className="sensor-count">{sensors.length}</i>
              </h2>

              <p>
                Directly affected sensors are highlighted for the
                active scenario.
              </p>
            </div>

            <div className="sensor-search">
              <Search size={12} />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sensor..."
              />
            </div>
          </div>

          <div className="sensor-grid">
            {visibleSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                value={values[sensor.id]}
                scenario={scenario}
              />
            ))}
          </div>

          <div className="panel-foot">
            <span>
              {affectedSensors.length > 0
                ? `${affectedSensors.length} sensors responding to ${faultName}`
                : "All systems operating within nominal condition"}
            </span>

            <span>
              <i className={connected ? "connected" : ""} />
              {connected ? "Telemetry stream active" : "Waiting for backend"}
            </span>
          </div>
        </section>

        {/* FAULT SCENARIOS */}
        <section className="aero-panel faults-panel">
          <div className="panel-title">
            <div>
              <div className="section-kicker">FAULT INJECTION & DIAGNOSIS</div>

              <h2>Engine Fault Scenarios</h2>

              <p>
                Select a scenario and observe the telemetry, health
                assessment and 3D twin response.
              </p>
            </div>

            <div className="scenario-count">
              {faults.length - 1} FAULTS
            </div>
          </div>

          <div className="fault-grid">
            {filteredFaults.map((fault) => {
              const selected = fault.id === scenario;

              return (
                <button
                  key={fault.id}
                  disabled={busy}
                  className={`fault-choice ${
                    selected ? "selected" : ""
                  } ${fault.id === "normal" ? "normal-choice" : ""}`}
                  onClick={() => chooseScenario(fault.id)}
                >
                  <i />

                  <span>{fault.name}</span>

                  {selected && <CheckCircle2 size={12} />}
                </button>
              );
            })}
          </div>

          <div className="fault-help">
            <ShieldAlert size={12} />

            <span>
              Active: <b>{faultName}</b> · {subsystem} ·{" "}
              {affectedSensors.length} directly affected sensors
            </span>
          </div>
        </section>

        <footer className="aero-footer">
          <span>AeroTwin AI · MALE UAV Engine Digital Twin</span>

          <span>
            <BatteryCharging size={10} />
            API: {API}
          </span>
        </footer>
      </main>
    </div>
  );
}