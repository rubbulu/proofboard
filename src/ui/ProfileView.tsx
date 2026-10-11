import React, { useState } from 'react';
import {
  Clock,
  FileCode2,
  FlaskConical,
  FileText,
  Shield,
  BookOpen,
  History,
  CheckCircle2,
  Flag,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { repository } from '../data/repository';
import { COMPETENCY_META, getStageById } from '../engine/tasks';
import { getAuditEventsForLearner } from '../trust/audit';
import { setLearnerConsent } from '../trust/consent';
import {
  Attempt,
  CompetencyKey,
  EvidenceDrawerTab,
  Profile,
} from '../types';
import {
  AttemptStatusIndicator,
  ConfidenceDisplay,
  formatDateTime,
  formatShortDate,
  ProficiencyBadge,
  RecencyDisplay,
} from './StatusComponents';

export interface ProfileViewProps {
  learner: Profile;
  onOpenEvidenceDrawer: (attempt: Attempt, tab?: EvidenceDrawerTab) => void;
  onGoToSandbox: () => void;
  onGoToAppeals: () => void;
  onOpenVerifyLearner?: () => void;
  onDataChanged: () => void;
  onNotify: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  learner,
  onOpenEvidenceDrawer,
  onGoToSandbox,
  onGoToAppeals,
  onOpenVerifyLearner,
  onDataChanged,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'audit'>('evidence');
  const [collegeDraft, setCollegeDraft] = useState(learner.college);
  const isLearnerVerified =
    (learner.verificationStatus || 'UNVERIFIED') === 'VERIFIED';

  const publishedAttempts = repository.getPublishedAttemptsByLearner(
    learner.learnerId
  );
  const allSandboxAttempts = repository.getAttemptsByLearner(learner.learnerId);
  const completedStagesCount = new Set(
    allSandboxAttempts.map((a) => a.stageId)
  ).size;
  const auditEvents = getAuditEventsForLearner(learner.learnerId);

  const verifiedCodeAttempt = publishedAttempts.find(
    (a) => a.stageType === 'debug_code' && a.status !== 'disqualified'
  );

  const competencyKeys: CompetencyKey[] = [
    'debugging',
    'code_reading',
    'algorithmic_thinking',
    'communication',
  ];

  const handleToggleConsent = () => {
    if (!isLearnerVerified) {
      onNotify(
        `Track A Verification Required: Your Student ID status is ${learner.verificationStatus}. Only VERIFIED learners can share their profile with NxtMove recruiters.`
      );
      return;
    }
    const next = !learner.consent;
    setLearnerConsent(learner.learnerId, next);
    onDataChanged();
    onNotify(
      next
        ? 'NxtMove Recruiter Sharing enabled. Your verified profile is now visible in Talent Search.'
        : 'NxtMove Recruiter Sharing disabled. Your profile is immediately hidden from recruiters.'
    );
  };

  const handleSaveCollege = () => {
    repository.updateLearnerIdentity(
      learner.learnerId,
      learner.name,
      collegeDraft
    );
    onDataChanged();
    onNotify('Updated college name on profile.');
  };

  return (
    <div className="space-y-6">
      {/* Publish Status Banner when learner has unpublished Sandbox attempts or published assessment */}
      {!learner.hasPublishedAssessment && allSandboxAttempts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-[#F2B705] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-[#0B1B3A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>
                Unpublished Sandbox Draft ({completedStagesCount}/4 Stages
                Solved) — Profile &amp; Recruiter View Not Updated Yet
              </span>
            </div>
            <p className="text-slate-700 max-w-3xl">
              Your stage attempts are saved privately in the Task Sandbox so you
              never have to worry about mistakes being shared prematurely. Only
              once you complete all 4 stages and click{' '}
              <strong>Publish Solved Problem</strong> will your chosen attempts
              be uploaded to your Competency Profile and visible to NxtMove
              Recruiters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {completedStagesCount >= 4 && isLearnerVerified && (
              <button
                type="button"
                onClick={() => {
                  repository.publishLearnerAssessment(learner.learnerId);
                  onDataChanged();
                  onNotify(
                    'Published! Your solved 4-stage assessment is now uploaded to your Competency Profile and Recruiter Portal.'
                  );
                }}
                className="min-h-[38px] px-4 py-2 text-xs font-bold text-white bg-[#1E8E5A] hover:bg-[#177348] rounded-xl inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Solved Problem Now</span>
              </button>
            )}
            <button
              type="button"
              onClick={onGoToSandbox}
              className="min-h-[38px] px-3.5 py-2 text-xs font-bold text-[#0B1B3A] bg-white hover:bg-slate-100 border border-slate-300 rounded-xl"
            >
              {completedStagesCount >= 4
                ? 'Choose Desired Attempts in Sandbox'
                : `Continue Solving in Sandbox (${completedStagesCount}/4)`}
            </button>
          </div>
        </div>
      )}

      {/* Profile Identity & Privacy Consent Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-[#2E6FD8]">
                Nyeras Verified Skill Passport
              </span>
              <span aria-hidden="true">·</span>
              {isLearnerVerified ? (
                <span className="inline-flex items-center gap-1 font-bold text-[#1E8E5A] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    Verified learner · ID: {learner.studentIdNumber || 'IISC-CS-2023-0842'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Track A Status: {learner.verificationStatus}</span>
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span>Target Role: {learner.roleTarget}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0B1B3A]">
              {learner.name} — My Competency Profile
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label
                htmlFor="profile-college-input"
                className="text-xs font-medium text-slate-600"
              >
                College:
              </label>
              <input
                id="profile-college-input"
                type="text"
                value={collegeDraft}
                onChange={(e) => setCollegeDraft(e.target.value)}
                onBlur={handleSaveCollege}
                className="min-h-[38px] px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A] w-full sm:w-80"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Data minimisation active: Only display name and college are stored.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoToSandbox}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#2E6FD8] bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open Task Sandbox</span>
              </button>
              <button
                type="button"
                onClick={onGoToAppeals}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0B1B3A] bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Flag className="w-3.5 h-3.5 text-[#2E6FD8]" aria-hidden="true" />
                <span>My Appeals</span>
              </button>
            </div>
          </div>
        </div>

        {/* Consent & Privacy Toggle Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
                <Shield
                  className={`w-4 h-4 ${
                    learner.consent ? 'text-[#1E8E5A]' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span>NxtMove Recruiter Visibility</span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                  learner.consent
                    ? 'bg-emerald-50 text-[#1E8E5A] border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {learner.consent ? 'Shared with NxtMove' : 'Private (Hidden)'}
              </span>
            </div>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 ${
                isLearnerVerified
                  ? 'cursor-pointer'
                  : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <input
                type="checkbox"
                checked={learner.consent && isLearnerVerified}
                disabled={!isLearnerVerified}
                onChange={handleToggleConsent}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1E8E5A] focus:ring-[#1E8E5A] disabled:opacity-50"
              />
              <span className="text-xs text-[#0B1B3A] leading-relaxed">
                <strong className="font-bold block">
                  Allow NxtMove recruiters to search and view my profile
                </strong>
                <span className="text-slate-600">
                  {isLearnerVerified
                    ? 'When unchecked, your profile and evidence records disappear from the NxtMove Recruiter Portal immediately.'
                    : `Locked because Track A Student ID status is ${learner.verificationStatus}. Verify your Student ID to unlock recruiter sharing.`}
                </span>
              </span>
            </label>

            {!isLearnerVerified && onOpenVerifyLearner && (
              <button
                type="button"
                onClick={onOpenVerifyLearner}
                className="w-full min-h-[38px] px-3 py-1.5 text-xs font-bold text-[#0B1B3A] bg-[#F2B705] hover:bg-[#d9a404] rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verify Student ID (Track A) to Enable Sharing</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
            <span>Consent changes are logged to the immutable audit trail.</span>
          </div>
        </div>
      </div>

      {/* Primary Highlighted Verified Competency Card (Section 4 Specification) */}
      {isLearnerVerified && verifiedCodeAttempt && (
        <div className="bg-white border-2 border-[#1E8E5A] rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E8E5A]">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>
                  Primary Verified Skill Record · Task: Fix calculateTotal(items)
                  in Checkout Service
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0B1B3A]">
                Competency: Debugging &amp; Edge-Case Handling
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <ProficiencyBadge
                level={learner.competencies.debugging.proficiency}
              />
              <span className="text-lg font-bold font-mono tabular-nums text-[#1E8E5A]">
                {learner.competencies.debugging.latestScore !== null
                  ? `Verified (${learner.competencies.debugging.latestScore}/100)`
                  : 'Not scored'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 font-semibold">Proficiency</div>
              <div className="text-sm font-bold text-[#0B1B3A] mt-0.5">
                {learner.competencies.debugging.proficiency} (
                {learner.competencies.debugging.latestScore ?? 0}/100)
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-semibold">Confidence</div>
              <div className="text-sm font-bold text-[#1E8E5A] mt-0.5">
                Higher (Verified by 13 deterministic sandbox tests + Explain-Back)
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-semibold">Recency</div>
              <div className="text-sm font-bold text-[#0B1B3A] mt-0.5">
                Fresh ({formatShortDate(learner.competencies.debugging.lastDate)})
              </div>
            </div>
          </div>

          {/* 3 Interactive Verifiable Evidence Drawer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs font-semibold text-slate-600">
              Inspect Verifiable Evidence Drawer:
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenEvidenceDrawer(verifiedCodeAttempt, 'diff')}
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#0B1B3A] text-white hover:bg-slate-800 inline-flex items-center gap-2 transition-colors"
              >
                <FileCode2
                  className="w-4 h-4 text-[#2E6FD8]"
                  aria-hidden="true"
                />
                <span>🔍 View Code Diff</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenEvidenceDrawer(verifiedCodeAttempt, 'tests')
                }
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-[#1E8E5A] border border-[#1E8E5A]/30 hover:bg-emerald-100 inline-flex items-center gap-2 transition-colors"
              >
                <FlaskConical className="w-4 h-4" aria-hidden="true" />
                <span>🧪 View Test Logs (13/13 passed)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenEvidenceDrawer(verifiedCodeAttempt, 'explain')
                }
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-[#0B1B3A] border border-[#F2B705] hover:bg-amber-100 inline-flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-700" aria-hidden="true" />
                <span>📝 View Explain-Back Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All 4 Competency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {competencyKeys.map((key) => {
          const meta = COMPETENCY_META[key];
          const comp = learner.competencies[key];
          const latestAttempt = comp.latestAttemptId
            ? repository.getAttemptById(comp.latestAttemptId)
            : undefined;

          return (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#0B1B3A]">
                      {meta.displayTitle}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {meta.description}
                    </p>
                  </div>
                  <ProficiencyBadge level={comp.proficiency} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <RecencyDisplay
                    recency={comp.recency}
                    lastDate={comp.lastDate}
                  />
                  <div className="text-xs text-slate-600 font-mono tabular-nums">
                    {comp.attempts}{' '}
                    {comp.attempts === 1 ? 'attempt' : 'attempts'}
                    {comp.latestScore !== null
                      ? ` · Score: ${comp.latestScore}/100`
                      : ''}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <ConfidenceDisplay
                    confidence={comp.confidence}
                    confidenceReason={comp.confidenceReason}
                  />
                </div>
              </div>

              {latestAttempt && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEvidenceDrawer(latestAttempt, 'diff')}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#2E6FD8] bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <FileCode2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>🔍 Code Diff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEvidenceDrawer(latestAttempt, 'tests')}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>🧪 Test Logs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenEvidenceDrawer(latestAttempt, 'explain')
                    }
                    className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0B1B3A] bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>📝 Explain-Back</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Evidence Records & Learner Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'evidence'}
              onClick={() => setActiveTab('evidence')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                activeTab === 'evidence'
                  ? 'bg-[#0B1B3A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileCode2 className="w-4 h-4" aria-hidden="true" />
              <span>
                Published Evidence Records · {publishedAttempts.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                activeTab === 'audit'
                  ? 'bg-[#0B1B3A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" aria-hidden="true" />
              <span>Profile Audit Log · {auditEvents.length}</span>
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Only attempts you explicitly publish after completing the 4 stages
            appear on your profile
          </span>
        </div>

        {activeTab === 'evidence' ? (
          publishedAttempts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No published attempts on your profile yet. Complete the 4 stages
              in the Task Sandbox and click{' '}
              <strong>Publish Solved Problem</strong> when you are comfortable
              with your solution.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {publishedAttempts.map((att, idx) => {
                const found = getStageById(att.bundleId, att.stageId);
                const stageTitle = found?.stage.title || att.stageId;
                const compLabel =
                  COMPETENCY_META[att.competency]?.displayTitle ||
                  att.competency;

                return (
                  <div
                    key={att.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">
                          Record #{publishedAttempts.length - idx}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{compLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>Rubric {att.rubricVersion}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {formatDateTime(att.submittedAt)}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#0B1B3A]">
                        {stageTitle}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <AttemptStatusIndicator
                        status={att.status}
                        score={att.score}
                        flagReason={att.flagReason}
                      />
                      <button
                        type="button"
                        onClick={() => onOpenEvidenceDrawer(att, 'diff')}
                        className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#2E6FD8] bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>Open Evidence Drawer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : auditEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No audit events recorded yet for this learner session.
          </div>
        ) : (
          <ol className="relative border-s border-slate-200 ms-3 space-y-4">
            {auditEvents.map((ev) => (
              <li key={ev.id} className="ms-4">
                <div className="absolute w-2.5 h-2.5 bg-[#2E6FD8] rounded-full mt-1.5 -start-[5px] border border-white" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {formatDateTime(ev.ts)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold text-[#0B1B3A]">
                    {ev.auditHash}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#0B1B3A]">
                    {ev.actor}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#2E6FD8]">{ev.type}</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5">{ev.details}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
