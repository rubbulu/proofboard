import { repository } from '../data/repository';
import { Appeal, Attempt, Profile } from '../types';
import { buildAuditEvent } from './audit';

/**
 * Learner submits an appeal for a scored attempt.
 */
export function submitLearnerAppeal(
  attemptId: string,
  reason: string
): { appeal: Appeal; attempt: Attempt } | undefined {
  const attempt = repository.getAttemptById(attemptId);
  if (!attempt) return undefined;

  const learner = repository.getProfileById(attempt.learnerId);
  const actorName = learner?.name || 'Asha';

  const appeal: Appeal = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    attemptId: attempt.id,
    learnerId: attempt.learnerId,
    reason: reason.trim(),
    status: 'open',
    reviewerNote: '',
    createdAt: new Date().toISOString(),
  };

  const updatedAttempt: Attempt = {
    ...attempt,
    status: 'under_appeal',
    reviewCaseType: 'student_appeal',
    confidence: 'pending',
    confidenceReason: 'Under human appeal review; final confidence is pending',
  };

  const event = buildAuditEvent({
    actor: actorName,
    learnerId: attempt.learnerId,
    type: 'appeal_opened',
    attemptId: attempt.id,
    details: `Appeal Submitted by ${actorName}: "${reason.trim()}"`,
  });

  repository.createAppeal(appeal, updatedAttempt, event);
  return { appeal, attempt: updatedAttempt };
}

/**
 * Case A Governance Action: Confirm Disqualification (Withhold Score)
 * Used on blatant cheating / hardcoded return attempts.
 * Stamps #AUD-9104 to the Audit Log and marks the item resolved with Score Withheld.
 */
export function confirmShortcutDisqualification(
  attemptId: string,
  reviewerNote = 'Confirmed hardcoded return shortcut (failed 9/10 hidden boundary tests). Score permanently withheld.'
): Profile | undefined {
  const attempt = repository.getAttemptById(attemptId);
  if (!attempt) return undefined;

  const auditHash = attempt.auditHash || '#AUD-9104';

  const updatedAttempt: Attempt = {
    ...attempt,
    score: -1,
    status: 'disqualified',
    reviewCaseType: 'cheating_shortcut',
    confidence: 'lower',
    confidenceReason: 'Disqualified: Hardcoded Return Confirmed (Score Withheld)',
    reviewerNote,
    auditHash,
    resolvedStatusLabel: `Status: Resolved (Score Withheld) | Audit Hash: ${auditHash}`,
  };

  // If this candidate is a dedicated cheating candidate (e.g. Vikram), mark profile disqualified
  const candidateProfile = repository.getProfileById(attempt.learnerId);
  if (candidateProfile && attempt.learnerId !== 'learner-asha') {
    repository.saveProfile({
      ...candidateProfile,
      disqualified: true,
      disqualificationReason:
        'Integrity Violation: Hardcoded Return Confirmed (#AUD-9104)',
    });
  }

  const event = buildAuditEvent({
    actor: 'Reviewer (ISRO / Faculty Auditor)',
    learnerId: attempt.learnerId,
    type: 'disqualified',
    attemptId: attempt.id,
    auditHash,
    details: `Confirmed Disqualification (Score Withheld) on attempt ${attempt.id}. Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests).`,
  });

  return repository.updateAttempt(updatedAttempt, [event]);
}

/**
 * Case B Governance Action: Save Adjusted Score on a legitimate student appeal.
 * Requires valid numeric score (0-100) and >= 15 character reviewer decision note.
 */
export function resolveStudentAppealWithScore(params: {
  attemptId: string;
  newScore: number;
  reviewerNote: string;
}): Profile | undefined {
  const { attemptId, newScore, reviewerNote } = params;
  const attempt = repository.getAttemptById(attemptId);
  if (!attempt) return undefined;

  const clampedScore = Math.max(0, Math.min(100, Math.round(newScore)));
  const auditHash = '#AUD-9208';

  const updatedAttempt: Attempt = {
    ...attempt,
    score: clampedScore,
    status: 'reviewed',
    reviewCaseType: 'student_appeal',
    flagReason: undefined,
    flagMessage: undefined,
    confidence: 'higher',
    confidenceReason: `Appeal resolved and verified by human reviewer (${clampedScore}/100, ${auditHash})`,
    reviewerNote: reviewerNote.trim(),
    auditHash,
    resolvedStatusLabel: `Status: Resolved (Adjusted to ${clampedScore}/100) | Audit Hash: ${auditHash}`,
  };

  const event = buildAuditEvent({
    actor: 'Reviewer (ISRO / Faculty Auditor)',
    learnerId: attempt.learnerId,
    type: 'appeal_decided',
    attemptId: attempt.id,
    auditHash,
    details: `Appeal resolved for attempt ${attempt.id}: Adjusted score to ${clampedScore}/100. Reviewer Note: "${reviewerNote.trim()}"`,
  });

  const existingAppeal = repository.getAppealByAttemptId(attemptId);
  if (existingAppeal) {
    const updatedAppeal: Appeal = {
      ...existingAppeal,
      status: 'adjusted',
      adjustedScore: clampedScore,
      reviewerNote: reviewerNote.trim(),
      auditHash,
      decidedAt: new Date().toISOString(),
    };
    return repository.resolveAppeal(updatedAppeal, updatedAttempt, event);
  }

  return repository.updateAttempt(updatedAttempt, [event]);
}
