import { repository } from '../data/repository';
import { AuditEvent, AuditEventType } from '../types';

export function generateAuditHash(seedNum?: number): string {
  if (seedNum) {
    return `#AUD-${seedNum}`;
  }
  const num = Math.floor(1000 + Math.random() * 9000);
  return `#AUD-${num}`;
}

export function buildAuditEvent(params: {
  actor: string;
  learnerId?: string;
  type: AuditEventType;
  attemptId?: string;
  details: string;
  auditHash?: string;
}): AuditEvent {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    auditHash: params.auditHash || generateAuditHash(),
    ts: new Date().toISOString(),
    actor: params.actor,
    learnerId: params.learnerId,
    type: params.type,
    attemptId: params.attemptId,
    details: params.details,
  };
}

export function logAuditEvent(params: {
  actor: string;
  learnerId?: string;
  type: AuditEventType;
  attemptId?: string;
  details: string;
  auditHash?: string;
}): AuditEvent {
  const event = buildAuditEvent(params);
  repository.appendAuditEvent(event);
  return event;
}

export function getAuditEventsForLearner(learnerId: string): AuditEvent[] {
  return repository.getAuditEvents(learnerId);
}

export function getAuditEventsForAttempt(attemptId: string): AuditEvent[] {
  return repository
    .getAuditEvents()
    .filter((e) => e.attemptId === attemptId)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

export function getAllAuditEvents(
  filterType?: AuditEventType | 'all'
): AuditEvent[] {
  const all = repository.getAuditEvents();
  if (!filterType || filterType === 'all') return all;
  return all.filter((e) => e.type === filterType);
}
