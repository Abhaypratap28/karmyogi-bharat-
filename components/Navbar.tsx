import React, { useEffect, useRef, useState } from 'react';
import {
  Hammer,
  ShieldCheck,
  MapPin,
  Search,
  Bell,
  MessageSquare,
  Briefcase,
  Layers,
  CalendarCheck,
  UserPlus,
  LogIn,
  LogOut,
  ChevronDown,
  Navigation,
  Sparkles,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { User, AppNotification } from '../types';
import { LanguageSelector, useLanguage } from './LanguageContext';

interface NavbarProps {
  currentUser: User | null;
  currentTab: 'directory' | 'feed' | 'leads' | 'bookings' | 'messages';
  setCurrentTab: (tab: 'directory' | 'feed' | 'leads' | 'bookings' | 'messages') => void;
  onOpenRegister: (defaultRole?: 'worker' | 'seeker') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  userCity: string;
  userCoords: { lat: number; lng: number };
  onDetectLocation: () => void;
  isLocating: boolean;
  locationError?: string;
  onOpenNotification?: (notification: AppNotification) => void;
  onEditProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  setCurrentTab,
  onOpenRegister,
  onOpenLogin,
  onLogout,
  notifications,
  onMarkNotificationRead,
  userCity,
  onDetectLocation,
  isLocating,
  locationError,
  onOpenNotification,
  onEditProfile,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    const closeMenusOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!notificationMenuRef.current?.contains(target)) setShowNotifMenu(false);
      if (!userMenuRef.current?.contains(target)) setShowUserMenu(false);
    };
    document.addEventListener('pointerdown', closeMenusOutside);
    return () => document.removeEventListener('pointerdown', closeMenusOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E1D8] text-[#2D2926]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('directory')}
            id="brand-logo-btn"
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#8B5E3C] p-[2px] shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#F1EDE4] rounded-[9px] flex items-center justify-center relative">
                <Hammer className="w-5 h-5 text-[#8B5E3C]" />
                <div className="absolute -bottom-1 -right-1 bg-[#5C6E58] text-white rounded-full p-0.5 shadow-sm">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl tracking-tight text-[#2D2926]">
                  KARMYOGI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] font-bold uppercase tracking-wider">
                  Bharat
                </span>
              </div>
              <p className="text-[10px] text-[#8C867E] hidden sm:block">Skilled Trades & Service Network</p>
            </div>
          </button>
        </div>

        {/* Live GPS Location Bar */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onDetectLocation}
            title={locationError || 'Click to refresh your live GPS location'}
            id="gps-location-pill"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] text-xs text-[#423E3B] hover:text-[#8B5E3C] transition-all cursor-pointer group shadow-sm"
          >
            <div className={`w-2 h-2 rounded-full ${locationError ? 'bg-red-500' : 'bg-[#5C6E58] animate-pulse'}`} />
            <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] group-hover:scale-110 transition-transform" />
            <span className="max-w-[140px] truncate font-semibold">{userCity || 'Detecting Location...'}</span>
            <Navigation className={`w-3 h-3 text-[#8C867E] ${isLocating ? 'animate-spin text-[#8B5E3C]' : ''}`} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('directory')}
            id="nav-tab-directory"
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'directory'
                ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                : 'text-[#8C867E] hover:text-[#2D2926] hover:bg-[#F1EDE4]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('findWorkers')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('feed')}
            id="nav-tab-feed"
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'feed'
                ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                : 'text-[#8C867E] hover:text-[#2D2926] hover:bg-[#F1EDE4]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('feed')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('leads')}
            id="nav-tab-leads"
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'leads'
                ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                : 'text-[#8C867E] hover:text-[#2D2926] hover:bg-[#F1EDE4]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{t('leads')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5E3C] animate-ping" />
          </button>

          <button
            onClick={() => setCurrentTab('bookings')}
            id="nav-tab-bookings"
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'bookings'
                ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                : 'text-[#8C867E] hover:text-[#2D2926] hover:bg-[#F1EDE4]'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{t('bookings')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('messages')}
            id="nav-tab-messages"
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'messages'
                ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                : 'text-[#8C867E] hover:text-[#2D2926] hover:bg-[#F1EDE4]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('chat')}</span>
          </button>
        </nav>

        {/* Right Section: Notifications & User profile / Quick Switch */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {/* Notifications Dropdown */}
          <div ref={notificationMenuRef} className="relative">
            <button
              onClick={() => {
                setShowNotifMenu((open) => !open);
                setShowUserMenu(false);
              }}
              id="notif-bell-btn"
              className="p-2 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] text-[#2D2926] transition-all relative cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#423E3B]" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B5E3C] text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E1D8]">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#8B5E3C]" />
                    <span className="text-xs font-bold text-[#2D2926]">Karmyogi Notifications</span>
                  </div>
                  <span className="text-[10px] text-[#5C6E58] bg-[#EBF2EA] px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifs.length} Unread
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#8C867E] text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (onOpenNotification) {
                            onOpenNotification(notif);
                            setShowNotifMenu(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          notif.isRead
                            ? 'bg-[#F9F7F2] border-[#E5E1D8] text-[#8C867E]'
                            : 'bg-[#F1EDE4] border-[#8B5E3C]/30 text-[#2D2926]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-[#2D2926]">{notif.title}</p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#8B5E3C] shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#423E3B] mt-1 leading-relaxed">{notif.description}</p>
                        <p className="text-[9px] text-[#8C867E] mt-1.5">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User or Auth buttons */}
          {currentUser ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => {
                  setShowUserMenu((open) => !open);
                  setShowNotifMenu(false);
                }}
                id="user-profile-menu-btn"
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] transition-all cursor-pointer group"
              >
                <img
                  src={currentUser.profilePic}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-[#E5E1D8]"
                />
                <div className="text-left hidden sm:block max-w-[120px]">
                  <p className="text-xs font-bold text-[#2D2926] truncate group-hover:text-[#8B5E3C]">{currentUser.name}</p>
                  <p className="text-[10px] text-[#5C6E58] font-bold capitalize truncate">
                    {currentUser.role === 'worker' ? (currentUser.occupation || 'Worker') : 'Service Seeker'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C867E]" />
              </button>

              {/* Profile Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xl p-3 z-50">
                  <div className="pb-3 border-b border-[#E5E1D8]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.profilePic}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#8B5E3C]/40"
                      />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-[#2D2926] truncate">{currentUser.name}</p>
                          {currentUser.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#5C6E58] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#5C6E58] font-bold capitalize">
                          {currentUser.role === 'worker' ? `${currentUser.occupation} (₹${currentUser.ratePerHour}/hr)` : 'Homeowner / Contractor'}
                        </p>
                        <p className="text-[10px] text-[#8C867E] truncate">Aadhaar: {currentUser.aadhaarNumber}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { onEditProfile(); setShowUserMenu(false); }}
                    className="mt-2 w-full rounded-lg bg-[#EBF2EA] px-3 py-2 text-left text-xs font-semibold text-[#5C6E58] hover:bg-[#D2E0D0] flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Profile
                  </button>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full py-2 px-3 rounded-lg text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                id="login-header-btn"
                className="px-3 py-1.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] text-xs font-bold text-[#2D2926] hover:text-[#8B5E3C] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-[#8B5E3C]" />
                <span>Login</span>
              </button>

              <button
                onClick={() => onOpenRegister()}
                id="register-header-btn"
                className="px-3.5 py-1.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join Karmyogi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab navigation bar at bottom/secondary */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#E5E1D8] bg-white py-2 px-2 text-[#8C867E] text-[11px] overflow-x-auto">
        <button
          onClick={() => setCurrentTab('directory')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg ${currentTab === 'directory' ? 'text-[#8B5E3C] font-bold' : ''}`}
        >
          <Search className="w-4 h-4" />
          <span>Workers</span>
        </button>
        <button
          onClick={() => setCurrentTab('feed')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg ${currentTab === 'feed' ? 'text-[#8B5E3C] font-bold' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>Feed</span>
        </button>
        <button
          onClick={() => setCurrentTab('leads')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg ${currentTab === 'leads' ? 'text-[#8B5E3C] font-bold' : ''}`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Leads</span>
        </button>
        <button
          onClick={() => setCurrentTab('bookings')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg ${currentTab === 'bookings' ? 'text-[#8B5E3C] font-bold' : ''}`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Bookings</span>
        </button>
        <button
          onClick={() => setCurrentTab('messages')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg ${currentTab === 'messages' ? 'text-[#8B5E3C] font-bold' : ''}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
      </div>
    </header>
  );
};
