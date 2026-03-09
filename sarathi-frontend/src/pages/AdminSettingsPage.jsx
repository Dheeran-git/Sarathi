import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    ShieldAlert,
    BrainCircuit,
    Webhook,
    Save,
    RotateCcw,
    Globe,
    Mail,
    Users,
    Clock,
    Key,
    Database,
    Smartphone,
    CheckCircle2
} from 'lucide-react';

const TABS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'access', label: 'Access Control', icon: ShieldAlert },
    { id: 'ai', label: 'Sarathi Engine', icon: BrainCircuit },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
];

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock Settings State
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        supportEmail: 'support@sarathi.gov.in',
        defaultLanguage: 'en',
        sessionTimeout: '45',
        autoApprovePanchayat: false,
        aiModel: 'claude-3-opus',
        aiStrictness: 75,
        smsGateway: true,
    });

    const handleToggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
    const handleChange = (key, val) => setSettings(s => ({ ...s, [key]: val }));

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API save
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl text-navy font-bold flex items-center gap-3">
                        <Settings className="text-saffron" size={32} />
                        System Configuration
                    </h1>
                    <p className="font-body text-gray-500 mt-2">Manage global platform behaviors, Sarathi engine strictness, and integrations.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-body font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <RotateCcw size={16} /> Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl bg-saffron text-white font-body font-bold flex items-center gap-2 hover:bg-saffron-light shadow-lg shadow-saffron/20 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {/* Success Toast Pipeline */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-body font-medium z-50"
                    >
                        <CheckCircle2 size={20} />
                        Configuration saved to Master DB
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-4">

                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-navy text-white shadow-lg shadow-navy/20'
                                    : 'text-gray-500 hover:bg-white hover:text-navy hover:shadow-sm'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-saffron' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Settings Canvas */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
                    >
                        {/* 1. General Settings */}
                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                <div className="pb-6 border-b border-gray-100">
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <Globe className="text-saffron" size={20} /> Platform Status
                                    </h3>
                                    <p className="font-body text-sm text-gray-500 mb-4">Control public access constraints.</p>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div>
                                            <p className="font-body font-bold text-navy">Maintenance Mode</p>
                                            <p className="font-body text-sm text-gray-500">Temporarily disables public citizen logins. Admins retain access.</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('maintenanceMode')}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-danger' : 'bg-gray-300'}`}
                                        >
                                            <motion.div className="w-4 h-4 bg-white rounded-full absolute top-1" animate={{ left: settings.maintenanceMode ? 28 : 4 }} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <Mail className="text-saffron" size={20} /> Contact & Localization
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div>
                                            <label className="block font-body text-sm font-bold text-navy mb-2">Master Support Email</label>
                                            <input
                                                type="email"
                                                value={settings.supportEmail}
                                                onChange={e => handleChange('supportEmail', e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl border border-gray-300 font-body text-gray-700 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-body text-sm font-bold text-navy mb-2">Default System Language</label>
                                            <select
                                                value={settings.defaultLanguage}
                                                onChange={e => handleChange('defaultLanguage', e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl border border-gray-300 font-body text-gray-700 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron bg-white"
                                            >
                                                <option value="en">English (UK)</option>
                                                <option value="hi">Hindi</option>
                                                <option value="te">Telugu</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Access Control */}
                        {activeTab === 'access' && (
                            <div className="space-y-8">
                                <div className="pb-6 border-b border-gray-100">
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <Clock className="text-saffron" size={20} /> Session Management
                                    </h3>
                                    <div className="mt-4">
                                        <label className="block font-body text-sm font-bold text-navy mb-2">Global Session Timeout (Minutes)</label>
                                        <input
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={e => handleChange('sessionTimeout', e.target.value)}
                                            className="w-full md:w-64 h-11 px-4 rounded-xl border border-gray-300 font-body text-gray-700 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
                                        />
                                        <p className="font-body text-xs text-gray-400 mt-2">Force re-authentication after inactivity.</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <Users className="text-saffron" size={20} /> Registration Rules
                                    </h3>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
                                        <div>
                                            <p className="font-body font-bold text-navy">Auto-Approve Panchayat Registrations</p>
                                            <p className="font-body text-sm text-gray-500">Bypass manual vetting for Sarpanch signups (Not Recommended).</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('autoApprovePanchayat')}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoApprovePanchayat ? 'bg-saffron' : 'bg-gray-300'}`}
                                        >
                                            <motion.div className="w-4 h-4 bg-white rounded-full absolute top-1" animate={{ left: settings.autoApprovePanchayat ? 28 : 4 }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. AI Setup */}
                        {activeTab === 'ai' && (
                            <div className="space-y-8">
                                <div className="pb-6 border-b border-gray-100">
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <BrainCircuit className="text-saffron" size={20} /> Inferencing Engine
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div>
                                            <label className="block font-body text-sm font-bold text-navy mb-2">Primary LLM Backend</label>
                                            <select
                                                value={settings.aiModel}
                                                onChange={e => handleChange('aiModel', e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl border border-gray-300 font-body text-gray-700 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron bg-white"
                                            >
                                                <option value="claude-3-opus">Anthropic Claude 3 Opus (AWS)</option>
                                                <option value="claude-3-sonnet">Anthropic Claude 3 Sonnet (AWS)</option>
                                                <option value="llama-2-70b">Meta LLaMA 2 70B (AWS)</option>
                                                <option value="gpt-4">OpenAI GPT-4 Turbo (Fallback)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-body text-sm font-bold text-navy mb-2">Eligibility Strictness: {settings.aiStrictness}%</label>
                                            <input
                                                type="range"
                                                min="50" max="100"
                                                value={settings.aiStrictness}
                                                onChange={e => handleChange('aiStrictness', e.target.value)}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3 accent-saffron"
                                            />
                                            <div className="flex justify-between text-xs font-body text-gray-400 mt-1">
                                                <span>Creative</span>
                                                <span>Rigid (Legal)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <Database className="text-saffron" size={20} /> Vector Database Sync
                                    </h3>
                                    <div className="p-4 bg-saffron/5 border border-saffron/20 rounded-xl mt-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-body font-bold text-navy">Rebuild ChromaDB Embeddings</p>
                                            <p className="font-body text-sm text-gray-500">Force the AI pipeline to re-read all 3,000+ schemes and update vector matrices. This is expensive.</p>
                                            <p className="font-body text-xs text-saffron mt-1 shadow-sm">Last Synced: 4 days ago</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white border border-saffron text-saffron font-bold font-body rounded-lg hover:bg-saffron hover:text-white transition-all">
                                            Force Sync Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Integrations */}
                        {activeTab === 'integrations' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-display text-xl text-navy flex items-center gap-2 mb-1">
                                        <Smartphone className="text-saffron" size={20} /> External Webhooks
                                    </h3>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
                                        <div>
                                            <p className="font-body font-bold text-navy">Push SMS Delivery (AWS SNS)</p>
                                            <p className="font-body text-sm text-gray-500">Send physical SMS updates to citizens when their scheme application updates.</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('smsGateway')}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.smsGateway ? 'bg-saffron' : 'bg-gray-300'}`}
                                        >
                                            <motion.div className="w-4 h-4 bg-white rounded-full absolute top-1" animate={{ left: settings.smsGateway ? 28 : 4 }} />
                                        </button>
                                    </div>

                                    <div className="mt-6 border-t border-gray-200 pt-6">
                                        <label className="block font-body text-sm font-bold text-navy mb-2 flex items-center gap-2">
                                            <Key size={16} className="text-saffron" /> AWS Bedrock Access Route
                                        </label>
                                        <input
                                            type="password"
                                            value="************************"
                                            disabled
                                            className="w-full md:w-96 h-11 px-4 rounded-xl border border-gray-300 bg-gray-100 font-body text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="font-body text-xs text-gray-400 mt-2">Managed securely via environment variables.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </div>

            </div>
        </div>
    );
}
