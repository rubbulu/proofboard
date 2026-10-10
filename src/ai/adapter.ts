import { logAuditEvent } from '../trust/audit';
import {
  AIOpinionLine,
  HintLanguage,
  LineResult,
  Stage,
} from '../types';

export const AI_HINT_FALLBACK_MESSAGE =
  'AI hint unavailable. Your score is not affected.';

export const AI_HINT_BADGE_LABEL =
  'AI-generated hint. Does not affect your score.';

export interface AIHintResult {
  available: boolean;
  hintText: string;
  language: HintLanguage;
}

/**
 * Requests a 2-sentence plain-language hint from the server-side Gemini adapter.
 * Strictly sends ONLY { taskTitle, failingNames, language }.
 * NEVER sends learner code, answer text, name, or profile data.
 * Enforces an 8-second timeout and logs audit events.
 */
export async function requestAIHint(params: {
  taskTitle: string;
  failingNames: string[];
  language: HintLanguage;
  learnerId: string;
  actorName: string;
  attemptId?: string;
}): Promise<AIHintResult> {
  const {
    taskTitle,
    failingNames,
    language,
    learnerId,
    actorName,
    attemptId,
  } = params;

  logAuditEvent({
    actor: actorName,
    learnerId,
    type: 'ai_hint_requested',
    attemptId,
    details: `Requested AI hint (${language}) for task "${taskTitle}" on unmet criteria: [${failingNames.join(
      ', '
    )}]. No learner code or PII sent.`,
  });

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    logAuditEvent({
      actor: 'AI Adapter',
      learnerId,
      type: 'ai_unavailable',
      attemptId,
      details: 'Network offline when AI hint was requested; showed fallback message.',
    });
    return {
      available: false,
      hintText: AI_HINT_FALLBACK_MESSAGE,
      language,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('/api/ai/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskTitle,
        failingNames,
        language,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      available?: boolean;
      hint?: string;
    };

    if (!data.available || !data.hint) {
      logAuditEvent({
        actor: 'AI Adapter',
        learnerId,
        type: 'ai_unavailable',
        attemptId,
        details: 'AI hint unavailable (no API key or empty response); showed fallback message.',
      });
      return {
        available: false,
        hintText: AI_HINT_FALLBACK_MESSAGE,
        language,
      };
    }

    return {
      available: true,
      hintText: data.hint,
      language,
    };
  } catch {
    clearTimeout(timeoutId);
    logAuditEvent({
      actor: 'AI Adapter',
      learnerId,
      type: 'ai_unavailable',
      attemptId,
      details: 'AI hint call timed out or failed; showed fallback message.',
    });
    return {
      available: false,
      hintText: AI_HINT_FALLBACK_MESSAGE,
      language,
    };
  }
}

export interface AISecondOpinionResult {
  available: boolean;
  opinions: AIOpinionLine[];
}

/**
 * Validates that an evidenceQuote is an exact substring of the learner's answer.
 */
export function isValidEvidenceSubstring(
  answerText: string,
  evidenceQuote: string
): boolean {
  const cleanQuote = evidenceQuote.trim();
  if (!cleanQuote) return false;
  return answerText.includes(cleanQuote);
}

/**
 * Requests an opt-in AI second opinion on a written answer (pseudocode or explain_analogy).
 * Sends ONLY the answer text and rubric line descriptors.
 * Validates JSON and discards any line whose evidenceQuote is not an exact substring of the answer.
 * Also supports the "Simulate AI disagreement" toggle for offline/keyless demonstrations.
 */
export async function requestAISecondOpinion(params: {
  answerText: string;
  stage: Stage;
  ruleLineResults: LineResult[];
  learnerId: string;
  actorName: string;
  simulateDisagreement: boolean;
}): Promise<AISecondOpinionResult> {
  const {
    answerText,
    stage,
    ruleLineResults,
    learnerId,
    simulateDisagreement,
  } = params;

  // Extract a valid exact quote from the learner's answer for simulation
  const extractRealSubstring = (text: string): string => {
    const words = text.trim().split(/\s+/);
    const slice = words.slice(0, Math.min(7, words.length)).join(' ');
    return text.includes(slice) ? slice : text.trim().slice(0, 30);
  };

  if (simulateDisagreement) {
    const firstSnippet = extractRealSubstring(answerText);
    const simulatedOpinions: AIOpinionLine[] = ruleLineResults.map(
      (line, idx) => {
        // Contradict the rules on the first rubric line
        const ruleMet = Boolean(line.rulePassed ?? line.passed);
        const aiMet = idx === 0 ? !ruleMet : ruleMet;
        return {
          lineId: line.criterionId,
          met: aiMet,
          evidenceQuote: firstSnippet,
        };
      }
    );

    logAuditEvent({
      actor: 'AI Second Opinion (Simulated Disagreement)',
      learnerId,
      type: 'ai_opinion_received',
      details: `Received simulated AI second opinion on "${stage.title}" contradicting line 1 to demonstrate human review routing.`,
    });

    return {
      available: true,
      opinions: simulatedOpinions,
    };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    logAuditEvent({
      actor: 'AI Adapter',
      learnerId,
      type: 'ai_unavailable',
      details:
        'Network offline during AI second opinion; kept deterministic rules only.',
    });
    return { available: false, opinions: [] };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('/api/ai/second-opinion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answerText,
        rubricLines: stage.rubric.map((r) => ({
          lineId: r.id,
          label: r.label,
          description: r.description,
        })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      available?: boolean;
      opinions?: unknown;
    };

    if (!data.available || !Array.isArray(data.opinions)) {
      logAuditEvent({
        actor: 'AI Adapter',
        learnerId,
        type: 'ai_unavailable',
        details:
          'AI second opinion unavailable; kept deterministic rule evaluation only.',
      });
      return { available: false, opinions: [] };
    }

    const validated: AIOpinionLine[] = [];
    for (const rawItem of data.opinions) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const item = rawItem as Record<string, unknown>;
      const lineId = typeof item.lineId === 'string' ? item.lineId : '';
      const met = Boolean(item.met);
      const evidenceQuote =
        typeof item.evidenceQuote === 'string' ? item.evidenceQuote.trim() : '';

      if (!lineId) continue;

      // Discard any line whose evidenceQuote is not an exact substring of the answer
      if (!isValidEvidenceSubstring(answerText, evidenceQuote)) {
        continue;
      }

      validated.push({
        lineId,
        met,
        evidenceQuote,
      });
    }

    if (validated.length === 0) {
      logAuditEvent({
        actor: 'AI Adapter',
        learnerId,
        type: 'ai_unavailable',
        details:
          'AI second opinion discarded because no exact evidence substrings matched the learner answer.',
      });
      return { available: false, opinions: [] };
    }

    logAuditEvent({
      actor: 'AI Second Opinion',
      learnerId,
      type: 'ai_opinion_received',
      details: `Validated AI second opinion for ${validated.length} rubric line(s) with exact answer substrings.`,
    });

    return {
      available: true,
      opinions: validated,
    };
  } catch {
    clearTimeout(timeoutId);
    logAuditEvent({
      actor: 'AI Adapter',
      learnerId,
      type: 'ai_unavailable',
      details: 'AI second opinion timed out or failed; kept rules only.',
    });
    return { available: false, opinions: [] };
  }
}
