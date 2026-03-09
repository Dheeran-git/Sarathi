import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings, Shield, Cpu, Webhook, Save,
    RefreshCcw, Globe, Phone, Clock,
    UserCheck, Database, MessageSquare,
    AlertTriangle, CheckCircle2, ChevronRight,
    Zap, Lock, Activity
} from "lucide-react";

const TABS = [
    { id: "general", label: "General", icon: Globe, desc: "Platform & contact" },
    { id: "access", label: "Access Control", icon: Shield, desc: "Auth & security" },
    { id: "ai", label: "AI Engine", icon: Cpu, desc: "Sarathi inference" },
    { id: "integrations", label: "Integrations", icon: Webhook, desc: "External gateways" },
];

const StatusPill = ({ active, label }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${active
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-red-50 text-red-500 border-red-200"
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
        {label}
    </span>
);

const Toggle = ({ checked, onChange }) => (
    <button
        onClick={() => onChange({ target: { checked: !checked } })}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${checked ? "bg-gradient-to-r from-amber-500 to-orange-500 focus:ring-amber-400" : "bg-slate-200 focus:ring-slate-300"
            }`}
    >
        <motion.div
            animate={{ x: checked ? 28 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
        />
    </button>
);

const SettingRow = ({ title, desc, children, danger }) => (
    <div className={`group flex items-center justify-between gap-6 p-5 rounded-xl border transition-all duration-200 ${danger
            ? "bg-red-50 border-red-200 hover:border-red-300"
            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
        }`}>
        <div className="min-w-0">
            <p className={`text-sm font-semibold mb-0.5 ${danger ? "text-red-600" : "text-slate-800"}`}>{title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
            <Icon size={15} className="text-amber-500" />
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        <div className="flex-1 h-px bg-slate-100" />
    </div>
);

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        supportEmail: "support@sarathi.gov.in",
        supportPhone: "1800-SARATHI",
        timeoutMinutes: 45,
        autoApprovePanchayats: false,
        aiModel: "claude-3-sonnet",
        aiStrictness: 75,
        smsEnabled: true,
    });

    const set = (key, val) => setSettings((s) => ({ ...s, [key]: val }));

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }, 900);
    };

    return (
        <div className="min-h-screen w-full bg-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #e2e8f0; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ea580c); cursor: pointer; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
        select option { background: white; color: #1e293b; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>

            <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pb-6 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                                <Settings size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Admin Console</p>
                                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Platform Configuration</h1>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 ml-14">Global flags · AI rulesets · Integration gateways</p>
                    </div>

                    <div className="flex items-center gap-3 ml-14 md:ml-0">
                        <StatusPill active={!settings.maintenanceMode} label={settings.maintenanceMode ? "Maintenance" : "Live"} />
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all">
                            <RefreshCcw size={14} /> Discard
                        </button>
                        <AnimatePresence mode="wait">
                            <motion.button
                                key={saved ? "saved" : "save"}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${saved
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-200"
                                    } disabled:opacity-60`}
                            >
                                {saved ? <CheckCircle2 size={15} /> : isSaving ? <RefreshCcw size={15} className="animate-spin" /> : <Save size={15} />}
                                {saved ? "Saved!" : isSaving ? "Saving..." : "Save Changes"}
                            </motion.button>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── LAYOUT ── */}
                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* Sidebar */}
                    <div className="w-full lg:w-56 shrink-0 p-1.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 whitespace-nowrap lg:whitespace-normal group ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-white/70"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div layoutId="tab-indicator" className="absolute inset-0 rounded-xl border border-amber-100" style={{ background: "rgba(255,255,255,1)" }} />
                                    )}
                                    <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? "bg-amber-50" : "bg-transparent group-hover:bg-slate-100"}`}>
                                        <Icon size={14} className={isActive ? "text-amber-500" : "text-slate-400"} />
                                    </div>
                                    <div className="relative z-10 hidden lg:block">
                                        <p className={`text-xs font-semibold leading-none mb-0.5 ${isActive ? "text-slate-800" : "text-slate-500"}`}>{tab.label}</p>
                                        <p className="text-[10px] text-slate-400">{tab.desc}</p>
                                    </div>
                                    <span className="relative z-10 lg:hidden text-xs font-semibold">{tab.label}</span>
                                    {isActive && <ChevronRight size={12} className="ml-auto text-amber-400 hidden lg:block relative z-10" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="p-6 lg:p-8 space-y-8"
                            >

                                {/* ── GENERAL ── */}
                                {activeTab === "general" && <>
                                    <SectionHeader icon={Activity} title="Platform Status" />
                                    <SettingRow
                                        title="Maintenance Mode"
                                        desc="Lock out all public citizen traffic. Admins can still authenticate and access the console."
                                        danger={settings.maintenanceMode}
                                    >
                                        <div className="flex items-center gap-3">
                                            {settings.maintenanceMode && (
                                                <span className="hidden sm:flex items-center gap-1.5 text-xs text-red-500 font-medium">
                                                    <AlertTriangle size={12} /> Active
                                                </span>
                                            )}
                                            <Toggle checked={settings.maintenanceMode} onChange={e => set("maintenanceMode", e.target.checked)} />
                                        </div>
                                    </SettingRow>

                                    <SectionHeader icon={Phone} title="Global Contact Details" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { label: "Support Helpline", key: "supportPhone", type: "text", icon: "📞" },
                                            { label: "Support Email", key: "supportEmail", type: "email", icon: "✉️" },
                                        ].map(({ label, key, type, icon }) => (
                                            <div key={key} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                                                <label className="block text-[10px] text-slate-400 mb-2.5 font-semibold uppercase tracking-wider">{label}</label>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-base">{icon}</span>
                                                    <input
                                                        type={type}
                                                        value={settings[key]}
                                                        onChange={e => set(key, e.target.value)}
                                                        className="flex-1 bg-transparent text-sm text-slate-800 font-medium placeholder-slate-300 focus:outline-none"
                                                        style={{ fontFamily: "'DM Mono', monospace" }}
                                                    />
                                                </div>
                                                <div className="mt-2.5 h-px bg-gradient-to-r from-amber-400 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                </>}

                                {/* ── ACCESS CONTROL ── */}
                                {activeTab === "access" && <>
                                    <SectionHeader icon={Clock} title="Security Thresholds" />
                                    <div className="p-5 rounded-xl bg-white border border-slate-200">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 mb-0.5">Session Timeout</p>
                                                <p className="text-xs text-slate-400">Force idle users to re-authenticate</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-amber-500" style={{ fontFamily: "'DM Mono', monospace" }}>{settings.timeoutMinutes}</span>
                                                <span className="text-sm text-slate-400 ml-1">min</span>
                                            </div>
                                        </div>
                                        <input type="range" min="15" max="120" step="15" value={settings.timeoutMinutes}
                                            onChange={e => set("timeoutMinutes", Number(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between mt-2 text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                                            <span>15m</span><span>30m</span><span>45m</span><span>60m</span><span>75m</span><span>90m</span><span>2h</span>
                                        </div>
                                    </div>

                                    <SectionHeader icon={Lock} title="Onboarding Policies" />
                                    <SettingRow title="Auto-Approve Panchayat Registrations" desc="New sarpanch sign-ups bypass admin review via LGD DB verification. Recommended only for trusted districts.">
                                        <Toggle checked={settings.autoApprovePanchayats} onChange={e => set("autoApprovePanchayats", e.target.checked)} />
                                    </SettingRow>
                                </>}

                                {/* ── AI ENGINE ── */}
                                {activeTab === "ai" && <>
                                    <SectionHeader icon={Zap} title="Inference Backend" />
                                    <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-5">
                                        <div>
                                            <label className="block text-[10px] text-slate-400 mb-2.5 font-semibold uppercase tracking-wider">Active LLM Model (AWS Bedrock)</label>
                                            <div className="relative">
                                                <select
                                                    value={settings.aiModel}
                                                    onChange={e => set("aiModel", e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 font-medium focus:border-amber-400 focus:outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                                                >
                                                    <option value="claude-3-sonnet">Anthropic Claude 3 Sonnet — Default</option>
                                                    <option value="claude-3-haiku">Anthropic Claude 3 Haiku — Fast</option>
                                                    <option value="llama-3">Meta Llama 3 70B</option>
                                                </select>
                                                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 mb-0.5">Matching Strictness</p>
                                                    <p className="text-xs text-slate-400">Controls eligibility suggestion precision</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-amber-500" style={{ fontFamily: "'DM Mono', monospace" }}>{settings.aiStrictness}</span>
                                                    <span className="text-sm text-slate-400 ml-0.5">%</span>
                                                </div>
                                            </div>
                                            <input type="range" min="50" max="100" value={settings.aiStrictness}
                                                onChange={e => set("aiStrictness", Number(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between mt-2 text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                                                <span>← Broad</span><span>Exact →</span>
                                            </div>
                                        </div>
                                    </div>

                                    <SectionHeader icon={Database} title="Knowledge Base" />
                                    <SettingRow title="Force Vector Re-index" desc="Trigger a manual rebuild of all vector database embeddings. This may take several minutes.">
                                        <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-sm">
                                            <RefreshCcw size={12} /> Sync Database
                                        </button>
                                    </SettingRow>
                                </>}

                                {/* ── INTEGRATIONS ── */}
                                {activeTab === "integrations" && <>
                                    <SectionHeader icon={MessageSquare} title="Notification Gateways" />
                                    <SettingRow title="AWS SNS — SMS Notifications" desc="Toggle outbound SMS for scheme alerts, eligibility updates, and grievance status changes.">
                                        <div className="flex items-center gap-3">
                                            <StatusPill active={settings.smsEnabled} label={settings.smsEnabled ? "Enabled" : "Disabled"} />
                                            <Toggle checked={settings.smsEnabled} onChange={e => set("smsEnabled", e.target.checked)} />
                                        </div>
                                    </SettingRow>

                                    <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-200 text-center bg-white">
                                        <p className="text-xs text-slate-400">More integrations coming soon — WhatsApp Business, DigiLocker, UMANG</p>
                                    </div>
                                </>}

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}