import { AIOpinionLine, LineResult, Stage } from '../types';

export interface StructureCheckResult {
  valid: boolean;
  count: number;
  required: number;
  unit: 'lines' | 'words';
  message?: string;
}

export function countNonEmptyLines(text: string): number {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Validates structure before scoring or creating an attempt.
 * If not met, returns a friendly message so the learner can edit and resubmit.
 */
export function checkWrittenStructure(
  answerText: string,
  stage: Stage
): StructureCheckResult {
  if (stage.type === 'pseudocode') {
    const required = stage.minLines || 3;
    const count = countNonEmptyLines(answerText);
    if (count < required) {
      return {
        valid: false,
        count,
        required,
        unit: 'lines',
        message: `Please write at least ${required} non-empty lines of pseudocode before submitting (currently ${count} of ${required} lines). Your work is still here—edit and submit again.`,
      };
    }
    return { valid: true, count, required, unit: 'lines' };
  }

  const required = stage.minWords || 40;
  const count = countWords(answerText);
  if (count < required) {
    return {
      valid: false,
      count,
      required,
      unit: 'words',
      message: `Please write at least ${required} words so your explanation covers the real-life example in detail (currently ${count} of ${required} words). Edit and submit when ready.`,
    };
  }
  return { valid: true, count, required, unit: 'words' };
}

/**
 * Deterministic rule scorer for written stages (pseudocode & explain_analogy).
 * Each rubric criterion has `groups`: string[][].
 * A criterion passes if and only if EVERY group has at least one synonym/phrase match.
 */
export function scoreWrittenStageByRules(
  answerText: string,
  stage: Stage
): { score: number; lineResults: LineResult[] } {
  const lower = answerText.toLowerCase();
  const lineResults: LineResult[] = [];
  let totalWeight = 0;
  let passedWeight = 0;

  for (const criterion of stage.rubric) {
    totalWeight += criterion.weight;
    const groups = criterion.groups || [];
    const matchedTerms: string[] = [];
    let allGroupsMatched = true;

    for (const group of groups) {
      const found = group.find((synonym) =>
        lower.includes(synonym.toLowerCase())
      );
      if (found) {
        matchedTerms.push(`"${found}"`);
      } else {
        allGroupsMatched = false;
      }
    }

    const passed = groups.length > 0 ? allGroupsMatched : false;
    if (passed) {
      passedWeight += criterion.weight;
    }

    const reason = passed
      ? `Met criterion by including required concepts (${matchedTerms.join(' + ')}).`
      : `Did not yet cover all concepts needed for "${criterion.label}".`;

    lineResults.push({
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      passed,
      rulePassed: passed,
      reason,
    });
  }

  const score =
    totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;

  return { score, lineResults };
}

/**
 * Combines deterministic rule results with an optional validated AI second opinion.
 * AI never produces a numeric score; the rules engine computes every score.
 */
export function combineWrittenRulesAndAIOpinion(
  ruleLineResults: LineResult[],
  aiOpinion: AIOpinionLine[]
): {
  hasDisagreement: boolean;
  combinedLineResults: LineResult[];
  score: number;
} {
  let hasDisagreement = false;
  let totalWeight = 0;
  let passedWeight = 0;

  const combinedLineResults: LineResult[] = ruleLineResults.map((line) => {
    totalWeight += line.weight;
    const aiItem = aiOpinion.find((item) => item.lineId === line.criterionId);
    const ruleMet = Boolean(line.rulePassed ?? line.passed);

    if (!aiItem) {
      // If AI did not return a valid entry for this line, treat as disagreement to be safe
      hasDisagreement = true;
      return {
        ...line,
        rulePassed: ruleMet,
        aiMet: false,
        disputed: true,
        passed: false,
        reason: `${line.reason} (Disputed: AI second opinion could not verify an exact quote for this line.)`,
      };
    }

    const agreed = ruleMet === aiItem.met;
    if (!agreed) {
      hasDisagreement = true;
    }

    const finalLinePassed = ruleMet && aiItem.met;
    if (finalLinePassed) {
      passedWeight += line.weight;
    }

    return {
      ...line,
      passed: finalLinePassed,
      rulePassed: ruleMet,
      aiMet: aiItem.met,
      aiEvidenceQuote: aiItem.evidenceQuote,
      disputed: !agreed,
      reason: agreed
        ? finalLinePassed
          ? `Rules and AI second opinion agreed. Quoted evidence: "${aiItem.evidenceQuote}"`
          : `Rules and AI second opinion agreed this concept was not yet included.`
        : `Disputed between rules (${ruleMet ? 'Passed' : 'Not passed'}) and AI second opinion (${aiItem.met ? 'Passed' : 'Not passed'}). Sent for human review.`,
    };
  });

  const score =
    totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;

  return {
    hasDisagreement,
    combinedLineResults,
    score,
  };
}
