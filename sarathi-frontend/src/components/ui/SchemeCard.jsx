import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wheat,
  Home,
  Heart,
  GraduationCap,
  Baby,
  Briefcase,
} from 'lucide-react';

const CATEGORY_CONFIG = {
  agriculture: { color: '#4CAF50', icon: Wheat },
  housing: { color: '#FF9800', icon: Home },
  health: { color: '#F44336', icon: Heart },
  education: { color: '#2196F3', icon: GraduationCap },
  women: { color: '#E91E63', icon: Baby },
  employment: { color: '#9C27B0', icon: Briefcase },
};

function formatRupee(amount) {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return amount.toLocaleString('en-IN');
}

function SchemeCard({ scheme, isEligible = false, isApplied = false }) {
  const [hovered, setHovered] = useState(false);
  const config = CATEGORY_CONFIG[scheme.category] || CATEGORY_CONFIG.employment;
  const Icon = config.icon;
  const catColor = config.color;

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      className={`relative w-full min-h-[140px] bg-white rounded-[12px] overflow-hidden ${
        isEligible
          ? 'ring-2 ring-[#1A7F4B]/40 shadow-[0_0_12px_rgba(26,127,75,0.15)]'
          : 'shadow-card'
      } ${hovered ? 'shadow-md' : ''}`}
      style={{ borderLeft: `4px solid ${catColor}` }}
      aria-label={`${scheme.nameHindi} — ${scheme.nameEnglish} — ₹${scheme.annualBenefit.toLocaleString('en-IN')} प्रति वर्ष${isEligible ? ' — आप योग्य हैं' : ''}`}
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        {/* Category Icon */}
        <div
          className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${catColor}1A` }}
        >
          <Icon size={24} style={{ color: catColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-body text-base font-bold text-gray-900 leading-snug truncate">
            {scheme.nameHindi}
          </p>
          <p className="font-body text-[13px] text-gray-500 leading-snug truncate">
            {scheme.nameEnglish}
          </p>
          <p className="font-body text-xs text-gray-500 mt-0.5">
            मंत्रालय: {scheme.ministry}
          </p>

          {/* Eligibility Tags */}
          {scheme.eligibility && scheme.eligibility.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {scheme.eligibility.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-medium border"
                  style={{
                    color: catColor,
                    borderColor: `${catColor}40`,
                    backgroundColor: `${catColor}08`,
                  }}
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right — Benefit Amount */}
        <div className="shrink-0 text-right pl-2">
          <p className="font-mono text-[22px] font-bold text-saffron leading-tight whitespace-nowrap">
            <span className="text-sm">₹</span>
            {formatRupee(scheme.annualBenefit)}
          </p>
          <p className="font-body text-[11px] text-gray-500">प्रति वर्ष</p>
        </div>
      </div>

      {/* Top-right Badge */}
      {(isEligible || isApplied) && (
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-body font-medium ${
            isApplied
              ? 'bg-gray-200 text-gray-700'
              : 'bg-[#E8F5EE] text-[#1A7F4B]'
          }`}
        >
          {isApplied ? 'आवेदन किया' : '✓ योग्य'}
        </span>
      )}

      {/* Hover Action Bar */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: hovered ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-gray-100 border-t border-gray-200"
      >
        <Link
          to={`/schemes/${scheme.id}`}
          className="font-body text-sm font-medium text-saffron hover:underline"
        >
          विवरण देखें
        </Link>
        <Link
          to={`/schemes/${scheme.id}`}
          className="inline-flex items-center h-8 px-4 rounded-md bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors duration-150"
        >
          आवेदन करें
        </Link>
      </motion.div>
    </motion.article>
  );
}

export default SchemeCard;
