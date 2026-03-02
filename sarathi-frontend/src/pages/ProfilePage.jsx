import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCitizen } from '../context/CitizenContext';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, Shield, LogOut,
    ChevronRight, Edit3, Save, X, Briefcase,
    Calendar, IndianRupee, Users, Home, Loader2
} from 'lucide-react';

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

/* Helper: display-friendly label for raw profile values */
const fmt = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') return val.toLocaleString('en-IN');
    return String(val);
};

function ProfilePage() {
    const { user, logout } = useAuth();
    const { citizenProfile, updateProfile, isLoadingProfile, eligibleSchemes, saveCurrentProfile } = useCitizen();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    // Editable draft (initialized from context)
    const [draft, setDraft] = useState({});

    const startEditing = () => {
        setDraft({ ...citizenProfile });
        setIsEditing(true);
    };

    const handleChange = (key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        updateProfile(draft);
        setIsEditing(false);
        // Explicitly save to DB right away
        saveCurrentProfile(eligibleSchemes).catch((err) =>
            console.warn('[ProfilePage] DB save failed:', err)
        );
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const displayName = citizenProfile.name || (user?.email ? user.email.split('@')[0] : 'Citizen');
    const displayEmail = user?.email || 'Not available';

    /* ── Field definitions ────────────────────────────────────────────── */
    const coreFields = [
        { key: 'name', label: 'Full Name', icon: User, type: 'text' },
        { key: 'age', label: 'Age', icon: Calendar, type: 'number' },
        { key: 'gender', label: 'Gender', icon: Users, type: 'text' },
        { key: 'state', label: 'State', icon: MapPin, type: 'text' },
        { key: 'income', label: 'Annual Income (₹)', icon: IndianRupee, type: 'number' },
        { key: 'category', label: 'Social Category', icon: Shield, type: 'text' },
        {
            key: 'urban', label: 'Area Type', icon: Home, type: 'text',
            format: (v) => v === true ? 'Urban' : v === false ? 'Rural' : null
        },
        { key: 'persona', label: 'Occupation', icon: Briefcase, type: 'text' },
    ];

    const extraFields = [
        { key: 'landOwned', label: 'Owns Land' },
        { key: 'shgMember', label: 'SHG Member' },
        { key: 'isWidow', label: 'Widow' },
        { key: 'pregnant', label: 'Pregnant / New Mother' },
        { key: 'disability', label: 'Disability' },
        { key: 'hasRationCard', label: 'Ration Card' },
        { key: 'hasJobCard', label: 'MGNREGS Job Card' },
        { key: 'educationLevel', label: 'Education Level' },
        { key: 'hasEnterprise', label: 'Runs Enterprise' },
        { key: 'seekingWork', label: 'Seeking Work' },
    ].filter(({ key }) => {
        const v = citizenProfile[key];
        return v !== null && v !== undefined && v !== '' && v !== false;
    });

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] pb-12">
            {/* Header */}
            <div className="bg-[#0f172a] border-b border-slate-800 pt-8 pb-12 lg:pt-12 lg:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto relative z-10">
                    <MotionWrapper>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center">
                                <User size={28} className="text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="font-display text-3xl lg:text-4xl text-[#f8fafc] leading-tight">
                                    {displayName}
                                </h1>
                                <p className="font-body text-slate-400 mt-1 text-sm">{displayEmail}</p>
                                {eligibleSchemes.length > 0 && (
                                    <p className="font-body text-emerald-400 mt-1 text-xs">
                                        ✅ Eligible for {eligibleSchemes.length} scheme{eligibleSchemes.length > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </MotionWrapper>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-6">
                {/* Core Profile Details */}
                <MotionWrapper delay={0.2} className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-body text-lg font-bold text-[#f8fafc] flex items-center gap-2">
                            <Shield size={20} className="text-indigo-400" />
                            Profile Details
                        </h2>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-indigo-500 text-white font-body text-xs font-semibold hover:bg-indigo-400 transition-colors"
                                >
                                    <Save size={14} /> Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-slate-700 text-slate-400 font-body text-xs font-semibold hover:text-red-400 hover:border-red-500/30 transition-colors"
                                >
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startEditing}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-slate-700 text-slate-300 font-body text-xs font-semibold hover:text-indigo-400 hover:border-indigo-500/30 transition-colors"
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {coreFields.map(({ key, label, icon: Icon, type, format }) => {
                            const rawVal = isEditing ? draft[key] : citizenProfile[key];
                            const displayVal = format ? format(rawVal) : fmt(rawVal);

                            return (
                                <div key={key} className="flex items-center gap-4 p-3 rounded-lg bg-[#020617] border border-slate-800">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        <Icon size={18} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1 font-body">
                                            {label}
                                        </label>
                                        {isEditing && key !== 'urban' ? (
                                            <input
                                                type={type}
                                                value={draft[key] ?? ''}
                                                onChange={(e) =>
                                                    handleChange(key, type === 'number' ? Number(e.target.value) || '' : e.target.value)
                                                }
                                                className="w-full bg-transparent text-sm text-[#f8fafc] font-body outline-none border-b border-indigo-500/40 pb-0.5 focus:border-indigo-400 transition-colors"
                                            />
                                        ) : (
                                            <p className="text-sm text-[#f8fafc] font-body truncate">
                                                {displayVal || <span className="text-slate-600 italic">Not set</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </MotionWrapper>

                {/* Additional Details (only shown if answered) */}
                {extraFields.length > 0 && (
                    <MotionWrapper delay={0.3} className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-2xl">
                        <h2 className="font-body text-lg font-bold text-[#f8fafc] mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-indigo-400" />
                            Additional Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {extraFields.map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-[#020617] border border-slate-800">
                                    <span className="text-xs text-slate-400 font-body uppercase tracking-wide">{label}</span>
                                    <span className="text-sm font-body font-medium text-[#f8fafc]">
                                        {fmt(citizenProfile[key])}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MotionWrapper>
                )}

                {/* Quick Links */}
                <MotionWrapper delay={0.4} className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-2xl">
                    <h2 className="font-body text-lg font-bold text-[#f8fafc] mb-4">Quick Links</h2>
                    <div className="space-y-2">
                        {[
                            { label: 'My Dashboard', path: '/dashboard' },
                            { label: 'Browse Schemes', path: '/schemes' },
                            { label: 'Ask Sarathi', path: '/chat' },
                        ].map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#020617] border border-slate-800 hover:border-slate-700 transition-colors group"
                            >
                                <span className="font-body text-sm text-slate-300 group-hover:text-indigo-400 transition-colors">
                                    {link.label}
                                </span>
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            </button>
                        ))}
                    </div>
                </MotionWrapper>

                {/* Logout */}
                <MotionWrapper delay={0.5}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 font-body text-sm font-semibold hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </MotionWrapper>
            </div>
        </div>
    );
}

export default ProfilePage;
