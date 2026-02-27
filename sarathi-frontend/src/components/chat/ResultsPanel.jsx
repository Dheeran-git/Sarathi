import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SchemeCard from '../ui/SchemeCard';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const categoryLabelsHi = {
    agriculture: 'कृषि', housing: 'आवास', health: 'स्वास्थ्य',
    education: 'शिक्षा', women: 'महिला एवं बाल', employment: 'रोजगार',
};
const categoryLabelsEn = {
    agriculture: 'Agriculture', housing: 'Housing', health: 'Health',
    education: 'Education', women: 'Women & Child', employment: 'Employment',
};

/**
 * ResultsPanel — left side panel showing matched schemes.
 */
function ResultsPanel({ schemes = [], visible = false }) {
    const [activeFilter, setActiveFilter] = useState('all');
    const { language } = useLanguage();
    const isHi = language === 'hi';
    const catLabels = isHi ? categoryLabelsHi : categoryLabelsEn;

    const filters = [
        { key: 'all', label: isHi ? 'सभी' : 'All' },
        ...Array.from(new Set(schemes.map((s) => s.category))).map((cat) => ({
            key: cat,
            label: catLabels[cat] || cat,
        })),
    ];

    const filtered =
        activeFilter === 'all'
            ? schemes
            : schemes.filter((s) => s.category === activeFilter);

    if (!visible) return null;

    return (
        <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full overflow-y-auto border-r border-gray-200 bg-white"
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-body text-lg font-bold text-gray-900">
                        {isHi ? 'आपके लिए योजनाएं' : 'Schemes For You'}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full bg-saffron text-white font-body text-xs font-medium">
                        {schemes.length} {isHi ? 'योजनाएं मिलीं' : 'found'}
                    </span>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`px-2.5 py-1 rounded-full font-body text-xs font-medium transition-colors duration-200 ${activeFilter === f.key
                                ? 'bg-saffron text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Scheme cards */}
                <div className="space-y-3">
                    {filtered.map((scheme, i) => (
                        <motion.div
                            key={scheme.id}
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.08, duration: 0.35 }}
                        >
                            <SchemeCard scheme={scheme} isEligible />
                        </motion.div>
                    ))}
                </div>

                {/* Bottom actions */}
                <div className="mt-6 space-y-2">
                    <Link
                        to="/twin"
                        className="flex items-center justify-center h-10 rounded-lg bg-navy text-white font-body text-sm font-medium hover:bg-navy-mid transition-colors duration-200"
                    >
                        {isHi ? 'Digital Twin देखें →' : 'View Digital Twin →'}
                    </Link>
                    <Link
                        to="/schemes"
                        className="flex items-center justify-center h-10 rounded-lg border border-gray-200 text-gray-600 font-body text-sm hover:bg-gray-50 transition-colors duration-200"
                    >
                        {isHi ? 'सब योजनाएं देखें' : 'View All Schemes'}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default ResultsPanel;
