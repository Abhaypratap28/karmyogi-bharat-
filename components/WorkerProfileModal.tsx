import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Star,
  MapPin,
  Award,
  Briefcase,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  FileText,
  Lock,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { User, Review } from '../types';

interface WorkerProfileModalProps {
  worker: User | null;
  onClose: () => void;
  onBook: (worker: User) => void;
  onChat: (worker: User) => void;
  currentUser: User | null;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  worker,
  onClose,
  onBook,
  onChat,
  currentUser,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'credentials'>('portfolio');
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (!worker) return;
    setIsLoadingReviews(true);
    fetch(`/api/reviews/${worker.id}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setReviews([]);
      })
      .finally(() => setIsLoadingReviews(false));
  }, [worker]);

  if (!worker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#F9F7F2] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header with Cover & Worker Summary */}
        <div className="relative bg-white p-6 border-b border-[#E5E1D8]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={worker.profilePic}
                alt={worker.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#8B5E3C]/40 shadow-sm"
              />
              {worker.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-[#5C6E58] text-white p-1 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-display text-[#2D2926]">{worker.name}</h2>
                {worker.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Aadhaar Verified</span>
                  </span>
                )}
              </div>

              <p className="text-sm font-bold text-[#8B5E3C] mt-0.5">{worker.occupation}</p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#8C867E]">
                <div className="flex items-center gap-1 text-[#8B5E3C] font-bold">
                  <Star className="w-3.5 h-3.5 fill-[#8B5E3C] text-[#8B5E3C]" />
                  <span>{worker.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-[#8C867E] font-normal">({worker.reviewCount || 0} reviews)</span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1 text-[#423E3B]">
                  <Award className="w-3.5 h-3.5 text-[#8C867E]" />
                  <span>{worker.experienceYears} Years Exp</span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1 text-[#5C6E58] font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{worker.distanceKm ? `${worker.distanceKm} km away` : worker.city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Key stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-[#E5E1D8]">
            <div className="p-2.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8]">
              <span className="text-[10px] text-[#8C867E] uppercase font-semibold block">Hourly Rate</span>
              <span className="text-sm font-bold text-[#2D2926]">₹{worker.ratePerHour} / hr</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8]">
              <span className="text-[10px] text-[#8C867E] uppercase font-semibold block">Monthly Retainer</span>
              <span className="text-sm font-bold text-[#8B5E3C]">
                {worker.ratePerMonth ? `₹${worker.ratePerMonth.toLocaleString('en-IN')}` : 'Negotiable'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8]">
              <span className="text-[10px] text-[#8C867E] uppercase font-semibold block">Completed Works</span>
              <span className="text-sm font-bold text-[#2D2926]">{worker.completedJobsCount || 120}+ Jobs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8]">
              <span className="text-[10px] text-[#8C867E] uppercase font-semibold block">Age & City</span>
              <span className="text-sm font-bold text-[#2D2926]">{worker.age} yrs • {worker.city.split(',')[0]}</span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#E5E1D8] bg-white">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'portfolio'
                ? 'border-[#5C6E58] text-[#5C6E58]'
                : 'border-transparent text-[#8C867E] hover:text-[#2D2926]'
            }`}
          >
            Portfolio & Craftsmanship
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#5C6E58] text-[#5C6E58]'
                : 'border-transparent text-[#8C867E] hover:text-[#2D2926]'
            }`}
          >
            Verified Client Reviews ({reviews.length})
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-[#5C6E58] text-[#5C6E58]'
                : 'border-transparent text-[#8C867E] hover:text-[#2D2926]'
            }`}
          >
            Identity & Certifications
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-5">
          {/* Tab 1: Portfolio */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#8C867E] uppercase tracking-wider mb-1.5">
                  About & Craft Philosophy
                </h3>
                <p className="text-sm text-[#423E3B] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#E5E1D8]">
                  {worker.bio || 'Verified craftsman specializing in precision execution and durable materials.'}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#8C867E] uppercase tracking-wider mb-2">
                  Key Skills & Techniques
                </h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] text-[#423E3B] text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#8C867E] uppercase tracking-wider mb-3">
                  Completed Showcase Projects
                </h3>
                {worker.portfolio && worker.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {worker.portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-white border border-[#E5E1D8] overflow-hidden group shadow-sm"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="p-3">
                          <div className="flex items-center justify-between text-[10px] text-[#8B5E3C] mb-1">
                            <span className="font-semibold">{item.category}</span>
                            <span className="text-[#8C867E]">{item.completedDate}</span>
                          </div>
                          <h4 className="text-xs font-bold text-[#2D2926]">{item.title}</h4>
                          <p className="text-[11px] text-[#8C867E] mt-1 leading-snug">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-white border border-[#E5E1D8]">
                    <p className="text-xs text-[#8C867E]">Portfolio showcase images available on site inspection.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {isLoadingReviews ? (
                <p className="text-xs text-[#8C867E] py-4 text-center">Loading verified reviews...</p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-[#E5E1D8]">
                  <Star className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
                  <p className="text-xs text-[#8C867E]">No client reviews yet. Be the first to book and rate!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-white border border-[#E5E1D8] space-y-2 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.seekerPic}
                          alt={rev.seekerName}
                          className="w-8 h-8 rounded-lg object-cover border border-[#E5E1D8]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#2D2926]">{rev.seekerName}</p>
                          <p className="text-[10px] text-[#8C867E]">{rev.serviceName} • {rev.seekerCity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[#8B5E3C]">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#8B5E3C] text-[#8B5E3C]" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#423E3B] leading-relaxed italic">"{rev.comment}"</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rev.tags?.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-2 py-0.5 rounded bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0] font-bold"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Credentials */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EBF2EA] border border-[#D2E0D0] flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-[#5C6E58] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#5C6E58]">Aadhaar & Background Security Clearance</h4>
                  <p className="text-[11px] text-[#423E3B] mt-1 leading-relaxed">
                    This worker has completed identity verification under Indian Digital Governance norms. Aadhaar card number, police clearance records, and physical address are recorded.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs">
                  <span className="text-[#8C867E]">Aadhaar Number (UIDAI Token)</span>
                  <span className="font-mono text-[#2D2926] font-semibold">{worker.aadhaarNumber}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs">
                  <span className="text-[#8C867E]">ID Proof Document</span>
                  <span className="text-[#5C6E58] font-bold">{worker.idProofDocument || 'Aadhaar_Verified.pdf'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs">
                  <span className="text-[#8C867E]">Background Certificate</span>
                  <span className="text-[#8B5E3C] font-bold">{worker.backgroundCert || 'Police_Clearance_Noida.pdf'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs">
                  <span className="text-[#8C867E]">Registered Address</span>
                  <span className="text-[#2D2926] truncate max-w-xs">{worker.address}, {worker.city}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Book & Message */}
        <div className="p-6 bg-white border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#8C867E]">
            <span>Direct rate: </span>
            <strong className="text-[#8B5E3C] text-sm">₹{worker.ratePerHour}/hr</strong>
            <span> • Mutual contacts shared after booking</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onChat(worker)}
              id="profile-chat-btn"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#E5E1D8]"
            >
              <MessageSquare className="w-4 h-4 text-[#8B5E3C]" />
              <span>Direct Chat</span>
            </button>

            <button
              onClick={() => onBook(worker)}
              id="profile-book-btn"
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Select & Book Worker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
