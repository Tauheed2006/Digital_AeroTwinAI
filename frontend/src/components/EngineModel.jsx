import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";

function CylinderHead({ side, hot }) {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0, side * (-0.17 + i * 0.02)]}
        >
          <boxGeometry args={[0.42, 0.012, 0.30]} />
          <meshStandardMaterial
            color="#cbd5e1"
            emissive={hot ? "#ff5500" : "#38bdf8"}
            emissiveIntensity={hot ? 1 : 0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function EngineModel({
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
  faultId,
}) {
  const isBearingFault =
    component === "Turbine Bearing Assembly";

  /* =========================================================
     MAIN REFERENCES
  ========================================================= */

  const engine = useRef();
  const prop = useRef();
  const scanRing = useRef();
  const core = useRef();

  const leftCylinder = useRef();
  const rightCylinder = useRef();

  const bearing = useRef();
  const xrayBearing = useRef();
  const internalCrank = useRef();

  const oilPipe = useRef();
  const particles = useRef([]);
  const crank = useRef();

  /* =========================================================
     COMPONENT REFERENCES
  ========================================================= */

  const cooling = useRef();
  const fuelSystem = useRef();
  const ecu = useRef();
  const airFilter = useRef();
  const combustion = useRef();
  const propHub = useRef();

  /* =========================================================
     ANIMATION
  ========================================================= */

  useFrame((state) => {
    if (
      !engine.current ||
      !leftCylinder.current ||
      !rightCylinder.current ||
      !bearing.current ||
      !crank.current ||
      !oilPipe.current ||
      !prop.current ||
      !cooling.current ||
      !fuelSystem.current ||
      !ecu.current ||
      !airFilter.current ||
      !combustion.current ||
      !propHub.current
    ) {
      return;
    }

    const t = state.clock.elapsedTime;

    /* =======================================================
       BEARING
    ======================================================= */

    if (bearing.current) {
      if (isBearingFault) {
        const glow = 2 + Math.sin(t * 8) * 1.2;
        bearing.current.material.emissiveIntensity = glow;
      } else {
        bearing.current.material.emissiveIntensity = 0;
      }
    }

    /* =======================================================
       OIL PIPE
    ======================================================= */

    if (oilPipe.current && oilPipe.current.material) {
      if (component === "Lubrication Oil Line") {
        oilPipe.current.material.emissiveIntensity =
          1 + Math.sin(t * 8);
      } else {
        oilPipe.current.material.emissiveIntensity = 0.25;
      }
    }

    /* =======================================================
       FAULT LOCALIZATION
    ======================================================= */

    // DigitalTwin3D passes severity in lowercase.
    const active = String(severity || "").toLowerCase() !== "normal";

    const faultPulse =
      1.4 + Math.sin(t * 7) * 0.8;

    const isCooling =
      component === "Cooling System";

    const isFuel =
      component === "Fuel System" ||
      component === "Fuel Injector";

    const isElectrical =
      component === "ECU Controller";

    const isAir =
      component === "Air Intake Filter";

    const isProp =
      component === "Propeller / Engine Shaft";

    const isCombustion =
      component === "Combustion Chamber";

    const isMechanical =
      component === "Crankshaft / Bearing";

    /* =======================================================
       GLOW FUNCTION
    ======================================================= */

    const setGlow = (
      ref,
      enabled,
      color = "#ff3030"
    ) => {
      if (!ref.current?.material) return;

      ref.current.material.emissive.set(
        enabled ? color : "#000000"
      );

      ref.current.material.emissiveIntensity =
        enabled ? faultPulse : 0.15;
    };

    /* =======================================================
       COMPONENT GLOWS
    ======================================================= */

    setGlow(
      cooling,
      active && isCooling,
      "#ff8a00"
    );

    setGlow(
      fuelSystem,
      active && isFuel,
      "#ff3030"
    );

    setGlow(
      ecu,
      active && isElectrical,
      "#ff3030"
    );

    setGlow(
      airFilter,
      active && isAir,
      "#ff3030"
    );

    setGlow(
      combustion,
      active && isCombustion,
      "#ff5500"
    );

    setGlow(
      propHub,
      active && isProp,
      "#ff3030"
    );

    /* =======================================================
       MECHANICAL FAULT
    ======================================================= */

    if (isMechanical && active) {
      crank.current.rotation.z =
        Math.sin(t * 18) * 0.025;
    } else {
      crank.current.rotation.z = 0;
    }

    /* =======================================================
       PROPELLER FAULT
    ======================================================= */

    if (active && isProp) {
      const propPulse =
        1 + Math.sin(t * 10) * 0.04;

      propHub.current.scale.setScalar(
        propPulse
      );
    } else {
      propHub.current.scale.setScalar(1);
    }

    /* =======================================================
       COOLING FAULT
    ======================================================= */

    if (
      active &&
      component === "Cooling System"
    ) {
      cooling.current.rotation.z =
        Math.sin(t * 5) * 0.04;
    } else {
      cooling.current.rotation.z = 0;
    }

    /* =======================================================
       FLOATING ENGINE
    ======================================================= */

    engine.current.position.y =
      Math.sin(t * 1.2) * 0.03;

    /* =======================================================
       PROPELLER ROTATION
    ======================================================= */

    const safeRPM = Number.isFinite(Number(rpm))
      ? Number(rpm)
      : 3800;

    const speed = THREE.MathUtils.lerp(
      0.02,
      0.28,
      Math.max(0, Math.min(1, safeRPM / 6500))
    );

    prop.current.rotation.x += speed;

    /* =======================================================
       X-RAY INTERNAL CRANKSHAFT
    ======================================================= */

    if (
      xrayMode &&
      internalCrank.current
    ) {
      internalCrank.current.rotation.x +=
        speed * 0.85;
    }

    /* =======================================================
       X-RAY BEARING
    ======================================================= */

    if (xrayBearing.current?.material) {
      xrayBearing.current.material.emissiveIntensity =
        xrayMode && isBearingFault
          ? 2.5 + Math.sin(t * 8) * 1.2
          : 0.15;
    }

    /* =======================================================
       DEFAULT POSITIONS
    ======================================================= */

    leftCylinder.current.position.x = -0.82;
    rightCylinder.current.position.x = 0.82;

    bearing.current.position.x = -1.08;

    crank.current.position.y = 0.25;

    oilPipe.current.position.y = -0.12;

    /* =======================================================
       COMBUSTION FAULT
    ======================================================= */

    if (
      component === "Combustion Chamber"
    ) {
      leftCylinder.current.position.x =
        -1.18;

      rightCylinder.current.position.x =
        1.18;
    }

    /* =======================================================
       OIL LEAK
    ======================================================= */

    if (
      component === "Lubrication Oil Line"
    ) {
      oilPipe.current.position.y = -0.35;
    }

    /* =======================================================
       OIL FLOW PARTICLES
    ======================================================= */

    particles.current.forEach((p, i) => {
      if (!p) return;

      if (
        component ===
        "Lubrication Oil Line"
      ) {
        p.position.x += 0.012;

        if (p.position.x > 0.55) {
          p.material.opacity =
            Math.max(
              0,
              p.material.opacity - 0.03
            );
        } else {
          p.material.opacity =
            Math.min(
              1,
              p.material.opacity + 0.08
            );
        }

        if (p.position.x > 0.7) {
          p.position.x = -0.65;
          p.material.opacity = 1;
        }
      } else {
        p.material.opacity = 0;

        p.position.x =
          -0.65 + i * 0.18;
      }
    });
  });

  /* =========================================================
     COLORS
  ========================================================= */

  const cylColor =
    component === "Combustion Chamber"
      ? "#ff6b35"
      : "#cbd5e1";

  const oilColor =
    component === "Lubrication Oil Line"
      ? "#00d4ff"
      : "#cbd5e1";

  const bearingColor =
    component === "Turbine Bearing Assembly"
      ? "#ff2d2d"
      : "#d1d5db";

  return (
    <group
      ref={engine}
      scale={1.35}
      rotation={[0, Math.PI, 0]}
      position={[0, -0.1, 0]}
    >
      {/* =====================================================
          AIR FILTER
      ===================================================== */}

      <mesh
        ref={airFilter}
        position={[0, 1.25, 0]}
      >
        <cylinderGeometry
          args={[0.28, 0.28, 0.45, 32]}
        />

        <meshPhysicalMaterial
          color="#7dd3fc"
          transparent
          opacity={0.45}
          roughness={0.05}
          metalness={0.9}
          transmission={0.35}
          emissive="#38bdf8"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* =====================================================
          BEARING
      ===================================================== */}

      <mesh
        ref={bearing}
        position={[-1.08, 0.25, 0]}
      >
        <cylinderGeometry
          args={[0.19, 0.19, 0.05, 32]}
        />

        <meshStandardMaterial
          color={
            isBearingFault
              ? "#ff3030"
              : "#d1d5db"
          }
          emissive={
            isBearingFault
              ? "#ff0000"
              : "#000000"
          }
          emissiveIntensity={
            isBearingFault ? 3 : 0
          }
          metalness={1}
          roughness={0.15}
        />
      </mesh>

      {/* =====================================================
          INTAKE BODY
      ===================================================== */}

      <mesh
        position={[0, 0.82, 0]}
      >
        <cylinderGeometry
          args={[0.12, 0.18, 0.32, 32]}
        />

        <meshPhysicalMaterial
          color="#94a3b8"
          metalness={1}
          roughness={0.18}
          transparent
          opacity={0.6}
          emissive="#38bdf8"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* =====================================================
          LEFT INTAKE PIPE
      ===================================================== */}

      <mesh
        position={[-0.32, 0.58, 0]}
        rotation={[0, 0, -0.65]}
      >
        <cylinderGeometry
          args={[0.035, 0.035, 0.42, 18]}
        />

        <meshStandardMaterial
          color="#7dd3fc"
        />
      </mesh>

      {/* =====================================================
          RIGHT INTAKE PIPE
      ===================================================== */}

      <mesh
        position={[0.32, 0.58, 0]}
        rotation={[0, 0, 0.65]}
      >
        <cylinderGeometry
          args={[0.035, 0.035, 0.42, 18]}
        />

        <meshStandardMaterial
          color="#7dd3fc"
        />
      </mesh>

      {/* =====================================================
          FUEL SYSTEM
      ===================================================== */}

      <mesh
        ref={fuelSystem}
        position={[0.35, 0.78, 0]}
      >
        <cylinderGeometry
          args={[0.09, 0.09, 0.34, 24]}
        />

        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.8}
          roughness={0.2}
          emissive="#000000"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* =====================================================
          COOLING SYSTEM
      ===================================================== */}

      <mesh
        ref={cooling}
        position={[0.72, 0.75, 0]}
      >
        <torusGeometry
          args={[0.18, 0.035, 16, 32]}
        />

        <meshStandardMaterial
          color="#67e8f9"
          metalness={0.8}
          roughness={0.2}
          emissive="#000000"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* =====================================================
          ECU
      ===================================================== */}

      <mesh
        ref={ecu}
        position={[-0.35, 0.78, 0]}
      >
        <boxGeometry
          args={[0.18, 0.3, 0.24]}
        />

        <meshPhysicalMaterial
          color="#7dd3fc"
          transparent
          opacity={0.45}
          roughness={0.05}
          metalness={0.9}
          transmission={0.35}
          emissive="#38bdf8"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* =====================================================
          CRANK
      ===================================================== */}

      <group
        ref={crank}
        position={[0, 0.25, 0]}
      >
        {/* Main rounded body */}

        <mesh>
          <capsuleGeometry
            args={[0.24, 0.42, 8, 24]}
          />

          <meshPhysicalMaterial
            color="#cfd8dc"
            metalness={1}
            roughness={0.08}
            transparent
            opacity={
              xrayMode ? 0.18 : 0.58
            }
            transmission={
              xrayMode ? 0.9 : 0.25
            }
            emissive="#38bdf8"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Front cover */}

        <mesh position={[0.28, 0, 0]}>
          <cylinderGeometry
            args={[0.19, 0.19, 0.05, 32]}
          />

          <meshStandardMaterial
            color="#d1d5db"
          />
        </mesh>

        {/* Rear cover */}

        <mesh position={[-0.28, 0, 0]}>
          <cylinderGeometry
            args={[0.19, 0.19, 0.05, 32]}
          />

          <meshStandardMaterial
            color="#d1d5db"
          />
        </mesh>

        {/* =================================================
            X-RAY INTERNAL ASSEMBLY
        ================================================= */}

        {xrayMode && (
          <group ref={internalCrank}>
            {/* Main internal crankshaft */}

            <mesh
              rotation={[0, Math.PI / 2, 0]}
            >
              <cylinderGeometry
                args={[0.055, 0.055, 1.15, 24]}
              />

              <meshStandardMaterial
                color="#e2e8f0"
                metalness={1}
                roughness={0.18}
                emissive="#38bdf8"
                emissiveIntensity={0.65}
              />
            </mesh>

            {/* Crank webs */}

            <mesh
              position={[-0.28, 0, 0]}
            >
              <cylinderGeometry
                args={[0.18, 0.18, 0.07, 32]}
              />

              <meshStandardMaterial
                color="#94a3b8"
                metalness={1}
                roughness={0.2}
                emissive="#38bdf8"
                emissiveIntensity={0.35}
              />
            </mesh>

            <mesh
              position={[0.28, 0, 0]}
            >
              <cylinderGeometry
                args={[0.18, 0.18, 0.07, 32]}
              />

              <meshStandardMaterial
                color="#94a3b8"
                metalness={1}
                roughness={0.2}
                emissive="#38bdf8"
                emissiveIntensity={0.35}
              />
            </mesh>

            {/* Internal bearing */}

            <mesh
              ref={xrayBearing}
              position={[-0.48, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry
                args={[0.12, 0.035, 16, 32]}
              />

              <meshStandardMaterial
                color={
                  isBearingFault
                    ? "#ff3030"
                    : "#d1d5db"
                }
                emissive={
                  isBearingFault
                    ? "#ff0000"
                    : "#38bdf8"
                }
                emissiveIntensity={
                  isBearingFault ? 2.5 : 0.15
                }
                metalness={1}
                roughness={0.15}
              />
            </mesh>

            <mesh
              position={[0.48, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry
                args={[0.12, 0.035, 16, 32]}
              />

              <meshStandardMaterial
                color="#d1d5db"
                emissive="#38bdf8"
                emissiveIntensity={0.15}
                metalness={1}
                roughness={0.15}
              />
            </mesh>

            {/* Internal lubrication path */}

            <mesh
              position={[0, -0.17, 0.08]}
            >
              <cylinderGeometry
                args={[0.018, 0.018, 0.75, 16]}
              />

              <meshStandardMaterial
                color="#22d3ee"
                emissive="#06b6d4"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================
          CENTER LIGHT
      ===================================================== */}

      <pointLight
        position={[0, 0.25, 0]}
        color="#00d4ff"
        intensity={2.5}
        distance={4}
      />

      {/* =====================================================
          COMBUSTION
      ===================================================== */}

      <mesh
        ref={combustion}
        position={[0, 0.25, 0.38]}
      >
        <sphereGeometry
          args={[0.16, 24, 24]}
        />

        <meshStandardMaterial
          color="#fb923c"
          transparent
          opacity={0.35}
          emissive="#000000"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* =====================================================
          CYLINDER HEADS
      ===================================================== */}

      <group
        ref={leftCylinder}
        position={[-0.82, 0.25, 0]}
      >
        <CylinderHead
          side={-1}
          hot={
            component ===
            "Combustion Chamber"
          }
        />
      </group>

      <group
        ref={rightCylinder}
        position={[0.82, 0.25, 0]}
      >
        <CylinderHead
          side={1}
          hot={
            component ===
            "Combustion Chamber"
          }
        />
      </group>

      {/* =====================================================
          OIL LINE
      ===================================================== */}

      <mesh
        ref={oilPipe}
        position={[0, -0.12, 0.22]}
      >
        <cylinderGeometry
          args={[0.03, 0.03, 1.5, 18]}
        />

        <meshStandardMaterial
          color={oilColor}
          emissive={oilColor}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* =====================================================
          FLOWING OIL PARTICLES
      ===================================================== */}

      {Array.from({ length: 8 }).map(
        (_, i) => (
          <mesh
            key={i}
            ref={(el) =>
              (particles.current[i] = el)
            }
            position={[
              -0.65 + i * 0.18,
              -0.12,
              0.22,
            ]}
          >
            <sphereGeometry
              args={[0.018, 16, 16]}
            />

            <meshBasicMaterial
              color="#7dd3fc"
              transparent
              opacity={0}
            />
          </mesh>
        )
      )}

      {/* =====================================================
          LEFT EXHAUST
      ===================================================== */}

      <mesh
        position={[-0.46, -0.02, -0.18]}
        rotation={[0, 0, -0.75]}
      >
        <cylinderGeometry
          args={[0.035, 0.035, 0.38, 18]}
        />

        <meshStandardMaterial
          color="#64748b"
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[-0.22, -0.18, -0.18]}
      >
        <sphereGeometry
          args={[0.045, 18, 18]}
        />

        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={
            component ===
            "Combustion Chamber"
              ? 1.3
              : 0.3
          }
        />
      </mesh>

      {/* =====================================================
          RIGHT EXHAUST
      ===================================================== */}

      <mesh
        position={[0.46, -0.02, -0.18]}
        rotation={[0, 0, 0.75]}
      >
        <cylinderGeometry
          args={[0.035, 0.035, 0.38, 18]}
        />

        <meshStandardMaterial
          color="#64748b"
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[0.22, -0.18, -0.18]}
      >
        <sphereGeometry
          args={[0.045, 18, 18]}
        />

        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={
            component ===
            "Combustion Chamber"
              ? 1.3
              : 0.3
          }
        />
      </mesh>

      {/* =====================================================
          REAL UAV PROPELLER HUB
      ===================================================== */}

      <group
        ref={prop}
        position={[1.18, 0.25, 0]}
      >
        {/* Main Shaft */}

        <mesh
          rotation={[0, Math.PI / 2, 0]}
        >
          <cylinderGeometry
            args={[0.05, 0.05, 0.42, 32]}
          />

          <meshStandardMaterial
            color="#64748b"
            metalness={1}
            roughness={0.15}
          />
        </mesh>

        {/* Mounting Flange */}

        <mesh
          rotation={[0, Math.PI / 2, 0]}
        >
          <cylinderGeometry
            args={[0.24, 0.24, 0.08, 48]}
          />

          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.95}
            roughness={0.18}
          />
        </mesh>

        {/* Center Cap */}

        <mesh
          ref={propHub}
          position={[0.03, 0, 0]}
        >
          <sphereGeometry
            args={[0.055, 32, 32]}
          />

          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Mounting Bolts */}

        {[0, 60, 120, 180, 240, 300].map(
          (deg) => {
            const r = 0.15;
            const rad =
              (deg * Math.PI) / 180;

            return (
              <mesh
                key={deg}
                position={[
                  0,
                  Math.cos(rad) * r,
                  Math.sin(rad) * r,
                ]}
                rotation={[
                  0,
                  Math.PI / 2,
                  0,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.012,
                    0.012,
                    0.045,
                    16,
                  ]}
                />

                <meshStandardMaterial
                  color="#111827"
                />
              </mesh>
            );
          }
        )}

        {/* Holographic Ring */}

        <mesh
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry
            args={[0.19, 0.008, 16, 80]}
          />

          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Motion Ring */}

        <mesh
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry
            args={[0.24, 0.003, 12, 100]}
          />

          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={
              Number(rpm) > 4500
                ? 0.55
                : 0.18
            }
          />
        </mesh>
      </group>

      {/* =====================================================
          HOLOGRAM WIREFRAME
      ===================================================== */}

      <group scale={1.01}>
        <mesh
          position={[0, 0.25, 0]}
        >
          <boxGeometry
            args={[0.95, 0.55, 0.55]}
          />

          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>

        <mesh
          position={[-0.82, 0.25, 0]}
          rotation={[
            0,
            0,
            Math.PI / 2,
          ]}
        >
          <cylinderGeometry
            args={[0.26, 0.26, 0.48, 24]}
          />

          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>

        <mesh
          position={[0.82, 0.25, 0]}
          rotation={[
            0,
            0,
            Math.PI / 2,
          ]}
        >
          <cylinderGeometry
            args={[0.26, 0.26, 0.48, 24]}
          />

          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>

        {/* =================================================
            LIVE SENSOR HUD
        ================================================= */}

        {/* RPM */}

        <Billboard
          position={[0, 1.85, 0]}
        >
          <group>
            <mesh>
              <planeGeometry
                args={[0.9, 0.28]}
              />

              <meshBasicMaterial
                color="#082f49"
                transparent
                opacity={0.85}
              />
            </mesh>

            <Text
              fontSize={0.06}
              color="#67e8f9"
              position={[
                0,
                0.05,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              RPM
            </Text>

            <Text
              fontSize={0.09}
              color="white"
              position={[
                0,
                -0.04,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              {`${rpm}`}
            </Text>
          </group>
        </Billboard>

        {/* CHT */}

        <Billboard
          position={[-1.45, 0.65, 0]}
        >
          <group>
            <mesh>
              <planeGeometry
                args={[0.78, 0.28]}
              />

              <meshBasicMaterial
                color="#431407"
                transparent
                opacity={0.82}
              />
            </mesh>

            <Text
              fontSize={0.055}
              color="#fdba74"
              position={[
                0,
                0.05,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              CHT
            </Text>

            <Text
              fontSize={0.085}
              color="white"
              position={[
                0,
                -0.04,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              {`${cht}°C`}
            </Text>
          </group>
        </Billboard>

        {/* OIL */}

        <Billboard
          position={[1.45, 0.65, 0]}
        >
          <group>
            <mesh>
              <planeGeometry
                args={[0.82, 0.28]}
              />

              <meshBasicMaterial
                color="#082f49"
                transparent
                opacity={0.82}
              />
            </mesh>

            <Text
              fontSize={0.055}
              color="#7dd3fc"
              position={[
                0,
                0.05,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              OIL
            </Text>

            <Text
              fontSize={0.085}
              color="white"
              position={[
                0,
                -0.04,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              {`${oil} PSI`}
            </Text>
          </group>
        </Billboard>

        {/* AI CONFIDENCE */}

        <Billboard
          position={[0, -1.05, 0]}
        >
          <group>
            <mesh>
              <planeGeometry
                args={[1.15, 0.34]}
              />

              <meshBasicMaterial
                color="#2e1065"
                transparent
                opacity={0.82}
              />
            </mesh>

            <Text
              fontSize={0.055}
              color="#c4b5fd"
              position={[
                0,
                0.06,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              AI CONFIDENCE
            </Text>

            <Text
              fontSize={0.09}
              color="white"
              position={[
                0,
                -0.05,
                0.01,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              {`${confidence}%`}
            </Text>
          </group>
        </Billboard>

        {/* =================================================
            15-FAULT VISUAL LOCALIZATION
        ================================================= */}

        {String(severity || "").toLowerCase() !==
          "normal" && (
          <>
            <mesh
              position={
                component.includes(
                  "Bearing"
                ) ||
                component.includes(
                  "Crankshaft"
                )
                  ? [
                      -1.08,
                      0.25,
                      0.32,
                    ]
                  : component.includes(
                        "Oil"
                      )
                    ? [
                        0,
                        -0.35,
                        0.35,
                      ]
                    : component.includes(
                          "Combustion"
                        ) ||
                        component.includes(
                          "Injector"
                        )
                      ? [
                          0,
                          0.25,
                          0.34,
                        ]
                      : component.includes(
                            "Cooling"
                          )
                        ? [
                            0.72,
                            0.75,
                            0.28,
                          ]
                        : component.includes(
                              "Fuel"
                            )
                          ? [
                              0.35,
                              0.78,
                              0.34,
                            ]
                          : component.includes(
                                "ECU"
                              )
                            ? [
                                -0.35,
                                0.78,
                                0.34,
                              ]
                            : component.includes(
                                  "Air Intake"
                                )
                              ? [
                                  0,
                                  1.25,
                                  0.34,
                                ]
                              : component.includes(
                                    "Propeller"
                                  )
                                ? [
                                    1.18,
                                    0.25,
                                    0.34,
                                  ]
                                : [
                                    0,
                                    0.25,
                                    0.38,
                                  ]
              }
            >
              <sphereGeometry
                args={[0.09, 20, 20]}
              />

              <meshStandardMaterial
                color="#ff3030"
                emissive="#ff0000"
                emissiveIntensity={2.5}
                transparent
                opacity={0.95}
              />
            </mesh>

            <Billboard
              position={[
                0,
                1.45,
                0.45,
              ]}
            >
              <Text
                fontSize={0.075}
                color="#ff4d4d"
                anchorX="center"
              >
                {`⚠ ${component} FAULT`}
              </Text>
            </Billboard>
          </>
        )}

        {/* =================================================
            COMPONENT LABELS
        ================================================= */}

        {showComponents && (
          <>
            {/* Air Filter */}

            <Billboard
              position={[0, 1.65, 0]}
            >
              <Text
                fontSize={0.06}
                color="#7dd3fc"
              >
                Air Intake Filter
              </Text>
            </Billboard>

            {/* ECU */}

            <Billboard
              position={[
                -0.55,
                1.05,
                0,
              ]}
            >
              <Text
                fontSize={0.055}
                color="#7dd3fc"
              >
                ECU Controller
              </Text>
            </Billboard>

            {/* Left Cylinder */}

            <Billboard
              position={[
                -1.25,
                0.55,
                0,
              ]}
            >
              <Text
                fontSize={0.055}
                color="#7dd3fc"
              >
                Left Cylinder
              </Text>
            </Billboard>

            {/* Right Cylinder */}

            <Billboard
              position={[
                1.25,
                0.55,
                0,
              ]}
            >
              <Text
                fontSize={0.055}
                color="#7dd3fc"
              >
                Right Cylinder
              </Text>
            </Billboard>

            {/* Crankcase */}

            <Billboard
              position={[
                0,
                -0.35,
                0,
              ]}
            >
              <Text
                fontSize={0.06}
                color="#7dd3fc"
              >
                Crankcase
              </Text>
            </Billboard>

            {/* Oil Line */}

            <Billboard
              position={[
                0,
                -0.72,
                0.25,
              ]}
            >
              <Text
                fontSize={0.055}
                color="#7dd3fc"
              >
                Lubrication Oil Line
              </Text>
            </Billboard>

            {/* Propeller Hub */}

            <Billboard
              position={[
                1.55,
                0.2,
                0,
              ]}
            >
              <Text
                fontSize={0.055}
                color="#7dd3fc"
              >
                Propeller Hub
              </Text>
            </Billboard>
          </>
        )}
      </group>
    </group>
  );
}