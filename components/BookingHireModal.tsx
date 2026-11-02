import React, { useState } from 'react';
import {
  X,
  Briefcase,
  Calendar,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Lock,
} from 'lucide-react';
import { User, Booking } from '../types';

interface BookingHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: User | null;
  currentUser: User | null;
  onBookingCreated: (booking: Booking) => void;
  onOpenLogin: () => void;
}

export const BookingHireModal: React.FC<BookingHireModalProps> = ({
  isOpen,
  onClose,
  worker,
  currentUser,
  onBookingCreated,
  onOpenLogin,
}) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [serviceDate, setServiceDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [serviceTime, setServiceTime] = useState('10:00 AM');
  const [agreedRate, setAgreedRate] = useState<string>('');
  const [rateType, setRateType] = useState<'hour' | 'month' | 'project'>('hour');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  if (!isOpen || !worker) return null;

  const currentRate = agreedRate || String(worker.ratePerHour || 350);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (!projectTitle.trim() || !projectDescription.trim()) {
      setError('Please provide a project title and description.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        seekerId: currentUser.id,
        workerId: worker.id,
        projectTitle,
        projectDescription,
        serviceDate,
        serviceTime,
        agreedRate: Number(currentRate),
        rateType,
      };

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBookingSuccess(data.booking);
        onBookingCreated(data.booking);
      } else {
        setError(data.error || 'Failed to create booking.');
      }
    } catch (err) {
      setError('Network error while booking worker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#F9F7F2] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-white p-6 border-b border-[#E5E1D8] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0] uppercase tracking-wider">
                Direct Work Booking & Hire
              </span>
              <span className="text-[10px] text-[#5C6E58] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Instant Notification</span>
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-[#2D2926] mt-1">
              Book {worker.name}
            </h2>
            <p className="text-xs text-[#8C867E]">
              {worker.occupation} • ₹{worker.ratePerHour}/hr • {worker.city}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If booking was just created successfully, show confirmation screen */}
        {bookingSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold font-display text-[#2D2926]">
              Booking Request Sent to {worker.name}!
            </h3>

            <p className="text-xs text-[#8C867E] max-w-md mx-auto leading-relaxed">
              Worker has received an instant notification on KARMYOGI. Once accepted, real-time messaging is enabled and mutual contact numbers & directions are shared.
            </p>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] text-left space-y-2 max-w-md mx-auto text-xs shadow-sm">
              <div className="flex justify-between">
                <span className="text-[#8C867E]">Booking ID:</span>
                <span className="font-mono text-[#8B5E3C] font-bold">{bookingSuccess.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C867E]">Scheduled Date:</span>
                <span className="text-[#2D2926] font-semibold">{bookingSuccess.serviceDate} ({bookingSuccess.serviceTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C867E]">Agreed Rate:</span>
                <span className="text-[#5C6E58] font-bold">₹{bookingSuccess.agreedRate} / {bookingSuccess.rateType}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Done / View My Bookings
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Project Title */}
            <div>
              <label className="block text-xs font-bold text-[#423E3B] mb-1">
                Project / Service Requirement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modular Kitchen Hinge Repair & Alignment"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Preferred Date *</label>
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Preferred Time Slot *</label>
                <select
                  value={serviceTime}
                  onChange={(e) => setServiceTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926]"
                >
                  <option value="09:00 AM">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="01:00 PM">Afternoon (01:00 PM - 04:00 PM)</option>
                  <option value="05:00 PM">Evening (05:00 PM - 08:00 PM)</option>
                  <option value="Emergency Immediate">Emergency / Immediate Dispatch</option>
                </select>
              </div>
            </div>

            {/* Rate Offer & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Offered Rate (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-[#8C867E] font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="50"
                    placeholder={String(worker.ratePerHour || 350)}
                    value={agreedRate}
                    onChange={(e) => setAgreedRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Billing Basis</label>
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926]"
                >
                  <option value="hour">Per Hour (₹ / hr)</option>
                  <option value="project">Fixed Lump-Sum Project (₹)</option>
                  <option value="month">Monthly Retainer (₹ / mo)</option>
                </select>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-[#423E3B] mb-1">
                Detailed Work Description & Site Location Notes *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Mention specific tasks, floor number, gate entry instructions, material availability..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
              />
            </div>

            {/* Mutual exchange notice */}
            <div className="p-3.5 rounded-2xl bg-[#EBF2EA] border border-[#D2E0D0] text-xs text-[#423E3B] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#5C6E58]">
                <Lock className="w-3.5 h-3.5" />
                <span>What Happens After You Select / Book:</span>
              </div>
              <ul className="text-[11px] text-[#8C867E] space-y-1 list-disc pl-4">
                <li>Worker receives an instant bell notification and booking proposal.</li>
                <li>Upon confirmation, real-time messaging is unlocked automatically.</li>
                <li>Mutual phone numbers, verified profile photos, and exact live GPS locations are exchanged securely.</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-xs font-bold text-[#2D2926] transition-colors cursor-pointer border border-[#E5E1D8]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                id="confirm-booking-submit-btn"
                className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Request...' : 'Confirm & Send Hire Notification'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
