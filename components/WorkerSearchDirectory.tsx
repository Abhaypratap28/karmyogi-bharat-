import React, { useState } from 'react';
import {
  Search,
  MapPin,
  ArrowUpDown,
  Star,
  ShieldCheck,
  Briefcase,
  IndianRupee,
  Clock,
  Award,
  Filter,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Lock,
  Phone,
  Layers,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import { OCCUPATIONS, User } from '../types';
import { useLanguage } from './LanguageContext';

interface WorkerSearchDirectoryProps {
  workers: User[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedOccupation: string;
  setSelectedOccupation: (occ: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onSelectWorker: (worker: User) => void;
  onBookWorker: (worker: User) => void;
  onStartChat: (worker: User) => void;
  currentUser: User | null;
  onOpenRegister: (role?: 'worker' | 'seeker') => void;
  userCity: string;
  onDetectLocation: () => void;
  isLocating: boolean;
}

const OCCUPATION_FILTERS = ['All', ...OCCUPATIONS] as const;

export const WorkerSearchDirectory: React.FC<WorkerSearchDirectoryProps> = ({
  workers,
  isLoading,
  searchQuery,
  setSearchQuery,
  selectedOccupation,
  setSelectedOccupation,
  sortBy,
  setSortBy,
  onSelectWorker,
  onBookWorker,
  onStartChat,
  currentUser,
  onOpenRegister,
  userCity,
  onDetectLocation,
  isLocating,
}) => {
  const { t } = useLanguage();
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const filteredWorkers = workers.filter((w) => {
    if (showVerifiedOnly && !w.isVerified) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Search & Filter Section */}
      <div className="relative rounded-2xl bg-white border border-[#E5E1D8] p-6 sm:p-8 shadow-sm overflow-hidden">
        {/* Subtle ambient tone */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#DBCBB0]/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#5C6E58]" />
            <span>{t('verifiedMarketplace')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-[#2D2926] tracking-tight leading-tight">
            {t('nearbyCertified')}
          </h1>

          <p className="text-sm text-[#8C867E] leading-relaxed max-w-2xl">
            {t('heroDescription')}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button onClick={onDetectLocation} disabled={isLocating} className="px-3 py-2 rounded-lg bg-[#5C6E58] hover:bg-[#4A5947] disabled:opacity-60 text-white font-bold flex items-center gap-1.5">
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? t('locating') : t('location')}
            </button>
            <span className="text-[#8C867E] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> {userCity}. {t('distance')}</span>
          </div>

          {/* Search Inputs & Sort Controls */}
          <div className="pt-2 flex flex-col md:flex-row gap-3">
            {/* Search query input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8C867E]" />
              <input
                type="text"
                placeholder="Search by occupation, skill (e.g. Modular kitchen, Rewiring) or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="main-search-input"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2D2926] placeholder-[#8C867E]"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0 flex items-center gap-2">
              <div className="relative w-full md:w-56">
                <ArrowUpDown className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8B5E3C] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  id="sort-by-select"
                  className="w-full pl-10 pr-8 py-3 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] focus:border-[#8B5E3C] text-xs font-bold text-[#2D2926] cursor-pointer appearance-none"
                >
                  <option value="distance">📍 Distance (Nearest First)</option>
                  <option value="rate_asc">💰 Price: Low to High (₹/hr)</option>
                  <option value="rate_desc">💎 Price: High to Low (₹/hr)</option>
                  <option value="rating">⭐ Highest Client Rating</option>
                  <option value="experience">🏆 Most Experienced (Years)</option>
                </select>
              </div>

              {/* Location Pill Quick refresh */}
              <button
                onClick={onDetectLocation}
                title="Refresh live GPS coordinates and sort nearby workers"
                className="p-3 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] text-[#423E3B] hover:text-[#8B5E3C] transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* A select keeps the full occupation catalogue usable on small screens. */}
          <label className="mt-2 flex max-w-md items-center gap-2 text-xs font-bold text-[#423E3B]">
            <Filter className="h-4 w-4 text-[#8B5E3C]" />
            <span>Occupation</span>
            <select
              value={selectedOccupation}
              onChange={(event) => setSelectedOccupation(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#E5E1D8] bg-[#F1EDE4] px-2.5 py-2 text-xs font-semibold text-[#2D2926]"
            >
              {OCCUPATION_FILTERS.map((occupation) => <option key={occupation} value={occupation}>{occupation}</option>)}
            </select>
          </label>
          </div>

          <div className="relative w-full md:w-[34%] lg:w-[31%] shrink-0 aspect-[4/3] overflow-hidden rounded-2xl border-4 border-white shadow-lg rotate-1">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&auto=format&fit=crop&q=85"
              alt="Karmyogi skilled worker shaping a better home"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-[#2D2926]/85 px-3 py-2 text-white backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E7C99D]">Karmyogi Bharat</p>
              <p className="mt-0.5 text-xs font-semibold">Skill. Trust. Opportunity.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Results Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold font-display text-[#2D2926]">
            Registered Verified Professionals
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F1EDE4] text-[#423E3B] font-bold border border-[#E5E1D8]">
            {filteredWorkers.length} available
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#423E3B] font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showVerifiedOnly}
              onChange={(e) => setShowVerifiedOnly(e.target.checked)}
              className="rounded bg-[#F1EDE4] border-[#E5E1D8] text-[#5C6E58] focus:ring-[#5C6E58]"
            />
            <span>{t('verifiedOnly')}</span>
          </label>
        </div>
      </div>

      {/* Workers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-[#E5E1D8] animate-pulse" />
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-[#E5E1D8]">
          <Briefcase className="w-12 h-12 text-[#8C867E] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#2D2926]">No Workers Found in this Category</h3>
          <p className="text-xs text-[#8C867E] max-w-sm mx-auto mt-1">
            Try adjusting your search keywords or explore all occupation categories.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedOccupation('All');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-xs font-bold text-[#8B5E3C] transition-colors cursor-pointer border border-[#E5E1D8]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="rounded-2xl bg-white border border-[#E5E1D8] hover:border-[#8B5E3C] transition-all duration-300 p-5 flex flex-col justify-between group shadow-sm hover:shadow-md relative overflow-hidden"
            >
              {/* Card Header: Avatar, Name, Badge, Distance */}
              <div>
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={worker.profilePic}
                      alt={worker.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#E5E1D8] group-hover:border-[#8B5E3C] transition-colors shadow-sm"
                    />
                    {worker.isVerified && (
                      <div
                        className="absolute -bottom-1 -right-1 bg-[#5C6E58] text-white p-0.5 rounded-full ring-2 ring-white"
                        title="Aadhaar and Police Verification Completed"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3
                        onClick={() => onSelectWorker(worker)}
                        className="text-sm font-bold text-[#2D2926] hover:text-[#8B5E3C] transition-colors truncate cursor-pointer"
                      >
                        {worker.name}
                      </h3>
                    </div>

                    <p className="text-xs font-bold text-[#8B5E3C] mt-0.5">{worker.occupation}</p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8C867E]">
                      <div className="flex items-center gap-1 text-[#8B5E3C] font-bold">
                        <Star className="w-3 h-3 fill-[#8B5E3C] text-[#8B5E3C]" />
                        <span>{worker.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-[#8C867E] font-normal">({worker.reviewCount || 0})</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-[#423E3B]">
                        <Award className="w-3 h-3 text-[#8C867E]" />
                        <span>{worker.experienceYears}y exp</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Distance & City Indicator */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F1EDE4] border border-[#E5E1D8] mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[#423E3B] truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                    <span className="truncate">{worker.city}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] font-bold text-[11px] shrink-0 border border-[#D2E0D0]">
                    <Navigation className="w-2.5 h-2.5" />
                    <span>{worker.distanceKm ? `${worker.distanceKm} km away` : 'Nearby'}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {worker.skills?.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F1EDE4] text-[#423E3B] border border-[#E5E1D8]"
                    >
                      {skill}
                    </span>
                  ))}
                  {(worker.skills?.length || 0) > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-[#8C867E]">
                      +{(worker.skills?.length || 0) - 3} more
                    </span>
                  )}
                </div>

                {/* Pricing summary */}
                <div className="flex items-baseline justify-between pt-2 border-t border-[#E5E1D8] mb-4">
                  <div>
                    <span className="text-[10px] text-[#8C867E] block">Hourly Rate</span>
                    <span className="text-base font-extrabold text-[#2D2926] font-display">
                      ₹{worker.ratePerHour}
                      <span className="text-xs font-normal text-[#8C867E]">/hr</span>
                    </span>
                  </div>

                  {worker.ratePerMonth && (
                    <div className="text-right">
                      <span className="text-[10px] text-[#8C867E] block">Monthly Contract</span>
                      <span className="text-xs font-bold text-[#8B5E3C]">
                        ₹{worker.ratePerMonth.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectWorker(worker)}
                  id={`view-profile-${worker.id}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-[#E5E1D8]"
                >
                  <span>Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C867E]" />
                </button>

                <button
                  type="button"
                  onClick={() => onBookWorker(worker)}
                  id={`hire-worker-${worker.id}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Select / Hire</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
