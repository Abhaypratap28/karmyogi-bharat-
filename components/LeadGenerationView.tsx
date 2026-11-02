import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  MapPin,
  Clock,
  IndianRupee,
  Plus,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  Users,
  Wand2,
} from 'lucide-react';
import { JobLead, OCCUPATIONS, Occupation, User } from '../types';

interface LeadGenerationViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onSelectWorkerById: (workerId: string) => void;
  userCity: string;
  userCoords: { lat: number; lng: number };
}

const OCCUPATION_OPTIONS: readonly Occupation[] = OCCUPATIONS;

export const LeadGenerationView: React.FC<LeadGenerationViewProps> = ({
  currentUser,
  onOpenLogin,
  onSelectWorkerById,
  userCity,
  userCoords,
}) => {
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOccupation, setSelectedOccupation] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [leadProposals, setLeadProposals] = useState<Record<string, any[]>>({});
  const [proposalMessage, setProposalMessage] = useState<Record<string, string>>({});
  const [isSubmittingProposal, setIsSubmittingProposal] = useState<Record<string, boolean>>({});

  // New Lead Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [occupation, setOccupation] = useState<Occupation>('Carpenter');
  const [budget, setBudget] = useState('25000');
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly' | 'monthly'>('fixed');
  const [urgency, setUrgency] = useState<'immediate' | 'within_week' | 'flexible'>('immediate');
  const [skills, setSkills] = useState('Modular woodwork, False ceiling');
  const [isPosting, setIsPosting] = useState(false);

  // AI Matching Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAiMatching, setIsAiMatching] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const url =
        selectedOccupation === 'All'
          ? '/api/leads'
          : `/api/leads?occupation=${encodeURIComponent(selectedOccupation)}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedOccupation]);

  const fetchLeadProposals = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/proposals/${leadId}`);
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data)) {
        setLeadProposals((prev) => ({ ...prev, [leadId]: data }));
      }
    } catch {
      // Ignore network noise
    }
  };

  useEffect(() => {
    if (!leads.length) return;
    const refreshProposals = () => leads.forEach((lead) => void fetchLeadProposals(lead.id));
    refreshProposals();
    const interval = window.setInterval(refreshProposals, 5000);
    return () => window.clearInterval(interval);
  }, [leads]);

  const handleSubmitProposal = async (leadId: string) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    const message = (proposalMessage[leadId] || '').trim();
    if (!message) {
      setProposalMessage((prev) => ({ ...prev, [leadId]: 'I am interested in this project and can deliver quality work.' }));
    }

    setIsSubmittingProposal((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch(`/api/leads/${leadId}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: currentUser.id,
          message: (proposalMessage[leadId] || 'I am interested in this project and can deliver quality work.').trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProposalMessage((prev) => ({ ...prev, [leadId]: '' }));
        await fetchLeadProposals(leadId);
        alert('Work proposal sent successfully. The contractor will receive the notification and can accept it.');
      } else {
        alert(data.error || 'Unable to send proposal.');
      }
    } catch {
      alert('Network error while sending work proposal.');
    } finally {
      setIsSubmittingProposal((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const handleAcceptProposal = async (leadId: string, proposalId: string, workerId: string) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    try {
      const res = await fetch(`/api/leads/${leadId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, proposalId, workerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchLeads();
        await fetchLeadProposals(leadId);
        alert('Lead accepted. The worker has been notified and the lead is now matched.');
      } else {
        alert(data.error || 'Unable to accept this proposal.');
      }
    } catch {
      alert('Network error while accepting the lead.');
    }
  };

  const handlePostLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!title.trim() || !description.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: currentUser.id,
          title,
          description,
          occupation,
          budget: Number(budget),
          budgetType,
          address: currentUser.address,
          city: currentUser.city || userCity,
          lat: userCoords.lat,
          lng: userCoords.lng,
          urgency,
          requiredSkills: skills,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPostModal(false);
        setTitle('');
        setDescription('');
        fetchLeads();
      }
    } catch {
      // Graceful error handling
    } finally {
      setIsPosting(false);
    }
  };

  const handleRunAiMatch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiMatching(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDescription: aiPrompt,
          occupation: selectedOccupation !== 'All' ? selectedOccupation : undefined,
          city: userCity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.aiResult);
      }
    } catch {
      // Graceful error handling
    } finally {
      setIsAiMatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Lead Generator Tool Intro */}
      <div className="relative rounded-3xl bg-white border border-[#E5E1D8] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Automated Contractor & Project Lead Matcher</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#2D2926]">
            Streamline Local Subcontracting & Direct Hiring
          </h2>

          <p className="text-xs sm:text-sm text-[#8C867E] leading-relaxed">
            Local builders, architects, and homeowners can post turnkey project requirements. Karmyogi's automated engine dispatches instant lead alerts to nearby qualified tradespeople.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenLogin();
            else setShowPostModal(true);
          }}
          id="post-new-lead-btn"
          className="px-6 py-3.5 rounded-2xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Project Lead</span>
        </button>
      </div>

      {/* AI Smart Matcher & Scope Estimator Bar */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E1D8] space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2D2926]">
              AI Smart Lead Matcher & CPWD Cost Estimator
            </h3>
            <p className="text-[11px] text-[#8C867E]">
              Describe your project requirement in plain words to get fair pricing estimates & top matched workers.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g. Need complete bathroom sanitary fitting with 2 rain showers and CPVC concealed lines in Noida"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunAiMatch()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-xs text-[#2D2926] placeholder-[#8C867E] focus:border-[#8B5E3C]"
          />
          <button
            type="button"
            onClick={handleRunAiMatch}
            disabled={isAiMatching || !aiPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiMatching ? 'Analyzing Scope...' : 'AI Auto-Match'}</span>
          </button>
        </div>

        {/* AI Output Result Box */}
        {aiResult && (
          <div className="p-4 rounded-2xl bg-[#FDFCF9] border border-[#D2E0D0] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B5E3C]">
                Estimated Fair Market Budget: {aiResult.suggestedFairEstimate}
              </span>
              <span className="text-[10px] text-[#5C6E58] bg-[#EBF2EA] px-2 py-0.5 rounded-full border border-[#D2E0D0] font-bold">
                AI Verified
              </span>
            </div>

            <p className="text-xs text-[#423E3B] italic">{aiResult.aiSummary}</p>

            {aiResult.technicalScopePoints && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#8C867E]">Technical Checkpoints:</span>
                <ul className="text-xs text-[#423E3B] list-disc pl-4 space-y-0.5">
                  {aiResult.technicalScopePoints.map((pt: string, i: number) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full occupation filter, shared with registration and profile editing. */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <label className="flex min-w-0 items-center gap-2 text-xs font-bold text-[#423E3B]">
          <Search className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
          <span className="whitespace-nowrap">Occupation</span>
          <select
            value={selectedOccupation}
            onChange={(event) => setSelectedOccupation(event.target.value)}
            className="min-w-0 max-w-64 rounded-lg border border-[#E5E1D8] bg-white px-2.5 py-2 text-xs font-semibold text-[#2D2926]"
          >
            <option value="All">All occupations</option>
            {OCCUPATION_OPTIONS.map((occupation) => <option key={occupation} value={occupation}>{occupation}</option>)}
          </select>
        </label>
        <span className="text-xs text-[#8C867E] whitespace-nowrap">{leads.length} Active Leads</span>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-white border border-[#E5E1D8] animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1D8]">
          <Briefcase className="w-10 h-10 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2D2926]">No Open Project Leads in this Category</h3>
          <p className="text-xs text-[#8C867E] mt-1">Be the first contractor or homeowner to post a requirement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E1D8] hover:border-[#8B5E3C] transition-all flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]">
                      {lead.occupation}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        lead.urgency === 'immediate'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-[#F1EDE4] text-[#423E3B]'
                      }`}
                    >
                      {lead.urgency.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#8C867E] block">Estimated Budget</span>
                    <span className="text-base font-extrabold text-[#5C6E58] font-display">
                      ₹{lead.budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#2D2926] leading-snug">{lead.title}</h3>
                <p className="text-xs text-[#423E3B] mt-1.5 leading-relaxed line-clamp-2">
                  {lead.description}
                </p>

                {/* Location & Creator */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-[#8C867E]">
                  <div className="flex items-center gap-1 text-[#423E3B]">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                    <span>{lead.location.address}, {lead.location.city}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-[#8C867E]">
                    <Building2 className="w-3.5 h-3.5 text-[#8C867E]" />
                    <span>Posted by {lead.creatorName}</span>
                  </div>
                </div>

                {/* Required skills tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {lead.requiredSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#F1EDE4] text-[#423E3B] border border-[#E5E1D8]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-[#E5E1D8] flex flex-col gap-3">
                <span className="text-[10px] text-[#8C867E]">
                  Posted {new Date(lead.createdAt).toLocaleDateString()} • {lead.proposalsCount || 0} proposals
                </span>

                {currentUser && currentUser.role === 'worker' && lead.creatorId !== currentUser.id && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={proposalMessage[lead.id] ?? ''}
                      onChange={(e) => setProposalMessage((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                      placeholder="Write a short message to the contractor..."
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#F9F7F2] text-xs text-[#2D2926] placeholder-[#8C867E]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmitProposal(lead.id)}
                      disabled={isSubmittingProposal[lead.id]}
                      className="px-4 py-1.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingProposal[lead.id] ? 'Sending...' : 'Send Work Proposal'}
                    </button>
                  </div>
                )}

                {currentUser && currentUser.role === 'seeker' && lead.creatorId === currentUser.id && (
                  <div className="space-y-2">
                    {(leadProposals[lead.id] || []).length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-[#E5E1D8] bg-[#F9F7F2] p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C]">Incoming proposals</p>
                        {(leadProposals[lead.id] || []).map((proposal) => (
                          <div key={proposal.id} className="rounded-xl bg-white border border-[#E5E1D8] p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-[#2D2926]">{proposal.workerName}</p>
                                <p className="text-[10px] text-[#8C867E]">{proposal.workerOccupation}</p>
                              </div>
                              {proposal.status === 'accepted' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58]">Accepted</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptProposal(lead.id, proposal.id, proposal.workerId)}
                                  className="px-2.5 py-1 rounded-lg bg-[#5C6E58] text-white text-[10px] font-bold"
                                >
                                  Accept
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-[11px] text-[#423E3B]">{proposal.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#8C867E]">No proposals yet for this lead.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Lead Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#F9F7F2] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="bg-white p-6 border-b border-[#E5E1D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0] uppercase tracking-wider">
                  Contractor & Seeker Project Desk
                </span>
                <h3 className="text-xl font-bold font-display text-[#2D2926] mt-1">
                  Post New Work Requirement
                </h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePostLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 Carpenters needed for 3BHK Penthouse Interior Fitout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] focus:border-[#8B5E3C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Trade Category *</label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value as Occupation)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] focus:border-[#8B5E3C]"
                  >
                    {OCCUPATION_OPTIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Estimated Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] font-bold focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] focus:border-[#8B5E3C]"
                  >
                    <option value="immediate">Immediate (Next 24-48 hrs)</option>
                    <option value="within_week">Within This Week</option>
                    <option value="flexible">Flexible / Planning Phase</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Key Skills Required</label>
                  <input
                    type="text"
                    placeholder="e.g. Teak wood, Lamination"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Detailed Project Scope *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe dimensions, tools required, material provisions, and site location..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] focus:border-[#8B5E3C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] text-xs font-bold border border-[#E5E1D8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-6 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isPosting ? 'Publishing...' : 'Publish Project Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
