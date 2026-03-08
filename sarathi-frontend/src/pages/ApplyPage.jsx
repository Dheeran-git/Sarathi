import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText, CheckCircle, Loader2, ClipboardList, Download, Upload, Sparkles } from 'lucide-react';
import { fetchScheme, submitApplication, preFillApplication } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCitizen } from '../context/CitizenContext';
import { useToast } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ApplyPage() {
    const { schemeId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { citizenProfile, refreshApplications } = useCitizen();
    const { addToast } = useToast();
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const isHi = language === 'hi';

    // F1: Form state
    const [checkedDocs, setCheckedDocs] = useState({});
    const [personalDetails, setPersonalDetails] = useState({
        name: citizenProfile?.name || '',
        aadhaarLast4: '',
        mobile: '',
        bankAccountLast4: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedAppId, setSubmittedAppId] = useState(null);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [autoFillDone, setAutoFillDone] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchScheme(schemeId)
            .then((data) => {
                if (data && !data.error) setScheme(data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [schemeId]);

    const handleAutoFill = async () => {
        setIsAutoFilling(true);
        try {
            const result = await preFillApplication(schemeId, citizenProfile);
            if (result.preFilled) {
                const pf = result.preFilled;
                setPersonalDetails(prev => ({
                    ...prev,
                    name: pf.name || prev.name,
                    mobile: pf.mobile || prev.mobile,
                    aadhaarLast4: pf.aadhaarLast4 || prev.aadhaarLast4,
                    bankAccountLast4: pf.bankAccountLast4 || prev.bankAccountLast4,
                }));
            }
            // Auto-check documents that citizen already has uploaded
            if (result.availableDocuments && docList.length > 0) {
                const newChecked = { ...checkedDocs };
                docList.forEach((doc, i) => {
                    const docLower = doc.toLowerCase();
                    result.availableDocuments.forEach(avail => {
                        if (docLower.includes(avail.toLowerCase())) newChecked[i] = true;
                    });
                });
                setCheckedDocs(newChecked);
            }
            setAutoFillDone(true);
            addToast(isHi ? 'AI ने फॉर्म भर दिया है। कृपया जाँच करें।' : 'AI auto-filled your form. Please review.', 'success');
        } catch {
            addToast(isHi ? 'ऑटो-फ़िल विफल। कृपया मैन्युअल रूप से भरें।' : 'Auto-fill failed. Please fill manually.', 'error');
        } finally {
            setIsAutoFilling(false);
        }
    };

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

    const rawDocs = isHi
        ? (scheme.documentsRequired || [])
        : (scheme.documentsRequiredEn || scheme.documentsRequired || []);

    // Kaggle dataset may store docs as a Markdown string — normalize to array
    const docList = Array.isArray(rawDocs)
        ? rawDocs
        : typeof rawDocs === 'string'
            ? rawDocs.split(/\n|\\n/).map(d => d.replace(/^[\s\-*•\d.]+/, '').trim()).filter(Boolean)
            : [];

    const handleDocToggle = (i) => {
        setCheckedDocs((prev) => ({ ...prev, [i]: !prev[i] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = user?.email || localStorage.getItem('userEmail');
        if (!userId) {
            addToast('Please log in to submit an application.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const checkedDocNames = docList.filter((_, i) => checkedDocs[i]);
            const result = await submitApplication({
                citizenId: userId,
                panchayatId: citizenProfile?.panchayatId || citizenProfile?.panchayatCode || '',
                schemeId,
                schemeName: scheme.nameEnglish || scheme.name || schemeId,
                documentsChecked: checkedDocNames,
                personalDetails: {
                    name: personalDetails.name,
                    aadhaarLast4: personalDetails.aadhaarLast4,
                    mobile: personalDetails.mobile,
                    bankAccountLast4: personalDetails.bankAccountLast4,
                },
            });
            setSubmittedAppId(result.applicationId);
            refreshApplications?.();
        } catch (err) {
            addToast('Submission failed. Please try again.', 'error');
            console.error('[ApplyPage] Submit failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // F1: Success state
    if (submittedAppId) {
        const handleDownloadAcknowledgement = () => {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(220, 104, 3); // Saffron
            doc.text('Sarathi Application Acknowledgement', 15, 20);

            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            doc.text(`Application ID: ${submittedAppId}`, 15, 30);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 38);

            // Scheme Details
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59); // Navy
            doc.text('Scheme Details', 15, 50);

            const schemeData = [
                ['Scheme Name', scheme.nameEnglish || scheme.name],
                ['Category', scheme.category || 'N/A'],
                ['Benefit Amount', scheme.annualBenefit ? `Rs. ${scheme.annualBenefit}` : 'N/A']
            ];

            doc.autoTable({
                startY: 55,
                body: schemeData,
                theme: 'grid',
                headStyles: { fillColor: [241, 245, 249] },
                styles: { fontSize: 10 }
            });

            // Profile Details
            const finalY = doc.lastAutoTable.finalY || 55;
            doc.setFontSize(14);
            doc.text('Applicant Details', 15, finalY + 10);

            const profileMap = [
                ['Name', citizenProfile.name || personalDetails.name || 'N/A'],
                ['Age', citizenProfile.age || 'N/A'],
                ['Gender', citizenProfile.gender || 'N/A'],
                ['Location', `${citizenProfile.village || ''} ${citizenProfile.district || ''} ${citizenProfile.state || ''}`.trim() || 'N/A'],
                ['Income (Monthly)', citizenProfile.income ? `Rs. ${citizenProfile.income}` : 'N/A'],
                ['Category', citizenProfile.category || 'N/A'],
                ['Area Type', citizenProfile.urban === true ? 'Urban' : citizenProfile.urban === false ? 'Rural' : 'N/A'],
                ['Occupation', citizenProfile.persona || citizenProfile.occupation || 'N/A'],
                ['Education', citizenProfile.educationLevel || 'N/A'],
                ['Aadhaar (Last 4)', personalDetails.aadhaarLast4 || 'N/A'],
                ['Mobile', personalDetails.mobile || 'N/A'],
                ['Bank Account (Last 4)', personalDetails.bankAccountLast4 || 'N/A'],
            ];

            doc.autoTable({
                startY: finalY + 15,
                body: profileMap.filter(r => r[1] && r[1] !== 'N/A'),
                theme: 'grid',
                styles: { fontSize: 10 }
            });

            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('This is a computer-generated acknowledgement.', 15, doc.internal.pageSize.height - 15);

            doc.save(`Sarathi_Acknowledgement_${submittedAppId}.pdf`);
        };

        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-success" />
                    </div>
                    <h2 className="font-display text-2xl text-gray-900 mb-2">Application Submitted!</h2>
                    <p className="font-body text-gray-600 mb-3">
                        Your application for <strong>{scheme.nameEnglish || scheme.name}</strong> has been recorded.
                    </p>
                    <div className="bg-off-white rounded-lg p-3 mb-6">
                        <p className="font-body text-xs text-gray-500 mb-1">Application ID</p>
                        <code className="font-mono text-lg font-bold text-navy">{submittedAppId}</code>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleDownloadAcknowledgement}
                            className="w-full h-11 flex justify-center items-center gap-2 rounded-lg bg-teal-600 text-white font-body text-sm font-semibold hover:bg-teal-700 transition-colors"
                        >
                            <Download size={16} /> Download Acknowledgement
                        </button>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => navigate('/applications')}
                                className="flex-1 h-11 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors"
                            >
                                Track Application
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 h-11 rounded-lg border border-gray-300 text-gray-700 font-body text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-6">
                    {/* AI Auto-Fill */}
                    {citizenProfile && !autoFillDone && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-saffron/10 shrink-0">
                                    <Sparkles size={18} className="text-saffron" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-body text-sm font-semibold text-gray-900">
                                        {isHi ? 'AI ऑटो-फ़िल' : 'AI Auto-Fill'}
                                    </p>
                                    <p className="font-body text-xs text-gray-500 truncate">
                                        {isHi ? 'अपनी प्रोफ़ाइल से फ़ॉर्म स्वचालित भरें' : 'Auto-populate from your profile & documents'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                disabled={isAutoFilling}
                                className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-lg bg-saffron text-white font-body text-xs font-bold hover:bg-saffron-light transition-colors disabled:opacity-50"
                            >
                                {isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {isAutoFilling ? (isHi ? 'भर रहा है...' : 'Filling...') : (isHi ? 'ऑटो-फ़िल' : 'Auto-Fill')}
                            </button>
                        </motion.div>
                    )}

                    {autoFillDone && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600 shrink-0" />
                            <p className="font-body text-xs text-green-700">
                                {isHi ? 'AI ने फ़ॉर्म भर दिया है। कृपया जानकारी जांचें और सबमिट करें।' : 'AI auto-filled your form. Please review the details and submit.'}
                            </p>
                        </div>
                    )}

                    {/* Step 1: Documents */}
                    <div>
                        <h2 className="font-body text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={18} className="text-saffron" /> {isHi ? 'आवश्यक दस्तावेज़' : 'Required Documents'}
                        </h2>
                        <p className="font-body text-xs text-gray-500 mt-1 mb-3">
                            {isHi ? 'जो दस्तावेज़ आपके पास हैं उन पर टिक करें।' : 'Check the documents you have ready.'}
                        </p>
                        <div className="space-y-2">
                            {docList.length === 0 ? (
                                <p className="font-body text-sm text-gray-500 italic">No specific documents listed.</p>
                            ) : (
                                docList.map((doc, i) => {
                                    // Map document name to upload type
                                    const docLower = doc.toLowerCase();
                                    let uploadType = null;
                                    if (docLower.includes('aadhaar') || docLower.includes('aadhar')) uploadType = 'aadhaar';
                                    else if (docLower.includes('income')) uploadType = 'income_cert';
                                    else if (docLower.includes('ration')) uploadType = 'ration_card';
                                    else if (docLower.includes('job card') || docLower.includes('mgnregs')) uploadType = 'job_card';
                                    else if (docLower.includes('bank')) uploadType = 'bank_statement';

                                    return (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-off-white rounded-lg">
                                            <input
                                                type="checkbox"
                                                id={`doc-${i}`}
                                                checked={!!checkedDocs[i]}
                                                onChange={() => handleDocToggle(i)}
                                                className="w-4 h-4 accent-saffron rounded"
                                            />
                                            <label htmlFor={`doc-${i}`} className="font-body text-sm text-gray-700 cursor-pointer flex-1">{doc}</label>
                                            {uploadType && (
                                                <Link
                                                    to={`/documents?type=${uploadType}&returnTo=/apply/${schemeId}`}
                                                    className="flex items-center gap-1 text-xs font-body text-teal-600 hover:text-teal-700 font-medium shrink-0"
                                                >
                                                    <Upload size={12} /> {isHi ? 'अपलोड' : 'Upload'}
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Step 2: Personal Details */}
                    <div>
                        <h2 className="font-body text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardList size={18} className="text-saffron" /> {isHi ? 'व्यक्तिगत विवरण' : 'Personal Details'}
                        </h2>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="font-body text-sm font-medium text-gray-700 block mb-1">
                                    {isHi ? 'पूरा नाम' : 'Full Name'}
                                </label>
                                <input
                                    type="text"
                                    value={personalDetails.name}
                                    onChange={(e) => setPersonalDetails((p) => ({ ...p, name: e.target.value }))}
                                    placeholder={isHi ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                                    className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="font-body text-sm font-medium text-gray-700 block mb-1">
                                    {isHi ? 'आधार (अंतिम 4 अंक)' : 'Aadhaar (last 4 digits)'}
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    pattern="[0-9]{4}"
                                    value={personalDetails.aadhaarLast4}
                                    onChange={(e) => setPersonalDetails((p) => ({ ...p, aadhaarLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                    placeholder="XXXX"
                                    className="w-full h-11 px-4 rounded-lg border border-gray-200 font-mono text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors tracking-widest"
                                />
                            </div>
                            <div>
                                <label className="font-body text-sm font-medium text-gray-700 block mb-1">
                                    {isHi ? 'मोबाइल नंबर' : 'Mobile Number'}
                                </label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={personalDetails.mobile}
                                    onChange={(e) => setPersonalDetails((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                    placeholder="10-digit number"
                                    className="w-full h-11 px-4 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="font-body text-sm font-medium text-gray-700 block mb-1">
                                    {isHi ? 'बैंक खाता (अंतिम 4 अंक)' : 'Bank Account (last 4 digits)'}
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    pattern="[0-9]{4}"
                                    value={personalDetails.bankAccountLast4}
                                    onChange={(e) => setPersonalDetails((p) => ({ ...p, bankAccountLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                    placeholder="XXXX"
                                    className="w-full h-11 px-4 rounded-lg border border-gray-200 font-mono text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors tracking-widest"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors shadow-saffron disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting
                                ? <><Loader2 size={18} className="animate-spin" /> {isHi ? 'जमा हो रहा है...' : 'Submitting...'}</>
                                : <><CheckCircle size={18} /> {isHi ? 'आवेदन जमा करें' : 'Submit Application'}</>
                            }
                        </button>
                        {scheme.applyUrl && (
                            <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-body text-sm text-saffron hover:underline">
                                {isHi ? 'आधिकारिक पोर्टल' : 'Official Portal'} <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ApplyPage;
