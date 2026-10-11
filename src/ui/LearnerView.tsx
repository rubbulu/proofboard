import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  HelpCircle,
  Play,
  RotateCcw,
  Send,
  XCircle,
  Flag,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  AI_HINT_BADGE_LABEL,
  AIHintResult,
  requestAIHint,
} from '../ai/adapter';
import { repository } from '../data/repository';
import { runDebugCodeInWorker } from '../engine/runner';
import { ArrangeStepsStage } from '../engine/stages/ArrangeStepsStage';
import { BugDiagnosisStage } from '../engine/stages/BugDiagnosisStage';
import { DebugCodeStage } from '../engine/stages/DebugCodeStage';
import { PseudocodeStage } from '../engine/stages/PseudocodeStage';
import {
  evaluateStageSubmission,
  STAGE_REGISTRY,
} from '../engine/stages/registry';
import {
  BUNDLES,
  CLEAN_VERIFIED_CART_CODE,
  CLEAN_VERIFIED_EXPLAIN_BACK,
  COMPETENCY_META,
  HARDCODED_SHORTCUT_CART_CODE,
} from '../engine/tasks';
import { submitLearnerAppeal } from '../trust/appeals';
import { logAuditEvent } from '../trust/audit';
import { recordAttemptEvidence } from '../trust/evidence';
import { DEMO_STUDENT_ID_SAMPLES } from '../trust/verification';
import {
  Attempt,
  EvidenceDrawerTab,
  HintLanguage,
  Profile,
  Stage,
  TestExecutionResult,
} from '../types';
import {
  AttemptStatusIndicator,
  ConfidenceDisplay,
  CriterionStatusIndicator,
  formatDateTime,
} from './StatusComponents';

export interface LearnerViewProps {
  learner: Profile;
  selectedStageIndex: number;
  onSelectStageIndex: (idx: number) => void;
  onOpenEvidenceDrawer: (attempt: Attempt, tab?: EvidenceDrawerTab) => void;
  onOpenVerifyLearner?: () => void;
  onDataChanged: () => void;
  onNotify: (msg: string) => void;
}

