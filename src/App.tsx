import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  X,
  User,
  Briefcase,
  Scale,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { repository } from './data/repository';
import { DEMO_STUDENT_ID_SAMPLES } from './trust/verification';
import {
  Attempt,
  AuthSession,
  EvidenceDrawerTab,
  LoginRole,
  NavigationTabId,
  PersonaMode,
  Profile,
} from './types';
import { DemoView } from './ui/DemoView';
import { EvidenceDrawerModal } from './ui/EvidenceDrawerModal';
import { LearnerAppealsView, LearnerView } from './ui/LearnerView';
import { LoginScreen } from './ui/LoginScreen';
import { ProfileView } from './ui/ProfileView';
import { RecruiterView } from './ui/RecruiterView';
import { ReviewerView } from './ui/ReviewerView';
import { VerifyLearner } from './ui/VerifyLearner';
import { VerifyRecruiter } from './ui/VerifyRecruiter';

interface NavTabConfig {
  id: NavigationTabId;
  label: string;
}

const PERSONA_TABS: Record<PersonaMode, NavTabConfig[]> = {
  learner: [
    { id: 'learner_sandbox', label: 'Task Sandbox' },
    { id: 'learner_verify', label: 'Verify Student ID' },
    { id: 'learner_profile', label: 'My Competency Profile' },
    { id: 'learner_appeals', label: 'My Appeals' },
  ],
  recruiter: [
    { id: 'recruiter_search', label: 'Talent Search & Filters' },
    { id: 'recruiter_verify', label: 'Verify Recruiter' },
    { id: 'recruiter_evidence', label: 'Candidate Evidence View' },
  ],
  reviewer: [
    { id: 'reviewer_queue', label: 'Reviewer Console' },
    { id: 'reviewer_verifications', label: 'Identity Queue' },
    { id: 'reviewer_audit', label: 'Global Audit Log' },
  ],
  demo: [
    { id: 'demo_architecture', label: 'Demo Control Center' },
    { id: 'learner_verify', label: 'Verify Learner' },
    { id: 'learner_sandbox', label: 'Task Sandbox' },
    { id: 'learner_profile', label: 'My Competency Profile' },
    { id: 'learner_appeals', label: 'My Appeals' },
    { id: 'recruiter_verify', label: 'Verify Recruiter' },
    { id: 'recruiter_search', label: 'Talent Search & Filters' },
    { id: 'reviewer_queue', label: 'Reviewer Console' },
    { id: 'reviewer_verifications', label: 'Identity Queue' },
    { id: 'reviewer_audit', label: 'Global Audit Log' },
  ],
};

