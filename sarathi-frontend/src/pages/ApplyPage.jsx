import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { schemeMap } from '../data/mockSchemes';

function ApplyPage() {
    const { schemeId } = useParams();
    const scheme = schemeMap[schemeId];
    const [submitted, setSubmitted] = useState(false);

    if (!scheme) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <div className="text-center">
                    <p className="font-display text-2xl text-gray-400">Scheme Not Found</p>
                    <Link to="/schemes" className="mt-4 inline-block text-saffron font-body hover:underline">
                        ← View All Schemes
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="font-display text-2xl text-navy">Application Submitted!</h2>
                    <p className="font-body text-sm text-gray-600 mt-3">
                        Your application for <span className="font-medium">{scheme.nameEnglish}</span> has been submitted successfully. You will receive an update via SMS.
                    </p>
                    <Link to="/schemes" className="inline-block mt-6 px-6 py-2 bg-saffron text-white rounded-lg font-body text-sm font-medium hover:bg-saffron-light transition-colors">
                        View More Schemes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-off-white">
            {/* Header */}
            <div className="bg-navy py-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link to={`/schemes/${schemeId}`} className="inline-flex items-center gap-1 font-body text-sm text-gray-300 hover:text-white mb-3 transition-colors">
                        <ArrowLeft size={14} /> Back to Scheme
                    </Link>
                    <h1 className="font-display text-[24px] lg:text-[28px] text-white">
                        Apply: {scheme.nameEnglish}
                    </h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-5">
                    {/* Full Name */}
                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input type="text" required placeholder="Enter your full name" className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30" />
                    </div>

                    {/* Aadhaar */}
                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">Aadhaar Number *</label>
                        <input type="text" required placeholder="12-digit Aadhaar number" maxLength="12" className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30" />
                    </div>

                    {/* Mobile */}
                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                        <input type="tel" required placeholder="10-digit mobile number" maxLength="10" className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30" />
                    </div>

                    {/* Bank Account */}
                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                        <input type="text" placeholder="Bank account for direct benefit transfer" className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30" />
                    </div>

                    {/* Document Upload */}
                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">Upload Documents</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-saffron/40 transition-colors cursor-pointer">
                            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                            <p className="font-body text-sm text-gray-500">Click or drag to upload</p>
                            <p className="font-body text-xs text-gray-400 mt-1">PDF, JPG, PNG — Max 5MB each</p>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="p-3 bg-off-white rounded-lg">
                        <p className="font-body text-xs text-gray-500 leading-relaxed">
                            By submitting, you confirm that all information is accurate. Sarathi only assists in discovery — actual enrollment is processed by the government portal.
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors shadow-saffron"
                    >
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ApplyPage;
