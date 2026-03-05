import { motion } from 'framer-motion';
import { MapPin, Users, IndianRupee, Wifi, Building, Heart, Landmark } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import { usePanchayat } from '../../context/PanchayatContext';

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
const CATEGORY_COLORS = { General: '#6366f1', OBC: '#f59e0b', SC: '#14b8a6', ST: '#ef4444' };

const M = ({ children, delay = 0, className = '' }) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }} className={className}>
        {children}
    </motion.div>
);

function VillageProfile() {
    const { villageProfile, isLoading } = usePanchayat();

    if (isLoading || !villageProfile) {
        return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full" /></div>;
    }

    const { demographics, economic, hamlets, infrastructure } = villageProfile;

    const InfraTag = ({ label, value }) => (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600 font-body">{label}</span>
            <span className={`text-sm font-body font-medium ${value === true || value === 'Good' ? 'text-emerald-600' : value === false || value === 'None' ? 'text-red-500' : 'text-amber-600'}`}>
                {typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : value}
            </span>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-full">
            <div>
                <h1 className="font-display text-2xl text-navy flex items-center gap-2"><MapPin className="w-6 h-6 text-teal-500" /> Village Profile</h1>
                <p className="text-sm text-slate-500 font-body">Demographics, economics, and infrastructure overview</p>
            </div>

            {/* Quick Stats */}
            <M delay={0}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: 'Population', value: demographics.totalPopulation, color: 'teal' },
                        { icon: Heart, label: 'Gender Ratio', value: `${demographics.genderRatio} F/1000M`, color: 'pink' },
                        { icon: IndianRupee, label: 'Avg Income', value: `₹${economic.avgMonthlyIncome.toLocaleString('en-IN')}/mo`, color: 'amber' },
                        { icon: Building, label: 'BPL Households', value: demographics.bplHouseholds, color: 'red' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                            <s.icon className={`w-5 h-5 text-${s.color}-500 mb-2`} />
                            <p className="text-xl font-display text-navy">{s.value}</p>
                            <p className="text-xs text-slate-500 font-body">{s.label}</p>
                        </div>
                    ))}
                </div>
            </M>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Age Distribution */}
                <M delay={0.1}>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3">Age Distribution</h2>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={demographics.ageGroups} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                                    <YAxis type="category" dataKey="range" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} width={50} />
                                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8 }} />
                                    <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </M>

                {/* Category Breakdown */}
                <M delay={0.15}>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3">Social Category Breakdown</h2>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={demographics.categoryBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                                        {demographics.categoryBreakdown.map((entry, i) => (
                                            <Cell key={i} fill={CATEGORY_COLORS[entry.category] || COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </M>

                {/* Occupation Pie */}
                <M delay={0.2}>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3">Occupations</h2>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={economic.occupations} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {economic.occupations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </M>

                {/* Income Distribution */}
                <M delay={0.25}>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3">Income Distribution</h2>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={economic.incomeDistribution}>
                                    <XAxis dataKey="range" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                                    <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8 }} />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Households" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </M>
            </div>

            {/* Hamlets */}
            <M delay={0.3}>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-display text-base text-navy mb-3 flex items-center gap-2"><Landmark className="w-4 h-4 text-teal-500" /> Hamlets / Villages</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {hamlets.map((h) => (
                            <div key={h.name} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="font-body font-medium text-navy text-sm">{h.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{h.citizenCount} citizens</p>
                                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${h.coverage}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{h.coverage}% coverage</p>
                            </div>
                        ))}
                    </div>
                </div>
            </M>

            {/* Infrastructure */}
            <M delay={0.35}>
                <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-md">
                    <h2 className="font-display text-base text-navy mb-3 flex items-center gap-2"><Wifi className="w-4 h-4 text-teal-500" /> Infrastructure</h2>
                    <InfraTag label="ASHA Worker" value={infrastructure.hasAshaWorker} />
                    <InfraTag label="Anganwadi Centre" value={infrastructure.hasAnganwadi} />
                    <InfraTag label="Bank Branch" value={infrastructure.hasBankBranch} />
                    <InfraTag label="Post Office" value={infrastructure.hasPostOffice} />
                    <InfraTag label="Internet" value={infrastructure.internetConnectivity} />
                    <InfraTag label="Nearest Hospital" value={`${infrastructure.nearestHospitalKm} km`} />
                    <InfraTag label="Nearest Bank" value={`${infrastructure.nearestBankKm} km`} />
                </div>
            </M>
        </div>
    );
}

export default VillageProfile;
