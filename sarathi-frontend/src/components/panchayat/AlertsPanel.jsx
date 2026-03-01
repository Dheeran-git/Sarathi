/**
 * AlertsPanel — priority action alerts for the Panchayat dashboard.
 */
function AlertsPanel({ alerts = [] }) {
    const borderColors = {
        urgent: 'border-l-danger',
        warning: 'border-l-warning',
        info: 'border-l-info',
    };

    return (
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-body text-lg font-bold text-[#f8fafc] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                    Priority Actions
                </h3>
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-body font-bold flex items-center justify-center border border-red-500/30">
                    {alerts.length}
                </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`border-l-4 ${borderColors[alert.type] || 'border-l-indigo-500'} bg-[#020617] border border-slate-800 border-l-[4px] rounded-r-lg p-3 hover:bg-slate-800/50 transition-colors cursor-default`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-sm shrink-0 mt-0.5">{alert.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-bold text-[#f8fafc] leading-snug">
                                    {alert.titleEnglish || alert.title}
                                </p>
                                <p className="font-body text-xs text-slate-400 mt-1 leading-relaxed">
                                    {alert.descriptionEnglish || alert.description}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <button className="font-body text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                        {alert.actionEnglish || alert.action} →
                                    </button>
                                    <span className="font-body text-[10px] text-slate-500">
                                        {alert.timeEnglish || alert.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AlertsPanel;
