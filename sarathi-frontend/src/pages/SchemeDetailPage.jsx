import { useParams, Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Check, FileText, Users, Coins, ClipboardList, BookOpen, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { schemeMap, schemes } from '../data/mockSchemes';
import { explainScheme } from '../utils/api';

const tabs = [
  { key: 'eligibility', label: 'Eligibility', Icon: Users },
  { key: 'benefits', label: 'Benefits', Icon: Coins },
  { key: 'apply', label: 'How to Apply', Icon: ClipboardList },
  { key: 'documents', label: 'Documents', Icon: FileText },
];

const categoryColors = {
  agriculture: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  housing: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  health: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  education: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  women: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  employment: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const categoryLabels = {
  agriculture: 'Agriculture', housing: 'Housing', health: 'Health',
  education: 'Education', women: 'Women & Child', employment: 'Employment',
};

function SchemeDetailPage() {
  const { schemeId } = useParams();
  const [activeTab, setActiveTab] = useState('eligibility');
  const scheme = schemeMap[schemeId];

  // ── AI Explanation State ──────────────────────────────────────────
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef(null);

  /** Fetch AI explanation from Bedrock + Polly */
  const handleExplain = async () => {
    if (explanation) return;
    setIsExplaining(true);
    try {
      const result = await explainScheme(scheme);
      setExplanation(result);
    } catch (err) {
      console.warn('[SchemeDetail] Explain API failed, using fallback:', err);
      setExplanation({
        explanationHindi: scheme.benefitDescriptionEn || scheme.benefitDescription || 'This is a government scheme that can benefit your family.',
        audioUrl: null,
        schemeId: scheme.id,
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
    const text = explanation?.explanationHindi || scheme.benefitDescriptionEn || scheme.benefitDescription;
    if (explanation?.audioUrl) {
      const audio = new Audio(explanation.audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setIsPlayingAudio(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlayingAudio(false); audioRef.current = null; };
      setIsLoadingAudio(false);
      setIsPlayingAudio(true);
      audio.play();
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsLoadingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

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

  const catColors = categoryColors[scheme.category] || categoryColors.employment;
  const relatedSchemes = schemes.filter((s) => s.category === scheme.category && s.id !== scheme.id).slice(0, 3);

  // Use English fields, fallback to base fields
  const schemeName = scheme.nameEnglish || scheme.name;
  const schemeMinistry = scheme.ministry;
  const benefitDesc = scheme.benefitDescriptionEn || scheme.benefitDescription;
  const eligTags = scheme.eligibilityTagsEn || scheme.eligibilityTags;
  const benefits = scheme.benefitsEn || scheme.benefits;
  const howToApply = scheme.howToApplyEn || scheme.howToApply;
  const docsRequired = scheme.documentsRequiredEn || scheme.documentsRequired;

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/schemes" className="inline-flex items-center gap-1 font-body text-sm text-gray-300 hover:text-white mb-3 transition-colors">
            <ArrowLeft size={14} /> All Schemes
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${catColors.bg} ${catColors.text}`}>
                  {categoryLabels[scheme.category]}
                </span>
                <span className="font-body text-xs text-gray-400">{schemeMinistry}</span>
              </div>
              <h1 className="font-display text-[24px] lg:text-[32px] text-white">{schemeName}</h1>
            </div>
            <a
              href={scheme.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shrink-0"
            >
              Apply Now <ExternalLink size={14} />
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
                    <h3 className="font-body text-lg font-bold text-gray-900">Eligibility Criteria</h3>
                    <p className="font-body text-sm text-gray-700 leading-relaxed">
                      {benefitDesc}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {eligTags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-light text-success font-body text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-off-white rounded-lg space-y-2">
                      {scheme.eligibility.maxIncome && (
                        <p className="font-body text-sm text-gray-700">
                          <span className="font-medium">Max Income:</span> ₹{scheme.eligibility.maxIncome.toLocaleString('en-IN')}/year
                        </p>
                      )}
                      {scheme.eligibility.minAge && (
                        <p className="font-body text-sm text-gray-700"><span className="font-medium">Min Age:</span> {scheme.eligibility.minAge} years</p>
                      )}
                      {scheme.eligibility.maxAge && (
                        <p className="font-body text-sm text-gray-700"><span className="font-medium">Max Age:</span> {scheme.eligibility.maxAge} years</p>
                      )}
                      {scheme.eligibility.gender !== 'any' && (
                        <p className="font-body text-sm text-gray-700"><span className="font-medium">Gender:</span> {scheme.eligibility.gender === 'female' ? 'Female' : 'Male'}</p>
                      )}
                      <p className="font-body text-sm text-gray-700">
                        <span className="font-medium">Category:</span> {scheme.eligibility.category.join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits tab */}
                {activeTab === 'benefits' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">Benefit Details</h3>
                    <div className="space-y-3">
                      {benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-off-white rounded-lg">
                          <Check size={16} className="text-success mt-0.5 shrink-0" />
                          <p className="font-body text-sm text-gray-700">{benefit}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-saffron-pale rounded-lg text-center">
                      <p className="font-body text-sm text-gray-600">Estimated Annual Benefit</p>
                      <p className="font-mono text-[32px] font-bold text-saffron">
                        ₹{scheme.annualBenefit >= 100000
                          ? `${(scheme.annualBenefit / 100000).toFixed(scheme.annualBenefit % 100000 === 0 ? 0 : 1)}L`
                          : scheme.annualBenefit.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Apply tab */}
                {activeTab === 'apply' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">How to Apply</h3>
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-saffron/20" />
                      {howToApply.map((step, i) => (
                        <div key={i} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-saffron text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
                          <p className="font-body text-sm text-gray-700 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                    <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 h-10 px-5 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors">
                      Visit Official Portal <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Documents tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h3 className="font-body text-lg font-bold text-gray-900">Required Documents</h3>
                    <div className="space-y-2">
                      {docsRequired.map((doc, i) => (
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
              <h4 className="font-body text-sm font-bold text-gray-900 mb-3">Quick Apply</h4>
              <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-11 w-full rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors">
                Application Portal <ExternalLink size={14} />
              </a>
              <Link to="/chat" className="flex items-center justify-center h-10 w-full mt-2 rounded-lg border border-gray-200 text-gray-600 font-body text-sm hover:bg-gray-50 transition-colors">
                💬 Ask Sarathi
              </Link>
            </div>

            {/* AI Explanation — Bedrock + Polly */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-card p-5 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-saffron" />
                <h4 className="font-body text-sm font-bold text-gray-900">
                  AI Explanation
                </h4>
              </div>

              {!explanation && !isExplaining && (
                <button
                  onClick={handleExplain}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors"
                >
                  <Volume2 size={16} />
                  Explain in Simple Terms
                </button>
              )}

              {isExplaining && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 size={20} className="animate-spin text-saffron" />
                  <span className="font-body text-sm text-gray-600">
                    AI is generating...
                  </span>
                </div>
              )}

              {explanation && (
                <div className="space-y-3">
                  <p className="font-body text-sm text-gray-800 leading-relaxed bg-white/70 p-3 rounded-lg">
                    {explanation.explanationHindi}
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
                      <><VolumeX size={16} /> Stop</>
                    ) : (
                      <><Volume2 size={16} /> 🔊 Listen</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Eligibility checker widget */}
            <div className="bg-white rounded-xl shadow-card p-5">
              <h4 className="font-body text-sm font-bold text-gray-900 mb-2">Are You Eligible?</h4>
              <div className="space-y-2 mt-3">
                {eligTags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <p className="font-body text-xs text-gray-600">
                      {tag.replace('✓ ', '').replace('✓', '')}
                    </p>
                  </div>
                ))}
              </div>
              <Link to="/chat" className="block mt-4 text-center font-body text-xs text-saffron hover:underline">
                Full Eligibility Check →
              </Link>
            </div>

            {/* Related schemes */}
            {relatedSchemes.length > 0 && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h4 className="font-body text-sm font-bold text-gray-900 mb-3">Related Schemes</h4>
                <div className="space-y-2">
                  {relatedSchemes.map((rel) => (
                    <Link key={rel.id} to={`/schemes/${rel.id}`} className="block p-3 bg-off-white rounded-lg hover:bg-saffron-pale transition-colors">
                      <p className="font-body text-sm font-medium text-gray-900">{rel.nameEnglish}</p>
                      <p className="font-mono text-xs text-saffron mt-1">₹{
                        rel.annualBenefit >= 100000
                          ? `${(rel.annualBenefit / 100000).toFixed(rel.annualBenefit % 100000 === 0 ? 0 : 1)}L`
                          : rel.annualBenefit.toLocaleString('en-IN')
                      }/year</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemeDetailPage;
