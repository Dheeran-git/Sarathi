import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Sparkles, Code2, Users, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function AboutPage() {
    const { language } = useLanguage();
    const isHi = language === 'hi';

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    const team = [
        {
            name: 'Dheeran',
            nameHi: 'धीरन',
        },
        {
            name: 'Mohith',
            nameHi: 'मोहित',
        },
        {
            name: 'Tentan',
            nameHi: 'टेंटन',
        },
        {
            name: 'Revanth',
            nameHi: 'रेवंत',
        }
    ];

    return (
        <div className="min-h-screen bg-off-white">
            {/* Hero Section */}
            <section className="bg-navy pt-20 pb-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-saffron/20 via-navy to-navy pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron/10 border border-saffron/20 text-saffron mb-8"
                    >
                        <Heart size={16} />
                        <span className="font-body text-sm font-medium">Built for India. Built with Love.</span>
                    </motion.div>

                    <motion.h1
                        {...fadeIn}
                        className="font-display text-4xl lg:text-6xl text-white mb-6 leading-tight"
                    >
                        {isHi ? 'प्रौद्योगिकी से ' : 'Bridging the Gap with '}<br />
                        <span className="text-saffron">{isHi ? 'कल्याणकारी योजनाओं' : 'Welfare Tech'}</span> {isHi ? ' को जोड़ना' : ''}
                    </motion.h1>

                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.1 }}
                        className="font-body text-lg lg:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        {isHi
                            ? 'सारथी भारत का पहला AI-संचालित कल्याण वितरण इंजन है जिसे यह सुनिश्चित करने के लिए डिज़ाइन किया गया है कि कोई भी पात्र नागरिक पीछे न छूटे।'
                            : "Sarathi is India's first AI-powered welfare delivery engine designed to ensure no eligible citizen is left behind."}
                    </motion.p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 mb-20">
                <div className="bg-white rounded-2xl shadow-card p-8 lg:p-12 border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="font-display text-3xl text-gray-900 mb-6">
                                {isHi ? 'हमारा मिशन' : 'Our Mission'}
                            </h2>
                            <p className="font-body text-gray-600 leading-relaxed mb-6">
                                {isHi
                                    ? 'भारत में ७०० से अधिक कल्याणकारी योजनाएं हैं, लेकिन एक औसत पात्र परिवार हर साल ३०,००० रुपये से अधिक के लाभों से वंचित रह जाता है। क्यों? जटिलता, जागरूकता की कमी और पहुंच में बाधाओं के कारण।'
                                    : 'India has over 700+ welfare schemes, yet the average eligible family misses out on ₹30,000+ in benefits annually. Why? Because of complexity, lack of awareness, and accessibility barriers.'}
                            </p>
                            <p className="font-body text-gray-600 leading-relaxed">
                                {isHi
                                    ? 'हम उस प्रतिमान को बदल रहे हैं। AI, ध्वनि इंटरफेस और डिजिटल ट्विन तकनीक का लाभ उठाकर, हम सिस्टम को उलटने के लिए डिज़ाइन किया गया एक मंच बना रहे हैं: अब नागरिकों को सिस्टम को खोजने की आवश्यकता नहीं होगी, सिस्टम उन्हें खोज लेगा।'
                                    : 'We are changing that paradigm. By leveraging AI, voice interfaces, and digital twin technology, we are building a platform designed to invert the system: citizens no longer have to seek out the system, the system seeks them out.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-orange-50 p-6 rounded-xl">
                                <Sparkles className="text-saffron mb-4" size={32} />
                                <h3 className="font-bold text-gray-900 mb-2">{isHi ? 'AI-संचालित मिलान' : 'AI-Powered Matching'}</h3>
                                <p className="text-sm text-gray-600">{isHi ? 'सटीक योजना खोजना' : 'Precise scheme discovery'}</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-xl">
                                <Shield className="text-navy mb-4" size={32} />
                                <h3 className="font-bold text-gray-900 mb-2">{isHi ? 'सार्वभौमिक पहुंच' : 'Universal Access'}</h3>
                                <p className="text-sm text-gray-600">{isHi ? 'आवाज और २२ भाषाएं' : 'Voice-first in 22 languages'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="font-display text-3xl lg:text-4xl text-gray-900 mb-4">
                        {isHi ? 'सारथी के पीछे की टीम' : 'The Team Behind Sarathi'}
                    </h2>
                    <p className="font-body text-gray-600 mb-12 max-w-2xl mx-auto">
                        {isHi
                            ? 'सारथी को AWS AI for Bharat हैकथॉन २०२५ के दौरान भावुक डेवलपर्स और एआई शोधकर्ताओं की एक टीम द्वारा बनाया गया था।'
                            : 'Sarathi was built by a team of passionate developers and AI researchers during the AWS AI for Bharat Hackathon 2025.'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                        {team.map((member, idx) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-100 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-2">
                                    <Users size={48} className="text-gray-300" />
                                </div>
                                <h3 className="font-bold text-gray-900">{isHi ? member.nameHi : member.name}</h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-navy py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="font-display text-3xl text-white mb-6">
                        {isHi ? 'कल्याण के भविष्य का अनुभव करें' : 'Experience the Future of Welfare'}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            to="/chat"
                            className="h-12 px-8 bg-saffron text-white rounded-lg flex items-center gap-2 font-medium hover:bg-saffron-light transition-colors"
                        >
                            {isHi ? 'उपयोगकर्ता के रूप में देखें' : 'Try as Citizen'}
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/panchayat"
                            className="h-12 px-8 border border-white/20 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-white/10 transition-colors"
                        >
                            <Code2 size={18} />
                            {isHi ? 'पंचायत के रूप में देखें' : 'View as Panchayat'}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AboutPage;
