
import React from 'react';

interface RadarChartProps {
  metrics: {
    clarity: number;
    persuasion: number;
    empathy: number;
    resilience: number;
  };
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ metrics, size = 320 }) => {
  const center = size / 2;
  const radius = (size / 2) - 50;
  const max = 100;

  const axes = [
    { label: 'CLARITY', value: metrics.clarity },
    { label: 'PERSUASION', value: metrics.persuasion },
    { label: 'RESILIENCE', value: metrics.resilience },
    { label: 'EMPATHY', value: metrics.empathy },
  ];

  const angleSlice = (Math.PI * 2) / axes.length;

  const getCoords = (value: number, index: number) => {
    const angle = index * angleSlice - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const points = axes.map((axis, i) => {
    const { x, y } = getCoords(axis.value, i);
    return `${x},${y}`;
  }).join(' ');

  const levels = [25, 50, 75, 100];

  return (
    <div className="relative flex items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible drop-shadow-[0_0_25px_rgba(99,102,241,0.25)]">
        {/* Background Grids */}
        {levels.map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / max) * radius}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            strokeDasharray={level === 100 ? "0" : "4 4"}
          />
        ))}

        {/* Tactical Crosshairs */}
        {axes.map((_, i) => {
          const { x, y } = getCoords(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon with Neon Glow */}
        <path
          d={`M ${points} Z`}
          fill="rgba(99, 102, 241, 0.12)"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="animate-pulse"
        />

        {/* Data Points and HUD Labels */}
        {axes.map((axis, i) => {
          const { x, y } = getCoords(axis.value, i);
          const isHigh = axis.value > 80;
          return (
            <g key={i}>
              <rect
                x={x - 2}
                y={y - 2}
                width="4"
                height="4"
                fill={isHigh ? "#6366f1" : "#ef4444"}
                className="shadow-[0_0_12px_rgba(99,102,241,1)]"
              />
              <text
                x={x}
                y={y}
                dx={x > center ? 18 : x < center ? -18 : 0}
                dy={y > center ? 20 : y < center ? -20 : -10}
                textAnchor={x > center ? 'start' : x < center ? 'end' : 'middle'}
                fill="rgba(255,255,255,0.35)"
                fontSize="8"
                fontWeight="900"
                className="tracking-[0.3em] font-mono uppercase"
              >
                {axis.label}
              </text>
              <text
                x={x}
                y={y}
                dx={x > center ? 18 : x < center ? -18 : 0}
                dy={y > center ? 34 : y < center ? -34 : -24}
                textAnchor={x > center ? 'start' : x < center ? 'end' : 'middle'}
                fill="#fff"
                fontSize="12"
                fontWeight="900"
                className="font-mono italic skew-x-[-10deg]"
              >
                {axis.value}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RadarChart;
