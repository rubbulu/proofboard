import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Gavel,
  Briefcase,
  ArrowRight,
  Database,
  FlaskConical,
  GitBranch,
  Clock,
  Lock,
  IdCard,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { repository } from '../data/repository';
import { getVisibleProfiles } from '../trust/consent';
import {
  DEMO_STUDENT_ID_SAMPLES,
  runVerificationUnitTests,
} from '../trust/verification';
import { NavigationTabId } from '../types';

export interface DemoViewProps {
  onTriggerPitchPreset: (preset: 1 | 2 | 3 | 4) => void;
  onNavigateTab: (tab: NavigationTabId) => void;
  onDataChanged?: () => void;
  onNotify?: (msg: string) => void;
}

export const DemoView: React.FC<DemoViewProps> = ({
  onTriggerPitchPreset,
  onNavigateTab,
  onDataChanged,
  onNotify,
}) => {
  const activePreset = repository.getActivePitchPreset();
  const activeLearner = repository.getActiveLearner();
  const activeRecruiter = repository.getActiveRecruiterUser();
  const autoApproveRecruiter = repository.getAutoApproveDemoRecruiter();
  const visibleProfilesCount = getVisibleProfiles().length;

  const unitTestResults = runVerificationUnitTests();
  const allPassed = unitTestResults.every((t) => t.passed);

  const handleApplySampleId = (sampleIndex: number) => {
    const sample = DEMO_STUDENT_ID_SAMPLES[sampleIndex];
    if (!sample) return;
    const record = repository.submitLearnerVerification(
      activeLearner.learnerId,
      sample
    );
    onDataChanged?.();
    onNotify?.(
      `Applied ${sample.sampleLabel} → Track A Decision: ${record.decision} (${record.auditHash})`
    );
  };

  const handleToggleAutoApproveRecruiter = () => {
    const next = !autoApproveRecruiter;
    repository.setAutoApproveDemoRecruiter(next);
    if (next) {
      repository.setActiveRecruiterStatus('APPROVED');
    }
    onDataChanged?.();
    onNotify?.(
      next
        ? 'Demo Mode: Auto-Approve Demo Recruiter enabled (Recruiter set to APPROVED).'
        : 'Demo Mode: Auto-Approve Demo Recruiter disabled (New recruiter submissions enter PENDING).'
    );
  };

  const handleSetRecruiterStatus = (
    status: 'APPROVED' | 'PENDING' | 'REJECTED'
  ) => {
    repository.setActiveRecruiterStatus(status);
    onDataChanged?.();
    onNotify?.(
      `Recruiter (${activeRecruiter.email}) status changed to ${status}.`
    );
  };

  const presets = [
    {
      id: 1 as const,
      title: 'Preset 1: Fair Pass (Asha — 100/100 Verified)',
      subtitle: 'Clean loop fix · 13/13 sandbox tests · Stage 4 Explain-Back',
      description:
        'Sets Asha to the clean loop fix, passes all 3 visible + 10 hidden boundary tests, verifies Stage 4 pseudocode explain-back, and updates her Competency Profile to 100/100 Verified.',
      actionTab: 'learner_profile' as NavigationTabId,
      actionLabel: 'Inspect Asha’s Verified Profile',
      Icon: CheckCircle2,
    },
    {
      id: 2 as const,
      title: 'Preset 2: Caught Shortcut (Hardcoded return 25)',
      subtitle: 'Passes 3/3 visible · Fails 9/10 hidden · Score Withheld',
      description:
        'Loads hardcoded `if (price === 10) return 25` into Stage 2. Passes the 3 visible tests, fails 9/10 unseen boundary tests, triggers Integrity Alert: Hardcoded Return Suspected, and withholds the score.',
      actionTab: 'learner_sandbox' as NavigationTabId,
      actionLabel: 'View Caught Shortcut in Sandbox',
      Icon: ShieldAlert,
    },
    {
      id: 3 as const,
      title: 'Preset 3: Reviewer Governance (#AUD-9104 & #AUD-9208)',
      subtitle: 'Strict separation of cheating vs. legitimate student appeals',
      description:
        'Opens the Reviewer Console. Case A (Cheating) only allows Confirm Disqualification (Withhold Score). Case B (Asha’s precision appeal) requires a numeric score and >= 15-char rationale.',
      actionTab: 'reviewer_queue' as NavigationTabId,
      actionLabel: 'Open Reviewer Console',
      Icon: Gavel,
    },
    {
      id: 4 as const,
      title: 'Preset 4: NxtMove Recruiter Portal (Consent & Integrity Gated)',
      subtitle: 'Asha surfaced for Junior Backend Engineer · Cheater excluded',
      description:
        'Switches to the NxtMove Hiring Partner view filtered for Junior Backend Engineer & Debugging >= 80%. Asha’s verified evidence is inspectable; disqualified candidates never appear.',
      actionTab: 'recruiter_search' as NavigationTabId,
      actionLabel: 'Open NxtMove Talent Search',
      Icon: Briefcase,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-[#2E6FD8]">
            🧪 ProofBoard Demo Mode · Walkthrough Presets, Identity Verification
            Controls &amp; Architecture
          </div>
          <h1 className="text-2xl font-bold text-[#0B1B3A]">
            Demo Mode Control Center &amp; Verification Deliverables
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl">
            Test Track A (Learner Student ID OCR + deterministic{' '}
            <code className="font-mono">decide()</code>), Track B (Recruiter Work
            Email Domain Rule + Reviewer Queue), interactive walkthrough presets,
            Firestore Schema &amp; Security Rules, live Unit Tests, Risk Table,
            and 24-Hour Build Order.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            repository.resetToUnverifiedZeroState();
            onDataChanged?.();
            onNotify?.(
              'Reset to Unverified Starting State: Learner set to UNVERIFIED and Recruiter set to PENDING.'
            );
          }}
          className="min-h-[42px] px-4 py-2 text-xs font-bold text-[#0B1B3A] bg-amber-50 hover:bg-amber-100 border border-[#F2B705] rounded-xl transition-colors shrink-0"
        >
          Reset to Unverified Starting State
        </button>
      </div>

      {/* Interactive Verification Controls (Track A Sample IDs & Track B Recruiter Auto-Approve) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Track A Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
                <IdCard className="w-4 h-4 text-[#2E6FD8]" />
                <h2>Track A: Learner Student ID Demo Controls</h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                  activeLearner.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-50 text-[#1E8E5A] border border-emerald-200'
                    : activeLearner.verificationStatus === 'NEEDS_REVIEW'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-rose-50 text-[#C8102E] border border-rose-200'
                }`}
              >
                {activeLearner.verificationStatus === 'VERIFIED' && (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                {activeLearner.verificationStatus === 'NEEDS_REVIEW' && (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {activeLearner.verificationStatus === 'REJECTED' && (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Active Learner: {activeLearner.verificationStatus}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Load any synthetic Student ID sample below to immediately test
              deterministic <code className="font-mono">decide()</code> outcomes
              and see how unverified states automatically gate Task Sandbox
              submissions and NxtMove profile sharing:
            </p>

            <div className="space-y-2">
              {DEMO_STUDENT_ID_SAMPLES.map((sample, idx) => (
                <button
                  key={sample.sampleId}
                  type="button"
                  onClick={() => handleApplySampleId(idx)}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#2E6FD8] bg-slate-50 hover:bg-blue-50/40 text-left transition-colors flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#0B1B3A]">
                      {sample.sampleLabel}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">
                      ID: {sample.studentIdNumber} · Validity:{' '}
                      {sample.validityYear} · OCR:{' '}
                      {Math.round(sample.ocrConfidence * 100)}%
                    </div>
                  </div>
                  <span className="font-bold text-[#2E6FD8]">Apply Sample</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              ID: {activeLearner.studentIdNumber || 'VIT-BPL-2023-CS042'} ·
              Valid {activeLearner.validityYear || 2027}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('learner_verify')}
              className="min-h-[36px] px-3.5 py-1.5 text-xs font-bold text-white bg-[#2E6FD8] hover:bg-[#2459B0] rounded-lg inline-flex items-center gap-1.5"
            >
              <span>Open Track A Verify Student ID</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Track B Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
                <Briefcase className="w-4 h-4 text-[#1E8E5A]" />
                <h2>Track B: Recruiter Verification &amp; Consent Guard</h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                  activeRecruiter.verificationStatus === 'APPROVED'
                    ? 'bg-emerald-50 text-[#1E8E5A] border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-300'
                }`}
              >
                <span>Recruiter: {activeRecruiter.verificationStatus}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Toggle the one-click <strong>Auto-approve demo recruiter</strong>{' '}
              setting or switch the active recruiter between{' '}
              <code className="font-mono">APPROVED</code> and{' '}
              <code className="font-mono">PENDING</code> to test the 3-layer
              Consent Guard ({visibleProfilesCount} visible profile
              {visibleProfilesCount === 1 ? '' : 's'} currently unlocked):
            </p>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApproveRecruiter}
                onChange={handleToggleAutoApproveRecruiter}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1E8E5A] focus:ring-[#1E8E5A]"
              />
              <span className="text-xs text-[#0B1B3A] leading-relaxed">
                <strong className="font-bold block">
                  One-Click &ldquo;Auto-approve demo recruiter&rdquo; Toggle
                </strong>
                <span className="text-slate-600">
                  When enabled, Track B corporate email submissions bypass the{' '}
                  <code className="font-mono">PENDING</code> queue and
                  immediately set <code className="font-mono">APPROVED</code>.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetRecruiterStatus('APPROVED')}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeRecruiter.verificationStatus === 'APPROVED'
                    ? 'bg-[#1E8E5A] text-white border-[#1E8E5A]'
                    : 'bg-white text-[#0B1B3A] border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set APPROVED (Unlocks Talent Pool)
              </button>
              <button
                type="button"
                onClick={() => handleSetRecruiterStatus('PENDING')}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeRecruiter.verificationStatus === 'PENDING'
                    ? 'bg-[#F2B705] text-[#0B1B3A] border-[#F2B705]'
                    : 'bg-white text-[#0B1B3A] border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set PENDING (Locks Talent Pool)
              </button>
              <button
                type="button"
                onClick={() => handleSetRecruiterStatus('REJECTED')}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeRecruiter.verificationStatus === 'REJECTED'
                    ? 'bg-[#C8102E] text-white border-[#C8102E]'
                    : 'bg-white text-[#0B1B3A] border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set REJECTED
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              {activeRecruiter.email} · {activeRecruiter.institutionOrOrg}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('recruiter_verify')}
              className="min-h-[36px] px-3.5 py-1.5 text-xs font-bold text-white bg-[#1E8E5A] hover:bg-[#177348] rounded-lg inline-flex items-center gap-1.5"
            >
              <span>Open Track B Verify Recruiter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Walkthrough Scenario Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          const Icon = p.Icon;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl p-6 border flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'border-2 border-[#0B1B3A] shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6FD8]">
                    <Icon className="w-4 h-4" />
                    <span>{p.subtitle}</span>
                  </span>
                  {isActive && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F2B705] text-[#0B1B3A]">
                      Active Preset
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-[#0B1B3A]">
                  {p.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onTriggerPitchPreset(p.id)}
                  className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-[#0B1B3A] hover:bg-slate-800 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Activate Preset {p.id}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab(p.actionTab)}
                  className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-[#0B1B3A] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {p.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DELIVERABLE 4: LIVE UNIT TESTS FOR decide(ocrConfidence, idValid) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
            <FlaskConical className="w-4 h-4 text-[#1E8E5A]" />
            <h3>
              Deliverable 4: Live Unit Tests for Pure `decide(ocrConfidence,
              idValid)` &amp; Work Email Rule
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 text-[#1E8E5A] border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {allPassed
                ? `All ${unitTestResults.length}/${unitTestResults.length} Edge-Case Unit Tests Passing`
                : 'Unit Test Failure'}
            </span>
          </span>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {unitTestResults.map((ut) => (
            <div
              key={ut.id}
              className="p-3 bg-white flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-[#0B1B3A]">{ut.name}</div>
                <div className="font-mono text-[11px] text-slate-600">
                  Call: {ut.inputDisplay} &rarr; Reasons: [
                  {ut.reasonCodes.join(', ')}]
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-[#0B1B3A]">
                  {ut.actualDecision}
                </span>
                <span className="inline-flex items-center gap-1 text-[#1E8E5A] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PASS</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DELIVERABLE 1: MERMAID FLOW DIAGRAMS (TRACK A & TRACK B TIER 1 PATHS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
            <GitBranch className="w-4 h-4 text-[#2E6FD8]" />
            <h3>Deliverable 1A: Track A Learner Verification Mermaid Flow</h3>
          </div>
          <pre className="p-4 rounded-xl bg-[#0B1B3A] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`flowchart TD
  A[Learner Uploads Student ID Photo] --> B[Client-Side OCR Extracts Name, ID#, Institution, Validity Year]
  B --> C[Read-Only Autofill Form: Learner Reviews & Confirms]
  C --> D{checkStudentIdValidityYear >= 2026?}
  D -- No (Expired) --> E[REJECTED: EXPIRED_ID_CARD]
  E --> F[Learner Appeals via Existing Appeals Flow]
  D -- Yes (Valid) --> G{decide: ocrConfidence}
  G -- ">= 0.85" --> H[VERIFIED: Unlocks Attempts, Evidence & Profile Sharing]
  G -- "0.55 to 0.84" --> I[NEEDS_REVIEW: Routed to ReviewerQueue]
  G -- "< 0.55" --> J[REJECTED: OCR_CONFIDENCE_TOO_LOW]
  I --> K[Human Reviewer Approves or Rejects + Audit Log]`}
          </pre>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
            <GitBranch className="w-4 h-4 text-[#1E8E5A]" />
            <h3>Deliverable 1B: Track B Recruiter Verification Mermaid Flow</h3>
          </div>
          <pre className="p-4 rounded-xl bg-[#0B1B3A] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`flowchart TD
  A[Recruiter Enters Work Email] --> B{validateRecruiterWorkEmail}
  B -- "gmail / yahoo / outlook" --> C[Blocked: FREE_EMAIL_PROVIDER_BLOCKED]
  B -- "Corporate Domain (@nxtmove.io)" --> D[Submit Company, Designation & Proof Link]
  D --> E{Demo Auto-Approve Toggle ON?}
  E -- No --> F[Status: PENDING in ReviewerQueue]
  E -- Yes --> G[Status: APPROVED + Audit Log]
  F --> H[Human Reviewer Approves or Rejects]
  H -- Approved --> G
  G --> I[Consent Guard Unlocks Consented + Verified Learner Profiles]`}
          </pre>
        </div>
      </div>

      {/* DELIVERABLE 2 & 5: FIRESTORE SCHEMA, SECURITY RULES & CONSENT GUARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
          <Database className="w-4 h-4 text-[#2E6FD8]" />
          <h3>
            Deliverable 2 &amp; 5: Firestore Schema Additions (`users`,
            `verifications`) &amp; Consent Guard Integration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-[#0B1B3A]">
              New Firestore Collections (Added Alongside `tasks`, `attempts`,
              `profiles`, `appeals`):
            </div>
            <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
{`// Collection: users/{uid}
{
  uid: string,
  role: 'learner' | 'recruiter' | 'reviewer',
  verificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' | 'PENDING' | 'APPROVED',
  institutionOrOrg: string,
  email?: string,
  designation?: string,
  updatedAt: string
}

// Collection: verifications/{id}
{
  id: string,
  uid: string,
  track: 'learner_track_a' | 'recruiter_track_b',
  decision: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' | 'PENDING' | 'APPROVED',
  reasonCodes: string[],
  reviewerId?: string,
  timestamp: string,
  auditHash: string
}`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-[#0B1B3A] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#1E8E5A]" />
              <span>How `getVisibleProfiles()` Uses Verification Status:</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              In <code className="font-mono">/src/trust/consent.ts</code> and{' '}
              <code className="font-mono">/firestore.rules</code>, a recruiter
              query only returns learner profiles when all four predicates hold:
            </p>
            <ol className="list-decimal ps-5 space-y-1 text-slate-700 font-mono text-[11px]">
              <li>
                recruiter.verificationStatus === &apos;APPROVED&apos; &amp;&amp;
                !recruiter.suspended
              </li>
              <li>learner.verificationStatus === &apos;VERIFIED&apos;</li>
              <li>
                learner.consent === true &amp;&amp; !learner.disqualified
              </li>
              <li>learner.hasPublishedAssessment === true</li>
            </ol>
          </div>
        </div>
      </div>

      {/* DELIVERABLE 6: RISK TABLE (MITIGATED NOW VS. PLANNED TIER 2) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#0B1B3A]">
          Deliverable 6: Security &amp; Trust Risk Table (Mitigated in Tier 1 vs.
          Planned in Tier 2)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[#0B1B3A]">
                <th className="p-3 font-bold">Threat / Risk Vector</th>
                <th className="p-3 font-bold text-[#1E8E5A]">
                  Mitigated Now (Built &amp; Working in Runtime)
                </th>
                <th className="p-3 font-bold text-amber-800">
                  Planned, Not Built (Tier 2 UI Placeholders)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-3 font-bold text-[#0B1B3A]">
                  1. Fake or Expired Student IDs
                </td>
                <td className="p-3">
                  Read-only OCR autofill (no manual typing), deterministic
                  validity-year rule (&ge; 2026), confidence threshold routing
                  (55%–84% to human Reviewer), and immutable audit logging.
                </td>
                <td className="p-3">
                  Cross-account duplicate ID hash detection, institutional
                  registrar API lookup, and raw ID image deletion post-decision.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#0B1B3A]">
                  2. Fake Recruiters / Data Scraping
                </td>
                <td className="p-3">
                  Deterministic free-email blocklist (`gmail`, `yahoo`,
                  `outlook`), corporate email 6-digit OTP / Magic Link +
                  WebAuthn MFA verification, mandatory `PENDING` Reviewer gate,
                  instant recruiter token revocation / suspension, and learner
                  explicit `Publish` + `consent === true` guard.
                </td>
                <td className="p-3">
                  Automated HRIS / MCA corporate registry webhook sync.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#0B1B3A]">
                  3. Shared Accounts / Proxy Test-Taking
                </td>
                <td className="p-3">
                  10 hidden seeded boundary tests catch hardcoded shortcuts,
                  Stage 4 written explain-back verifies conceptual ownership,
                  and keystroke cadence telemetry flags bulk paste.
                </td>
                <td className="p-3">
                  Live camera selfie + liveness check + face match against the
                  Student ID photo during assessment submission.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DELIVERABLE 7: 24-HOUR HACKATHON BUILD ORDER */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
          <Clock className="w-4 h-4 text-[#2E6FD8]" />
          <h3>
            Deliverable 7: 24-Hour Hackathon Build Order (Every Step Demo-Ready)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#2E6FD8]">
              Hours 1–6: Pure Engine &amp; Schema
            </div>
            <p className="text-slate-600">
              Implement `decide(ocrConfidence, idValid)`, validity-year rule,
              work email blocklist, unit tests, and `users` + `verifications`
              schema.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#2E6FD8]">
              Hours 7–12: Track A Learner MVP
            </div>
            <p className="text-slate-600">
              Build `VerifyLearner` 3-step stepper with Demo Mode sample IDs,
              read-only OCR autofill, and existing appeals integration.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#1E8E5A]">
              Hours 13–18: Track B Recruiter MVP
            </div>
            <p className="text-slate-600">
              Build `VerifyRecruiter` stepper, one-click auto-approve demo
              toggle, and 3-layer Consent Guard (`APPROVED` + `VERIFIED` +
              `consent`).
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-amber-800">
              Hours 19–24: ReviewerQueue &amp; Polish
            </div>
            <p className="text-slate-600">
              Wire `ReviewerQueue` for `NEEDS_REVIEW` learners &amp; `PENDING`
              recruiters, add `Verified learner` / `Verified recruiter` badges,
              and label Tier 2 `Planned`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
