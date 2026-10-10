import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Clock,
  History,
  Inbox,
  AlertTriangle,
  MailWarning,
  ShieldCheck,
} from 'lucide-react';
import { repository } from '../data/repository';
import { COMPETENCY_META, getStageById } from '../engine/tasks';
import {
  confirmShortcutDisqualification,
  resolveStudentAppealWithScore,
} from '../trust/appeals';
import { getAllAuditEvents } from '../trust/audit';
import { Attempt, AuditEventType } from '../types';
import {
  ConfidenceDisplay,
  CriterionStatusIndicator,
  formatAttemptAnswerForDisplay,
  formatDateTime,
} from './StatusComponents';

export interface ReviewerViewProps {
  activeSubTab: 'queue' | 'audit';
  onChangeSubTab: (tab: 'queue' | 'audit') => void;
  selectedAttemptId?: string | null;
  onSelectAttemptId?: (id: string | null) => void;
  onDataChanged: () => void;
  onNotify: (msg: string) => void;
}

export const ReviewerView: React.FC<ReviewerViewProps> = ({
  activeSubTab,
  onChangeSubTab,
  selectedAttemptId,
  onSelectAttemptId,
  onDataChanged,
  onNotify,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    'att-shortcut-case-a'
  );

  const effectiveSelectedId =
    selectedAttemptId !== undefined ? selectedAttemptId : internalSelectedId;

  const setSelectedId = (id: string) => {
    setInternalSelectedId(id);
    onSelectAttemptId?.(id);
  };

  // Case B (Student Appeal) form state — strictly empty initial score input!
  const [newScoreInput, setNewScoreInput] = useState<string>('');
  const [reviewerNote, setReviewerNote] = useState<string>('');

  // Audit filter state
  const [auditTypeFilter, setAuditTypeFilter] = useState<
    AuditEventType | 'all'
  >('all');

  const allAttempts = repository.getAttempts();

  // Queue items include Case A (cheating_shortcut / flagged / disqualified) and Case B (student_appeal / under_appeal / reviewed)
  const queueItems = allAttempts.filter(
    (a) =>
      a.reviewCaseType === 'cheating_shortcut' ||
      a.reviewCaseType === 'student_appeal' ||
      a.status === 'flagged' ||
      a.status === 'under_appeal' ||
      a.status === 'disqualified' ||
      a.status === 'reviewed'
  );

  // Order Case A first, Case B second
  const orderedQueueItems = [...queueItems].sort((a, b) => {
    if (a.id === 'att-shortcut-case-a') return -1;
    if (b.id === 'att-shortcut-case-a') return 1;
    if (a.id === 'att-asha-appeal-case-b') return -1;
    if (b.id === 'att-asha-appeal-case-b') return 1;
    return 0;
  });

  const activeItem: Attempt | undefined =
    orderedQueueItems.find((a) => a.id === effectiveSelectedId) ||
    orderedQueueItems[0];

  const activeAppeal = activeItem
    ? repository.getAppealByAttemptId(activeItem.id)
    : undefined;
  const activeLearner = activeItem
    ? repository.getProfileById(activeItem.learnerId)
    : undefined;
  const activeStageFound = activeItem
    ? getStageById(activeItem.bundleId, activeItem.stageId)
    : undefined;

  const isCaseACheating =
    activeItem?.reviewCaseType === 'cheating_shortcut' ||
    activeItem?.flagReason === 'hardcode_suspected' ||
    activeItem?.status === 'disqualified' ||
    activeItem?.status === 'flagged';

  // Case B validation: valid numeric score (0-100) AND >= 15 character reviewer note
  const parsedScore =
    newScoreInput.trim() === '' ? NaN : Number(newScoreInput.trim());
  const isScoreValid =
    !Number.isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100;
  const isNoteValid = reviewerNote.trim().length >= 15;
  const canSaveAppealScore = isScoreValid && isNoteValid;

  const handleConfirmDisqualification = () => {
    if (!activeItem) return;
    confirmShortcutDisqualification(activeItem.id);
    onDataChanged();
    onNotify(
      'Disqualification confirmed (Score Withheld). Audit Hash #AUD-9104 stamped to Global Audit Log.'
    );
  };

  const handleSaveAppealScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !canSaveAppealScore) return;
    resolveStudentAppealWithScore({
      attemptId: activeItem.id,
      newScore: parsedScore,
      reviewerNote: reviewerNote.trim(),
    });
    setNewScoreInput('');
    setReviewerNote('');
    onDataChanged();
    onNotify(
      `Appeal resolved: Score adjusted to ${Math.round(
        parsedScore
      )}/100 and Audit Hash #AUD-9208 recorded.`
    );
  };

  const auditEvents = getAllAuditEvents(auditTypeFilter);

  return (
    <div className="space-y-6">
      {/* Reviewer Console Header */}
      <div className="bg-[#F2B705]/25 border border-[#F2B705] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#0B1B3A]">
            ⚖️ Reviewer Governance Console (Faculty / ISRO Auditor)
          </div>
          <h1 className="text-xl font-bold text-[#0B1B3A]">
            Strict Separation: Cheating Disqualification vs. Student Appeals
          </h1>
          <p className="text-xs text-[#0B1B3A]/80">
            Hardcoded shortcuts can only be disqualified (score withheld).
            Legitimate student appeals require an explicit score and a minimum
            15-character audit rationale.
          </p>
        </div>

        <div className="flex items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'queue'}
            onClick={() => onChangeSubTab('queue')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors ${
              activeSubTab === 'queue'
                ? 'bg-[#0B1B3A] text-white'
                : 'bg-white text-[#0B1B3A] border border-[#0B1B3A]/20 hover:bg-slate-50'
            }`}
          >
            <Inbox className="w-4 h-4" aria-hidden="true" />
            <span>Reviewer Console (Queue &amp; Flags)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'audit'}
            onClick={() => onChangeSubTab('audit')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors ${
              activeSubTab === 'audit'
                ? 'bg-[#0B1B3A] text-white'
                : 'bg-white text-[#0B1B3A] border border-[#0B1B3A]/20 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Global Audit Log ({auditEvents.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'queue' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Queue Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-600 px-1">
              Governance Queue Cases ({orderedQueueItems.length})
            </div>

            {orderedQueueItems.map((item) => {
              const isSelected = activeItem?.id === item.id;
              const learnerObj = repository.getProfileById(item.learnerId);
              const isShortcutCase =
                item.reviewCaseType === 'cheating_shortcut' ||
                item.flagReason === 'hardcode_suspected' ||
                item.status === 'disqualified' ||
                item.status === 'flagged';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors space-y-2 ${
                    isSelected
                      ? 'bg-white border-2 border-[#0B1B3A] shadow-xs'
                      : 'bg-white/85 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                        isShortcutCase
                          ? 'bg-red-50 text-[#C8102E] border border-red-200'
                          : 'bg-amber-50 text-[#0B1B3A] border border-[#F2B705]'
                      }`}
                    >
                      {isShortcutCase
                        ? 'Case A: Suspected Shortcut / Cheating'
                        : 'Case B: Student Appeal'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500">
                      {item.auditHash || ''}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#0B1B3A]">
                    {learnerObj?.name || item.learnerId} —{' '}
                    {isShortcutCase
                      ? 'Hardcoded return 25'
                      : 'Floating-Point Precision Appeal'}
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      Score:{' '}
                      <strong>
                        {isShortcutCase
                          ? '0 / Withheld'
                          : `${item.score}/100`}
                      </strong>
                    </span>
                    <span className="tabular-nums">
                      {formatDateTime(item.submittedAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Governance Detail Panel (8 cols) */}
          {activeItem && (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              {/* Top Case Banner */}
              {isCaseACheating ? (
                <div className="p-4 rounded-xl bg-red-50 border border-[#C8102E]/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C8102E] inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                      <span>Case A: Suspected Shortcut / Cheating</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#C8102E] bg-white px-2.5 py-1 rounded border border-red-200">
                      Recorded Score: 0 / Withheld
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0B1B3A]">
                    ⚠️ Integrity Violation: Hardcoded Return Detected (Failed
                    9/10 hidden tests)
                  </div>
                  {activeItem.resolvedStatusLabel && (
                    <div className="p-2.5 rounded-lg bg-[#0B1B3A] text-white font-mono text-xs font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#F2B705]" />
                      <span>{activeItem.resolvedStatusLabel}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F2B705]/20 border border-[#F2B705] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B1B3A] inline-flex items-center gap-1.5">
                      <MailWarning className="w-4 h-4" aria-hidden="true" />
                      <span>Case B: Legitimate Student Appeal</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0B1B3A] bg-white px-2.5 py-1 rounded border border-amber-300">
                      Current Score: {activeItem.score}/100
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0B1B3A]">
                    📩 Appeal Submitted by {activeLearner?.name || 'Asha'}:
                    &ldquo;
                    {activeAppeal?.reason ||
                      'My solution handled decimals correctly; please inspect test #4 precision.'}
                    &rdquo;
                  </div>
                  {activeItem.resolvedStatusLabel && (
                    <div className="p-2.5 rounded-lg bg-[#1E8E5A] text-white font-mono text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{activeItem.resolvedStatusLabel}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Candidate & Task Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs text-slate-500">
                    Candidate:{' '}
                    <strong className="text-[#0B1B3A]">
                      {activeLearner?.name || activeItem.learnerId}
                    </strong>{' '}
                    ({activeLearner?.college}) ·{' '}
                    {COMPETENCY_META[activeItem.competency].displayTitle}
                  </div>
                  <h2 className="text-lg font-bold text-[#0B1B3A] mt-0.5">
                    {activeStageFound?.stage.title ||
                      'Fix calculateTotal(items) in Checkout Service'}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Recorded Score</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#0B1B3A]">
                    {isCaseACheating
                      ? '0 / Withheld'
                      : `${activeItem.score}/100`}
                  </div>
                </div>
              </div>

              {/* Split Inspection: Code/Answer on Left, Rubric & Test Breakdown on Right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#0B1B3A]">
                    Submitted Code / Answer Snapshot
                  </h3>
                  <pre className="p-4 rounded-xl bg-[#0B1B3A] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap min-h-[180px]">
                    {formatAttemptAnswerForDisplay(
                      activeItem,
                      activeStageFound?.stage
                    )}
                  </pre>

                  <ConfidenceDisplay
                    confidence={activeItem.confidence}
                    confidenceReason={activeItem.confidenceReason}
                    telemetryLabel={activeItem.telemetryLabel}
                    compact
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#0B1B3A]">
                    Per-Criterion &amp; Hidden Boundary Test Breakdown
                  </h3>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    {activeItem.lineResults.map((lr) => (
                      <div
                        key={lr.criterionId}
                        className="py-2.5 first:pt-0 last:pb-0 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#0B1B3A]">
                            {lr.label}
                          </span>
                          <CriterionStatusIndicator
                            passed={lr.passed}
                            needsReview={Boolean(lr.disputed)}
                          />
                        </div>
                        <p className="text-[11px] text-slate-600">{lr.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* STRICT GOVERNANCE ACTION PANEL */}
              <div className="pt-4 border-t border-slate-200">
                {isCaseACheating ? (
                  /* CASE A: ONLY show Confirm Disqualification (Withhold Score). No Adjust to 80, No Live Recheck! */
                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#C8102E]">
                        Mandatory Integrity Action (Cheating / Hardcoded Return)
                      </div>
                      <p className="text-xs text-slate-700">
                        Score adjustments and live re-checks are disabled for
                        hardcoded return violations. Confirming disqualification
                        permanently withholds the score and stamps{' '}
                        <span className="font-mono font-bold">#AUD-9104</span>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmDisqualification}
                      className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-[#C8102E] hover:bg-red-800 rounded-xl inline-flex items-center gap-2 shrink-0 transition-colors shadow-xs"
                    >
                      <Ban className="w-4 h-4" aria-hidden="true" />
                      <span>🚫 Confirm Disqualification (Withhold Score)</span>
                    </button>
                  </div>
                ) : (
                  /* CASE B: Student Appeal — Empty numeric input + >= 15-char mandatory note */
                  <form
                    onSubmit={handleSaveAppealScore}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-[#0B1B3A]">
                        Case B Appeal Resolution (Requires Numeric Score &amp;
                        &ge; 15-Character Note)
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {reviewerNote.trim().length} / 15 min chars
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      <div className="sm:col-span-4">
                        <label
                          htmlFor="appeal-new-score-input"
                          className="block text-xs font-semibold text-[#0B1B3A] mb-1"
                        >
                          New Score (0–100):
                        </label>
                        <input
                          id="appeal-new-score-input"
                          type="number"
                          min={0}
                          max={100}
                          value={newScoreInput}
                          onChange={(e) => setNewScoreInput(e.target.value)}
                          placeholder="____"
                          className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-[#0B1B3A] tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-8">
                        <label
                          htmlFor="appeal-reviewer-note"
                          className="block text-xs font-semibold text-[#0B1B3A] mb-1"
                        >
                          Mandatory Reviewer Note (min 15 characters):
                        </label>
                        <input
                          id="appeal-reviewer-note"
                          type="text"
                          value={reviewerNote}
                          onChange={(e) => setReviewerNote(e.target.value)}
                          placeholder="e.g., Inspected test #4 IEEE-754 rounding; Number(toFixed(2)) is valid..."
                          className="w-full min-h-[42px] px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-[#0B1B3A]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={!canSaveAppealScore}
                        className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-[#1E8E5A] hover:bg-[#177348] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl inline-flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Save Adjusted Score</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Global Audit Log Tab */
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0B1B3A]">
                Global Immutable Audit Log ({auditEvents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Cryptographic-style audit hashes (#AUD-XXXX) for every
                submission, integrity alert, disqualification, consent toggle,
                and appeal resolution.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="audit-type-filter"
                className="text-xs font-semibold text-slate-600"
              >
                Filter event type:
              </label>
              <select
                id="audit-type-filter"
                value={auditTypeFilter}
                onChange={(e) =>
                  setAuditTypeFilter(e.target.value as AuditEventType | 'all')
                }
                className="min-h-[38px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A]"
              >
                <option value="all">All events</option>
                <option value="scored">scored</option>
                <option value="flagged">flagged</option>
                <option value="disqualified">disqualified</option>
                <option value="consent_on">consent_on</option>
                <option value="consent_off">consent_off</option>
                <option value="appeal_opened">appeal_opened</option>
                <option value="appeal_decided">appeal_decided</option>
              </select>
            </div>
          </div>

          <ol className="relative border-s border-slate-200 ms-3 space-y-4">
            {auditEvents.map((ev) => (
              <li key={ev.id} className="ms-4">
                <div className="absolute w-2.5 h-2.5 bg-[#0B1B3A] rounded-full mt-1.5 -start-[5px] border border-white" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {formatDateTime(ev.ts)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold text-[#0B1B3A] bg-slate-100 px-2 py-0.5 rounded">
                    {ev.auditHash}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#0B1B3A]">
                    {ev.actor}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-[#2E6FD8]">
                    {ev.type}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">{ev.details}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
