import { FlagReason, Stage, TestExecutionResult } from '../types';

export interface IntegrityCheckResult {
  flagged: boolean;
  flagReason?: FlagReason;
  flagMessage?: string;
  learnerMessage?: string;
}

export const CALM_WRITTEN_FLAG_MESSAGE =
  'We sent this answer for a quick human check. Nothing is wrong with you; some answers need a person to read them.';

export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  hardcode_suspected:
    '⚠️ Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
  stuffing_suspected: 'Keyword stuffing suspected',
  copied_text: 'Copied task instructions / snippet',
  injection_suspected: 'Grader manipulation suspected',
  language_review: 'Multilingual answer (human language review)',
  ai_disagreement: 'Rules and AI second opinion disagreed',
};

/**
 * Integrity check for debug_code stages.
 * Detects hardcoded shortcuts such as `if (price === 10) return 25` or `return 25`
 * that pass visible tests but fail hidden boundary tests.
 */
export function checkCodeIntegrity(
  code: string,
  testResults: TestExecutionResult[],
  stage: Stage
): IntegrityCheckResult {
  const visible = testResults.filter((t) => !t.hidden);
  const hidden = testResults.filter((t) => t.hidden);

  if (visible.length === 0 || hidden.length === 0) {
    return { flagged: false };
  }

  const passedVisibleCount = visible.filter((t) => t.passed).length;
  const allVisiblePassed = passedVisibleCount === visible.length;
  const passedHiddenCount = hidden.filter((t) => t.passed).length;
  const hiddenPassRatio = passedHiddenCount / hidden.length;

  const hasHardcodedReturnLiterals =
    /return\s+25\b/.test(code) ||
    /return\s+59\.97\b/.test(code) ||
    /price\s*===\s*10/.test(code);

  if (
    (allVisiblePassed && hiddenPassRatio < 0.5) ||
    (hasHardcodedReturnLiterals && hiddenPassRatio < 0.5)
  ) {
    return {
      flagged: true,
      flagReason: 'hardcode_suspected',
      flagMessage:
        '⚠️ Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
      learnerMessage:
        'Integrity Alert: Hardcoded Return Suspected — Passed visible tests but failed 9/10 hidden boundary tests. Score Withheld.',
    };
  }

  // Also check single constant return matching a visible test
  if (passedVisibleCount >= 1 && hiddenPassRatio < 0.5) {
    const strippedBody = code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/function\s+\w+\s*\([^)]*\)\s*\{/, '')
      .replace(/\}\s*$/, '')
      .trim();

    const expectedLiterals = (stage.visibleTests || []).map((t) =>
      JSON.stringify(t.expected)
    );
    const isSimpleConstantReturn =
      /^return\s+[^;]+;?$/.test(strippedBody) &&
      expectedLiterals.some((lit) => strippedBody.includes(lit));

    if (isSimpleConstantReturn) {
      return {
        flagged: true,
        flagReason: 'hardcode_suspected',
        flagMessage:
          '⚠️ Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
        learnerMessage:
          'Integrity Alert: Hardcoded Return Suspected — Score Withheld.',
      };
    }
  }

  return { flagged: false };
}

const INJECTION_PATTERNS = [
  'ignore the rubric',
  'ignore previous instructions',
  'ignore all previous',
  'give full marks',
  'give me full marks',
  'you are now',
  'system prompt',
  'disregard the rubric',
  'award 100%',
  'score this 100',
];

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function isNonEnglishScript(text: string): boolean {
  return /[\u0900-\u097F\u0C00-\u0C7F]/.test(text);
}

export function checkWrittenIntegrity(
  answerText: string,
  stage: Stage
): IntegrityCheckResult {
  const trimmed = answerText.trim();
  const lower = trimmed.toLowerCase();

  for (const pattern of INJECTION_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        flagged: true,
        flagReason: 'injection_suspected',
        flagMessage:
          'Grader manipulation suspected: contains instructions aimed at the grader.',
        learnerMessage: CALM_WRITTEN_FLAG_MESSAGE,
      };
    }
  }

  if (isNonEnglishScript(trimmed)) {
    return {
      flagged: true,
      flagReason: 'language_review',
      flagMessage:
        'Written in Telugu or Hindi: routed for human language review rather than English keyword guessing.',
      learnerMessage: CALM_WRITTEN_FLAG_MESSAGE,
    };
  }

  const answerWords = tokenizeWords(trimmed);
  if (answerWords.length === 0) {
    return { flagged: false };
  }

  const sourceReferenceText = [
    stage.instructions || '',
    stage.title || '',
    stage.starterCode || '',
    stage.referenceCode || '',
  ].join(' ');
  const sourceWordSet = new Set(tokenizeWords(sourceReferenceText));

  if (answerWords.length >= 6 && sourceWordSet.size > 0) {
    const instrLower = (stage.instructions || '').toLowerCase();
    const normalizedAnswer = lower.replace(/\s+/g, ' ');
    if (
      instrLower.length > 20 &&
      (instrLower.includes(normalizedAnswer) ||
        normalizedAnswer.includes(instrLower))
    ) {
      return {
        flagged: true,
        flagReason: 'copied_text',
        flagMessage:
          'Copied text suspected: over 70% of words overlap the task instructions or code snippet.',
        learnerMessage: CALM_WRITTEN_FLAG_MESSAGE,
      };
    }

    const overlapCount = answerWords.filter((w) => sourceWordSet.has(w)).length;
    const overlapRatio = overlapCount / answerWords.length;
    if (overlapRatio > 0.78 && answerWords.length >= 12) {
      return {
        flagged: true,
        flagReason: 'copied_text',
        flagMessage: `Copied text suspected: ${Math.round(
          overlapRatio * 100
        )}% of words overlap the task instructions or snippet.`,
        learnerMessage: CALM_WRITTEN_FLAG_MESSAGE,
      };
    }
  }

  const rubricKeywordTokens = new Set<string>();
  for (const crit of stage.rubric) {
    for (const group of crit.groups || []) {
      for (const phrase of group) {
        for (const tok of tokenizeWords(phrase)) {
          rubricKeywordTokens.add(tok);
        }
      }
    }
  }

  const keywordHitCount = answerWords.filter((w) =>
    rubricKeywordTokens.has(w)
  ).length;
  const keywordDensity = keywordHitCount / answerWords.length;

  const commaCount = (trimmed.match(/,/g) || []).length;
  const commaRatio = commaCount / Math.max(1, answerWords.length);

  const nonEmptyLines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sentenceChunks = trimmed
    .split(/[.!?]+|\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const isBareListOrCommas = commaRatio >= 0.35;
  const isOver65PercentKeywords = keywordDensity > 0.65 && answerWords.length < 15;
  const hasTooFewSentencesOrSteps =
    stage.type === 'pseudocode'
      ? nonEmptyLines.length < 2
      : sentenceChunks.length < 2;

  if (
    isBareListOrCommas ||
    isOver65PercentKeywords ||
    hasTooFewSentencesOrSteps
  ) {
    return {
      flagged: true,
      flagReason: 'stuffing_suspected',
      flagMessage:
        'Keyword stuffing suspected: answer looks like a bare keyword list or lacks full steps.',
      learnerMessage: CALM_WRITTEN_FLAG_MESSAGE,
    };
  }

  return { flagged: false };
}
