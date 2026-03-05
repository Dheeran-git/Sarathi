import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, IndianRupee, Target, Users } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell,
    LineChart, Line,
} from 'recharts';
import { usePanchayat } from '../../context/PanchayatContext';

const M = ({ children, delay = 0, className = '' }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} className={className}>
        {children}
    </motion.div>
);

function PanchayatAnalytics() {
    const { analyticsData, stats, isLoading } = usePanchayat();

    if (isLoading || !analyticsData) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const { schemeEnrollment, categoryDistribution, applicationTrend, keyMetrics } = analyticsData;

    const MetricCard = ({ icon: Icon, label, value, sub, color = 'teal' }) => (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-${color}-50`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-body">{label}</p>
                <p className="text-xl font-display text-navy mt-0.5">{value}</p>
                {sub && <p className="text-xs text-slate-400 font-body mt-0.5">{sub}</p>}
            </div>
        </div>
    );

    const fmt = (n) => `₹${(n / 100000).toFixed(1)}L`;

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-full">
            <div>
                <h1 className="font-display text-2xl text-navy">Scheme Coverage Analytics</h1>
                <p className="text-sm text-slate-500 font-body">Comprehensive welfare data for your panchayat</p>
            </div>

            {/* Key Metrics */}
            <M delay={0}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard icon={IndianRupee} label="Total Benefit Unlocked" value={fmt(keyMetrics.totalBenefitUnlocked)} sub="approved & delivered" color="emerald" />
                    <MetricCard icon={Target} label="Total Potential Benefit" value={fmt(keyMetrics.totalBenefitPotential)} sub="if all eligible enrolled" color="blue" />
                    <MetricCard icon={TrendingUp} label="Welfare Gap" value={fmt(keyMetrics.welfareGap)} sub="opportunity to close" color="amber" />
                    <MetricCard icon={Users} label="Avg Schemes / Citizen" value={keyMetrics.avgSchemesPerCitizen.toFixed(1)} sub="target: 8-10" color="purple" />
                </div>
            </M>

            {/* Bar Chart: Scheme-wise enrollment */}
            <M delay={0.1}>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-display text-lg text-navy mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-teal-500" /> Scheme-wise Enrollment vs Eligible
                    </h2>
                    <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={schemeEnrollment} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="scheme" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} angle={-30} textAnchor="end" height={60} />
                                <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                                <Tooltip
                                    contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    formatter={(v, name) => [v, name === 'enrolled' ? 'Enrolled' : name === 'eligible' ? 'Eligible' : 'Gap']}
                                />
                                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                                <Bar dataKey="eligible" fill="#94a3b8" name="Eligible" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="enrolled" fill="#14b8a6" name="Enrolled" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </M>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart: Category Distribution */}
                <M delay={0.2}>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-lg text-navy mb-4">Benefit Category Distribution</h2>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryDistribution}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%" cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#94a3b8' }}
                                    >
                                        {categoryDistribution.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </M>

                {/* Line Chart: Application Trend */}
                <M delay={0.3}>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-lg text-navy mb-4">Monthly Application Trend</h2>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={applicationTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                                    <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8 }} />
                                    <Line
                                        type="monotone"
                                        dataKey="applications"
                                        stroke="#14b8a6"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                                        name="Applications"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </M>
            </div>
        </div>
    );
}

export default PanchayatAnalytics;
