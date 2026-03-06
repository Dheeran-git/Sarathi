import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Loader2, Check, Building2, Landmark, TreePine, Search, ArrowLeft } from 'lucide-react';
import { useCitizen } from '../context/CitizenContext';
import { useToast } from '../components/ui/Toast';

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

/* ─── step config ───────────────────────────────────────────────────── */
const STEPS = [
    { key: 'state', label: 'State / UT', icon: Landmark, color: 'bg-saffron/10 text-saffron', ring: 'ring-saffron/20' },
    { key: 'district', label: 'District', icon: Building2, color: 'bg-blue-50 text-blue-500', ring: 'ring-blue-200' },
    { key: 'block', label: 'Sub-District / Block', icon: TreePine, color: 'bg-emerald-50 text-emerald-500', ring: 'ring-emerald-200' },
    { key: 'village', label: 'Village', icon: MapPin, color: 'bg-purple-50 text-purple-500', ring: 'ring-purple-200' },
];

/* ─── main component ────────────────────────────────────────────────── */
export default function LocationSetupPage() {
    const navigate = useNavigate();
    const { updateProfile, saveCurrentProfile, citizenProfile } = useCitizen();
    const { addToast } = useToast();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [villages, setVillages] = useState([]);

    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedVillage, setSelectedVillage] = useState(null);
    const [search, setSearch] = useState('');

    /* ── load states ──────────────────────────────────────────────────── */
    useEffect(() => {
        setLoading(true);
        fetchJson('states.json')
            .then(setStates)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    /* ── handlers ──────────────────────────────────────────────────────── */
    const handleSelectState = useCallback(async (state) => {
        setSelectedState(state); setSelectedDistrict(''); setSelectedBlock(''); setSelectedVillage(null);
        setDistricts([]); setBlocks([]); setVillages([]); setSearch(''); setCurrentStep(1);
        setLoading(true);
        try { setDistricts(await fetchJson(`districts/${slugify(state)}.json`)); } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    const handleSelectDistrict = useCallback(async (district) => {
        setSelectedDistrict(district); setSelectedBlock(''); setSelectedVillage(null);
        setBlocks([]); setVillages([]); setSearch(''); setCurrentStep(2);
        setLoading(true);
        try { setBlocks(await fetchJson(`blocks/${slugify(selectedState)}/${slugify(district)}.json`)); } catch (e) { console.error(e); }
        setLoading(false);
    }, [selectedState]);

    const handleSelectBlock = useCallback(async (block) => {
        setSelectedBlock(block); setSelectedVillage(null); setVillages([]); setSearch(''); setCurrentStep(3);
        setLoading(true);
        try { setVillages(await fetchJson(`villages/${slugify(selectedState)}/${slugify(selectedDistrict)}/${slugify(block)}.json`)); } catch (e) { console.error(e); }
        setLoading(false);
    }, [selectedState, selectedDistrict]);

    const handleSelectVillage = useCallback((village) => {
        setSelectedVillage(village); setSearch(''); setCurrentStep(4);
    }, []);

    const goBack = () => {
        if (currentStep === 0) return;
        setSearch('');
        if (currentStep === 4) { setSelectedVillage(null); setCurrentStep(3); }
        else if (currentStep === 3) { setSelectedBlock(''); setVillages([]); setCurrentStep(2); }
        else if (currentStep === 2) { setSelectedDistrict(''); setBlocks([]); setCurrentStep(1); }
        else if (currentStep === 1) { setSelectedState(''); setDistricts([]); setCurrentStep(0); }
    };

    /* ── confirm & save ────────────────────────────────────────────────── */
    const handleConfirm = async () => {
        if (!selectedVillage) return;
        setSaving(true);
        // Special patch for Haadli: local data has 219293, but claimed ID is 614744
        let pCode = selectedVillage.panchayatCode || '';
        if (pCode === '219293' || selectedVillage.panchayatName === 'Haadli') {
            pCode = '614744';
        }

        const locationData = {
            state: selectedState, district: selectedDistrict, block: selectedBlock,
            village: selectedVillage.name, villageCode: selectedVillage.code,
            panchayatCode: pCode,
            panchayatName: selectedVillage.panchayatName || '',
            panchayatId: pCode
                ? pCode
                : `${slugify(selectedVillage.name)}-${slugify(selectedDistrict)}-${slugify(selectedState)}`,
        };
        updateProfile(locationData);
        try {
            await saveCurrentProfile();
            addToast('Location saved to your profile!', 'success');
        } catch (err) {
            console.warn('API save failed:', err.message);
            addToast('Saved locally — will sync to database when connection is restored', 'info');
        }
        setSaving(false);
        navigate('/dashboard');
    };

    /* ── filtered options ──────────────────────────────────────────────── */
    const getCurrentOptions = () => {
        const lists = [states, districts, blocks, villages];
        const items = lists[currentStep] || [];
        const q = search.toLowerCase().trim();
        if (!q) return items;
        if (currentStep === 3) return items.filter(v => v.name.toLowerCase().includes(q));
        return items.filter(s => s.toLowerCase().includes(q));
    };

    const getCurrentHandler = () => [handleSelectState, handleSelectDistrict, handleSelectBlock, handleSelectVillage][currentStep];
    const options = getCurrentOptions();
    const stepConfig = STEPS[currentStep] || STEPS[3];

    /* ── breadcrumb selections ─────────────────────────────────────────── */
    const selections = [
        { label: 'State', value: selectedState },
        { label: 'District', value: selectedDistrict },
        { label: 'Block', value: selectedBlock },
        { label: 'Village', value: selectedVillage?.name },
    ].filter(s => s.value);

    /* ── render ────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#F8F9FB]">
            {/* ═══ TOP HEADER ═══ */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-4">
                        <button
                            onClick={currentStep > 0 ? goBack : () => navigate(-1)}
                            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={16} className="text-gray-600" />
                        </button>
                        <div className="flex-1">
                            <h1 className="font-display text-lg font-bold text-gray-900">Set Your Location</h1>
                            <p className="font-body text-xs text-gray-400">Connect to your local panchayat for welfare schemes & benefits</p>
                        </div>
                        {/* Step indicator */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            {STEPS.map((step, i) => (
                                <div key={step.key} className="flex items-center">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${i < currentStep ? 'bg-emerald-100 text-emerald-600' :
                                        i === currentStep && currentStep < 4 ? 'bg-saffron/10 text-saffron ring-2 ring-saffron/20' :
                                            'bg-gray-100 text-gray-400'
                                        }`}>
                                        {i < currentStep ? <Check size={14} /> : i + 1}
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`w-6 h-0.5 mx-0.5 rounded-full ${i < currentStep ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ═══ LEFT SIDEBAR — Breadcrumb & Info ═══ */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="sticky top-24 space-y-4">
                            {/* Selection summary */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="font-body text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4">Your Selection</h3>
                                {selections.length === 0 ? (
                                    <p className="font-body text-sm text-gray-300 italic">Start by selecting your state</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {selections.map((s, i) => (
                                            <motion.div
                                                key={s.label}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                    <Check size={12} className="text-emerald-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-body">{s.label}</p>
                                                    <p className="text-sm text-gray-900 font-body font-medium truncate">{s.value}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Panchayat mapping */}
                                {selectedVillage?.panchayatName && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 pt-4 border-t border-gray-100"
                                    >
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-body mb-1">Gram Panchayat</p>
                                        <p className="text-sm font-body font-semibold text-indigo-600">{selectedVillage.panchayatName}</p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Info tip */}
                            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
                                <p className="font-body text-xs text-blue-600 leading-relaxed">
                                    <strong>Why set your location?</strong><br />
                                    This connects you to your village panchayat head for access to local welfare schemes, government benefits, and community support.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ MAIN CONTENT ═══ */}
                    <div className="lg:col-span-8 xl:col-span-9">

                        {/* Step 4: Confirmation */}
                        {currentStep === 4 && selectedVillage ? (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6 border-b border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                            <Check size={24} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="font-display text-xl font-bold text-gray-900">Confirm Your Location</h2>
                                            <p className="font-body text-sm text-gray-500">Please verify the details below are correct</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                        {[
                                            { label: 'State', value: selectedState, icon: Landmark, color: 'bg-saffron/10 text-saffron' },
                                            { label: 'District', value: selectedDistrict, icon: Building2, color: 'bg-blue-50 text-blue-500' },
                                            { label: 'Block', value: selectedBlock, icon: TreePine, color: 'bg-emerald-50 text-emerald-500' },
                                            { label: 'Village', value: selectedVillage.name, icon: MapPin, color: 'bg-purple-50 text-purple-500' },
                                            ...(selectedVillage.panchayatName
                                                ? [{ label: 'Gram Panchayat', value: selectedVillage.panchayatName, icon: Building2, color: 'bg-indigo-50 text-indigo-500', span: true }]
                                                : []),
                                        ].map((item, i) => (
                                            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 ${item.span ? 'sm:col-span-2' : ''}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                                                    <item.icon size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-body font-medium">{item.label}</p>
                                                    <p className="text-sm font-body font-semibold text-gray-900">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={goBack}
                                            className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-body text-sm font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Go Back
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={saving}
                                            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-saffron to-orange-500 text-white font-body text-sm font-semibold hover:from-saffron/90 hover:to-orange-400 transition-all shadow-lg shadow-saffron/20 flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={18} /> Save & Continue</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* Steps 0-3: Selection Lists */
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Current step header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stepConfig.color}`}>
                                        <stepConfig.icon size={18} />
                                    </div>
                                    <div>
                                        <h2 className="font-body text-[15px] font-bold text-gray-900">
                                            Select {stepConfig.label}
                                        </h2>
                                        <p className="font-body text-xs text-gray-400">
                                            Step {currentStep + 1} of 4
                                        </p>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder={`Search ${stepConfig.label.toLowerCase()}...`}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-gray-900 placeholder-gray-400 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron/40 transition-all"
                                        />
                                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    {options.length > 0 && (
                                        <p className="mt-2 text-[11px] font-body text-gray-400 font-medium">
                                            {options.length} {stepConfig.label.toLowerCase()}{options.length !== 1 ? 's' : ''} found
                                        </p>
                                    )}
                                </div>

                                {/* Options List */}
                                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-20">
                                            <Loader2 className="w-6 h-6 animate-spin text-saffron mr-3" />
                                            <span className="font-body text-sm text-gray-400">Loading...</span>
                                        </div>
                                    ) : options.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <Search size={24} className="text-gray-300 mb-2" />
                                            <span className="font-body text-sm text-gray-400">
                                                {search ? 'No matches found' : 'No data available'}
                                            </span>
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentStep}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {options.map((item, i) => {
                                                    const isVillage = currentStep === 3;
                                                    const name = isVillage ? item.name : item;
                                                    const handler = getCurrentHandler();

                                                    return (
                                                        <button
                                                            key={isVillage ? item.code : item}
                                                            onClick={() => handler(item)}
                                                            className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors text-left group border-b border-gray-50 last:border-b-0"
                                                        >
                                                            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-saffron/10 group-hover:text-saffron transition-colors text-xs font-mono font-semibold">
                                                                {String(i + 1).padStart(2, '0')}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-body text-sm text-gray-800 group-hover:text-saffron transition-colors font-medium">
                                                                    {name}
                                                                </span>
                                                                {isVillage && item.panchayatName && (
                                                                    <span className="block text-[11px] font-body text-gray-400 mt-0.5">
                                                                        GP: {item.panchayatName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-saffron transition-colors flex-shrink-0" />
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
            </div>

            {/* Footer note */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <p className="text-center font-body text-xs text-gray-400 mt-4">
                    You can change your location later from your Profile settings
                </p>
            </div>
        </div>
    );
}
