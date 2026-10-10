export type PersonaMode = 'learner' | 'recruiter' | 'reviewer' | 'judge';

export type NavigationTabId =
  | 'learner_sandbox'
  | 'learner_profile'
  | 'learner_appeals'
  | 'recruiter_search'
  | 'recruiter_evidence'
  | 'reviewer_queue'
  | 'reviewer_audit'
  | 'demo_architecture';

export type StageType =
  | 'bug_diagnosis'
  | 'debug_code'
  | 'predict_output'
  | 'arrange_steps'
  | 'pseudocode'
  | 'explain_analogy';

export type CompetencyKey =
  | 'debugging'
  | 'code_reading'
  | 'algorithmic_thinking'
  | 'communication';

export type ProficiencyLevel =
  | 'Verified'
  | 'Proficient'
  | 'Developing'
  | 'Beginner'
  | 'Not assessed';

export type RecencyLevel = 'Fresh' | 'Aging' | 'Stale' | 'None';

export type ConfidenceLevel = 'higher' | 'lower' | 'pending';

export type AttemptStatus =
  | 'scored'
  | 'flagged'
  | 'under_appeal'
  | 'reviewed'
  | 'disqualified';

export type FlagReason =
  | 'hardcode_suspected'
  | 'stuffing_suspected'
  | 'copied_text'
  | 'injection_suspected'
  | 'language_review'
  | 'ai_disagreement';

export type AuditEventType =
  | 'started'
  | 'run_practice'
  | 'submitted'
  | 'scored'
  | 'flagged'
  | 'disqualified'
  | 'consent_on'
  | 'consent_off'
  | 'appeal_opened'
  | 'appeal_decided'
  | 'reviewer_decision'
  | 'ai_hint_requested'
  | 'ai_unavailable'
  | 'ai_opinion_received'
  | 'disputed'
  | 'live_recheck_passed';

export type HintLanguage = 'English' | 'Telugu' | 'Hindi';

export type EvidenceDrawerTab = 'diff' | 'tests' | 'explain';

export interface StepPair {
  before: number;
  after: number;
}

export interface RubricCriterion {
  id: string;
  label: string;
  weight: number;
  percentageLabel?: string;
  description?: string;
  pairs?: StepPair[];
  groups?: string[][];
}

export interface VisibleTestCase {
  id: string;
  name: string;
  input: unknown[];
  expected: unknown;
  criterionId: string;
}

export type GeneratorName =
  | 'randomCarts'
  | 'randomRatingLists'
  | 'randomUsernames';

export interface Stage {
  id: string;
  stageNumber: number;
  type: StageType;
  competency: CompetencyKey;
  title: string;
  shortTitle: string;
  instructions: string;
  rubricVersion: string;
  rubric: RubricCriterion[];
  functionName?: string;
  starterCode?: string;
  referenceCode?: string;
  visibleTests?: VisibleTestCase[];
  generatorName?: GeneratorName;
  hiddenCriterionId?: string;
  steps?: string[];
  minLines?: number;
  minWords?: number;
  failingCaseExample?: {
    call: string;
    expected: string;
    actualBuggyOutput: string;
    bugOptions: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  };
}

export interface Bundle {
  id: string;
  title: string;
  role: string;
  description: string;
  version: string;
  stages: Stage[];
}

export interface TestExecutionResult {
  id: string;
  name: string;
  hidden: boolean;
  passed: boolean;
  error?: string;
  criterionId: string;
  inputDisplay?: string;
  expectedDisplay?: string;
  actualDisplay?: string;
}

export interface AIOpinionLine {
  lineId: string;
  met: boolean;
  evidenceQuote: string;
}

export interface LineResult {
  criterionId: string;
  label: string;
  weight: number;
  passed: boolean;
  reason: string;
  rulePassed?: boolean;
  aiMet?: boolean;
  aiEvidenceQuote?: string;
  disputed?: boolean;
}

export interface PredictCaseInput {
  caseIndex: number;
  criterionId: string;
  label: string;
  inputArgs: unknown[];
  inputDisplay: string;
  expectedOutput?: unknown;
}

export interface AttemptFeedbackRecord {
  ruleReasonsShown: boolean;
  aiHintRequested: boolean;
  aiHintLanguage?: HintLanguage;
  aiSecondOpinionUsed?: boolean;
}

export interface Attempt {
  id: string;
  bundleId: string;
  stageId: string;
  stageType: StageType;
  competency: CompetencyKey;
  learnerId: string;
  answer: string | string[] | number[];
  starterCodeSnapshot?: string;
  explainBackText?: string;
  predictCases?: PredictCaseInput[];
  testResults?: TestExecutionResult[];
  seed: number;
  submittedAt: string;
  lineResults: LineResult[];
  score: number;
  status: AttemptStatus;
  reviewCaseType?: 'cheating_shortcut' | 'student_appeal';
  flagReason?: FlagReason;
  flagMessage?: string;
  rubricVersion: string;
  aiUsed: boolean;
  telemetryLabel?: string;
  aiSecondOpinionRequested?: boolean;
  aiOpinionLines?: AIOpinionLine[];
  confidence: ConfidenceLevel;
  confidenceReason: string;
  reviewerNote?: string;
  resolvedStatusLabel?: string;
  auditHash?: string;
  feedbackShown?: AttemptFeedbackRecord;
}

export interface CompetencySummary {
  title?: string;
  proficiency: ProficiencyLevel;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  recency: RecencyLevel;
  lastDate: string | null;
  attempts: number;
  latestScore: number | null;
  latestAttemptId?: string;
}

export interface Profile {
  learnerId: string;
  name: string;
  college: string;
  roleTarget: string;
  consent: boolean;
  disqualified?: boolean;
  disqualificationReason?: string;
  competencies: Record<CompetencyKey, CompetencySummary>;
}

export interface Appeal {
  id: string;
  attemptId: string;
  learnerId: string;
  reason: string;
  status: 'open' | 'upheld' | 'adjusted';
  reviewerNote: string;
  adjustedScore?: number;
  auditHash?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface AuditEvent {
  id: string;
  auditHash: string;
  ts: string;
  actor: string;
  learnerId?: string;
  type: AuditEventType;
  attemptId?: string;
  details: string;
}

export type ActiveRoleView =
  | 'learner'
  | 'profile'
  | 'recruiter'
  | 'reviewer'
  | 'demo';
