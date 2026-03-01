import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * CitizenTable — full data table of eligible-but-unserved citizens.
 */
function CitizenTable({ citizens = [] }) {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isHi = language === 'hi';
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
        alert(isHi ? `${citizen.name} से संपर्क करने का अनुरोध भेजा गया। (सिम्युलेटेड)` : `Contact request initiated for ${citizen.name}. (Simulated)`);
    };

    const SortIcon = ({ column }) =>
        sortBy === column ? (
            sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
        ) : null;

    return (
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <h3 className="font-body text-lg font-bold text-[#f8fafc] mb-3">
                    {isHi ? 'पात्र लेकिन वंचित नागरिक' : 'Eligible But Unserved Citizens'}
                </h3>

                <div className="flex flex-wrap gap-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder={isHi ? 'नाम या ID से खोजें' : 'Search by Name or ID'}
                            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#020617] border border-slate-700 font-body text-sm text-[#f8fafc] placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50"
                        />
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleDownloadCSV}
                        className="h-9 px-3 rounded-lg border border-slate-700 bg-[#0f172a] font-body text-xs text-slate-300 flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
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
                        <tr className="bg-[#020617] border-b border-slate-800">
                            <th className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider">{isHi ? 'नाम' : 'Name'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider">{isHi ? 'वार्ड' : 'Ward'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider">{isHi ? 'आयु/वर्ग' : 'Age/Category'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider">{isHi ? 'वंचित योजनाएं' : 'Missing Schemes'}</th>
                            <th
                                className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-400 transition-colors"
                                onClick={() => toggleSort('estimatedBenefit')}
                            >
                                <span className="flex items-center gap-1">
                                    {isHi ? 'अनुमानित लाभ' : 'Estimated Benefit'} <SortIcon column="estimatedBenefit" />
                                </span>
                            </th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider">{isHi ? 'स्थिति' : 'Status'}</th>
                            <th className="px-4 py-3 font-body text-xs font-medium text-slate-500 uppercase tracking-wider">{isHi ? 'कार्रवाई' : 'Action'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Bug fix: key on React.Fragment instead of inner <tr> to avoid React key warnings */}
                        {paginated.map((citizen, i) => (
                            <React.Fragment key={citizen.id}>
                                <tr
                                    className={`border-b border-slate-800 cursor-pointer transition-colors duration-150 ${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#0f172a]/70'
                                        } hover:bg-slate-800/50`}
                                    onClick={() => setExpandedRow(expandedRow === citizen.id ? null : citizen.id)}
                                >
                                    <td className="px-4 py-3 font-body text-sm font-medium text-[#f8fafc]">{citizen.name}</td>
                                    <td className="px-4 py-3 font-body text-sm text-slate-400">{isHi ? `वार्ड ${localizeNum((citizen.ward?.replace(/\D/g, '') || ''), language)}` : `Ward ${(citizen.ward?.replace(/\D/g, '') || '')}`}</td>
                                    <td className="px-4 py-3 font-body text-sm text-slate-400">
                                        {localizeNum(citizen.age, language)}, {isHi ? citizen.category : citizen.categoryEnglish}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(isHi ? citizen.missingSchemes : citizen.missingSchemesEnglish).map((s) => (
                                                <span key={s} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-body rounded">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm font-medium text-indigo-400">
                                        ₹{localizeNum(citizen.estimatedBenefit.toLocaleString('en-IN'), language)}
                                    </td>
                                    <td className="px-4 py-3 font-body text-xs text-slate-300">
                                        <span className={`px-2 py-0.5 rounded-full ${citizen.status === 'eligible' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'}`}>
                                            {isHi ? citizen.statusLabel : citizen.statusLabelEnglish}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            className="h-7 px-3 rounded-md bg-indigo-500 text-white font-body text-xs font-medium hover:bg-indigo-400 transition-colors"
                                            onClick={(e) => handleContact(e, citizen)}
                                        >
                                            {isHi ? 'संपर्क करें' : 'Contact'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === citizen.id && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-3 bg-[#020617] border-b border-slate-800 shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.5)]">
                                            <div className="flex items-center justify-between">
                                                <p className="font-body text-xs text-slate-400">
                                                    <span className="font-medium text-slate-300">{isHi ? 'वंचित योजनाओं का विवरण:' : 'Missing Schemes Details:'}</span>{' '}
                                                    {(isHi ? citizen.missingSchemes : citizen.missingSchemesEnglish).join(', ')}
                                                </p>
                                                <button
                                                    className="text-xs font-body text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
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
                    <div key={citizen.id} className="bg-[#0f172a] rounded-lg p-4 border border-slate-800 shadow-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-body text-sm font-bold text-[#f8fafc]">{citizen.name}</p>
                                <p className="font-body text-xs text-slate-400 mt-0.5">{isHi ? `वार्ड ${localizeNum((citizen.ward?.replace(/\D/g, '') || ''), language)}` : `Ward ${(citizen.ward?.replace(/\D/g, '') || '')}`} • {localizeNum(citizen.age, language)}, {isHi ? citizen.category : citizen.categoryEnglish}</p>
                            </div>
                            <span className="font-mono text-sm font-bold text-indigo-400">₹{localizeNum(citizen.estimatedBenefit.toLocaleString('en-IN'), language)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {(isHi ? citizen.missingSchemes : citizen.missingSchemesEnglish).map((s) => (
                                <span key={s} className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-body rounded">{s}</span>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${citizen.status === 'eligible' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'}`}>{isHi ? citizen.statusLabel : citizen.statusLabelEnglish}</span>
                            <button
                                className="h-8 px-4 rounded-md bg-indigo-500 text-white font-body text-xs font-medium hover:bg-indigo-400 transition-colors"
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
                <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-slate-800 bg-[#0f172a]">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-md font-body text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                        {isHi ? 'पिछला' : 'Prev'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-7 h-7 rounded-md font-body text-xs font-medium transition-colors ${page === i + 1 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {localizeNum(i + 1, language)}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded-md font-body text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                        {isHi ? 'अगला' : 'Next'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default CitizenTable;
