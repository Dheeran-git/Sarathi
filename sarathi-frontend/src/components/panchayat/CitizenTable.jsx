import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';
import { useToast } from '../ui/Toast';

/**
 * CitizenTable — full data table of eligible-but-unserved citizens.
 */
function CitizenTable({ citizens = [] }) {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isHi = language === 'hi';
    const { addToast } = useToast();
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
        // Bug fix: sort handles both numeric and string fields correctly
        results = [...results].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
            }
            const aStr = String(aVal ?? '');
            const bStr = String(bVal ?? '');
            return sortDir === 'desc'
                ? bStr.localeCompare(aStr, 'hi')
                : aStr.localeCompare(bStr, 'hi');
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

    const handleDownloadCSV = () => {
        const headers = ["ID", "Name", "Ward", "Age", "Category", "Gender", "Estimated Benefit", "Status"];
        const rows = filtered.map(c => [
            c.id,
            c.name,
            c.ward,
            c.age,
            c.category,
            c.gender,
            c.estimatedBenefit,
            c.status
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "unserved_citizens.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleContact = (e, citizen) => {
        e.stopPropagation();
        addToast(`Contact info for ${citizen.name}: ${citizen.mobile || 'Not available'}`, 'info');
    };

    const SortIcon = ({ column }) =>
        sortBy === column ? (
            sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
        ) : null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-body text-lg font-bold text-gray-900 mb-3">
                    {isHi ? 'पात्र लेकिन वंचित नागरिक' : 'Eligible But Unserved Citizens'}
                </h3>

                <div className="flex flex-wrap gap-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder={isHi ? 'नाम या ID से खोजें' : 'Search by Name or ID'}
                            className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200 font-body text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-saffron/40 focus:ring-1 focus:ring-saffron/20"
                        />
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleDownloadCSV}
                        className="h-9 px-3 rounded-lg border border-gray-200 bg-white font-body text-xs text-gray-700 flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                    >
                        <Download size={14} />
                        {isHi ? 'CSV डाउनलोड' : 'Download CSV'}
                    </button>
                </div>
            </div>

            {/* Table — Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider">{isHi ? 'नाम' : 'Name'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider">{isHi ? 'वार्ड' : 'Ward'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider">{isHi ? 'आयु/वर्ग' : 'Age/Category'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider">{isHi ? 'वंचित योजनाएं' : 'Missing Schemes'}</th>
                            <th
                                className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-saffron transition-colors"
                                onClick={() => toggleSort('estimatedBenefit')}
                            >
                                <span className="flex items-center gap-1">
                                    {isHi ? 'अनुमानित लाभ' : 'Estimated Benefit'} <SortIcon column="estimatedBenefit" />
                                </span>
                            </th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider">{isHi ? 'स्थिति' : 'Status'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-gray-500 uppercase tracking-wider">{isHi ? 'कार्रवाई' : 'Action'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Bug fix: key on React.Fragment instead of inner <tr> to avoid React key warnings */}
                        {paginated.map((citizen, i) => (
                            <React.Fragment key={citizen.id}>
                                <tr
                                    className={`border-b border-gray-200 cursor-pointer transition-colors duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'
                                        } hover:bg-saffron-pale/30`}
                                    onClick={() => setExpandedRow(expandedRow === citizen.id ? null : citizen.id)}
                                >
                                    <td className="px-4 py-3 font-body text-sm font-medium text-gray-900">{citizen.name}</td>
                                    <td className="px-4 py-3 font-body text-sm text-gray-500">{isHi ? `वार्ड ${localizeNum((citizen.ward?.replace(/\D/g, '') || ''), language)}` : `Ward ${(citizen.ward?.replace(/\D/g, '') || '')}`}</td>
                                    <td className="px-4 py-3 font-body text-sm text-gray-500">
                                        {localizeNum(citizen.age, language)}, {isHi ? citizen.category : citizen.categoryEnglish}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(isHi ? citizen.missingSchemes : citizen.missingSchemesEnglish).map((s) => (
                                                <span key={s} className="px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/20 text-[10px] font-body rounded">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm font-medium text-navy">
                                        ₹{localizeNum(citizen.estimatedBenefit.toLocaleString('en-IN'), language)}
                                    </td>
                                    <td className="px-4 py-3 font-body text-xs text-gray-700">
                                        <span className={`px-2 py-0.5 rounded-full ${citizen.status === 'eligible' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                                            {isHi ? citizen.statusLabel : citizen.statusLabelEnglish}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            className="h-7 px-3 rounded-md bg-saffron text-white font-body text-xs font-medium hover:bg-saffron-light transition-colors"
                                            onClick={(e) => handleContact(e, citizen)}
                                        >
                                            {isHi ? 'संपर्क करें' : 'Contact'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === citizen.id && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-3 bg-gray-50 border-b border-gray-200 shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="flex items-center justify-between">
                                                <p className="font-body text-xs text-gray-500">
                                                    <span className="font-medium text-gray-700">{isHi ? 'वंचित योजनाओं का विवरण:' : 'Missing Schemes Details:'}</span>{' '}
                                                    {(isHi ? citizen.missingSchemes : citizen.missingSchemesEnglish).join(', ')}
                                                </p>
                                                <button
                                                    className="text-xs font-body text-saffron font-medium hover:text-navy transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/twin?id=${citizen.id}`);
                                                    }}
                                                >
                                                    {isHi ? 'Digital Twin देखें →' : 'View Digital Twin →'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-3 space-y-3">
                {paginated.map((citizen) => (
                    <div key={citizen.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-body text-sm font-bold text-gray-900">{citizen.name}</p>
                                <p className="font-body text-xs text-gray-500 mt-0.5">{isHi ? `वार्ड ${localizeNum((citizen.ward?.replace(/\D/g, '') || ''), language)}` : `Ward ${(citizen.ward?.replace(/\D/g, '') || '')}`} • {localizeNum(citizen.age, language)}, {isHi ? citizen.category : citizen.categoryEnglish}</p>
                            </div>
                            <span className="font-mono text-sm font-bold text-navy">₹{localizeNum(citizen.estimatedBenefit.toLocaleString('en-IN'), language)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {(isHi ? citizen.missingSchemes : citizen.missingSchemesEnglish).map((s) => (
                                <span key={s} className="px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 text-[10px] font-body rounded">{s}</span>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${citizen.status === 'eligible' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>{isHi ? citizen.statusLabel : citizen.statusLabelEnglish}</span>
                            <button
                                className="h-8 px-4 rounded-md bg-saffron text-white font-body text-xs font-medium hover:bg-saffron-light transition-colors"
                                onClick={(e) => handleContact(e, citizen)}
                            >
                                {isHi ? 'संपर्क करें' : 'Contact'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-gray-200 bg-white">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-md font-body text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                    >
                        {isHi ? 'पिछला' : 'Prev'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-7 h-7 rounded-md font-body text-xs font-medium transition-colors ${page === i + 1 ? 'bg-saffron text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            {localizeNum(i + 1, language)}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded-md font-body text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                    >
                        {isHi ? 'अगला' : 'Next'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default CitizenTable;
