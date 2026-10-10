import { repository } from '../data/repository';
import { Profile } from '../types';
import { logAuditEvent } from './audit';

/**
 * CONSENT & INTEGRITY GUARD FOR NXTMOVE RECRUITER PORTAL:
 * All recruiter queries MUST go through this single function.
 * Returns ONLY profiles where:
 * 1) consent === true ("Allow NxtMove recruiters to search and view my profile")
 * 2) disqualified !== true (Disqualified/cheated candidates NEVER appear in this talent pool)
 */
export function getVisibleProfiles(): Profile[] {
  return repository
    .getAllProfiles()
    .filter((profile) => profile.consent === true && !profile.disqualified);
}

/**
 * Updates a learner's profile consent flag and logs a consent_on or consent_off audit event.
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
      ? `${profile.name} enabled "Allow NxtMove recruiters to search and view my profile".`
      : `${profile.name} disabled NxtMove recruiter sharing. Profile removed from talent search immediately.`,
  });

  return updated;
}
