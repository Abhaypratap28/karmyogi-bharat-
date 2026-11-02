import React, { useState, useEffect } from 'react';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { Navbar } from './components/Navbar';
import { WorkerSearchDirectory } from './components/WorkerSearchDirectory';
import { KarmyogiFeedView } from './components/KarmyogiFeedView';
import { LeadGenerationView } from './components/LeadGenerationView';
import { BookingsManagementView } from './components/BookingsManagementView';
import { RegistrationModal } from './components/RegistrationModal';
import { LoginModal } from './components/LoginModal';
import { WorkerProfileModal } from './components/WorkerProfileModal';
import { BookingHireModal } from './components/BookingHireModal';
import { ChatModal } from './components/ChatModal';
import { EditProfileModal } from './components/EditProfileModal';
import { WelcomeGate } from './components/WelcomeGate';
import { LanguageProvider } from './components/LanguageContext';
import { AppNotification, Booking, User, UserRole } from './types';
import { Hammer, ShieldCheck, Heart, Sparkles, Navigation } from 'lucide-react';
import { getLiveLocation, getLocationErrorMessage } from './utils/liveLocation';

const SESSION_STORAGE_KEY = 'karmyogi.session.v1';
type AppTab = 'directory' | 'feed' | 'leads' | 'bookings' | 'messages';
const isAppTab = (value: unknown): value is AppTab => ['directory', 'feed', 'leads', 'bookings', 'messages'].includes(String(value));

