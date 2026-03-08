import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    FileText,
    CheckCircle,
    Clock,
    MapPin,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { fetchAllSchemes, getApplications } from '../utils/api';

const COLORS = ['#E8740C', '#0F2240', '#1A7F4B', '#C87B00', '#C0392B'];

function AdminDashboard() {
    const [schemes, setSchemes] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock data for charts
    const categoryData = [
        { name: 'Agriculture', value: 45 },
        { name: 'Education', value: 32 },
        { name: 'Health', value: 18 },
        { name: 'Housing', value: 24 },
        { name: 'Pension', value: 12 },
    ];

    const engagementData = [
        { day: 'Mon', applications: 120, views: 450 },
        { day: 'Tue', applications: 150, views: 520 },
        { day: 'Wed', applications: 180, views: 610 },
        { day: 'Thu', applications: 210, views: 730 },
        { day: 'Fri', applications: 190, views: 680 },
        { day: 'Sat', applications: 140, views: 490 },
        { day: 'Sun', applications: 130, views: 420 },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schemesData, appsData] = await Promise.all([
                fetchAllSchemes(),
                getApplications('all')
            ]);
            setSchemes(Array.isArray(schemesData) ? schemesData : []);
            setApplications(appsData.applications || []);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    // D1: 4 stat cards
    const stats = [
        { label: 'Active Schemes', value: schemes.filter(s => ['Active', 'Published'].includes(s.status)).length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', trend: '+4%', isUp: true },
        { label: 'Draft Schemes', value: schemes.filter(s => !['Active', 'Published'].includes(s.status)).length, icon: FileText, color: 'text-saffron', bg: 'bg-saffron/10', trend: '+1', isUp: true },
        { label: 'Total Applicants', value: applications.length.toLocaleString(), icon: Users, color: 'text-navy', bg: 'bg-navy/10', trend: '+12%', isUp: true },
        { label: 'Active Sessions', value: '42', icon: TrendingUp, color: 'text-info', bg: 'bg-info/10', trend: '-2%', isUp: false },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-navy">System <span className="text-saffron">Overview</span></h1>
                    <p className="font-body text-sm text-gray-500 mt-1">Real-time engagement and operational metrics</p>
                </div>
                <div className="flex gap-2">
                    <button className="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-all uppercase tracking-widest">Generate Report</button>
                    <button className="h-10 px-4 rounded-lg bg-navy text-white text-xs font-bold hover:shadow-lg transition-all uppercase tracking-widest">Refresh Data</button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-success' : 'text-danger'}`}>
                                {stat.trend}
                                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                        </div>
                        <p className="font-display text-2xl font-bold text-navy">{stat.value}</p>
                        <p className="font-body text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Engagement Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-display text-lg text-navy mb-6">Application Trends</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={engagementData}>
                                <defs>
                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E8740C" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#E8740C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F0EC" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8A8578', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8A8578', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0F2240' }}
                                />
                                <Area type="monotone" dataKey="applications" stroke="#E8740C" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-display text-lg text-navy mb-6">Category Impact</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {categoryData.slice(0, 4).map((cat, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-gray-500 font-body">{cat.name}</span>
                                </div>
                                <span className="font-bold text-navy">{cat.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Schemes Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-display text-xl text-navy">Recently Modified Schemes</h2>
                    <button className="text-saffron font-body text-xs font-bold uppercase tracking-widest hover:underline">Manage All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                            <tr>
                                <th className="px-6 py-4">Scheme Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Impact Score</th>
                                <th className="px-6 py-4">Engagements</th>
                                <th className="px-6 py-4">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400 animate-pulse">Syncing with database...</td></tr>
                            ) : schemes.slice(0, 5).map((s, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-navy group-hover:text-saffron transition-colors">{s.nameEnglish}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{s.ministry}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${['Active', 'Published'].includes(s.status) ? 'bg-success/10 text-success' : 'bg-saffron/10 text-saffron'
                                            }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-navy rounded-full" style={{ width: `${Math.random() * 60 + 40}%` }} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-navy font-bold">
                                        {Math.floor(Math.random() * 500 + 100)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {new Date().toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
