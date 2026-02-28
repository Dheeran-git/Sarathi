import { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * CitizenTable — full data table of eligible-but-unserved citizens.
 */
function CitizenTable({ citizens = [] }) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('estimatedBenefit');
    const [sortDir, setSortDir] = useState('desc');
    const [expandedRow, setExpandedRow] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 8;

    const filtered = useMemo(() => {
        let results = citizens;
        if (search.trim()) {
            const q = search.toLowerCase();
            results = results.filter(
                (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
            );
        }
        results = [...results].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });
        return results;
    }, [citizens, search, sortBy, sortDir]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const toggleSort = (key) => {
        if (sortBy === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortBy(key);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ column }) =>
        sortBy === column ? (
            sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
        ) : null;

    // Get English name for a citizen
    const getName = (citizen) => citizen.nameEnglish || citizen.name;
    const getCategory = (citizen) => citizen.categoryEnglish || citizen.category;
    const getMissingSchemes = (citizen) => citizen.missingSchemesEnglish || citizen.missingSchemes;
    const getStatusLabel = (citizen) => citizen.statusLabelEnglish || citizen.statusLabel;

    return (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-body text-lg font-bold text-gray-900 mb-3">
                    Eligible But Unserved Citizens
                </h3>

                <div className="flex flex-wrap gap-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by Name or ID"
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron"
                        />
                    </div>

                    {/* Export */}
                    <button className="h-9 px-3 rounded-lg border border-gray-200 font-body text-xs text-gray-600 flex items-center gap-1.5 hover:bg-gray-50">
                        <Download size={14} />
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Table — Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase">Ward</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase">Age/Category</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase">Missing Schemes</th>
                            <th
                                className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                                onClick={() => toggleSort('estimatedBenefit')}
                            >
                                <span className="flex items-center gap-1">
                                    Estimated Benefit <SortIcon column="estimatedBenefit" />
                                </span>
                            </th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((citizen, i) => (
                            <>
                                <tr
                                    key={citizen.id}
                                    className={`border-b border-gray-100 cursor-pointer transition-colors duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                        } hover:bg-saffron-pale`}
                                    onClick={() => setExpandedRow(expandedRow === citizen.id ? null : citizen.id)}
                                >
                                    <td className="px-4 py-3 font-body text-sm font-medium text-gray-900">{getName(citizen)}</td>
                                    <td className="px-4 py-3 font-body text-sm text-gray-600">{`Ward ${citizen.ward.replace(/\D/g, '')}`}</td>
                                    <td className="px-4 py-3 font-body text-sm text-gray-600">
                                        {citizen.age}, {getCategory(citizen)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {getMissingSchemes(citizen).map((s) => (
                                                <span key={s} className="px-1.5 py-0.5 bg-warning-light text-warning text-[10px] font-body rounded">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm font-medium text-saffron">
                                        ₹{citizen.estimatedBenefit.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 font-body text-xs">{getStatusLabel(citizen)}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            className="h-7 px-3 rounded-md bg-saffron text-white font-body text-xs font-medium hover:bg-saffron-light transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Contact
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === citizen.id && (
                                    <tr key={`${citizen.id}-expanded`}>
                                        <td colSpan={7} className="px-4 py-3 bg-saffron-pale/50">
                                            <div className="flex items-center justify-between">
                                                <p className="font-body text-xs text-gray-600">
                                                    <span className="font-medium">Missing Schemes Details:</span>{' '}
                                                    {getMissingSchemes(citizen).join(', ')}
                                                </p>
                                                <button className="text-xs font-body text-navy font-medium hover:underline">
                                                    View Digital Twin →
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-3 space-y-3">
                {paginated.map((citizen) => (
                    <div key={citizen.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-body text-sm font-medium text-gray-900">{getName(citizen)}</p>
                                <p className="font-body text-xs text-gray-500">Ward {citizen.ward.replace(/\D/g, '')} • {citizen.age}, {getCategory(citizen)}</p>
                            </div>
                            <span className="font-mono text-sm font-bold text-saffron">₹{citizen.estimatedBenefit.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {getMissingSchemes(citizen).map((s) => (
                                <span key={s} className="px-1.5 py-0.5 bg-warning-light text-warning text-[10px] font-body rounded">{s}</span>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs">{getStatusLabel(citizen)}</span>
                            <button className="h-7 px-3 rounded-md bg-saffron text-white font-body text-xs font-medium">Contact</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-gray-200">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded font-body text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                        Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-7 h-7 rounded font-body text-xs font-medium ${page === i + 1 ? 'bg-saffron text-white' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded font-body text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default CitizenTable;
