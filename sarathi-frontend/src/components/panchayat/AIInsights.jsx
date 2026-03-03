import { Bot, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
    high: <ShieldAlert size={16} className="text-danger" />,
    medium: <AlertTriangle size={16} className="text-warning" />,
    low: <Info size={16} className="text-navy" />
};

const badgeMap = {
    high: "bg-danger/10 text-danger border-danger/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-navy/10 text-navy border-navy/20"
};

function AIInsights({ insights = [], onNotify, onViewCitizens, onRefresh }) {
    if (!insights || insights.length === 0) return null;

    const handleAction = (insight) => {
        const actionType = insight.actionType;
        if (actionType === 'view') {
            onViewCitizens?.(insight);
        } else if (actionType === 'analyze') {
            onRefresh?.();
        } else {
            onNotify?.(insight);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Bot className="text-saffron" size={24} />
                <h2 className="font-body text-xl font-bold text-gray-900">AI Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-saffron/40 transition-colors shadow-card"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${badgeMap[insight.severity]}`}>
                                    {iconMap[insight.severity]} {insight.severity}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">Just now</span>
                            </div>
                            <p className="font-body text-sm text-gray-700 leading-relaxed mb-4">
                                {insight.text}
                            </p>
                        </div>

                        <button
                            onClick={() => handleAction(insight)}
                            className="w-full py-2 bg-saffron-pale text-saffron text-xs font-semibold rounded-lg border border-saffron/40 hover:bg-saffron hover:text-white hover:border-saffron transition-all duration-200"
                        >
                            {insight.actionText}
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default AIInsights;
