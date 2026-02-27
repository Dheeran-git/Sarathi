import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { fetchScheme } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

/**
 * ApplyPage — application form for a scheme.
 * Route: /apply/:schemeId
 */
function ApplyPage() {
    const { schemeId } = useParams();
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const isHi = language === 'hi';

    useEffect(() => {
        setLoading(true);
        fetchScheme(schemeId)
            .then((data) => {
                if (data && !data.error) setScheme(data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [schemeId]);

    // Bug fix: check loading BEFORE scheme null check — avoids "Scheme Not Found" flash during fetch
    if (loading) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <Loader2 className="animate-spin text-saffron mr-3" size={24} />
                <span className="font-body text-sm text-gray-500">{isHi ? 'लोड हो रहा है...' : 'Loading...'}</span>
            </div>
        );
    }

    if (!scheme) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <div className="text-center">
                    <p className="font-display text-2xl text-gray-400">{isHi ? 'योजना नहीं मिली' : 'Scheme Not Found'}</p>
                    <Link to="/schemes" className="mt-4 inline-block text-saffron font-body hover:underline">
                        {isHi ? '← सभी योजनाएं' : '← All Schemes'}
                    </Link>
                </div>
            </div>
        );
    }

    const formFields = isHi
        ? [
            { label: 'पूरा नाम', placeholder: 'अपना नाम दर्ज करें' },
            { label: 'आधार नंबर', placeholder: 'XXXX XXXX XXXX' },
            { label: 'मोबाइल नंबर', placeholder: '+91' },
            { label: 'बैंक खाता नंबर', placeholder: 'खाता नंबर' },
        ]
        : [
            { label: 'Full Name', placeholder: 'Enter your name' },
            { label: 'Aadhaar Number', placeholder: 'XXXX XXXX XXXX' },
            { label: 'Mobile Number', placeholder: '+91' },
            { label: 'Bank Account Number', placeholder: 'Account number' },
        ];

    return (
        <div className="min-h-screen bg-off-white">
            {/* Header */}
            <div className="bg-navy py-6">
                <div className="max-w-3xl mx-auto px-4">
                    <Link to={`/schemes/${schemeId}`} className="inline-flex items-center gap-1 font-body text-sm text-gray-300 hover:text-white mb-3 transition-colors">
                        <ArrowLeft size={14} /> {isHi ? 'वापस जाएं' : 'Go Back'}
                    </Link>
                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-[24px] lg:text-[30px] text-white">
                        {isHi ? 'आवेदन करें' : 'Apply'} — {isHi ? scheme.nameHindi : scheme.nameEnglish}
                    </motion.h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Mock Form */}
                <div className="bg-white rounded-xl shadow-card p-6 space-y-6">
                    {/* Step 1: Documents */}
                    <div>
                        <h2 className="font-body text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={18} className="text-saffron" /> {isHi ? 'आवश्यक दस्तावेज़' : 'Required Documents'}
                        </h2>
                        <div className="mt-3 space-y-2">
                            {(isHi ? (scheme.documentsRequired || []) : (scheme.documentsRequiredEn || scheme.documentsRequired || [])).map((doc, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-off-white rounded-lg">
                                    <input type="checkbox" className="w-5 h-5 accent-saffron rounded" id={`doc-${i}`} />
                                    <label htmlFor={`doc-${i}`} className="font-body text-sm text-gray-700 cursor-pointer flex-1">{doc}</label>
                                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 font-body text-xs text-gray-500 hover:border-saffron hover:text-saffron transition-colors">
                                        <Upload size={12} /> {isHi ? 'अपलोड करें' : 'Upload'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Personal Details */}
                    <div>
                        <h2 className="font-body text-lg font-bold text-gray-900">{isHi ? 'व्यक्तिगत विवरण' : 'Personal Details'}</h2>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formFields.map((field, i) => (
                                <div key={i}>
                                    <label className="font-body text-sm font-medium text-gray-700 block mb-1">{field.label}</label>
                                    <input
                                        type="text"
                                        placeholder={field.placeholder}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors shadow-saffron">
                            <CheckCircle size={18} /> {isHi ? 'आवेदन जमा करें' : 'Submit Application'}
                        </button>
                        <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-body text-sm text-saffron hover:underline">
                            {isHi ? 'आधिकारिक पोर्टल' : 'Official Portal'} <ExternalLink size={12} />
                        </a>
                    </div>

                    {/* Disclaimer */}
                    <p className="font-body text-xs text-gray-400 text-center">
                        {isHi
                            ? 'यह एक प्रोटोटाइप आवेदन फॉर्म है। वास्तविक आवेदन के लिए आधिकारिक पोर्टल पर जाएं।'
                            : 'This is a prototype application form. For actual applications, visit the official portal.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ApplyPage;
