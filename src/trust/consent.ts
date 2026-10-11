import { repository } from '../data/repository';
import { Profile } from '../types';
import { logAuditEvent } from './audit';

/**
 * DELIVERABLE 5: HOW THE CONSENT GUARD & RECRUITER SCREEN USE VERIFICATION STATUS
 *
 * All recruiter queries MUST pass through getVisibleProfiles().
 * It enforces a 3-layer deterministic gate:
 * 1) Recruiter Verification Gate: The active recruiter's verificationStatus in `users`
 *    MUST be 'APPROVED' (if 'PENDING', 'REJECTED', or 'UNVERIFIED', returns []).
 * 2) Learner Verification Gate: The candidate's verificationStatus MUST be 'VERIFIED'
 *    (Track A Student ID verified; unverified/rejected/needs_review learners are never exposed).
 * 3) Learner-Owned Consent & Integrity Gate: The candidate's `consent === true`
 *    ("Share with NxtMove") AND `disqualified !== true`.
 */
export function isActiveRecruiterApproved(): boolean {
  const recruiterUser = repository.getActiveRecruiterUser();
  return (
    recruiterUser.verificationStatus === 'APPROVED' &&
    !recruiterUser.suspended
  );
}

export function getVisibleProfiles(): Profile[] {
  if (!isActiveRecruiterApproved()) {
    return [];
  }

  return repository.getAllProfiles().filter((profile) => {
    const isVerifiedLearner =
      (profile.verificationStatus || 'UNVERIFIED') === 'VERIFIED';
    return (
      isVerifiedLearner &&
      profile.consent === true &&
      !profile.disqualified &&
      Boolean(profile.hasPublishedAssessment)
    );
  });
}

/**
 * Updates a learner's profile consent flag and logs a consent_on or consent_off audit event.
 * Note: Only VERIFIED learners can share their profile with recruiters.
 */
export function setLearnerConsent(
  learnerId: string,
  nextConsent: boolean
): Profile | undefined {
  const profile = repository.getProfileById(learnerId);
  if (!profile) return undefined;

  if (profile.consent === nextConsent) {
    return profile;
  }

  const updated: Profile = {
    ...profile,
    consent: nextConsent,
  };

  repository.saveProfile(updated);

  logAuditEvent({
    actor: profile.name,
    learnerId: profile.learnerId,
    type: nextConsent ? 'consent_on' : 'consent_off',
    details: nextConsent
      ? `${profile.name} (Verified Learner) enabled "Allow NxtMove recruiters to search and view my profile".`
      : `${profile.name} disabled NxtMove recruiter sharing. Profile removed from talent search immediately.`,
  });

  return updated;
}
