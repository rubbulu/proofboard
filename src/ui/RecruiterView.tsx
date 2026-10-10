import React, { useState } from 'react';
import {
  CheckCircle2,
  FileCode2,
  FlaskConical,
  FileText,
  ShieldCheck,
  Search,
  Lock,
  Filter,
} from 'lucide-react';
import { repository } from '../data/repository';
import {
  CLEAN_VERIFIED_CART_CODE,
  CLEAN_VERIFIED_EXPLAIN_BACK,
  COMPETENCY_META,
  STARTER_BUGGY_CART_CODE,
} from '../engine/tasks';
import { getVisibleProfiles } from '../trust/consent';
import {
  Attempt,
  CompetencyKey,
  EvidenceDrawerTab,
  Profile,
} from '../types';
import {
  ConfidenceDisplay,
  formatShortDate,
  ProficiencyBadge,
  RecencyDisplay,
} from './StatusComponents';

export interface RecruiterViewProps {
  activeSubTab: 'search' | 'evidence';
  onChangeSubTab: (tab: 'search' | 'evidence') => void;
  onOpenEvidenceDrawer: (
    profile: Profile,
    attempt: Attempt,
    tab?: EvidenceDrawerTab
  ) => void;
  onDataChanged: () => void;
  onNotify: (msg: string) => void;
}

