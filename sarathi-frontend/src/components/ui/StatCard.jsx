import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard — white card with navy/saffron/cream brand theme.
 * Variants: primary | success | warning | danger | info
 */
function StatCard({ value, label, icon, trend, variant = 'primary', progress }) {
    const borderColor = {
        primary: 'border-navy/20',
        success: 'border-success/30',
        warning: 'border-warning/30',
        danger: 'border-danger/30',
        info: 'border-info/30',
    };

    const iconColor = {
        primary: 'text-navy',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
        info: 'text-info',
    };

    const metricColor = {
        primary: 'text-navy',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
        info: 'text-info',
    };

    const progressColor = {
        primary: 'bg-navy',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-danger',
        info: 'bg-info',
    };

    const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-gray-500';
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

    return (
        <div className={`relative rounded-xl p-5 overflow-hidden bg-white border shadow-card flex flex-col justify-between transition-transform duration-200 hover:scale-105 hover:z-10 cursor-default ${borderColor[variant]}`}>
            {/* Top row — icon and trend */}
            <div className="flex items-start justify-between mb-3">
                {icon && (
                    <span className={`${iconColor[variant]}`}>{icon}</span>
                )}
                {trend !== undefined && trend !== null && (
                    <span className={`flex items-center gap-0.5 text-xs font-body font-medium ${trendColor}`}>
                        <TrendIcon size={14} />
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>

            {/* Value */}
            <p className={`font-mono text-[28px] font-bold leading-tight ${metricColor[variant]}`}>
                {value}
            </p>

            {/* Label */}
            <p className="font-body text-sm mt-1 text-gray-500 font-medium">
                {label}
            </p>

            {/* Optional progress bar */}
            {progress !== undefined && (
                <div className="mt-4 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor[variant]}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default StatCard;
