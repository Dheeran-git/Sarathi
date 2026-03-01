import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * StatCard — used in the Panchayat Dashboard and Digital Twin page.
 * Variants: primary | dark | success | warning
 */
function StatCard({ value, label, icon, trend, variant = 'primary', progress }) {
    const { language } = useLanguage();
    const base = {
        primary: 'bg-[#0f172a] text-[#f8fafc] border border-slate-800',
        dark: 'bg-[#0f172a] text-white border border-slate-800',
        success: 'bg-[#0f172a] text-[#f8fafc] border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        warning: 'bg-[#0f172a] text-[#f8fafc] border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        danger: 'bg-[#0f172a] text-[#f8fafc] border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    };

    const iconColor = {
        primary: 'text-indigo-400',
        dark: 'text-indigo-400',
        success: 'text-emerald-400',
        warning: 'text-amber-400',
        danger: 'text-red-400',
    };

    const trendColor =
        trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-500';

    const TrendIcon =
        trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

    return (
        <div
            className={`relative rounded-xl p-5 overflow-hidden transition-transform duration-200 hover:scale-105 hover:z-10 cursor-default flex flex-col justify-between ${base[variant]}`}
        >
            {/* Top row — icon and trend */}
            <div className="flex items-start justify-between mb-2">
                {icon && (
                    <span className={`text-xl ${iconColor[variant]}`}>{icon}</span>
                )}
                {trend !== undefined && trend !== null && (
                    <span className={`flex items-center gap-0.5 text-xs font-body font-medium ${trendColor}`}>
                        <TrendIcon size={14} />
                        {trend > 0 ? '+' : ''}{localizeNum(trend, language)}%
                    </span>
                )}
            </div>

            {/* Big number */}
            <p className="font-mono text-[32px] font-bold leading-tight text-[#f8fafc]">
                {localizeNum(String(value), language)}
            </p>

            {/* Label */}
            <p className="font-body text-sm mt-1 text-slate-400 font-medium">
                {label}
            </p>

            {/* Optional progress bar */}
            {progress !== undefined && (
                <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${variant === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default StatCard;
