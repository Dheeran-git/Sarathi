import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, CheckCircle, Clock, XCircle, ArrowUpCircle } from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';

const STATUS_CONFIG = {
    submitted: { icon: ArrowUpCircle, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
    pending: { icon: Clock, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    approved: { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
    rejected: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

function PanchayatApplicationsManager() {
    const { applications, setApplications, isLoading } = usePanchayat();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [schemeFilter, setSchemeFilter] = useState('All');

    const uniqueSchemes = useMemo(() => ['All', ...new Set(applications.map((a) => a.schemeName))], [applications]);

    const filtered = useMemo(() => {
        let data = [...applications];
        if (search) data = data.filter((a) => a.citizenName?.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== 'All') data = data.filter((a) => a.status === statusFilter);
        if (schemeFilter !== 'All') data = data.filter((a) => a.schemeName === schemeFilter);
        return data;
    }, [applications, search, statusFilter, schemeFilter]);

    const handleStatusChange = (appId, newStatus) => {
        setApplications((prev) => prev.map((a) => a.applicationId === appId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a));
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="p-4 lg:p-6 space-y-5 max-w-full">
            <div>
                <h1 className="font-display text-2xl text-navy flex items-center gap-2"><FileText className="w-6 h-6 text-teal-500" /> Applications Manager</h1>
                <p className="text-sm text-slate-500 font-body">{filtered.length} applications from your panchayat citizens</p>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = applications.filter((a) => a.status === key).length;
                    return (
                        <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'All' : key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${statusFilter === key ? `${cfg.bg} ${cfg.text} border-transparent` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                            <cfg.icon className="w-3.5 h-3.5" /> {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search citizen name..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400" />
                </div>
                <select value={schemeFilter} onChange={(e) => setSchemeFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                    {uniqueSchemes.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Schemes' : s}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-body">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">App ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Citizen</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Scheme</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Applied</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Docs</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((app) => {
                                const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                                return (
                                    <motion.tr key={app.applicationId} layout className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{app.applicationId}</td>
                                        <td className="px-4 py-3 font-medium text-navy">{app.citizenName}</td>
                                        <td className="px-4 py-3 text-slate-600">{app.schemeName}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(app.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-500">{app.documentsChecked?.length || 0} docs</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app.applicationId, e.target.value)}
                                                className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-body focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="submitted">Submitted</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PanchayatApplicationsManager;
