import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Home, Heart, Wheat, GraduationCap, Baby, Briefcase, FileText, MapPin, LayoutGrid, Cpu, Building2 } from 'lucide-react';
import { animateCounter } from '../utils/formatters';
import { t } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';

/* ── Framer helpers ──────────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: 'easeOut' },
});
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

/* ── Brushstroke SVG ─────────────────────────────────────────────────────── */
function BrushStroke() {
  return (
    <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
      <path d="M2 8C30 3 70 2 100 5C140 8 180 3 220 6C255 8 280 4 298 7" stroke="#E8740C" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

/* ── Orbiting Icons ──────────────────────────────────────────────────────── */
const orbitIcons = [
  { Icon: Home, angle: 0, radius: 110, color: '#FF9800' },
  { Icon: Wheat, angle: 60, radius: 120, color: '#4CAF50' },
  { Icon: Heart, angle: 120, radius: 105, color: '#F44336' },
  { Icon: GraduationCap, angle: 180, radius: 115, color: '#2196F3' },
  { Icon: Baby, angle: 240, radius: 108, color: '#E91E63' },
  { Icon: Briefcase, angle: 300, radius: 118, color: '#9C27B0' },
];

function OrbitingIcons() {
  return (
    <div className="absolute inset-0">
      {orbitIcons.map(({ Icon, angle, radius, color }, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${color}18`, x: x - 20, y: y - 20 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            <Icon size={20} style={{ color }} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Village SVG ─────────────────────────────────────────────────────────── */
function VillageIllustration() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto max-w-md" fill="none">
      <path d="M0 240 Q100 230 200 235 Q300 240 400 232" stroke="#C8C3B8" strokeWidth="1.5" />
      <rect x="50" y="195" width="55" height="45" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="50,195 77.5,168 105,195" fill="#0F2240" opacity="0.18" />
      <rect x="68" y="215" width="14" height="25" rx="2" fill="#E8740C" opacity="0.25" />
      <rect x="135" y="190" width="50" height="50" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="135,190 160,160 185,190" fill="#0F2240" opacity="0.18" />
      <rect x="150" y="210" width="12" height="30" rx="2" fill="#E8740C" opacity="0.25" />
      <rect x="220" y="198" width="45" height="42" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="220,198 242.5,172 265,198" fill="#0F2240" opacity="0.18" />
      <rect x="235" y="216" width="11" height="24" rx="2" fill="#E8740C" opacity="0.25" />
      <rect x="300" y="192" width="52" height="48" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="300,192 326,163 352,192" fill="#0F2240" opacity="0.18" />
      <rect x="317" y="214" width="13" height="26" rx="2" fill="#E8740C" opacity="0.25" />
      <circle cx="200" cy="120" r="40" fill="#E8740C" opacity="0.08" />
      <circle cx="200" cy="120" r="24" fill="#E8740C" opacity="0.15" />
      <circle cx="200" cy="120" r="10" fill="#E8740C" opacity="0.35" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={angle} x1={200 + Math.cos(rad) * 28} y1={120 + Math.sin(rad) * 28} x2={200 + Math.cos(rad) * 55} y2={120 + Math.sin(rad) * 55} stroke="#E8740C" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
        );
      })}
      <circle cx="115" cy="225" r="8" fill="#4CAF50" opacity="0.15" />
      <rect x="113.5" y="225" width="3" height="15" rx="1" fill="#4CAF50" opacity="0.15" />
      <circle cx="280" cy="228" r="7" fill="#4CAF50" opacity="0.15" />
      <rect x="278.5" y="228" width="3" height="12" rx="1" fill="#4CAF50" opacity="0.15" />
    </svg>
  );
}

/* ── Dot Grid ────────────────────────────────────────────────────────────── */
function DotGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#0F2240" opacity="0.03" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}

/* ── Counter Component ───────────────────────────────────────────────────── */
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 1500 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (inView) {
      animateCounter(target, duration, setValue);
    }
  }, [inView, target, duration]);

  return <span ref={ref}>{`${prefix}${value.toLocaleString('en-IN')}${suffix}`}</span>;
}

/* ── Problem Card ────────────────────────────────────────────────────────── */
function ProblemCard({ emoji, title, desc, stat, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-white border border-gray-200 rounded-xl p-5 lg:p-6 shadow-card"
    >
      <span className="text-2xl">{emoji}</span>
      <h3 className="font-body text-lg font-bold text-gray-900 mt-3">{title}</h3>
      <p className="font-body text-sm text-gray-600 mt-2 leading-relaxed">{desc}</p>
      <p className="font-mono text-[40px] lg:text-[48px] font-bold text-saffron mt-4">
        {stat}
      </p>
    </motion.div>
  );
}

/* ── Feature Block ───────────────────────────────────────────────────────── */
function FeatureBlock({ step, title, desc, reverse, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: reverse ? 30 : -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: '-80px' }}
      className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-12 ${reverse ? 'lg:flex-row-reverse' : ''}`}
    >
      <div className="flex-1">
        <span className="font-display text-[80px] lg:text-[96px] text-navy/10 font-bold leading-none">{step}</span>
        <h3 className="font-display text-[24px] lg:text-[28px] text-navy -mt-6 lg:-mt-8">{title}</h3>
        <p className="font-body text-base text-gray-600 mt-3 max-w-[360px] leading-relaxed">{desc}</p>
      </div>
      <div className="flex-1 w-full max-w-md">{children}</div>
    </motion.div>
  );
}

/* ── Persona Card ────────────────────────────────────────────────────────── */
function PersonaCard({ name, detail, quote, outcome }) {
  return (
    <div className="bg-navy rounded-xl p-5 border border-navy-light/20 shadow-xl min-w-[280px] snap-center">
      <div className="w-14 h-14 rounded-full bg-saffron/10 flex items-center justify-center mb-3">
        <span className="font-display text-xl text-saffron">{name[0]}</span>
      </div>
      <h4 className="font-body text-base font-bold text-white">{name}</h4>
      <p className="font-body text-xs text-gray-400">{detail}</p>
      <div className="mt-3 p-3 bg-navy-mid rounded-lg border border-navy-light/20">
        <p className="font-body text-sm text-gray-200 italic">"{quote}"</p>
      </div>
      <p className="font-body text-xs text-success font-medium mt-3">{outcome}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  LANDING PAGE                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */
function LandingPage() {
  const { language } = useLanguage();
  const T = (key) => t(key, language);

  return (
    <div className="overflow-hidden">
      {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-64px)] bg-navy">
        <DotGrid />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 lg:min-h-[calc(100vh-64px)] flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 flex flex-col items-start max-w-xl lg:max-w-none">
            <motion.span {...fadeUp(0)} className="inline-flex items-center px-3 py-1 rounded-full border border-saffron/40 font-body text-xs uppercase tracking-wider text-saffron mb-6">{T('heroTag')}</motion.span>
            <motion.h1 {...fadeUp(0.15)} className="font-display text-[38px] lg:text-[64px] leading-[1.1] tracking-tight text-white">
              <span className="block">{T('heroLine1')}</span>
              <span className="relative inline-block text-saffron">{T('heroLine2')}</span>
            </motion.h1>
            <motion.p {...fadeUp(0.25)} className="mt-4 font-body text-sm text-saffron/80 max-w-[480px] font-medium">
              Only 43% of eligible rural households claim their full benefits. Sarathi closes the gap.
            </motion.p>
            <motion.p {...fadeUp(0.3)} className="mt-3 font-body text-lg text-gray-300 max-w-[480px] leading-relaxed">{T('heroSubtitle')}</motion.p>
            <motion.div {...fadeUp(0.45)} className="mt-8 flex flex-wrap gap-4">
              <Link to="/citizen/signup" className="inline-flex items-center gap-2 h-[52px] px-6 rounded-[12px] bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors duration-200 shadow-saffron">{T('ctaStart')} <ArrowRight size={18} /></Link>
              <Link to="/panchayat/login" className="inline-flex items-center h-[52px] px-6 rounded-[12px] border-2 border-white/30 text-white font-body text-base font-semibold hover:bg-white/10 transition-colors duration-200">{T('ctaPanchayat')}</Link>
            </motion.div>
            <motion.div {...fadeUp(0.55)} className="mt-6 flex flex-wrap gap-3">
              {[
                { label: '86 Government Schemes', Icon: FileText },
                { label: '28 States Covered', Icon: MapPin },
                { label: '6 Welfare Categories', Icon: LayoutGrid },
                { label: 'AI-Powered Matching', Icon: Cpu },
              ].map(({ label, Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-white/20 font-body text-[11px] text-gray-300">
                  <Icon size={12} className="text-saffron/70" /> {label}
                </span>
              ))}
            </motion.div>
          </div>
          <motion.div {...fadeIn(0.1)} className="flex-1 flex items-center justify-center relative w-full max-w-lg lg:max-w-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] lg:w-[440px] lg:h-[440px] rounded-full bg-saffron/[0.04] blur-3xl pointer-events-none" />
            <div className="relative w-full max-w-md aspect-square">
              <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}><OrbitingIcons /></motion.div>
              <div className="relative z-10 flex items-center justify-center h-full"><VillageIllustration /></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: Problem We Solve ─────────────────────────────────── */}
      <section className="bg-off-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-[32px] lg:text-[42px] text-navy leading-tight"
          >
            {T('problemTitle1')}<br />{T('problemTitle2')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="font-body text-base lg:text-lg text-gray-600 mt-4 max-w-[600px] mx-auto"
          >
            {T('problemSubtitle')}
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-10">
            <ProblemCard emoji="📋" title={T('problemCard1Title')} desc={T('problemCard1Desc')} stat={<AnimatedCounter prefix="₹" target={230} suffix=" Cr" />} delay={0} />
            <ProblemCard emoji="🧾" title={T('problemCard2Title')} desc={T('problemCard2Desc')} stat={<AnimatedCounter target={700} suffix="+" />} delay={0.15} />
            <ProblemCard emoji="📵" title={T('problemCard3Title')} desc={T('problemCard3Desc')} stat={<AnimatedCounter target={30} suffix=" Cr" />} delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── Section 3: How Sarathi Works ─────────────────────────────────── */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-[30px] lg:text-[38px] text-navy text-center mb-8"
          >
            {T('howTitle')}
          </motion.h2>

          <FeatureBlock step="01" title={T('step1Title')} desc={T('step1Desc')}>
            <div className="bg-navy-mid border border-navy-light/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center"><span className="font-display text-lg text-saffron">S</span></div>
                <span className="font-body text-sm text-gray-300">Sarathi Chat</span>
              </div>
              <div className="bg-navy rounded-xl p-3 border-l-[3px] border-saffron/50 shadow-sm mb-3">
                <p className="font-body text-sm text-gray-200">Hello! I am Sarathi. Tell me, how can I help you?</p>
              </div>
              <div className="flex justify-end">
                <div className="bg-saffron text-white px-4 py-2 rounded-[14px_14px_4px_14px] font-body text-sm">I need a pension scheme</div>
              </div>
            </div>
          </FeatureBlock>

          <FeatureBlock step="02" title={T('step2Title')} desc={T('step2Desc')} reverse>
            <div className="space-y-2">
              {[
                { name: 'PM-KISAN', cat: 'Agriculture', amt: '₹6,000', color: '#4CAF50' },
                { name: 'Ayushman Bharat', cat: 'Health', amt: '₹5L', color: '#F44336' },
                { name: 'PM Ujjwala', cat: 'Women', amt: '₹9,600', color: '#E91E63' },
              ].map((s, i) => (
                <motion.div key={s.name} initial={{ x: 40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }} className="flex items-center gap-3 bg-navy-mid border border-navy-light/20 rounded-xl p-3 shadow-xl border-l-4" style={{ borderLeftColor: s.color }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                    <span style={{ color: s.color }} className="text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-white">{s.name}</p>
                    <p className="font-body text-xs text-gray-400">{s.cat}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-saffron">{s.amt}</span>
                </motion.div>
              ))}
            </div>
          </FeatureBlock>

          <FeatureBlock step="03" title={T('step3Title')} desc={T('step3Desc')}>
            <div className="bg-navy-mid border border-navy-light/20 rounded-2xl p-5 shadow-xl">
              <svg viewBox="0 0 300 120" className="w-full">
                <line x1="30" y1="90" x2="280" y2="90" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="40" x2="280" y2="40" stroke="#ef4444" strokeWidth="1" strokeDasharray="6 3" />
                <text x="278" y="33" fill="#ef4444" fontSize="8" fontFamily="DM Sans" textAnchor="end">Poverty Line</text>
                <path d="M30 85 Q80 80 120 65 Q160 50 200 35 Q240 25 270 18" stroke="#4f46e5" strokeWidth="2.5" fill="none" />
                <path d="M30 85 Q80 80 120 65 Q160 50 200 35 Q240 25 270 18 L270 90 L30 90 Z" fill="#4f46e5" opacity="0.1" />
                <text x="135" y="110" fill="#94a3b8" fontSize="8" fontFamily="DM Sans" textAnchor="middle">Year 1 → Year 2 → Year 3</text>
              </svg>
              <p className="font-body text-xs text-center text-gray-300 mt-2">Best path: Cross poverty line in 2.4 years</p>
            </div>
          </FeatureBlock>
        </div>
      </section>

      {/* ── Section 4: Three Personas ────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="font-display text-[30px] lg:text-[38px] text-navy text-center mb-10">
            {T('personaTitle')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <PersonaCard
              name="Kamla Devi, Uttar Pradesh"
              detail="55 yrs, Widow"
              quote="I didn't even know I could get a widow's pension."
              outcome="🎯 Sarathi found 6 schemes | ₹24,000/year"
            />
            <PersonaCard
              name="Ramu Prasad, Bihar"
              detail="38 yrs, Migrant Worker"
              quote="Came to Mumbai, all Bihar benefits stopped."
              outcome="🔄 Benefits carried across states. 0 days gap."
            />
            <PersonaCard
              name="Sarpanch Meena, Rajasthan"
              detail="42 yrs, Village Panchayat Secretary"
              quote="Checking every household was hard. Now Sarathi tells us."
              outcome="📊 87 households enrolled in 30 days."
            />
          </div>
        </div>
      </section>

      {/* ── Section 5: AWS Tech Strip ───────────────────────────────────── */}
      <section className="bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-body text-[13px] uppercase tracking-wider text-gray-500 mb-6">Powered by Amazon Web Services</p>
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {['Amazon Lex', 'Amazon Bedrock', 'Amazon Polly', 'AWS Lambda', 'Amazon DynamoDB', 'Amazon Cognito', 'Amazon SNS'].map((svc) => (
              <span key={svc} className="font-mono text-xs text-gray-400 hover:text-saffron transition-colors duration-200 cursor-default whitespace-nowrap">{svc}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Dual CTA (Citizen + Panchayat) ──────────────────── */}
      <section className="bg-off-white py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-[28px] lg:text-[36px] text-navy text-center mb-10"
          >
            Who is Sarathi for?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Citizen */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              viewport={{ once: true }}
              className="bg-saffron/10 border border-saffron/30 rounded-2xl p-8 flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-saffron/20 flex items-center justify-center mb-4">
                <Home size={24} className="text-saffron" />
              </div>
              <h3 className="font-display text-[22px] text-navy mb-2">I am a Citizen</h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-6">
                Discover all government schemes you're eligible for. Apply in minutes with AI guidance — no paperwork, no queues.
              </p>
              <Link
                to="/citizen/signup"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors shadow-saffron"
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Panchayat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              viewport={{ once: true }}
              className="bg-navy-mid border border-navy-light/30 rounded-2xl p-8 flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Building2 size={24} className="text-white" />
              </div>
              <h3 className="font-display text-[22px] text-white mb-2">I represent a Panchayat</h3>
              <p className="font-body text-sm text-gray-300 leading-relaxed mb-6">
                Monitor your village's welfare coverage in real time. Identify households receiving zero benefits. Send targeted alerts — all from one dashboard.
              </p>
              <Link
                to="/panchayat/login"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border-2 border-white/40 text-white font-body text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Panchayat Login <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 7: Footer ───────────────────────────────────────────── */}
      <footer className="bg-navy border-t border-navy-light/20 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div>
              <Link to="/" className="inline-block">
                <span className="font-display text-2xl text-saffron block">Sarathi</span>
                <span className="font-body text-xs text-gray-400">AI Welfare Engine</span>
              </Link>
              <p className="font-body text-sm text-gray-300 mt-3">{T('footerTagline')}</p>
            </div>
            <div>
              <h4 className="font-body text-sm font-bold text-white mb-3">For Citizens</h4>
              <div className="space-y-2">
                {[
                  { to: '/about', label: 'About' },
                  { to: '/schemes', label: 'Schemes' },
                  { to: '/chat', label: 'Chat with Sarathi' },
                  { to: '/citizen/login', label: 'Login' },
                ].map((l) => (
                  <Link key={l.label} to={l.to} className="block font-body text-sm text-gray-300 hover:text-saffron transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-body text-sm font-bold text-white mb-3">For Panchayats</h4>
              <div className="space-y-2">
                {[
                  { to: '/panchayat/login', label: 'Panchayat Login' },
                  { to: '/panchayat/signup', label: 'Register Panchayat' },
                  { to: '/panchayat', label: 'Dashboard Demo' },
                ].map((l) => (
                  <Link key={l.label} to={l.to} className="block font-body text-sm text-gray-300 hover:text-saffron transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-body text-sm font-bold text-white mb-3">For Administrators</h4>
              <div className="space-y-2">
                {[
                  { to: '/admin', label: 'Admin Panel 🏛️' },
                  { to: '/admin/schemes/new', label: 'Launch New Scheme' },
                ].map((l) => (
                  <Link key={l.label} to={l.to} className="block font-body text-sm text-gray-300 hover:text-saffron transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-navy-light/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="font-body text-gray-500 text-sm">© 2026 Sarathi AI Welfare Engine. Official Government Portal.</p>
            <div className="flex gap-8">
              <Link to="/admin" className="font-body text-gray-500 text-sm hover:text-saffron transition-colors">Admin Dashboard</Link>
              <a href="#" className="font-body text-gray-500 text-sm hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="font-body text-gray-500 text-sm hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
