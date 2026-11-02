import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Lock,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
  Briefcase,
  ExternalLink,
  Navigation,
  MessageSquare,
} from 'lucide-react';
import { User, Booking, Message } from '../types';
import { getLiveLocation, getLocationErrorMessage } from '../utils/liveLocation';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  currentUser: User | null;
  onOpenBooking: (worker: User) => void;
  initialBookingId?: string | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onOpenBooking,
  initialBookingId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const [shareLocationError, setShareLocationError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThread = async () => {
    if (!currentUser || !targetUser) return;
    try {
      const params = initialBookingId
        ? `bookingId=${encodeURIComponent(initialBookingId)}`
        : `userId1=${currentUser.id}&userId2=${targetUser.id}`;
      const res = await fetch(`/api/messages/thread?${params}`);
      const data = await res.json();
      setIsChatEnabled(Boolean(data.isChatEnabled));
      setLockReason(data.reason || '');
      setBooking(data.booking || null);
      setMessages(data.messages || []);
    } catch {
      // Graceful error handling
    } finally {
      setIsLoadingThread(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser && targetUser) {
      setIsLoadingThread(true);
      fetchThread();
      const interval = setInterval(fetchThread, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser, targetUser, initialBookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !targetUser || !currentUser) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !booking || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          senderId: currentUser.id,
          receiverId: targetUser.id,
          text: messageText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {
      // Graceful error handling
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickShareLocation = async () => {
    if (!isChatEnabled || !booking) {
      setShareLocationError('Chat is locked. Please book this worker to unlock messaging.');
      return;
    }

    setShareLocationError('');
    setIsSharingLocation(true);

    try {
        const position = await getLiveLocation();
        if (position.accuracy > 100) {
          setShareLocationError('Location accuracy is too low. Move outdoors or enable GPS, then try again.');
          return;
        }
        const coords = { lat: position.lat, lng: position.lng };
        let address = '';
        try {
          const lookup = await fetch(`/api/location/reverse?lat=${encodeURIComponent(coords.lat)}&lng=${encodeURIComponent(coords.lng)}`);
          if (lookup.ok) {
            const location = await lookup.json();
            address = location.address || location.city || '';
          }
        } catch {
          // The coordinate and map pin are still useful if name lookup is unavailable.
        }

        const gpsText = `📍 Live location shared${address ? `: ${address}` : ''}`;

        try {
          const res = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            senderId: currentUser.id,
            receiverId: targetUser.id,
            text: gpsText,
            location: {
              ...coords,
              accuracy: position.accuracy,
              address,
            },
          }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.success) {
            setMessages((prev) => [...prev, data.message]);
          } else {
            setShareLocationError(data.error || 'Unable to share your location.');
          }
        } catch {
          setShareLocationError('Location could not be sent. Please try again.');
        }
    } catch (error) {
      setShareLocationError(getLocationErrorMessage(error));
    } finally {
      setIsSharingLocation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#F9F7F2] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[700px]">
        {/* Header */}
        <div className="bg-white p-4 sm:p-5 border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={targetUser.profilePic}
                alt={targetUser.name}
                className="w-11 h-11 rounded-xl object-cover border border-[#E5E1D8]"
              />
              {targetUser.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-[#5C6E58] text-white p-0.5 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#2D2926]">{targetUser.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] font-bold border border-[#D2E0D0]">
                  {targetUser.role === 'worker' ? targetUser.occupation : 'Service Seeker'}
                </span>
              </div>
              <p className="text-[11px] text-[#8C867E]">
                {isChatEnabled ? (
                  <span className="text-[#5C6E58] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5C6E58] animate-pulse" />
                    Direct Contact Unlocked (Booking #{booking?.id})
                  </span>
                ) : (
                  <span className="text-[#8B5E3C] font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Messaging Locked (Selection Required)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unlocked Mutual Contact Exchange Bar */}
        {isChatEnabled && (
          <div className="bg-[#EBF2EA] border-b border-[#D2E0D0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <a
                href={`tel:${targetUser.phone}`}
                className="flex items-center gap-1.5 text-[#2D2926] font-bold hover:text-[#8B5E3C] bg-white px-2.5 py-1 rounded-lg border border-[#E5E1D8] shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-[#5C6E58]" />
                <span>{targetUser.phone}</span>
              </a>

              <div className="flex items-center gap-1 text-[#423E3B]">
                <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" />
                <span className="truncate max-w-[180px]">{targetUser.address}, {targetUser.city}</span>
              </div>
            </div>

            <span className="text-[10px] text-[#5C6E58] font-bold bg-white px-2 py-0.5 rounded-full border border-[#D2E0D0]">
              ✓ Verified Aadhaar Profile
            </span>
          </div>
        )}

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9F7F2]">
          {isLoadingThread ? (
            <div className="text-center py-12 text-xs text-[#8C867E]">Loading conversation status...</div>
          ) : !isChatEnabled ? (
            /* LOCKED TALKING STATE */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] flex items-center justify-center shadow-sm">
                <Lock className="w-8 h-8" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold font-display text-[#2D2926]">
                  Real-Time Messaging is Disabled
                </h3>
                <p className="text-xs text-[#8C867E] leading-relaxed">
                  To protect craftsman and client privacy on KARMYOGI, the talking system and mutual phone contact details are only unlocked after the seeker selects and books this worker.
                </p>
              </div>

              {currentUser.role === 'seeker' && targetUser.role === 'worker' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBooking(targetUser);
                  }}
                  id="unlock-chat-by-booking-btn"
                  className="px-6 py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Select & Book {targetUser.name} to Unlock Chat</span>
                </button>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#8C867E]">
              Booking confirmed! Say Namaste and discuss your project details.
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-[#5C6E58] text-white font-medium rounded-tr-none'
                        : 'bg-white text-[#2D2926] rounded-tl-none border border-[#E5E1D8]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                          isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#EBF2EA] text-[#5C6E58] hover:bg-[#D2E0D0]'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        Open live map{msg.location.accuracy ? ` · ±${Math.round(msg.location.accuracy)}m` : ''}
                      </a>
                    )}
                    <div
                      className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                        isMe ? 'text-white/80' : 'text-[#8C867E]'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Message Input (Active only when unlocked) */}
        {isChatEnabled && (
          <div className="p-3 bg-white border-t border-[#E5E1D8] space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={handleQuickShareLocation}
                disabled={isSharingLocation}
                className="px-2.5 py-1 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] hover:border-[#8B5E3C] text-[10px] text-[#423E3B] hover:text-[#8B5E3C] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>{isSharingLocation ? 'Getting location…' : 'Share My Location'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInputText('Can you do a site visit tomorrow at 10:00 AM?')}
                className="px-2.5 py-1 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] hover:border-[#8B5E3C] text-[10px] text-[#423E3B] hover:text-[#8B5E3C] transition-colors whitespace-nowrap cursor-pointer"
              >
                Request Site Visit
              </button>

              <button
                type="button"
                onClick={() => setInputText('Please bring your tool set and invoice receipt.')}
                className="px-2.5 py-1 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] hover:border-[#8B5E3C] text-[10px] text-[#423E3B] hover:text-[#8B5E3C] transition-colors whitespace-nowrap cursor-pointer"
              >
                Tools & Invoice
              </button>
            </div>

            {shareLocationError && (
              <p className="flex items-center gap-1 text-[10px] text-red-600">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {shareLocationError}
              </p>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a direct message to your verified partner..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:border-[#8B5E3C] text-xs text-[#2D2926] placeholder-[#8C867E]"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
