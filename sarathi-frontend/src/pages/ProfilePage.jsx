import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCitizen } from '../context/CitizenContext';
import { useAuth } from '../context/AuthContext';
import {
    User, MapPin, Briefcase, IndianRupee, ShieldCheck,
    MessageSquare, ChevronRight, Loader2, Heart, Home,
    GraduationCap, Tractor, Factory, Accessibility, Baby,
    Building2, TreePine, Users, FileCheck,
} from 'lucide-react';

/* ── small helpers ──────────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
});

const capitalize = (s) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
};

const boolLabel = (val) => {
    if (val === true) return 'Yes';
    if (val === false) return 'No';
    return null;
};

function InfoRow({ icon: Icon, label, value }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
            <div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-saffron" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-body">{label}</p>
                <p className="text-sm text-white font-body font-medium truncate">
                    {value || '—'}
                </p>
            </div>
        </div>
    );
}

function SectionCard({ title, icon: SectionIcon, children, delay = 0 }) {
    // Filter out null children (InfoRow returns null when no value)
    const validChildren = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
    if (validChildren.length === 0) return null;

    return (
        <motion.div
            {...fadeUp(delay)}
            className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                {SectionIcon && <SectionIcon size={20} className="text-saffron" />}
                <h3 className="font-display text-lg text-white">{title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {validChildren}
            </div>
        </motion.div>
    );
}

function SchemeCard({ scheme, index }) {
    return (
        <motion.div
            {...fadeUp(0.1 + index * 0.05)}
            className="group relative p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-saffron/40 transition-all duration-300"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="text-sm font-body font-semibold text-white truncate">
                        {scheme.name || scheme.nameEnglish || scheme.schemeName || 'Untitled Scheme'}
                    </h4>
                    <p className="text-xs text-slate-400 font-body mt-1 line-clamp-2">
                        {scheme.description || scheme.benefit || ''}
                    </p>
                    {scheme.benefitType && (
                        <span className="inline-block mt-1.5 text-[10px] font-body text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            {scheme.benefitType}
                        </span>
                    )}
                </div>
                {(scheme.annualBenefit != null) && (
                    <span className="shrink-0 text-xs font-body font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        ₹{Number(scheme.annualBenefit).toLocaleString('en-IN')}/yr
                    </span>
                )}
            </div>
        </motion.div>
    );
}

/* ── main page ──────────────────────────────────────────────────────────── */
export default function ProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { citizenProfile, eligibleSchemes, isLoadingProfile } = useCitizen();

    const hasProfile = citizenProfile?.name && citizenProfile.name.trim() !== '';

    /* ── Loading state ─────────────────────────────────────────────────── */
    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 size={36} className="text-saffron animate-spin" />
            </div>
        );
    }

    /* ── Empty state ───────────────────────────────────────────────────── */
    if (!hasProfile) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
                <motion.div {...fadeUp()} className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-saffron/10 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare size={32} className="text-saffron" />
                    </div>
                    <h2 className="font-display text-2xl text-white mb-3">
                        No Profile Yet
                    </h2>
                    <p className="font-body text-slate-400 mb-8">
                        Start a conversation with Sarathi to build your citizen profile and
                        discover welfare schemes you&apos;re eligible for.
                    </p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors duration-200"
                    >
                        Start Chat <ChevronRight size={16} />
                    </button>
                </motion.div>
            </div>
        );
    }

    /* ── Profile view ──────────────────────────────────────────────────── */
    const p = citizenProfile;
    const totalBenefit = eligibleSchemes.reduce(
        (sum, s) => sum + (Number(s.annualBenefit) || 0),
        0,
    );

    const urbanLabel = p.urban === true ? 'Urban' : p.urban === false ? 'Rural' : (p.urban === 'urban' ? 'Urban' : p.urban === 'rural' ? 'Rural' : null);

    return (
        <div className="min-h-screen bg-[#020617] pb-20">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-[#0f172a] to-[#020617] pt-10 pb-14 px-4">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-saffron/5 blur-3xl" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <motion.div {...fadeUp()} className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-saffron/20 flex items-center justify-center ring-2 ring-saffron/30">
                            <User size={28} className="text-saffron" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl md:text-3xl text-white">
                                {p.name}
                            </h1>
                            <p className="font-body text-sm text-slate-400 mt-0.5">
                                {user?.email || ''}
                            </p>
                            {p.persona && (
                                <span className="inline-block mt-1 text-xs font-body text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full">
                                    {capitalize(p.persona)}
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Summary Stats */}
                    {eligibleSchemes.length > 0 && (
                        <motion.div {...fadeUp(0.1)} className="flex gap-4 mt-6">
                            <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                                <p className="text-2xl font-display text-emerald-400">{eligibleSchemes.length}</p>
                                <p className="text-xs font-body text-slate-400">Schemes Matched</p>
                            </div>
                            <div className="flex-1 rounded-xl bg-saffron/10 border border-saffron/20 p-3 text-center">
                                <p className="text-2xl font-display text-saffron">₹{totalBenefit.toLocaleString('en-IN')}</p>
                                <p className="text-xs font-body text-slate-400">Total Annual Benefit</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-5">

                {/* ─── Core Profile ─────────────────────────────────────────── */}
                <SectionCard title="Basic Information" icon={User} delay={0.1}>
                    <InfoRow icon={User} label="Age" value={p.age ? `${p.age} years` : null} />
                    <InfoRow icon={User} label="Gender" value={capitalize(p.gender)} />
                    <InfoRow icon={Heart} label="Marital Status" value={capitalize(p.maritalStatus)} />
                    <InfoRow icon={MapPin} label="State" value={p.state} />
                    <InfoRow icon={Building2} label="Area Type" value={urbanLabel} />
                    <InfoRow icon={IndianRupee} label="Annual Income" value={p.income ? `₹${Number(p.income).toLocaleString('en-IN')}` : null} />
                    <InfoRow icon={ShieldCheck} label="Caste Category" value={p.category} />
                    <InfoRow icon={Briefcase} label="Occupation" value={capitalize(p.occupation)} />
                    <InfoRow icon={Accessibility} label="Disability" value={boolLabel(p.disability)} />
                    <InfoRow icon={FileCheck} label="Ration Card" value={p.bplCard ? p.bplCard.toUpperCase() : null} />
                </SectionCard>

                {/* ─── Farmer Details ───────────────────────────────────────── */}
                {(p.persona === 'farmer' || p.occupation === 'farmer') && (
                    <SectionCard title="Farmer Details" icon={Tractor} delay={0.15}>
                        <InfoRow icon={Tractor} label="Land Owned" value={boolLabel(p.landOwned)} />
                        <InfoRow icon={Tractor} label="Land Size" value={p.landSize ? `${p.landSize} acres` : null} />
                        <InfoRow icon={Tractor} label="Tenant Farmer" value={boolLabel(p.tenantFarmer)} />
                        <InfoRow icon={Tractor} label="Livestock" value={boolLabel(p.livestock)} />
                        <InfoRow icon={Tractor} label="Irrigated Land" value={boolLabel(p.irrigatedLand)} />
                    </SectionCard>
                )}

                {/* ─── Student Details ──────────────────────────────────────── */}
                {(p.persona === 'student' || p.occupation === 'student') && (
                    <SectionCard title="Education Details" icon={GraduationCap} delay={0.15}>
                        <InfoRow icon={GraduationCap} label="Class Level" value={capitalize(p.classLevel)} />
                        <InfoRow icon={GraduationCap} label="Government School" value={boolLabel(p.govtSchool)} />
                        <InfoRow icon={GraduationCap} label="Minority Community" value={boolLabel(p.minority)} />
                    </SectionCard>
                )}

                {/* ─── Unemployed / Job Seeker ─────────────────────────────── */}
                {p.persona === 'unemployed' && (
                    <SectionCard title="Employment Details" icon={Briefcase} delay={0.15}>
                        <InfoRow icon={Briefcase} label="Skill Trained" value={boolLabel(p.skillTrained)} />
                        <InfoRow icon={Briefcase} label="Interested in Training" value={boolLabel(p.interestedInTraining)} />
                        <InfoRow icon={GraduationCap} label="Education Level" value={capitalize(p.educationLevel)} />
                    </SectionCard>
                )}

                {/* ─── Business Owner ──────────────────────────────────────── */}
                {p.persona === 'business_owner' && (
                    <SectionCard title="Business Details" icon={Factory} delay={0.15}>
                        <InfoRow icon={Factory} label="MSME Registered" value={boolLabel(p.msmeRegistered)} />
                        <InfoRow icon={IndianRupee} label="Annual Turnover" value={p.businessTurnover ? `₹${Number(p.businessTurnover).toLocaleString('en-IN')}` : null} />
                        <InfoRow icon={Factory} label="Loan Needed" value={boolLabel(p.loanNeeded)} />
                    </SectionCard>
                )}

                {/* ─── Senior Citizen ──────────────────────────────────────── */}
                {p.persona === 'senior' && (
                    <SectionCard title="Senior Citizen Details" icon={Users} delay={0.15}>
                        <InfoRow icon={Users} label="Receiving Pension" value={boolLabel(p.pensionReceiving)} />
                    </SectionCard>
                )}

                {/* ─── Disability Details ──────────────────────────────────── */}
                {(p.disability === true || p.persona === 'disabled') && (
                    <SectionCard title="Disability Details" icon={Accessibility} delay={0.15}>
                        <InfoRow icon={Accessibility} label="Disability %" value={p.disabilityPercent || null} />
                        <InfoRow icon={Accessibility} label="Type" value={capitalize(p.disabilityType)} />
                        <InfoRow icon={FileCheck} label="UDID Certificate" value={boolLabel(p.disabilityCertificate)} />
                    </SectionCard>
                )}

                {/* ─── Pregnant / Lactating ─────────────────────────────────── */}
                {p.persona === 'pregnant' && (
                    <SectionCard title="Maternity Details" icon={Baby} delay={0.15}>
                        <InfoRow icon={Baby} label="Currently Pregnant" value={boolLabel(p.pregnant)} />
                        <InfoRow icon={Baby} label="Lactating Mother" value={boolLabel(p.lactating)} />
                    </SectionCard>
                )}

                {/* ─── Female-specific ─────────────────────────────────────── */}
                {p.gender === 'female' && (p.isWidow || p.shgMember) && (
                    <SectionCard title="Women-specific Details" icon={Heart} delay={0.15}>
                        <InfoRow icon={Heart} label="Widow" value={boolLabel(p.isWidow)} />
                        <InfoRow icon={Users} label="SHG Member" value={boolLabel(p.shgMember)} />
                    </SectionCard>
                )}

                {/* ─── Urban / Rural Details ────────────────────────────────── */}
                {(p.ownHouse !== null || p.streetVendor !== null || p.kutchaHouse !== null || p.mgnregaCard !== null) && (
                    <SectionCard title={p.urban === true ? 'Urban Details' : 'Rural Details'} icon={p.urban === true ? Building2 : TreePine} delay={0.2}>
                        <InfoRow icon={Home} label="Own House" value={boolLabel(p.ownHouse)} />
                        <InfoRow icon={Building2} label="Street Vendor" value={boolLabel(p.streetVendor)} />
                        <InfoRow icon={Home} label="Kutcha House" value={boolLabel(p.kutchaHouse)} />
                        <InfoRow icon={FileCheck} label="MGNREGA Card" value={boolLabel(p.mgnregaCard)} />
                    </SectionCard>
                )}

                {/* ─── Matched Schemes ──────────────────────────────────────── */}
                {eligibleSchemes.length > 0 && (
                    <motion.div
                        {...fadeUp(0.25)}
                        className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg text-white">
                                Matched Schemes ({eligibleSchemes.length})
                            </h3>
                            <span className="text-xs font-body font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                                Total: ₹{totalBenefit.toLocaleString('en-IN')}/yr
                            </span>
                        </div>
                        <div className="space-y-3">
                            {eligibleSchemes.map((s, i) => (
                                <SchemeCard key={s.schemeId || s.name || i} scheme={s} index={i} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Update CTA */}
                <motion.div {...fadeUp(0.3)} className="flex justify-center">
                    <button
                        onClick={() => navigate('/chat')}
                        className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-saffron text-saffron font-body text-sm font-semibold hover:bg-saffron/10 transition-colors duration-200"
                    >
                        Update Profile <ChevronRight size={16} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
