import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Check, FileText, Users, Coins, ClipboardList, Loader2 } from 'lucide-react';
import { fetchScheme } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeNum } from '../utils/formatters';

const tabsData = {
  hi: [
    { key: 'eligibility', label: 'पात्रता', Icon: Users },
    { key: 'benefits', label: 'लाभ', Icon: Coins },
    { key: 'apply', label: 'आवेदन कैसे करें', Icon: ClipboardList },
    { key: 'documents', label: 'दस्तावेज़', Icon: FileText },
  ],
  en: [
    { key: 'eligibility', label: 'Eligibility', Icon: Users },
    { key: 'benefits', label: 'Benefits', Icon: Coins },
    { key: 'apply', label: 'How to Apply', Icon: ClipboardList },
    { key: 'documents', label: 'Documents', Icon: FileText },
  ],
};

const categoryColors = {
  agriculture: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  housing: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  health: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  education: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  women: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  employment: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const categoryLabelsHi = { agriculture: 'कृषि', housing: 'आवास', health: 'स्वास्थ्य', education: 'शिक्षा', women: 'महिला एवं बाल', employment: 'रोजगार' };
const categoryLabelsEn = { agriculture: 'Agriculture', housing: 'Housing', health: 'Health', education: 'Education', women: 'Women & Child', employment: 'Employment' };

function SchemeDetailPage() {
  const { schemeId } = useParams();
  const [activeTab, setActiveTab] = useState('eligibility');
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const tabs = tabsData[language] || tabsData.hi;
  const catLabels = isHi ? categoryLabelsHi : categoryLabelsEn;

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch live scheme data from API
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchScheme(schemeId)
      .then((data) => {
        if (data && !data.error) {
          setScheme(data);
        } else {
          setError(isHi ? 'योजना नहीं मिली' : 'Scheme not found');
        }
      })
      .catch(() => {
        setError(isHi ? 'सर्वर से कनेक्ट नहीं हो पा रहा' : 'Could not connect to server');
      })
      .finally(() => setLoading(false));
  }, [schemeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 className="animate-spin text-saffron mr-3" size={24} />
        <span className="font-body text-sm text-gray-500">{isHi ? 'लोड हो रहा है...' : 'Loading...'}</span>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-gray-400">{error || (isHi ? 'योजना नहीं मिली' : 'Scheme Not Found')}</p>
          <Link to="/schemes" className="mt-4 inline-block text-saffron font-body hover:underline">
            {isHi ? '← सभी योजनाएं देखें' : '← View All Schemes'}
          </Link>
        </div>
      </div>
    );
  }

  const catColors = categoryColors[scheme.category] || categoryColors.employment;
  const annualBenefit = parseInt(scheme.annualBenefit || 0);
  const eligTags = (scheme.categories || 'SC,ST,OBC,General').split(',').map(c => c.trim());

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/schemes" className="inline-flex items-center gap-1 font-body text-sm text-gray-300 hover:text-white mb-3 transition-colors">
            <ArrowLeft size={14} /> {isHi ? 'सभी योजनाएं' : 'All Schemes'}
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${catColors.bg} ${catColors.text}`}>
                  {catLabels[scheme.category]}
                </span>
                <span className="font-body text-xs text-gray-400">{scheme.ministry}</span>
              </div>
              <h1 className="font-display text-[24px] lg:text-[32px] text-white">{isHi ? scheme.nameHindi : scheme.nameEnglish}</h1>
            </div>
            <a
              href={scheme.applyUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shrink-0"
            >
              {isHi ? 'आवेदन करें' : 'Apply Now'} <ExternalLink size={14} />
            </a>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Main content */}
          <div>
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="flex border-b border-gray-200">
                {tabs.map((tab) => {
                  const Icon = tab.Icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 font-body text-sm font-medium transition-all relative ${activeTab === tab.key ? 'text-saffron' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Icon size={15} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {activeTab === tab.key && (
                        <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 lg:p-6">
                {/* Eligibility tab */}
                {activeTab === 'eligibility' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">{isHi ? 'पात्रता मापदंड' : 'Eligibility Criteria'}</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {eligTags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-light text-success font-body text-xs font-medium">
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-off-white rounded-lg space-y-2">
                      {scheme.maxMonthlyIncome && (
                        <p className="font-body text-sm text-gray-700">
                          <span className="font-medium">{isHi ? 'अधिकतम मासिक आय:' : 'Max Monthly Income:'}</span> ₹{localizeNum(parseInt(scheme.maxMonthlyIncome).toLocaleString('en-IN'), language)}
                        </p>
                      )}
                      {scheme.minAge && (
                        <p className="font-body text-sm text-gray-700"><span className="font-medium">{isHi ? 'न्यूनतम आयु:' : 'Min Age:'}</span> {localizeNum(scheme.minAge, language)} {isHi ? 'वर्ष' : 'years'}</p>
                      )}
                      {scheme.maxAge && parseInt(scheme.maxAge) < 99 && (
                        <p className="font-body text-sm text-gray-700"><span className="font-medium">{isHi ? 'अधिकतम आयु:' : 'Max Age:'}</span> {localizeNum(scheme.maxAge, language)} {isHi ? 'वर्ष' : 'years'}</p>
                      )}
                      {scheme.gender && scheme.gender !== 'any' && (
                        <p className="font-body text-sm text-gray-700"><span className="font-medium">{isHi ? 'लिंग:' : 'Gender:'}</span> {scheme.gender === 'female' ? (isHi ? 'महिला' : 'Female') : (isHi ? 'पुरुष' : 'Male')}</p>
                      )}
                      <p className="font-body text-sm text-gray-700">
                        <span className="font-medium">{isHi ? 'वर्ग:' : 'Category:'}</span> {eligTags.join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits tab */}
                {activeTab === 'benefits' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">{isHi ? 'लाभ विवरण' : 'Benefit Details'}</h3>
                    <div className="mt-4 p-4 bg-saffron-pale rounded-lg text-center">
                      <p className="font-body text-sm text-gray-600">{isHi ? 'अनुमानित वार्षिक लाभ' : 'Estimated Annual Benefit'}</p>
                      <p className="font-mono text-[32px] font-bold text-saffron">
                        ₹{localizeNum(
                          annualBenefit >= 100000
                            ? `${(annualBenefit / 100000).toFixed(annualBenefit % 100000 === 0 ? 0 : 1)}${isHi ? 'लाख' : 'L'}`
                            : annualBenefit.toLocaleString('en-IN'),
                          language
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-off-white rounded-lg">
                      <p className="font-body text-sm text-gray-700">
                        {scheme.benefitType && <><span className="font-medium">{isHi ? 'लाभ का प्रकार:' : 'Benefit Type:'}</span> {scheme.benefitType}</>}
                      </p>
                    </div>
                  </div>
                )}

                {/* Apply tab */}
                {activeTab === 'apply' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">{isHi ? 'आवेदन कैसे करें' : 'How to Apply'}</h3>
                    <div className="p-4 bg-off-white rounded-lg">
                      <p className="font-body text-sm text-gray-700 leading-relaxed">
                        {isHi ? 'आधिकारिक पोर्टल पर जाकर ऑनलाइन आवेदन करें।' : 'Visit the official portal to apply online.'}
                      </p>
                    </div>
                    <a href={scheme.applyUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors">
                      {isHi ? 'आधिकारिक पोर्टल पर जाएं' : 'Visit Official Portal'} <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Documents tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">{isHi ? 'आवश्यक दस्तावेज़' : 'Required Documents'}</h3>
                    <div className="space-y-2">
                      {[
                        isHi ? 'आधार कार्ड' : 'Aadhaar Card',
                        isHi ? 'बैंक खाता विवरण' : 'Bank Account Details',
                        isHi ? 'आय प्रमाण पत्र' : 'Income Certificate',
                        isHi ? 'जाति प्रमाण पत्र' : 'Caste Certificate',
                        isHi ? 'निवास प्रमाण पत्र' : 'Residence Certificate',
                      ].map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-off-white rounded-lg">
                          <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                            <FileText size={14} className="text-navy" />
                          </div>
                          <p className="font-body text-sm text-gray-700 font-medium">{doc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Apply */}
            <div className="bg-white rounded-xl shadow-card p-5">
              <h4 className="font-body text-sm font-bold text-gray-900 mb-3">{isHi ? 'तुरंत आवेदन करें' : 'Quick Apply'}</h4>
              <a href={scheme.applyUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-11 w-full rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors">
                {isHi ? 'आवेदन पोर्टल' : 'Application Portal'} <ExternalLink size={14} />
              </a>
              <Link to="/chat" className="flex items-center justify-center h-10 w-full mt-2 rounded-lg border border-gray-200 text-gray-600 font-body text-sm hover:bg-gray-50 transition-colors">
                {isHi ? '💬 सारथी से पूछें' : '💬 Ask Sarathi'}
              </Link>
            </div>

            {/* Eligibility checker widget */}
            <div className="bg-white rounded-xl shadow-card p-5">
              <h4 className="font-body text-sm font-bold text-gray-900 mb-2">{isHi ? 'क्या आप पात्र हैं?' : 'Are You Eligible?'}</h4>
              <div className="space-y-2 mt-3">
                {eligTags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <p className="font-body text-xs text-gray-600">{tag}</p>
                  </div>
                ))}
              </div>
              <Link to="/chat" className="block mt-4 text-center font-body text-xs text-saffron hover:underline">
                {isHi ? 'पूरी पात्रता जाँच करें →' : 'Full Eligibility Check →'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemeDetailPage;