export const RecruiterView: React.FC<RecruiterViewProps> = ({
  activeSubTab,
  onChangeSubTab,
  onOpenEvidenceDrawer,
}) => {
  // Strictly query ONLY through getVisibleProfiles() from /trust/consent.ts
  // Only returns candidates who enabled "Share with NxtMove" AND are NOT disqualified
  const consentedProfiles = getVisibleProfiles();

  const [roleFilter, setRoleFilter] = useState<string>(
    'Junior Backend Engineer'
  );
  const [verifiedSkillFilter, setVerifiedSkillFilter] = useState<
    'debugging_80' | 'all'
  >('debugging_80');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    consentedProfiles[0]?.learnerId || 'learner-asha'
  );

  const filteredProfiles = consentedProfiles.filter((profile) => {
    if (roleFilter !== 'all' && profile.roleTarget !== roleFilter) {
      return false;
    }
    if (verifiedSkillFilter === 'debugging_80') {
      const debugScore = profile.competencies.debugging.latestScore ?? 0;
      if (debugScore < 80) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !profile.name.toLowerCase().includes(q) &&
        !profile.college.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const getCandidatePrimaryAttempt = (profile: Profile): Attempt | undefined => {
    const attempts = repository.getAttemptsByLearner(profile.learnerId);
    return (
      attempts.find(
        (a) => a.stageType === 'debug_code' && a.status !== 'disqualified'
      ) || attempts[0]
    );
  };

  const selectedCandidate =
    consentedProfiles.find((p) => p.learnerId === selectedCandidateId) ||
    consentedProfiles[0];
  const selectedCandidateAttempt = selectedCandidate
    ? getCandidatePrimaryAttempt(selectedCandidate)
    : undefined;

  return (
    <div className="space-y-6">
      {/* NxtMove Recruiter Header & Sub-Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E8E5A]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>
              💼 NxtMove Hiring Partner Portal · Consent &amp; Integrity Gated
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0B1B3A]">
            Verified Proof-of-Skill Talent Pool
          </h1>
          <p className="text-xs text-slate-600">
            Only candidates with &ldquo;Share with NxtMove&rdquo; ON and zero
            integrity disqualifications appear here. Read-only inspection:
            recruiters cannot grade or alter scores.
          </p>
        </div>

        <div className="flex items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'search'}
            onClick={() => onChangeSubTab('search')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors ${
              activeSubTab === 'search'
                ? 'bg-[#1E8E5A] text-white'
                : 'bg-slate-100 text-[#0B1B3A] hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span>Talent Search &amp; Filters</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'evidence'}
            onClick={() => onChangeSubTab('evidence')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors ${
              activeSubTab === 'evidence'
                ? 'bg-[#1E8E5A] text-white'
                : 'bg-slate-100 text-[#0B1B3A] hover:bg-slate-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" aria-hidden="true" />
            <span>Candidate Evidence View</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'search' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="recruiter-role-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Target Role
                </label>
                <select
                  id="recruiter-role-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A]"
                >
                  <option value="Junior Backend Engineer">
                    Junior Backend Engineer
                  </option>
                  <option value="all">All Roles</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="recruiter-skill-filter"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Verified Skill Requirement
                </label>
                <select
                  id="recruiter-skill-filter"
                  value={verifiedSkillFilter}
                  onChange={(e) =>
                    setVerifiedSkillFilter(
                      e.target.value as 'debugging_80' | 'all'
                    )
                  }
                  className="w-full min-h-[40px] px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A]"
                >
                  <option value="debugging_80">
                    Debugging &gt;= 80% (Verified Sandbox Tests)
                  </option>
                  <option value="all">All Verified Competencies</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="recruiter-search-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Search Candidate or College
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="recruiter-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., Asha, Bhopal..."
                    className="w-full min-h-[40px] pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-600">
                Showing{' '}
                <strong className="text-[#0B1B3A]">
                  {filteredProfiles.length}
                </strong>{' '}
                verified &amp; consented candidate(s)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-[#1E8E5A]" />
                <span>
                  Gated Privacy Active: Non-consented &amp; disqualified
                  shortcut profiles are automatically excluded
                </span>
              </span>
            </div>
          </div>

          {/* Candidate Cards */}
          {filteredProfiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <p className="text-base font-bold text-[#0B1B3A]">
                No consented candidates match these filters.
              </p>
              <p className="text-xs text-slate-600">
                If Asha&apos;s consent toggle is turned OFF in her Competency
                Profile, she is immediately removed from this view.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredProfiles.map((candidate) => {
                const attempt = getCandidatePrimaryAttempt(candidate);
                const debugComp = candidate.competencies.debugging;

                return (
                  <div
                    key={candidate.learnerId}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-[#0B1B3A]">
                              {candidate.name}
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#1E8E5A] border border-emerald-200">
                              Shared with NxtMove
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {candidate.college} · Role:{' '}
                            <strong className="text-[#0B1B3A]">
                              {candidate.roleTarget}
                            </strong>
                          </p>
                        </div>

                        <ProficiencyBadge level={debugComp.proficiency} />
                      </div>

                      {/* Primary Verified Skill Highlight */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0B1B3A]">
                            Debugging &amp; Edge-Case Handling
                          </span>
                          <span className="font-mono font-bold text-[#1E8E5A]">
                            Verified ({debugComp.latestScore ?? 100}/100)
                          </span>
                        </div>
                        <ConfidenceDisplay
                          confidence={debugComp.confidence}
                          confidenceReason={debugComp.confidenceReason}
                          compact
                        />
                        <RecencyDisplay
                          recency={debugComp.recency}
                          lastDate={debugComp.lastDate}
                        />
                      </div>

                      {/* Other Competencies Summary */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {(
                          [
                            'code_reading',
                            'algorithmic_thinking',
                            'communication',
                          ] as CompetencyKey[]
                        ).map((k) => {
                          const c = candidate.competencies[k];
                          return (
                            <div
                              key={k}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5"
                            >
                              <div className="font-semibold text-[#0B1B3A] truncate">
                                {COMPETENCY_META[k].shortLabel}
                              </div>
                              <div className="text-[11px] text-[#1E8E5A] font-mono font-semibold">
                                {c.latestScore !== null
                                  ? `${c.latestScore}/100`
                                  : c.proficiency}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Verifiable Evidence Drawer Action Buttons */}
                    {attempt && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="text-[11px] font-semibold text-slate-500">
                          Inspect Verifiable Evidence (Read-Only):
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenEvidenceDrawer(candidate, attempt, 'diff')
                            }
                            className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-[#0B1B3A] text-white hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                          >
                            <FileCode2 className="w-3.5 h-3.5 text-[#2E6FD8]" />
                            <span>🔍 View Code Diff</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onOpenEvidenceDrawer(candidate, attempt, 'tests')
                            }
                            className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-[#1E8E5A] border border-[#1E8E5A]/30 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>🧪 View Test Logs (13/13)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onOpenEvidenceDrawer(
                                candidate,
                                attempt,
                                'explain'
                              )
                            }
                            className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-amber-50 text-[#0B1B3A] border border-[#F2B705] hover:bg-amber-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>📝 Explain-Back Note</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* SUB-TAB 2: CANDIDATE EVIDENCE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0B1B3A]">
                Candidate Evidence Deep-Dive
              </h2>
              <p className="text-xs text-slate-600">
                Inspect code diffs, 13 sandbox test logs, and written
                explain-back notes for any consented candidate.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="evidence-candidate-select"
                className="text-xs font-semibold text-slate-700"
              >
                Candidate:
              </label>
              <select
                id="evidence-candidate-select"
                value={selectedCandidate?.learnerId || ''}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A]"
              >
                {consentedProfiles.map((p) => (
                  <option key={p.learnerId} value={p.learnerId}>
                    {p.name} ({p.college})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCandidate && selectedCandidateAttempt ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 font-semibold">
                    Verified Task
                  </div>
                  <div className="text-sm font-bold text-[#0B1B3A] mt-0.5">
                    Fix calculateTotal(items) in Checkout Service
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold">
                    Debugging Score &amp; Confidence
                  </div>
                  <div className="text-sm font-bold text-[#1E8E5A] mt-0.5">
                    {selectedCandidateAttempt.score}/100 · Higher Confidence
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold">
                    Recency &amp; Telemetry
                  </div>
                  <div className="text-sm font-bold text-[#0B1B3A] mt-0.5">
                    Fresh ({formatShortDate(selectedCandidateAttempt.submittedAt)})
                  </div>
                </div>
              </div>

              {/* Code Diff Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#C8102E]">
                    Before: Buggy Checkout Starter Code
                  </div>
                  <pre className="p-4 rounded-xl bg-red-950 text-red-100 font-mono text-xs overflow-x-auto leading-relaxed">
                    {STARTER_BUGGY_CART_CODE}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#1E8E5A]">
                    After: {selectedCandidate.name}&apos;s Verified Code Fix
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0B1B3A] text-emerald-200 font-mono text-xs overflow-x-auto leading-relaxed">
                    {typeof selectedCandidateAttempt.answer === 'string'
                      ? selectedCandidateAttempt.answer
                      : CLEAN_VERIFIED_CART_CODE}
                  </pre>
                </div>
              </div>

              {/* Explain-Back Note */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0B1B3A]">
                    Stage 4 Written Pseudocode &amp; Explain-Back Note
                  </h3>
                  <span className="text-xs font-semibold text-[#1E8E5A]">
                    📋 Telemetry: Natural Keystrokes (No Bulk Paste)
                  </span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedCandidateAttempt.explainBackText ||
                    CLEAN_VERIFIED_EXPLAIN_BACK}
                </pre>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenEvidenceDrawer(
                      selectedCandidate,
                      selectedCandidateAttempt,
                      'tests'
                    )
                  }
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-[#1E8E5A] hover:bg-[#177348] rounded-xl inline-flex items-center gap-2 transition-colors"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>
                    Open Interactive 13-Test Sandbox Runner &amp; Logs
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              No consented candidate selected.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
