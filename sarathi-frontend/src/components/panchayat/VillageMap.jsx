import { useState, useMemo } from 'react';

/* ── Status → color mapping ───────────────────────────────────────────── */
const STATUS_COLOR = {
  enrolled: '#00C851',
  eligible: '#FF8800',
  none: '#E53935',
  unknown: '#78909C',
};

const STATUS_LABEL = {
  enrolled: 'Enrolled',
  eligible: 'Eligible But Unserved',
  none: 'Zero Benefits',
  unknown: 'No Data',
};

/* ── Filter chip definitions ──────────────────────────────────────────── */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'eligible', label: 'Eligible But Unserved' },
  { key: 'none', label: 'Zero Benefits' },
];

/* ── Ward layout generator ────────────────────────────────────────────── *
 * Groups households by ward, then positions each ward cluster on a
 * virtual canvas. Within each cluster dots sit in a tight grid.         */
function buildLayout(households) {
  const byWard = {};
  households.forEach((h) => {
    (byWard[h.ward] = byWard[h.ward] || []).push(h);
  });

  const wards = Object.keys(byWard).sort(
    (a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''))
  );

  const wardCols = Math.ceil(Math.sqrt(wards.length));
  const dotSize = 16;
  const dotGap = 4;
  const wardPadding = 32;
  const roadWidth = 2;

  const positioned = [];
  const roads = [];
  let maxX = 0;
  let maxY = 0;

  wards.forEach((ward, wi) => {
    const members = byWard[ward];
    const cols = Math.max(2, Math.ceil(Math.sqrt(members.length)));
    const wardRow = Math.floor(wi / wardCols);
    const wardCol = wi % wardCols;

    const clusterW = cols * (dotSize + dotGap);
    const clusterH = Math.ceil(members.length / cols) * (dotSize + dotGap);

    const originX = wardCol * (8 * (dotSize + dotGap) + wardPadding);
    const originY = wardRow * (8 * (dotSize + dotGap) + wardPadding);

    members.forEach((h, di) => {
      const col = di % cols;
      const row = Math.floor(di / cols);
      positioned.push({
        ...h,
        x: originX + col * (dotSize + dotGap),
        y: originY + row * (dotSize + dotGap),
        idx: positioned.length,
      });
    });

    const endX = originX + clusterW;
    const endY = originY + clusterH;
    if (endX > maxX) maxX = endX;
    if (endY > maxY) maxY = endY;

    if (wardRow < Math.ceil(wards.length / wardCols) - 1 && wardCol === 0) {
      const roadY = originY + clusterH + wardPadding / 2 - roadWidth;
      roads.push({ x1: 0, y1: roadY, x2: maxX + wardPadding, y2: roadY });
    }

    if (wardCol < wardCols - 1) {
      const roadX = originX + clusterW + wardPadding / 2 - roadWidth;
      roads.push({ x1: roadX, y1: originY - 8, x2: roadX, y2: originY + clusterH + 8 });
    }
  });

  return { positioned, roads, width: maxX + 16, height: maxY + 16 };
}

/* ── Tooltip ──────────────────────────────────────────────────────────── */
function Tooltip({ dot, mapEl }) {
  if (!dot || !mapEl) return null;

  const dotLeft = dot.x + 16;
  const dotTop = dot.y + 16;

  let left = dotLeft + 24;
  let top = dotTop - 8;
  let transformY = '-100%';
  let transformX = '0';

  const tooltipApproxHeight = 100;
  if (top - tooltipApproxHeight < mapEl.scrollTop) {
    top = dotTop + 24;
    transformY = '0';
  }

  const tooltipApproxWidth = 160;
  if (left + tooltipApproxWidth > mapEl.scrollLeft + mapEl.clientWidth) {
    left = dotLeft - 8;
    transformX = '-100%';
  }

  return (
    <div
      className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg bg-navy text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] font-body text-xs leading-relaxed whitespace-nowrap"
      style={{ left, top, transform: `translate(${transformX}, ${transformY})` }}
    >
      <p className="font-semibold text-sm">{dot.name}</p>
      <p className="text-gray-300">
        Ward: {dot.ward?.replace(/\D/g, '') || ''}
      </p>
      <p>
        Status:{' '}
        <span style={{ color: STATUS_COLOR[dot.status] }}>
          {STATUS_LABEL[dot.status]}
        </span>
      </p>
      {dot.schemesCount !== undefined && (
        <p className="text-gray-300">Schemes: {dot.schemesCount}</p>
      )}
    </div>
  );
}

