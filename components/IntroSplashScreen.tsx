import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hammer, ShieldCheck, Sparkles, MapPin, ArrowRight, Award } from 'lucide-react';

interface IntroSplashScreenProps {
  onComplete: () => void;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F9F7F2] text-[#2D2926] overflow-hidden px-4">
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#DBCBB0]/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 left-1/3 w-[400px] h-[400px] bg-[#5C6E58]/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center">
        {/* Animated Emblem */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#8B5E3C] p-[3px] shadow-xl shadow-[#8B5E3C]/20">
            <div className="w-full h-full bg-[#F1EDE4] rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[#DBCBB0]/20" />
              <Hammer className="w-12 h-12 text-[#8B5E3C] drop-shadow-sm" />
              <div className="absolute -bottom-1 -right-1 bg-[#5C6E58] text-white p-1 rounded-tl-lg">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Title & Tagline with staggered animation */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bharat's Verified Professional Trade Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#2D2926]">
            KARMYOGI
          </h1>
          <p className="text-lg sm:text-xl text-[#423E3B] font-medium max-w-lg mx-auto">
            Where Skilled Hands Meet Verified Work Opportunities
          </p>
          <p className="text-xs sm:text-sm text-[#8C867E] max-w-md mx-auto">
            Carpenters • Electricians • Plumbers • Teachers • Painters • Masons • Technicians
          </p>
        </motion.div>

        {/* Highlight features pill grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: step >= 2 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-8 w-full max-w-lg text-left"
        >
          <div className="p-3.5 rounded-xl bg-white border border-[#E5E1D8] shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EA] text-[#5C6E58] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2926]">Aadhaar Verified</p>
              <p className="text-[10px] text-[#8C867E]">End-to-End Secure</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E5E1D8] shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1EDE4] text-[#8B5E3C] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2926]">Live Distance</p>
              <p className="text-[10px] text-[#8C867E]">Nearest Workers First</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E5E1D8] shadow-sm col-span-2 sm:col-span-1 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DBCBB0]/40 text-[#8B5E3C] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2926]">Direct Portfolios</p>
              <p className="text-[10px] text-[#8C867E]">Verified Client Reviews</p>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: step >= 2 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs"
        >
          <button
            onClick={onComplete}
            id="splash-enter-btn"
            className="w-full py-3.5 px-6 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-sm shadow-lg shadow-[#8B5E3C]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Enter KARMYOGI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Quote in Hindi/English */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: step >= 3 ? 0.9 : 0 }}
          transition={{ duration: 0.6 }}
          className="text-[11px] text-[#8C867E] mt-6 tracking-wide italic font-serif"
        >
          "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन" — Work is worship. Dedicated to every skilled worker of Bharat.
        </motion.p>
      </div>
    </div>
  );
};
