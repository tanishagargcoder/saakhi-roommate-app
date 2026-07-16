import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Footer } from './components';

const FAQS = [
  {
    q: 'Is Sakhi really women-only?',
    a: 'Yes. Sakhi is built exclusively for women looking for female roommates, so you can search with confidence and peace of mind.'
  },
  {
    q: 'Is Sakhi free to use?',
    a: 'Completely free. Creating a profile, getting matched, and chatting with potential roommates costs nothing.'
  },
  {
    q: 'How does matching work?',
    a: 'You answer three quick lifestyle questions — sleep schedule, cleanliness, and social energy. Sakhi compares your answers with other members and shows you a compatibility score for each one.'
  },
  {
    q: 'Is my personal information safe?',
    a: 'Your profile is visible only to signed-in Sakhi members, never publicly. Chats are private between you and your match, and we never share your email or details with anyone.'
  },
  {
    q: 'How do I talk to a match?',
    a: 'Every match card has a Message button — it opens a private real-time chat right inside Sakhi, so you never have to share your phone number until you are ready.'
  }
];

const Landing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#283593] via-[#3949ab] to-[#5c6bc0] text-white">
      <NavBar />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-[#e8eaf6] text-sm font-medium mb-6">
              🏠 India's women-only roommate finder
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Find Your Perfect <span className="text-[#c5cae9]">Roommate</span>
            </h1>
            <p className="text-xl text-[#e8eaf6] mb-8 max-w-2xl mx-auto">
              Sakhi helps women find compatible roommates based on lifestyle preferences, making shared living safer and more harmonious.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register')}
                className="sakhi-button-primary"
              >
                Get Started
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="sakhi-button-secondary"
              >
                Learn More
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-8 text-sm text-[#c5cae9]">
              <span>🛡️ Verified profiles</span>
              <span>👩 Women-only community</span>
              <span>🔒 Privacy first</span>
            </div>
          </div>

          <div className="w-full max-w-4xl animate-float">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#ef9a9a]"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffe082]"></span>
                <span className="w-3 h-3 rounded-full bg-[#a5d6a7]"></span>
                <div className="ml-4 flex-1 max-w-xs px-3 py-1 bg-white/10 rounded-full text-xs text-[#c5cae9] text-center">
                  sakhi.app/matches
                </div>
              </div>

              {/* Mock app content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-white font-semibold">Your Top Matches</div>
                    <div className="text-xs text-[#c5cae9]">Based on lifestyle & preferences</div>
                  </div>
                  <div className="px-3 py-1 bg-[#7986cb]/40 rounded-full text-xs text-[#e8eaf6]">3 new today</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { initial: 'A', match: '95%', from: '#7986cb', to: '#3949ab' },
                    { initial: 'P', match: '91%', from: '#9fa8da', to: '#5c6bc0' },
                    { initial: 'R', match: '88%', from: '#c5cae9', to: '#7986cb' }
                  ].map((card, index) => (
                    <div key={index} className="bg-white/10 rounded-xl border border-white/10 p-4">
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
                      <div className="h-2.5 bg-white/20 rounded-full w-3/4 mb-2"></div>
                      <div className="h-2.5 bg-white/10 rounded-full w-1/2 mb-3"></div>
                      <span className="inline-block px-2 py-0.5 bg-white/10 rounded-full text-xs text-[#c5cae9]">
                        ✓ Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights strip */}
        <section className="py-6 bg-[#283593]/60 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-[#e8eaf6] font-medium">
              <span>👩 100% Women-only</span>
              <span>💸 Free to use</span>
              <span>💬 Real-time private chat</span>
              <span>🔒 Privacy-first profiles</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-[#3949ab]/50 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">Why Choose Sakhi?</h2>
              <div className="w-20 h-1 bg-[#c5cae9] mx-auto mt-4"></div>
            </div>
            
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
                <div 
                  key={index}
                  className="sakhi-card p-6 text-center"
                >
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#e8eaf6]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">How It Works</h2>
              <div className="w-20 h-1 bg-[#c5cae9] mx-auto mt-4"></div>
              <p className="text-lg text-[#e8eaf6] max-w-2xl mx-auto mt-4">
                Finding your perfect roommate is just a few simple steps away
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div key={index} className="sakhi-card p-6 text-center relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-10 h-10 rounded-full bg-[#7986cb] flex items-center justify-center text-white font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mt-4 mb-2">{item.title}</h3>
                  <p className="text-[#e8eaf6]">{item.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <button onClick={() => navigate('/register')} className="sakhi-button-primary">
                Start Your Journey
              </button>
            </div>
          </div>
        </section>
        
        {/* About Section */}
        <section id="about" className="py-16 bg-[#3949ab]/50 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">About Sakhi</h2>
              <div className="w-20 h-1 bg-[#c5cae9] mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-[#e8eaf6] mb-6">
                  Sakhi is India's first AI-powered roommate matching platform exclusively for women. 
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
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
              <div className="w-20 h-1 bg-[#c5cae9] mx-auto mt-4"></div>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => (
                <div key={index} className="sakhi-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between text-left px-5 py-4"
                  >
                    <span className="text-white font-medium pr-4">{faq.q}</span>
                    <span className="text-[#c5cae9] text-xl flex-shrink-0">
                      {openFaq === index ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === index && (
                    <p className="px-5 pb-4 text-[#e8eaf6]">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#283593]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Find Your Perfect Roommate?</h2>
            <p className="text-xl text-[#e8eaf6] mb-8 max-w-2xl mx-auto">
              Join Sakhi today and start your journey to harmonious co-living.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="sakhi-button-primary text-lg px-8 py-3"
            >
              Get Started Now
            </button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
