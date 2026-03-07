import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCitizen } from '../context/CitizenContext';
import { useToast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import {
    User, MapPin, Shield, LogOut,
    ChevronRight, Edit3, Save, X, Briefcase,
    Calendar, IndianRupee, Users, Home, Loader2,
    Building2, TreePine, Landmark, FileText, BarChart3,
    CheckCircle2, Clock, Star
} from 'lucide-react';

/* ── Helpers ────────────────────────────────────────────────────────── */
const M = ({ children, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay, ease: [.22, 1, .36, 1] }}
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

const COMPLETION_FIELDS = ['name', 'age', 'gender', 'state', 'income', 'category', 'urban', 'persona', 'village', 'district'];

const PLACEHOLDER_MAP = {
    name: 'Add your full name',
    age: 'Add your age',
    gender: 'Select your gender',
    state: 'Select your state',
    income: 'Enter monthly income',
    category: 'Select category',
    urban: 'Select area type',
    persona: 'Add your occupation',
};

/* ── Reusable Card ──────────────────────────────────────────────────── */
const Card = ({ children, className = '', hover = false }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.03)] ${hover ? 'hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300' : ''} ${className}`}>
        {children}
    </div>
);

/* ── Stat Badge ─────────────────────────────────────────────────────── */
const StatBadge = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} className="text-white" />
        </div>
        <div>
            <p className="font-display text-xl font-bold text-gray-900 leading-tight">{value}</p>
            <p className="font-body text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
        </div>
    </div>
);

/* ── Field Row (view + edit) ────────────────────────────────────────── */
const FieldRow = ({ icon: Icon, label, value, placeholder, isEditing, fieldKey, type, onChange, error }) => (
    <div>
        <div className="flex items-center gap-3.5 py-3 px-1 group">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-saffron/5 group-hover:border-saffron/20 transition-colors">
                <Icon size={16} className="text-gray-400 group-hover:text-saffron transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <label className="block text-[10px] text-gray-400 uppercase tracking-[0.1em] mb-0.5 font-body font-medium">
                    {label}
                </label>
                {isEditing && fieldKey !== 'urban' ? (
                    <input
                        type={type}
                        value={value ?? ''}
                        onChange={(e) =>
                            onChange(fieldKey, type === 'number' ? Number(e.target.value) || '' : e.target.value)
                        }
                        placeholder={placeholder}
                        className="w-full bg-transparent text-sm text-gray-900 font-body outline-none border-b-2 border-saffron/30 pb-0.5 focus:border-saffron transition-colors placeholder:text-gray-300"
                    />
                ) : (
                    <p className="text-sm text-gray-900 font-body truncate">
                        {fmt(value) || <span className="text-gray-300 italic text-xs">{placeholder || 'Not set'}</span>}
                    </p>
                )}
            </div>
        </div>
        {error && <p className="font-body text-xs text-red-500 mt-0.5 ml-[52px]">{error}</p>}
    </div>
);

/* ── Location Field (read-only) ─────────────────────────────────────── */
const LocationField = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-2.5 px-1">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Icon size={14} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-body font-medium">{label}</p>
            <p className="text-sm text-gray-900 font-body truncate">
                {value || <span className="text-gray-300 italic text-xs">Not set</span>}
            </p>
        </div>
    </div>
);

/* ════════════════════════════════════════════════════════════════════════
   PROFILE PAGE
   ════════════════════════════════════════════════════════════════════════ */
function ProfilePage() {
    const { user, logout } = useAuth();
    const { citizenProfile, updateProfile, isLoadingProfile, eligibleSchemes, saveCurrentProfile, hasLocation, applications } = useCitizen();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const [validationErrors, setValidationErrors] = useState({});

    /* ── Computed ──────────────────────────────────────────────────────── */
    const completionPct = Math.round(
        (COMPLETION_FIELDS.filter((f) => {
            const v = citizenProfile[f];
            return v !== null && v !== undefined && v !== '';
        }).length / COMPLETION_FIELDS.length) * 100
    );

    const displayName = citizenProfile.name || (user?.email ? user.email.split('@')[0] : 'Citizen');
    const displayEmail = user?.email || 'Not available';
    const initials = displayName.slice(0, 2).toUpperCase();
    const appliedCount = applications?.length || 0;
    const eligibleCount = eligibleSchemes?.length || 0;

    /* ── Handlers ──────────────────────────────────────────────────────── */
    const startEditing = () => { setDraft({ ...citizenProfile }); setValidationErrors({}); setIsEditing(true); };
    const handleChange = (key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setValidationErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validateDraft = (d) => {
        const errors = {};
        if (d.age !== null && d.age !== undefined) {
            const age = Number(d.age);
            if (d.age === '' || isNaN(age) || age < 1 || age > 120) errors.age = 'Age must be 1-120';
        }
        if (d.income !== '' && d.income !== null && d.income !== undefined) {
            const inc = Number(d.income);
            if (isNaN(inc) || inc < 0 || inc > 999999) errors.income = 'Income must be 0-9,99,999';
        }
        return errors;
    };

    const handleSave = async () => {
        const errors = validateDraft(draft);
        if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
        updateProfile(draft);
        setIsEditing(false);
        try {
            await saveCurrentProfile(eligibleSchemes);
            addToast('Profile saved successfully!', 'success');
        } catch {
            addToast('Save failed — changes stored locally', 'error');
        }
    };

    const handleCancel = () => { setDraft({}); setValidationErrors({}); setIsEditing(false); };

    const handleLogout = async () => {
        try { await logout(); navigate('/'); }
        catch (err) { console.error('Logout failed', err); }
    };

    /* ── Field configs ─────────────────────────────────────────────────── */
    const personalFields = [
        { key: 'name', label: 'Full Name', icon: User, type: 'text' },
        { key: 'age', label: 'Age', icon: Calendar, type: 'number' },
        { key: 'gender', label: 'Gender', icon: Users, type: 'text' },
        { key: 'persona', label: 'Occupation', icon: Briefcase, type: 'text' },
    ];

    const demographicFields = [
        { key: 'category', label: 'Social Category', icon: Shield, type: 'text' },
        { key: 'urban', label: 'Area Type', icon: Home, type: 'text', format: (v) => v === true ? 'Urban' : v === false ? 'Rural' : null },
    ];

    const financialFields = [
        { key: 'income', label: 'Monthly Income (₹)', icon: IndianRupee, type: 'number' },
    ];

    const locationFields = [
        { key: 'state', label: 'State / UT', icon: Landmark },
        { key: 'district', label: 'District', icon: Building2 },
        { key: 'block', label: 'Block / Sub-District', icon: TreePine },
        { key: 'village', label: 'Village', icon: Home },
        { key: 'panchayatName', label: 'Gram Panchayat', icon: Shield },
    ];

    const extraFields = [
        { key: 'minority', label: 'Minority Community' },
        { key: 'maritalStatus', label: 'Marital Status', format: v => String(v)[0].toUpperCase() + String(v).slice(1) },
        { key: 'bplCard', label: 'Ration Card Type' },
        { key: 'landOwned', label: 'Owns Land' },
        { key: 'landSize', label: 'Land Size (Acres)', format: v => `${v} Acre${v !== 1 ? 's' : ''}` },
        { key: 'tenantFarmer', label: 'Tenant Farmer' },
        { key: 'livestock', label: 'Rears Livestock' },
        { key: 'shgMember', label: 'SHG/FPO Member' },
        { key: 'mgnregaCard', label: 'MGNREGS Card' },
        { key: 'streetVendor', label: 'Street Vendor' },
        { key: 'classLevel', label: 'Class / Education' },
        { key: 'govtSchool', label: 'Govt School Student' },
        { key: 'msmeRegistered', label: 'MSME Registered' },
        { key: 'businessTurnover', label: 'Business Turnover (₹)', format: v => typeof v === 'number' ? v.toLocaleString('en-IN') : v },
        { key: 'loanNeeded', label: 'Seeking Govt Loan' },
        { key: 'skillTrained', label: 'Skill Trained' },
        { key: 'interestedInTraining', label: 'Interested in Skill Training' },
        { key: 'pensionReceiving', label: 'Receiving Pension' },
        { key: 'pregnant', label: 'Pregnant' },
        { key: 'lactating', label: 'Lactating Mother' },
        { key: 'isWidow', label: 'Widow' },
        { key: 'disabilityPercent', label: 'Disability (%)', format: v => `${v}%` },
        { key: 'disabilityCertificate', label: 'UDID / Disability Cert' },
        { key: 'ownHouse', label: 'Owns Pacca House' },
        { key: 'kutchaHouse', label: 'Lives in Kutcha House' },
        { key: 'educationLevel', label: 'Education Qualification' },
        { key: 'seekingWork', label: 'Seeking Work' },
    ].filter(({ key }) => {
        const v = citizenProfile[key];
        return v !== null && v !== undefined && v !== '' && v !== false;
    });

    /* ── Loading ───────────────────────────────────────────────────────── */
    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-saffron" />
            </div>
        );
    }

    /* ── Render ─────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-16">
            {/* ═══ PROFILE HEADER ═══ */}
            <div className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-saffron/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-14 lg:pb-24">
                    <M>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-saffron to-orange-500 flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg shadow-saffron/25 ring-4 ring-white/10">
                                {initials}
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h1 className="font-display text-2xl lg:text-3xl text-white font-bold tracking-tight">
                                    {displayName}
                                </h1>
                                <p className="font-body text-slate-400 text-sm mt-1">{displayEmail}</p>
                                {citizenProfile.village && (
                                    <p className="font-body text-slate-500 text-xs mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                                        <MapPin size={12} />
                                        {citizenProfile.village}, {citizenProfile.district}
                                    </p>
                                )}
                            </div>
                            {/* Edit button */}
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-500 text-white font-body text-xs font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25">
                                        <Save size={14} /> Save Changes
                                    </button>
                                    <button onClick={handleCancel} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white/10 text-white/70 font-body text-xs font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm">
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            ) : (
                                <button onClick={startEditing} className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-white/10 text-white font-body text-xs font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
                                    <Edit3 size={14} /> Edit Profile
                                </button>
                            )}
                        </div>
                    </M>
                </div>
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">

                {/* ── Stats + Progress Row ─── */}
                <M delay={0.05}>
                    <Card className="p-5 mb-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
                            {/* Progress bar */}
                            <div className="flex-1 w-full lg:w-auto">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-body text-xs text-gray-500 font-medium">Profile Completion</span>
                                    <span className="font-display text-sm font-bold text-gray-900">{completionPct}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionPct}%` }}
                                        transition={{ duration: 0.8, ease: [.22, 1, .36, 1] }}
                                        className={`h-full rounded-full ${completionPct === 100
                                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                            : completionPct >= 60
                                                ? 'bg-gradient-to-r from-saffron to-orange-400'
                                                : 'bg-gradient-to-r from-amber-400 to-saffron'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden lg:block w-px h-12 bg-gray-200" />

                            {/* Stats */}
                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                <StatBadge icon={FileText} label="Applied" value={appliedCount} color="bg-blue-500" />
                                <StatBadge icon={CheckCircle2} label="Eligible" value={eligibleCount} color="bg-emerald-500" />
                                <StatBadge icon={Star} label="Matched" value={eligibleCount} color="bg-saffron" />
                            </div>
                        </div>
                    </Card>
                </M>

                {/* ── Two-Column Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        {/* Personal Information Card */}
                        <M delay={0.1}>
                            <Card className="p-6" hover>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center">
                                        <User size={16} className="text-saffron" />
                                    </div>
                                    <h2 className="font-body text-[15px] font-bold text-gray-900">Personal Information</h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {personalFields.map((f) => (
                                        <FieldRow
                                            key={f.key}
                                            icon={f.icon}
                                            label={f.label}
                                            value={isEditing ? draft[f.key] : citizenProfile[f.key]}
                                            placeholder={PLACEHOLDER_MAP[f.key]}
                                            isEditing={isEditing}
                                            fieldKey={f.key}
                                            type={f.type}
                                            onChange={handleChange}
                                            error={validationErrors[f.key]}
                                        />
                                    ))}
                                </div>
                            </Card>
                        </M>

                        {/* Demographics & Financial Card */}
                        <M delay={0.15}>
                            <Card className="p-6" hover>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <BarChart3 size={16} className="text-indigo-500" />
                                    </div>
                                    <h2 className="font-body text-[15px] font-bold text-gray-900">Demographics & Finance</h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {[...demographicFields, ...financialFields].map((f) => {
                                        const rawVal = isEditing ? draft[f.key] : citizenProfile[f.key];
                                        const displayVal = f.format ? f.format(rawVal) : rawVal;
                                        return (
                                            <FieldRow
                                                key={f.key}
                                                icon={f.icon}
                                                label={f.label}
                                                value={displayVal}
                                                placeholder={PLACEHOLDER_MAP[f.key]}
                                                isEditing={isEditing}
                                                fieldKey={f.key}
                                                type={f.type}
                                                onChange={handleChange}
                                                error={validationErrors[f.key]}
                                            />
                                        );
                                    })}
                                </div>
                            </Card>
                        </M>

                        {/* Additional Details */}
                        {extraFields.length > 0 && (
                            <M delay={0.2}>
                                <Card className="p-6" hover>
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <Briefcase size={16} className="text-purple-500" />
                                        </div>
                                        <h2 className="font-body text-[15px] font-bold text-gray-900">Additional Details</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {extraFields.map((f) => (
                                            <div key={f.key} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                                <span className="text-[10px] text-gray-500 font-body uppercase tracking-wider">{f.label}</span>
                                                <span className="text-xs font-body font-semibold text-gray-800">{f.format ? f.format(citizenProfile[f.key]) : fmt(citizenProfile[f.key])}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </M>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* Location Card */}
                        <M delay={0.1}>
                            <Card className="p-6" hover>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <MapPin size={16} className="text-blue-500" />
                                        </div>
                                        <h2 className="font-body text-[15px] font-bold text-gray-900">Location</h2>
                                    </div>
                                    <button
                                        onClick={() => navigate('/setup-location')}
                                        className="inline-flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-body font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <Edit3 size={12} /> {hasLocation ? 'Change' : 'Set Location'}
                                    </button>
                                </div>

                                {hasLocation ? (
                                    <div className="space-y-0.5">
                                        {locationFields.map(({ key, label, icon }) => (
                                            <LocationField key={key} icon={icon} label={label} value={citizenProfile[key]} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 px-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                            <MapPin size={24} className="text-blue-400" />
                                        </div>
                                        <p className="font-body text-sm text-gray-500 mb-3">Set your location to connect with your local panchayat</p>
                                        <button
                                            onClick={() => navigate('/setup-location')}
                                            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-500 text-white font-body text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            <MapPin size={16} /> Set Your Location
                                        </button>
                                    </div>
                                )}
                            </Card>
                        </M>

                        {/* Smart Document Import Card */}
                        <M delay={0.12}>
                            <Card className="p-6" hover>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                        <FileText size={16} className="text-teal-500" />
                                    </div>
                                    <h2 className="font-body text-[15px] font-bold text-gray-900">Smart Document Import</h2>
                                </div>
                                <p className="font-body text-sm text-gray-500 mb-4">
                                    Upload Aadhaar, Income Certificate or Ration Card — AI automatically fills your profile.
                                </p>
                                <Link
                                    to="/documents"
                                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-500 text-white font-body text-sm font-semibold hover:bg-teal-600 transition-colors"
                                >
                                    <FileText size={15} /> Import Documents
                                </Link>
                            </Card>
                        </M>

                        {/* Quick Links Card */}
                        <M delay={0.15}>
                            <Card className="p-6" hover>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <ChevronRight size={16} className="text-emerald-500" />
                                    </div>
                                    <h2 className="font-body text-[15px] font-bold text-gray-900">Quick Links</h2>
                                </div>
                                <div className="space-y-1.5">
                                    {[
                                        { label: 'My Dashboard', path: '/dashboard', icon: BarChart3, desc: 'Overview and stats' },
                                        { label: 'Browse Schemes', path: '/schemes', icon: FileText, desc: 'Find government schemes' },
                                        { label: 'My Applications', path: '/applications', icon: Clock, desc: `${appliedCount} application${appliedCount !== 1 ? 's' : ''}` },
                                        { label: 'Ask Sarathi', path: '/chat', icon: Star, desc: 'AI welfare assistant' },
                                    ].map((link) => (
                                        <button
                                            key={link.path}
                                            onClick={() => navigate(link.path)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group text-left"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-saffron/10 group-hover:border-saffron/20 transition-colors">
                                                <link.icon size={16} className="text-gray-400 group-hover:text-saffron transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-body text-sm font-medium text-gray-800 group-hover:text-saffron transition-colors">{link.label}</p>
                                                <p className="font-body text-[11px] text-gray-400">{link.desc}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-300 group-hover:text-saffron transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </M>

                        {/* Sign Out */}
                        <M delay={0.2}>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-red-200 bg-white text-red-500 font-body text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </M>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
