import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCitizen } from '../context/CitizenContext';
import { motion } from 'framer-motion';
import {
    Bell, CheckCircle2, ChevronRight, Sparkles, TrendingUp,
    AlertTriangle, ArrowRight, MessageSquare, FileText, Loader2, ClipboardList
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { CATEGORY_STYLE, FALLBACK_STYLE } from '../constants/categories';

const STATUS_CONFIG = {
    pending: { color: 'text-amber-600', bg: 'bg-amber-100' },
    submitted: { color: 'text-blue-600', bg: 'bg-blue-100' },
    approved: { color: 'text-success', bg: 'bg-success-light' },
    rejected: { color: 'text-danger', bg: 'bg-danger/10' },
};

const MotionWrapper = ({ children, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

// D1: 8 core fields for completion percentage
const COMPLETION_FIELDS = ['name', 'age', 'gender', 'state', 'income', 'category', 'urban', 'persona'];

function DashboardPage() {
    const { user } = useAuth();
    const { eligibleSchemes, citizenProfile, isLoadingProfile, applications, hasLocation } = useCitizen();
    const navigate = useNavigate();

    // Redirect to location setup if citizen hasn't set their village yet
    if (!isLoadingProfile && !hasLocation) {
        return <Navigate to="/setup-location" replace />;
    }

    const userName = user?.email ? user.email.split('@')[0] : 'Citizen';
    const hasProfile = citizenProfile?.name && citizenProfile.name !== '';
    const totalBenefits = eligibleSchemes.reduce((sum, s) => sum + (Number(s.annualBenefit) || 0), 0);
    const topSchemes = eligibleSchemes;

    // D1: Compute profile completion %
    const completionPct = Math.round(
        (COMPLETION_FIELDS.filter((f) => {
            const v = citizenProfile[f];
            return v !== null && v !== undefined && v !== '';
        }).length / COMPLETION_FIELDS.length) * 100
    );
    const completionVariant = completionPct >= 80 ? 'success' : completionPct >= 50 ? 'info' : 'warning';

    // D1: Last 3 applications for widget
    const recentApplications = applications.slice(0, 3);

    return (
        <div className="min-h-screen bg-off-white pb-12">
            {/* Header */}
            <div className="bg-navy py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <MotionWrapper>
                        <h1 className="font-display text-3xl lg:text-4xl text-white leading-tight">
                            Welcome back, <span className="text-saffron">{userName}</span>
                        </h1>
                        <p className="font-body text-gray-300 mt-2 text-sm lg:text-base max-w-2xl">
                            {hasProfile
                                ? `Your personalized welfare dashboard — ${eligibleSchemes.length} scheme${eligibleSchemes.length !== 1 ? 's' : ''} matched to your profile.`
                                : 'Complete your profile through our AI chat to discover schemes you qualify for.'}
                        </p>
                    </MotionWrapper>

                    <MotionWrapper delay={0.1} className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate('/schemes')}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shadow-saffron"
                        >
                            <FileText size={16} /> View All Schemes
                        </button>
                        <button
                            onClick={() => navigate('/chat')}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-white/30 text-white font-body text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                            <MessageSquare size={16} /> Ask Sarathi
                        </button>
                    </MotionWrapper>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                {isLoadingProfile ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 size={32} className="animate-spin text-saffron" />
                    </div>
                ) : !hasProfile ? (
                    <MotionWrapper delay={0.1} className="mt-8">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center max-w-xl mx-auto">
                            <div className="w-16 h-16 rounded-full bg-saffron-pale flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={28} className="text-saffron" />
                            </div>
                            <h2 className="font-display text-2xl text-gray-900 mb-2">Complete Your Profile</h2>
                            <p className="font-body text-gray-700 mb-6">
                                Chat with Sarathi AI to answer a few questions about yourself. We'll instantly find all government schemes you're eligible for.
                            </p>
                            <button
                                onClick={() => navigate('/chat')}
                                className="inline-flex items-center gap-2 h-11 px-8 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shadow-saffron"
                            >
                                Start Chat <ArrowRight size={16} />
                            </button>
                        </div>
                    </MotionWrapper>
                ) : (
                    <>
                        {/* Metrics Row — D1: 4 stat cards */}
                        <MotionWrapper delay={0.15} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-8">
                            <StatCard
                                label="Total Potential Benefits"
                                value={`₹${totalBenefits.toLocaleString('en-IN')}`}
                                icon={<TrendingUp size={20} />}
                                variant="success"
                            />
                            <StatCard
                                label="Eligible Schemes"
                                value={eligibleSchemes.length}
                                icon={<Sparkles size={20} />}
                                variant="primary"
                            />
                            <StatCard
                                label="Profile Complete"
                                value={`${completionPct}%`}
                                icon={<CheckCircle2 size={20} />}
                                variant={completionVariant}
                            />
                            <button onClick={() => navigate('/applications')} className="text-left w-full">
                                <StatCard
                                    label="My Applications"
                                    value={applications.length}
                                    icon={<ClipboardList size={20} />}
                                    variant="primary"
                                />
                            </button>
                        </MotionWrapper>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Eligible Schemes */}
                            <div className="lg:col-span-2 space-y-6">
                                <MotionWrapper delay={0.2} className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-body text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-saffron" />
                                            Eligible For You
                                        </h2>
                                        <button onClick={() => navigate('/my-schemes')} className="text-sm font-body text-gray-500 hover:text-saffron transition-colors">
                                            View All →
                                        </button>
                                    </div>

                                    {topSchemes.length === 0 ? (
                                        <p className="font-body text-sm text-gray-500 py-4 text-center">No schemes matched yet. Complete your profile to see results.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topSchemes.map((scheme) => {
                                                const benefit = Number(scheme.annualBenefit) || 0;
                                                const benefitStr = benefit >= 100000
                                                    ? `₹${(benefit / 100000).toFixed(benefit % 100000 === 0 ? 0 : 1)}L`
                                                    : `₹${benefit.toLocaleString('en-IN')}`;
                                                const catStyle = CATEGORY_STYLE[scheme.category] || FALLBACK_STYLE;
                                                return (
                                                    <div key={scheme.id || scheme.schemeId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-off-white border border-gray-200">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] font-body px-2 py-0.5 rounded-full font-medium ${catStyle.pill}`}>
                                                                    {(scheme.category || '').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-body text-sm font-bold text-gray-900">{scheme.name || scheme.nameEnglish}</h4>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0">
                                                            <div className="text-left sm:text-right">
                                                                <span className="block text-xs text-gray-500">Annual Benefit</span>
                                                                <span className="font-mono font-bold text-success">{benefitStr}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => navigate(`/schemes/${scheme.schemeId || scheme.id}`)}
                                                                className="h-8 px-4 rounded-lg bg-saffron text-white font-body text-xs font-semibold hover:bg-saffron-light transition-colors"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </MotionWrapper>

                                {/* Profile Summary */}
                                <MotionWrapper delay={0.3} className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
                                    <h2 className="font-body text-lg font-bold text-gray-900 mb-4">Your Profile</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Name', value: citizenProfile.name },
                                            { label: 'Age', value: citizenProfile.age },
                                            { label: 'State', value: citizenProfile.state },
                                            { label: 'Category', value: citizenProfile.category },
                                            { label: 'Income/mo', value: citizenProfile.income ? `₹${Number(citizenProfile.income).toLocaleString('en-IN')}` : '—' },
                                            { label: 'Occupation', value: citizenProfile.occupation || citizenProfile.persona || '—' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-3 rounded-lg bg-off-white border border-gray-200">
                                                <p className="font-body text-xs text-gray-500 mb-0.5">{label}</p>
                                                <p className="font-body text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="mt-4 text-sm font-body text-saffron hover:underline"
                                    >
                                        Edit Profile →
                                    </button>
                                </MotionWrapper>
                            </div>

                            {/* Right: Digital Twin + Actions */}
                            <div className="space-y-6">
                                <MotionWrapper delay={0.25} className="bg-navy rounded-xl p-5 relative overflow-hidden group cursor-pointer">
                                    <div onClick={() => navigate('/twin')}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <TrendingUp size={64} className="text-white" />
                                        </div>
                                        <h2 className="font-body text-lg font-bold text-white mb-1">Digital Twin</h2>
                                        <p className="font-body text-xs text-gray-300 mb-4">See your projected income increase across all matched schemes.</p>
                                        <div className="bg-white/10 rounded-lg p-3">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs text-gray-300">Total Potential</span>
                                                <span className="font-mono text-xl font-bold text-saffron">
                                                    {totalBenefits > 0 ? `₹${(totalBenefits / 1000).toFixed(0)}K` : '—'}
                                                </span>
                                            </div>
                                            {totalBenefits > 0 && (
                                                <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                                                    <div className="bg-saffron h-1.5 rounded-full" style={{ width: `${Math.min((totalBenefits / 200000) * 100, 100)}%` }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center text-sm font-medium text-saffron">
                                            View Full Analysis <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </MotionWrapper>

                                <MotionWrapper delay={0.35} className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Bell size={18} className="text-saffron" />
                                        <h2 className="font-body text-lg font-bold text-gray-900">Quick Actions</h2>
                                    </div>
                                    <div className="space-y-2">
                                        <button onClick={() => navigate('/schemes')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-saffron/50 hover:bg-saffron-pale transition-colors text-left">
                                            <span className="font-body text-sm text-gray-700">Browse All Schemes</span>
                                            <ArrowRight size={14} className="text-gray-400" />
                                        </button>
                                        <button onClick={() => navigate('/chat')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-saffron/50 hover:bg-saffron-pale transition-colors text-left">
                                            <span className="font-body text-sm text-gray-700">Update via Chat</span>
                                            <ArrowRight size={14} className="text-gray-400" />
                                        </button>
                                        <button onClick={() => navigate('/profile')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-saffron/50 hover:bg-saffron-pale transition-colors text-left">
                                            <span className="font-body text-sm text-gray-700">Edit Profile</span>
                                            <ArrowRight size={14} className="text-gray-400" />
                                        </button>
                                        <button onClick={() => navigate('/applications')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-saffron/50 hover:bg-saffron-pale transition-colors text-left">
                                            <span className="font-body text-sm text-gray-700">My Applications</span>
                                            <ArrowRight size={14} className="text-gray-400" />
                                        </button>
                                    </div>
                                </MotionWrapper>

                                {/* D1: Recent Applications widget */}
                                {recentApplications.length > 0 && (
                                    <MotionWrapper delay={0.4} className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <ClipboardList size={16} className="text-saffron" />
                                                <h2 className="font-body text-sm font-bold text-gray-900">Recent Applications</h2>
                                            </div>
                                            <button onClick={() => navigate('/applications')} className="text-xs font-body text-gray-500 hover:text-saffron transition-colors">
                                                View All →
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {recentApplications.map((app) => {
                                                const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                                                return (
                                                    <div key={app.applicationId} className="flex items-center justify-between p-2 rounded-lg bg-off-white border border-gray-100">
                                                        <p className="font-body text-xs text-gray-800 font-medium truncate flex-1 mr-2">{app.schemeName || app.schemeId}</p>
                                                        <span className={`text-[10px] font-body px-2 py-0.5 rounded-full font-semibold shrink-0 ${sc.bg} ${sc.color}`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </MotionWrapper>
                                )}

                                {eligibleSchemes.length > 0 && (
                                    <MotionWrapper delay={0.45} className="bg-success-light rounded-xl border border-success/20 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle size={18} className="text-success" />
                                            <h2 className="font-body text-sm font-bold text-success">Action Required</h2>
                                        </div>
                                        <p className="font-body text-sm text-gray-700">
                                            You have <strong>{eligibleSchemes.length}</strong> eligible scheme{eligibleSchemes.length !== 1 ? 's' : ''}. Apply now to start receiving benefits.
                                        </p>
                                        <button onClick={() => navigate('/my-schemes')} className="mt-3 text-sm font-body text-success font-medium hover:underline">
                                            Apply Now →
                                        </button>
                                    </MotionWrapper>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
