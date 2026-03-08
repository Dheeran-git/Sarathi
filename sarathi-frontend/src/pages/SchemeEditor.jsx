import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Save,
    Send,
    ArrowLeft,
    Plus,
    X,
    FileText,
    Info,
    Calendar,
    Layers,
    Link as LinkIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createScheme } from '../utils/api';

function SchemeEditor() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [scheme, setScheme] = useState({
        nameEnglish: '',
        ministry: '',
        annualBenefit: '',
        details: '',
        category: 'Education',
        stateCentralTag: 'Central',
        deadline: '',
        applyUrl: '',
        documentsRequiredEn: []
    });

    const [docInput, setDocInput] = useState('');

    const addDocument = () => {
        if (docInput.trim()) {
            setScheme({ ...scheme, documentsRequiredEn: [...scheme.documentsRequiredEn, docInput.trim()] });
            setDocInput('');
        }
    };

    const removeDocument = (index) => {
        const newDocs = [...scheme.documentsRequiredEn];
        newDocs.splice(index, 1);
        setScheme({ ...scheme, documentsRequiredEn: newDocs });
    };

    const handleSubmit = async (status) => {
        if (!scheme.nameEnglish || !scheme.ministry) {
            alert("Please fill in the scheme name and ministry.");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...scheme, status };
            console.log("Submitting scheme:", payload);
            await createScheme(payload);

            alert(`Scheme successfully ${status === 'Published' ? 'published to live portal' : 'saved as draft'}!`);
            navigate('/admin');
        } catch (err) {
            console.error("Failed to save scheme:", err);
            alert(`Error: ${err.message || "Failed to save scheme. Please check your connection."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-navy"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="font-display text-3xl font-bold text-navy">Launch New <span className="text-saffron">Scheme</span></h1>
                    <p className="font-body text-sm text-gray-500 mt-1">Fill in the details to publish a government welfare program.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="flex items-center gap-2 font-display text-lg text-navy border-b border-gray-50 pb-4">
                            <FileText size={20} className="text-saffron" /> Basic Information
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Scheme Name (English)</label>
                                <input
                                    className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-saffron outline-none transition-all font-body text-sm"
                                    placeholder="e.g. Pradhan Mantri Awas Yojana"
                                    value={scheme.nameEnglish}
                                    onChange={e => setScheme({ ...scheme, nameEnglish: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Ministry / Department</label>
                                <input
                                    className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-saffron outline-none transition-all font-body text-sm"
                                    placeholder="e.g. Ministry of Rural Development"
                                    value={scheme.ministry}
                                    onChange={e => setScheme({ ...scheme, ministry: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Annual Benefit (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-saffron outline-none transition-all font-body text-sm"
                                        placeholder="25000"
                                        value={scheme.annualBenefit}
                                        onChange={e => setScheme({ ...scheme, annualBenefit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Deadline</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-saffron outline-none transition-all font-body text-sm text-gray-500"
                                        value={scheme.deadline}
                                        onChange={e => setScheme({ ...scheme, deadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Eligibility & Details</label>
                                <textarea
                                    className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-saffron outline-none transition-all font-body text-sm min-h-[160px]"
                                    placeholder="Explain who can apply and what the benefits are..."
                                    value={scheme.details}
                                    onChange={e => setScheme({ ...scheme, details: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="flex items-center gap-2 font-display text-lg text-navy border-b border-gray-50 pb-4">
                            <Layers size={20} className="text-saffron" /> Documents & Links
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Required Documents</label>
                            <div className="flex gap-2 mb-4">
                                <input
                                    className="flex-1 h-11 px-4 rounded-xl border border-gray-100 bg-gray-50/50 outline-none font-body text-sm"
                                    placeholder="e.g. Aadhaar Card"
                                    value={docInput}
                                    onChange={e => setDocInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && addDocument()}
                                />
                                <button
                                    onClick={addDocument}
                                    className="w-11 h-11 bg-navy text-white rounded-xl flex items-center justify-center hover:bg-navy-light transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {scheme.documentsRequiredEn.map((doc, i) => (
                                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium font-body transition-all hover:bg-red-50 hover:text-red-500 group cursor-pointer" onClick={() => removeDocument(i)}>
                                        {doc}
                                        <X size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Official Application URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-saffron outline-none transition-all font-body text-sm"
                                    placeholder="https://india.gov.in/scheme-apply"
                                    value={scheme.applyUrl}
                                    onChange={e => setScheme({ ...scheme, applyUrl: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Sidebar! */}
                <div className="space-y-6">
                    <section className="bg-navy p-8 rounded-3xl text-white shadow-xl shadow-navy/20">
                        <h3 className="font-display text-lg mb-6 flex items-center gap-2"><Send size={18} className="text-saffron" /> Actions</h3>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSubmit('Published')}
                                disabled={loading}
                                className="w-full h-12 bg-saffron hover:bg-saffron-light text-white font-body font-bold rounded-xl shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : <><Send size={16} /> Publish to Live Portal</>}
                            </button>
                            <button
                                onClick={() => handleSubmit('Draft')}
                                disabled={loading}
                                className="w-full h-12 bg-navy-light/30 hover:bg-navy-light/50 text-white font-body font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} /> Save as Draft
                            </button>
                        </div>

                        <p className="text-[10px] text-gray-400 mt-6 font-body text-center leading-relaxed">
                            Once published, the scheme will be immediately discoverable by citizens via the smart assistant and search portal.
                        </p>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-display text-lg text-navy mb-6">Classification</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Category</label>
                                <select
                                    className="w-full h-11 px-3 rounded-xl border border-gray-100 bg-gray-50 font-body text-sm outline-none focus:border-saffron transition-all"
                                    value={scheme.category}
                                    onChange={e => setScheme({ ...scheme, category: e.target.value })}
                                >
                                    <option>Education</option>
                                    <option>Agriculture</option>
                                    <option>Health</option>
                                    <option>Social Welfare</option>
                                    <option>Housing</option>
                                    <option>Pension</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-body">Scheme Tag</label>
                                <div className="flex gap-2">
                                    {['Central', 'State'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setScheme({ ...scheme, stateCentralTag: tag })}
                                            className={`flex-1 h-10 rounded-xl font-body text-xs font-bold tracking-widest transition-all ${scheme.stateCentralTag === tag ? 'bg-navy text-white' : 'bg-gray-50 text-gray-400'
                                                }`}
                                        >
                                            {tag.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="p-6 bg-saffron/5 rounded-3xl border border-saffron/10">
                        <div className="flex gap-3">
                            <Info size={20} className="text-saffron shrink-0" />
                            <p className="font-body text-xs text-saffron font-medium leading-relaxed">
                                Ensure all eligibility criteria match the official Gazette notification to prevent application rejections.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SchemeEditor;
