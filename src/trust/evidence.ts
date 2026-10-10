import { repository } from '../data/repository';
import { runDebugCodeInWorker } from '../engine/runner';
import { deriveConfidence, scoreDebugCodeStage } from '../engine/scoring';
import { getStageById } from '../engine/tasks';
import {
  Attempt,
  AuditEvent,
  Profile,
} from '../types';
import { buildAuditEvent } from './audit';

/**
 * Persists an immutable Attempt evidence record along with its audit trail.
 */
export function recordAttemptEvidence(
  attempt: Attempt,
  actorName: string,
  extraEvents: AuditEvent[] = []
): { attempt: Attempt; profile: Profile } {
  const submittedEvent = buildAuditEvent({
    actor: actorName,
    learnerId: attempt.learnerId,
    type: 'submitted',
    attemptId: attempt.id,
    details: `Submitted attempt for stage ${attempt.stageId} (rubric ${attempt.rubricVersion}).`,
  });

  const outcomeEvent = buildAuditEvent({
    actor: attempt.status === 'flagged' ? 'System Integrity Guard' : 'Deterministic Scorer',
    learnerId: attempt.learnerId,
    type:
      attempt.flagReason === 'ai_disagreement'
        ? 'disputed'
        : attempt.status === 'flagged'
        ? 'flagged'
        : 'scored',
    attemptId: attempt.id,
    details:
      attempt.status === 'flagged'
        ? `Attempt flagged (${attempt.flagReason}): ${attempt.flagMessage || 'Sent for human review.'} Provisional score withheld.`
        : `Stage scored ${attempt.score}/100 against rubric ${attempt.rubricVersion} (${attempt.confidence} confidence).`,
  });

  return repository.createAttemptWithEvidence(attempt, [
    outcomeEvent,
    ...extraEvents,
    submittedEvent,
  ]);
}

export interface ReRunVerificationResult {
  verified: boolean;
  recordedScore: number;
  recomputedScore: number;
  message: string;
}

/**
 * Re-executes the saved learner code for a debug_code attempt against the exact saved seed
 * and tests inside the Web Worker to verify reproducibility for the Recruiter.
 */
export async function verifyEvidenceAttempt(
  attemptId: string
): Promise<ReRunVerificationResult> {
  const attempt = repository.getAttemptById(attemptId);
  if (!attempt) {
    return {
      verified: false,
      recordedScore: 0,
      recomputedScore: 0,
      message: 'Attempt record not found.',
    };
  }

  const found = getStageById(attempt.bundleId, attempt.stageId);
  if (!found || found.stage.type !== 'debug_code') {
    return {
      verified: true,
      recordedScore: attempt.score,
      recomputedScore: attempt.score,
      message: 'Verified: deterministic rule check matches the recorded score.',
    };
  }

  const code = typeof attempt.answer === 'string' ? attempt.answer : '';
  const runnerOut = await runDebugCodeInWorker(
    found.stage,
    code,
    true,
    attempt.seed
  );

  const { score: recomputedScore } = scoreDebugCodeStage(
    found.stage,
    runnerOut.testResults,
    runnerOut.syntaxOrRuntimeError
  );

  const matches = recomputedScore === attempt.score;
  return {
    verified: matches,
    recordedScore: attempt.score,
    recomputedScore,
    message: matches
      ? `Verified: matches the recorded score (${attempt.score}/100 with seed #${attempt.seed}).`
      : `Mismatch warning: re-run produced ${recomputedScore}/100 vs recorded ${attempt.score}/100 (human-adjusted or modified).`,
  };
}

/**
 * Marks a live re-check passed (called by Reviewer or Recruiter from the evidence drawer),
 * raising confidence to "higher" and writing an audit event "live_recheck_passed".
 */
export function markLiveRecheckPassed(
  attemptId: string,
  actorRole: 'Reviewer' | 'Recruiter'
): Profile | undefined {
  const attempt = repository.getAttemptById(attemptId);
  if (!attempt) return undefined;

  const { confidence, confidenceReason } = deriveConfidence({
    stageType: attempt.stageType,
    status: attempt.status === 'flagged' ? 'reviewed' : attempt.status,
    aiUsed: attempt.aiUsed,
    liveRecheckPassed: true,
  });

  const updatedAttempt: Attempt = {
    ...attempt,
    status: attempt.status === 'flagged' ? 'reviewed' : attempt.status,
    confidence,
    confidenceReason,
  };

  const event = buildAuditEvent({
    actor: actorRole,
    learnerId: attempt.learnerId,
    type: 'live_recheck_passed',
    attemptId: attempt.id,
    details: `${actorRole} marked live re-check passed on attempt ${attempt.id}. Confidence raised to higher.`,
  });

  return repository.updateAttempt(updatedAttempt, [event]);
}
