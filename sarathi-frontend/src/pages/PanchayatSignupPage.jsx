import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { checkPanchayatRole } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, EyeOff, Loader2, MapPin, Search, CheckCircle2, ChevronRight,
    AlertCircle, Building2, Landmark, TreePine, Check, ArrowLeft, Shield, User, Phone
} from 'lucide-react';

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/* ─── helpers ───────────────────────────────────────────────────────── */
const BASE = '/data/locations';

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function fetchJson(path) {
    const res = await fetch(`${BASE}/${path}`);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
}

/* ─── location step config ──────────────────────────────────────────── */
const LOC_STEPS = [
    { key: 'state', label: 'State / UT', icon: Landmark, color: 'bg-teal-50 text-teal-600', ring: 'ring-teal-200' },
    { key: 'district', label: 'District', icon: Building2, color: 'bg-blue-50 text-blue-500', ring: 'ring-blue-200' },
    { key: 'block', label: 'Sub-District / Block', icon: TreePine, color: 'bg-emerald-50 text-emerald-500', ring: 'ring-emerald-200' },
    { key: 'village', label: 'Village / Gram Panchayat', icon: MapPin, color: 'bg-purple-50 text-purple-500', ring: 'ring-purple-200' },
];

export default function PanchayatSignupPage() {
    const navigate = useNavigate();

    // Wizard State
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [panchayatId, setPanchayatId] = useState('');
    const [lgdCode, setLgdCode] = useState('');
    const [panchayatName, setPanchayatName] = useState('');
    const [officialName, setOfficialName] = useState('');
    const [role, setRole] = useState('sarpanch');
    const [contactNumber, setContactNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Location picker state (mirrors LocationSetupPage)
    const [locStep, setLocStep] = useState(0);
    const [locLoading, setLocLoading] = useState(false);
    const [locSearch, setLocSearch] = useState('');

    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [blocksList, setBlocksList] = useState([]);
    const [villagesList, setVillagesList] = useState([]);

    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedVillage, setSelectedVillage] = useState(null);

    const passwordRules = useMemo(
        () => PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(password) })),
        [password]
    );
    const passwordStrength = passwordRules.filter((r) => r.pass).length;
    const strengthColor = passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : passwordStrength === 3 ? 'bg-yellow-500' : 'bg-emerald-500';

    // Load states on mount so they're ready for Step 2
    useEffect(() => {
        setLocLoading(true);
        fetchJson('states.json')
            .then(setStatesList)
            .catch(console.error)
            .finally(() => setLocLoading(false));
    }, []);

    /* ── location handlers (mirrors LocationSetupPage) ────────────────── */
    const handleSelectState = useCallback(async (state) => {
        setSelectedState(state); setSelectedDistrict(''); setSelectedBlock(''); setSelectedVillage(null);
        setDistrictsList([]); setBlocksList([]); setVillagesList([]); setLocSearch(''); setLocStep(1);
        setLocLoading(true);
        try { setDistrictsList(await fetchJson(`districts/${slugify(state)}.json`)); } catch (e) { console.error(e); }
        setLocLoading(false);
    }, []);

    const handleSelectDistrict = useCallback(async (district) => {
        setSelectedDistrict(district); setSelectedBlock(''); setSelectedVillage(null);
        setBlocksList([]); setVillagesList([]); setLocSearch(''); setLocStep(2);
        setLocLoading(true);
        try { setBlocksList(await fetchJson(`blocks/${slugify(selectedState)}/${slugify(district)}.json`)); } catch (e) { console.error(e); }
        setLocLoading(false);
    }, [selectedState]);

    const handleSelectBlock = useCallback(async (block) => {
        setSelectedBlock(block); setSelectedVillage(null); setVillagesList([]); setLocSearch(''); setLocStep(3);
        setLocLoading(true);
        try { setVillagesList(await fetchJson(`villages/${slugify(selectedState)}/${slugify(selectedDistrict)}/${slugify(block)}.json`)); } catch (e) { console.error(e); }
        setLocLoading(false);
    }, [selectedState, selectedDistrict]);

    const handleSelectVillage = useCallback((village) => {
        setSelectedVillage(village); setLocSearch(''); setLocStep(4);
        // Derive panchayat identity from panchayatCode (matching citizen flow exactly)
        const pCode = village.panchayatCode || '';
        setLgdCode(pCode);
        setPanchayatName(village.panchayatName || village.name);
        const pIdRaw = pCode || `${slugify(village.name)}-${slugify(selectedDistrict)}-${slugify(selectedState)}`;
        setPanchayatId(/^\d+$/.test(pIdRaw) ? `LGD_${pIdRaw}` : pIdRaw);
    }, [selectedDistrict, selectedState]);

    const locGoBack = () => {
        setLocSearch('');
        if (locStep === 4) { setSelectedVillage(null); setPanchayatId(''); setLgdCode(''); setPanchayatName(''); setLocStep(3); }
        else if (locStep === 3) { setSelectedBlock(''); setVillagesList([]); setLocStep(2); }
        else if (locStep === 2) { setSelectedDistrict(''); setBlocksList([]); setLocStep(1); }
        else if (locStep === 1) { setSelectedState(''); setDistrictsList([]); setLocStep(0); }
    };

    /* ── filtered location options ────────────────────────────────────── */
    const getLocOptions = () => {
        const lists = [statesList, districtsList, blocksList, villagesList];
        const items = lists[locStep] || [];
        const q = locSearch.toLowerCase().trim();
        if (!q) return items;
        if (locStep === 3) return items.filter(v => v.name.toLowerCase().includes(q) || (v.panchayatName || '').toLowerCase().includes(q));
        return items.filter(s => s.toLowerCase().includes(q));
    };

    const getLocHandler = () => [handleSelectState, handleSelectDistrict, handleSelectBlock, handleSelectVillage][locStep];
    const locOptions = getLocOptions();
    const locConfig = LOC_STEPS[locStep] || LOC_STEPS[3];

    const locSelections = [
        { label: 'State', value: selectedState },
        { label: 'District', value: selectedDistrict },
        { label: 'Block', value: selectedBlock },
        { label: 'Village', value: selectedVillage?.name },
    ].filter(s => s.value);

    /* ── wizard navigation ────────────────────────────────────────────── */
    const handleNext = async () => {
        setError('');
        if (step === 1) {
            if (!email.toLowerCase().endsWith('@gov.in')) return setError('A valid @gov.in official email address is required.');
            if (passwordStrength < 4) return setError('Please meet all password requirements');
            if (password !== confirmPassword) return setError('Passwords do not match');
        }
        if (step === 2 && !panchayatId) return setError('Please select your village to proceed.');
        if (step === 3) {
            if (!officialName) return setError('Please enter your full official name');
            if (!/^[6-9]\d{9}$/.test(contactNumber)) return setError('Please enter a valid 10-digit Indian mobile number starting with 6-9');

            // Check if this GP + Role combination is already taken
            setIsLoading(true);
            try {
                const check = await checkPanchayatRole(panchayatId, role);
                if (check && check.available === false) {
                    setIsLoading(false);
                    return setError(`This role is already taken by ${check.takenBy || 'another official'}. Please select a different role.`);
                }
            } catch (err) {
                console.warn('[Signup] Role check failed:', err.message);
                // If the check fails, allow signup to proceed
            }
            setIsLoading(false);
        }
        setStep(s => s + 1);
    };

    const handleSignup = async () => {
        setIsLoading(true);
        setError('');
        try {
            // 1. Sign up in Cognito
            const sub = await authService.panchayatSignUp(email, password, {
                panchayatId, lgdCode, role,
                state: selectedState, district: selectedDistrict,
                panchayatName, officialName, mobileNumber: contactNumber,
            });

            // 2. Claim Panchayat in DynamoDB IMMEDIATELY to reserve the role
            // This ensures a 2nd user can't sign up for the role while user 1 is verifying their email
            try {
                // Have to lazy-import or use the top-level import (I'll add the import via multi_replace later if needed, but the file already imports checkPanchayatRole so I should use the same api module)
                // Let's rely on adding the import at the top of the file.
                const { claimPanchayat } = await import('../utils/api');
                await claimPanchayat({
                    lgdCode: lgdCode,
                    officialName: officialName,
                    role: role,
                    email: email,
                    cognitoSub: sub?.UserSub || 'pending_login',
                    // Pass metadata so backend can auto-create the record if missing
                    panchayatName: panchayatName,
                    state: selectedState,
                    district: selectedDistrict,
                    block: selectedBlock
                });
            } catch (claimErr) {
                console.warn('[Signup] Claim error:', claimErr);
                // Non-fatal for the signup UI flow
            }

            navigate('/panchayat/verify', {
                state: { email, message: 'Registration initiated! Please verify your email to continue.' }
            });
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    /* ── render ────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl">

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-t-2xl p-6 text-white text-center relative overflow-hidden shadow-xl shadow-teal-900/20">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-teal-900/30">
                        <motion.div
                            className="h-full bg-gradient-to-r from-teal-300 to-emerald-300"
                            animate={{ width: `${(step / 4) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="relative">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Shield className="w-6 h-6 text-teal-200" />
                            <h1 className="text-2xl font-display font-bold">Panchayat Portal Registration</h1>
                        </div>
                        <p className="text-teal-100 text-sm font-medium">
                            Step {step} of 4: {
                                step === 1 ? 'Account Setup' :
                                step === 2 ? 'Find Your Panchayat' :
                                step === 3 ? 'Official Details' : 'Review & Submit'
                            }
                        </p>

                        {/* Step dots */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                        s < step ? 'bg-emerald-400 text-white' :
                                        s === step ? 'bg-white text-teal-700 ring-2 ring-teal-300 shadow-lg' :
                                        'bg-teal-800/40 text-teal-300'
                                    }`}>
                                        {s < step ? <Check size={14} /> : s}
                                    </div>
                                    {s < 4 && (
                                        <div className={`w-8 h-0.5 mx-1 rounded-full ${s < step ? 'bg-emerald-400' : 'bg-teal-800/30'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
                    <div className="p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-sm border border-red-100"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* ═══ STEP 1: Account Setup ═══ */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Email Address</label>
                                    <input
                                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium text-slate-900"
                                        placeholder="sarpanch.village@gov.in"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Must be a valid @gov.in email address</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Create Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl pr-12 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {password && (
                                            <div className="mt-2 flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className={`flex-1 ${i <= passwordStrength ? strengthColor : 'bg-transparent'} transition-colors duration-300`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                {password && (
                                    <ul className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {passwordRules.map((rule, idx) => (
                                            <li key={idx} className={`flex items-center gap-2 ${rule.pass ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${rule.pass ? 'bg-emerald-100 border-emerald-400' : 'bg-white border-slate-300'}`}>
                                                    {rule.pass && <Check className="w-2.5 h-2.5" />}
                                                </div>
                                                {rule.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>
                        )}

                        {/* ═══ STEP 2: Location Picker (mirrors citizen LocationSetupPage) ═══ */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                                    {/* Left sidebar — breadcrumb */}
                                    <div className="lg:col-span-4">
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                                <h3 className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-3">Your Selection</h3>
                                                {locSelections.length === 0 ? (
                                                    <p className="text-sm text-slate-300 italic">Start by selecting your state</p>
                                                ) : (
                                                    <div className="space-y-2.5">
                                                        {locSelections.map((s, i) => (
                                                            <motion.div key={s.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2.5">
                                                                <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                                    <Check size={10} className="text-emerald-500" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                                                                    <p className="text-sm text-slate-800 font-medium truncate">{s.value}</p>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                                {selectedVillage?.panchayatName && (
                                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 pt-3 border-t border-slate-200">
                                                        <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Gram Panchayat</p>
                                                        <p className="text-sm font-semibold text-teal-600">{selectedVillage.panchayatName}</p>
                                                        {lgdCode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">LGD: {lgdCode}</p>}
                                                    </motion.div>
                                                )}
                                            </div>

                                            <div className="bg-teal-50/60 rounded-xl border border-teal-100 p-3">
                                                <p className="text-xs text-teal-700 leading-relaxed">
                                                    <strong>Why set your location?</strong><br />
                                                    This connects your portal to the correct village citizens and welfare scheme applications.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — selection list OR confirmation */}
                                    <div className="lg:col-span-8">
                                        {locStep === 4 && selectedVillage ? (
                                            /* Confirmation */
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 overflow-hidden">
                                                <div className="px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                        <Check size={20} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-[15px]">Location Confirmed</h3>
                                                        <p className="text-xs text-slate-500">You can change this by going back</p>
                                                    </div>
                                                </div>
                                                <div className="p-5 grid grid-cols-2 gap-3">
                                                    {[
                                                        { label: 'State', value: selectedState, icon: Landmark, color: 'bg-teal-50 text-teal-600' },
                                                        { label: 'District', value: selectedDistrict, icon: Building2, color: 'bg-blue-50 text-blue-500' },
                                                        { label: 'Block', value: selectedBlock, icon: TreePine, color: 'bg-emerald-50 text-emerald-500' },
                                                        { label: 'Village', value: selectedVillage.name, icon: MapPin, color: 'bg-purple-50 text-purple-500' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg bg-white/70 border border-slate-100">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                                                                <item.icon size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">{item.label}</p>
                                                                <p className="text-sm font-medium text-slate-800">{item.value}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {selectedVillage.panchayatName && (
                                                        <div className="col-span-2 flex items-center gap-2.5 p-3 rounded-lg bg-teal-100/50 border border-teal-200">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100 text-teal-600">
                                                                <Shield size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Gram Panchayat</p>
                                                                <p className="text-sm font-semibold text-teal-700">{selectedVillage.panchayatName}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-5 pb-4">
                                                    <button onClick={locGoBack} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                                                        <ArrowLeft size={14} /> Change selection
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            /* Steps 0-3: Interactive selection list */
                                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                {/* Header */}
                                                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
                                                    {locStep > 0 && (
                                                        <button onClick={locGoBack} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                                            <ArrowLeft size={14} className="text-slate-500" />
                                                        </button>
                                                    )}
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${locConfig.color}`}>
                                                        <locConfig.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[14px] font-bold text-slate-900">Select {locConfig.label}</h3>
                                                        <p className="text-[11px] text-slate-400">Step {locStep + 1} of 4</p>
                                                    </div>
                                                </div>

                                                {/* Search */}
                                                <div className="px-5 py-2.5 border-b border-slate-50 bg-slate-50/50">
                                                    <div className="relative">
                                                        <input
                                                            type="text" value={locSearch} onChange={(e) => setLocSearch(e.target.value)}
                                                            placeholder={`Search ${locConfig.label.toLowerCase()}...`}
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 pl-9 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                                                        />
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    </div>
                                                    {locOptions.length > 0 && (
                                                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                                                            {locOptions.length} {locConfig.label.toLowerCase()}{locOptions.length !== 1 ? 's' : ''} found
                                                        </p>
                                                    )}
                                                </div>

                                                {/* List */}
                                                <div className="max-h-[340px] overflow-y-auto">
                                                    {locLoading ? (
                                                        <div className="flex items-center justify-center py-16">
                                                            <Loader2 className="w-5 h-5 animate-spin text-teal-500 mr-2" />
                                                            <span className="text-sm text-slate-400">Loading...</span>
                                                        </div>
                                                    ) : locOptions.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-16">
                                                            <Search size={20} className="text-slate-300 mb-2" />
                                                            <span className="text-sm text-slate-400">{locSearch ? 'No matches found' : 'No data available'}</span>
                                                        </div>
                                                    ) : (
                                                        <AnimatePresence mode="wait">
                                                            <motion.div key={locStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                                                {locOptions.map((item, i) => {
                                                                    const isVillage = locStep === 3;
                                                                    const name = isVillage ? item.name : item;
                                                                    const handler = getLocHandler();
                                                                    return (
                                                                        <button
                                                                            key={isVillage ? item.code : item}
                                                                            onClick={() => handler(item)}
                                                                            className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-teal-50/50 transition-colors text-left group border-b border-slate-50 last:border-b-0"
                                                                        >
                                                                            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors text-[11px] font-mono font-semibold">
                                                                                {String(i + 1).padStart(2, '0')}
                                                                            </span>
                                                                            <div className="flex-1 min-w-0">
                                                                                <span className="text-sm text-slate-700 group-hover:text-teal-700 transition-colors font-medium">
                                                                                    {name}
                                                                                </span>
                                                                                {isVillage && item.panchayatName && (
                                                                                    <span className="block text-[10px] text-slate-400 mt-0.5">
                                                                                        GP: {item.panchayatName}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        </AnimatePresence>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 3: Official Details ═══ */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                        <User size={14} className="text-teal-500" /> Official Name
                                    </label>
                                    <input type="text" value={officialName} onChange={(e) => setOfficialName(e.target.value)} placeholder="Your full official name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                        <Shield size={14} className="text-teal-500" /> Official Role
                                    </label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium">
                                        <option value="sarpanch">Sarpanch / Pradhan</option>
                                        <option value="secretary">Panchayat Secretary</option>
                                        <option value="vdo">Village Development Officer (VDO)</option>
                                        <option value="bdo">Block Development Officer (BDO)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                        <Phone size={14} className="text-teal-500" /> Contact Number
                                    </label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-medium text-sm">+91</span>
                                        <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="10-digit mobile" maxLength={10}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 4: Review ═══ */}
                        {step === 4 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 rounded-2xl border border-slate-200">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5">Account Summary</h3>
                                    <dl className="grid grid-cols-1 gap-y-4 text-sm">
                                        <div>
                                            <dt className="text-slate-400 text-xs mb-1">Gram Panchayat</dt>
                                            <dd className="font-bold text-slate-900 text-lg">{panchayatName}</dd>
                                            <dd className="text-slate-500">{selectedDistrict}, {selectedState}</dd>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200">
                                            <dt className="text-slate-400 text-xs mb-1">Official Details</dt>
                                            <dd className="font-semibold text-slate-900">{officialName}</dd>
                                            <dd className="text-slate-500 capitalize">{role.replace('_', ' ')}</dd>
                                            <dd className="text-slate-500 mt-1">{email}</dd>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200 flex justify-between">
                                            <div>
                                                <dt className="text-slate-400 text-xs mb-1">LGD Code</dt>
                                                <dd className="font-mono text-slate-800 font-medium">{lgdCode || 'N/A'}</dd>
                                            </div>
                                            <div className="text-right">
                                                <dt className="text-slate-400 text-xs mb-1">Mobile</dt>
                                                <dd className="text-slate-800 font-medium">+91 {contactNumber}</dd>
                                            </div>
                                        </div>
                                    </dl>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-sm text-amber-800 border border-amber-100">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                                    <p>By proceeding, you certify that you are the authorized government official for this panchayat. False claims may result in legal action.</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        {step > 1 ? (
                            <button type="button" onClick={() => { setStep(s => s - 1); if (step === 3) { /* keep location */ } }}
                                className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2">
                                <ArrowLeft size={16} /> Back
                            </button>
                        ) : (
                            <Link to="/panchayat/login" className="text-sm text-teal-700 font-semibold hover:text-teal-800">
                                Back to login
                            </Link>
                        )}

                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={step === 2 && !panchayatId}
                                className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSignup}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:from-slate-700 hover:to-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20 disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</>
                                ) : (
                                    <>Complete Registration</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        Already registered?{' '}
                        <Link to="/panchayat/login" className="text-teal-700 font-semibold hover:underline">Sign in here</Link>
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                        Are you a citizen?{' '}
                        <Link to="/citizen/login" className="text-teal-600 hover:underline">Citizen Login →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
