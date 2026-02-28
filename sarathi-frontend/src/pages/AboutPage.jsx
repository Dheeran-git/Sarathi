import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter } from 'lucide-react';

const team = [
    {
        name: 'Dheeran Dhiren Khandal',
        role: 'Full-Stack & AI Lead',
        avatar: '🧑‍💻',
        links: { github: '#', linkedin: '#' },
    },
    {
        name: 'Mohit Lakhara',
        role: 'Backend & Cloud Lead',
        avatar: '👨‍💻',
        links: { github: '#', linkedin: '#' },
    },
    {
        name: 'Himanshu Parmar',
        role: 'Frontend Lead',
        avatar: '🎨',
        links: { github: '#', linkedin: '#' },
    },
    {
        name: 'Jaimin Patel',
        role: 'ML & Data Lead',
        avatar: '🤖',
        links: { github: '#', linkedin: '#' },
    },
];

const values = [
    { emoji: '🎯', title: 'Inclusion First', desc: 'Every citizen, regardless of literacy or connectivity, deserves access to welfare.' },
    { emoji: '🔒', title: 'Privacy by Design', desc: 'We never store personal data beyond the session. Anonymized analytics only.' },
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
                {/* Mission */}
                <section className="text-center">
                    <h2 className="font-display text-[26px] lg:text-[32px] text-navy">Our Mission</h2>
                    <p className="font-body text-base text-gray-700 mt-3 max-w-[560px] mx-auto leading-relaxed">
                        700+ government schemes exist, yet the average eligible family accesses only 2-3.
                        Sarathi bridges this gap using voice AI, digital twins, and intelligent scheme matching — so no benefit goes unclaimed.
                    </p>
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

                {/* Team */}
                <section>
                    <h2 className="font-display text-[24px] lg:text-[28px] text-navy text-center mb-2">Team Boolean Bandits</h2>
                    <p className="font-body text-sm text-gray-500 text-center mb-8">AWS AI for Bharat Hackathon 2025</p>
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

                {/* CTA */}
                <section className="text-center py-8">
                    <h2 className="font-display text-[24px] text-navy">Ready to find your benefits?</h2>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                        <Link to="/chat" className="inline-flex items-center h-12 px-6 rounded-xl bg-saffron text-white font-body text-base font-semibold hover:bg-saffron-light transition-colors shadow-saffron">
                            Start Now →
                        </Link>
                        <Link to="/schemes" className="inline-flex items-center h-12 px-6 rounded-xl border-2 border-saffron text-saffron font-body text-base font-semibold hover:bg-saffron/5 transition-colors">
                            View All Schemes
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutPage;
