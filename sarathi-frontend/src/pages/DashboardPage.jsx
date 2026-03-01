import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Bell, CheckCircle2, ChevronRight, Clock, ShieldAlert,
    Sparkles, TrendingUp, AlertTriangle, ArrowRight,
    MessageSquare, FileText, Download
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';

// Temporary Mock Data for Citizen Dashboard
const MOCK_DATA = {
    metrics: {
        totalBenefits: 24500,
        eligibleSchemes: 4,
        notEnrolled: 2
    },
    aiRecommendations: [
        {
            id: 1,
            title: "Apply for PM-KISAN immediately",
            desc: "You are eligible for ₹6,000/year. Deadline approaches in 5 days.",
            impact: "+₹6,000",
            urgency: "high"
        },
        {
            id: 2,
            title: "Link Ration Card to Aadhaar",
            desc: "Required to keep receiving PDS subsidies without interruption.",
            impact: "Prevents Loss",
            urgency: "medium"
        }
    ],
    eligibleSchemes: [
        { id: 's1', name: 'Pradhan Mantri Awas Yojana (PMAY)', category: 'Housing', amount: '₹1.2L', tag: 'High Match' },
        { id: 's2', name: 'Ayushman Bharat (PM-JAY)', category: 'Health', amount: '₹5L', tag: 'Essential' }
    ],
    applications: [
        { id: 'a1', name: 'PM Ujjwala Yojana', status: 'approved', date: 'Oct 12, 2023', amount: '₹1,600' },
        { id: 'a2', name: 'Kisan Samman Nidhi', status: 'pending', date: 'Nov 05, 2023', amount: '₹6,000' }
    ],
    alerts: [
        { id: 'al1', text: 'Document requires update for State Pension', type: 'warning' },
        { id: 'al2', text: 'PM-JAY eCard generated successfully', type: 'success' }
    ]
};

