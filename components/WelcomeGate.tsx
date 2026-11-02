import React from 'react';
import { Briefcase, Home, LogIn, MapPin, ShieldCheck, UserPlus } from 'lucide-react';
import { UserRole } from '../types';
import { LanguageSelector, useLanguage } from './LanguageContext';

interface WelcomeGateProps { onRegister: (role: UserRole) => void; onLogin: (role: UserRole) => void; }

export const WelcomeGate: React.FC<WelcomeGateProps> = ({ onRegister, onLogin }) => {
  const { t } = useLanguage();
  return (
  <main className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-4">
    <section className="w-full max-w-4xl rounded-3xl bg-white border border-[#E5E1D8] shadow-xl overflow-hidden">
      <div className="p-8 sm:p-12 text-center bg-[#FDFCF9] border-b border-[#E5E1D8] relative"><div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0] px-3 py-1 text-xs font-bold"><ShieldCheck className="w-4 h-4" /> Verified local services</div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-black font-display text-[#2D2926]">Welcome to KARMYOGI</h1>
        <p className="mt-3 text-sm text-[#8C867E] max-w-xl mx-auto">Choose how you want to use Karmyogi. Register or sign in as a worker or as someone hiring a verified professional.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5 p-6 sm:p-8">
        {[{ role: 'seeker' as UserRole, title: t('hire'), description: 'Find nearby verified professionals using your current location.', icon: Home }, { role: 'worker' as UserRole, title: t('worker'), description: 'Create your professional profile and receive nearby job opportunities.', icon: Briefcase }].map(({ role, title, description, icon: Icon }) => (
          <article key={role} className="rounded-2xl border border-[#E5E1D8] p-6 bg-white">
            <div className="w-11 h-11 rounded-xl bg-[#EBF2EA] text-[#5C6E58] flex items-center justify-center"><Icon className="w-5 h-5" /></div>
            <h2 className="mt-4 text-xl font-bold text-[#2D2926]">{title}</h2><p className="mt-2 min-h-10 text-sm text-[#8C867E]">{description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => onRegister(role)} className="py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white text-xs font-bold flex justify-center items-center gap-1.5"><UserPlus className="w-4 h-4" /> {t('register')}</button><button onClick={() => onLogin(role)} className="py-2.5 rounded-xl border border-[#E5E1D8] hover:border-[#8B5E3C] text-[#423E3B] text-xs font-bold flex justify-center items-center gap-1.5"><LogIn className="w-4 h-4" /> {t('login')}</button></div>
          </article>
        ))}
      </div>
      <p className="pb-7 text-center text-xs text-[#8C867E] flex justify-center items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location access helps show accurate nearby results.</p>
    </section>
  </main>
  );
};
