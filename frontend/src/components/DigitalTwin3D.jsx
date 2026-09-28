import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import EngineModel from "./EngineModel";
import "./DigitalTwin.css";

export default function DigitalTwin3D({
  component,
  severity,
  health,
  rpm,
  cht,
  oil,
  vibration,
  confidence,
  xrayMode,
  showComponents,
  faultId
}){
  return (

    <div className="twin3d">

      <div className="twinHeader">

        <div>
          <h2>🧠 AeroTwin AI — Live Digital Twin</h2>
          <p>Live holographic aircraft engine</p>
        </div>

        <span className={`badge ${severity.toLowerCase()}`}>
          {severity}
        </span>

      </div>

      <Canvas
        camera={{
          position: [0, 1.6, 4.5],
          fov: 30
        }}
      >

       <ambientLight intensity={0.35} />

<directionalLight
  position={[3,4,2]}
  intensity={1.5}
  color="#7dd3fc"
/>

<pointLight
  position={[0,2,0]}
  intensity={2}
  color="#00d4ff"
/>

<pointLight
  position={[0,-1,0]}
  intensity={1.2}
  color="#2563eb"
/>

        <Environment preset="city" />

       <EngineModel
  component={component}
  severity={severity}
  health={health}
  rpm={rpm}
  cht={cht}
  oil={oil}
  vibration={vibration}
  confidence={confidence}
  xrayMode={xrayMode}
  showComponents={showComponents}
  faultId={faultId}
/>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.8}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.3}
        />

      </Canvas>

      <div className="twinBottom">

        <div>
          <small>Fault Location</small>
          <h3>{component}</h3>
        </div>

        <div>
          <small>Engine Health</small>
          <h3>{health}%</h3>
        </div>

      </div>

    </div>

  );

}