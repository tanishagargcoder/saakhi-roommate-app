import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NavBar, Footer, ScrollProgress, CursorGlow, TiltCard, MagneticButton, CountUp, RevealWords, RotatingWord
} from './components';

const MARQUEE_ITEMS = [
  '🛡️ Verified profiles', '🌙 Sleep schedule match', '🧹 Cleanliness match', '🥗 Food preference',
  '💬 Real-time chat', '🏠 Room listings', '💰 Rent split calculator', '📅 Visit scheduling',
  '⭐ Roommate reviews', '📄 Agreement generator', '🚭 Smoking preference', '🐾 Pet friendly',
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#283593] via-[#3949ab] to-[#5c6bc0] text-white overflow-x-hidden">
      <ScrollProgress />
      <NavBar />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden container mx-auto px-4 py-16 flex flex-col items-center">
          <CursorGlow />
          <div className="aurora -top-32 -left-32 w-[420px] h-[420px] bg-[#7986cb]/40 pointer-events-none"></div>
          <div className="aurora top-40 -right-24 w-[380px] h-[380px] bg-[#c5cae9]/25 pointer-events-none" style={{ animationDelay: '-7s' }}></div>
          <div className="aurora bottom-0 left-1/3 w-[340px] h-[340px] bg-[#5c6bc0]/35 pointer-events-none" style={{ animationDelay: '-14s' }}></div>

          <div className="relative z-10 text-center max-w-4xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-[#e8eaf6] text-sm font-medium mb-6 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#a5d6a7] pulse-dot"></span>
              India's women-only roommate finder
            </motion.span>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <RevealWords text="Find Your Perfect" />
              <br />
              <span className="text-gradient-animated">
                <RevealWords text="Roommate" delay={0.3} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl text-[#e8eaf6] mb-2 max-w-2xl mx-auto"
            >
              Saakhi helps women find compatible roommates based on lifestyle preferences, making shared living safer and more harmonious.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.6 }}
              className="text-lg text-[#c5cae9] mb-8"
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
              transition={{ delay: 0.85, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <MagneticButton
                onClick={() => navigate('/register')}
                className="sakhi-button-primary text-lg px-8 py-3 shadow-xl shadow-[#1a237e]/40"
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
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-8 text-sm text-[#c5cae9]"
            >
              <span>🛡️ Verified profiles</span>
              <span>👩 Women-only community</span>
              <span>🔒 Privacy first</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-4xl animate-float"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#ef9a9a]"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffe082]"></span>
                <span className="w-3 h-3 rounded-full bg-[#a5d6a7]"></span>
                <div className="ml-4 flex-1 max-w-xs px-3 py-1 bg-white/10 rounded-full text-xs text-[#c5cae9] text-center">
                  saakhi.app/matches
                </div>
              </div>

              {/* Mock app content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-white font-semibold">Your Top Matches</div>
                    <div className="text-xs text-[#c5cae9]">Based on lifestyle & preferences</div>
                  </div>
                  <div className="px-3 py-1 bg-[#7986cb]/40 rounded-full text-xs text-[#e8eaf6] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a5d6a7] pulse-dot"></span> 3 new today
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { initial: 'A', match: '95%', from: '#7986cb', to: '#3949ab' },
                    { initial: 'P', match: '91%', from: '#9fa8da', to: '#5c6bc0' },
                    { initial: 'R', match: '88%', from: '#c5cae9', to: '#7986cb' }
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
                        <span className="px-2 py-0.5 bg-[#a5d6a7]/20 text-[#a5d6a7] rounded-full text-xs font-semibold">
                          {card.match} match
                        </span>
                      </div>
                      <div className="h-2.5 skeleton-bar rounded-full w-3/4 mb-2"></div>
                      <div className="h-2.5 skeleton-bar rounded-full w-1/2 mb-3"></div>
                      <span className="inline-block px-2 py-0.5 bg-white/10 rounded-full text-xs text-[#c5cae9]">
                        ✓ Verified
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Infinite marquee of what Saakhi does */}
        <section className="py-5 bg-[#283593]/60 border-y border-white/10 overflow-hidden marquee-wrap">
          <div className="marquee-track gap-3">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className="px-4 py-1.5 bg-white/5 border border-white/15 rounded-full text-sm text-[#e8eaf6] whitespace-nowrap"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Stats band with counters */}
        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: 9, suffix: '', label: 'Lifestyle questions' },
                { value: 100, suffix: '%', label: 'Women-only' },
                { value: 0, prefix: '₹', suffix: '', label: 'Cost, forever' },
                { value: 24, suffix: '/7', label: 'Private chat' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                  className="sakhi-card glow-hover p-5 text-center"
                >
                  <div className="text-4xl font-bold text-gradient-animated">
                    <CountUp to={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-[#c5cae9] mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-16 bg-[#3949ab]/50 bg-dots scroll-mt-16 overflow-hidden">
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#7986cb]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="container mx-auto px-4">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#7986cb]/40 rounded-full text-[#c5cae9] text-sm font-medium mb-4">Features</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose Saakhi?</h2>
              <p className="text-lg text-[#c5cae9] max-w-2xl mx-auto mt-3">
                Everything you need to find a roommate you'll actually get along with
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🛡️",
                  title: "Safe Community",
                  description: "Women-only community with verified profiles for your peace of mind."
                },
                {
                  icon: "🤝",
                  title: "Perfect Match",
                  description: "Our algorithm matches you with compatible roommates based on your preferences."
                },
                {
                  icon: "💬",
                  title: "Easy Communication",
                  description: "Connect and coordinate with potential roommates in real-time."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.12 }}
                >
                  <TiltCard className="sakhi-card shine-card glow-hover p-6 text-center h-full">
                    <motion.div
                      whileHover={{ rotate: [0, -12, 12, 0], scale: 1.12 }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#3949ab] to-[#7986cb] flex items-center justify-center text-3xl mb-4 shadow-lg"
                      style={{ transform: 'translateZ(40px)' }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2" style={{ transform: 'translateZ(25px)' }}>
                      {feature.title}
                    </h3>
                    <p className="text-[#e8eaf6]" style={{ transform: 'translateZ(15px)' }}>
                      {feature.description}
                    </p>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 scroll-mt-16">
          <div className="container mx-auto px-4">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#7986cb]/40 rounded-full text-[#c5cae9] text-sm font-medium mb-4">Process</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
              <p className="text-lg text-[#c5cae9] max-w-2xl mx-auto mt-3">
                Finding your perfect roommate is just a few simple steps away
              </p>
            </motion.div>
            
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* connecting line that draws itself on scroll */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="hidden md:block absolute top-0 left-[12%] right-[12%] h-0.5 origin-left bg-gradient-to-r from-[#7986cb] via-[#c5cae9] to-[#7986cb]"
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
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: 0.25 + index * 0.15, ease: 'easeOut' }}
                  whileHover={{ y: -8 }}
                  className="sakhi-card shine-card glow-hover p-6 text-center relative"
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.35 + index * 0.15 }}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3949ab] to-[#7986cb] border border-[#c5cae9]/40 flex items-center justify-center text-white font-bold shadow-lg"
                    >
                      {item.step}
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mt-4 mb-2">{item.title}</h3>
                  <p className="text-[#e8eaf6]">{item.description}</p>
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
        <section id="about" className="relative py-16 bg-[#3949ab]/50 bg-dots scroll-mt-16 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#c5cae9]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="container mx-auto px-4">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#7986cb]/40 rounded-full text-[#c5cae9] text-sm font-medium mb-4">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">About Saakhi</h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-[#e8eaf6] mb-6">
                  Saakhi is India's first AI-powered roommate matching platform exclusively for women. 
                  We understand the challenges women face in finding safe, compatible living arrangements.
                </p>
                <p className="text-lg text-[#e8eaf6] mb-6">
                  Our mission is to create a trustworthy community where women can find roommates 
                  who match their lifestyle, preferences, and personalities.
                </p>
                <p className="text-lg text-[#e8eaf6]">
                  With advanced algorithms and a focus on safety, we're revolutionizing how women 
                  find their perfect roommates and creating harmonious living situations.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-[#7986cb]/30">
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
                      <div className="text-[#c5cae9] mr-2">✓</div>
                      <span className="text-[#e8eaf6]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="py-16 scroll-mt-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#7986cb]/40 rounded-full text-[#c5cae9] text-sm font-medium mb-4">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-lg text-[#c5cae9] mt-3">Everything you might be wondering about Saakhi</p>
            </motion.div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
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
                      className="text-[#c5cae9] text-2xl leading-none flex-shrink-0"
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
                        <p className="px-5 pb-4 text-[#e8eaf6]">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              {...fadeUp}
              className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-[#283593] to-[#3949ab] border border-[#7986cb]/40 px-6 py-14 shadow-2xl"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Perfect Roommate?</h2>
              <p className="text-xl text-[#e8eaf6] mb-8 max-w-2xl mx-auto">
                Join Saakhi today and start your journey to harmonious co-living.
              </p>
              <MagneticButton
                onClick={() => navigate('/register')}
                className="sakhi-button-primary text-lg px-8 py-3 shadow-xl shadow-[#1a237e]/40"
              >
                Get Started Now →
              </MagneticButton>
              <p className="text-sm text-[#c5cae9] mt-4">Free forever · No credit card needed</p>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
