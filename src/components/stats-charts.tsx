'use client';

import { useState } from 'react';

interface ChartPoint {
  time: string;
  succeeded: number;
  failed: number;
  running: number;
}

export function StatsCharts({ data }: { data: ChartPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-border bg-card text-xs text-muted-foreground">
        Loading chart metrics...
      </div>
    );
  }

  // Dimension parameters
  const svgWidth = 600;
  const svgHeight = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Compute boundaries
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.succeeded, d.failed, d.running)),
    6 // minimum grid max scale
  );
  const yMax = Math.ceil(maxVal * 1.25);

  // Coordinate mapper functions
  const getX = (idx: number) => padding.left + (idx / (data.length - 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / yMax) * chartHeight;

  // Generate paths for area & lines
  const succeededPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.succeeded) }));
  const failedPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.failed) }));

  const buildLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
  };

  const buildAreaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const line = buildLinePath(pts);
    return `${line} L ${pts[pts.length - 1].x} ${padding.top + chartHeight} L ${pts[0].x} ${padding.top + chartHeight} Z`;
  };

  const succeededLine = buildLinePath(succeededPoints);
  const succeededArea = buildAreaPath(succeededPoints);

  const failedLine = buildLinePath(failedPoints);
  const failedArea = buildAreaPath(failedPoints);

  // Grid levels
  const yTicks = [0, Math.floor(yMax / 2), yMax];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Map client X back to closest data point index
    const relativeX = clientX - padding.left;
    const stepWidth = chartWidth / (data.length - 1);
    let idx = Math.round(relativeX / stepWidth);
    idx = Math.max(0, Math.min(data.length - 1, idx));

    setHoveredIdx(idx);
    setTooltipPos({ x: getX(idx), y: clientY - 10 });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>Execution load timeline</span>
        </h3>
        <div className="flex gap-4 text-xxs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Successes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Failures</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick} className="opacity-40">
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={padding.left + chartWidth}
                y2={getY(tick)}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={getY(tick) + 4}
                className="text-[9px] font-mono fill-muted-foreground text-right"
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={padding.top + chartHeight + 15}
              className="text-[9px] font-mono fill-muted-foreground"
              textAnchor="middle"
            >
              {d.time}
            </text>
          ))}

          {/* Succeeded Area & Line */}
          <path d={succeededArea} fill="url(#successGrad)" />
          <path d={succeededLine} fill="none" stroke="#10b981" strokeWidth={2} />

          {/* Failed Area & Line */}
          <path d={failedArea} fill="url(#failedGrad)" />
          <path d={failedLine} fill="none" stroke="#ef4444" strokeWidth={2} />

          {/* Vertical indicator line on hover */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={padding.top}
              x2={getX(hoveredIdx)}
              y2={padding.top + chartHeight}
              stroke="var(--foreground)"
              strokeWidth={1}
              className="opacity-20"
            />
          )}

          {/* Hover points circles */}
          {hoveredIdx !== null && (
            <>
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(data[hoveredIdx].succeeded)}
                r={4}
                fill="#10b981"
                stroke="var(--card)"
                strokeWidth={1.5}
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(data[hoveredIdx].failed)}
                r={4}
                fill="#ef4444"
                stroke="var(--card)"
                strokeWidth={1.5}
              />
            </>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-20 rounded border border-border bg-card p-2 text-xxs shadow-md pointer-events-none text-foreground font-mono space-y-0.5"
            style={{
              left: `${(tooltipPos.x / svgWidth) * 100}%`,
              top: `${(tooltipPos.y / svgHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-semibold text-muted-foreground border-b border-border pb-0.5 mb-1">
              Time: {data[hoveredIdx].time}
            </div>
            <div className="text-emerald-500">
              Succeeded: {data[hoveredIdx].succeeded}
            </div>
            <div className="text-rose-500">
              Failed: {data[hoveredIdx].failed}
            </div>
            {data[hoveredIdx].running > 0 && (
              <div className="text-amber-500">
                Running: {data[hoveredIdx].running}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default StatsCharts;
