import {
  Attempt,
  AttemptStatus,
  CompetencyKey,
  CompetencySummary,
  ConfidenceLevel,
  LineResult,
  PredictCaseInput,
  ProficiencyLevel,
  RecencyLevel,
  Stage,
  StageType,
  TestExecutionResult,
} from '../types';

export function computeWeightedScore(lineResults: LineResult[]): number {
  const totalWeight = lineResults.reduce((acc, r) => acc + r.weight, 0);
  if (totalWeight === 0) return 0;
  const passedWeight = lineResults
    .filter((r) => r.passed)
    .reduce((acc, r) => acc + r.weight, 0);
  return Math.round((passedWeight / totalWeight) * 100);
}

export function scoreBugDiagnosisStage(
  stage: Stage,
  selectedOptionId: string
): { score: number; lineResults: LineResult[] } {
  const options = stage.failingCaseExample?.bugOptions || [];
  const chosen = options.find((o) => o.id === selectedOptionId);
  const passed = Boolean(chosen?.isCorrect);

  const criterion = stage.rubric[0] || {
    id: 'diag_root_cause',
    label: 'Identifies off-by-one boundary & missing qty multiplier',
    weight: 100,
  };

  return {
    score: passed ? 100 : 0,
    lineResults: [
      {
        criterionId: criterion.id,
        label: criterion.label,
        weight: criterion.weight,
        passed,
        reason: chosen
          ? chosen.explanation
          : 'Select a root-cause diagnosis option to verify.',
      },
    ],
  };
}

export function scoreDebugCodeStage(
  stage: Stage,
  testResults: TestExecutionResult[],
  syntaxOrRuntimeError?: string
): { score: number; lineResults: LineResult[] } {
  const lineResults: LineResult[] = stage.rubric.map((criterion) => {
    if (syntaxOrRuntimeError && testResults.length === 0) {
      return {
        criterionId: criterion.id,
        label: criterion.label,
        weight: criterion.weight,
        passed: false,
        reason: `Not passed because code could not run: ${syntaxOrRuntimeError}`,
      };
    }

    const matchingTests = testResults.filter(
      (t) => t.criterionId === criterion.id
    );
    if (matchingTests.length === 0) {
      return {
        criterionId: criterion.id,
        label: criterion.label,
        weight: criterion.weight,
        passed: false,
        reason: 'Tests for this criterion were not executed.',
      };
    }

    const passedCount = matchingTests.filter((t) => t.passed).length;
    const allPassed = passedCount === matchingTests.length;
    const isHidden = matchingTests.every((t) => t.hidden);

    let reason = '';
    if (allPassed) {
      reason = isHidden
        ? `All ${matchingTests.length}/10 randomized hidden boundary tests passed.`
        : `All ${matchingTests.length} visible test case(s) for "${criterion.label}" passed.`;
    } else {
      if (isHidden) {
        const failedCount = matchingTests.length - passedCount;
        reason = `Failed ${failedCount}/${matchingTests.length} hidden boundary tests (passed ${passedCount}/${matchingTests.length}).`;
      } else {
        const firstFail = matchingTests.find((t) => !t.passed);
        reason = firstFail?.error
          ? `Not passed on "${firstFail.name}": ${firstFail.error}.`
          : `Passed ${passedCount} of ${matchingTests.length} test cases for "${criterion.label}".`;
      }
    }

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      passed: allPassed,
      reason,
    };
  });

  return {
    score: computeWeightedScore(lineResults),
    lineResults,
  };
}

export function comparePredictedOutput(
  userAnswerRaw: string,
  expectedValue: unknown
): boolean {
  const trimmed = (userAnswerRaw ?? '').trim();
  if (trimmed === '') return false;

  if (typeof expectedValue === 'number') {
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return Math.abs(parsed - expectedValue) < 1e-6;
    }
    return false;
  }

  if (typeof expectedValue === 'boolean') {
    return trimmed.toLowerCase() === String(expectedValue).toLowerCase();
  }

  const expectedStr = String(expectedValue).trim();
  const unquoted = trimmed.replace(/^["']|["']$/g, '');
  return trimmed === expectedStr || unquoted === expectedStr;
}

export function scorePredictOutputStage(
  stage: Stage,
  cases: PredictCaseInput[],
  learnerAnswers: string[]
): { score: number; lineResults: LineResult[] } {
  const lineResults: LineResult[] = stage.rubric.map((criterion, idx) => {
    const c = cases[idx];
    const rawAns = learnerAnswers[idx] ?? '';
    if (!c) {
      return {
        criterionId: criterion.id,
        label: criterion.label,
        weight: criterion.weight,
        passed: false,
        reason: 'Test case input was not available.',
      };
    }

    const passed = comparePredictedOutput(rawAns, c.expectedOutput);
    const reason = passed
      ? `Correctly predicted ${JSON.stringify(c.expectedOutput)} for ${c.inputDisplay}.`
      : `Predicted "${rawAns.trim() || '(blank)'}", whereas the function returns ${JSON.stringify(c.expectedOutput)} for ${c.inputDisplay}.`;

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      passed,
      reason,
    };
  });

  return {
    score: computeWeightedScore(lineResults),
    lineResults,
  };
}

