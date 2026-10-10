import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  X,
  User,
  Briefcase,
  Scale,
  Mic,
  LogOut,
  Radio,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { AuthPortal } from './ui/AuthPortal';
import { repository } from './data/repository';
import {
  Attempt,
  EvidenceDrawerTab,
  NavigationTabId,
  PersonaMode,
  Profile,
} from './types';
import { DemoView } from './ui/DemoView';
import { EvidenceDrawerModal } from './ui/EvidenceDrawerModal';
import { LearnerAppealsView, LearnerView } from './ui/LearnerView';
import { PitchControllerBar } from './ui/PitchControllerBar';
import { ProfileView } from './ui/ProfileView';
import { RecruiterView } from './ui/RecruiterView';
import { ReviewerView } from './ui/ReviewerView';

interface NavTabConfig {
  id: NavigationTabId;
  label: string;
}

const PERSONA_TABS: Record<PersonaMode, NavTabConfig[]> = {
  learner: [
    { id: 'learner_sandbox', label: 'Task Sandbox' },
    { id: 'learner_profile', label: 'My Competency Profile' },
    { id: 'learner_appeals', label: 'My Appeals' },
  ],
  recruiter: [
    { id: 'recruiter_search', label: 'Talent Search & Filters' },
    { id: 'recruiter_evidence', label: 'Candidate Evidence View' },
  ],
  reviewer: [
    { id: 'reviewer_queue', label: 'Reviewer Console (Queue & Flags)' },
    { id: 'reviewer_audit', label: 'Global Audit Log' },
  ],
  judge: [
    { id: 'learner_sandbox', label: 'Task Sandbox' },
    { id: 'learner_profile', label: 'My Competency Profile' },
    { id: 'learner_appeals', label: 'My Appeals' },
    { id: 'recruiter_search', label: 'Talent Search & Filters' },
    { id: 'recruiter_evidence', label: 'Candidate Evidence View' },
    { id: 'reviewer_queue', label: 'Reviewer Console (Queue & Flags)' },
    { id: 'reviewer_audit', label: 'Global Audit Log' },
    { id: 'demo_architecture', label: 'Pitch Guide' },
  ],
};

interface UserSession {
  name: string;
  role: PersonaMode;
  org: string;
}

