import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCitizen } from '../context/CitizenContext';
import { useToast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import {
    User, MapPin, Shield, LogOut,
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

const fmt = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') return val.toLocaleString('en-IN');
    return String(val);
};

// D2: 8 core fields for completion
const COMPLETION_FIELDS = ['name', 'age', 'gender', 'state', 'income', 'category', 'urban', 'persona'];

function ProfilePage() {
    const { user, logout } = useAuth();
    const { citizenProfile, updateProfile, isLoadingProfile, eligibleSchemes, saveCurrentProfile } = useCitizen();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const [validationErrors, setValidationErrors] = useState({});

    // D2: Completion progress
    const completionPct = Math.round(
        (COMPLETION_FIELDS.filter((f) => {
            const v = citizenProfile[f];
            return v !== null && v !== undefined && v !== '';
        }).length / COMPLETION_FIELDS.length) * 100
    );

    const startEditing = () => {
        setDraft({ ...citizenProfile });
        setValidationErrors({});
        setIsEditing(true);
    };

    const handleChange = (key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setValidationErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    // D2: Validate before save
    const validateDraft = (d) => {
        const errors = {};
        if (d.age !== null && d.age !== undefined) {
            const age = Number(d.age);
            if (d.age === '' || isNaN(age) || age < 1 || age > 120) errors.age = 'Age must be between 1 and 120';
        }
        if (d.income !== '' && d.income !== null && d.income !== undefined) {
            const inc = Number(d.income);
            if (isNaN(inc) || inc < 0 || inc > 999999) errors.income = 'Income must be between 0 and 9,99,999';
        }
        return errors;
    };

    const handleSave = async () => {
        const errors = validateDraft(draft);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        updateProfile(draft);
        setIsEditing(false);
        try {
            await saveCurrentProfile(eligibleSchemes);
            addToast('Profile saved', 'success');
        } catch {
            addToast('Save failed — changes stored locally', 'error');
        }
    };

    // D2: Cancel restores draft
    const handleCancel = () => {
        setDraft({ ...citizenProfile });
        setValidationErrors({});
        setIsEditing(false);
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
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-saffron" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-off-white pb-12">
            {/* Header */}
            <div className="bg-navy pt-8 pb-12 lg:pt-12 lg:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto relative z-10">
                    <MotionWrapper>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-saffron/20 border-2 border-saffron/40 flex items-center justify-center">
                                <User size={28} className="text-saffron" />
                            </div>
                            <div>
                                <h1 className="font-display text-3xl lg:text-4xl text-white leading-tight">
                                    {displayName}
                                </h1>
                                <p className="font-body text-gray-300 mt-1 text-sm">{displayEmail}</p>
                                {eligibleSchemes.length > 0 && (
                                    <p className="font-body text-green-300 mt-1 text-xs">
                                        Eligible for {eligibleSchemes.length} scheme{eligibleSchemes.length > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </MotionWrapper>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-6">
                {/* D2: Progress bar */}
                <MotionWrapper className="bg-white rounded-xl border border-gray-200 shadow-card px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-xs text-gray-500">Profile Completion</span>
                        <span className="font-body text-xs font-semibold text-gray-900">{completionPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-saffron h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionPct}%` }}
                        />
                    </div>
                </MotionWrapper>

                {/* Core Profile Details */}
                <MotionWrapper delay={0.2} className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-body text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Shield size={20} className="text-saffron" />
                            Profile Details
                        </h2>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-saffron text-white font-body text-xs font-semibold hover:bg-saffron-light transition-colors"
                                >
                                    <Save size={14} /> Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-gray-300 text-gray-500 font-body text-xs font-semibold hover:text-danger hover:border-red-300 transition-colors"
                                >
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startEditing}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-gray-300 text-gray-600 font-body text-xs font-semibold hover:text-saffron hover:border-saffron/40 transition-colors"
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {coreFields.map(({ key, label, icon: Icon, type, format }) => {
                            const rawVal = isEditing ? draft[key] : citizenProfile[key];
                            const displayVal = format ? format(rawVal) : fmt(rawVal);
                            const fieldError = validationErrors[key];

                            return (
                                <div key={key}>
                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-off-white border border-gray-200">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Icon size={18} className="text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1 font-body">
                                                {label}
                                            </label>
                                            {isEditing && key !== 'urban' ? (
                                                <input
                                                    type={type}
                                                    value={draft[key] ?? ''}
                                                    onChange={(e) =>
                                                        handleChange(key, type === 'number' ? Number(e.target.value) || '' : e.target.value)
                                                    }
                                                    className="w-full bg-transparent text-sm text-gray-900 font-body outline-none border-b border-saffron/40 pb-0.5 focus:border-saffron transition-colors"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-900 font-body truncate">
                                                    {displayVal || <span className="text-gray-400 italic">Not set</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {fieldError && (
                                        <p className="font-body text-xs text-danger mt-1 ml-14">{fieldError}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </MotionWrapper>

                {/* Additional Details */}
                {extraFields.length > 0 && (
                    <MotionWrapper delay={0.3} className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
                        <h2 className="font-body text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-saffron" />
                            Additional Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {extraFields.map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-off-white border border-gray-200">
                                    <span className="text-xs text-gray-500 font-body uppercase tracking-wide">{label}</span>
                                    <span className="text-sm font-body font-medium text-gray-900">
                                        {fmt(citizenProfile[key])}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MotionWrapper>
                )}

                {/* Quick Links */}
                <MotionWrapper delay={0.4} className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
                    <h2 className="font-body text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
                    <div className="space-y-2">
                        {[
                            { label: 'My Dashboard', path: '/dashboard' },
                            { label: 'Browse Schemes', path: '/schemes' },
                            { label: 'My Applications', path: '/applications' },
                            { label: 'Ask Sarathi', path: '/chat' },
                        ].map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-off-white border border-gray-200 hover:border-saffron/40 transition-colors group"
                            >
                                <span className="font-body text-sm text-gray-700 group-hover:text-saffron transition-colors">
                                    {link.label}
                                </span>
                                <ChevronRight size={16} className="text-gray-400 group-hover:text-saffron transition-colors" />
                            </button>
                        ))}
                    </div>
                </MotionWrapper>

                {/* Logout */}
                <MotionWrapper delay={0.5}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-red-200 bg-red-50 text-danger font-body text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-colors"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </MotionWrapper>
            </div>
        </div>
    );
}

export default ProfilePage;
