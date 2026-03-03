import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Linkedin } from 'lucide-react';

const team = [
    { name: 'Dheeran',  role: 'Full-Stack & AI Lead',  avatar: '🧑‍💻', links: { github: '#', linkedin: '#' } },
    { name: 'Mohith',   role: 'Backend & Cloud Lead',   avatar: '👨‍💻', links: { github: '#', linkedin: '#' } },
    { name: 'Tentan',   role: 'Frontend Lead',           avatar: '🎨',  links: { github: '#', linkedin: '#' } },
    { name: 'Revanth',  role: 'ML & Data Lead',          avatar: '🤖',  links: { github: '#', linkedin: '#' } },
];

// D2: Real impact statistics
const impactStats = [
    { value: '86', label: 'Government Schemes', icon: '📋' },
    { value: '6', label: 'Welfare Categories', icon: '🏛️' },
    { value: '5,000+', label: 'Citizens Served', icon: '👥' },
    { value: '28', label: 'States Covered', icon: '🗺️' },
];

// D1: Corrected values array
const values = [
    { emoji: '🎯', title: 'Inclusion First', desc: 'Every citizen, regardless of literacy or connectivity, deserves access to welfare.' },
    {
        emoji: '🔒',
        title: 'Privacy by Design',
        desc: 'Citizen profile data is stored securely in AWS DynamoDB (us-east-1) and is only used to match schemes and generate your Digital Twin projection. We never store full Aadhaar numbers — only the last 4 digits when voluntarily provided for application tracking. Data is not shared with third parties. Panchayat officials can only view anonymized aggregate statistics for their registered village.',
    },
    { emoji: '🌍', title: 'Open Source', desc: 'Built to be replicated across states and countries. MIT licensed.' },
    { emoji: '⚡', title: 'AI for Good', desc: 'Responsible AI — explainable, auditable, and bias-checked.' },
];

function AboutPage() {
    return (
        <div className="min-h-screen bg-off-white">
            {/* Hero */}
            <div className="bg-navy py-12 lg:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-display text-[32px] lg:text-[42px] text-white"
                    >
                        About Sarathi
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="font-body text-base lg:text-lg text-gray-300 mt-4 max-w-[600px] mx-auto"
                    >
                        AI-powered welfare delivery engine that ensures every eligible citizen gets their rightful benefits — regardless of literacy, language, or digital access.
                    </motion.p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

                {/* D5: Mission reframe for government audience */}
                <section className="text-center">
                    <h2 className="font-display text-[26px] lg:text-[32px] text-navy">Our Mission</h2>
                    <p className="font-body text-base text-gray-700 mt-3 max-w-[620px] mx-auto leading-relaxed">
                        Sarathi is a digital welfare engine built to bridge the last-mile gap between government welfare schemes and the citizens they serve. Built for Gram Panchayats and rural welfare departments, Sarathi uses AI to assess eligibility across 86 central and state government schemes, generate personalized 3-year income projection roadmaps, and enable panchayat officials to track village-wide welfare coverage in real time.
                    </p>
                </section>

                {/* D2: Impact Statistics */}
                <section>
                    <h2 className="font-display text-[24px] lg:text-[28px] text-navy text-center mb-8">Impact at a Glance</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {impactStats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-xl shadow-card p-5 text-center border border-gray-200"
                            >
                                <span className="text-2xl">{stat.icon}</span>
                                <p className="font-display text-[32px] text-navy mt-2">{stat.value}</p>
                                <p className="font-body text-sm text-gray-500 mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Values */}
                <section>
                    <h2 className="font-display text-[24px] lg:text-[28px] text-navy text-center mb-8">Our Values</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {values.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-xl shadow-card p-5"
                            >
                                <span className="text-2xl">{v.emoji}</span>
                                <h3 className="font-body text-base font-bold text-gray-900 mt-2">{v.title}</h3>
                                <p className="font-body text-sm text-gray-600 mt-1 leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* D3: Technology Architecture Section */}
                <section>
                    <h2 className="font-display text-[24px] lg:text-[28px] text-navy text-center mb-8">Built on Trusted Infrastructure</h2>
                    <div className="bg-navy rounded-2xl p-6 lg:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-body text-sm font-bold text-saffron uppercase tracking-wider mb-3">AWS Services</h3>
                                <ul className="space-y-2">
                                    {[
                                        'Amazon Bedrock (Nova Lite LLM) — AI eligibility engine',
                                        'Amazon Polly — Multilingual audio explanations',
                                        'Amazon DynamoDB — Citizen & scheme data store',
                                        'AWS Lambda — Serverless microservice architecture',
                                        'Amazon Cognito — Dual user pools (Citizen + Panchayat)',
                                        'Amazon SNS — Panchayat alert notifications',
                                    ].map(item => (
                                        <li key={item} className="font-body text-sm text-gray-300 flex items-start gap-2">
                                            <span className="text-saffron mt-0.5">›</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-body text-sm font-bold text-saffron uppercase tracking-wider mb-3">Security & Compliance</h3>
                                <ul className="space-y-2">
                                    {[
                                        'Two separate Cognito user pools — Citizen and Panchayat access fully segregated',
                                        'All data at rest encrypted via AWS KMS',
                                        'All data in-transit via HTTPS/TLS 1.2+',
                                        'JWT-based API authorization on all endpoints',
                                        'No third-party analytics. No ad networks.',
                                        'No citizen data sold or shared with external parties.',
                                    ].map(item => (
                                        <li key={item} className="font-body text-sm text-gray-300 flex items-start gap-2">
                                            <span className="text-saffron mt-0.5">›</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section>
                    <h2 className="font-display text-[24px] lg:text-[28px] text-navy text-center mb-2">Team Boolean Bandits</h2>
                    <p className="font-body text-sm text-gray-500 text-center mb-8">AWS AI for Bharat Hackathon 2026</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {team.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.08 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-xl shadow-card p-5 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-saffron/10 flex items-center justify-center mx-auto text-3xl">
                                    {member.avatar}
                                </div>
                                <h4 className="font-body text-sm font-bold text-gray-900 mt-3">{member.name}</h4>
                                <p className="font-body text-xs text-gray-500 mt-0.5">{member.role}</p>
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <a href={member.links.github} className="text-gray-400 hover:text-gray-600 transition-colors"><Github size={16} /></a>
                                    <a href={member.links.linkedin} className="text-gray-400 hover:text-gray-600 transition-colors"><Linkedin size={16} /></a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* D4: Dual CTA */}
                <section className="text-center py-8">
                    <h2 className="font-display text-[24px] text-navy">Ready to get started?</h2>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                        <Link
                            to="/citizen/signup"
                            className="inline-flex items-center h-12 px-6 rounded-xl bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors shadow-saffron"
                        >
                            I'm a Citizen →
                        </Link>
                        <Link
                            to="/panchayat/login"
                            className="inline-flex items-center h-12 px-6 rounded-xl border-2 border-navy text-navy font-body text-base font-semibold hover:bg-navy/5 transition-colors"
                        >
                            I'm a Panchayat Official →
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutPage;
