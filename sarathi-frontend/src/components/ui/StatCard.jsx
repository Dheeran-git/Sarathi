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
        primary: 'bg-white text-gray-900',
        dark: 'bg-navy text-white',
        success: 'bg-success-light text-gray-900',
        warning: 'bg-warning-light text-gray-900',
    };

    const iconColor = {
        primary: 'text-saffron',
        dark: 'text-saffron',
        success: 'text-success',
        warning: 'text-warning',
    };

    const trendColor =
        trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-gray-500';

    const TrendIcon =
        trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

    return (
        <div
            className={`relative rounded-[12px] p-4 shadow-card overflow-hidden ${base[variant]}`}
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
            <p className={`font-mono text-[32px] font-bold leading-tight ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {localizeNum(String(value), language)}
            </p>

            {/* Label */}
            <p className={`font-body text-[13px] mt-1 ${variant === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                {label}
            </p>

            {/* Optional progress bar */}
            {progress !== undefined && (
                <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-saffron transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default StatCard;
