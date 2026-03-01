import { Bot, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
    high: <ShieldAlert size={16} className="text-red-500" />,
    medium: <AlertTriangle size={16} className="text-yellow-500" />,
    low: <Info size={16} className="text-blue-500" />
};

const badgeMap = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20"
};

function AIInsights({ insights = [] }) {
    if (!insights || insights.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Bot className="text-indigo-400" size={24} />
                <h2 className="font-body text-xl font-bold text-white">AI Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-colors shadow-lg"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${badgeMap[insight.severity]}`}>
                                    {iconMap[insight.severity]} {insight.severity}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">Just now</span>
                            </div>
                            <p className="font-body text-sm text-slate-300 leading-relaxed mb-4">
                                {insight.text}
                            </p>
                        </div>

                        <button className="w-full py-2 bg-[#020617] text-indigo-400 text-xs font-semibold rounded-lg border border-[#1e293b] hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all duration-200">
                            {insight.actionText}
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default AIInsights;
