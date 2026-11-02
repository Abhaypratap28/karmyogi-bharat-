import React, { useState } from 'react';
import { X, Star, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Booking, User } from '../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  currentUser: User | null;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUser,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [tagsInput, setTagsInput] = useState('Punctual, Master Finishing, Fair Pricing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write your review feedback.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: booking.workerId,
          seekerId: currentUser.id,
          bookingId: booking.id,
          rating,
          comment,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setError('Network error submitting review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#F9F7F2] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-white p-5 border-b border-[#E5E1D8] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0] uppercase tracking-wider">
              Verified Client Review
            </span>
            <h3 className="text-lg font-bold font-display text-[#2D2926] mt-1">
              Rate {booking.workerName}
            </h3>
            <p className="text-xs text-[#8C867E]">{booking.projectTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Star Selector */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold text-[#423E3B] uppercase tracking-wider">
              Workmanship & Service Quality
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(rating)}
                  className="p-1 transition-transform hover:scale-125 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-[#8B5E3C] text-[#8B5E3C]'
                        : 'text-[#DBCBB0]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-[#8B5E3C] font-bold">
              {rating === 5 && 'Outstanding Work (5.0)'}
              {rating === 4 && 'Great Workmanship (4.0)'}
              {rating === 3 && 'Average Service (3.0)'}
              {rating <= 2 && 'Needs Improvement'}
            </p>
          </div>

          {/* Review Feedback */}
          <div>
            <label className="block text-xs font-bold text-[#423E3B] mb-1">
              Detailed Client Feedback *
            </label>
            <textarea
              required
              rows={3}
              placeholder="How was the punctuality, finishing, tool handling, and behavioral etiquette?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-xs text-[#2D2926] placeholder-[#8C867E] focus:border-[#8B5E3C]"
            />
          </div>

          {/* Key tags */}
          <div>
            <label className="block text-xs font-bold text-[#423E3B] mb-1">
              Positive Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E1D8] text-xs text-[#2D2926] focus:border-[#8B5E3C]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] text-xs font-bold border border-[#E5E1D8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Posting Review...' : 'Publish Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
