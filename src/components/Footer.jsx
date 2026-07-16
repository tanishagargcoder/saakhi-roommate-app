import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#283593]/50 backdrop-blur-md pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">
              <span className="text-[#c5cae9]">Sakhi</span>
            </h2>
            <p className="text-[#e8eaf6]">
              Finding your perfect roommate has never been easier. Trust Sakhi for safe, compatible matches.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-[#c5cae9] hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="text-[#c5cae9] hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="text-[#c5cae9] hover:text-white transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-[#c5cae9] hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#c5cae9] hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:tanishagarg1208@gmail.com"
                  className="text-[#c5cae9] hover:text-white transition-colors"
                >
                  Email Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-[#c5cae9]">
            © {new Date().getFullYear()} Sakhi. All rights reserved. Created by Tanisha.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
