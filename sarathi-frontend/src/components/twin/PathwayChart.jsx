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
        { key: 'best', label: 'Best', color: '#E8740C' },
        { key: 'medium', label: 'Medium', color: '#0F2240' },
        { key: 'minimum', label: 'Minimum', color: '#8A8578' },
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
            <div className="bg-navy text-white px-3 py-2 rounded-lg shadow-lg font-body text-xs">
                <p className="font-medium">Month {d.month}</p>
                <p>Best: <span className="font-mono text-saffron">₹{d.best.toLocaleString('en-IN')}</span></p>
                <p>Medium: <span className="font-mono">₹{d.medium.toLocaleString('en-IN')}</span></p>
                <p>Minimum: <span className="font-mono text-gray-400">₹{d.minimum.toLocaleString('en-IN')}</span></p>
                {d.scheme && <p className="mt-1 text-saffron-light">📌 {d.scheme}</p>}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all duration-200 ${activeTab === tab.key
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DA" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#8A8578', fontFamily: 'DM Sans' }}
                            axisLine={{ stroke: '#E5E2DA' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#8A8578', fontFamily: 'JetBrains Mono' }}
                            axisLine={{ stroke: '#E5E2DA' }}
                            tickLine={false}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                            domain={[0, 12000]}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Poverty line */}
                        <ReferenceLine
                            y={8000}
                            stroke="#C0392B"
                            strokeDasharray="8 4"
                            label={{
                                value: 'Poverty Line',
                                position: 'insideTopLeft',
                                fontSize: 11,
                                fill: '#C0392B',
                                fontFamily: 'DM Sans',
                            }}
                        />

                        {/* Area under best line */}
                        <Area
                            dataKey="best"
                            fill="#E8740C"
                            fillOpacity={0.08}
                            stroke="none"
                        />

                        {/* Lines */}
                        <Line
                            dataKey="minimum"
                            stroke="#8A8578"
                            strokeWidth={activeTab === 'minimum' ? 3 : 1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            opacity={activeTab === 'minimum' ? 1 : 0.4}
                        />
                        <Line
                            dataKey="medium"
                            stroke="#0F2240"
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

            {/* Below chart text */}
            <div className="mt-3 text-center">
                <p className="font-body text-sm text-gray-700">
                    <span className="font-medium text-saffron">On the best path:</span> You will cross the poverty line in <span className="font-mono font-bold text-navy">{crossingYears}</span> years
                </p>
            </div>
        </div>
    );
}

export default PathwayChart;
