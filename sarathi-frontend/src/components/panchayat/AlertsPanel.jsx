import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const TYPE_CONFIG = {
    critical: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', Icon: AlertTriangle, iconColor: 'text-red-500', borderLeft: 'border-l-red-500' },
    urgent:   { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', Icon: AlertTriangle, iconColor: 'text-red-500', borderLeft: 'border-l-red-500' },
    warning:  { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', Icon: AlertCircle, iconColor: 'text-amber-500', borderLeft: 'border-l-amber-500' },
    info:     { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', Icon: Info, iconColor: 'text-blue-500', borderLeft: 'border-l-blue-500' },
};

/**
 * AlertsPanel — priority action alerts for the Panchayat dashboard.
 */
function AlertsPanel({ alerts = [], onViewList }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-body text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                    Priority Actions
                </h3>
                <span className="w-6 h-6 rounded-full bg-danger/10 text-danger text-xs font-body font-bold flex items-center justify-center border border-danger/20">
                    {alerts.length}
                </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {alerts.map((alert) => {
                    const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
                    const AlertIcon = cfg.Icon;
                    return (
                        <div
                            key={alert.id}
                            className={`border-l-4 ${cfg.borderLeft} ${cfg.bg} border border-r border-t border-b rounded-r-lg p-3 hover:opacity-90 transition-opacity cursor-default`}
                        >
                            <div className="flex items-start gap-2">
                                <AlertIcon size={16} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                                            {alert.type || 'info'}
                                        </span>
                                    </div>
                                    <p className="font-body text-sm font-bold text-gray-900 leading-snug">
                                        {alert.titleEnglish || alert.title}
                                    </p>
                                    <p className="font-body text-xs text-gray-500 mt-1 leading-relaxed">
                                        {alert.descriptionEnglish || alert.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <button
                                            className="font-body text-xs font-medium text-saffron hover:text-navy transition-colors"
                                            onClick={() => onViewList?.(alert.filterType || alert.type)}
                                        >
                                            {alert.actionEnglish || alert.action} →
                                        </button>
                                        <span className="font-body text-[10px] text-gray-500">
                                            {alert.timeEnglish || alert.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AlertsPanel;
