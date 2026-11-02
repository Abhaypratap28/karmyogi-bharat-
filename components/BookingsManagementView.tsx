import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  IndianRupee,
  Navigation,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Booking, User } from '../types';
import { ReviewModal } from './ReviewModal';

interface BookingsManagementViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenChatWithUser: (user: User) => void;
  allUsers: User[];
  onOpenDirectory: () => void;
}

export const BookingsManagementView: React.FC<BookingsManagementViewProps> = ({
  currentUser,
  onOpenLogin,
  onOpenChatWithUser,
  allUsers,
  onOpenDirectory,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings/user/${currentUser.id}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    }
  }, [currentUser]);

  const handleUpdateStatus = async (
    bookingId: string,
    status: 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actorId: currentUser?.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchBookings();
      }
    } catch {
      // Graceful error handling
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[#E5E1D8] p-8 space-y-4 max-w-lg mx-auto shadow-sm">
        <CalendarCheck className="w-12 h-12 text-[#8B5E3C] mx-auto" />
        <h2 className="text-xl font-bold font-display text-[#2D2926]">Access Your Bookings</h2>
        <p className="text-xs text-[#8C867E] leading-relaxed">
          Log in or switch to a verified account to view your hire history, manage job proposals, and access unlocked mutual contact coordinates.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-3 rounded-2xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const isWorker = currentUser.role === 'worker';

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E1D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0] uppercase tracking-wider">
              {isWorker ? 'Worker Job Orders' : 'My Hired Tradespeople'}
            </span>
            <span className="text-xs text-[#5C6E58] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mutual Contact Exchange</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-[#2D2926] mt-1">
            {isWorker ? 'Client Bookings & Dispatch Orders' : 'My Work Requests & Booked Workers'}
          </h2>
          <p className="text-xs text-[#8C867E]">
            {isWorker
              ? 'Review job requests, accept bookings to enable live chat, and exchange project details.'
              : 'Track hired workers, access full contact numbers, live directions, and rate after completion.'}
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="px-4 py-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] border border-[#E5E1D8] text-xs font-bold cursor-pointer shrink-0 transition-colors"
        >
          Refresh Status
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-white border border-[#E5E1D8] animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1D8] p-6 space-y-3 shadow-sm">
          <CalendarCheck className="w-12 h-12 text-[#8C867E] mx-auto" />
          <h3 className="text-base font-bold text-[#2D2926]">No Bookings Found Yet</h3>
          <p className="text-xs text-[#8C867E] max-w-sm mx-auto">
            {isWorker
              ? 'When clients discover and select your profile from the directory, your incoming bookings will appear here.'
              : 'Browse nearby verified carpenters, electricians, plumbers, and teachers to select and book.'}
          </p>
          {!isWorker && (
            <button
              onClick={onOpenDirectory}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
            >
              Explore Worker Directory
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((b) => {
            const otherUserId = isWorker ? b.seekerId : b.workerId;
            const otherUser = allUsers.find((u) => u.id === otherUserId);
            const otherName = isWorker ? b.seekerName : b.workerName;
            const otherPic = isWorker ? b.seekerPic : b.workerPic;
            const otherPhone = isWorker ? b.seekerPhone : b.workerPhone;
            const otherAddress = isWorker ? b.seekerAddress : b.workerAddress;
            const otherCity = isWorker ? b.seekerCity : b.workerCity;

            const isAccepted = b.status === 'accepted' || b.status === 'in_progress' || b.status === 'completed';

            return (
              <div
                key={b.id}
                className="rounded-3xl bg-white border border-[#E5E1D8] overflow-hidden shadow-sm"
              >
                {/* Booking Header: Status badge & ID */}
                <div className="p-4 sm:p-5 bg-[#FDFCF9] border-b border-[#E5E1D8] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#8B5E3C]">
                      Booking #{b.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        b.status === 'pending'
                          ? 'bg-[#FDF6E2] text-[#8B5E3C] border border-[#EEDDB8]'
                          : b.status === 'accepted'
                          ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                          : b.status === 'completed'
                          ? 'bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#8C867E]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8C867E]" />
                      <span>{b.serviceDate} ({b.serviceTime})</span>
                    </div>
                    <span>•</span>
                    <span className="font-bold text-[#5C6E58]">
                      ₹{b.agreedRate} / {b.rateType}
                    </span>
                  </div>
                </div>

                {/* Booking Core Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#2D2926]">{b.projectTitle}</h3>
                    <p className="text-xs text-[#423E3B] mt-1 leading-relaxed bg-[#F9F7F2] p-3 rounded-2xl border border-[#E5E1D8]">
                      {b.projectDescription}
                    </p>
                  </div>

                  {/* Mutual Contact & Identity Details Exchange Box */}
                  <div className="p-4 rounded-2xl bg-[#FDFCF9] border border-[#E5E1D8] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>
                          {isWorker ? 'Client Contact & Site Coordinates' : 'Assigned Worker Identity & Direct Contact'}
                        </span>
                      </h4>
                      <span className="text-[10px] text-[#5C6E58] font-bold bg-[#EBF2EA] px-2 py-0.5 rounded-full border border-[#D2E0D0]">
                        ✓ Mutual Exchange Active
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={otherPic}
                          alt={otherName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E5E1D8] shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#2D2926]">{otherName}</span>
                            {otherUser?.isVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#5C6E58]" />
                            )}
                          </div>
                          <p className="text-xs text-[#8B5E3C] font-semibold">
                            {isWorker ? 'Homeowner / Contractor' : otherUser?.occupation || 'Worker'}
                          </p>
                          <p className="text-[11px] text-[#8C867E] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#8B5E3C]" />
                            <span>{otherAddress}, {otherCity}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {otherPhone && (
                          <a
                            href={`tel:${otherPhone}`}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1EDE4] border border-[#E5E1D8] text-[#2D2926] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#5C6E58]" />
                            <span>{otherPhone}</span>
                          </a>
                        )}

                        {otherUser && (
                          <button
                            type="button"
                            onClick={() => onOpenChatWithUser(otherUser)}
                            className="px-3.5 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Live Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Controls */}
                <div className="p-4 sm:p-5 bg-[#FDFCF9] border-t border-[#E5E1D8] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] text-[#8C867E]">
                    Created {new Date(b.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Worker pending acceptance controls */}
                    {isWorker && b.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-xl bg-[#F1EDE4] hover:bg-red-50 text-red-600 border border-[#E5E1D8] text-xs font-bold cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(b.id, 'accepted')}
                          className="px-4 py-1.5 rounded-xl bg-[#5C6E58] hover:bg-[#4A5947] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                        >
                          Accept Booking
                        </button>
                      </>
                    )}

                    {/* Mark in progress or completed */}
                    {isWorker && b.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        className="px-4 py-1.5 rounded-xl bg-[#5C6E58] hover:bg-[#4A5947] text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Job Completed</span>
                      </button>
                    )}

                    {/* Client Review button after completion */}
                    {!isWorker && b.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForReview(b)}
                        className="px-4 py-1.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Leave Verified Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          isOpen={Boolean(selectedBookingForReview)}
          onClose={() => setSelectedBookingForReview(null)}
          booking={selectedBookingForReview}
          currentUser={currentUser}
          onSuccess={() => {
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};
