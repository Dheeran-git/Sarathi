import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';

const categoryStyle = {
  agriculture: { pill: 'bg-green-100 text-green-800 border-green-200', accentBg: 'bg-green-50' },
  housing:     { pill: 'bg-orange-100 text-orange-800 border-orange-200', accentBg: 'bg-orange-50' },
  health:      { pill: 'bg-red-100 text-red-800 border-red-200', accentBg: 'bg-red-50' },
  education:   { pill: 'bg-blue-100 text-blue-800 border-blue-200', accentBg: 'bg-blue-50' },
  women:       { pill: 'bg-pink-100 text-pink-800 border-pink-200', accentBg: 'bg-pink-50' },
  employment:  { pill: 'bg-purple-100 text-purple-800 border-purple-200', accentBg: 'bg-purple-50' },
};

const categoryLabels = {
  agriculture: 'Agriculture', housing: 'Housing', health: 'Health',
  education: 'Education', women: 'Women & Child', employment: 'Employment',
};

function SchemeCard({ scheme, isEligible = false }) {
  const cat = categoryStyle[scheme.category] || categoryStyle.employment;
  const name = scheme.nameEnglish || scheme.name;
  const ministry = scheme.ministry;
  const benefit = Number(scheme.annualBenefit) || 0;
  const benefitAmt = benefit >= 100000
    ? `₹${(benefit / 100000).toFixed(benefit % 100000 === 0 ? 0 : 1)}L`
    : `₹${benefit.toLocaleString('en-IN')}`;
  const eligTags = scheme.eligibilityTagsEn || scheme.eligibilityTags || [];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200 hover:border-saffron/40 hover:shadow-saffron transition-all duration-300 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium border ${cat.pill}`}>
            {categoryLabels[scheme.category] || scheme.category}
          </span>
          {isEligible && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 text-[10px] font-body font-medium">
              <Check size={10} /> Eligible
            </span>
          )}
        </div>
        <h3 className="font-body text-base font-bold text-gray-900 leading-snug line-clamp-2 mt-1">{name}</h3>
        <p className="font-body text-xs text-gray-500 mt-1">{ministry}</p>
      </div>

      {/* Benefit amount */}
      <div className={`px-4 py-3 border-y border-gray-100 ${cat.accentBg}`}>
        <p className="font-body text-[10px] text-gray-500 uppercase tracking-wider">Annual Benefit</p>
        <p className="font-mono text-xl font-bold text-navy">{benefitAmt}</p>
      </div>

      {/* Tags */}
      <div className="px-4 py-3 flex-1">
        <div className="flex flex-wrap gap-1">
          {eligTags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-body rounded">
              {tag}
            </span>
          ))}
          {eligTags.length > 3 && (
            <span className="px-1.5 py-0.5 text-gray-400 text-[10px] font-body">
              +{eligTags.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
        <Link
          to={`/schemes/${scheme.id || scheme.schemeId}`}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-saffron text-white font-body text-xs font-medium hover:bg-saffron-light transition-colors shadow-saffron"
        >
          View Details <ArrowRight size={12} />
        </Link>
        {scheme.applyUrl && (
          <a
            href={scheme.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-saffron/50 text-saffron hover:bg-saffron-pale transition-colors"
            title="Apply Now"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default SchemeCard;