export const LearnerView: React.FC<LearnerViewProps> = ({
  learner,
  selectedStageIndex,
  onSelectStageIndex,
  onOpenEvidenceDrawer,
  onOpenVerifyLearner,
  onDataChanged,
  onNotify,
}) => {
  const isLearnerVerified =
    (learner.verificationStatus || 'UNVERIFIED') === 'VERIFIED';
  const activeBundle = BUNDLES[0];
  const activeStage: Stage =
    activeBundle.stages[selectedStageIndex] || activeBundle.stages[0];

  const [seed, setSeed] = useState<number>(482910);
  const [answer, setAnswer] = useState<string | string[] | number[]>('');
  const [practiceResults, setPracticeResults] = useState<
    TestExecutionResult[] | null
  >(null);
  const [practiceError, setPracticeError] = useState<string | undefined>();
  const [isRunningPractice, setIsRunningPractice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep AI Second Opinion checked [x] by default on Stage 4
  const [aiSecondOpinionOptIn, setAiSecondOpinionOptIn] = useState(true);
  const [validationMessage, setValidationMessage] = useState<
    string | undefined
  >();
  const [latestSubmittedAttempt, setLatestSubmittedAttempt] =
    useState<Attempt | null>(null);

  // AI Hint state
  const [hintLanguage, setHintLanguage] = useState<HintLanguage>('English');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintResult, setHintResult] = useState<AIHintResult | null>(null);
  const [hintRequestedInSession, setHintRequestedInSession] = useState(false);
  const [showVerifyGateModal, setShowVerifyGateModal] = useState(false);
  const [desiredAttemptByStage, setDesiredAttemptByStage] = useState<
    Record<string, string>
  >({});

  const stageAttemptCount = repository.getAttemptsByStage(
    learner.learnerId,
    activeStage.id
  ).length;

  const getDesiredAttemptForStage = (stg: Stage): Attempt | undefined => {
    const attempts = repository.getAttemptsByStage(learner.learnerId, stg.id);
    if (attempts.length === 0) return undefined;
    const explicitId = desiredAttemptByStage[stg.id];
    if (explicitId) {
      const found = attempts.find((a) => a.id === explicitId);
      if (found) return found;
    }
    const publishedAtt = attempts.find((a) => a.published === true);
    if (publishedAtt) return publishedAtt;
    const cleanReversed = [...attempts]
      .reverse()
      .find((a) => a.status !== 'flagged' && a.status !== 'disqualified');
    return cleanReversed || attempts[attempts.length - 1];
  };

  const completedStagesCount = activeBundle.stages.filter(
    (stg) =>
      repository.getAttemptsByStage(learner.learnerId, stg.id).length > 0
  ).length;
  const allFourStagesCompleted =
    completedStagesCount === activeBundle.stages.length;

  // Sync stage workspace with latest attempt or default answer when stage or preset changes
  useEffect(() => {
    const newSeed = Math.floor(100000 + Math.random() * 899999);
    setSeed(newSeed);
    setPracticeResults(null);
    setPracticeError(undefined);
    setValidationMessage(undefined);
    setHintResult(null);

    const stageHistory = repository.getAttemptsByStage(
      learner.learnerId,
      activeStage.id
    );
    const latestForLearner =
      stageHistory.length > 0 ? stageHistory[stageHistory.length - 1] : null;

    // Also check if Preset 2 was just triggered on stage 2
    const activePreset = repository.getActivePitchPreset();
    if (activePreset === 2 && activeStage.type === 'debug_code') {
      const shortcutAttempt = repository.getAttemptById('att-shortcut-case-a');
      setAnswer(HARDCODED_SHORTCUT_CART_CODE);
      setLatestSubmittedAttempt(shortcutAttempt || latestForLearner);
      return;
    }

    if (latestForLearner) {
      setLatestSubmittedAttempt(latestForLearner);
      setAnswer(latestForLearner.answer);
    } else {
      const descriptor = STAGE_REGISTRY[activeStage.type];
      setAnswer(descriptor.getDefaultAnswer(activeStage, newSeed));
      setLatestSubmittedAttempt(null);
    }
  }, [
    activeStage.id,
    learner.learnerId,
    learner.verificationStatus,
    stageAttemptCount,
    repository.getActivePitchPreset(),
  ]);

  const handlePracticeRun = async () => {
    if (activeStage.type !== 'debug_code') return;
    setIsRunningPractice(true);
    setPracticeError(undefined);
    setValidationMessage(undefined);

    const code = typeof answer === 'string' ? answer : '';
    const out = await runDebugCodeInWorker(activeStage, code, false, seed);

    setPracticeResults(out.testResults);
    setPracticeError(out.syntaxOrRuntimeError);
    setIsRunningPractice(false);

    logAuditEvent({
      actor: learner.name,
      learnerId: learner.learnerId,
      type: 'run_practice',
      details: `Ran Practice Tests (3 visible cases) on "${activeStage.title}": ${
        out.testResults.filter((r) => r.passed).length
      }/3 passed.`,
    });
  };

  const handleSubmitStage = async () => {
    if (!isLearnerVerified) {
      setShowVerifyGateModal(true);
      return;
    }

    setIsSubmitting(true);
    setValidationMessage(undefined);
    setPracticeError(undefined);

    const evalOut = await evaluateStageSubmission({
      bundleId: activeBundle.id,
      stage: activeStage,
      learnerId: learner.learnerId,
      actorName: learner.name,
      answer,
      seed,
      aiSecondOpinionOptIn,
      aiHintRequestedInSession: hintRequestedInSession,
      aiHintLanguage: hintLanguage,
    });

    if (evalOut.validationBlocked) {
      setValidationMessage(evalOut.validationMessage);
      setIsSubmitting(false);
      return;
    }

    if (evalOut.runtimeError) {
      setPracticeError(evalOut.runtimeError);
    }

    if (evalOut.attempt) {
      const { attempt: savedAttempt } = recordAttemptEvidence(
        evalOut.attempt,
        learner.name
      );
      setLatestSubmittedAttempt(savedAttempt);
      setDesiredAttemptByStage((prev) => ({
        ...prev,
        [activeStage.id]: savedAttempt.id,
      }));
      onDataChanged();

      if (savedAttempt.status === 'flagged') {
        onNotify(
          'Integrity Alert: Hardcoded Return Suspected — Passed 3 visible tests, failed 9/10 hidden tests. Score Withheld (Not published).'
        );
      } else {
        onNotify(
          `Stage ${activeStage.stageNumber} scored ${savedAttempt.score}/100 (Saved as Sandbox Draft — complete all 4 stages and click Publish when comfortable).`
        );
      }
    }

    setIsSubmitting(false);
  };

  const handlePublishDesiredAttempts = () => {
    if (!isLearnerVerified) {
      setShowVerifyGateModal(true);
      return;
    }
    if (!allFourStagesCompleted) {
      onNotify(
        `Please complete all 4 stages first (${completedStagesCount}/4 completed) before publishing to your Competency Profile and Recruiter Portal.`
      );
      return;
    }

    const selectionMap: Record<string, string> = {};
    for (const stg of activeBundle.stages) {
      const chosen = getDesiredAttemptForStage(stg);
      if (chosen) {
        selectionMap[stg.id] = chosen.id;
      }
    }

    repository.publishLearnerAssessment(learner.learnerId, selectionMap);
    onDataChanged();
    onNotify(
      'Published! Your chosen attempts across all 4 stages are now uploaded to My Competency Profile and visible to Verified NxtMove Recruiters.'
    );
  };

  const handleUnpublishAssessment = () => {
    repository.unpublishLearnerAssessment(learner.learnerId);
    onDataChanged();
    onNotify(
      'Withdrawn from Profile & Recruiter Portal. Your attempts remain safely in your private Task Sandbox.'
    );
  };

  const handleRequestAIHint = async () => {
    setIsLoadingHint(true);
    setHintRequestedInSession(true);

    let failingNames: string[] = [];
    if (activeStage.type === 'debug_code' && practiceResults) {
      failingNames = practiceResults
        .filter((r) => !r.passed && !r.hidden)
        .map((r) => r.name);
    }
    if (failingNames.length === 0 && latestSubmittedAttempt) {
      failingNames = latestSubmittedAttempt.lineResults
        .filter((lr) => !lr.passed)
        .map((lr) => lr.label);
    }
    if (failingNames.length === 0) {
      failingNames = activeStage.rubric.map((r) => r.label);
    }

    const res = await requestAIHint({
      taskTitle: activeStage.title,
      failingNames,
      language: hintLanguage,
      learnerId: learner.learnerId,
      actorName: learner.name,
      attemptId: latestSubmittedAttempt?.id,
    });

    setHintResult(res);
    setIsLoadingHint(false);
    onDataChanged();
  };

  const getStageBadge = (stg: Stage) => {
    const selected = getDesiredAttemptForStage(stg);
    if (!selected) {
      return { state: 'pending' as const, text: 'Not started' };
    }
    const pubSuffix = selected.published ? ' · Published' : ' · Draft';
    if (selected.status === 'flagged') {
      return { state: 'flagged' as const, text: 'Withheld' };
    }
    if (selected.score >= 80) {
      return {
        state: 'passed' as const,
        text: `${selected.score}/100${pubSuffix}`,
      };
    }
    return {
      state: 'failed' as const,
      text: `${selected.score}/100${pubSuffix}`,
    };
  };

  const compInfo = COMPETENCY_META[activeStage.competency];

  return (
    <div className="space-y-6">
      {/* Task Sandbox Header + Guided 4-Stage Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#2E6FD8]">
                Role Track: {activeBundle.role}
              </span>
              <span aria-hidden="true">·</span>
              <span>4-Stage Proof-of-Skill Assessment</span>
              <span aria-hidden="true">·</span>
              <span>Rubric {activeBundle.version}</span>
            </div>
            <h1 className="text-xl font-bold text-[#0B1B3A]">
              {activeBundle.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1E8E5A] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              📋 Telemetry: Natural Keystrokes (No Bulk Paste)
            </span>
          </div>
        </div>

        {/* 4-Stage Stepper */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1"
          role="tablist"
          aria-label="4-Stage Learner Sandbox Progression"
        >
          {activeBundle.stages.map((stg, idx) => {
            const isCurrent = idx === selectedStageIndex;
            const badge = getStageBadge(stg);

            return (
              <button
                key={stg.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => onSelectStageIndex(idx)}
                className={`min-h-[54px] p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 ${
                  isCurrent
                    ? 'bg-[#0B1B3A] text-white border-[#0B1B3A]'
                    : 'bg-slate-50 text-[#0B1B3A] border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    {stg.shortTitle}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      isCurrent ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {COMPETENCY_META[stg.competency].shortLabel}
                  </div>
                </div>

                <div className="shrink-0">
                  {badge.state === 'passed' && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${
                        isCurrent ? 'text-emerald-400' : 'text-[#1E8E5A]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{badge.text}</span>
                    </span>
                  )}
                  {badge.state === 'flagged' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F2B705]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Withheld</span>
                    </span>
                  )}
                  {badge.state === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#C8102E]">
                      <XCircle className="w-4 h-4" />
                      <span>{badge.text}</span>
                    </span>
                  )}
                  {badge.state === 'pending' && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isCurrent ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Not started</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4-Stage Completion & Publish Desired Attempt Panel */}
        <div
          className={`mt-3 p-4 rounded-xl border-2 space-y-3 transition-colors ${
            learner.hasPublishedAssessment
              ? 'bg-emerald-50/70 border-[#1E8E5A]'
              : allFourStagesCompleted
              ? 'bg-blue-50/70 border-[#2E6FD8]'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#0B1B3A]">
                  Learner Publish Control ({completedStagesCount}/4 Stages
                  Completed)
                </span>
                {learner.hasPublishedAssessment ? (
                  <span className="inline-flex items-center gap-1 font-bold text-white bg-[#1E8E5A] px-2.5 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Published to Profile &amp; Recruiter Portal</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-[#0B1B3A] bg-[#F2B705] px-2.5 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Private Sandbox Draft — Not Published to Profile or
                      Recruiter Yet
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                {allFourStagesCompleted
                  ? 'All 4 stages are completed! Choose your desired attempt for each stage below. If you made a mistake on any stage and are not comfortable publishing it, you can retry that stage first. Only when you click "Publish Solved Problem" will your solution be uploaded to My Competency Profile and visible to NxtMove Recruiters.'
                  : `Solve all 4 stages in the Sandbox first (${completedStagesCount}/4 completed). If you make a mistake on any stage, nothing is sent to your Profile or Recruiters—you can retry freely and publish only your desired attempts once all 4 stages are done.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {learner.hasPublishedAssessment && (
                <button
                  type="button"
                  onClick={handleUnpublishAssessment}
                  className="min-h-[40px] px-3.5 py-2 text-xs font-bold text-[#C8102E] bg-white hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                >
                  Unpublish / Withdraw
                </button>
              )}

              <button
                type="button"
                disabled={!allFourStagesCompleted}
                onClick={handlePublishDesiredAttempts}
                className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-[#1E8E5A] hover:bg-[#177348] disabled:bg-slate-300 disabled:text-slate-600 rounded-xl inline-flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {!allFourStagesCompleted
                    ? `Complete All 4 Stages to Publish (${completedStagesCount}/4)`
                    : learner.hasPublishedAssessment
                    ? 'Update Published Attempts'
                    : 'Publish Solved Problem to Profile & Recruiter'}
                </span>
              </button>
            </div>
          </div>

          {/* Per-Stage Desired Attempt Selector Grid */}
          {completedStagesCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80">
              {activeBundle.stages.map((stg, idx) => {
                const stgAttempts = repository.getAttemptsByStage(
                  learner.learnerId,
                  stg.id
                );
                const selectedAtt = getDesiredAttemptForStage(stg);

                return (
                  <div
                    key={stg.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#0B1B3A] truncate">
                        {stg.shortTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectStageIndex(idx)}
                        className="text-[11px] font-semibold text-[#2E6FD8] hover:underline shrink-0"
                      >
                        {stgAttempts.length > 0 ? 'Retry / View' : 'Solve'}
                      </button>
                    </div>

                    {stgAttempts.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">
                        Not solved yet (0 attempts)
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-500">
                          Desired Attempt to Publish:
                        </label>
                        <select
                          aria-label={`Select desired attempt for ${stg.shortTitle}`}
                          value={selectedAtt?.id || ''}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            setDesiredAttemptByStage((prev) => ({
                              ...prev,
                              [stg.id]: nextId,
                            }));
                            if (idx === selectedStageIndex) {
                              const found = stgAttempts.find(
                                (a) => a.id === nextId
                              );
                              if (found) {
                                setLatestSubmittedAttempt(found);
                                setAnswer(found.answer);
                              }
                            }
                          }}
                          className="w-full min-h-[32px] px-2 py-1 text-[11px] font-mono bg-slate-50 border border-slate-300 rounded text-[#0B1B3A]"
                        >
                          {stgAttempts.map((att, aIdx) => (
                            <option key={att.id} value={att.id}>
                              Attempt #{aIdx + 1} —{' '}
                              {att.status === 'flagged'
                                ? 'Withheld'
                                : `${att.score}/100`}
                              {att.published ? ' (Published)' : ' (Draft)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Split: Left 40% (Rubric & Rules) | Right 60% (Stage Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel (5 cols): Stage Instructions + Visible Rubric V1 / Concept Rules */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <span className="font-bold text-[#2E6FD8]">
                {compInfo.displayTitle}
              </span>
              <span aria-hidden="true">·</span>
              <span>Rubric {activeStage.rubricVersion}</span>
            </div>
            <h2 className="text-lg font-bold text-[#0B1B3A]">
              {activeStage.title}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeStage.instructions}
            </p>
          </div>

          {/* Left Panel Rubric Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1B3A]">
                {activeStage.type === 'pseudocode'
                  ? 'Deterministic Concept Matching Rules (V1)'
                  : 'Visible Rubric V1'}
              </h3>
              <span className="text-xs font-mono text-slate-500">
                100% Deterministic
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {activeStage.rubric.map((crit) => {
                const totalWeight = activeStage.rubric.reduce(
                  (s, c) => s + c.weight,
                  0
                );
                const pct =
                  crit.percentageLabel ||
                  `${Math.round((crit.weight / totalWeight) * 100)}%`;

                return (
                  <div
                    key={crit.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0B1B3A]">
                        {crit.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#2E6FD8] tabular-nums shrink-0">
                        {pct}
                      </span>
                    </div>
                    {crit.description && (
                      <p className="text-xs text-slate-600">
                        {crit.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel (7 cols): Interactive Stage Editor & Results */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
            {activeStage.type === 'bug_diagnosis' && (
              <BugDiagnosisStage
                stage={activeStage}
                selectedOptionId={typeof answer === 'string' ? answer : ''}
                onSelectOption={(optId) => setAnswer(optId)}
              />
            )}

            {activeStage.type === 'debug_code' && (
              <DebugCodeStage
                stage={activeStage}
                code={typeof answer === 'string' ? answer : ''}
                onChange={(val) => setAnswer(val)}
                practiceResults={practiceResults}
                practiceError={practiceError}
                isRunning={isRunningPractice}
                onLoadCleanFix={() => {
                  setAnswer(CLEAN_VERIFIED_CART_CODE);
                  onNotify('Loaded clean loop fix into editor.');
                }}
                onLoadShortcutDemo={() => {
                  setAnswer(HARDCODED_SHORTCUT_CART_CODE);
                  onNotify(
                    'Loaded hardcoded shortcut: if (price === 10) return 25.'
                  );
                }}
                onResetStarter={() =>
                  setAnswer(activeStage.starterCode || '')
                }
              />
            )}

            {activeStage.type === 'arrange_steps' && (
              <ArrangeStepsStage
                stage={activeStage}
                orderedIndices={
                  Array.isArray(answer) ? answer.map(Number) : [1, 3, 2, 0]
                }
                onChangeOrder={(next) => setAnswer(next)}
              />
            )}

            {activeStage.type === 'pseudocode' && (
              <PseudocodeStage
                stage={activeStage}
                text={typeof answer === 'string' ? answer : ''}
                onChange={(val) => setAnswer(val)}
                aiSecondOpinionOptIn={aiSecondOpinionOptIn}
                onToggleAiSecondOpinion={setAiSecondOpinionOptIn}
                onLoadSamplePseudocode={() => {
                  setAnswer(CLEAN_VERIFIED_EXPLAIN_BACK);
                  onNotify('Loaded verified Stage 4 pseudocode & explain-back.');
                }}
              />
            )}

            {validationMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-amber-50 border border-[#F2B705] text-xs text-[#0B1B3A] font-medium"
              >
                {validationMessage}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                {activeStage.type === 'debug_code'
                  ? 'Practice runs 3 visible tests · Submit runs 3 visible + 10 unseen boundary tests'
                  : `Stage ${activeStage.stageNumber} of 4`}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {activeStage.type === 'debug_code' && (
                  <button
                    type="button"
                    onClick={handlePracticeRun}
                    disabled={isRunningPractice || isSubmitting}
                    className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#0B1B3A] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play
                      className="w-4 h-4 text-[#2E6FD8]"
                      aria-hidden="true"
                    />
                    <span>
                      {isRunningPractice
                        ? 'Running 3 visible tests...'
                        : 'Run Practice Tests'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmitStage}
                  disabled={isSubmitting || isRunningPractice}
                  className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-[#2E6FD8] hover:bg-[#2459B0] disabled:opacity-50 rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isSubmitting ? 'Scoring...' : 'Submit for Scoring'}
                  </span>
                </button>

                {selectedStageIndex < activeBundle.stages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onSelectStageIndex(selectedStageIndex + 1)}
                    className="min-h-[44px] px-3.5 py-2.5 text-xs font-semibold text-[#0B1B3A] bg-slate-100 hover:bg-slate-200 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Student ID Verification Required Modal when clicking Submit for Scoring while Unverified */}
          {showVerifyGateModal && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="verify-gate-modal-title"
              className="fixed inset-0 z-50 bg-[#0B1B3A]/60 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg bg-white border-2 border-[#F2B705] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        Track A Student ID Verification Required (Status:{' '}
                        {learner.verificationStatus})
                      </span>
                    </span>
                    <h3
                      id="verify-gate-modal-title"
                      className="text-lg font-bold text-[#0B1B3A] pt-1"
                    >
                      Verify Your Student ID Before Official Scoring
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVerifyGateModal(false)}
                    className="text-slate-400 hover:text-[#0B1B3A] text-xs font-bold px-2 py-1"
                  >
                    Close
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  You can write code and run <strong>Practice Tests</strong>{' '}
                  anytime without verification. However, submitting for official
                  rubric scoring (3 visible + 10 hidden boundary tests) and
                  creating an immutable evidence record requires one-time{' '}
                  <strong>Track A Student ID Verification</strong>.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-[#0B1B3A]">
                    What happens during Track A Verification:
                  </div>
                  <ul className="list-disc ps-4 text-slate-600 space-y-0.5">
                    <li>Upload your Student ID photo (or pick a Demo Sample ID)</li>
                    <li>
                      Client-side OCR autofills Name, ID#, Institution, and
                      Validity Year (read-only)
                    </li>
                    <li>
                      Deterministic <code className="font-mono">decide()</code>{' '}
                      verifies your ID and unlocks official scoring &amp;
                      recruiter sharing
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = {
                        ...DEMO_STUDENT_ID_SAMPLES[0],
                        fullName: learner.name,
                      };
                      const rec = repository.submitLearnerVerification(
                        learner.learnerId,
                        sample
                      );
                      setShowVerifyGateModal(false);
                      onDataChanged();
                      onNotify(
                        `Quick Demo Verification complete (${rec.auditHash})! You can now click Submit for Scoring.`
                      );
                    }}
                    className="min-h-[42px] px-4 py-2 text-xs font-bold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors"
                  >
                    Quick Demo Verification
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVerifyGateModal(false);
                      onOpenVerifyLearner?.();
                    }}
                    className="min-h-[42px] px-4 py-2 text-xs font-bold text-white bg-[#2E6FD8] hover:bg-[#2459B0] rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Verify Student ID First</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Card */}
          {latestSubmittedAttempt && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span>Evaluation Result</span>
                    <span aria-hidden="true">·</span>
                    <span>Rubric {latestSubmittedAttempt.rubricVersion}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {formatDateTime(latestSubmittedAttempt.submittedAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    {latestSubmittedAttempt.published ? (
                      <span className="font-bold text-[#1E8E5A] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Published to Profile &amp; Recruiter
                      </span>
                    ) : (
                      <span className="font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                        Sandbox Draft (Not Published Yet)
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#0B1B3A] mt-0.5">
                    {latestSubmittedAttempt.status === 'flagged' ||
                    latestSubmittedAttempt.status === 'disqualified'
                      ? 'Recorded Score: 0 / Withheld'
                      : `Recorded Score: ${latestSubmittedAttempt.score}/100`}
                  </h3>
                </div>

                <AttemptStatusIndicator
                  status={latestSubmittedAttempt.status}
                  score={latestSubmittedAttempt.score}
                  flagReason={latestSubmittedAttempt.flagReason}
                />
              </div>

              {/* Integrity Alert Banner when shortcut caught */}
              {(latestSubmittedAttempt.status === 'flagged' ||
                latestSubmittedAttempt.status === 'disqualified') && (
                <div className="p-4 rounded-xl bg-red-50 border border-[#C8102E]/40 text-xs text-[#0B1B3A] space-y-1.5">
                  <div className="font-bold text-sm text-[#C8102E]">
                    ⚠️ Integrity Alert: Hardcoded Return Suspected
                  </div>
                  <p className="text-slate-800">
                    {latestSubmittedAttempt.flagMessage ||
                      'Passed 3/3 visible tests, but failed 9/10 randomized unseen boundary tests. Recorded Score: 0 / Withheld and routed to Reviewer Console.'}
                  </p>
                </div>
              )}

              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                {latestSubmittedAttempt.lineResults.map((lr) => (
                  <div
                    key={lr.criterionId}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#0B1B3A]">
                        {lr.label}
                      </div>
                      <p className="text-xs text-slate-600">{lr.reason}</p>
                    </div>
                    <CriterionStatusIndicator
                      passed={lr.passed}
                      needsReview={Boolean(
                        lr.disputed ||
                          latestSubmittedAttempt.status === 'flagged'
                      )}
                      pending={latestSubmittedAttempt.status === 'under_appeal'}
                    />
                  </div>
                ))}
              </div>

              {/* 13 Tests Summary Grid */}
              {latestSubmittedAttempt.testResults &&
                latestSubmittedAttempt.testResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0B1B3A]">
                        Web Worker Sandbox Test Log (
                        {
                          latestSubmittedAttempt.testResults.filter(
                            (t) => t.passed
                          ).length
                        }
                        /{latestSubmittedAttempt.testResults.length} passed)
                      </span>
                      <span className="font-mono text-slate-500">
                        Seed #{latestSubmittedAttempt.seed}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {latestSubmittedAttempt.testResults.map((tr) => (
                        <div
                          key={tr.id}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 ${
                            tr.passed
                              ? 'bg-emerald-50/60 border-emerald-200 text-[#0B1B3A]'
                              : 'bg-red-50 border-red-200 text-[#C8102E]'
                          }`}
                        >
                          {tr.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />
                          )}
                          <span className="truncate">{tr.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <ConfidenceDisplay
                  confidence={latestSubmittedAttempt.confidence}
                  confidenceReason={latestSubmittedAttempt.confidenceReason}
                  telemetryLabel={latestSubmittedAttempt.telemetryLabel}
                  compact
                />

                <button
                  type="button"
                  onClick={() =>
                    onOpenEvidenceDrawer(latestSubmittedAttempt, 'diff')
                  }
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#2E6FD8] bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Inspect Evidence Drawer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Learner [My Appeals] Sub-Tab View
 */
export const LearnerAppealsView: React.FC<{
  learner: Profile;
  onDataChanged: () => void;
  onNotify: (msg: string) => void;
}> = ({ learner, onDataChanged, onNotify }) => {
  const appeals = repository
    .getAppeals()
    .filter((a) => a.learnerId === learner.learnerId);
  const learnerAttempts = repository.getAttemptsByLearner(learner.learnerId);

  const [selectedAttemptId, setSelectedAttemptId] = useState<string>(
    learnerAttempts[0]?.id || ''
  );
  const [reasonText, setReasonText] = useState('');

  const handleSubmitNewAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttemptId || !reasonText.trim()) return;
    submitLearnerAppeal(selectedAttemptId, reasonText.trim());
    setReasonText('');
    onDataChanged();
    onNotify('Appeal submitted to Reviewer Console.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <div className="text-xs font-bold text-[#2E6FD8]">
          Learner Right-to-Appeal · Human Governance
        </div>
        <h1 className="text-xl font-bold text-[#0B1B3A]">
          My Submitted Appeals ({appeals.length})
        </h1>
        <p className="text-xs text-slate-600">
          If a deterministic test case or floating-point precision check did not
          reflect your solution accurately, you can request a human faculty /
          ISRO auditor review.
        </p>
      </div>

      {/* Existing Appeals List */}
      <div className="space-y-3">
        {appeals.map((ap) => {
          const att = repository.getAttemptById(ap.attemptId);
          return (
            <div
              key={ap.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Flag className="w-4 h-4 text-[#2E6FD8]" />
                  <span className="font-bold text-[#0B1B3A]">
                    Task: Fix calculateTotal(items) in Checkout Service
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">
                    Attempt {ap.attemptId}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    ap.status === 'open'
                      ? 'bg-[#F2B705]/30 text-[#0B1B3A]'
                      : 'bg-emerald-50 text-[#1E8E5A]'
                  }`}
                >
                  {ap.status === 'open'
                    ? 'Pending Human Reviewer'
                    : `Resolved (Adjusted to ${ap.adjustedScore ?? att?.score}/100) ${
                        ap.auditHash ? `| ${ap.auditHash}` : ''
                      }`}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#0B1B3A]">
                <span className="font-semibold">Your Appeal Statement: </span>
                &ldquo;{ap.reason}&rdquo;
              </div>

              {ap.reviewerNote && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#0B1B3A]">
                  <span className="font-semibold text-[#1E8E5A]">
                    Reviewer Decision Note:{' '}
                  </span>
                  {ap.reviewerNote}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* File a New Appeal Form */}
      <form
        onSubmit={handleSubmitNewAppeal}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-sm font-bold text-[#0B1B3A]">
          Submit a New Appeal on a Scored Attempt
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="appeal-attempt-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Select Attempt
            </label>
            <select
              id="appeal-attempt-select"
              value={selectedAttemptId}
              onChange={(e) => setSelectedAttemptId(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#0B1B3A]"
            >
              {learnerAttempts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stageId} — Score {a.score}/100 ({formatDateTime(a.submittedAt)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="appeal-reason-input"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Reason for Appeal
          </label>
          <textarea
            id="appeal-reason-input"
            rows={3}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Explain why your implementation or precision handling should be inspected..."
            className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg text-[#0B1B3A]"
          />
        </div>
        <button
          type="submit"
          disabled={!reasonText.trim()}
          className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-[#2E6FD8] hover:bg-[#2459B0] disabled:opacity-40 rounded-xl transition-colors"
        >
          Submit Appeal to Reviewer Queue
        </button>
      </form>
    </div>
  );
};
