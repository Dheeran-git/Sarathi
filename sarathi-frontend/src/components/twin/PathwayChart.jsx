import { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, Area, ComposedChart, ResponsiveContainer
} from 'recharts';

/**
 * PathwayChart — 3-line income trajectory chart for Digital Twin.
 */
function PathwayChart({ pathways }) {
    const [activeTab, setActiveTab] = useState('best');

    const tabs = [
        { key: 'best', label: 'Best', color: '#4f46e5' },
        { key: 'medium', label: 'Medium', color: '#38bdf8' },
        { key: 'minimum', label: 'Minimum', color: '#94a3b8' },
    ];

    // Find when best path crosses poverty line
    const crossingMonth = pathways.best.find((d) => d.income >= 8000)?.month;
    const crossingYears = crossingMonth ? (crossingMonth / 12).toFixed(1) : '—';

    // Format data for Recharts
    const data = pathways.best.map((_, i) => ({
        month: i + 1,
        label: i % 12 === 0 ? `Year ${Math.floor(i / 12) + 1}` : '',
        best: pathways.best[i].income,
        medium: pathways.medium[i].income,
        minimum: pathways.minimum[i].income,
        scheme: pathways.best[i].schemeEn || pathways.best[i].scheme,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0]?.payload;
        return (
            <div className="bg-[#020617] text-[#f8fafc] border border-slate-700 px-3 py-2 rounded-lg shadow-lg font-body text-xs">
                <p className="font-medium">Month {d.month}</p>
                <p>Best: <span className="font-mono text-indigo-400">₹{d.best.toLocaleString('en-IN')}</span></p>
                <p>Medium: <span className="font-mono text-sky-400">₹{d.medium.toLocaleString('en-IN')}</span></p>
                <p>Minimum: <span className="font-mono text-slate-500">₹{d.minimum.toLocaleString('en-IN')}</span></p>
                {d.scheme && <p className="mt-1 text-indigo-400">📌 {d.scheme}</p>}
            </div>
        );
    };

    return (
        <div className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 p-4 lg:p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all duration-200 ${activeTab === tab.key
                            ? 'text-white'
                            : 'bg-[#020617] text-slate-400 hover:bg-slate-800'
                            }`}
                        style={activeTab === tab.key ? { backgroundColor: tab.color } : {}}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="w-full h-[300px] lg:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'DM Sans' }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={false}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                            domain={[0, 12000]}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Poverty line */}
                        <ReferenceLine
                            y={8000}
                            stroke="#ef4444"
                            strokeDasharray="8 4"
                            label={{
                                value: 'Poverty Line',
                                position: 'insideTopLeft',
                                fontSize: 11,
                                fill: '#ef4444',
                                fontFamily: 'DM Sans',
                            }}
                        />

                        {/* Area under best line */}
                        <Area
                            dataKey="best"
                            fill="#4f46e5"
                            fillOpacity={0.08}
                            stroke="none"
                        />

                        {/* Lines */}
                        <Line
                            dataKey="minimum"
                            stroke="#94a3b8"
                            strokeWidth={activeTab === 'minimum' ? 3 : 1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            opacity={activeTab === 'minimum' ? 1 : 0.4}
                        />
                        <Line
                            dataKey="medium"
                            stroke="#38bdf8"
                            strokeWidth={activeTab === 'medium' ? 3 : 2}
                            strokeDasharray="6 3"
                            dot={false}
                            opacity={activeTab === 'medium' ? 1 : 0.4}
                        />
                        <Line
                            dataKey="best"
                            stroke="#4f46e5"
                            strokeWidth={activeTab === 'best' ? 3 : 2}
                            dot={(props) => {
                                const d = data[props.index];
                                if (!d?.scheme) return null;
                                return (
                                    <circle
                                        key={props.index}
                                        cx={props.cx}
                                        cy={props.cy}
                                        r={5}
                                        fill="#4f46e5"
                                        stroke="#020617"
                                        strokeWidth={2}
                                    />
                                );
                            }}
                            opacity={activeTab === 'best' ? 1 : 0.5}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Below chart text */}
            <div className="mt-3 text-center">
                <p className="font-body text-sm text-slate-300">
                    <span className="font-medium text-indigo-400">On the best path:</span> You will cross the poverty line in <span className="font-mono font-bold text-[#f8fafc]">{crossingYears}</span> years
                </p>
            </div>
        </div>
    );
}

export default PathwayChart;
