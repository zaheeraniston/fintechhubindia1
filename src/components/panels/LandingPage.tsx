'use client';

import { useState, useEffect, useRef } from 'react';
import { ParticleBackground } from '@/components/panels/ParticleBackground';
import { useAppStore } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Menu,
  X,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  DollarSign,
  Briefcase,
  ChevronDown,
  ShieldCheck,
  Zap,
  Play,
  ArrowUpRight,
  BookOpen,
  Wallet,
  Star,
  MessageSquare,
  Lock,
} from 'lucide-react';

// Custom CountUp Component using requestAnimationFrame and IntersectionObserver
function CountUp({ end, duration = 1500, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressPercentage = Math.min(progress / duration, 1);
      
      // Easing out function
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progressPercentage);
      
      setCount(Math.floor(easedProgress * end));
      if (progressPercentage < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [hasAnimated, end, duration]);

  return (
    <div ref={elementRef} className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-mono tracking-tight">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// Custom Typewriter Text Component
function TypewriterText({ words }: { words: string[] }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const activeWord = words[currentWordIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && currentText === activeWord) {
      timer = setTimeout(() => setIsDeleting(true), 1500);
    } else if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    } else {
      timer = setTimeout(() => {
        setCurrentText((prev) =>
          isDeleting
            ? prev.substring(0, prev.length - 1)
            : activeWord.substring(0, prev.length + 1)
        );
      }, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className="typewriter-cursor text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 font-extrabold">
      {currentText}
    </span>
  );
}

// FAQ Accordion Item Component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-3 text-slate-200 hover:text-white font-semibold transition-colors"
      >
        <span className="text-sm sm:text-base pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-400' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed pt-1 pb-4 font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingPage() {
  const { setPage } = useAppStore();
  const { settings } = useSettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const founderName = settings.founderName || 'Mr. Saif Khan';
  const founderPhoto = settings.founderPhoto || '/founder.png';
  const whatsappLink = settings.whatsappLink || 'https://wa.me/919462547328';

  const courses = [
    {
      title: 'Affiliate Marketing Mastery',
      description: 'Learn to promote premium financial services and fintech products to earn high-margin direct commissions.',
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      tag: 'Popular',
    },
    {
      title: 'Referral Rewards Network',
      description: 'Build your own downline network. Earn commission on direct referrals and passive team commissions.',
      icon: <Users className="w-6 h-6 text-violet-400" />,
      tag: 'Highly Profitable',
    },
    {
      title: 'Digital Branding Academy',
      description: 'Master personal branding, content creation, and social media growth to scale your reach effortlessly.',
      icon: <Award className="w-6 h-6 text-amber-400" />,
      tag: 'Best Value',
    },
    {
      title: 'Task Income & Micro-gigs',
      description: 'Earn instantly by completing daily micro-tasks and direct activations on the Fintech Hub portal.',
      icon: <Briefcase className="w-6 h-6 text-fuchsia-400" />,
      tag: 'Daily Payout',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Quick Register (Free)',
      desc: 'Create your account instantly with zero upfront costs. Gain immediate access to the earning panel.',
      icon: <Lock className="w-5 h-5 text-violet-400" />,
    },
    {
      num: '02',
      title: 'Learn Marketing Secrets',
      desc: 'Go through our step-by-step videos. Learn personal branding and traffic acquisition.',
      icon: <BookOpen className="w-5 h-5 text-fuchsia-400" />,
    },
    {
      num: '03',
      title: 'Share Financial Links',
      desc: 'Activate premium financial tools, share links with your downline, and watch rewards compile.',
      icon: <ArrowUpRight className="w-5 h-5 text-emerald-400" />,
    },
    {
      num: '04',
      title: 'Withdraw Daily Payouts',
      desc: 'Get your commission directly in your bank account via UPI or Bank Transfer with instant approvals.',
      icon: <Wallet className="w-5 h-5 text-amber-400" />,
    },
  ];

  const testimonials = [
    {
      name: 'Aarav Sharma',
      role: 'College Student, Delhi',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      text: 'I was skeptical at first, but with Zero Investment, I learned affiliate marketing here and earned over ₹45,000 in my first month! Payouts are super fast.',
      earnings: '₹45k+ Earned',
    },
    {
      name: 'Priya Patel',
      role: 'Homemaker, Ahmedabad',
      img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      text: 'Managing family and finding time was hard, but Fintech Hub\'s easy tasks let me work 2 hours daily from home. Highly recommend the support team!',
      earnings: '₹28k+ Earned',
    },
    {
      name: 'Rahul Verma',
      role: 'Sales Professional, Noida',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      text: 'The referral network is amazing. I built a team of 40 active earners and now earn passive team commissions daily. Saif sir\'s guidance is top-class!',
      earnings: '₹95k+ Earned',
    },
  ];

  const faqs = [
    {
      q: 'Is there any investment required to start earning?',
      a: 'No, there is absolutely zero upfront investment required. You can register, learn, generate links, and start earning commission entirely for free.',
    },
    {
      q: 'How do I receive my earnings?',
      a: 'All earned commissions can be requested from the payouts section. We process withdrawals daily directly to your Bank Account or UPI ID within a few hours.',
    },
    {
      q: 'Can I do this alongside my college studies or main job?',
      a: 'Absolutely. The platform is designed for flexible hours. You can work 1-2 hours daily from your smartphone at your own convenience.',
    },
    {
      q: 'What training support will I get?',
      a: 'We offer structured course videos directly inside your dashboard. Additionally, you get direct access to official WhatsApp and Telegram support channels for live guidance.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* ✨ Premium Canvas Particle Animation Background */}
      <ParticleBackground />

      {/* Header/Nav */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo with actual logo.png image */}
          <div className="flex items-center">
            <button 
              onClick={() => setPage('landing')} 
              className="h-16 w-auto flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <img src="/logo.png" alt="FINTECH HUB INDIA logo" className="h-14 w-auto object-contain" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">About Us</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">How It Works</a>
            <a href="#courses" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Opportunities</a>
            <a href="#founder" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Founder</a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Support</a>
          </nav>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-4">
            {/* Currency selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all"
              >
                <span>₹ IND</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-28 rounded-lg bg-slate-900 border border-white/10 shadow-xl overflow-hidden py-1">
                  <button className="w-full text-left px-3 py-1.5 text-xs text-white bg-violet-600/30 hover:bg-violet-600/50 font-semibold">₹ INR</button>
                  <button className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 font-semibold">$ USD</button>
                </div>
              )}
            </div>

            {/* Glowing CTA Button */}
            <Button
              onClick={() => setPage('login')}
              className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white font-bold text-sm tracking-wide px-6 py-5 rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] btn-ripple"
            >
              Start Earning
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-black text-slate-200 select-none shadow-lg">
              <span>₹ IND</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-slate-950 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-3">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5"
                >
                  About Us
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5"
                >
                  How It Works
                </a>
                <a
                  href="#courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5"
                >
                  Opportunities
                </a>
                <a
                  href="#founder"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5"
                >
                  Founder
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5"
                >
                  Support
                </a>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPage('login');
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-base py-6 rounded-xl shadow-lg"
                  >
                    Start Earning
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Detail */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 animate-slide-up order-2 lg:order-1">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-black uppercase tracking-wider animate-badge-float">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              India's Premier Earning Platform
            </div>

            {/* Giant Title with Typewriter */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              Where Your Potential Meets True{' '}<br className="hidden sm:inline" />
              <TypewriterText words={['Possibility', 'Digital Growth', 'Financial Freedom', 'Skill Mastery']} />
            </h1>

            {/* Paragraph Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Explore high-impact digital programs. Master in-demand referral rewards, build your strong downline, and unlock real financial freedom with zero upfront investment.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-6 py-4 text-sm font-black text-slate-300 hover:text-white transition-colors"
              >
                Explore How It Works &rarr;
              </a>
            </div>

            {/* Social Proof */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="user avatar" />
                <img className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="user avatar" />
                <img className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="user avatar" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-white text-sm font-black tracking-wide flex items-center gap-1.5 justify-center sm:justify-start">
                  50k+ Active Earners
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-glow-dot text-emerald-400" />
                </p>
                <p className="text-slate-400 text-xs font-semibold">Join the fastest-growing fintech network in India</p>
              </div>
            </div>
          </div>

          {/* Right Visual Image — shows FIRST on mobile (order-1), right side on desktop (order-2) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative order-1 lg:order-2 gap-6 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative w-full max-w-md aspect-square rounded-[3rem] overflow-visible glass-premium border border-white/10 shadow-2xl p-3 hero-image-tilt"
            >
              {/* Highlight backdrop glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-fuchsia-500/10 to-transparent opacity-60 rounded-[3rem]" />
              
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden">
                <img
                  src="/hero-boy.png"
                  alt="Fintech Leadership Boy Graphic"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 50k+ Active Users Overlay Badge (Top Right) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute top-8 right-[-10px] bg-slate-950/90 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl z-20 flex flex-col gap-1 select-none"
              >
                <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap">50k+ Active Users</span>
                <div className="flex -space-x-1.5 mt-1">
                  <img className="w-5 h-5 rounded-full border border-slate-950 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="user" />
                  <img className="w-5 h-5 rounded-full border border-slate-950 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="user" />
                  <img className="w-5 h-5 rounded-full border border-slate-950 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="user" />
                </div>
              </motion.div>

              {/* Bottom Overlay Platform Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2 select-none whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-200">India's Top Earning Platform</span>
              </motion.div>
            </motion.div>

            {/* Start Earning Now Button below the photo */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-full max-w-md px-4"
            >
              <button
                onClick={() => setPage('login')}
                className="group relative flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-black text-lg tracking-wide shadow-xl shadow-red-500/25 hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer w-full btn-ripple"
              >
                <span>Start Earning Now</span>
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-red-500 group-hover:translate-x-1.5 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </span>
              </button>
            </motion.div>
          </div>

        </div>
      </section>
      <div className="w-full bg-slate-900 border-y border-white/5 py-4 overflow-hidden relative z-10">
        <div className="flex w-[200%] animate-marquee whitespace-nowrap text-slate-400 text-xs font-bold tracking-widest uppercase items-center gap-16">
          <div className="flex justify-around w-full items-center gap-8 shrink-0">
            <span>✨ 100% SECURE NETWORK</span>
            <span>💎 NO UPFRONT INVESTMENT</span>
            <span>⚡ DEDICATED DAILY PAYOUTS</span>
            <span>🔥 24/7 WHATSAPP & TELEGRAM SUPPORT</span>
            <span>🎓 CERTIFIED FINANCIAL COURSES</span>
            <span>🚀 COMBO ACTIVE & PASSIVE COMMISSIONS</span>
          </div>
          <div className="flex justify-around w-full items-center gap-8 shrink-0">
            <span>✨ 100% SECURE NETWORK</span>
            <span>💎 NO UPFRONT INVESTMENT</span>
            <span>⚡ DEDICATED DAILY PAYOUTS</span>
            <span>🔥 24/7 WHATSAPP & TELEGRAM SUPPORT</span>
            <span>🎓 CERTIFIED FINANCIAL COURSES</span>
            <span>🚀 COMBO ACTIVE & PASSIVE COMMISSIONS</span>
          </div>
        </div>
      </div>

      {/* Statistics Section with CountUp Animations */}
      <section className="border-b border-white/5 bg-slate-950/40 backdrop-blur-sm py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-1">
              <CountUp end={50000} prefix="" suffix="+" />
              <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                Active Learners & Earners
              </p>
            </div>
            <div className="text-center space-y-1">
              <CountUp end={50000000} prefix="₹" suffix="+" />
              <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                Distributed Commissions
              </p>
            </div>
            <div className="text-center space-y-1">
              <CountUp end={0} prefix="" suffix="/-" />
              <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                Required Investment
              </p>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-mono tracking-tight">
                24/7
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                Dedicated Support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Without Investment Highlight Card Section */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] p-[2px] bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.15)] no-investment-banner"
        >
          <div className="h-full w-full rounded-[2.45rem] bg-slate-950/95 backdrop-blur-xl p-8 sm:p-10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full animate-badge-float">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Zero Risk Model
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  WITHOUT <span className="shimmer-text">INVESTMENT</span> WORK
                </h2>
                <p className="text-slate-300 text-base max-w-xl font-medium leading-relaxed">
                  Start working immediately with zero fees. We provide complete training, ready-to-share links, and dynamic tracking dashboards to start earning passive income today!
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  onClick={() => setPage('login')}
                  className="w-full md:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-black text-lg tracking-wide shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer btn-ripple"
                >
                  Start Now (Free)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it Works Timeline Section */}
      <section id="how-it-works" className="py-20 relative border-t border-white/5 bg-slate-950/30 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase tracking-widest">
              Simple 4-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              HOW FINTECH HUB WORKS
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              We have optimized the earning pipeline so you can start generating daily rewards in just a few clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative p-6 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-violet-500/20 transition-all duration-300 flex flex-col justify-between h-full group glow-card hover:translate-y-[-4px]"
              >
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="text-3xl font-black font-mono text-white/10 group-hover:text-violet-500/30 transition-colors">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses / Opportunities Section */}
      <section id="courses" className="py-20 relative border-t border-white/5 bg-slate-950/20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-black uppercase tracking-widest">
              Welcome to Fintech Hub India
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              OUR INCOME COURSES & OPPORTUNITIES
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Explore curated skill academies and high-converting channels to generate multiple daily revenue streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {courses.map((course, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card
                  className="glass-premium border border-white/10 hover:border-violet-500/40 shadow-xl rounded-3xl overflow-hidden transition-all duration-300 card-hover-3d group cursor-pointer"
                  onClick={() => setPage('login')}
                >
                  <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      {course.icon}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors">
                          {course.title}
                        </h3>
                        <span className="text-[9px] font-black tracking-widest uppercase bg-white/5 text-slate-300 px-2.5 py-1 rounded-full">
                          {course.tag}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative border-t border-white/5 bg-slate-950/40 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
              Success Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              COMMUNITY FEEDBACK
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Read how thousands of learners are transforming their smartphones into active earning panels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/30 border border-white/5 hover:border-violet-500/20 hover:bg-slate-900/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm italic leading-relaxed font-medium">
                    "{test.text}"
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-white/5 mt-6">
                  <img src={test.img} alt={test.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{test.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{test.role}</p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
                    {test.earnings}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our VIP Members Section */}
      <section className="py-20 relative border-t border-white/5 bg-slate-950/40 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest animate-badge-float">
              ⭐ Premium Earners Club
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MEET OUR VIP MEMBERS
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Celebrating our top performers who have crossed the milestone of 10 Lakhs+ in earnings through dedication and skill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'PRADEEP NAIK',
                state: 'KARNATAKA',
                earnings: '₹28,45,000+',
                img: '/vip-pradeep.jpg',
              },
              {
                name: 'SAMEER KHAN',
                state: 'JHUNJHUNU, RAJASTHAN',
                earnings: '₹24,80,000+',
                img: '/vip-sameer.jpg',
              },
              {
                name: 'BABALU KHAN',
                state: 'RAJASTHAN',
                earnings: '₹21,65,000+',
                img: '/vip-babalu.jpg',
              },
              {
                name: 'SHADAB AKHTAR',
                state: 'KOLKATA, WEST BENGAL',
                earnings: '₹31,40,000+',
                img: '/vip-shadab.jpg',
              },
              {
                name: 'SIMRAN ARORA',
                state: 'AMRITSAR, PUNJAB',
                earnings: '₹23,10,000+',
                img: '/vip-simran.jpg',
              },
              {
                name: 'MR. SURJEET SINGH',
                state: 'RAJASTHAN',
                earnings: '₹26,90,000+',
                img: '/vip-surjeet.jpg',
              },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative overflow-hidden rounded-[2.5rem] p-[1px] bg-gradient-to-b from-amber-500/30 via-white/5 to-white/5 hover:from-amber-400/60 transition-all duration-500 group"
              >
                <div className="h-full rounded-[2.45rem] bg-slate-950/90 backdrop-blur-xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                  {/* Glowing backdrop circle */}
                  <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500" />
                  
                  {/* VIP Badge */}
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-widest shadow-md shadow-amber-500/10">
                    VIP ELITE
                  </div>

                  {/* Profile Picture with gold glow ring */}
                  <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-xl shadow-amber-500/10 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                      <img
                        src={member.img}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                    </div>
                  </div>

                  {/* User info */}
                  <div className="mt-6 space-y-1">
                    <h3 className="text-xl font-black tracking-wide text-white group-hover:text-amber-300 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <span>📍 {member.state}</span>
                    </p>
                  </div>

                  {/* Divider line */}
                  <div className="w-full h-[1px] bg-white/5 my-6" />

                  {/* Earnings display */}
                  <div className="space-y-1 w-full">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Verified Earnings</p>
                    <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent font-mono tracking-tight flex items-center justify-center gap-1.5">
                      {member.earnings}
                    </div>
                  </div>

                  {/* Verification shield badge */}
                  <div className="mt-5 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider select-none">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Earning Verified</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 relative border-t border-white/5 bg-slate-950/20 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white flex items-center justify-center gap-2">
            About Us 
            <span className="text-pink-500 text-2xl sm:text-3xl">&rarr;</span>
          </h2>

          <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-wide">
            Learn &rarr; Apply &rarr; Earn
          </h3>

          <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed font-medium max-w-3xl mx-auto">
            <p>
              <strong className="text-white">Fintech Hub India</strong> is a results-driven digital earning platform designed to make digital finance simple, practical, and highly rewarding for everyone.
            </p>
            <p>
              We focus on a straightforward path to success: educating you on modern marketing channels, providing verified product activation links, and rewarding your network development through structured, reliable payout mechanisms.
            </p>
            <p>
              With over <span className="text-violet-400 font-bold">50,000+ registered members</span> including students, working professionals, homemakers, and active digital builders, Fintech Hub India is empowering users across the nation to build skills, generate daily commissions, and establish long-term financial self-reliance.
            </p>
          </div>

          <div className="pt-4">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-pink-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Know More</span>
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </a>
          </div>
        </div>
      </section>

      {/* Meet The Founders Section */}
      <section id="founder" className="py-20 relative border-t border-white/5 bg-slate-950/60 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-black uppercase tracking-widest">
              Our Leadership
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MEET THE FOUNDERS
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              The visionaries driving Fintech Hub India's mission of digital empowerment and financial literacy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Founder Card */}
            <div className="glass-premium border border-white/10 hover:border-violet-500/30 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start transition-all duration-300 shadow-xl shadow-slate-950/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />
              
              {/* Photo */}
              <div className="shrink-0 relative">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-[2px] shadow-2xl" />
                <div className="relative w-44 h-52 rounded-[1.95rem] overflow-hidden bg-slate-900 border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                  <img
                    src={founderPhoto}
                    alt={founderName}
                    className="w-full h-full object-cover animate-fade-in"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80";
                    }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 text-center md:text-left flex-1">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                    {founderName}
                  </h3>
                  <p className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest mt-1">Founder & Managing Director</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Noida, Uttar Pradesh</p>
                </div>

                <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  <p>
                    Saif Khan is a forward-thinking digital entrepreneur, growth strategist, and mentor. He is the principal architect of Fintech Hub India, dedicated to making digital revenue streams simple, structured, and reachable.
                  </p>
                  
                  {/* Speech Box */}
                  <div className="p-3 rounded-xl bg-white/5 border-l-3 border-fuchsia-500 text-slate-300 text-[11px] sm:text-xs font-medium italic">
                    "Our mission is to enable every Indian with a smartphone to achieve financial freedom and build a sustainable career."
                  </div>
                </div>
              </div>
            </div>

            {/* Co-Founder Card */}
            <div className="glass-premium border border-white/10 hover:border-violet-500/30 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start transition-all duration-300 shadow-xl shadow-slate-950/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />
              
              {/* Photo */}
              <div className="shrink-0 relative">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-fuchsia-500 to-violet-500 p-[2px] shadow-2xl" />
                <div className="relative w-44 h-52 rounded-[1.95rem] overflow-hidden bg-slate-900 border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                  <img
                    src="/cofounder.jpg"
                    alt="Arshpreet Kaur"
                    className="w-full h-full object-cover animate-fade-in"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80";
                    }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 text-center md:text-left flex-1">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                    Arshpreet Kaur
                  </h3>
                  <p className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest mt-1">Co-Founder & CEO</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Kanpur, Uttar Pradesh | Pursuing B.Com</p>
                </div>

                <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  <p>
                    Arshpreet Kaur brings a dynamic, youth-centric perspective to the leadership team. Currently pursuing her B.Com degree, she drives operational excellence, community support, and growth initiatives for learners nationwide.
                  </p>
                  
                  {/* Speech Box */}
                  <div className="p-3 rounded-xl bg-white/5 border-l-3 border-violet-500 text-slate-300 text-[11px] sm:text-xs font-medium italic">
                    "Empowering students and youth with actionable digital skills is the key to unlocking true potential in modern India."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative border-t border-white/5 bg-slate-950/40 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase tracking-widest">
              Common Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-1 bg-slate-900/30 border border-white/5 rounded-3xl p-6 sm:p-8">
            {faqs.map((faq, idx) => (
              <FaqItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[3rem] p-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-2xl"
        >
          <div className="h-full w-full rounded-[2.95rem] bg-slate-950/95 backdrop-blur-xl p-10 sm:p-12 relative text-center space-y-6">
            <div className="absolute top-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight relative z-10">
              UNLOCK YOUR FIRST INCOME STREAM TODAY
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed relative z-10">
              Join over 50,000+ Indians who are earning daily commissions. Free activation, expert mentor support, and zero risk.
            </p>
            <div className="pt-4 relative z-10">
              <button
                onClick={() => setPage('login')}
                className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-lg tracking-wide shadow-xl shadow-violet-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer mx-auto btn-ripple"
              >
                <span>Start Earning Now (Free)</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-12 relative z-10 text-slate-500 text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <button 
              onClick={() => setPage('landing')} 
              className="h-14 w-auto flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <img src="/logo.png" alt="FINTECH HUB INDIA logo" className="h-12 w-auto object-contain" />
            </button>
          </div>

          <p className="text-center md:text-right text-slate-400">
            &copy; {new Date().getFullYear()} Fintech Hub India. All rights reserved.<br/>
            <span className="text-[10px] text-slate-500">Disclaimer: Earning results vary based on commitment, marketing skill, and active team building.</span>
          </p>
        </div>
      </footer>

      {/* Developer Details */}
      <div className="bg-slate-950 pb-12 pt-4 relative z-10">
        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] max-w-xs mx-auto hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] transition-all duration-500 hover:scale-[1.03] group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative z-10 rounded-[15px] bg-slate-950/90 backdrop-blur-xl p-4 text-center">
            
            {/* Tiny top glowing banner */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[8px] font-black tracking-widest uppercase mb-3 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              Developed &amp; Maintained By
            </div>

            {/* Neurox logo & text */}
            <h3 className="text-xs font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent tracking-widest leading-none group-hover:scale-105 transition-transform duration-500 uppercase">
              Neurox Technology
            </h3>
            
            {/* Developer name */}
            <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
              Zaheer Abbas
            </p>

            {/* Glowing divider line */}
            <div className="w-12 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 mx-auto my-3.5 opacity-60 group-hover:w-20 transition-all duration-500" />

            {/* Button links */}
            <div className="flex gap-2 mt-1 justify-center">
              <a
                href="https://wa.me/+918453031680"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer shadow-lg hover:shadow-emerald-500/5"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/neuroxtechnology/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 text-[10px] font-bold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer shadow-lg hover:shadow-pink-500/5"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
