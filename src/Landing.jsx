import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  NavBar, Footer, ScrollProgress, CursorGlow, TiltCard, MagneticButton, CountUp, RevealWords, RotatingWord,
  StormBackground
} from './components';

const MARQUEE_ITEMS = [
  '🛡️ Verified profiles', '🌙 Sleep schedule match', '🧹 Cleanliness match', '🥗 Food preference',
  '💬 Real-time chat', '🏠 Room listings', '💰 Rent split calculator', '📅 Visit scheduling',
  '⭐ Roommate reviews', '📄 Agreement generator', '🚭 Smoking preference', '🐾 Pet friendly',
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  // amount 0 → fires as soon as any sliver is visible, so tall sections never stay hidden
  viewport: { once: true, amount: 0, margin: '0px 0px -40px 0px' },
  transition: { duration: 0.55, ease: 'easeOut' },
};

const FAQS = [
  {
    q: 'Is Saakhi really women-only?',
    a: 'Yes. Saakhi is built exclusively for women looking for female roommates, so you can search with confidence and peace of mind.'
  },
  {
    q: 'Is Saakhi free to use?',
    a: 'Completely free. Creating a profile, getting matched, and chatting with potential roommates costs nothing.'
  },
  {
    q: 'How does matching work?',
    a: 'You answer three quick lifestyle questions — sleep schedule, cleanliness, and social energy. Saakhi compares your answers with other members and shows you a compatibility score for each one.'
  },
  {
    q: 'Is my personal information safe?',
    a: 'Your profile is visible only to signed-in Saakhi members, never publicly. Chats are private between you and your match, and we never share your email or details with anyone.'
  },
  {
    q: 'How do I talk to a match?',
    a: 'Every match card has a Message button — it opens a private real-time chat right inside Saakhi, so you never have to share your phone number until you are ready.'
  }
];

