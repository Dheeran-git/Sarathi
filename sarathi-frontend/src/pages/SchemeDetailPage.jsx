import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText, Users, Coins, ClipboardList, Loader2, Volume2, VolumeX, Sparkles, Share2 } from 'lucide-react';
import { fetchScheme, explainScheme } from '../utils/api';
import { schemeMap, allSchemes } from '../data/schemesDB';
import { useLanguage } from '../context/LanguageContext';
import { useCitizen } from '../context/CitizenContext';
import { localizeNum } from '../utils/formatters';
import { useToast } from '../components/ui/Toast';
import { CATEGORY_STYLE, FALLBACK_STYLE, CATEGORY_LABELS_EN } from '../constants/categories';

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

const categoryLabelsHi = { agriculture: 'कृषि', housing: 'आवास', health: 'स्वास्थ्य', education: 'शिक्षा', women: 'महिला एवं बाल', employment: 'रोजगार' };

function SchemeDetailPage() {
  const { schemeId } = useParams();
  const [activeTab, setActiveTab] = useState('eligibility');
  const { language } = useLanguage();
  const { addToast } = useToast();
  const { citizenProfile } = useCitizen();
  const isHi = language === 'hi';
  const tabs = tabsData[language] || tabsData.en;
  const catLabels = isHi ? categoryLabelsHi : CATEGORY_LABELS_EN;

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Explanation state (Bedrock + Polly)
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef(null);

  // Fetch live scheme data from API
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchScheme(schemeId)
      .then((data) => {
        if (data && !data.error) {
          setScheme(data);
        } else {
          const localScheme = schemeMap[schemeId];
          if (localScheme) { setScheme(localScheme); } else { setError(isHi ? 'योजना नहीं मिली' : 'Scheme not found'); }
        }
      })
      .catch(() => {
        const localScheme = schemeMap[schemeId];
        if (localScheme) { setScheme(localScheme); } else { setError(isHi ? 'सर्वर से कनेक्ट नहीं हो पा रहा' : 'Could not connect to server'); }
      })
      .finally(() => setLoading(false));
  }, [schemeId]);

  // Stop audio on unmount to prevent playback after navigation
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  /** Fetch AI explanation from Bedrock + Polly */
  const handleExplain = async () => {
    if (explanation || !scheme) return;
    setIsExplaining(true);
    try {
      const result = await explainScheme(scheme, citizenProfile || null, language);
      setExplanation({ ...result, explanationHindi: result.explanationHindi || result.explanation || '' });
    } catch (err) {
      console.warn('[SchemeDetail] Explain API failed, using fallback:', err);
      setExplanation({
        explanationHindi: scheme.benefitType || (isHi ? 'यह एक सरकारी योजना है जो आपके परिवार को लाभ दे सकती है।' : 'This government scheme can benefit your family.'),
        audioUrl: null,
        schemeId: scheme.schemeId,
      });
    } finally {
      setIsExplaining(false);
    }
  };

  /** Play/stop audio explanation */
  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    setIsLoadingAudio(true);
    const text = explanation?.explanationHindi || scheme?.benefitType || '';
    if (explanation?.audioUrl) {
      const audio = new Audio(explanation.audioUrl);
      audioRef.current = audio;  // D4: Set ref BEFORE play()
      audio.onended = () => { setIsPlayingAudio(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlayingAudio(false); audioRef.current = null; };
      setIsLoadingAudio(false);
      setIsPlayingAudio(true);
      audio.play().catch(() => { setIsPlayingAudio(false); audioRef.current = null; });
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isHi ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsLoadingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
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

  const catStyle = CATEGORY_STYLE[scheme.category] || FALLBACK_STYLE;
  const catColors = catStyle.detail;

  // D4: Related schemes (same category, different ID, max 3)
  const relatedSchemes = allSchemes
    .filter((s) => s.category === scheme.category && (s.schemeId || s.id) !== schemeId)
    .slice(0, 3);

  // D4: Share handler
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => addToast('Link copied to clipboard', 'success'))
      .catch(() => addToast('Could not copy link', 'error'));
  };
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
            <Link
              to={`/apply/${schemeId}`}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shrink-0"
            >
              {isHi ? 'आवेदन करें' : 'Apply Now'} <ExternalLink size={14} />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Main content */}
          <div>
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
                    {scheme.benefitType && (
                      <div className="p-4 bg-off-white rounded-lg">
                        <p className="font-body text-sm text-gray-700">
                          <span className="font-medium">{isHi ? 'लाभ का प्रकार:' : 'Benefit Type:'}</span> {scheme.benefitType}
                        </p>
                      </div>
                    )}
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
                    <Link to={`/apply/${schemeId}`} className="inline-flex items-center gap-2 mt-4 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors">
                      {isHi ? 'आवेदन करें' : 'Apply Now'} <ExternalLink size={14} />
                    </Link>
                  </div>
                )}

                {/* Documents tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">{isHi ? 'आवश्यक दस्तावेज़' : 'Required Documents'}</h3>
                    <div className="space-y-2">
                      {(isHi
                        ? (scheme.documentsRequired || [])
                        : (scheme.documentsRequiredEn || scheme.documentsRequired || [])
                      ).map((doc, i) => (
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
              <Link to={`/apply/${schemeId}`} className="flex items-center justify-center gap-2 h-11 w-full rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors">
                {isHi ? 'आवेदन पोर्टल' : 'Application Portal'} <ExternalLink size={14} />
              </Link>
              <Link to="/agent" className="flex items-center justify-center h-10 w-full mt-2 rounded-lg border border-gray-200 text-gray-600 font-body text-sm hover:bg-gray-50 transition-colors">
                {isHi ? '🤖 AI एजेंट से पूछें' : '🤖 Ask AI Agent'}
              </Link>
              {/* D4: Share button */}
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 h-9 w-full mt-2 rounded-lg border border-gray-200 text-gray-500 font-body text-xs hover:bg-gray-50 hover:text-saffron transition-colors"
              >
                <Share2 size={13} /> {isHi ? 'लिंक कॉपी करें' : 'Share Scheme'}
              </button>
            </div>

            {/* AI Explanation — Bedrock + Polly */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-card p-5 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-saffron" />
                <h4 className="font-body text-sm font-bold text-gray-900">
                  {isHi ? 'AI स्पष्टीकरण' : 'AI Explanation'}
                </h4>
              </div>

              {!explanation && !isExplaining && (
                <button
                  onClick={handleExplain}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors"
                >
                  <Volume2 size={16} />
                  {isHi ? 'सरल भाषा में समझाएं' : 'Explain in Simple Terms'}
                </button>
              )}

              {isExplaining && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 size={20} className="animate-spin text-saffron" />
                  <span className="font-body text-sm text-gray-600">
                    {isHi ? 'AI उत्पन्न कर रहा है...' : 'AI is generating...'}
                  </span>
                </div>
              )}

              {explanation && (
                <div className="space-y-3">
                  <p className="font-body text-sm text-gray-800 leading-relaxed bg-white/70 p-3 rounded-lg"
                    style={{ fontFamily: isHi ? "'Noto Sans Devanagari', sans-serif" : 'inherit' }}>
                    {isHi && explanation.explanationHindi
                      ? explanation.explanationHindi
                      : (explanation.explanation || explanation.explanationHindi)}
                  </p>
                  <button
                    onClick={toggleAudio}
                    className={`w-full flex items-center justify-center gap-2 h-10 rounded-lg font-body text-sm font-medium transition-all ${isPlayingAudio
                      ? 'bg-red-500 text-white'
                      : 'bg-saffron/10 text-saffron hover:bg-saffron/20 border border-saffron/20'
                      }`}
                  >
                    {isLoadingAudio ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isPlayingAudio ? (
                      <><VolumeX size={16} /> {isHi ? 'रोकें' : 'Stop'}</>
                    ) : (
                      <><Volume2 size={16} /> 🔊 {isHi ? 'सुनें' : 'Listen'}</>
                    )}
                  </button>
                  {explanation.applicationGuidance && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="font-body text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1.5">
                        {isHi ? 'आवेदन मार्गदर्शन' : 'Application Guidance'}
                      </p>
                      <p className="font-body text-xs text-blue-800 leading-relaxed whitespace-pre-wrap">
                        {explanation.applicationGuidance}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* D4: Related schemes */}
            {relatedSchemes.length > 0 && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h4 className="font-body text-sm font-bold text-gray-900 mb-3">
                  {isHi ? 'समान योजनाएं' : 'Related Schemes'}
                </h4>
                <div className="space-y-2">
                  {relatedSchemes.map((s) => {
                    const sid = s.schemeId || s.id;
                    const benefit = Number(s.annualBenefit) || 0;
                    return (
                      <Link
                        key={sid}
                        to={`/schemes/${sid}`}
                        className="block p-3 rounded-lg bg-off-white border border-gray-200 hover:border-saffron/40 transition-colors"
                      >
                        <p className="font-body text-xs font-semibold text-gray-900 leading-snug">{s.nameEnglish || s.name}</p>
                        {benefit > 0 && (
                          <p className="font-mono text-xs text-success mt-0.5">
                            ₹{benefit >= 100000 ? `${(benefit / 100000).toFixed(benefit % 100000 === 0 ? 0 : 1)}L` : benefit.toLocaleString('en-IN')}/yr
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

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
              <Link to="/agent" className="block mt-4 text-center font-body text-xs text-saffron hover:underline">
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
