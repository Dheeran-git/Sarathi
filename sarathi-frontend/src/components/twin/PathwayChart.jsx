import { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, Area, ComposedChart, ResponsiveContainer
} from 'recharts';

/**
 * PathwayChart — 3-line income trajectory chart for Digital Twin.
 * G2: Dynamic Y-axis, null safety guards.
 */
function PathwayChart({ pathways }) {
    const [activeTab, setActiveTab] = useState('best');

    // G2: Null guard — return empty state if no data
    if (!pathways?.best?.length) {
        return (
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 text-center">
                <p className="font-body text-sm text-gray-500">No pathway data available yet.</p>
            </div>
        );
    }

    const tabs = [
        { key: 'best',    label: 'Best',    color: '#E8740C' },
        { key: 'medium',  label: 'Medium',  color: '#0F2240' },
        { key: 'minimum', label: 'Minimum', color: '#94a3b8' },
    ];

    const best = pathways.best || [];
    const medium = pathways.medium || [];
    const minimum = pathways.minimum || [];

    // G2: Find when best path crosses poverty line
    const crossingMonth = (pathways.best || []).find((d) => d.income >= 8000)?.month;
    const crossingYears = crossingMonth ? (crossingMonth / 12).toFixed(1) : '—';

    // G2: Dynamic Y-axis — scale to data, keep 12K minimum
    const maxIncome = Math.max(
        ...best.map((d) => d.income || 0),
        ...medium.map((d) => d.income || 0),
        ...minimum.map((d) => d.income || 0),
        0
    );
    const yMax = Math.max(Math.ceil(maxIncome * 1.2 / 1000) * 1000, 12000);

    const data = best.map((_, i) => ({
        month: i + 1,
        label: i % 12 === 0 ? `Year ${Math.floor(i / 12) + 1}` : '',
        best: best[i]?.income ?? 0,
        medium: medium[i]?.income ?? 0,
        minimum: minimum[i]?.income ?? 0,
        scheme: best[i]?.schemeEn || best[i]?.scheme,
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0]?.payload;
        return (
            <div className="bg-white text-gray-900 border border-gray-200 px-3 py-2 rounded-lg shadow-lg font-body text-xs">
                <p className="font-medium">Month {d.month}</p>
                <p>Best: <span className="font-mono text-saffron">₹{d.best.toLocaleString('en-IN')}</span></p>
                <p>Medium: <span className="font-mono text-sky-400">₹{d.medium.toLocaleString('en-IN')}</span></p>
                <p>Minimum: <span className="font-mono text-gray-500">₹{d.minimum.toLocaleString('en-IN')}</span></p>
                {d.scheme && <p className="mt-1 text-saffron">📌 {d.scheme}</p>}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 lg:p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all duration-200 ${activeTab === tab.key
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                            domain={[0, yMax]}
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

                        <Area dataKey="best" fill="#E8740C" fillOpacity={0.08} stroke="none" />

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
                            stroke="#E8740C"
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
                                        fill="#E8740C"
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                );
                            }}
                            opacity={activeTab === 'best' ? 1 : 0.5}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 text-center">
                <p className="font-body text-sm text-gray-700">
                    <span className="font-medium text-saffron">On the best path:</span> You will cross the poverty line in <span className="font-mono font-bold text-gray-900">{crossingYears}</span> years
                </p>
            </div>
        </div>
    );
}

export default PathwayChart;
