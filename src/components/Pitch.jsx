import { useMemo, useRef, useState } from "react";

const FIELD_WIDTH = 100;
const FIELD_HEIGHT = 140;
const PLAYER_RADIUS = 3.8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPoint(bounds, clientX, clientY) {
  const x = ((clientX - bounds.left) / bounds.width) * FIELD_WIDTH;
  const y = ((clientY - bounds.top) / bounds.height) * FIELD_HEIGHT;

  return {
    x: clamp(x, 2, FIELD_WIDTH - 2),
    y: clamp(y, 2, FIELD_HEIGHT - 2),
  };
}

export default function Pitch({
  frame,
  selected,
  authorMode,
  onSelect,
  onMove,
  frameLabel,
}) {
  const svgRef = useRef(null);
  const [hoverLabel, setHoverLabel] = useState(null);
  const dragRef = useRef(null);

  const selectedArrow = useMemo(() => {
    if (selected?.kind !== "arrowStart" && selected?.kind !== "arrowEnd" && selected?.kind !== "arrow") {
      return null;
    }

    return frame.arrows.find((arrow) => arrow.id === selected.id) ?? null;
  }, [frame.arrows, selected]);

  function beginDrag(event, payload) {
    if (!authorMode) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = payload;
  }

  function handlePointerMove(event) {
    if (!authorMode || !dragRef.current || !svgRef.current) {
      return;
    }

    const point = getPoint(svgRef.current.getBoundingClientRect(), event.clientX, event.clientY);
    onMove(dragRef.current, point);
  }

  function stopDrag() {
    dragRef.current = null;
  }

  function renderPlayer(player, team) {
    const isSelected =
      selected?.kind === team && selected.id === player.id;
    const fill = team === "homePlayer" ? "#a7f3d0" : "#fecaca";
    const stroke = team === "homePlayer" ? "#0f766e" : "#b91c1c";

    return (
      <g
        key={player.id}
        className={authorMode ? "pitch-entity editable" : "pitch-entity"}
        tabIndex={0}
        onPointerDown={(event) => beginDrag(event, { kind: team, id: player.id })}
        onClick={() => onSelect({ kind: team, id: player.id })}
        onMouseEnter={() => setHoverLabel(player.label)}
        onMouseLeave={() => setHoverLabel(null)}
        onFocus={() => setHoverLabel(player.label)}
        onBlur={() => setHoverLabel(null)}
      >
        <circle
          cx={player.x}
          cy={player.y}
          r="4.7"
          fill="rgba(0,0,0,0.18)"
          style={{ transition: "cx 400ms ease, cy 400ms ease" }}
        />
        <circle
          cx={player.x}
          cy={player.y}
          r={PLAYER_RADIUS}
          fill={fill}
          stroke={isSelected ? "#111827" : stroke}
          strokeWidth={isSelected ? "1.2" : "0.8"}
          style={{ transition: "cx 400ms ease, cy 400ms ease" }}
        />
        <text
          x={player.x}
          y={player.y + 1}
          textAnchor="middle"
          className="player-label"
          style={{ transition: "x 400ms ease, y 400ms ease" }}
        >
          {player.label}
        </text>
      </g>
    );
  }

  return (
    <div className="pitch-shell">
      <div className="field-caption">
        <span>{frameLabel}</span>
        <span>{authorMode ? "Author Mode" : "Playback Mode"}</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        className="field-svg tall"
        role="img"
        aria-label="Soccer pitch with players, ball, and arrows"
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
        <defs>
          <linearGradient id="pitchGrass" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#347a46" />
            <stop offset="100%" stopColor="#214e31" />
          </linearGradient>
          <pattern id="pitchStripes" width="100" height="20" patternUnits="userSpaceOnUse">
            <rect width="100" height="10" fill="rgba(255,255,255,0.03)" />
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="5"
            markerHeight="5"
            refX="4.2"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#f8fafc" />
          </marker>
          <clipPath id="soccerBallClip">
            <circle cx="0" cy="0" r="2.4" />
          </clipPath>
        </defs>

        <rect x="2" y="2" width="96" height="136" rx="3" fill="url(#pitchGrass)" stroke="white" strokeWidth="1.1" />
        <rect x="2" y="2" width="96" height="136" rx="3" fill="url(#pitchStripes)" />

        <line x1="2" y1="70" x2="98" y2="70" stroke="white" strokeWidth="0.7" />
        <circle cx="50" cy="70" r="9" fill="none" stroke="white" strokeWidth="0.7" />
        <circle cx="50" cy="70" r="0.9" fill="white" />

        <rect x="21" y="2" width="58" height="16" fill="none" stroke="white" strokeWidth="0.7" />
        <rect x="31" y="2" width="38" height="7" fill="none" stroke="white" strokeWidth="0.7" />
        <rect x="21" y="122" width="58" height="16" fill="none" stroke="white" strokeWidth="0.7" />
        <rect x="31" y="131" width="38" height="7" fill="none" stroke="white" strokeWidth="0.7" />

        {frame.arrows.map((arrow) => {
          const isActive = selectedArrow?.id === arrow.id;
          return (
            <g key={arrow.id}>
              <line
                x1={arrow.x1}
                y1={arrow.y1}
                x2={arrow.x2}
                y2={arrow.y2}
                stroke={arrow.color ?? "#f8fafc"}
                strokeWidth={isActive ? "1.25" : "0.9"}
                markerEnd="url(#arrowhead)"
                onClick={() => onSelect({ kind: "arrow", id: arrow.id })}
                style={{ transition: "x1 400ms ease, y1 400ms ease, x2 400ms ease, y2 400ms ease" }}
              />
              {authorMode && isActive ? (
                <>
                  <circle
                    cx={arrow.x1}
                    cy={arrow.y1}
                    r="1.8"
                    fill="#fde68a"
                    stroke="#111827"
                    strokeWidth="0.4"
                    onPointerDown={(event) => beginDrag(event, { kind: "arrowStart", id: arrow.id })}
                  />
                  <circle
                    cx={arrow.x2}
                    cy={arrow.y2}
                    r="1.8"
                    fill="#bfdbfe"
                    stroke="#111827"
                    strokeWidth="0.4"
                    onPointerDown={(event) => beginDrag(event, { kind: "arrowEnd", id: arrow.id })}
                  />
                </>
              ) : null}
            </g>
          );
        })}

        {frame.awayPlayers.map((player) => renderPlayer(player, "awayPlayer"))}
        {frame.homePlayers.map((player) => renderPlayer(player, "homePlayer"))}

        <g
          className={authorMode ? "pitch-entity editable" : "pitch-entity"}
          onPointerDown={(event) => beginDrag(event, { kind: "ball" })}
          onClick={() => onSelect({ kind: "ball" })}
        >
          <circle
            cx={frame.ball.x}
            cy={frame.ball.y}
            r="2.4"
            fill="#f8fafc"
            stroke={selected?.kind === "ball" ? "#111827" : "#dbe4ea"}
            strokeWidth="0.35"
            style={{ transition: "cx 400ms ease, cy 400ms ease" }}
          />
          <g
            transform={`translate(${frame.ball.x} ${frame.ball.y})`}
            clipPath="url(#soccerBallClip)"
            style={{ transition: "transform 400ms ease" }}
          >
            <polygon
              points="0,-0.85 0.8,-0.25 0.5,0.7 -0.5,0.7 -0.8,-0.25"
              fill="#111827"
            />
            <polygon points="0,-2.4 0.45,-1.55 -0.45,-1.55" fill="#111827" />
            <polygon points="2.1,-0.65 1.35,-0.1 1.7,0.75" fill="#111827" />
            <polygon points="1.35,1.9 0.45,1.45 0.95,0.6" fill="#111827" />
            <polygon points="-1.35,1.9 -0.45,1.45 -0.95,0.6" fill="#111827" />
            <polygon points="-2.1,-0.65 -1.35,-0.1 -1.7,0.75" fill="#111827" />
            <path
              d="M-1.15 -0.35 L-2 -0.95 M1.15 -0.35 L2 -0.95 M-0.7 1.05 L-1.15 2 M0.7 1.05 L1.15 2 M0 -0.85 L0 -1.55"
              stroke="#111827"
              strokeWidth="0.18"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>
      <div className="field-footer">
        <span>{hoverLabel ?? "Use the editor to move players, the ball, and arrow points."}</span>
      </div>
    </div>
  );
}
