// client/src/components/BirthChart.tsx
import {
  BirthChartData,
  PLANET_GLYPHS,
  PLANET_COLORS,
  ELEMENT_FOR_SIGN,
  ELEMENT_COLORS,
  ZODIAC_GLYPHS,
  ZODIAC_SIGNS
} from '@/lib/astrology';

interface BirthChartProps {
  chartData: BirthChartData;
}

// Convert longitude to coordinate angle relative to Ascendant (ASC is placed at 180° / Left)
function toChartAngle(longitude: number, ascendant: number): number {
  // Ecliptic coordinates go counter-clockwise (increasing longitude)
  // ASC is on the left (180°), so: Chart Angle = (180 + longitude - ascendant) % 360
  return (180 + longitude - ascendant + 360) % 360;
}

// Convert angle & radius to SVG coordinates (X, Y)
function toSvgCoords(angleDeg: number, radius: number, cx: number = 300, cy: number = 300): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

// Draw a filled annular sector (pie slice ring segment)
function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = toSvgCoords(startAngle, outerR, cx, cy);
  const endOuter = toSvgCoords(endAngle, outerR, cx, cy);
  const startInner = toSvgCoords(endAngle, innerR, cx, cy);
  const endInner = toSvgCoords(startAngle, innerR, cx, cy);

  const angleDiff = (endAngle - startAngle + 360) % 360;
  const largeArc = angleDiff > 180 ? 1 : 0;
  const sweepDir = 1; // clockwise in SVG coordinate space

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} ${sweepDir} ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} ${1 - sweepDir} ${endInner.x} ${endInner.y}`,
    'Z'
  ].join(' ');
}

export function BirthChart({ chartData }: BirthChartProps) {
  const cx = 300;
  const cy = 300;
  const asc = chartData.ascendant;

  // Resolve planet overlaps by assigning alternate radii
  const planetsSorted = [...chartData.planets].sort((a, b) => a.longitude - b.longitude);
  const planetRadii: Record<string, number> = {};

  for (let i = 0; i < planetsSorted.length; i++) {
    const current = planetsSorted[i];
    let radius = 190;

    // Check distance to previous/next planets
    const prev = planetsSorted[(i - 1 + planetsSorted.length) % planetsSorted.length];
    const next = planetsSorted[(i + 1) % planetsSorted.length];

    let diffPrev = Math.abs(current.longitude - prev.longitude);
    if (diffPrev > 180) diffPrev = 360 - diffPrev;

    let diffNext = Math.abs(current.longitude - next.longitude);
    if (diffNext > 180) diffNext = 360 - diffNext;

    if (diffPrev < 8 || diffNext < 8) {
      // If close together, offset alternative planets to inner radius to avoid overlap
      radius = i % 2 === 0 ? 190 : 160;
    }
    planetRadii[current.name] = radius;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* SVG Natal Chart */}
      <div className="relative aspect-square w-full max-w-[600px] mx-auto bg-gray-12/5 dark:bg-gray-1/30 rounded-full border border-gray-4/40 shadow-inner p-2">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full select-none"
        >
          {/* Inner space dark background */}
          <circle cx={cx} cy={cy} r={240} className="fill-black/40 stroke-none" />

          {/* Draw Zodiac Segments */}
          {ZODIAC_SIGNS.map((sign, index) => {
            const startAngle = toChartAngle(index * 30, asc);
            const endAngle = toChartAngle((index + 1) * 30, asc);
            const element = ELEMENT_FOR_SIGN[sign];
            const color = ELEMENT_COLORS[element];

            // Center of segment for text glyph
            const textAngle = startAngle + 15;
            const textPos = toSvgCoords(textAngle, 262, cx, cy);

            return (
              <g key={sign} className="group">
                <path
                  d={describeArc(cx, cy, 242, 282, startAngle, endAngle)}
                  style={{ fill: color, opacity: 0.15 }}
                  className="stroke-gray-5/50 stroke-[0.75px] hover:opacity-25 transition-opacity duration-200 cursor-pointer"
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fill: color }}
                  className="text-lg font-bold select-none cursor-pointer"
                >
                  {ZODIAC_GLYPHS[index]}
                  <title>{sign} ({element})</title>
                </text>
              </g>
            );
          })}

          {/* Degree Ticks */}
          {Array.from({ length: 72 }).map((_, idx) => {
            const angle = idx * 5;
            const chartAngle = toChartAngle(angle, asc);
            const isSignBound = angle % 30 === 0;
            const startR = 242;
            const endR = isSignBound ? 232 : 238;
            const pStart = toSvgCoords(chartAngle, startR, cx, cy);
            const pEnd = toSvgCoords(chartAngle, endR, cx, cy);
            return (
              <line
                key={idx}
                x1={pStart.x}
                y1={pStart.y}
                x2={pEnd.x}
                y2={pEnd.y}
                className={isSignBound ? "stroke-gray-5/60 stroke-[1.5px]" : "stroke-gray-6/30 stroke-[0.75px]"}
              />
            );
          })}

          {/* House Division Lines (Equal House System) */}
          {chartData.houses.map((house) => {
            const angle = toChartAngle(house.longitude, asc);
            const borderPos = toSvgCoords(angle, 240, cx, cy);
            const isAsc = house.house === 1;
            const isMc = house.house === 10;

            // Placement for house numbers
            const labelAngle = angle + 15;
            const labelPos = toSvgCoords(labelAngle, 110, cx, cy);

            return (
              <g key={house.house}>
                {/* Cusps lines */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={borderPos.x}
                  y2={borderPos.y}
                  className={
                    isAsc
                      ? "stroke-amber-9/80 stroke-[2px] shadow-glow"
                      : isMc
                      ? "stroke-orange-500/70 stroke-[1.5px]"
                      : "stroke-gray-10/15 stroke-[0.75px] stroke-dasharray-[2_2]"
                  }
                />
                {/* House labels */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[10px] font-semibold fill-gray-10/40"
                >
                  {house.house}
                </text>
              </g>
            );
          })}

          {/* Aspect Lines */}
          {chartData.aspects.map((aspect, idx) => {
            const angle1 = toChartAngle(aspect.planet1Longitude, asc);
            const angle2 = toChartAngle(aspect.planet2Longitude, asc);

            const r1 = (planetRadii[aspect.planet1] || 190) - 14;
            const r2 = (planetRadii[aspect.planet2] || 190) - 14;

            const startPt = toSvgCoords(angle1, r1, cx, cy);
            const endPt = toSvgCoords(angle2, r2, cx, cy);

            let strokeColor = '#38BDF8'; // Blue for harmonious (sextile/trine)
            if (aspect.type === 'square' || aspect.type === 'opposition') {
              strokeColor = '#EF4444'; // Red for disharmonious
            } else if (aspect.type === 'conjunction') {
              strokeColor = '#F59E0B'; // Gold for conjunction
            }

            return (
              <g key={idx}>
                <line
                  x1={startPt.x}
                  y1={startPt.y}
                  x2={endPt.x}
                  y2={endPt.y}
                  style={{ stroke: strokeColor }}
                  className="opacity-30 hover:opacity-80 transition-opacity duration-200 stroke-[1px]"
                >
                  <title>{`${aspect.planet1} ${aspect.type} ${aspect.planet2} (${aspect.symbol}) - Orb: ${aspect.orb.toFixed(2)}°`}</title>
                </line>
              </g>
            );
          })}

          {/* Center Ascendant Circle */}
          <circle cx={cx} cy={cy} r={42} className="fill-gray-1 bg-gray-12 stroke-gray-5/40 stroke-[1px] shadow-lg" />
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[9px] uppercase tracking-widest font-black fill-gray-11"
          >
            ASC
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-lg font-black fill-amber-9"
          >
            {chartData.ascendantSign.substring(0, 3)}
          </text>

          {/* Planet Placement Nodes */}
          {chartData.planets.map((planet) => {
            const angle = toChartAngle(planet.longitude, asc);
            const radius = planetRadii[planet.name] || 190;
            const pos = toSvgCoords(angle, radius, cx, cy);

            return (
              <g key={planet.name} className="group cursor-pointer">
                {/* Connection line from outer radius to planet node */}
                <line
                  x1={toSvgCoords(angle, 240, cx, cy).x}
                  y1={toSvgCoords(angle, 240, cx, cy).y}
                  x2={pos.x}
                  y2={pos.y}
                  className="stroke-gray-5/20 stroke-[0.5px] stroke-dasharray-[1_2]"
                />
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={14}
                  style={{ stroke: planet.color, fill: '#0a0a0a' }}
                  className="stroke-[1.5px] group-hover:scale-110 transition-transform duration-150 shadow"
                />
                {/* Planet Glyph */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fill: planet.color }}
                  className="text-sm font-bold pointer-events-none select-none"
                >
                  {planet.glyph}
                </text>
                {/* Tooltip */}
                <title>{`${planet.name} in ${planet.sign} ${planet.degree}° ${planet.minute}' ${planet.retrograde ? '(Retrograde)' : ''}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Grid of Planet Placements */}
      <div>
        <h3 className="text-sm font-bold text-gray-11 uppercase tracking-wider mb-4 border-b border-gray-a3 pb-2">Planetary Placements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {chartData.planets.map((planet) => (
            <div
              key={planet.name}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-a2 border border-gray-a3 shadow-sm hover:border-gray-a4 hover:bg-gray-a3 transition-all duration-200"
            >
              <div
                style={{ color: planet.color }}
                className="w-10 h-10 rounded-full bg-gray-a1 flex items-center justify-center text-xl shrink-0"
              >
                {planet.glyph}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-11 flex items-center gap-1">
                  {planet.name}
                  {planet.retrograde && (
                    <span className="text-red-9 font-mono text-[9px] font-bold" title="Retrograde">℞</span>
                  )}
                </div>
                <div className="text-sm font-black truncate">{planet.sign}</div>
                <div className="text-[11px] font-mono text-gray-11">
                  {planet.degree}° {planet.minute}'
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Major Aspects List */}
      <div>
        <h3 className="text-sm font-bold text-gray-11 uppercase tracking-wider mb-4 border-b border-gray-a3 pb-2">Planetary Aspects</h3>
        {chartData.aspects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chartData.aspects.map((aspect, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-a2 border border-gray-a3 hover:border-gray-a4 transition-all duration-200 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: PLANET_COLORS[aspect.planet1] }} className="text-base font-bold">
                    {PLANET_GLYPHS[aspect.planet1]}
                  </span>
                  <span className="text-gray-12 font-medium">{aspect.planet1}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      aspect.type === 'conjunction'
                        ? 'bg-amber-9/10 text-amber-11 border border-amber-9/20'
                        : aspect.harmonious
                        ? 'bg-blue-500/10 text-blue-11 border border-blue-500/20'
                        : 'bg-red-500/10 text-red-11 border border-red-500/20'
                    }`}
                  >
                    {aspect.symbol} {aspect.type}
                  </span>
                  <span className="text-gray-12 font-medium">{aspect.planet2}</span>
                  <span style={{ color: PLANET_COLORS[aspect.planet2] }} className="text-base font-bold">
                    {PLANET_GLYPHS[aspect.planet2]}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-11">
                  Orb: {aspect.orb.toFixed(2)}°
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-gray-11 bg-gray-a2 border border-dashed border-gray-a3 rounded-xl">
            No major planetary aspects active in this configuration.
          </div>
        )}
      </div>
    </div>
  );
}
