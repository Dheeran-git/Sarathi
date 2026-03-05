import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Clock, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';

const STATUS_CFG = {
    open: { bg: 'bg-red-100', text: 'text-red-700', label: 'Open' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
    resolved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Resolved' },
    escalated: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Escalated' },
};

const CAT_LABELS = {
    benefit_not_received: 'Benefit Not Received',
    application_stuck: 'Application Stuck',
    wrong_eligibility: 'Wrong Eligibility',
    document_issue: 'Document Issue',
};

function GrievanceTracker() {
    const { grievances, setGrievances, isLoading } = usePanchayat();
    const [statusFilter, setStatusFilter] = useState('All');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ citizenName: '', category: 'benefit_not_received', description: '' });

    const filtered = useMemo(() => statusFilter === 'All' ? grievances : grievances.filter((g) => g.status === statusFilter), [grievances, statusFilter]);

    const handleAdd = () => {
        if (!form.citizenName || !form.description) return;
        setGrievances((prev) => [{
            grievanceId: `GRV-${String(prev.length + 1).padStart(3, '0')}`,
            ...form, status: 'open', assignedTo: 'panchayat',
            createdAt: new Date().toISOString(),
            slaDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
            resolutionNote: '',
        }, ...prev]);
        setForm({ citizenName: '', category: 'benefit_not_received', description: '' });
        setShowAdd(false);
    };

    const updateStatus = (id, s) => setGrievances((prev) => prev.map((g) => g.grievanceId === id ? { ...g, status: s } : g));

    if (isLoading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="p-4 lg:p-6 space-y-5 max-w-full">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="font-display text-2xl text-navy flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-teal-500" /> Grievance Tracker</h1>
                    <p className="text-sm text-slate-500 font-body">{grievances.length} total grievances</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-body font-medium hover:bg-teal-500 transition-colors">
                    <Plus className="w-4 h-4" /> Log Grievance
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {['All', ...Object.keys(STATUS_CFG)].map((k) => {
                    const cnt = k === 'All' ? grievances.length : grievances.filter((g) => g.status === k).length;
                    const cfg = STATUS_CFG[k];
                    return (
                        <button key={k} onClick={() => setStatusFilter(k === statusFilter ? 'All' : k)}
                            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${statusFilter === k ? (cfg ? `${cfg.bg} ${cfg.text}` : 'bg-navy text-white') + ' border-transparent' : 'bg-white border-slate-200 text-slate-600'}`}>
                            {cfg?.label || 'All'} ({cnt})
                        </button>
                    );
                })}
            </div>

            {showAdd && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                    <h2 className="font-display text-base text-navy">Log New Grievance</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" placeholder="Citizen Name" value={form.citizenName} onChange={(e) => setForm((p) => ({ ...p, citizenName: e.target.value }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                        <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white">
                            {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <textarea placeholder="Describe the issue..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" />
                    <button onClick={handleAdd} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-body font-medium hover:bg-teal-500">Submit</button>
                </motion.div>
            )}

            <div className="space-y-3">
                {filtered.map((g) => {
                    const sc = STATUS_CFG[g.status] || STATUS_CFG.open;
                    const overdue = g.status !== 'resolved' && new Date(g.slaDeadline) < new Date();
                    return (
                        <motion.div key={g.grievanceId} layout className={`bg-white rounded-xl border p-4 ${overdue ? 'border-red-300' : 'border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs text-slate-400">{g.grievanceId}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                                        {overdue && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">⚠ SLA Breached</span>}
                                    </div>
                                    <p className="font-body font-medium text-navy text-sm">{g.citizenName}</p>
                                    <p className="text-xs text-slate-500 font-body mt-0.5">{CAT_LABELS[g.category] || g.category} · {g.assignedTo}</p>
                                    <p className="text-sm text-slate-600 font-body mt-2">{g.description}</p>
                                    {g.resolutionNote && <p className="text-xs text-emerald-600 font-body mt-2 p-2 bg-emerald-50 rounded-md">📝 {g.resolutionNote}</p>}
                                    <p className="text-[10px] text-slate-400 mt-2">Filed: {new Date(g.createdAt).toLocaleDateString('en-IN')} · SLA: {new Date(g.slaDeadline).toLocaleDateString('en-IN')}</p>
                                </div>
                                <select value={g.status} onChange={(e) => updateStatus(g.grievanceId, e.target.value)}
                                    className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-body shrink-0">
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="escalated">Escalated</option>
                                </select>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default GrievanceTracker;
