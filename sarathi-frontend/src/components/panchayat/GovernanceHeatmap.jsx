import { useState, useRef } from 'react';

/* ── Tooltip Component ────────────────────────────────────────────────── */
function Tooltip({ data, containerEl }) {
    if (!data || !containerEl) return null;

    // Calculate position relative to container's static wrapper
    const wrapperRect = containerEl.parentElement?.getBoundingClientRect();
    if (!wrapperRect) return null;
    const cellRect = data.element.getBoundingClientRect();

    let top = cellRect.top - wrapperRect.top - 8;
    let left = cellRect.left - wrapperRect.left + cellRect.width / 2;
    let transformY = '-100%';
    let transformX = '-50%';

    // Prevent top clipping
    if (top < 80) {
        top = cellRect.bottom - wrapperRect.top + 8;
        transformY = '0';
    }

    // Prevent right clipping relative to the non-scrolled wrapper
    if (left + 140 > wrapperRect.width) {
        left = cellRect.left - wrapperRect.left - 8;
        transformX = '-100%';
    }

    // Prevent left clipping bleeding off the table root
    if (left - 140 < 0) {
        left = cellRect.right - wrapperRect.left + 8;
        transformX = '0';
    }

    return (
        <div
            className="absolute z-50 px-3 py-2 bg-navy text-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)] whitespace-nowrap font-body text-xs pointer-events-none"
            style={{
                top,
                left,
                transform: `translate(${transformX}, ${transformY})`,
            }}
        >
            <p className="font-medium">
                Ward {data.ward.replace(/\D/g, '')} | {data.scheme}
            </p>
            <p className="mt-0.5">
                {data.enrolled} out of {data.eligible} eligible citizens benefitted ({data.value}%)
            </p>
        </div>
    );
}

/**
 * GovernanceHeatmap — scheme × ward enrollment rate grid.
 */
function GovernanceHeatmap({ data = [], schemes = [] }) {
    const [metric, setMetric] = useState('enrollment');
    const [hoveredCell, setHoveredCell] = useState(null);
    const containerRef = useRef(null);

    const metrics = [
        { key: 'enrollment', label: 'Enrollment Rate' },
        { key: 'benefit', label: 'Rupee Benefit' },
        { key: 'success', label: 'Application Success' },
    ];

    const getColor = (value) => {
        if (value >= 91) return '#1B5E20';
        if (value >= 76) return '#4CAF50';
        if (value >= 51) return '#FDD835';
        if (value >= 21) return '#FF9800';
        return '#C62828';
    };

    const getTextColor = (value) => {
        if (value >= 76) return 'white';
        if (value >= 51) return '#1C1A17';
        return 'white';
    };

    return (
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-body text-lg font-bold text-gray-900">
                    Governance Heatmap
                </h3>

                {/* Metric toggle */}
                <div className="flex gap-1">
                    {metrics.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => setMetric(m.key)}
                            className={`px-2.5 py-1 rounded-full font-body text-xs font-medium transition-colors duration-200 ${metric === m.key
                                ? 'bg-navy text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="relative isolate">
                <div ref={containerRef} className="overflow-x-auto pb-2 min-h-[300px]">
                    <table className="w-full border-collapse min-w-[500px]">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 font-body text-xs text-gray-500 text-left sticky left-0 bg-white z-10">
                                    Ward / Scheme
                                </th>
                                {schemes.map((scheme) => (
                                    <th
                                        key={scheme}
                                        className="px-2 py-2 font-body text-[10px] text-gray-500 text-center min-w-[60px]"
                                    >
                                        {scheme}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.ward}>
                                    <td className="px-2 py-1.5 font-body text-xs font-medium text-gray-700 sticky left-0 bg-white z-10">
                                        Ward {row.ward.replace(/\D/g, '')}
                                    </td>
                                    {row.schemes.map((cell, ci) => {
                                        const value = cell[metric] !== undefined ? cell[metric] : cell.enrollment;
                                        const isHovered =
                                            hoveredCell?.ward === row.ward &&
                                            hoveredCell?.scheme === cell.scheme;

                                        return (
                                            <td key={ci} className="px-1 py-1 relative">
                                                <div
                                                    className="w-full h-9 rounded flex items-center justify-center font-mono text-[11px] font-medium cursor-default transition-all duration-200"
                                                    style={{
                                                        backgroundColor: getColor(value),
                                                        color: getTextColor(value),
                                                        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                                                        zIndex: isHovered ? 20 : 1,
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        setHoveredCell({
                                                            ward: row.ward,
                                                            scheme: cell.scheme,
                                                            value,
                                                            enrolled: cell.enrolled,
                                                            eligible: cell.eligible,
                                                            element: e.currentTarget
                                                        })
                                                    }
                                                    onMouseLeave={() => setHoveredCell(null)}
                                                >
                                                    {value}%
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Independent Tooltip Layer */}
                    {hoveredCell && containerRef.current && (
                        <Tooltip
                            data={hoveredCell}
                            containerEl={containerRef.current}
                        />
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <span className="font-body text-[10px] text-gray-500">Level:</span>
                {[
                    { range: '0-20%', color: '#C62828' },
                    { range: '21-50%', color: '#FF9800' },
                    { range: '51-75%', color: '#FDD835' },
                    { range: '76-90%', color: '#4CAF50' },
                    { range: '91-100%', color: '#1B5E20' },
                ].map((l) => (
                    <div key={l.range} className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
                        <span className="font-body text-[10px] text-gray-500">{l.range}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GovernanceHeatmap;
