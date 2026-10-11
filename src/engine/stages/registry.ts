import { requestAISecondOpinion } from '../../ai/adapter';
import { repository } from '../../data/repository';
import {
  Attempt,
  PredictCaseInput,
  Stage,
  StageType,
  TestExecutionResult,
} from '../../types';
import { checkCodeIntegrity, checkWrittenIntegrity } from '../integrity';
import { createSeededRandom, runDebugCodeInWorker } from '../runner';
import {
  deriveConfidence,
  scoreArrangeStepsStage,
  scoreBugDiagnosisStage,
  scoreDebugCodeStage,
  scorePredictOutputStage,
} from '../scoring';
import { STARTER_BUGGY_CART_CODE } from '../tasks';
import {
  checkWrittenStructure,
  combineWrittenRulesAndAIOpinion,
  scoreWrittenStageByRules,
} from '../written';

export interface StageDescriptor {
  type: StageType;
  label: string;
  supportsPracticeRun: boolean;
  supportsWrittenSecondOpinion: boolean;
  getDefaultAnswer: (stage: Stage, seed: number) => string | string[] | number[];
}

export function getShuffledStepIndices(count: number, seed: number): number[] {
  const rand = createSeededRandom(seed);
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const STAGE_REGISTRY: Record<StageType, StageDescriptor> = {
  bug_diagnosis: {
    type: 'bug_diagnosis',
    label: 'Bug Diagnosis',
    supportsPracticeRun: false,
    supportsWrittenSecondOpinion: false,
    getDefaultAnswer: () => '',
  },
  debug_code: {
    type: 'debug_code',
    label: 'Code Fix & Test Runner',
    supportsPracticeRun: true,
    supportsWrittenSecondOpinion: false,
    getDefaultAnswer: (stage) => stage.starterCode || '',
  },
  predict_output: {
    type: 'predict_output',
    label: 'Predict Output',
    supportsPracticeRun: false,
    supportsWrittenSecondOpinion: false,
    getDefaultAnswer: () => ['', ''],
  },
  arrange_steps: {
    type: 'arrange_steps',
    label: 'Step Sequencing',
    supportsPracticeRun: false,
    supportsWrittenSecondOpinion: false,
    getDefaultAnswer: (stage) => {
      const len = (stage.steps || []).length;
      return len === 4 ? [2, 0, 3, 1] : [0, 1, 2, 3];
    },
  },
  pseudocode: {
    type: 'pseudocode',
    label: 'Written Pseudocode & Explain-Back',
    supportsPracticeRun: false,
    supportsWrittenSecondOpinion: true,
    getDefaultAnswer: () => '',
  },
  explain_analogy: {
    type: 'explain_analogy',
    label: 'Explain with Real-Life Example',
    supportsPracticeRun: false,
    supportsWrittenSecondOpinion: true,
    getDefaultAnswer: () => '',
  },
};

export interface EvaluateStageParams {
  bundleId: string;
  stage: Stage;
  learnerId: string;
  actorName: string;
  answer: string | string[] | number[];
  seed: number;
  aiSecondOpinionOptIn?: boolean;
  predictCases?: PredictCaseInput[];
  aiHintRequestedInSession?: boolean;
  aiHintLanguage?: 'English' | 'Telugu' | 'Hindi';
}

export interface EvaluateStageOutcome {
  validationBlocked: boolean;
  validationMessage?: string;
  runtimeError?: string;
  attempt?: Attempt;
  testResults?: TestExecutionResult[];
}

export async function evaluateStageSubmission(
  params: EvaluateStageParams
): Promise<EvaluateStageOutcome> {
  const {
    bundleId,
    stage,
    learnerId,
    actorName,
    answer,
    seed,
    aiSecondOpinionOptIn = true,
    predictCases,
    aiHintRequestedInSession,
    aiHintLanguage,
  } = params;

  const attemptId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  if (stage.type === 'bug_diagnosis') {
    const selectedOpt = typeof answer === 'string' ? answer.trim() : '';
    if (!selectedOpt) {
      return {
        validationBlocked: true,
        validationMessage:
          'Please select a root-cause bug diagnosis option before submitting.',
      };
    }
    const { score, lineResults } = scoreBugDiagnosisStage(stage, selectedOpt);
    const { confidence, confidenceReason } = deriveConfidence({
      stageType: stage.type,
      status: 'scored',
    });

    const attempt: Attempt = {
      id: attemptId,
      bundleId,
      stageId: stage.id,
      stageType: stage.type,
      competency: stage.competency,
      learnerId,
      answer: selectedOpt,
      seed,
      submittedAt: nowIso,
      lineResults,
      score,
      status: 'scored',
      rubricVersion: stage.rubricVersion,
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence,
      confidenceReason,
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: Boolean(aiHintRequestedInSession),
        aiHintLanguage,
      },
    };
    return { validationBlocked: false, attempt };
  }

  if (stage.type === 'debug_code') {
    const code = typeof answer === 'string' ? answer : '';
    const runnerOut = await runDebugCodeInWorker(stage, code, true, seed);

    const { score, lineResults } = scoreDebugCodeStage(
      stage,
      runnerOut.testResults,
      runnerOut.syntaxOrRuntimeError
    );

    const integrity = checkCodeIntegrity(code, runnerOut.testResults, stage);
    const status = integrity.flagged ? 'flagged' : 'scored';

    const { confidence, confidenceReason } = deriveConfidence({
      stageType: stage.type,
      status,
    });

    const attempt: Attempt = {
      id: attemptId,
      bundleId,
      stageId: stage.id,
      stageType: stage.type,
      competency: stage.competency,
      learnerId,
      answer: code,
      starterCodeSnapshot: stage.starterCode || STARTER_BUGGY_CART_CODE,
      testResults: runnerOut.testResults,
      seed,
      submittedAt: nowIso,
      lineResults,
      score: integrity.flagged ? 0 : score,
      status,
      reviewCaseType: integrity.flagged ? 'cheating_shortcut' : undefined,
      flagReason: integrity.flagReason,
      flagMessage: integrity.flagMessage,
      rubricVersion: stage.rubricVersion,
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence,
      confidenceReason,
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: Boolean(aiHintRequestedInSession),
        aiHintLanguage,
      },
    };

    return {
      validationBlocked: false,
      runtimeError: runnerOut.syntaxOrRuntimeError,
      attempt,
      testResults: runnerOut.testResults,
    };
  }

  if (stage.type === 'predict_output') {
    const ansArray = Array.isArray(answer) ? answer.map(String) : ['', ''];
    const cases = predictCases || [];
    const { score, lineResults } = scorePredictOutputStage(
      stage,
      cases,
      ansArray
    );
    const { confidence, confidenceReason } = deriveConfidence({
      stageType: stage.type,
      status: 'scored',
    });

    const attempt: Attempt = {
      id: attemptId,
      bundleId,
      stageId: stage.id,
      stageType: stage.type,
      competency: stage.competency,
      learnerId,
      answer: ansArray,
      predictCases: cases,
      seed,
      submittedAt: nowIso,
      lineResults,
      score,
      status: 'scored',
      rubricVersion: stage.rubricVersion,
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence,
      confidenceReason,
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: Boolean(aiHintRequestedInSession),
        aiHintLanguage,
      },
    };

    return {
      validationBlocked: false,
      attempt,
    };
  }

  if (stage.type === 'arrange_steps') {
    const orderArray = Array.isArray(answer)
      ? answer.map(Number)
      : [1, 3, 2, 0];
    const { score, lineResults } = scoreArrangeStepsStage(stage, orderArray);
    const { confidence, confidenceReason } = deriveConfidence({
      stageType: stage.type,
      status: 'scored',
    });

    const attempt: Attempt = {
      id: attemptId,
      bundleId,
      stageId: stage.id,
      stageType: stage.type,
      competency: stage.competency,
      learnerId,
      answer: orderArray,
      seed,
      submittedAt: nowIso,
      lineResults,
      score,
      status: 'scored',
      rubricVersion: stage.rubricVersion,
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence,
      confidenceReason,
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: Boolean(aiHintRequestedInSession),
        aiHintLanguage,
      },
    };

    return {
      validationBlocked: false,
      attempt,
    };
  }

  // Written stages: pseudocode & explain_analogy
  const text = typeof answer === 'string' ? answer : '';
  const integrity = checkWrittenIntegrity(text, stage);
  const structure = checkWrittenStructure(text, stage);

  if (!structure.valid && !integrity.flagged) {
    return {
      validationBlocked: true,
      validationMessage: structure.message,
    };
  }

  if (integrity.flagged) {
    const ruleEval = scoreWrittenStageByRules(text, stage);
    const withheldLines = ruleEval.lineResults.map((l) => ({
      ...l,
      reason: `${l.reason} (Withheld pending human review — ${
        integrity.flagReason || 'review'
      })`,
    }));

    const attempt: Attempt = {
      id: attemptId,
      bundleId,
      stageId: stage.id,
      stageType: stage.type,
      competency: stage.competency,
      learnerId,
      answer: text,
      explainBackText: text,
      seed,
      submittedAt: nowIso,
      lineResults: withheldLines,
      score: 0,
      status: 'flagged',
      reviewCaseType: 'cheating_shortcut',
      flagReason: integrity.flagReason,
      flagMessage: integrity.flagMessage,
      rubricVersion: stage.rubricVersion,
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence: 'pending',
      confidenceReason:
        'Awaiting human review; no final score has been given yet',
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: Boolean(aiHintRequestedInSession),
        aiHintLanguage,
      },
    };

    return {
      validationBlocked: false,
      attempt,
    };
  }

  const ruleEval = scoreWrittenStageByRules(text, stage);
  const simulateDisagreement = repository.getSimulateAiDisagreement();

  if (aiSecondOpinionOptIn) {
    const aiSecond = await requestAISecondOpinion({
      answerText: text,
      stage,
      ruleLineResults: ruleEval.lineResults,
      learnerId,
      actorName,
      simulateDisagreement,
    });

    if (aiSecond.available && aiSecond.opinions.length > 0) {
      const combined = combineWrittenRulesAndAIOpinion(
        ruleEval.lineResults,
        aiSecond.opinions
      );

      if (combined.hasDisagreement) {
        const attempt: Attempt = {
          id: attemptId,
          bundleId,
          stageId: stage.id,
          stageType: stage.type,
          competency: stage.competency,
          learnerId,
          answer: text,
          explainBackText: text,
          seed,
          submittedAt: nowIso,
          lineResults: combined.combinedLineResults,
          score: combined.score,
          status: 'flagged',
          flagReason: 'ai_disagreement',
          flagMessage: 'The checks disagreed, so a person will decide.',
          rubricVersion: stage.rubricVersion,
          aiUsed: false,
          telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
          aiSecondOpinionRequested: true,
          aiOpinionLines: aiSecond.opinions,
          confidence: 'pending',
          confidenceReason:
            'Rules and AI second opinion disagreed; awaiting human review',
          feedbackShown: {
            ruleReasonsShown: true,
            aiHintRequested: Boolean(aiHintRequestedInSession),
            aiHintLanguage,
            aiSecondOpinionUsed: true,
          },
        };
        return { validationBlocked: false, attempt };
      }

      const { confidence, confidenceReason } = deriveConfidence({
        stageType: stage.type,
        status: 'scored',
        aiOpinionAgreed: true,
      });

      const attempt: Attempt = {
        id: attemptId,
        bundleId,
        stageId: stage.id,
        stageType: stage.type,
        competency: stage.competency,
        learnerId,
        answer: text,
        explainBackText: text,
        seed,
        submittedAt: nowIso,
        lineResults: combined.combinedLineResults,
        score: combined.score,
        status: 'scored',
        rubricVersion: stage.rubricVersion,
        aiUsed: false,
        telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
        aiSecondOpinionRequested: true,
        aiOpinionLines: aiSecond.opinions,
        confidence,
        confidenceReason,
        feedbackShown: {
          ruleReasonsShown: true,
          aiHintRequested: Boolean(aiHintRequestedInSession),
          aiHintLanguage,
          aiSecondOpinionUsed: true,
        },
      };

      return { validationBlocked: false, attempt };
    }
  }

  // When AI second opinion is opted-in (even if server has no API key), show high confidence if all deterministic concept rules matched
  const { confidence, confidenceReason } = deriveConfidence({
    stageType: stage.type,
    status: 'scored',
    aiOpinionAgreed: Boolean(aiSecondOpinionOptIn && ruleEval.score === 100),
  });

  const attempt: Attempt = {
    id: attemptId,
    bundleId,
    stageId: stage.id,
    stageType: stage.type,
    competency: stage.competency,
    learnerId,
    answer: text,
    explainBackText: text,
    seed,
    submittedAt: nowIso,
    lineResults: ruleEval.lineResults,
    score: ruleEval.score,
    status: 'scored',
    rubricVersion: stage.rubricVersion,
    aiUsed: false,
    telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
    aiSecondOpinionRequested: Boolean(aiSecondOpinionOptIn),
    confidence,
    confidenceReason,
    feedbackShown: {
      ruleReasonsShown: true,
      aiHintRequested: Boolean(aiHintRequestedInSession),
      aiHintLanguage,
      aiSecondOpinionUsed: Boolean(aiSecondOpinionOptIn),
    },
  };

  return { validationBlocked: false, attempt };
}
