import { AlertTriangle, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * ConflictResolver — warns about scheme conflicts and shows optimal bundle.
 */
function ConflictResolver() {
    const { language } = useLanguage();
    const isHi = language === 'hi';

    return (
        <div className="space-y-4">
            {/* Conflict Warning */}
            <div className="bg-warning-light rounded-xl p-4 lg:p-5 border border-warning/20">
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
                        <p className="font-body text-sm font-medium text-gray-900">
                            {isHi ? 'पीएमईजीपी लोन' : 'PMEGP Loan'}
                        </p>
                        <p className="font-body text-xs text-gray-500">
                            {isHi ? 'रोजगार सृजन कार्यक्रम' : 'Employment Generation Programme'}
                        </p>
                    </div>

                    <span className="shrink-0 w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white font-bold text-sm">
                        ✗
                    </span>

                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                        <p className="font-body text-sm font-medium text-gray-900">
                            {isHi ? 'एनआरएलएम एसएचजी लोन' : 'NRLM SHG Loan'}
                        </p>
                        <p className="font-body text-xs text-gray-500">
                            {isHi ? 'आजीविका मिशन' : 'Livelihood Mission'}
                        </p>
                    </div>
                </div>

                <p className="font-body text-xs text-gray-600 leading-relaxed">
                    {isHi
                        ? 'पीएमईजीपी लोन लेने के बाद आप एनआरएलएम एसएचजी लोन के लिए अयोग्य हो जाएंगे।'
                        : 'Taking PMEGP Loan will make you ineligible for NRLM SHG Loan.'}
                </p>

                <div className="mt-3 p-3 bg-white/60 rounded-lg border border-saffron/20">
                    <p className="font-body text-xs font-medium text-saffron">
                        {isHi ? '💡 सारथी की सलाह:' : "💡 Sarathi's Advice:"}
                    </p>
                    <p className="font-body text-xs text-gray-700 mt-1">
                        {isHi
                            ? 'पहले एनआरएलएम एसएचजी लोन लें (ब्याज कम), फिर पीएमईजीपी'
                            : 'Take NRLM SHG Loan first (lower interest), then PMEGP'}
                    </p>
                </div>
            </div>

            {/* Optimal Bundle */}
            <div className="bg-white rounded-xl shadow-card p-4 lg:p-5">
                <h4 className="font-body text-sm font-bold text-gray-900 mb-3">
                    {isHi ? '🎯 इस combination से सबसे ज्यादा फायदा:' : '🎯 Best benefit from this combination:'}
                </h4>

                <div className="space-y-2">
                    {[
                        { name: 'PM Ujjwala', nameHi: 'पीएम उज्ज्वला', value: '₹9,600' },
                        { name: 'Widow Pension', nameHi: 'विधवा पेंशन', value: '₹12,000' },
                        { name: 'MGNREGS', nameHi: 'मनरेगा', value: '₹36,000' },
                        { name: 'Ayushman Bharat', nameHi: 'आयुष्मान भारत', value: '₹5,00,000*' },
                        { name: 'PMAY-G', nameHi: 'प्रधानमंत्री आवास', value: '₹1,20,000*' },
                    ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between py-1">
                            <span className="flex items-center gap-2 font-body text-sm text-gray-700">
                                <Check size={14} className="text-success" />
                                {isHi ? item.nameHi : item.name}
                            </span>
                            <span className="font-mono text-sm font-medium text-saffron">
                                {localizeNum(item.value, language)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-body text-sm font-bold text-gray-900">
                        {isHi ? 'कुल वार्षिक लाभ' : 'Total Annual Benefit'}
                    </span>
                    <span className="font-mono text-lg font-bold text-saffron">
                        ₹{localizeNum('64,800', language)}+
                    </span>
                </div>

                <p className="font-body text-[10px] text-gray-400 mt-1">
                    {isHi ? '* एकमुश्त / बीमा कवरेज राशि' : '* One-time / insurance coverage amount'}
                </p>
            </div>
        </div>
    );
}

export default ConflictResolver;
