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

const RadarChart: React.FC<RadarChartProps> = ({ metrics, size = 300 }) => {
  const center = size / 2;
  const radius = (size / 2) - 40; // Padding
  const max = 100;

  // Define axes
  const axes = [
    { label: 'Clarity', value: metrics.clarity },
    { label: 'Persuasion', value: metrics.persuasion },
    { label: 'Resilience', value: metrics.resilience },
    { label: 'Empathy', value: metrics.empathy },
  ];

  const angleSlice = (Math.PI * 2) / axes.length;

  // Helper to get coordinates
  const getCoords = (value: number, index: number) => {
    const angle = index * angleSlice - Math.PI / 2; // Start from top
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Generate polygon points string
  const points = axes.map((axis, i) => {
    const { x, y } = getCoords(axis.value, i);
    return `${x},${y}`;
  }).join(' ');

  // Generate grid levels
  const levels = [25, 50, 75, 100];

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid (Concentric Circles/Polygons) */}
        {levels.map((level) => {
          const levelPoints = axes.map((_, i) => {
            const { x, y } = getCoords(level, i);
            return `${x},${y}`;
          }).join(' ');
          
          return (
            <polygon
              key={level}
              points={levelPoints}
              fill="none"
              stroke="#374151" // gray-700
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Axes Lines */}
        {axes.map((_, i) => {
          const { x, y } = getCoords(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#374151"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={points}
          fill="rgba(59, 130, 246, 0.2)" // blue-500 with opacity
          stroke="#3b82f6"
          strokeWidth="3"
          className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />

        {/* Data Points (Dots) */}
        {axes.map((axis, i) => {
          const { x, y } = getCoords(axis.value, i);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#60a5fa" // blue-400
                stroke="#1e3a8a" // blue-900
                strokeWidth="2"
              />
              {/* Labels */}
              <text
                x={x}
                y={y}
                dx={x > center ? 10 : x < center ? -10 : 0}
                dy={y > center ? 15 : y < center ? -15 : 5}
                textAnchor={x > center ? 'start' : x < center ? 'end' : 'middle'}
                fill="#9ca3af" // gray-400
                fontSize="12"
                fontWeight="bold"
                className="uppercase tracking-wider"
              >
                {axis.label}
              </text>
              {/* Values */}
              <text
                x={x}
                y={y}
                dx={x > center ? 10 : x < center ? -10 : 0}
                dy={y > center ? 28 : y < center ? -28 : 18}
                textAnchor={x > center ? 'start' : x < center ? 'end' : 'middle'}
                fill="#fff"
                fontSize="10"
                fontWeight="bold"
              >
                {axis.value}/100
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RadarChart;
