import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, Users, Download, Bell, MapPin, Flag } from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';

const STATUS_COLORS = {
    enrolled: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Enrolled' },
    eligible: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Eligible' },
    none: { bg: 'bg-red-100', text: 'text-red-700', label: 'No Benefits' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Unknown' },
};

const AGE_FILTERS = ['All', '18-30', '31-45', '46-60', '60+'];
const CATEGORY_FILTERS = ['All', 'SC', 'ST', 'OBC', 'General'];
const STATUS_FILTERS = ['All', 'enrolled', 'eligible', 'none'];

function PanchayatCitizenRegistry() {
    const { citizens, isLoading } = usePanchayat();
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [ageFilter, setAgeFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedRow, setExpandedRow] = useState(null);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const filteredCitizens = useMemo(() => {
        let data = [...citizens];

        if (search) {
            const q = search.toLowerCase();
            data = data.filter((c) => c.name?.toLowerCase().includes(q) || c.citizenId?.toLowerCase().includes(q));
        }
        if (genderFilter !== 'All') data = data.filter((c) => c.gender === genderFilter.toLowerCase());
        if (categoryFilter !== 'All') data = data.filter((c) => c.category === categoryFilter);
        if (statusFilter !== 'All') data = data.filter((c) => c.status === statusFilter);
        if (ageFilter !== 'All') {
            const [min, max] = ageFilter.includes('+') ? [60, 200] : ageFilter.split('-').map(Number);
            data = data.filter((c) => c.age >= min && c.age <= max);
        }

        data.sort((a, b) => {
            const av = a[sortField] || '';
            const bv = b[sortField] || '';
            const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return data;
    }, [citizens, search, genderFilter, ageFilter, categoryFilter, statusFilter, sortField, sortDir]);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('asc'); }
    };

    const toggleSelect = (id) => {
        setSelectedRows((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === filteredCitizens.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(filteredCitizens.map((c) => c.citizenId)));
    };

    const handleExportCSV = () => {
        const headers = ['Name', 'Age', 'Gender', 'Ward', 'Category', 'Status', 'Schemes'];
        const rows = filteredCitizens.map((c) => [c.name, c.age, c.gender, c.ward, c.category, c.status, c.schemesCount]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'citizen_registry.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const SortIcon = ({ field }) => (
        <span className="ml-1 text-slate-400 text-[10px]">
            {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
    );

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="font-display text-2xl text-navy">Citizen Registry</h1>
                    <p className="text-sm text-slate-500 font-body">{filteredCitizens.length} of {citizens.length} citizens</p>
                </div>
                <div className="flex gap-2">
                    {selectedRows.size > 0 && (
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg font-body hover:bg-teal-500 transition-colors">
                            <Bell className="w-4 h-4" /> Notify ({selectedRows.size})
                        </button>
                    )}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg font-body hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    />
                </div>
                {[
                    { label: 'Gender', value: genderFilter, setter: setGenderFilter, options: ['All', 'Male', 'Female'] },
                    { label: 'Age', value: ageFilter, setter: setAgeFilter, options: AGE_FILTERS },
                    { label: 'Category', value: categoryFilter, setter: setCategoryFilter, options: CATEGORY_FILTERS },
                    { label: 'Status', value: statusFilter, setter: setStatusFilter, options: STATUS_FILTERS },
                ].map((f) => (
                    <select
                        key={f.label}
                        value={f.value}
                        onChange={(e) => f.setter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    >
                        {f.options.map((o) => <option key={o} value={o}>{f.label}: {o}</option>)}
                    </select>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-body">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === filteredCitizens.length && filteredCitizens.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                                {[
                                    { key: 'name', label: 'Name' },
                                    { key: 'age', label: 'Age' },
                                    { key: 'gender', label: 'Gender' },
                                    { key: 'ward', label: 'Village/Ward' },
                                    { key: 'category', label: 'Category' },
                                    { key: 'schemesCount', label: 'Schemes' },
                                    { key: 'status', label: 'Status' },
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => toggleSort(col.key)}
                                        className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-teal-600 select-none"
                                    >
                                        {col.label}<SortIcon field={col.key} />
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCitizens.slice(0, 100).map((c) => {
                                const st = STATUS_COLORS[c.status] || STATUS_COLORS.unknown;
                                const isExpanded = expandedRow === c.citizenId;
                                return (
                                    <motion.tr key={c.citizenId} layout className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-teal-50/30' : ''}`}>
                                        <td className="px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(c.citizenId)}
                                                onChange={() => toggleSelect(c.citizenId)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <button
                                                onClick={() => setExpandedRow(isExpanded ? null : c.citizenId)}
                                                className="text-left font-medium text-navy hover:text-teal-600 transition-colors flex items-center gap-1"
                                            >
                                                {c.name}
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                                            </button>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="mt-2 p-3 bg-slate-50 rounded-lg text-xs space-y-1"
                                                >
                                                    <p><span className="text-slate-500">ID:</span> {c.citizenId}</p>
                                                    <p><span className="text-slate-500">Schemes Enrolled:</span> {c.schemesCount || 0}</p>
                                                    <p><span className="text-slate-500">Income:</span> ₹{((c.income || c.age * 200) || 0).toLocaleString('en-IN')}/mo</p>
                                                </motion.div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">{c.age}</td>
                                        <td className="px-3 py-2.5 text-slate-600 capitalize">{c.gender}</td>
                                        <td className="px-3 py-2.5 text-slate-600">{c.ward}</td>
                                        <td className="px-3 py-2.5">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{c.category}</span>
                                        </td>
                                        <td className="px-3 py-2.5 font-mono">{c.schemesCount || 0}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex gap-1">
                                                <button title="Notify" className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
                                                    <Bell className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Flag for visit" className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                                    <Flag className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredCitizens.length > 100 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500 font-body">
                        Showing first 100 of {filteredCitizens.length} results
                    </div>
                )}
            </div>
        </div>
    );
}

export default PanchayatCitizenRegistry;
