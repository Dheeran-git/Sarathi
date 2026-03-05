import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Eye, EyeOff, Loader2, MapPin, Search, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { searchPanchayats } from '../utils/api';

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
    const [stateName, setStateName] = useState('');
    const [districtName, setDistrictName] = useState('');
    const [blockName, setBlockName] = useState('');
    const [panchayatId, setPanchayatId] = useState('');
    const [lgdCode, setLgdCode] = useState('');
    const [panchayatName, setPanchayatName] = useState('');
    const [officialName, setOfficialName] = useState('');
    const [role, setRole] = useState('sarpanch');
    const [contactNumber, setContactNumber] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    // Location Search State (Hierarchical)
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [blocksList, setBlocksList] = useState([]);
    const [villagesList, setVillagesList] = useState([]);
    const [isLocationLoading, setIsLocationLoading] = useState(false);

    const passwordRules = useMemo(
        () => PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(password) })),
        [password]
    );
    const passwordStrength = passwordRules.filter((r) => r.pass).length;
    const strengthColor = passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-green-500';

    // Initial load: Fetch States
    useEffect(() => {
        setIsLocationLoading(true);
        fetchJson('states.json')
            .then(setStatesList)
            .catch(console.error)
            .finally(() => setIsLocationLoading(false));
    }, []);

    const handleStateChange = async (e) => {
        const state = e.target.value;
        setStateName(state);
        setDistrictName(''); setBlockName(''); setPanchayatId(''); setLgdCode(''); setPanchayatName('');
        setDistrictsList([]); setBlocksList([]); setVillagesList([]);
        if (!state) return;

        setIsLocationLoading(true);
        try { setDistrictsList(await fetchJson(`districts/${slugify(state)}.json`)); } catch (e) { console.error(e); }
        setIsLocationLoading(false);
    };

    const handleDistrictChange = async (e) => {
        const district = e.target.value;
        setDistrictName(district);
        setBlockName(''); setPanchayatId(''); setLgdCode(''); setPanchayatName('');
        setBlocksList([]); setVillagesList([]);
        if (!district) return;

        setIsLocationLoading(true);
        try { setBlocksList(await fetchJson(`blocks/${slugify(stateName)}/${slugify(district)}.json`)); } catch (e) { console.error(e); }
        setIsLocationLoading(false);
    };

    const handleBlockChange = async (e) => {
        const block = e.target.value;
        setBlockName(block);
        setPanchayatId(''); setLgdCode(''); setPanchayatName('');
        setVillagesList([]);
        if (!block) return;

        setIsLocationLoading(true);
        try { setVillagesList(await fetchJson(`villages/${slugify(stateName)}/${slugify(districtName)}/${slugify(block)}.json`)); } catch (e) { console.error(e); }
        setIsLocationLoading(false);
    };

    const handleVillageChange = (e) => {
        const vName = e.target.value;
        if (!vName) {
            setPanchayatId(''); setLgdCode(''); setPanchayatName('');
            return;
        }
        const village = villagesList.find(v => v.name === vName);
        if (village) {
            setPanchayatName(village.panchayatName || village.name);
            setLgdCode(village.code || '');
            setPanchayatId(village.panchayatCode || `${slugify(village.name)}-${slugify(districtName)}-${slugify(stateName)}`);
        }
    };

    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!email.toLowerCase().endsWith('@gov.in')) return setError('A valid @gov.in official email address is required.');
            if (passwordStrength < 4) return setError('Please meet all password requirements');
            if (password !== confirmPassword) return setError('Passwords do not match');
        }
        if (step === 2 && !panchayatId) return setError('Please select a Panchayat');
        if (step === 3) {
            if (!officialName) return setError('Please enter your full official name');
            if (!/^[6-9]\d{9}$/.test(contactNumber)) return setError('Please enter a valid 10-digit Indian mobile number starting with 6-9');
        }

        setStep(s => s + 1);
    };

    const handleSignup = async () => {
        setIsLoading(true);
        setError('');
        try {
            await authService.panchayatSignUp(
                email,
                password,
                {
                    panchayatId,
                    lgdCode,
                    role,
                    state: stateName,
                    district: districtName,
                    panchayatName,
                    officialName,
                    mobileNumber: contactNumber
                }
            );

            navigate('/panchayat/login', {
                state: {
                    email,
                    message: 'Registration successful! Your account has been verified automatically. You may now log in.'
                }
            });
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Header / Progress bar */}
                <div className="bg-teal-700 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-teal-900">
                        <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>
                    <h1 className="text-2xl font-display font-bold">Panchayat Portal Registration</h1>
                    <p className="text-teal-100 mt-1 text-sm font-medium">Step {step} of 4: {
                        step === 1 ? 'Account Setup' :
                            step === 2 ? 'Find Your Panchayat' :
                                step === 3 ? 'Official Details' : 'Review & Submit'
                    }</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium text-slate-900"
                                    placeholder="sarpanch.rampur@gov.in"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Create Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl pr-12 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {password && (
                                        <div className="mt-3">
                                            <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className={`flex-1 ${i <= passwordStrength ? strengthColor : 'bg-transparent'} transition-colors duration-300`} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            {password && (
                                <ul className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    {passwordRules.map((rule, idx) => (
                                        <li key={idx} className={`flex items-center gap-2 ${rule.pass ? 'text-teal-600 font-medium' : 'text-slate-500'}`}>
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${rule.pass ? 'bg-teal-100 border-teal-500' : 'bg-white border-slate-300'}`}>
                                                {rule.pass && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                                            </div>
                                            {rule.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 text-sm text-teal-800 mb-6 font-medium flex gap-3">
                                <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                Select your exact location from the Local Government Directory (LGD).
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                                    <select
                                        value={stateName}
                                        onChange={handleStateChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Select State</option>
                                        {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">District</label>
                                    <select
                                        value={districtName}
                                        onChange={handleDistrictChange}
                                        disabled={!stateName}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    >
                                        <option value="">Select District</option>
                                        {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Block / Sub-District</label>
                                    <select
                                        value={blockName}
                                        onChange={handleBlockChange}
                                        disabled={!districtName}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    >
                                        <option value="">Select Block</option>
                                        {blocksList.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Village / Panchayat</label>
                                    <select
                                        value={panchayatId ? (villagesList.find(v => (v.panchayatCode || `${slugify(v.name)}-${slugify(districtName)}-${slugify(stateName)}`) === panchayatId)?.name || '') : ''}
                                        onChange={handleVillageChange}
                                        disabled={!blockName}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    >
                                        <option value="">Select Village</option>
                                        {villagesList.map(v => <option key={v.code} value={v.name}>{v.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {isLocationLoading && (
                                <div className="flex items-center justify-center text-teal-600 text-sm py-2">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Loading location data...
                                </div>
                            )}

                            {panchayatId && (
                                <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-teal-900">{panchayatName}</div>
                                        <div className="text-xs text-teal-700 mt-0.5">LGD Code: {lgdCode || 'N/A'}</div>
                                    </div>
                                    <CheckCircle2 className="w-6 h-6 text-teal-600" />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Name</label>
                                <input type="text"
                                    value={officialName}
                                    onChange={(e) => setOfficialName(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="sarpanch">Sarpanch / Pradhan</option>
                                    <option value="secretary">Panchayat Secretary</option>
                                    <option value="vdo">Village Development Officer (VDO)</option>
                                    <option value="bdo">Block Development Officer (BDO)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number (For Verification)</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-medium">+91</span>
                                    <input type="text"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Account Summary</h3>
                                <dl className="grid grid-cols-1 gap-y-4 text-sm">
                                    <div>
                                        <dt className="text-slate-500 mb-1">Panchayat</dt>
                                        <dd className="font-semibold text-slate-900 text-lg">{panchayatName}</dd>
                                        <dd className="text-slate-600">{districtName}, {stateName}</dd>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200">
                                        <dt className="text-slate-500 mb-1">Official Details</dt>
                                        <dd className="font-semibold text-slate-900">{officialName}</dd>
                                        <dd className="text-slate-600 capitalize">{role.replace('_', ' ')}</dd>
                                        <dd className="text-slate-600 mt-1">{email}</dd>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex justify-between">
                                        <div>
                                            <dt className="text-slate-500 mb-1">LGD Code</dt>
                                            <dd className="font-mono text-slate-900 font-medium">{lgdCode}</dd>
                                        </div>
                                        <div className="text-right">
                                            <dt className="text-slate-500 mb-1">Mobile</dt>
                                            <dd className="text-slate-900 font-medium">+91 {contactNumber}</dd>
                                        </div>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-sm text-amber-800">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                                <p>By proceeding, you certify that you are the authorized government official for this panchayat. False claims are punishable under the IT Act.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(s => s - 1)}
                            className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <Link
                            to="/panchayat/login"
                            className="text-sm text-teal-700 font-semibold hover:text-teal-800 padding-2 pl-0"
                        >
                            Back to login
                        </Link>
                    )}

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-500/30"
                        >
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSignup}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
                            ) : (
                                "Complete Registration"
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-slate-500 font-body text-sm">
                    Already registered your Panchayat?{' '}
                    <Link to="/panchayat/login" className="text-teal-700 font-semibold hover:underline">
                        Sign in here
                    </Link>
                </p>
                <p className="mt-3 font-body text-xs text-slate-400">
                    Are you a citizen?{' '}
                    <Link to="/citizen/login" className="text-teal-600 hover:underline">
                        Citizen Login →
                    </Link>
                </p>
            </div>
        </div>
    );
}
