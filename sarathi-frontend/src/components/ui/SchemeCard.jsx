import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';

const categoryColors = {
  agriculture: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: '#10b981' },
  housing: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: '#f59e0b' },
  health: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: '#e11d48' },
  education: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: '#3b82f6' },
  women: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', dot: '#ec4899' },
  employment: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: '#a855f7' },
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
      className="bg-[#0f172a] rounded-xl shadow-2xl overflow-hidden border border-slate-800 hover:border-slate-700 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>
            {categoryLabels[scheme.category]}
          </span>
          {isEligible && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-body font-medium">
              <Check size={10} /> Eligible
            </span>
          )}
        </div>
        <h3 className="font-body text-base font-bold text-[#f8fafc] leading-snug line-clamp-2 mt-1">{name}</h3>
        <p className="font-body text-xs text-slate-400 mt-1">{ministry}</p>
      </div>

      {/* Benefit amount */}
      <div className="px-4 py-3 bg-[#020617] border-y border-slate-800/50">
        <p className="font-body text-[10px] text-slate-500 uppercase tracking-wider">Annual Benefit</p>
        <p className="font-mono text-xl font-bold text-indigo-400">{benefitAmt}</p>
      </div>

      {/* Tags */}
      <div className="px-4 py-3 flex-1">
        <div className="flex flex-wrap gap-1">
          {eligTags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-body rounded">
              {tag}
            </span>
          ))}
          {eligTags.length > 3 && (
            <span className="px-1.5 py-0.5 text-slate-500 text-[10px] font-body">
              +{eligTags.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2">
        <Link
          to={`/schemes/${scheme.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-indigo-600 text-white font-body text-xs font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.2)]"
        >
          View Details <ArrowRight size={12} />
        </Link>
        {scheme.applyUrl && (
          <a
            href={scheme.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
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
