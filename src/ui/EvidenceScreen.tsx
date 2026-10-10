import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Flag,
  Play,
  ShieldCheck,
  XCircle,
  MessageSquareWarning,
  Clock,
} from 'lucide-react';
import { COMPETENCY_META, getStageById } from '../engine/tasks';
import { FLAG_REASON_LABELS } from '../engine/integrity';
import { getAuditEventsForAttempt } from '../trust/audit';
import { submitLearnerAppeal } from '../trust/appeals';
import {
  markLiveRecheckPassed,
  ReRunVerificationResult,
  verifyEvidenceAttempt,
} from '../trust/evidence';
import { Attempt } from '../types';
import {
  AttemptStatusIndicator,
  ConfidenceDisplay,
  CriterionStatusIndicator,
  formatAttemptAnswerForDisplay,
  formatDateTime,
} from './StatusComponents';

export interface EvidenceScreenProps {
  attempt: Attempt;
  viewerRole: 'learner' | 'recruiter' | 'reviewer';
  onBack?: () => void;
  onAttemptUpdated?: () => void;
  onNotify?: (message: string) => void;
}

export const EvidenceScreen: React.FC<EvidenceScreenProps> = ({
  attempt,
  viewerRole,
  onBack,
  onAttemptUpdated,
  onNotify,
}) => {
  const found = getStageById(attempt.bundleId, attempt.stageId);
  const bundleTitle = found?.bundle.title || attempt.bundleId;
  const stageTitle = found?.stage.title || attempt.stageId;
  const stage = found?.stage;
  const compLabel =
    COMPETENCY_META[attempt.competency]?.label || attempt.competency;

  const auditEvents = getAuditEventsForAttempt(attempt.id);

  // Appeal modal state
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealConfirmStep, setAppealConfirmStep] = useState(false);

  // Recruiter re-run verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<ReRunVerificationResult | null>(null);

  const handleReRunTests = async () => {
    setIsVerifying(true);
    const res = await verifyEvidenceAttempt(attempt.id);
    setVerificationResult(res);
    setIsVerifying(false);
  };

  const handleLiveRecheck = () => {
    const actor = viewerRole === 'recruiter' ? 'Recruiter' : 'Reviewer';
    markLiveRecheckPassed(attempt.id, actor);
    onAttemptUpdated?.();
    onNotify?.('Live re-check recorded. Confidence raised to Higher.');
  };

  const handleConfirmAppeal = () => {
    if (!appealReason.trim()) return;
    submitLearnerAppeal(attempt.id, appealReason);
    setShowAppealForm(false);
    setAppealConfirmStep(false);
    setAppealReason('');
    onAttemptUpdated?.();
    onNotify?.('Appeal sent to human reviewer queue.');
  };

  const isFlaggedOrProvisional =
    attempt.status === 'flagged' || attempt.status === 'under_appeal';
  const isWithheldShortcut =
    attempt.status === 'reviewed' && attempt.score < 0;

  return (
    <div className="space-y-6">
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 py-2 text-sm font-medium text-[#0B1B3A] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
              <span>{bundleTitle}</span>
              <span aria-hidden="true">·</span>
              <span>{compLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Rubric {attempt.rubricVersion}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatDateTime(attempt.submittedAt)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0B1B3A]">{stageTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            <AttemptStatusIndicator
              status={attempt.status}
              score={attempt.score}
              flagReason={attempt.flagReason}
            />
            <div className="text-right">
              <div className="text-xs text-slate-500">Stage Score</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#0B1B3A]">
                {isFlaggedOrProvisional
                  ? 'Provisional'
                  : isWithheldShortcut
                  ? 'Withheld'
                  : `${attempt.score}/100`}
              </div>
            </div>
          </div>
        </div>

        {attempt.status === 'flagged' && (
          <div className="p-4 rounded-xl bg-[#F2B705]/20 border border-[#F2B705] text-sm text-[#0B1B3A] flex items-start gap-3">
            <Eye className="w-5 h-5 shrink-0 mt-0.5 text-[#0B1B3A]" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold">
                {attempt.flagReason === 'ai_disagreement'
                  ? 'The checks disagreed, so a person will decide.'
                  : 'This answer is with a human reviewer. No final score has been given yet.'}
              </p>
              <p className="text-xs text-slate-700">
                Reason:{' '}
                {attempt.flagReason
                  ? FLAG_REASON_LABELS[attempt.flagReason]
                  : 'Routed for human inspection'}{' '}
                {attempt.flagMessage ? `— ${attempt.flagMessage}` : ''}
              </p>
            </div>
          </div>
        )}

        {attempt.reviewerNote && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0B1B3A]">
            <span className="font-semibold">Human Reviewer Note:</span>{' '}
            {attempt.reviewerNote}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <ConfidenceDisplay
            confidence={attempt.confidence}
            confidenceReason={attempt.confidenceReason}
            telemetryLabel={attempt.telemetryLabel}
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* Recruiter / Reviewer actions */}
            {(viewerRole === 'recruiter' || viewerRole === 'reviewer') &&
              attempt.stageType === 'debug_code' && (
                <button
                  type="button"
                  onClick={handleReRunTests}
                  disabled={isVerifying}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#1E8E5A] hover:bg-[#177348] rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isVerifying
                      ? 'Re-running in sandbox...'
                      : `Re-run tests (seed #${attempt.seed})`}
                  </span>
                </button>
              )}

            {(viewerRole === 'recruiter' || viewerRole === 'reviewer') &&
              attempt.confidence !== 'higher' && (
                <button
                  type="button"
                  onClick={handleLiveRecheck}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0B1B3A] bg-[#F2B705]/30 hover:bg-[#F2B705]/45 border border-[#F2B705] rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Mark live re-check passed</span>
                </button>
              )}

            {/* Learner Appeal button */}
            {viewerRole === 'learner' &&
              attempt.status === 'scored' &&
              !showAppealForm && (
                <button
                  type="button"
                  onClick={() => setShowAppealForm(true)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0B1B3A] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Appeal this result</span>
                </button>
              )}
          </div>
        </div>

        {/* Verification banner when Recruiter clicks Re-run tests */}
        {verificationResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              verificationResult.verified
                ? 'bg-emerald-50 border-[#1E8E5A]/40 text-[#0B1B3A]'
                : 'bg-amber-50 border-[#F2B705] text-[#0B1B3A]'
            }`}
          >
            {verificationResult.verified ? (
              <CheckCircle2
                className="w-4 h-4 text-[#1E8E5A] shrink-0"
                aria-hidden="true"
              />
            ) : (
              <MessageSquareWarning
                className="w-4 h-4 text-amber-700 shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="font-semibold">{verificationResult.message}</span>
          </div>
        )}

        {/* Appeal form */}
        {showAppealForm && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
            <h4 className="text-sm font-semibold text-[#0B1B3A]">
              Appeal this result to a human reviewer
            </h4>
            <p className="text-xs text-slate-600">
              Explain why your answer satisfies the rubric criteria. While under
              appeal, this attempt status is marked Pending.
            </p>
            <textarea
              rows={3}
              value={appealReason}
              onChange={(e) => {
                setAppealReason(e.target.value);
                setAppealConfirmStep(false);
              }}
              placeholder="Required: Describe why your logic or phrasing meets the rubric..."
              className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg text-[#0B1B3A]"
              aria-label="Appeal reason"
            />
            <div className="flex flex-wrap items-center gap-2">
              {!appealConfirmStep ? (
                <button
                  type="button"
                  disabled={!appealReason.trim()}
                  onClick={() => setAppealConfirmStep(true)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#2E6FD8] hover:bg-[#2459B0] disabled:opacity-40 rounded-lg transition-colors"
                >
                  Continue to confirm appeal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmAppeal}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#1E8E5A] hover:bg-[#177348] rounded-lg transition-colors"
                >
                  Confirm &amp; send appeal now
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowAppealForm(false);
                  setAppealConfirmStep(false);
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submitted answer in monospace block */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1B3A]">Submitted Answer</h3>
          <span className="text-xs font-mono text-slate-500">
            Attempt ID: {attempt.id} · Seed #{attempt.seed}
          </span>
        </div>
        <pre className="p-4 rounded-xl bg-[#0B1B3A] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {formatAttemptAnswerForDisplay(attempt, stage)}
        </pre>
      </div>

      {/* Per-criterion breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1B3A]">
            Rubric Breakdown ({attempt.rubricVersion})
          </h3>
          <span className="text-xs text-slate-500">
            Deterministic rule evaluation
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {attempt.lineResults.map((lr) => (
            <div
              key={lr.criterionId}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0B1B3A]">
                    {lr.label}
                  </span>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    (weight {lr.weight})
                  </span>
                </div>
                <p className="text-xs text-slate-600">{lr.reason}</p>
                {lr.aiEvidenceQuote && (
                  <p className="text-xs font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    AI quoted substring: &ldquo;{lr.aiEvidenceQuote}&rdquo;
                  </p>
                )}
              </div>
              <CriterionStatusIndicator
                passed={lr.passed}
                needsReview={Boolean(lr.disputed || attempt.status === 'flagged')}
                pending={attempt.status === 'under_appeal'}
              />
            </div>
          ))}
        </div>

        {/* Hidden test summary if debug_code testResults are saved */}
        {attempt.testResults &&
          attempt.testResults.some((t) => t.hidden) && (
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-700">
                Hidden Test Execution Summary (Seed #{attempt.seed})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {attempt.testResults
                  .filter((t) => t.hidden)
                  .map((ht) => (
                    <div
                      key={ht.id}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center gap-1.5"
                    >
                      {ht.passed ? (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle
                          className="w-3.5 h-3.5 text-[#C8102E] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate font-mono text-[11px]">
                        {ht.name}: {ht.passed ? 'passed' : 'not passed'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>

      {/* Feedback shown & Vertical Audit Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#0B1B3A]">
            Attempt Audit Timeline &amp; Feedback Record
          </h3>
          {attempt.feedbackShown && (
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span>
                Rule reasons shown:{' '}
                <strong>
                  {attempt.feedbackShown.ruleReasonsShown ? 'Yes' : 'No'}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                AI hint used:{' '}
                <strong>
                  {attempt.feedbackShown.aiHintRequested
                    ? `Yes (${attempt.feedbackShown.aiHintLanguage || 'English'})`
                    : 'No'}
                </strong>
              </span>
              {attempt.feedbackShown.aiSecondOpinionUsed !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    AI second opinion:{' '}
                    <strong>
                      {attempt.feedbackShown.aiSecondOpinionUsed ? 'Yes' : 'No'}
                    </strong>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {auditEvents.length === 0 ? (
          <p className="text-xs text-slate-500">
            Submitted on {formatDateTime(attempt.submittedAt)} — immutable
            evidence record created.
          </p>
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
