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
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-body text-lg font-bold text-gray-900">
                    Priority Actions
                </h3>
                <span className="w-6 h-6 rounded-full bg-danger text-white text-xs font-body font-bold flex items-center justify-center">
                    {alerts.length}
                </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`border-l-4 ${borderColors[alert.type] || 'border-l-info'} bg-gray-50 rounded-r-lg p-3`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-sm shrink-0">{alert.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-bold text-gray-900 leading-snug">
                                    {alert.titleEnglish || alert.title}
                                </p>
                                <p className="font-body text-xs text-gray-600 mt-1 leading-relaxed">
                                    {alert.descriptionEnglish || alert.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <button className="font-body text-xs font-medium text-saffron hover:underline">
                                        {alert.actionEnglish || alert.action} →
                                    </button>
                                    <span className="font-body text-[10px] text-gray-400">
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