export function scoreArrangeStepsStage(
  stage: Stage,
  orderedStepIndices: number[]
): { score: number; lineResults: LineResult[] } {
  const steps = stage.steps || [];
  const lineResults: LineResult[] = stage.rubric.map((criterion) => {
    const pairs = criterion.pairs || [];
    const failedPairs: { before: number; after: number }[] = [];

    for (const pair of pairs) {
      const posBefore = orderedStepIndices.indexOf(pair.before);
      const posAfter = orderedStepIndices.indexOf(pair.after);
      if (posBefore === -1 || posAfter === -1 || posBefore >= posAfter) {
        failedPairs.push(pair);
      }
    }

    const passed = failedPairs.length === 0;
    let reason = '';
    if (passed) {
      reason = `All required step precedence rules for "${criterion.label}" are in valid order.`;
    } else {
      const first = failedPairs[0];
      const beforeText = steps[first.before] || `Step ${first.before}`;
      const afterText = steps[first.after] || `Step ${first.after}`;
      reason = `"${beforeText}" must come before "${afterText}".`;
    }

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      passed,
      reason,
    };
  });

  return {
    score: computeWeightedScore(lineResults),
    lineResults,
  };
}

export function deriveProficiency(
  latestScore: number | null | undefined
): ProficiencyLevel {
  if (latestScore === null || latestScore === undefined || latestScore < 0) {
    return 'Not assessed';
  }
  if (latestScore === 100) return 'Verified';
  if (latestScore >= 80) return 'Proficient';
  if (latestScore >= 50) return 'Developing';
  return 'Beginner';
}

export function deriveRecency(
  lastDateIso: string | null | undefined,
  nowDate: Date = new Date()
): RecencyLevel {
  if (!lastDateIso) return 'None';
  const attemptTime = new Date(lastDateIso).getTime();
  if (Number.isNaN(attemptTime)) return 'None';
  const diffDays = Math.floor(
    (nowDate.getTime() - attemptTime) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 30) return 'Fresh';
  if (diffDays <= 90) return 'Aging';
  return 'Stale';
}

export function deriveConfidence(params: {
  stageType: StageType;
  status: AttemptStatus;
  aiUsed?: boolean;
  aiOpinionAgreed?: boolean;
  humanConfirmed?: boolean;
  liveRecheckPassed?: boolean;
}): { confidence: ConfidenceLevel; confidenceReason: string } {
  const {
    stageType,
    status,
    aiOpinionAgreed,
    humanConfirmed,
    liveRecheckPassed,
  } = params;

  if (status === 'disqualified') {
    return {
      confidence: 'lower',
      confidenceReason: 'Disqualified due to confirmed hardcoded shortcut',
    };
  }

  if (status === 'flagged' || status === 'under_appeal') {
    return {
      confidence: 'pending',
      confidenceReason:
        status === 'under_appeal'
          ? 'Under human appeal review; final confidence is pending'
          : 'Integrity Alert: Hardcoded Return Suspected — Score Withheld',
    };
  }

  if (liveRecheckPassed) {
    return {
      confidence: 'higher',
      confidenceReason: 'Verified by live re-check',
    };
  }

  const isWritten =
    stageType === 'pseudocode' || stageType === 'explain_analogy';

  if (isWritten) {
    if (humanConfirmed) {
      return {
        confidence: 'higher',
        confidenceReason: 'Written answer verified by human reviewer',
      };
    }
    if (aiOpinionAgreed) {
      return {
        confidence: 'higher',
        confidenceReason:
          'Verified by deterministic concept rules + AI semantic second opinion (Natural Keystrokes)',
      };
    }
    return {
      confidence: 'higher',
      confidenceReason:
        'Verified by deterministic concept rules + Natural Keystrokes telemetry',
    };
  }

  return {
    confidence: 'higher',
    confidenceReason:
      'Verified by 13 deterministic sandbox tests (3 visible + 10 hidden fuzz tests)',
  };
}

export function computeCompetenciesFromAttempts(
  attempts: Attempt[],
  nowDate: Date = new Date()
): Record<CompetencyKey, CompetencySummary> {
  const keys: CompetencyKey[] = [
    'debugging',
    'code_reading',
    'algorithmic_thinking',
    'communication',
  ];

  const result = {} as Record<CompetencyKey, CompetencySummary>;

  for (const key of keys) {
    const compAttempts = attempts
      .filter((a) => a.competency === key)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

    if (compAttempts.length === 0) {
      result[key] = {
        proficiency: 'Not assessed',
        confidence: 'pending',
        confidenceReason: 'No attempts submitted yet for this competency',
        recency: 'None',
        lastDate: null,
        attempts: 0,
        latestScore: null,
      };
      continue;
    }

    const latestAny = compAttempts[0];
    const validAttempts = compAttempts.filter(
      (a) =>
        (a.status === 'scored' || a.status === 'reviewed') &&
        a.score >= 0 &&
        !a.flagReason
    );

    const latestValid = validAttempts[0];

    if (!latestValid) {
      result[key] = {
        proficiency: 'Not assessed',
        confidence: 'pending',
        confidenceReason: latestAny.confidenceReason,
        recency: deriveRecency(latestAny.submittedAt, nowDate),
        lastDate: latestAny.submittedAt,
        attempts: compAttempts.length,
        latestScore: null,
        latestAttemptId: latestAny.id,
      };
    } else {
      result[key] = {
        proficiency: deriveProficiency(latestValid.score),
        confidence: latestValid.confidence,
        confidenceReason: latestValid.confidenceReason,
        recency: deriveRecency(latestValid.submittedAt, nowDate),
        lastDate: latestValid.submittedAt,
        attempts: compAttempts.length,
        latestScore: latestValid.score,
        latestAttemptId: latestValid.id,
      };
    }
  }

  return result;
}