function getAllowedPersonasForLoginRole(loginRole: LoginRole): PersonaMode[] {
  if (loginRole === 'learner') {
    return ['learner', 'reviewer'];
  }
  if (loginRole === 'recruiter') {
    return ['learner', 'recruiter', 'reviewer'];
  }
  return ['learner', 'recruiter', 'reviewer', 'demo'];
}

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [persona, setPersona] = useState<PersonaMode>('learner');
  const [activeTab, setActiveTab] =
    useState<NavigationTabId>('learner_sandbox');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [reviewerSelectedAttemptId, setReviewerSelectedAttemptId] = useState<
    string | null
  >('att-shortcut-case-a');

  const [drawerState, setDrawerState] = useState<{
    profile: Profile;
    attempt: Attempt;
    tab: EvidenceDrawerTab;
  } | null>(null);

  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    return repository.subscribe(refresh);
  }, []);

  const activeLearner = repository.getActiveLearner();
  const activeRecruiter = repository.getActiveRecruiterUser();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => setToastMessage(msg);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleLogin = (session: AuthSession) => {
    setAuthSession(session);
    if (session.loginRole === 'learner') {
      repository.initLearnerFreshSession(session.username);
      setSelectedStageIndex(0);
      setPersona('learner');
      setActiveTab('learner_sandbox');
      triggerToast(
        `Signed in as Learner (${session.username}). All stages and competencies start at 0 — verify your Student ID before official scoring.`
      );
    } else if (session.loginRole === 'recruiter') {
      repository.initRecruiterUnverifiedSession(
        session.username,
        session.email
      );
      setPersona('recruiter');
      setActiveTab('recruiter_search');
      triggerToast(
        `Signed in as Recruiter (${session.username}). Status is Unverified — complete verification to view verified learners.`
      );
    } else {
      repository.loadDemoShowcaseState();
      setSelectedStageIndex(1);
      setPersona('demo');
      setActiveTab('demo_architecture');
      triggerToast(
        `Signed in as Demo User (${session.username}). Full showcase dataset and all 4 personas are loaded.`
      );
    }
    refresh();
  };

  const handleLogout = () => {
    setAuthSession(null);
    setDrawerState(null);
  };

  if (!authSession) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const allowedPersonas = getAllowedPersonasForLoginRole(authSession.loginRole);
  const isReviewerReadOnly = authSession.loginRole !== 'demo';

  const handleSelectPersona = (nextPersona: PersonaMode) => {
    if (!allowedPersonas.includes(nextPersona)) return;
    setPersona(nextPersona);
    if (nextPersona === 'demo') {
      setActiveTab('demo_architecture');
      return;
    }
    const allowedTabs = PERSONA_TABS[nextPersona];
    if (!allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    }
  };

  const handleTriggerPitchPreset = (preset: 1 | 2 | 3 | 4) => {
    const out = repository.runPitchPreset(preset);
    refresh();

    if (preset === 1) {
      setSelectedStageIndex(1);
      setActiveTab('learner_profile');
      triggerToast(out.summary);
    } else if (preset === 2) {
      setSelectedStageIndex(1);
      setActiveTab('learner_sandbox');
      triggerToast(out.summary);
    } else if (preset === 3) {
      setReviewerSelectedAttemptId('att-shortcut-case-a');
      setActiveTab('reviewer_queue');
      triggerToast(out.summary);
    } else if (preset === 4) {
      setActiveTab('recruiter_search');
      triggerToast(out.summary);
    }
  };

  const visibleTabs = PERSONA_TABS[persona];

  const roleAccentBorderClass =
    persona === 'recruiter' || activeTab.startsWith('recruiter_')
      ? 'border-b-2 border-[#1E8E5A]'
      : persona === 'reviewer' || activeTab.startsWith('reviewer_')
      ? 'border-b-2 border-[#F2B705]'
      : 'border-b-2 border-[#2E6FD8]';

  const isLearnerVerified =
    (activeLearner.verificationStatus || 'UNVERIFIED') === 'VERIFIED';

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF1F7] text-[#0B1B3A]">
      <header
        className={`sticky top-0 z-40 bg-white ${roleAccentBorderClass} px-4 sm:px-6 py-3 shadow-2xs`}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab(visibleTabs[0].id)}
                className="text-xl font-bold tracking-tight text-[#0B1B3A] font-display"
              >
                ProofBoard
              </button>

              {/* Verified Learner & Verified Recruiter Status Badges */}
              {isLearnerVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      persona !== 'learner' &&
                      persona !== 'demo' &&
                      allowedPersonas.includes('learner')
                    ) {
                      setPersona('learner');
                    }
                    setActiveTab('learner_verify');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-md transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified learner · {activeLearner.name}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      persona !== 'learner' &&
                      persona !== 'demo' &&
                      allowedPersonas.includes('learner')
                    ) {
                      setPersona('learner');
                    }
                    setActiveTab('learner_verify');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Learner: Unverified · Verify ID</span>
                </button>
              )}

              {allowedPersonas.includes('recruiter') &&
                (activeRecruiter.verificationStatus === 'APPROVED' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (persona !== 'recruiter' && persona !== 'demo') {
                        setPersona('recruiter');
                      }
                      setActiveTab('recruiter_verify');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-md transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified recruiter</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (persona !== 'recruiter' && persona !== 'demo') {
                        setPersona('recruiter');
                      }
                      setActiveTab('recruiter_verify');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Recruiter: Unverified · Verify</span>
                  </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role-Scoped Current Persona Switcher */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                <label
                  htmlFor="current-persona-select"
                  className="text-xs font-bold text-slate-600 whitespace-nowrap"
                >
                  Current Persona:
                </label>
                <select
                  id="current-persona-select"
                  value={persona}
                  onChange={(e) =>
                    handleSelectPersona(e.target.value as PersonaMode)
                  }
                  className="text-xs font-bold text-[#0B1B3A] bg-transparent focus:outline-none cursor-pointer pr-1"
                >
                  {allowedPersonas.includes('learner') && (
                    <option value="learner">
                      👤 Learner · {activeLearner.name}
                    </option>
                  )}
                  {allowedPersonas.includes('recruiter') && (
                    <option value="recruiter">
                      💼 Recruiter · NxtMove Hiring Partner
                    </option>
                  )}
                  {allowedPersonas.includes('reviewer') && (
                    <option value="reviewer">
                      ⚖️ Reviewer ·{' '}
                      {isReviewerReadOnly
                        ? 'Read-Only View'
                        : 'Faculty / ISRO Auditor'}
                    </option>
                  )}
                  {allowedPersonas.includes('demo') && (
                    <option value="demo">🧪 Demo</option>
                  )}
                </select>
              </div>

              {/* Logged-in Identity & Log Out Button */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <span className="hidden sm:inline font-mono text-[11px] text-slate-600">
                  {authSession.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log out and switch role"
                  className="font-bold text-[#C8102E] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

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
                    className={`min-h-[36px] px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
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

            <div className="text-[11px] text-slate-500 hidden xl:flex items-center gap-1.5">
              {persona === 'learner' && (
                <>
                  <User className="w-3.5 h-3.5 text-[#2E6FD8]" />
                  <span>
                    Practice Open · Verify Student ID Before Official Scoring
                  </span>
                </>
              )}
              {persona === 'recruiter' && (
                <>
                  <Briefcase className="w-3.5 h-3.5 text-[#1E8E5A]" />
                  <span>
                    Must Verify Recruiter Before Viewing Candidates
                  </span>
                </>
              )}
              {persona === 'reviewer' && (
                <>
                  <Scale className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {isReviewerReadOnly
                      ? 'Reviewer UI · Read-Only for Learner & Recruiter'
                      : 'Reviewer UI · Interactive Governance Mode'}
                  </span>
                </>
              )}
              {persona === 'demo' && (
                <>
                  <FlaskConical className="w-3.5 h-3.5 text-[#2E6FD8]" />
                  <span>
                    Demo User Mode · All 4 Views Unlocked
                  </span>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Track A Notice if Learner is currently UNVERIFIED, NEEDS_REVIEW, or REJECTED */}
        {!isLearnerVerified &&
          (activeTab === 'learner_sandbox' ||
            activeTab === 'learner_profile') && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-[#F2B705] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[#0B1B3A]">
                  Student ID Verification Status: Unverified (
                  {activeLearner.verificationStatus || 'UNVERIFIED'})
                </div>
                <p className="text-slate-700">
                  You can explore tasks and run <strong>Practice Tests</strong>{' '}
                  anytime. Before submitting for official scoring or sharing
                  your profile with recruiters, verify your Student ID using
                  either option:
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sample = {
                      ...DEMO_STUDENT_ID_SAMPLES[0],
                      fullName: activeLearner.name,
                    };
                    const rec = repository.submitLearnerVerification(
                      activeLearner.learnerId,
                      sample
                    );
                    refresh();
                    triggerToast(
                      `Quick Demo Verification complete (${rec.auditHash})! You are now a Verified learner and can submit tasks for scoring.`
                    );
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 font-bold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                >
                  Quick Demo Verification
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('learner_verify')}
                  className="min-h-[38px] px-4 py-1.5 font-bold text-white bg-[#2E6FD8] hover:bg-[#2459B0] rounded-lg transition-colors"
                >
                  Verify Student ID First
                </button>
              </div>
            </div>
          )}

        {activeTab === 'learner_verify' && (
          <VerifyLearner
            learner={activeLearner}
            onVerificationUpdated={refresh}
            onProceedToSandbox={() => setActiveTab('learner_sandbox')}
            onGoToAppeals={() => setActiveTab('learner_appeals')}
            onNotify={triggerToast}
          />
        )}

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
            onOpenVerifyLearner={() => setActiveTab('learner_verify')}
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
            onOpenVerifyLearner={() => setActiveTab('learner_verify')}
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

        {activeTab === 'recruiter_verify' && (
          <VerifyRecruiter
            onVerificationUpdated={refresh}
            onProceedToTalentPool={() => setActiveTab('recruiter_search')}
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
            onOpenVerifyRecruiter={() => setActiveTab('recruiter_verify')}
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

        {(activeTab === 'reviewer_queue' ||
          activeTab === 'reviewer_verifications' ||
          activeTab === 'reviewer_audit') && (
          <ReviewerView
            activeSubTab={
              activeTab === 'reviewer_audit'
                ? 'audit'
                : activeTab === 'reviewer_verifications'
                ? 'verifications'
                : 'queue'
            }
            onChangeSubTab={(sub) =>
              setActiveTab(
                sub === 'audit'
                  ? 'reviewer_audit'
                  : sub === 'verifications'
                  ? 'reviewer_verifications'
                  : 'reviewer_queue'
              )
            }
            selectedAttemptId={reviewerSelectedAttemptId}
            onSelectAttemptId={setReviewerSelectedAttemptId}
            readOnly={isReviewerReadOnly}
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'demo_architecture' && (
          <DemoView
            onTriggerPitchPreset={handleTriggerPitchPreset}
            onNavigateTab={setActiveTab}
            onDataChanged={refresh}
            onNotify={triggerToast}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p className="font-medium text-[#0B1B3A]">
            Synthetic data. Scores are experimental, not validated hiring
            predictors.
          </p>
          <p className="text-slate-500">
            ProofBoard Sandbox · Track A &amp; B Identity Verification · Nyeras
            → NxtMove
          </p>
        </div>
      </footer>

      {drawerState && (
        <EvidenceDrawerModal
          profile={drawerState.profile}
          attempt={drawerState.attempt}
          initialTab={drawerState.tab}
          onClose={() => setDrawerState(null)}
        />
      )}

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
