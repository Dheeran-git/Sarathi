import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';

const categoryColors = {
  agriculture: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: '#4CAF50' },
  housing: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: '#FF9800' },
  health: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: '#F44336' },
  education: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: '#2196F3' },
  women: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: '#E91E63' },
  employment: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: '#9C27B0' },
};

const categoryLabels = {
  agriculture: 'Agriculture', housing: 'Housing', health: 'Health',
  education: 'Education', women: 'Women & Child', employment: 'Employment',
};

function SchemeCard({ scheme, isEligible = false }) {
  const cat = categoryColors[scheme.category] || categoryColors.employment;
  const name = scheme.nameEnglish || scheme.name;
  const ministry = scheme.ministry;
  const benefit = scheme.annualBenefit || 0;
  const benefitAmt = benefit >= 100000
    ? `₹${(benefit / 100000).toFixed(benefit % 100000 === 0 ? 0 : 1)}L`
    : `₹${benefit.toLocaleString('en-IN')}`;
  const eligTags = scheme.eligibilityTagsEn || scheme.eligibilityTags || [];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${cat.bg} ${cat.text}`}>
            {categoryLabels[scheme.category]}
          </span>
          {isEligible && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-light text-success text-[10px] font-body font-medium">
              <Check size={10} /> Eligible
            </span>
          )}
        </div>
        <h3 className="font-body text-base font-bold text-gray-900 leading-snug line-clamp-2">{name}</h3>
        <p className="font-body text-xs text-gray-500 mt-0.5">{ministry}</p>
      </div>

      {/* Benefit amount */}
      <div className="px-4 py-3 bg-saffron-pale/50">
        <p className="font-body text-[10px] text-gray-500 uppercase tracking-wider">Annual Benefit</p>
        <p className="font-mono text-xl font-bold text-saffron">{benefitAmt}</p>
      </div>

      {/* Tags */}
      <div className="px-4 py-3 flex-1">
        <div className="flex flex-wrap gap-1">
          {eligTags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-body rounded">
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
          to={`/schemes/${scheme.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-navy text-white font-body text-xs font-medium hover:bg-navy-mid transition-colors"
        >
          View Details <ArrowRight size={12} />
        </Link>
        {scheme.applyUrl && (
          <a
            href={scheme.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-saffron text-saffron hover:bg-saffron/5 transition-colors"
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
