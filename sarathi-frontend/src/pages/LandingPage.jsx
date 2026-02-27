import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home, Heart, Wheat, GraduationCap, Baby, Briefcase } from 'lucide-react';

/* ── Framer Motion helpers ─────────────────────────────────────────────── */
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

/* ── SVG Brushstroke Underline ─────────────────────────────────────────── */
function BrushStroke() {
  return (
    <svg
      className="absolute -bottom-2 left-0 w-full h-3"
      viewBox="0 0 300 12"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M2 8C30 3 70 2 100 5C140 8 180 3 220 6C255 8 280 4 298 7"
        stroke="#E8740C"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

/* ── Floating Welfare Icons (orbit the central glow) ──────────────────── */
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
            style={{
              backgroundColor: `${color}18`,
              x: x - 20,
              y: y - 20,
            }}
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

/* ── Village Illustration SVG ─────────────────────────────────────────── */
function VillageIllustration() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto max-w-md" fill="none">
      {/* Ground line */}
      <path d="M0 240 Q100 230 200 235 Q300 240 400 232" stroke="#C8C3B8" strokeWidth="1.5" />

      {/* House 1 — left */}
      <rect x="50" y="195" width="55" height="45" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="50,195 77.5,168 105,195" fill="#0F2240" opacity="0.18" />
      <rect x="68" y="215" width="14" height="25" rx="2" fill="#E8740C" opacity="0.25" />

      {/* House 2 — center-left */}
      <rect x="135" y="190" width="50" height="50" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="135,190 160,160 185,190" fill="#0F2240" opacity="0.18" />
      <rect x="150" y="210" width="12" height="30" rx="2" fill="#E8740C" opacity="0.25" />

      {/* House 3 — center-right */}
      <rect x="220" y="198" width="45" height="42" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="220,198 242.5,172 265,198" fill="#0F2240" opacity="0.18" />
      <rect x="235" y="216" width="11" height="24" rx="2" fill="#E8740C" opacity="0.25" />

      {/* House 4 — right */}
      <rect x="300" y="192" width="52" height="48" rx="3" fill="#0F2240" opacity="0.12" />
      <polygon points="300,192 326,163 352,192" fill="#0F2240" opacity="0.18" />
      <rect x="317" y="214" width="13" height="26" rx="2" fill="#E8740C" opacity="0.25" />

      {/* Central glow circle */}
      <circle cx="200" cy="120" r="40" fill="#E8740C" opacity="0.08" />
      <circle cx="200" cy="120" r="24" fill="#E8740C" opacity="0.15" />
      <circle cx="200" cy="120" r="10" fill="#E8740C" opacity="0.35" />

      {/* Radiating lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 200 + Math.cos(rad) * 28;
        const y1 = 120 + Math.sin(rad) * 28;
        const x2 = 200 + Math.cos(rad) * 55;
        const y2 = 120 + Math.sin(rad) * 55;
        return (
          <line
            key={angle}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#E8740C" strokeWidth="1" opacity="0.2"
            strokeLinecap="round"
          />
        );
      })}

      {/* Small tree accents */}
      <circle cx="115" cy="225" r="8" fill="#4CAF50" opacity="0.15" />
      <rect x="113.5" y="225" width="3" height="15" rx="1" fill="#4CAF50" opacity="0.15" />
      <circle cx="280" cy="228" r="7" fill="#4CAF50" opacity="0.15" />
      <rect x="278.5" y="228" width="3" height="12" rx="1" fill="#4CAF50" opacity="0.15" />
    </svg>
  );
}

/* ── Dot Grid Background Pattern ──────────────────────────────────────── */
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

/* ── Trust Pills ──────────────────────────────────────────────────────── */
const trustPills = [
  '🔒 डेटा सुरक्षित',
  '🗣️ 22 भाषाएं',
  '⚡ 3 सेकंड में परिणाम',
];

/* ── Landing Page ─────────────────────────────────────────────────────── */
function LandingPage() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] bg-off-white overflow-hidden">
      <DotGrid />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 lg:min-h-[calc(100vh-64px)] flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">

        {/* ── Left Column — Text ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-start max-w-xl lg:max-w-none">

          {/* AWS Tag */}
          <motion.span
            {...fadeUp(0)}
            className="inline-flex items-center px-3 py-1 rounded-full border border-saffron/40 font-body text-xs uppercase tracking-wider text-saffron mb-6"
          >
            🇮🇳 AWS AI for Bharat
          </motion.span>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.15)}
            className="font-display text-[38px] lg:text-[64px] leading-[1.1] tracking-tight text-navy"
          >
            <span className="block">सरकारी योजनाएं,</span>
            <span className="relative inline-block">
              आपके द्वार तक।
              <BrushStroke />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.3)}
            className="mt-6 font-body text-lg text-gray-700 max-w-[480px] leading-relaxed"
          >
            India's first AI-powered welfare delivery engine. Built for the
            poorest, the illiterate, and the invisible.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.45)}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 h-[52px] px-6 rounded-[12px] bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors duration-200 shadow-saffron"
            >
              अभी शुरू करें
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/panchayat"
              className="inline-flex items-center h-[52px] px-6 rounded-[12px] border-2 border-saffron text-saffron font-body text-base font-semibold hover:bg-saffron/5 transition-colors duration-200"
            >
              पंचायत डैशबोर्ड
            </Link>
          </motion.div>

          {/* Trust Pills */}
          <motion.div
            {...fadeUp(0.55)}
            className="mt-6 flex flex-wrap gap-3"
          >
            {trustPills.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center px-3 py-1 rounded-md border border-gray-200 font-body text-[11px] text-gray-500"
              >
                {pill}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── Right Column — Illustration ────────────────────────────── */}
        <motion.div
          {...fadeIn(0.1)}
          className="flex-1 flex items-center justify-center relative w-full max-w-lg lg:max-w-none"
        >
          {/* Soft saffron radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] lg:w-[440px] lg:h-[440px] rounded-full bg-saffron/[0.06] blur-3xl pointer-events-none" />

          {/* Slowly rotating orbit container */}
          <div className="relative w-full max-w-md aspect-square">
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <OrbitingIcons />
            </motion.div>

            {/* Village SVG (does not rotate) */}
            <div className="relative z-10 flex items-center justify-center h-full">
              <VillageIllustration />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LandingPage;
