import "./DigitalTwin.css";

export default function DigitalTwin({
  mission,
  severity,
  component,
  health
}) {

  // =====================================================
  // FAULT STATES
  // =====================================================

  const bearingFault =
    mission === "bearing" && severity !== "NORMAL";

  const hotFault =
    mission === "hot" && severity !== "NORMAL";

  const oilFault =
    mission === "oil" && severity !== "NORMAL";

  // =====================================================
  // ANIMATION SPEED
  // =====================================================

  const turbineSpeed = Math.max(1.5, health / 18);

  const fanSpeed =
    Math.max(0.8, health / 35);

  // =====================================================
  // SVG
  // =====================================================

  return (
    <div className="twin-card">

      {/* HEADER */}
      <div className="twin-top">

        <div>
          <h2>🧠 Live Digital Twin</h2>
          <p className="twin-subtitle">
            Real-time virtual engine representation
          </p>
        </div>

        <div className={`twin-state ${severity.toLowerCase()}`}>
          {severity}
        </div>

      </div>


      {/* =================================================
          ENGINE SVG
      ================================================= */}

      <div className="engine-container">

        <svg
          viewBox="0 0 1000 360"
          className="engine-svg"
        >

          {/* =================================================
              MAIN ENGINE BODY
          ================================================= */}

          <path
            d="
              M 130 105
              H 760
              Q 820 105 850 145
              Q 820 215 760 255
              H 130
              Z
            "
            className="engine-body"
          />


          {/* =================================================
              FAN HOUSING
          ================================================= */}

          <circle
            cx="100"
            cy="180"
            r="78"
            className="component-normal"
          />

          {/* Rotating Fan */}

          <g>

            {[...Array(8)].map((_, i) => (

              <path
                key={i}
                d="
                  M 100 180
                  C 108 162, 125 143, 112 132
                  C 96 145, 91 165, 100 180
                "
                fill="#7dd3fc"
                opacity="0.95"
                transform={`rotate(${i * 45} 100 180)`}
              />

            ))}

            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 180"
              to="360 100 180"
              dur={`${fanSpeed}s`}
              repeatCount="indefinite"
            />

          </g>

          {/* Fan Hub */}

          <circle
            cx="100"
            cy="180"
            r="13"
            fill="#38bdf8"
          />

          <circle
            cx="100"
            cy="180"
            r="5"
            fill="#07172b"
          />

          <text
            x="100"
            y="290"
            className="component-label"
          >
            FAN
          </text>


          {/* =================================================
              COMPRESSOR
          ================================================= */}

          <g>

            <rect
              x="190"
              y="110"
              width="180"
              height="140"
              rx="25"
              className="component-normal"
            />

            {/* Compressor stages */}

            {[...Array(9)].map((_, i) => (

              <line
                key={i}
                x1={210 + i * 18}
                y1="125"
                x2={210 + i * 18}
                y2="235"
                stroke="#60a5fa"
                strokeWidth="3"
              />

            ))}

            <text
              x="280"
              y="290"
              className="component-label"
            >
              COMPRESSOR
            </text>

          </g>


          {/* =================================================
              OIL LINE
          ================================================= */}

          <path
            d="M 370 90 H 650"
            className={
              oilFault
                ? "oil-line oil-fault"
                : "oil-line"
            }
          />

          {/* Oil warning marker */}

          {oilFault && (

            <g className="fault-marker">

              <circle
                cx="500"
                cy="90"
                r="15"
                fill="#2563eb"
              />

              <text
                x="500"
                y="96"
                textAnchor="middle"
                fill="white"
                fontSize="18"
                fontWeight="bold"
              >
                !
              </text>

            </g>

          )}


          {/* =================================================
              COMBUSTION CHAMBER
          ================================================= */}

          <g>

            <rect
              x="400"
              y="125"
              width="150"
              height="110"
              rx="18"
              className={
                hotFault
                  ? "component-hot"
                  : "component-normal"
              }
            />

            {/* Flame */}

            <g className={hotFault ? "flame-hot" : "flame"}>

              <path
                d="
                  M 425 205
                  L 440 165
                  L 455 195
                  L 470 150
                  L 490 200
                  L 510 165
                  L 525 205
                "
                fill="none"
                stroke="#f59e0b"
                strokeWidth="7"
              />

            </g>

            {/* Hot fault marker */}

            {hotFault && (

              <g className="fault-marker">

                <circle
                  cx="475"
                  cy="130"
                  r="14"
                  fill="#f97316"
                />

                <text
                  x="475"
                  y="136"
                  textAnchor="middle"
                  fill="white"
                  fontSize="17"
                  fontWeight="bold"
                >
                  !
                </text>

              </g>

            )}

            <text
              x="475"
              y="290"
              className="component-label"
            >
              COMBUSTION
            </text>

          </g>


          {/* =================================================
              TURBINE / BEARING
          ================================================= */}

          <g>

            <circle
              cx="660"
              cy="180"
              r="70"
              className={
                bearingFault
                  ? "component-bearing-fault"
                  : "component-normal"
              }
            />

            {/* Rotating turbine */}

            <g>

              {[...Array(16)].map((_, i) => (

                <line
                  key={i}
                  x1="660"
                  y1="180"
                  x2="715"
                  y2="180"
                  stroke={
                    bearingFault
                      ? "#ef4444"
                      : "#38bdf8"
                  }
                  strokeWidth="3"
                  transform={`rotate(${i * 22.5} 660 180)`}
                />

              ))}

              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 660 180"
                to="360 660 180"
                dur={`${turbineSpeed}s`}
                repeatCount="indefinite"
              />

            </g>

            {/* Center */}

            <circle
              cx="660"
              cy="180"
              r="12"
              fill={
                bearingFault
                  ? "#ef4444"
                  : "#38bdf8"
              }
            />


            {/* Bearing Fault Marker */}

            {bearingFault && (

              <g className="fault-marker">

                <circle
                  cx="660"
                  cy="110"
                  r="16"
                  fill="#ef4444"
                />

                <text
                  x="660"
                  y="116"
                  textAnchor="middle"
                  fill="white"
                  fontSize="20"
                  fontWeight="bold"
                >
                  !
                </text>

              </g>

            )}

            <text
              x="660"
              y="290"
              className="component-label"
            >
              TURBINE / BEARING
            </text>

          </g>


          {/* =================================================
              EXHAUST
          ================================================= */}

          <g>

            <rect
              x="750"
              y="145"
              width="150"
              height="70"
              rx="35"
              className="component-normal"
            />

            <path
              d="M 900 180 H 965"
              stroke="#38bdf8"
              strokeWidth="5"
              strokeDasharray="10 10"
            />

            <text
              x="825"
              y="290"
              className="component-label"
            >
              EXHAUST
            </text>

          </g>


          {/* =================================================
              FAULT CONNECTOR
          ================================================= */}

          {bearingFault && (

            <text
              x="660"
              y="45"
              className="fault-text bearing-text"
            >
              ⚠ BEARING FAULT
            </text>

          )}

          {hotFault && (

            <text
              x="475"
              y="45"
              className="fault-text hot-text"
            >
              ⚠ OVERHEATING
            </text>

          )}

          {oilFault && (

            <text
              x="500"
              y="55"
              className="fault-text oil-text"
            >
              ⚠ OIL SYSTEM FAULT
            </text>

          )}

        </svg>

      </div>


      {/* =================================================
          DIGITAL TWIN INFORMATION
      ================================================= */}

      <div className="twin-info">

        <div className="twin-info-box">

          <span>FAULT LOCATION</span>

          <strong>
            {component}
          </strong>

        </div>


        <div className="twin-info-box">

          <span>ENGINE HEALTH</span>

          <strong>
            {health}%
          </strong>

        </div>


        <div className="twin-info-box">

          <span>SCENARIO</span>

          <strong>
            {mission.toUpperCase()}
          </strong>

        </div>

      </div>

    </div>
  );
}