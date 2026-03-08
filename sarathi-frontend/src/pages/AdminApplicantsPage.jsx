import React, { useState, useEffect } from 'react';
import { getApplications, fetchAllSchemes, updateApplicationStatus } from '../utils/api';
import { Search, Filter, Download, CheckCircle, XCircle, ChevronRight, LayoutGrid } from 'lucide-react';

const MOCK_APPLICANTS = [
    { id: 'APP-79B91C1E', citizenName: 'Rahul Sharma', schemeName: 'Namo Shetkari Yojana', schemeId: 'scheme-1', date: '3/5/2026', status: 'Approved' },
    { id: 'APP-88C22D3F', citizenName: 'Priya Patel', schemeName: 'Lakhpati Didi', schemeId: 'scheme-2', date: '3/4/2026', status: 'Submitted' },
    { id: 'APP-99D33E4G', citizenName: 'Arjun Singh', schemeName: 'Unknown Scheme', schemeId: 'scheme-3', date: '3/2/2026', status: 'Rejected' },
    { id: 'APP-11A55B6H', citizenName: 'Meena Devi', schemeName: 'Namo Shetkari Yojana', schemeId: 'scheme-1', date: '3/1/2026', status: 'Submitted' },
];

function AdminApplicantsPage() {
    const [applicants, setApplicants] = useState(MOCK_APPLICANTS);
    const [schemes, setSchemes] = useState([]);
    const [selectedSchemeId, setSelectedSchemeId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        let currentSchemes = [];

        try {
            const schemesData = await fetchAllSchemes();
            currentSchemes = Array.isArray(schemesData) ? schemesData.filter(s => ['Active', 'Published'].includes(s.status)) : [];
            setSchemes(currentSchemes);
        } catch (err) {
            console.error("Failed to fetch schemes", err);
        }

        try {
            const appsData = await getApplications('all');
            const apps = appsData.applications || appsData || [];

            if (Array.isArray(apps) && apps.length > 0) {
                setApplicants(apps.map(app => {
                    let sName = app.schemeName;
                    if (!sName || sName === 'Unknown Scheme') {
                        const match = currentSchemes.find(s => s.schemeId === app.schemeId);
                        if (match) sName = match.nameEnglish || match.title;
                    }

                    return {
                        id: app.applicationId || app.id,
                        citizenName: app.personalDetails?.name || app.citizenName || 'Unknown',
                        schemeName: sName || 'Unknown Scheme',
                        schemeId: app.schemeId,
                        date: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A',
                        status: app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Submitted'
                    };
                }));
            }
        } catch (err) {
            console.warn("Using mock data fallback due to fetch error", err);
        }

        setLoading(false);
    };

    const filteredApplicants = (applicants || []).filter(app => {
        const matchesScheme = selectedSchemeId === 'all' || app.schemeId === selectedSchemeId;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            (app.citizenName || '').toLowerCase().includes(query) ||
            (app.id || '').toLowerCase().includes(query) ||
            (app.schemeName || '').toLowerCase().includes(query);

        return matchesScheme && matchesSearch;
    });

    const handleUpdateStatus = async (appId, newStatus) => {
        // Optimistic UI Update
        const previousApplicants = [...applicants];
        setApplicants(prev => prev.map(app =>
            app.id === appId ? { ...app, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) } : app
        ));

        try {
            await updateApplicationStatus(appId, newStatus);
            // alert(`Application ${appId} marked as ${newStatus} successfully!`); // Silencing alert for smoother UX
        } catch (err) {
            console.error(`Failed to update status for ${appId}:`, err);
            // Revert on failure
            setApplicants(previousApplicants);

            let errMsg = "Network Error - Please check your connection or CORS settings.";
            if (err.response) {
                errMsg = `API Error (${err.response.status}): ${err.response.data?.message || err.message}`;
            }
            alert(`Failed to update status: ${errMsg}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-display text-5xl text-navy font-black tracking-tight">
                        Manage <span className="text-saffron">Applicants</span>
                    </h1>
                    <p className="font-body text-gray-500 mt-2 text-lg">Process and review benefit applications across the state</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-14 px-8 rounded-2xl border border-gray-200 bg-white text-navy font-body text-sm font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
                        <Download size={20} className="text-saffron" />
                        Download Report
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Fixed-width Filter Sidebar */}
                <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-navy/5">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center">
                                <Filter size={18} className="text-saffron" />
                            </div>
                            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-navy">Districts & Schemes</h3>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedSchemeId('all')}
                                className={`w-full text-left px-5 py-4 rounded-2xl font-body text-sm transition-all flex items-center justify-between group ${selectedSchemeId === 'all'
                                    ? 'bg-navy text-white shadow-xl shadow-navy/20 font-bold'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedSchemeId === 'all' ? 'bg-saffron' : 'bg-gray-300'}`} />
                                    All Applications
                                </span>
                                {selectedSchemeId === 'all' && <ChevronRight size={16} className="text-saffron" />}
                            </button>

                            <div className="pt-6 pb-2 border-t border-gray-50 mt-4 px-2">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Launched Schemes</p>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto pr-2 no-scrollbar space-y-1">
                                {schemes.length > 0 ? schemes.map(scheme => (
                                    <button
                                        key={scheme.schemeId}
                                        onClick={() => setSelectedSchemeId(scheme.schemeId)}
                                        className={`w-full text-left px-5 py-4 rounded-2xl font-body text-sm transition-all flex items-center justify-between group ${selectedSchemeId === scheme.schemeId
                                            ? 'bg-saffron text-white shadow-xl shadow-saffron/20 font-bold'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="truncate pr-4 flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedSchemeId === scheme.schemeId ? 'bg-white' : 'bg-gray-200'}`} />
                                            {scheme.nameEnglish}
                                        </span>
                                        {selectedSchemeId === scheme.schemeId && <ChevronRight size={16} className="text-white" />}
                                    </button>
                                )) : (
                                    <div className="py-4 px-5 text-gray-400 text-xs italic opacity-50">No active schemes loaded</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-navy/30 group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-saffron/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <LayoutGrid size={22} className="text-saffron" />
                                </div>
                                <h3 className="font-display text-base font-bold tracking-tight">System Summary</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Enrolled</p>
                                    <p className="text-3xl font-display font-black text-saffron">{applicants.length}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Approved</p>
                                        <p className="text-xl font-display text-green-400 font-bold tracking-tight">{applicants.filter(a => a.status.toLowerCase() === 'approved').length}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Pending</p>
                                        <p className="text-xl font-display text-white/50 font-bold tracking-tight">{applicants.filter(a => !['approved', 'rejected'].includes(a.status.toLowerCase())).length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Column */}
                <main className="flex-1 w-full min-w-0 space-y-6">
                    <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-navy/5">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-saffron transition-colors" size={24} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, ID or status..."
                                className="w-full h-16 pl-16 pr-6 rounded-3xl bg-gray-50/50 border-none focus:ring-4 focus:ring-saffron/5 font-body text-lg transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-navy/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-body">
                                <thead className="bg-gray-50/80 text-gray-400 text-[11px] uppercase tracking-[0.3em] font-black">
                                    <tr>
                                        <th className="px-10 py-7">Citizen Identity</th>
                                        <th className="px-10 py-7">Scheme</th>
                                        <th className="px-10 py-7">Date</th>
                                        <th className="px-10 py-7 text-center">Status</th>
                                        <th className="px-10 py-7 text-right w-40">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading && applicants.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-16 h-16 border-[6px] border-saffron/10 border-t-saffron rounded-full animate-spin" />
                                                    <span className="text-navy font-display tracking-[0.3em] uppercase text-sm font-bold">Connecting...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredApplicants.length > 0 ? filteredApplicants.map((app, i) => (
                                        <tr key={app.id || i} className="hover:bg-gray-50/80 transition-all group duration-300">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-navy text-saffron flex items-center justify-center font-black text-lg shadow-xl shadow-navy/20">
                                                        {(app.citizenName || 'U').split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-navy text-lg leading-tight">{app.citizenName}</p>
                                                        <p className="font-mono text-xs text-gray-400 mt-2 opacity-70">ID: {app.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="max-w-[200px]">
                                                    <p className="text-base font-bold text-navy-mid truncate" title={app.schemeName}>{app.schemeName}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-sm text-gray-500 font-bold">
                                                {app.date}
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`inline-block px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${app.status.toLowerCase() === 'approved'
                                                    ? 'bg-green-500 text-white'
                                                    : app.status.toLowerCase() === 'rejected'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-saffron text-white'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {app.status.toLowerCase() !== 'approved' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(app.id, 'approved')}
                                                            className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <CheckCircle size={24} />
                                                        </button>
                                                    )}
                                                    {app.status.toLowerCase() !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                                            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <XCircle size={24} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-48 text-center">
                                                <div className="flex flex-col items-center gap-4 py-12">
                                                    <Search size={48} className="text-gray-200" />
                                                    <p className="font-display text-2xl font-black text-navy opacity-20">No Records Found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminApplicantsPage;