const Landing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const { scrollYProgress } = useScroll();

  // The storm gets the screen to itself first, then the page arrives.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    const t = setTimeout(() => {
      document.body.style.overflow = prev || '';
    }, 2600);
    // Guarantee the page is visible after the intro window, animations or not.
    const ready = setTimeout(() => {
      document.documentElement.classList.add('intro-ready');
    }, 4000);
    return () => {
      clearTimeout(t);
      clearTimeout(ready);
      document.body.style.overflow = prev || '';
    };
  }, []);

  // The storm owns the hero, then recedes so the rest of the page stays readable.
  const stormOpacity = useTransform(scrollYProgress, [0, 0.08, 0.18], [1, 0.35, 0.04]);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Live plasma-storm backdrop — hero only, fades back as you scroll */}
      <motion.div style={{ opacity: stormOpacity }} className="fixed inset-0 z-0 pointer-events-none">
        <StormBackground interactive />
      </motion.div>
      <div className="relative z-10">
      <div className="intro-nav">
        <ScrollProgress />
        <NavBar />
      </div>

      <div
        className="intro-hint fixed bottom-6 left-1/2 -translate-x-1/2 z-20 text-sm text-[#ffb3d0] pointer-events-none flex flex-col items-center gap-1"
      >
        <span>scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >↓</motion.span>
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden w-full px-6 md:px-10 py-16 flex flex-col items-center min-h-[92vh] justify-center">
          <CursorGlow />
          {/* Scrim so hero copy stays readable over the storm */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(20,3,18,0.88) 0%, rgba(20,3,18,0.72) 40%, rgba(20,3,18,0.25) 70%, transparent 100%)',
            }}
          />

          <div
            className="relative z-10 text-center max-w-5xl mx-auto mb-12"
            style={{ textShadow: '0 2px 18px rgba(10,1,9,0.95), 0 1px 4px rgba(10,1,9,0.9)' }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 1.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-[#ffe3ef] text-sm font-medium mb-6 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#ffd36b] pulse-dot"></span>
              India's women-only roommate finder
            </motion.span>

            {/* Storm lands first (~1.6s), then the wordmark drifts in slowly */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, delay: 2.0, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-8xl font-bold text-white mb-3 leading-[1.05] tracking-tight"
            >
              <span className="text-gradient-animated">Saakhi</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 3.1, ease: 'easeOut' }}
              className="text-2xl md:text-4xl font-semibold text-[#ffe3ef] mb-6 tracking-wide"
            >
              Find Your Perfect Roommate
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.7, duration: 0.9 }}
              className="text-xl text-[#ffe3ef] mb-2 max-w-2xl mx-auto"
            >
              Saakhi helps women find compatible roommates based on lifestyle preferences, making shared living safer and more harmonious.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.0, duration: 0.9 }}
              className="text-lg text-[#ffb3d0] mb-8"
            >
              Matched on{' '}
              <RotatingWord
                className="font-semibold text-white"
                words={['sleep schedule 🌙', 'cleanliness 🧹', 'food preference 🥗', 'budget 💰', 'social energy 🎉']}
              />
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.3, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <MagneticButton
                onClick={() => navigate('/register')}
                className="sakhi-button-primary text-lg px-8 py-3 shadow-xl shadow-[#12030f]/40"
              >
                Get Started — it's free →
              </MagneticButton>
              <MagneticButton
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="sakhi-button-secondary text-lg px-8 py-3"
              >
                Learn More
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.6, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-8 text-sm text-[#ffb3d0]"
            >
              <span>🛡️ Verified profiles</span>
              <span>👩 Women-only community</span>
              <span>🔒 Privacy first</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.2, delay: 4.8, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-4xl animate-float"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#ff2d6b]"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffd36b]"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffd36b]"></span>
                <div className="ml-4 flex-1 max-w-xs px-3 py-1 bg-white/10 rounded-full text-xs text-[#ffb3d0] text-center">
                  saakhi.app/matches
                </div>
              </div>

              {/* Mock app content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-white font-semibold">Your Top Matches</div>
                    <div className="text-xs text-[#ffb3d0]">Based on lifestyle & preferences</div>
                  </div>
                  <div className="px-3 py-1 bg-[#ff2d6b]/40 rounded-full text-xs text-[#ffe3ef] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffd36b] pulse-dot"></span> 3 new today
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { initial: 'A', match: '95%', from: '#ff2d6b', to: '#6a0a2a' },
                    { initial: 'P', match: '91%', from: '#ff7ab0', to: '#a01844' },
                    { initial: 'R', match: '88%', from: '#ffb3d0', to: '#ff2d6b' }
                  ].map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.12, duration: 0.45 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-white/10 rounded-xl border border-white/10 p-4 shine-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}
                        >
                          {card.initial}
                        </div>
                        <span className="px-2 py-0.5 bg-[#ffd36b]/20 text-[#ffd36b] rounded-full text-xs font-semibold">
                          {card.match} match
                        </span>
                      </div>
                      <div className="h-2.5 skeleton-bar rounded-full w-3/4 mb-2"></div>
                      <div className="h-2.5 skeleton-bar rounded-full w-1/2 mb-3"></div>
                      <span className="inline-block px-2 py-0.5 bg-white/10 rounded-full text-xs text-[#ffb3d0]">
                        ✓ Verified
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <div className="intro-body">
        {/* Infinite marquee of what Saakhi does */}
        <section className="py-5 bg-[#2a0620]/95 border-y border-white/10 overflow-hidden marquee-wrap">
          <div className="marquee-track gap-3">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className="px-4 py-1.5 bg-white/5 border border-white/15 rounded-full text-sm text-[#ffe3ef] whitespace-nowrap"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* KPI band — mirror hall + slipstream + cascade */}
        <section className="py-20 px-6 md:px-10 bg-[#150312]/95">
          <div className="w-full max-w-[1400px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
              {[
                { value: 9, suffix: '', label: 'Lifestyle questions', icon: '🧩' },
                { value: 100, suffix: '%', label: 'Women-only', icon: '👩' },
                { value: 0, prefix: '₹', suffix: '', label: 'Cost, forever', icon: '💸' },
                { value: 24, suffix: '/7', label: 'Private chat', icon: '💬' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 40, rotateX: 18 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.7, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -10, scale: 1.03 }}
                  className="kpi-mirror"
                  style={{ perspective: 1000 }}
                >
                  <div className="kpi-slipstream kpi-cascade glass-card accent-top p-6 text-center relative">
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-4xl md:text-5xl font-bold text-gradient-animated">
                      <CountUp to={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-[#ffb3d0] mt-2">{stat.label}</div>
                  </div>
                  {/* reflection copy */}
                  <div className="kpi-reflection glass-card p-6 text-center" aria-hidden="true">
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-4xl md:text-5xl font-bold text-[#ff7ab0]">
                      {stat.prefix || ''}{stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm text-[#ffb3d0] mt-2">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-20 bg-[#22061d]/95 scroll-mt-16 overflow-hidden">
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#ff2d6b]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#ff2d6b]/40 rounded-full text-[#ffb3d0] text-sm font-medium mb-4">Features</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose Saakhi?</h2>
              <p className="text-lg text-[#ffb3d0] max-w-2xl mx-auto mt-3">
                Everything you need to find a roommate you'll actually get along with
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[
                {
                  icon: '🛡️',
                  title: 'Safe Community',
                  description: 'A women-only space where every member signs in with a verified email — no strangers browsing your profile.',
                  bullets: ['Women-only by design', 'Profiles hidden from the public', 'Report & block in one tap'],
                  glow: '#ff2d6b',
                },
                {
                  icon: '🤝',
                  title: 'Perfect Match',
                  description: 'Nine lifestyle questions turn into a compatibility score, so you see who actually fits before you talk.',
                  bullets: ['Sleep, cleanliness & food match', 'Score explained line by line', 'Filter by city and budget'],
                  glow: '#ffd36b',
                },
                {
                  icon: '💬',
                  title: 'Easy Communication',
                  description: 'Chat in real time, break the ice with prompts, and schedule a room visit without sharing your number.',
                  bullets: ['Instant private chat', 'Icebreaker questions', 'Schedule room visits'],
                  glow: '#ff7ab0',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.12 }}
                  className="h-full"
                >
                  <TiltCard className="feature-card glass-card p-7 h-full group relative overflow-hidden">
                    {/* accent glow that blooms on hover */}
                    <div
                      className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                      style={{ background: feature.glow }}
                    />

                    <div className="relative" style={{ transform: 'translateZ(45px)' }}>
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.55 }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-xl"
                        style={{
                          background: `linear-gradient(140deg, ${feature.glow}, #6a0a2a)`,
                          boxShadow: `0 12px 32px -10px ${feature.glow}`,
                        }}
                      >
                        {feature.icon}
                      </motion.div>
                    </div>

                    <h3
                      className="text-2xl font-semibold text-white mb-2"
                      style={{ transform: 'translateZ(28px)' }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-[#ffe3ef]/85 leading-relaxed mb-4" style={{ transform: 'translateZ(18px)' }}>
                      {feature.description}
                    </p>

                    <ul className="space-y-2 pt-4 border-t border-white/10" style={{ transform: 'translateZ(12px)' }}>
                      {feature.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-[#ffb3d0]">
                          <span style={{ color: feature.glow }} className="mt-px">✦</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 scroll-mt-16 bg-[#150312]/95">
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#ff2d6b]/40 rounded-full text-[#ffb3d0] text-sm font-medium mb-4">Process</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
              <p className="text-lg text-[#ffb3d0] max-w-2xl mx-auto mt-3">
                Finding your perfect roommate is just a few simple steps away
              </p>
            </motion.div>
            
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* connecting line that draws itself on scroll */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="hidden md:block absolute top-6 left-[12%] right-[12%] h-0.5 origin-left bg-gradient-to-r from-[#ff2d6b] via-[#ffd36b] to-[#ff2d6b] opacity-70"
              />
              {[
                {
                  step: "1",
                  title: "Create Profile",
                  description: "Sign up and tell us about your lifestyle, preferences, and roommate expectations."
                },
                {
                  step: "2",
                  title: "Get Matched",
                  description: "Our algorithm finds potential roommates who match your compatibility criteria."
                },
                {
                  step: "3",
                  title: "Connect",
                  description: "Chat with your matches to learn more about each other and see if you click."
                },
                {
                  step: "4",
                  title: "Move In",
                  description: "Finalize your roommate choice and start your harmonious living experience."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0, margin: '0px 0px -40px 0px' }}
                  transition={{ duration: 0.5, delay: 0.25 + index * 0.15, ease: 'easeOut' }}
                  whileHover={{ y: -8 }}
                  className="glass-card glow-hover px-6 pb-6 pt-10 text-center relative mt-6"
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.35 + index * 0.15 }}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6a0a2a] to-[#ff2d6b] border border-[#ffb3d0]/40 flex items-center justify-center text-white font-bold shadow-lg"
                    >
                      {item.step}
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mt-4 mb-2">{item.title}</h3>
                  <p className="text-[#ffe3ef]">{item.description}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <MagneticButton onClick={() => navigate('/register')} className="sakhi-button-primary text-lg px-8 py-3">
                Start Your Journey →
              </MagneticButton>
            </div>
          </div>
        </section>
        
        {/* About Section */}
        <section id="about" className="relative py-20 bg-[#22061d]/95 scroll-mt-16 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffb3d0]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#ff2d6b]/40 rounded-full text-[#ffb3d0] text-sm font-medium mb-4">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">About Saakhi</h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-[#ffe3ef] mb-6">
                  Saakhi is India's first AI-powered roommate matching platform exclusively for women. 
                  We understand the challenges women face in finding safe, compatible living arrangements.
                </p>
                <p className="text-lg text-[#ffe3ef] mb-6">
                  Our mission is to create a trustworthy community where women can find roommates 
                  who match their lifestyle, preferences, and personalities.
                </p>
                <p className="text-lg text-[#ffe3ef]">
                  With advanced algorithms and a focus on safety, we're revolutionizing how women 
                  find their perfect roommates and creating harmonious living situations.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-[#ff2d6b]/30">
                <h3 className="text-xl font-semibold text-white mb-4">Our Commitment</h3>
                <ul className="space-y-3">
                  {[
                    "Safety and security for all users",
                    "Verification of all profiles",
                    "Privacy protection for sensitive information",
                    "Compatibility-focused matching algorithm",
                    "Supportive community of women"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="text-[#ffb3d0] mr-2">✓</div>
                      <span className="text-[#ffe3ef]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="py-20 scroll-mt-16 bg-[#150312]/95">
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 max-w-3xl">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#ff2d6b]/40 rounded-full text-[#ffb3d0] text-sm font-medium mb-4">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-lg text-[#ffb3d0] mt-3">Everything you might be wondering about Saakhi</p>
            </motion.div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                  className="sakhi-card glow-hover overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between text-left px-5 py-4"
                  >
                    <span className="text-white font-medium pr-4">{faq.q}</span>
                    <motion.span
                      animate={{ rotate: openFaq === index ? 135 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[#ffb3d0] text-2xl leading-none flex-shrink-0"
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-[#ffe3ef]">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#150312]/95">
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10">
            <motion.div
              {...fadeUp}
              className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-[#2a0620] to-[#6a0a2a] border border-[#ff2d6b]/40 px-6 py-14 shadow-2xl"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Perfect Roommate?</h2>
              <p className="text-xl text-[#ffe3ef] mb-8 max-w-2xl mx-auto">
                Join Saakhi today and start your journey to harmonious co-living.
              </p>
              <MagneticButton
                onClick={() => navigate('/register')}
                className="sakhi-button-primary text-lg px-8 py-3 shadow-xl shadow-[#12030f]/40"
              >
                Get Started Now →
              </MagneticButton>
              <p className="text-sm text-[#ffb3d0] mt-4">Free forever · No credit card needed</p>
            </motion.div>
          </div>
        </section>
        </div>
      </main>

      <Footer />
      </div>
    </div>
  );
};

export default Landing;