/* ── Village Map ──────────────────────────────────────────────────────── */
function VillageMap({ households = [] }) {
  const [filter, setFilter] = useState('all');
  const [hoveredDot, setHoveredDot] = useState(null);
  const [mapEl, setMapEl] = useState(null);

  const { positioned, roads, width, height } = useMemo(
    () => buildLayout(households),
    [households]
  );

  const handleMouseEnter = (dot) => {
    setHoveredDot(dot);
  };

  const dotMatches = (status) => {
    if (filter === 'all') return true;
    return status === filter;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors duration-200 ${filter === f.key
              ? 'bg-saffron text-white border-transparent'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-saffron/40 hover:text-saffron'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div
        ref={setMapEl}
        className="relative overflow-auto rounded-xl border border-gray-200 bg-off-white shadow-inner"
        style={{ maxHeight: 480 }}
      >
        {/* Subtle grid background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#C8C3B8"
                strokeWidth="0.5"
                opacity="0.25"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)" />
        </svg>

        {/* Ward layout */}
        <div
          className="relative"
          style={{
            width: Math.max(width, 300),
            height: Math.max(height, 200),
            padding: 16,
          }}
        >
          {/* Road lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: width + 32, height: height + 32 }}
          >
            {roads.map((r, i) => (
              <line
                key={i}
                x1={r.x1 + 16}
                y1={r.y1 + 16}
                x2={r.x2 + 16}
                y2={r.y2 + 16}
                stroke="#C8C3B8"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.4"
              />
            ))}
          </svg>

          {/* Household dots */}
          {positioned.map((dot) => {
            const color = STATUS_COLOR[dot.status] || STATUS_COLOR.unknown;
            const matches = dotMatches(dot.status);
            const pulseClass =
              dot.status === 'eligible'
                ? 'animate-[pulse-eligible_2s_ease-in-out_infinite]'
                : dot.status === 'none'
                  ? 'animate-[pulse-none_1.2s_ease-in-out_infinite]'
                  : '';

            return (
              <div
                key={dot.id}
                className={`absolute rounded-sm cursor-pointer transition-opacity duration-300 ${pulseClass}`}
                style={{
                  width: 16,
                  height: 16,
                  left: dot.x + 16,
                  top: dot.y + 16,
                  backgroundColor: color,
                  opacity: matches ? 1 : 0.1,
                  animation: `dotAppear 0.4s ${dot.idx * 5}ms both ease-out${pulseClass && matches
                    ? `, ${dot.status === 'eligible' ? 'pulse-eligible 2s ease-in-out infinite' : 'pulse-none 1.2s ease-in-out infinite'}`
                    : ''
                    }`,
                }}
                onMouseEnter={() => handleMouseEnter(dot)}
                onMouseLeave={() => setHoveredDot(null)}
              />
            );
          })}

          {/* Tooltip */}
          {hoveredDot && (
            <Tooltip dot={hoveredDot} mapEl={mapEl} />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 mt-2">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            <span className="font-body text-xs text-slate-300">
              {STATUS_LABEL[status]}
            </span>
          </div>
        ))}
      </div>

      {/* Keyframe styles (injected once) */}
      <style>{`
        @keyframes dotAppear {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-eligible {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes pulse-none {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default VillageMap;