const MotionWrapper = ({ children, delay = 0, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(MOCK_DATA);
    const userName = user?.email ? user.email.split('@')[0] : 'Citizen';

    return (
        <div className="min-h-screen bg-[#020617] pb-12">
            {/* Header Backdrop */}
            <div className="bg-[#0f172a] border-b border-slate-800 pt-8 pb-12 lg:pt-12 lg:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <MotionWrapper>
                        <h1 className="font-display text-3xl lg:text-4xl text-[#f8fafc] leading-tight">
                            Welcome back, <span className="text-indigo-400">{userName}</span>
                        </h1>
                        <p className="font-body text-slate-400 mt-2 text-sm lg:text-base max-w-2xl">
                            Your personalized welfare intelligence dashboard. We found 2 new schemes you might be eligible for today.
                        </p>
                    </MotionWrapper>

                    {/* Quick Actions Row */}
                    <MotionWrapper delay={0.1} className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate('/schemes')}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-indigo-500 text-white font-body text-sm font-medium hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <FileText size={16} /> View All Schemes
                        </button>
                        <button
                            onClick={() => navigate('/chat')}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-slate-700 bg-[#020617] text-[#f8fafc] font-body text-sm font-medium hover:border-indigo-400 hover:text-indigo-400 transition-colors"
                        >
                            <MessageSquare size={16} /> Ask Sarathi
                        </button>
                    </MotionWrapper>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                {/* Metrics Row */}
                <MotionWrapper delay={0.2} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        label="Total Potential Benefits"
                        value={data.metrics.totalBenefits}
                        icon="₹"
                        variant="success"
                    />
                    <StatCard
                        label="Eligible Schemes Found"
                        value={data.metrics.eligibleSchemes}
                        icon={<Sparkles size={20} />}
                        variant="warning"
                    />
                    <StatCard
                        label="Not Yet Enrolled"
                        value={data.metrics.notEnrolled}
                        icon={<AlertTriangle size={20} />}
                        variant="danger"
                    />
                </MotionWrapper>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: AI Recs + Scheme List */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* AI Recommendations */}
                        <MotionWrapper delay={0.3} className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-body text-lg font-bold text-[#f8fafc] flex items-center gap-2">
                                    <Sparkles size={20} className="text-indigo-400" />
                                    AI Recommendations
                                </h2>
                                <span className="text-xs font-mono px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    Top {data.aiRecommendations.length} Actions
                                </span>
                            </div>
                            <div className="space-y-4">
                                {data.aiRecommendations.map((rec) => (
                                    <div key={rec.id} className="relative p-4 rounded-lg bg-[#020617] border border-slate-800 hover:border-slate-700 transition-colors group">
                                        <div className="absolute top-4 right-4 text-emerald-400 font-mono text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded">
                                            {rec.impact}
                                        </div>
                                        <div className="pr-20">
                                            <h3 className="font-body font-bold text-[#f8fafc] text-base mb-1 flex items-center gap-2">
                                                {rec.urgency === 'high' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                                                {rec.title}
                                            </h3>
                                            <p className="font-body text-sm text-slate-400 leading-relaxed mb-3">
                                                {rec.desc}
                                            </p>
                                            <button className="text-indigo-400 font-body text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Take Action <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MotionWrapper>

                        {/* Eligible Schemes List */}
                        <MotionWrapper delay={0.4} className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-body text-lg font-bold text-[#f8fafc] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Eligible For You
                                </h2>
                                <button onClick={() => navigate('/schemes')} className="text-sm font-body text-slate-400 hover:text-indigo-400 transition-colors">
                                    View All →
                                </button>
                            </div>
                            <div className="space-y-3">
                                {data.eligibleSchemes.map((scheme) => (
                                    <div key={scheme.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[#020617] border border-slate-800">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-body px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-widest">
                                                    {scheme.category}
                                                </span>
                                                <span className="text-[10px] font-body px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    {scheme.tag}
                                                </span>
                                            </div>
                                            <h4 className="font-body text-sm font-bold text-[#f8fafc]">{scheme.name}</h4>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0">
                                            <div className="text-left sm:text-right">
                                                <span className="block text-xs text-slate-500">Benefit</span>
                                                <span className="font-mono font-bold text-emerald-400">{scheme.amount}</span>
                                            </div>
                                            <button className="h-8 px-4 rounded md bg-indigo-500 text-white font-body text-xs font-semibold hover:bg-indigo-400 transition-colors">
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MotionWrapper>

                    </div>

                    {/* Right Column: Twin, Alerts, Status */}
                    <div className="space-y-6">

                        {/* Digital Twin Preview */}
                        <MotionWrapper delay={0.35} className="bg-gradient-to-br from-indigo-900/40 to-[#0f172a] rounded-xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => navigate('/twin')}>
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                <TrendingUp size={64} />
                            </div>
                            <h2 className="font-body text-lg font-bold text-[#f8fafc] mb-1">Digital Twin Match</h2>
                            <p className="font-body text-xs text-indigo-300 mb-6 w-3/4">We've modeled your demographic profile against 140+ state schemes.</p>

                            <div className="bg-[#020617]/50 rounded-lg p-3 backdrop-blur-sm border border-indigo-500/10">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs text-slate-400">Projected Income Increase</span>
                                    <span className="font-mono text-xl font-bold text-emerald-400">+18%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '18%' }}></div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center text-sm font-medium text-indigo-400">
                                View Full Analysis <ChevronRight size={16} />
                            </div>
                        </MotionWrapper>

                        {/* Application Status */}
                        <MotionWrapper delay={0.45} className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-2xl">
                            <h2 className="font-body text-lg font-bold text-[#f8fafc] mb-4">Application Status</h2>
                            <div className="space-y-4">
                                {data.applications.map((app) => (
                                    <div key={app.id} className="relative pl-6">
                                        {/* Timeline line */}
                                        <div className="absolute left-1.5 top-2 bottom-0 w-px bg-slate-800" />

                                        {/* Status dot */}
                                        <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] ${app.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`} />

                                        <div>
                                            <h4 className="font-body justify-between text-sm font-semibold text-[#f8fafc] flex items-center">
                                                {app.name}
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${app.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {app.date}</span>
                                                <span className="font-mono text-slate-300">{app.amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MotionWrapper>

                        {/* Alerts */}
                        <MotionWrapper delay={0.5} className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Bell size={18} className="text-slate-400" />
                                <h2 className="font-body text-lg font-bold text-[#f8fafc]">Recent Alerts</h2>
                            </div>
                            <div className="space-y-3">
                                {data.alerts.map((alert) => (
                                    <div key={alert.id} className="flex gap-3 text-sm font-body">
                                        <div className="mt-0.5">
                                            {alert.type === 'warning' ? (
                                                <ShieldAlert size={16} className="text-red-400" />
                                            ) : (
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                            )}
                                        </div>
                                        <p className="text-slate-300 leading-snug">{alert.text}</p>
                                    </div>
                                ))}
                            </div>
                        </MotionWrapper>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