export function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showWelcomeGate, setShowWelcomeGate] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<AppTab>(
    'directory'
  );

  // Active user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Directory & Worker state
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('distance');

  // Coordinates are only used for nearby matching after a fresh GPS fix.
  // The placeholder avoids nullable component props; it is never sent to the
  // directory API until hasAccurateLocation is true.
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.5355,
    lng: 77.391,
  });
  const [userCity, setUserCity] = useState<string>('Location not set');
  const [hasAccurateLocation, setHasAccurateLocation] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerDefaultRole, setRegisterDefaultRole] = useState<UserRole>('worker');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<UserRole | undefined>(undefined);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<User | null>(null);
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<User | null>(null);
  const [activeChatTargetUser, setActiveChatTargetUser] = useState<User | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const activateUser = (user: User): void => {
    setCurrentUser(user);
    setShowWelcomeGate(false);
  };

  // Keep navigation and action panels mutually exclusive. Opening a new option
  // always ends the previous one instead of leaving a hidden modal active.
  const closeActionPanels = () => {
    setSelectedWorkerForProfile(null);
    setSelectedWorkerForBooking(null);
    setActiveChatTargetUser(null);
    setActiveBookingId(null);
    setShowEditProfile(false);
  };

  const handleChangeTab = (tab: AppTab) => {
    closeActionPanels();
    setCurrentTab(tab);
  };

  const openWorkerProfile = (worker: User) => {
    setSelectedWorkerForBooking(null);
    setActiveChatTargetUser(null);
    setActiveBookingId(null);
    setShowEditProfile(false);
    setSelectedWorkerForProfile(worker);
  };

  const openBooking = (worker: User) => {
    setSelectedWorkerForProfile(null);
    setActiveChatTargetUser(null);
    setActiveBookingId(null);
    setShowEditProfile(false);
    setSelectedWorkerForBooking(worker);
  };

  // GPS Location Detection
  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError('');
    try {
        const position = await getLiveLocation();
        const newCoords = { lat: position.lat, lng: position.lng };
        let city = 'Live GPS location';
        try {
          const response = await fetch(`/api/location/reverse?lat=${encodeURIComponent(newCoords.lat)}&lng=${encodeURIComponent(newCoords.lng)}`);
          if (response.ok) {
            const result = await response.json();
            city = result.city || city;
          }
        } catch {
          // A live coordinate is still valid when the reverse-geocoding service is unavailable.
        }
        setUserCoords(newCoords);
        setUserCity(city);
        setHasAccurateLocation(true);
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                location: newCoords,
                city,
              }
            : prev
        );
        if (currentUser) {
          void fetch(`/api/users/${currentUser.id}/location`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newCoords, city, accuracy: position.accuracy }),
          });
        }
    } catch (error) {
      setHasAccurateLocation(false);
      setLocationError(getLocationErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  // Fetch initial data: Users & Notifications
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      setAllUsers(data || []);
    } catch {
      // Fallback gracefully
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/${currentUser.id}`, { cache: 'no-store' });
      const data = await res.json();
      setNotifications(data || []);
    } catch {
      // Ignore network noise on periodic poll
    }
  };

  // Fetch Workers with live distance & filters
  const fetchWorkers = async () => {
    if (!hasAccurateLocation) {
      setWorkers([]);
      setIsLoadingWorkers(false);
      return;
    }
    setIsLoadingWorkers(true);
    try {
      const params = new URLSearchParams({
        lat: userCoords.lat.toString(),
        lng: userCoords.lng.toString(),
        sortBy,
      });

      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (selectedOccupation !== 'All') params.append('occupation', selectedOccupation);

      const res = await fetch(`/api/workers?${params.toString()}`);
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : data?.workers || []);
    } catch {
      setWorkers([]);
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    handleDetectLocation();
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}') as { user?: User; tab?: unknown };
      if (saved.user?.id && saved.user.email) {
        setCurrentUser(saved.user);
        setShowWelcomeGate(false);
      }
      if (isAppTab(saved.tab)) setCurrentTab(saved.tab);
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user: currentUser, tab: currentTab }));
  }, [currentUser, currentTab]);

  useEffect(() => {
    fetchWorkers();
  }, [userCoords, hasAccurateLocation, searchQuery, selectedOccupation, sortBy]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Graceful fallback
    }
  };

  const handleOpenRegister = (defaultRole: UserRole = 'worker') => {
    closeActionPanels();
    setRegisterDefaultRole(defaultRole);
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleOpenLogin = (role?: UserRole) => {
    closeActionPanels();
    setLoginDefaultRole(role);
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleUserRegisteredOrLoggedIn = (user: User) => {
    activateUser(user);
    setShowRegisterModal(false);
    setShowLoginModal(false);
    fetchAllUsers();
  };

  const handleSelectWorkerForChat = (worker: User) => {
    setSelectedWorkerForProfile(null);
    setSelectedWorkerForBooking(null);
    setShowEditProfile(false);
    setActiveBookingId(null);
    setActiveChatTargetUser(worker);
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (['new_lead_match', 'lead_proposal_sent', 'lead_accepted'].includes(notification.type)) {
      handleChangeTab('leads');
      return;
    }
    if (!currentUser || !notification.linkId) {
      handleChangeTab('bookings');
      return;
    }
    try {
      const response = await fetch(`/api/bookings/user/${currentUser.id}`);
      const bookings: Booking[] = await response.json();
      const booking = bookings.find((item) => item.id === notification.linkId);
      if (!booking) { handleChangeTab('bookings'); return; }
      const otherUserId = booking.seekerId === currentUser.id ? booking.workerId : booking.seekerId;
      const otherUser = allUsers.find((user) => user.id === otherUserId);
      if (otherUser && ['booking_request', 'booking_accepted', 'new_message'].includes(notification.type)) {
        handleSelectWorkerForChat(otherUser);
        setActiveBookingId(booking.id);
      } else {
        handleChangeTab('bookings');
      }
    } catch {
      handleChangeTab('bookings');
    }
  };

  return (
    <LanguageProvider>
      {showSplash && <IntroSplashScreen onComplete={() => setShowSplash(false)} />}
      {showWelcomeGate && !currentUser && <WelcomeGate onRegister={handleOpenRegister} onLogin={handleOpenLogin} />}
      {(!showWelcomeGate || showRegisterModal || showLoginModal) && (
    <div className="min-h-screen bg-[#F9F7F2] text-[#2D2926] font-sans selection:bg-[#8B5E3C] selection:text-white flex flex-col">
      {/* 1. Animated Splash Intro Screen */}

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        setCurrentTab={handleChangeTab}
        onOpenRegister={handleOpenRegister}
        onOpenLogin={() => handleOpenLogin()}
        onLogout={() => { closeActionPanels(); setCurrentUser(null); setShowWelcomeGate(true); }}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        userCity={userCity}
        userCoords={userCoords}
        onDetectLocation={handleDetectLocation}
        isLocating={isLocating}
        locationError={locationError}
        onOpenNotification={handleOpenNotification}
        onEditProfile={() => { closeActionPanels(); setShowEditProfile(true); }}
      />

      {/* 3. Main Body Content based on Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {currentTab === 'directory' && (
          <WorkerSearchDirectory
            workers={workers}
            isLoading={isLoadingWorkers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedOccupation={selectedOccupation}
            setSelectedOccupation={setSelectedOccupation}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSelectWorker={openWorkerProfile}
            onBookWorker={openBooking}
            onStartChat={handleSelectWorkerForChat}
            currentUser={currentUser}
            onOpenRegister={handleOpenRegister}
            userCity={userCity}
            onDetectLocation={handleDetectLocation}
            isLocating={isLocating}
          />
        )}

        {currentTab === 'feed' && (
          <KarmyogiFeedView
            currentUser={currentUser}
            onOpenLogin={() => setShowLoginModal(true)}
            onSelectWorkerById={(workerId) => {
              const target = allUsers.find((u) => u.id === workerId);
              if (target) openWorkerProfile(target);
            }}
            onBookWorkerById={(workerId) => {
              const target = allUsers.find((u) => u.id === workerId);
              if (target) openBooking(target);
            }}
          />
        )}

        {currentTab === 'leads' && (
          <LeadGenerationView
            currentUser={currentUser}
            onOpenLogin={() => setShowLoginModal(true)}
            onSelectWorkerById={(workerId) => {
              const target = allUsers.find((u) => u.id === workerId);
              if (target) openWorkerProfile(target);
            }}
            userCity={userCity}
            userCoords={userCoords}
          />
        )}

        {currentTab === 'bookings' && (
          <BookingsManagementView
            currentUser={currentUser}
            onOpenLogin={() => setShowLoginModal(true)}
            onOpenChatWithUser={handleSelectWorkerForChat}
            allUsers={allUsers}
            onOpenDirectory={() => handleChangeTab('directory')}
          />
        )}

        {currentTab === 'messages' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF2EA] text-[#5C6E58] flex items-center justify-center font-bold">
                  K
                </div>
                <h2 className="text-xl font-bold font-display text-[#2D2926]">
                  Live Messaging Center
                </h2>
              </div>
              <p className="text-xs text-[#8C867E] mb-4">
                Select any of your active bookings or verified connections to open the end-to-end encrypted direct chat.
              </p>

              <div className="space-y-2">
                {allUsers
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <div
                      key={u.id}
                            onClick={() => handleSelectWorkerForChat(u)}
                      className="p-3.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profilePic}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#E5E1D8]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#2D2926]">{u.name}</span>
                            {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-[#5C6E58]" />}
                          </div>
                          <p className="text-[11px] text-[#5C6E58] font-semibold">
                            {u.role === 'worker' ? `${u.occupation} (₹${u.ratePerHour}/hr)` : 'Service Seeker'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-white bg-[#8B5E3C] hover:bg-[#724D31] px-3.5 py-1.5 rounded-lg shadow-sm">
                        Open Thread →
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-[#E5E1D8] bg-white py-6 text-[#8C867E] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#5C6E58] text-white flex items-center justify-center font-bold text-xs">
              K
            </div>
            <span className="font-bold text-[#2D2926]">KARMYOGI Bharat</span>
            <span className="text-[11px] text-[#8C867E] hidden md:inline">
              • Direct Worker Empowerment & Verified Contractor Marketplace
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#8C867E] text-xs">
            <button
              onClick={() => setShowSplash(true)}
              className="text-[#8B5E3C] font-semibold hover:underline cursor-pointer"
            >
              Replay Intro Animation
            </button>
            <span>•</span>
            <span className="text-[#5C6E58] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>UIDAI & Privacy Compliant</span>
            </span>
          </div>
        </div>
      </footer>

      {/* 5. Modals */}
      <RegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleUserRegisteredOrLoggedIn}
        defaultRole={registerDefaultRole}
        userCoords={userCoords}
        userCity={userCity}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleUserRegisteredOrLoggedIn}
        allUsers={allUsers}
        defaultRole={loginDefaultRole}
        onOpenRegister={() => handleOpenRegister('worker')}
      />

      <WorkerProfileModal
        worker={selectedWorkerForProfile}
        onClose={() => setSelectedWorkerForProfile(null)}
        onBook={(w) => {
          setSelectedWorkerForProfile(null);
          openBooking(w);
        }}
        onChat={(w) => {
          setSelectedWorkerForProfile(null);
          setActiveBookingId(null);
          handleSelectWorkerForChat(w);
        }}
        currentUser={currentUser}
      />

      <BookingHireModal
        isOpen={Boolean(selectedWorkerForBooking)}
        onClose={() => setSelectedWorkerForBooking(null)}
        worker={selectedWorkerForBooking}
        currentUser={currentUser}
        onBookingCreated={(newBooking) => {
          fetchNotifications();
          // Direct to bookings tab
          handleChangeTab('bookings');
        }}
        onOpenLogin={() => handleOpenLogin()}
      />

      <ChatModal
        isOpen={Boolean(activeChatTargetUser)}
        onClose={() => { setActiveChatTargetUser(null); setActiveBookingId(null); }}
        targetUser={activeChatTargetUser}
        initialBookingId={activeBookingId}
        currentUser={currentUser}
        onOpenBooking={(w) => {
          setActiveChatTargetUser(null);
          openBooking(w);
        }}
      />

      <EditProfileModal
        user={showEditProfile ? currentUser : null}
        onClose={() => setShowEditProfile(false)}
        onUpdated={(user) => { setCurrentUser(user); fetchAllUsers(); }}
        onLogout={() => { closeActionPanels(); setCurrentUser(null); setShowWelcomeGate(true); }}
      />
    </div>
      )}
    </LanguageProvider>
  );
}
export default App;
