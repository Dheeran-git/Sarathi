import { AlertTriangle, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * ConflictResolver — warns about scheme conflicts and shows optimal bundle.
 */
function ConflictResolver({ conflictData }) {
    const { language } = useLanguage();
    const isHi = language === 'hi';

    if (!conflictData || !conflictData.optimalBundle) {
        return (
            <div className="bg-white rounded-xl shadow-card p-4 lg:p-6 text-center">
                <p className="font-body text-sm text-gray-500">{isHi ? 'कोई टकराव डेटा उपलब्ध नहीं है।' : 'No conflict data available.'}</p>
            </div>
        );
    }

    const { conflicts, optimalBundle, totalOptimalValue } = conflictData;
    const hasConflicts = conflicts && conflicts.length > 0;

    return (
        <div className="space-y-4">
            {/* Conflict Warning */}
            {hasConflicts && conflicts.map((conflict, idx) => (
                <div key={idx} className="bg-warning-light rounded-xl p-4 lg:p-5 border border-warning/20">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-warning" />
                        <h3 className="font-body text-base font-bold text-gray-900">
                            {isHi ? 'टकराव चेतावनी' : 'Conflict Warning'}
                        </h3>
                    </div>

                    <p className="font-body text-sm text-gray-700 mb-3">
                        {isHi ? `ये ${localizeNum(2, language)} योजनाएं एक साथ नहीं लें:` : 'Do not take these 2 schemes together:'}
                    </p>

                    {/* Conflicting schemes visual */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                            <p className="font-body text-sm font-medium text-gray-900 capitalize">
                                {conflict.scheme1.replace(/-/g, ' ')}
                            </p>
                        </div>

                        <span className="shrink-0 w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white font-bold text-sm">
                            ✗
                        </span>

                        <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                            <p className="font-body text-sm font-medium text-gray-900 capitalize">
                                {conflict.scheme2.replace(/-/g, ' ')}
                            </p>
                        </div>
                    </div>

                    <p className="font-body text-xs text-gray-600 leading-relaxed">
                        {isHi ? 'एक योजना लेने से आप दूसरे के लिए अयोग्य हो सकते हैं।' : conflict.reason}
                    </p>

                    <div className="mt-3 p-3 bg-white/60 rounded-lg border border-saffron/20">
                        <p className="font-body text-xs font-medium text-saffron">
                            {isHi ? '💡 सारथी की सलाह:' : "💡 Sarathi's Advice:"}
                        </p>
                        <p className="font-body text-xs text-gray-700 mt-1">
                            {isHi ? `दोनो में से बेहतर: ${conflict.recommended}` : conflict.reasoning}
                        </p>
                    </div>
                </div>
            ))}

            {!hasConflicts && (
                <div className="bg-success-light rounded-xl p-4 lg:p-5 border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Check size={18} className="text-success" />
                        <h3 className="font-body text-base font-bold text-gray-900">
                            {isHi ? 'कोई टकराव नहीं' : 'No Conflicts Found'}
                        </h3>
                    </div>
                    <p className="font-body text-sm text-gray-700">
                        {isHi ? 'आपकी सभी चयनित योजनाएं एक साथ ली जा सकती हैं।' : 'All your selected schemes can be availed together without conflicts.'}
                    </p>
                </div>
            )}

            {/* Optimal Bundle */}
            <div className="bg-white rounded-xl shadow-card p-4 lg:p-5">
                <h4 className="font-body text-sm font-bold text-gray-900 mb-3">
                    {isHi ? '🎯 इस combination से सबसे ज्यादा फायदा:' : '🎯 Best benefit from this combination:'}
                </h4>

                <div className="space-y-2">
                    {optimalBundle.map((item) => (
                        <div key={item.schemeId || item.nameEnglish || item.nameHindi} className="flex items-center justify-between py-1">
                            <span className="flex items-center gap-2 font-body text-sm text-gray-700">
                                <Check size={14} className="text-success" />
                                {isHi ? (item.nameHindi || item.nameEnglish) : item.nameEnglish}
                            </span>
                            <span className="font-mono text-sm font-medium text-saffron">
                                ₹{localizeNum((item.annualBenefit || 0).toLocaleString('en-IN'), language)}
                            </span>
                        </div>
                    ))}
                    {optimalBundle.length === 0 && (
                        <p className="font-body text-sm text-gray-500 italic">{isHi ? 'कोई योजना नहीं' : 'No schemes'}</p>
                    )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-body text-sm font-bold text-gray-900">
                        {isHi ? 'कुल वार्षिक लाभ' : 'Total Annual Benefit'}
                    </span>
                    <span className="font-mono text-lg font-bold text-saffron">
                        ₹{localizeNum((totalOptimalValue || 0).toLocaleString('en-IN'), language)}+
                    </span>
                </div>

                <p className="font-body text-[10px] text-gray-400 mt-1">
                    {isHi ? '* एकमुश्त / बीमा कवरेज राशि शामिल हो सकती है' : '* May include one-time / insurance coverage amount'}
                </p>
            </div>
        </div>
    );
}

export default ConflictResolver;