const DEFAULT_USER: UserSession = {
  name: 'Asha Sharma',
  role: 'learner',
  org: 'Vindhya Institute of Technology, Bhopal',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(DEFAULT_USER);
  const [persona, setPersona] = useState<PersonaMode>('learner');
  const [showPitchBar, setShowPitchBar] = useState(false);
  const [activeTab, setActiveTab] =
    useState<NavigationTabId>('learner_sandbox');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(1);
  const [reviewerSelectedAttemptId, setReviewerSelectedAttemptId] = useState<
    string | null
  >('att-shortcut-case-a');

  // Evidence Drawer modal state
  const [drawerState, setDrawerState] = useState<{
    profile: Profile;
    attempt: Attempt;
    tab: EvidenceDrawerTab;
  } | null>(null);

  // Force re-render when repository updates
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    return repository.subscribe(refresh);
  }, []);

  const activeLearner = repository.getActiveLearner();

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => setToastMessage(msg);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Enforce Role-Based Access Control when Persona changes
  const handleSelectPersona = (nextPersona: PersonaMode) => {
    setPersona(nextPersona);
    const allowedTabs = PERSONA_TABS[nextPersona];
    if (!allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    }
  };

  // Global 4-Step "3-Minute Pitch Controller" handler
  const handleTriggerPitchPreset = (preset: 1 | 2 | 3 | 4) => {
    const out = repository.runPitchPreset(preset);
    refresh();

    if (preset === 1) {
      // Preset 1 (Fair Pass): Sets Asha to clean code, passes all 13 tests, completes Stage 4 pseudocode, score 100/100, verified profile updated
      setSelectedStageIndex(1);
      setActiveTab('learner_profile');
      triggerToast(out.summary);
    } else if (preset === 2) {
      // Preset 2 (Caught Shortcut): Loads hardcoded `if (price === 10) return 25` in Stage 2, flags Integrity Alert, score Withheld
      setSelectedStageIndex(1);
      setActiveTab('learner_sandbox');
      triggerToast(out.summary);
    } else if (preset === 3) {
      // Preset 3 (Reviewer Action): Switches to Reviewer Console on Case A
      setReviewerSelectedAttemptId('att-shortcut-case-a');
      setActiveTab('reviewer_queue');
      triggerToast(out.summary);
    } else if (preset === 4) {
      // Preset 4 (Recruiter Portal): Switches to NxtMove Recruiter view showing Asha surfaced & cheater excluded
      setActiveTab('recruiter_search');
      triggerToast(out.summary);
    }
  };

  const visibleTabs = PERSONA_TABS[persona];

  const roleAccentBorderClass =
    persona === 'recruiter' ||
    activeTab === 'recruiter_search' ||
    activeTab === 'recruiter_evidence'
      ? 'border-b-2 border-[#1E8E5A]'
      : persona === 'reviewer' ||
        activeTab === 'reviewer_queue' ||
        activeTab === 'reviewer_audit'
      ? 'border-b-2 border-[#F2B705]'
      : 'border-b-2 border-[#2E6FD8]';

  if (!currentUser) {
    return (
      <AuthPortal
        onLogin={(role, userData) => {
          const defaultOrg =
            role === 'learner'
              ? 'Vindhya Institute of Technology, Bhopal'
              : role === 'recruiter'
              ? 'NxtMove Hiring Partner'
              : role === 'reviewer'
              ? 'NavQriti / ISRO HQ'
              : 'Samartha Hackathon Evaluator';
          const defaultName =
            role === 'learner'
              ? 'Asha Sharma'
              : role === 'recruiter'
              ? 'Vikram Rao'
              : role === 'reviewer'
              ? 'Prof. D. Naga Chandra'
              : 'Hackathon Judge';

          if (role === 'learner') {
            if (userData && userData.name && userData.name.trim() !== 'Asha Sharma') {
              const newProf = repository.registerNewLearner(
                userData.name,
                userData.collegeOrCompany || 'Engineering College'
              );
              setCurrentUser({
                name: newProf.name,
                role: 'learner',
                org: newProf.college,
              });
            } else {
              repository.setActiveLearner('learner-asha');
              setCurrentUser({
                name: 'Asha Sharma',
                role: 'learner',
                org: 'Vindhya Institute of Technology, Bhopal',
              });
            }
            setSelectedStageIndex(0);
          } else {
            const user: UserSession = {
              name: userData?.name || defaultName,
              role,
              org: userData?.collegeOrCompany || defaultOrg,
            };
            setCurrentUser(user);
          }
          handleSelectPersona(role);
        }}
        onEnterJudgeMode={() => {
          setCurrentUser({
            name: 'Hackathon Judge / Evaluator',
            role: 'judge',
            org: 'Samartha Hackathon Jury',
          });
          handleSelectPersona('judge');
          setShowPitchBar(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF1F7] text-[#0B1B3A]">
      {/* Global 4-Step "3-Minute Pitch Controller" (Shown when toggled or in Judge mode) */}
      {(showPitchBar || persona === 'judge') && (
        <PitchControllerBar
          activePreset={repository.getActivePitchPreset()}
          onTriggerPreset={handleTriggerPitchPreset}
        />
      )}

      {/* Top Sticky Header with Brand, Role-Gated Navigation Tabs, and Top-Right Current Persona Switcher */}
      <header
        className={`sticky top-0 z-40 bg-white ${roleAccentBorderClass} px-4 sm:px-6 py-3 shadow-2xs`}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Brand Wordmark & Subtitle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab(visibleTabs[0].id)}
                className="text-xl font-bold tracking-tight text-[#0B1B3A] font-display"
              >
                ProofBoard
              </button>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500 border-s border-slate-300 ps-3">
                Nyeras Proof-of-Skill Sandbox → NxtMove Verified Talent
              </span>
            </div>

            {/* Top-Right Current Persona User Pill & Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPitchBar((v) => !v)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-[#0B1B3A] bg-[#F2B705]/20 hover:bg-[#F2B705]/30 border border-[#F2B705]/60 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                title="Toggle 4-step live pitch presets"
              >
                <Radio className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span>{showPitchBar ? 'Hide Pitch Bar' : '🎙️ 3-Min Pitch Presets'}</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-bold text-[#0B1B3A] flex items-center gap-1.5">
                  {currentUser.role === 'learner' && (
                    <GraduationCap className="w-4 h-4 text-[#2E6FD8]" />
                  )}
                  {currentUser.role === 'recruiter' && (
                    <Briefcase className="w-4 h-4 text-[#1E8E5A]" />
                  )}
                  {currentUser.role === 'reviewer' && (
                    <ShieldCheck className="w-4 h-4 text-[#F2B705]" />
                  )}
                  {currentUser.role === 'judge' && (
                    <Radio className="w-4 h-4 text-purple-600" />
                  )}
                  <span>{currentUser.name}</span>
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  · {currentUser.org}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentUser(null)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                title="Sign out or switch portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Portal / Sign Out</span>
              </button>
            </div>
          </div>

          {/* Role-Gated Navigation Bar */}
          <nav
            className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100"
            aria-label="Role-gated navigation tabs"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isRecruiterTab = tab.id.startsWith('recruiter_');
                const isReviewerTab = tab.id.startsWith('reviewer_');

                let activeClass = 'bg-[#2E6FD8] text-white font-semibold';
                if (isRecruiterTab) {
                  activeClass = 'bg-[#1E8E5A] text-white font-semibold';
                } else if (isReviewerTab) {
                  activeClass = 'bg-[#F2B705] text-[#0B1B3A] font-bold';
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? activeClass
                        : 'text-slate-600 hover:text-[#0B1B3A] hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Active RBAC Scope Indicator */}
            <div className="text-[11px] text-slate-500 hidden lg:flex items-center gap-1.5">
              {persona === 'learner' && (
                <>
                  <User className="w-3.5 h-3.5 text-[#2E6FD8]" />
                  <span>
                    RBAC: Recruiter search &amp; Reviewer console hidden
                  </span>
                </>
              )}
              {persona === 'recruiter' && (
                <>
                  <Briefcase className="w-3.5 h-3.5 text-[#1E8E5A]" />
                  <span>
                    RBAC: Read-only consented pool · Grading &amp; Reviewer
                    queue hidden
                  </span>
                </>
              )}
              {persona === 'reviewer' && (
                <>
                  <Scale className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    RBAC: Governance Queue &amp; Immutable Audit Log active
                  </span>
                </>
              )}
              {persona === 'judge' && (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#2E6FD8]" />
                  <span>
                    Judge Mode: All persona tabs + 3-Minute Pitch Controller
                    unlocked
                  </span>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'learner_sandbox' && (
          <LearnerView
            learner={activeLearner}
            selectedStageIndex={selectedStageIndex}
            onSelectStageIndex={setSelectedStageIndex}
            onOpenEvidenceDrawer={(attempt, tab = 'diff') =>
              setDrawerState({
                profile: activeLearner,
                attempt,
                tab,
              })
            }
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'learner_profile' && (
          <ProfileView
            learner={activeLearner}
            onOpenEvidenceDrawer={(attempt, tab = 'diff') =>
              setDrawerState({
                profile: activeLearner,
                attempt,
                tab,
              })
            }
            onGoToSandbox={() => setActiveTab('learner_sandbox')}
            onGoToAppeals={() => setActiveTab('learner_appeals')}
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'learner_appeals' && (
          <LearnerAppealsView
            learner={activeLearner}
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}

        {(activeTab === 'recruiter_search' ||
          activeTab === 'recruiter_evidence') && (
          <RecruiterView
            activeSubTab={
              activeTab === 'recruiter_evidence' ? 'evidence' : 'search'
            }
            onChangeSubTab={(sub) =>
              setActiveTab(
                sub === 'evidence' ? 'recruiter_evidence' : 'recruiter_search'
              )
            }
            onOpenEvidenceDrawer={(profile, attempt, tab = 'diff') =>
              setDrawerState({
                profile,
                attempt,
                tab,
              })
            }
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}

        {(activeTab === 'reviewer_queue' || activeTab === 'reviewer_audit') && (
          <ReviewerView
            activeSubTab={activeTab === 'reviewer_audit' ? 'audit' : 'queue'}
            onChangeSubTab={(sub) =>
              setActiveTab(
                sub === 'audit' ? 'reviewer_audit' : 'reviewer_queue'
              )
            }
            selectedAttemptId={reviewerSelectedAttemptId}
            onSelectAttemptId={setReviewerSelectedAttemptId}
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'demo_architecture' && (
          <DemoView
            onTriggerPitchPreset={handleTriggerPitchPreset}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Mandatory Footer on Every Page */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p className="font-medium text-[#0B1B3A]">
            Synthetic data. Scores are experimental, not validated hiring
            predictors.
          </p>
          <p className="text-slate-500">
            ProofBoard Sandbox · Nyeras Learning Workflow → NxtMove Evidence
            View
          </p>
        </div>
      </footer>

      {/* Verifiable Evidence Drawer Modal */}
      {drawerState && (
        <EvidenceDrawerModal
          profile={drawerState.profile}
          attempt={drawerState.attempt}
          initialTab={drawerState.tab}
          onClose={() => setDrawerState(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-4 z-50 max-w-md bg-[#0B1B3A] text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs"
        >
          <CheckCircle2
            className="w-4 h-4 text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span className="flex-1 leading-snug">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
