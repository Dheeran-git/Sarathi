import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Send, Users, History, MapPin, CheckCircle } from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';

const TEMPLATES = [
    { id: 't1', label: 'Scheme Eligibility Reminder', text: 'Dear {name}, you may be eligible for ₹{amount}/year under {scheme}. Visit your Panchayat office or dial 1800-XXX to apply.' },
    { id: 't2', label: 'Document Submission Reminder', text: 'Dear {name}, please submit your pending documents for {scheme} at the Panchayat office by this month end.' },
    { id: 't3', label: 'KYC Update Alert', text: 'Dear {name}, your {scheme} benefit has been paused due to KYC mismatch. Please update your Aadhaar at the Panchayat.' },
];

const TARGET_GROUPS = [
    { id: 'widows_no_pension', label: 'Widows without pension', count: 12 },
    { id: 'farmers_no_kisan', label: 'Farmers without PM-KISAN', count: 35 },
    { id: 'elderly_no_pension', label: 'Elderly (60+) without pension', count: 8 },
    { id: 'bpl_no_ayushman', label: 'BPL without Ayushman', count: 22 },
    { id: 'women_no_ujjwala', label: 'Women without PM Ujjwala', count: 15 },
];

function PanchayatOutreach() {
    const { campaigns, setCampaigns } = usePanchayat();
    const [activeTab, setActiveTab] = useState('compose');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [messageText, setMessageText] = useState('');
    const [language, setLanguage] = useState('english');
    const [sent, setSent] = useState(false);

    const handleTemplateSelect = (tId) => {
        setSelectedTemplate(tId);
        const t = TEMPLATES.find((t) => t.id === tId);
        if (t) setMessageText(t.text);
    };

    const handleSend = () => {
        if (!selectedGroup || !messageText) return;
        const group = TARGET_GROUPS.find((g) => g.id === selectedGroup);
        const newCampaign = {
            campaignId: `CMP-${String(campaigns.length + 1).padStart(3, '0')}`,
            targetCriteria: group?.label || selectedGroup,
            recipientCount: group?.count || 0,
            messageText,
            language,
            sentAt: new Date().toISOString(),
            deliveredCount: group?.count ? group.count - 1 : 0,
            conversionCount: 0,
            status: 'completed',
        };
        setCampaigns((prev) => [newCampaign, ...prev]);
        setSent(true);
        setTimeout(() => { setSent(false); setMessageText(''); setSelectedGroup(''); setSelectedTemplate(''); }, 3000);
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 max-w-full">
            <div>
                <h1 className="font-display text-2xl text-navy flex items-center gap-2"><Megaphone className="w-6 h-6 text-teal-500" /> Outreach & Notifications</h1>
                <p className="text-sm text-slate-500 font-body">Reach unserved citizens with targeted campaigns</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                {[{ id: 'compose', label: 'Compose', icon: Send }, { id: 'history', label: 'History', icon: History }].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-body font-medium transition-all ${activeTab === tab.id ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'compose' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Step 1: Select target group */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-teal-500" /> 1. Select Target Group</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {TARGET_GROUPS.map((g) => (
                                <button key={g.id} onClick={() => setSelectedGroup(g.id)}
                                    className={`text-left p-3 rounded-lg border text-sm font-body transition-all ${selectedGroup === g.id ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                                    <p className="font-medium">{g.label}</p>
                                    <p className="text-xs mt-0.5 text-slate-500">{g.count} citizens</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Choose template */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3">2. Choose Template (optional)</h2>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATES.map((t) => (
                                <button key={t.id} onClick={() => handleTemplateSelect(t.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${selectedTemplate === t.id ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Message */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h2 className="font-display text-base text-navy mb-3">3. Compose Message</h2>
                        <div className="flex gap-3 mb-3">
                            {['english', 'hindi'].map((l) => (
                                <button key={l} onClick={() => setLanguage(l)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-body font-medium border transition-all ${language === l ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}>
                                    {l === 'english' ? 'English' : 'हिन्दी'}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                            placeholder="Type your message here..."
                        />
                    </div>

                    {/* Send */}
                    <button onClick={handleSend} disabled={!selectedGroup || !messageText || sent}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold transition-all ${sent ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500 disabled:bg-slate-300 disabled:text-slate-500'}`}>
                        {sent ? <><CheckCircle className="w-4 h-4" /> Campaign Sent!</> : <><Send className="w-4 h-4" /> Send Campaign</>}
                    </button>
                </motion.div>
            )}

            {activeTab === 'history' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm font-body">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Target</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Recipients</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Delivered</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Conversions</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sent</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Language</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {campaigns.map((c) => (
                                    <tr key={c.campaignId} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-navy">{c.targetCriteria}</td>
                                        <td className="px-4 py-3 text-slate-600">{c.recipientCount}</td>
                                        <td className="px-4 py-3 text-emerald-600 font-medium">{c.deliveredCount}</td>
                                        <td className="px-4 py-3 text-teal-600 font-medium">{c.conversionCount}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.sentAt).toLocaleDateString('en-IN')}</td>
                                        <td className="px-4 py-3 capitalize text-slate-500">{c.language}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default PanchayatOutreach;
