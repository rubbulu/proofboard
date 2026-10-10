import { computeCompetenciesFromAttempts } from '../engine/scoring';
import {
  CLEAN_VERIFIED_CART_CODE,
  CLEAN_VERIFIED_EXPLAIN_BACK,
  HARDCODED_SHORTCUT_CART_CODE,
  STARTER_BUGGY_CART_CODE,
} from '../engine/tasks';
import {
  Appeal,
  Attempt,
  AuditEvent,
  Profile,
  TestExecutionResult,
} from '../types';

const STORAGE_KEY = 'proofboard_samartha_v2';

export interface PersistedState {
  activeLearnerId: string;
  profiles: Record<string, Profile>;
  attempts: Attempt[];
  appeals: Appeal[];
  auditEvents: AuditEvent[];
  activePitchPreset: number;
  simulateAiDisagreement: boolean;
}

export interface IRepository {
  getState(): PersistedState;
  getActiveLearner(): Profile;
  setActiveLearner(learnerId: string): Profile;
  registerNewLearner(name: string, college: string): Profile;
  updateLearnerIdentity(
    learnerId: string,
    name: string,
    college: string
  ): Profile;
  getAllProfiles(): Profile[];
  getProfileById(learnerId: string): Profile | undefined;
  saveProfile(profile: Profile): void;
  getAttempts(): Attempt[];
  getAttemptById(attemptId: string): Attempt | undefined;
  getAttemptsByLearner(learnerId: string): Attempt[];
  getAttemptsByStage(learnerId: string, stageId: string): Attempt[];
  createAttemptWithEvidence(
    attempt: Attempt,
    events: AuditEvent[]
  ): { attempt: Attempt; profile: Profile };
  updateAttempt(attempt: Attempt, newEvents?: AuditEvent[]): Profile;
  getAppeals(): Appeal[];
  getAppealByAttemptId(attemptId: string): Appeal | undefined;
  createAppeal(
    appeal: Appeal,
    updatedAttempt: Attempt,
    event: AuditEvent
  ): void;
  resolveAppeal(
    appeal: Appeal,
    updatedAttempt: Attempt,
    event: AuditEvent
  ): Profile;
  getAuditEvents(learnerId?: string): AuditEvent[];
  appendAuditEvent(event: AuditEvent): void;
  runPitchPreset(preset: 1 | 2 | 3 | 4): {
    targetAttemptId?: string;
    summary: string;
  };
  getActivePitchPreset(): number;
  setSimulateAiDisagreement(val: boolean): void;
  getSimulateAiDisagreement(): boolean;
  subscribe(listener: () => void): () => void;
}

export function buildAll13PassedTestResults(): TestExecutionResult[] {
  const visible: TestExecutionResult[] = [
    {
      id: 'vis-cart-1',
      name: 'Handles normal multi-item cart',
      hidden: false,
      passed: true,
      criterionId: 'normal',
      inputDisplay: '[{"price":10,"qty":2},{"price":5,"qty":1}]',
      expectedDisplay: '25',
      actualDisplay: '25',
    },
    {
      id: 'vis-cart-2',
      name: 'Empty cart returns 0',
      hidden: false,
      passed: true,
      criterionId: 'empty',
      inputDisplay: '[]',
      expectedDisplay: '0',
      actualDisplay: '0',
    },
    {
      id: 'vis-cart-3',
      name: 'Decimals rounded to 2 places',
      hidden: false,
      passed: true,
      criterionId: 'decimals',
      inputDisplay: '[{"price":19.99,"qty":3}]',
      expectedDisplay: '59.97',
      actualDisplay: '59.97',
    },
  ];

  const hidden: TestExecutionResult[] = Array.from({ length: 10 }, (_, idx) => ({
    id: `hid-cart-${idx + 1}`,
    name: `Hidden boundary test #${idx + 1}`,
    hidden: true,
    passed: true,
    criterionId: 'hidden',
    inputDisplay:
      idx === 0
        ? '[] (Empty boundary)'
        : idx === 1
        ? '[{"price":0.99,"qty":7}] (Single-item decimal)'
        : `Randomized boundary cart #${idx + 1}`,
    expectedDisplay: 'Matches reference',
    actualDisplay: 'Matches reference',
  }));

  return [...visible, ...hidden];
}

export function buildHardcodedShortcutTestResults(): TestExecutionResult[] {
  const visible: TestExecutionResult[] = [
    {
      id: 'vis-cart-1',
      name: 'Handles normal multi-item cart',
      hidden: false,
      passed: true,
      criterionId: 'normal',
      inputDisplay: '[{"price":10,"qty":2},{"price":5,"qty":1}]',
      expectedDisplay: '25',
      actualDisplay: '25',
    },
    {
      id: 'vis-cart-2',
      name: 'Empty cart returns 0',
      hidden: false,
      passed: true,
      criterionId: 'empty',
      inputDisplay: '[]',
      expectedDisplay: '0',
      actualDisplay: '0',
    },
    {
      id: 'vis-cart-3',
      name: 'Decimals rounded to 2 places',
      hidden: false,
      passed: true,
      criterionId: 'decimals',
      inputDisplay: '[{"price":19.99,"qty":3}]',
      expectedDisplay: '59.97',
      actualDisplay: '59.97',
    },
  ];

  const hidden: TestExecutionResult[] = Array.from({ length: 10 }, (_, idx) => ({
    id: `hid-cart-${idx + 1}`,
    name: `Hidden boundary test #${idx + 1}`,
    hidden: true,
    passed: idx === 0, // Only passes the empty cart hidden test (1/10 passed, 9/10 failed)
    criterionId: 'hidden',
    error:
      idx === 0
        ? undefined
        : 'Returned hardcoded 25 instead of actual cart sum on unseen boundary input',
  }));

  return [...visible, ...hidden];
}

function buildInitialSeedState(): PersistedState {
  const oct10Iso = '2026-10-10T08:30:00.000Z';
  const oct09Iso = '2026-10-09T14:15:00.000Z';
  const oct08Iso = '2026-10-08T11:20:00.000Z';

  const attempts: Attempt[] = [
    // Asha Stage 1 Diagnosis (100/100)
    {
      id: 'att-asha-stage-1',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-1-diagnosis',
      stageType: 'bug_diagnosis',
      competency: 'code_reading',
      learnerId: 'learner-asha',
      answer: 'diag-opt-correct',
      seed: 101001,
      submittedAt: oct10Iso,
      lineResults: [
        {
          criterionId: 'diag_root_cause',
          label: 'Identifies off-by-one boundary & missing qty multiplier',
          weight: 100,
          passed: true,
          reason:
            'Exact match: i <= items.length reads items[items.length] which is undefined, items[i].qty is never multiplied, and floating-point totals are not rounded to 2 decimals.',
        },
      ],
      score: 100,
      status: 'scored',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence: 'higher',
      confidenceReason: 'Verified root-cause bug diagnosis',
      feedbackShown: { ruleReasonsShown: true, aiHintRequested: false },
    },

    // Asha Stage 2 Code Fix & Test Runner (Verified, 100/100, 10 Oct 2026, all 13 tests passed)
    {
      id: 'att-asha-verified-code',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-1-debug',
      stageType: 'debug_code',
      competency: 'debugging',
      learnerId: 'learner-asha',
      answer: CLEAN_VERIFIED_CART_CODE,
      starterCodeSnapshot: STARTER_BUGGY_CART_CODE,
      explainBackText: CLEAN_VERIFIED_EXPLAIN_BACK,
      testResults: buildAll13PassedTestResults(),
      seed: 482910,
      submittedAt: oct10Iso,
      lineResults: [
        {
          criterionId: 'normal',
          label: 'Handles normal carts',
          weight: 3,
          passed: true,
          reason: 'All 1 visible test case(s) for "Handles normal carts" passed (30%).',
        },
        {
          criterionId: 'empty',
          label: 'Empty cart',
          weight: 2,
          passed: true,
          reason: 'All 1 visible test case(s) for "Empty cart" passed (20%).',
        },
        {
          criterionId: 'decimals',
          label: 'Decimals',
          weight: 2,
          passed: true,
          reason: 'All 1 visible test case(s) for "Decimals" passed (20%).',
        },
        {
          criterionId: 'hidden',
          label: 'Hidden boundary carts',
          weight: 3,
          passed: true,
          reason: 'All 10/10 randomized hidden boundary tests passed (30%).',
        },
      ],
      score: 100,
      status: 'scored',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence: 'higher',
      confidenceReason:
        'Verified by 13 deterministic sandbox tests (3 visible + 10 hidden fuzz tests)',
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: false,
        aiSecondOpinionUsed: true,
      },
    },

    // Asha Stage 3 Step Sequencing (100/100)
    {
      id: 'att-asha-stage-3',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-3-arrange',
      stageType: 'arrange_steps',
      competency: 'algorithmic_thinking',
      learnerId: 'learner-asha',
      answer: [1, 3, 2, 0],
      seed: 101003,
      submittedAt: oct10Iso,
      lineResults: [
        {
          criterionId: 'init_before_loop',
          label: 'Starts the total before adding',
          weight: 40,
          passed: true,
          reason: 'All required step precedence rules are in valid order.',
        },
        {
          criterionId: 'empty_before_loop',
          label: 'Handles empty cart before the loop',
          weight: 30,
          passed: true,
          reason: 'Empty cart guard clause precedes loop iteration.',
        },
        {
          criterionId: 'return_at_end',
          label: 'Returns only at the end',
          weight: 30,
          passed: true,
          reason: 'Rounded return statement is executed last.',
        },
      ],
      score: 100,
      status: 'scored',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence: 'higher',
      confidenceReason: 'Verified by deterministic precedence rules',
      feedbackShown: { ruleReasonsShown: true, aiHintRequested: false },
    },

    // Asha Stage 4 Written Pseudocode & Explain-Back (100/100)
    {
      id: 'att-asha-stage-4',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-4-pseudocode',
      stageType: 'pseudocode',
      competency: 'communication',
      learnerId: 'learner-asha',
      answer: CLEAN_VERIFIED_EXPLAIN_BACK,
      explainBackText: CLEAN_VERIFIED_EXPLAIN_BACK,
      seed: 101004,
      submittedAt: oct10Iso,
      lineResults: [
        {
          criterionId: 'pc_start_zero',
          label: 'Starts running total at 0',
          weight: 25,
          passed: true,
          rulePassed: true,
          aiMet: true,
          aiEvidenceQuote: 'Start with a running total set to 0',
          reason:
            'Rules and AI second opinion agreed. Quoted: "Start with a running total set to 0".',
        },
        {
          criterionId: 'pc_loop_items',
          label: 'Loops through cart',
          weight: 25,
          passed: true,
          rulePassed: true,
          aiMet: true,
          aiEvidenceQuote: 'Loop through every item in the cart',
          reason:
            'Rules and AI second opinion agreed. Quoted: "Loop through every item in the cart".',
        },
        {
          criterionId: 'pc_multiply',
          label: 'Multiplies price by qty',
          weight: 25,
          passed: true,
          rulePassed: true,
          aiMet: true,
          aiEvidenceQuote: 'multiply item.price by item.qty',
          reason:
            'Rules and AI second opinion agreed. Quoted: "multiply item.price by item.qty".',
        },
        {
          criterionId: 'pc_round_return',
          label: 'Rounds to 2 decimals',
          weight: 25,
          passed: true,
          rulePassed: true,
          aiMet: true,
          aiEvidenceQuote: 'Round the final total to 2 decimals',
          reason:
            'Rules and AI second opinion agreed. Quoted: "Round the final total to 2 decimals".',
        },
      ],
      score: 100,
      status: 'scored',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      aiSecondOpinionRequested: true,
      confidence: 'higher',
      confidenceReason:
        'Verified by deterministic concept rules + AI semantic second opinion (Natural Keystrokes)',
      feedbackShown: {
        ruleReasonsShown: true,
        aiHintRequested: false,
        aiSecondOpinionUsed: true,
      },
    },

    // REVIEWER CASE A: Suspected Shortcut / Cheating (Hardcoded return 25)
    {
      id: 'att-shortcut-case-a',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-1-debug',
      stageType: 'debug_code',
      competency: 'debugging',
      learnerId: 'learner-vikram',
      answer: HARDCODED_SHORTCUT_CART_CODE,
      starterCodeSnapshot: STARTER_BUGGY_CART_CODE,
      testResults: buildHardcodedShortcutTestResults(),
      seed: 910400,
      submittedAt: oct10Iso,
      lineResults: [
        {
          criterionId: 'normal',
          label: 'Handles normal carts',
          weight: 3,
          passed: true,
          reason: 'Passed visible test via hardcoded if (price === 10) return 25.',
        },
        {
          criterionId: 'empty',
          label: 'Empty cart',
          weight: 2,
          passed: true,
          reason: 'Passed visible empty cart check.',
        },
        {
          criterionId: 'decimals',
          label: 'Decimals',
          weight: 2,
          passed: true,
          reason: 'Passed visible test via hardcoded if (price === 19.99) return 59.97.',
        },
        {
          criterionId: 'hidden',
          label: 'Hidden boundary carts',
          weight: 3,
          passed: false,
          reason: 'Failed 9/10 hidden boundary tests (hardcoded literal return detected).',
        },
      ],
      score: 0,
      status: 'flagged',
      reviewCaseType: 'cheating_shortcut',
      flagReason: 'hardcode_suspected',
      flagMessage:
        '⚠️ Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '⚠️ Telemetry: Hardcoded Branch Literals Detected',
      confidence: 'pending',
      confidenceReason:
        'Integrity Alert: Hardcoded Return Suspected — Score Withheld',
      auditHash: '#AUD-9104',
      feedbackShown: { ruleReasonsShown: true, aiHintRequested: false },
    },

    // REVIEWER CASE B: Student Appeal by Asha (Legitimate floating-point precision dispute)
    {
      id: 'att-asha-appeal-case-b',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-1-debug',
      stageType: 'debug_code',
      competency: 'debugging',
      learnerId: 'learner-asha',
      answer: `function calculateTotal(items) {
  if (!items || items.length === 0) return 0;
  const rawTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return Number(rawTotal.toFixed(2));
}`,
      starterCodeSnapshot: STARTER_BUGGY_CART_CODE,
      explainBackText: CLEAN_VERIFIED_EXPLAIN_BACK,
      testResults: buildAll13PassedTestResults(),
      seed: 392811,
      submittedAt: oct09Iso,
      lineResults: [
        {
          criterionId: 'normal',
          label: 'Handles normal carts',
          weight: 3,
          passed: true,
          reason: 'All visible normal cart tests passed (30%).',
        },
        {
          criterionId: 'empty',
          label: 'Empty cart',
          weight: 2,
          passed: true,
          reason: 'Empty cart test passed (20%).',
        },
        {
          criterionId: 'decimals',
          label: 'Decimals',
          weight: 2,
          passed: true,
          reason: 'Visible decimal test passed (20%).',
        },
        {
          criterionId: 'hidden',
          label: 'Hidden boundary carts',
          weight: 3,
          passed: false,
          reason:
            'Test #4 IEEE-754 half-way rounding differed by 0.01 (Number(toFixed(2)) vs Math.round).',
        },
      ],
      score: 70,
      status: 'under_appeal',
      reviewCaseType: 'student_appeal',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence: 'pending',
      confidenceReason: 'Under human appeal review; final confidence is pending',
      feedbackShown: { ruleReasonsShown: true, aiHintRequested: false },
    },

    // Rohan Deshmukh (Consented NxtMove Candidate #2)
    {
      id: 'att-rohan-verified',
      bundleId: 'bundle-cart-total',
      stageId: 'cart-stage-1-debug',
      stageType: 'debug_code',
      competency: 'debugging',
      learnerId: 'learner-rohan',
      answer: CLEAN_VERIFIED_CART_CODE,
      starterCodeSnapshot: STARTER_BUGGY_CART_CODE,
      explainBackText:
        '1. Initialize running total to 0.\n2. Loop over items and accumulate item.price * item.qty.\n3. Round total to 2 decimals with Math.round(total * 100) / 100 and return.',
      testResults: buildAll13PassedTestResults(),
      seed: 104202,
      submittedAt: oct08Iso,
      lineResults: [
        {
          criterionId: 'normal',
          label: 'Handles normal carts',
          weight: 3,
          passed: true,
          reason: 'Passed (30%).',
        },
        {
          criterionId: 'empty',
          label: 'Empty cart',
          weight: 2,
          passed: true,
          reason: 'Passed (20%).',
        },
        {
          criterionId: 'decimals',
          label: 'Decimals',
          weight: 2,
          passed: true,
          reason: 'Passed (20%).',
        },
        {
          criterionId: 'hidden',
          label: 'Hidden boundary carts',
          weight: 3,
          passed: true,
          reason: 'Passed 10/10 hidden boundary tests (30%).',
        },
      ],
      score: 92,
      status: 'scored',
      rubricVersion: 'v1',
      aiUsed: false,
      telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
      confidence: 'higher',
      confidenceReason:
        'Verified by 13 deterministic sandbox tests (3 visible + 10 hidden fuzz tests)',
      feedbackShown: { ruleReasonsShown: true, aiHintRequested: false },
    },
  ];

  const appeals: Appeal[] = [
    {
      id: 'app-asha-case-b',
      attemptId: 'att-asha-appeal-case-b',
      learnerId: 'learner-asha',
      reason:
        'My solution handled decimals correctly; please inspect test #4 precision.',
      status: 'open',
      reviewerNote: '',
      createdAt: oct09Iso,
    },
  ];

  const baseProfiles: Array<{
    learnerId: string;
    name: string;
    college: string;
    roleTarget: string;
    consent: boolean;
    disqualified?: boolean;
    disqualificationReason?: string;
  }> = [
    {
      learnerId: 'learner-asha',
      name: 'Asha',
      college: 'Vindhya Institute of Technology, Bhopal',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      disqualified: false,
    },
    {
      learnerId: 'learner-rohan',
      name: 'Rohan Deshmukh',
      college: 'Sahyadri College of Engineering, Nashik',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      disqualified: false,
    },
    {
      learnerId: 'learner-vikram',
      name: 'Vikram Rathore',
      college: 'Chambal Polytechnic & Engineering, Kota',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      disqualified: true,
      disqualificationReason:
        'Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
    },
  ];

  const profiles: Record<string, Profile> = {};
  for (const bp of baseProfiles) {
    const learnerAttempts = attempts.filter(
      (a) => a.learnerId === bp.learnerId
    );
    profiles[bp.learnerId] = {
      learnerId: bp.learnerId,
      name: bp.name,
      college: bp.college,
      roleTarget: bp.roleTarget,
      consent: bp.consent,
      disqualified: bp.disqualified,
      disqualificationReason: bp.disqualificationReason,
      competencies: computeCompetenciesFromAttempts(learnerAttempts),
    };
  }

  const auditEvents: AuditEvent[] = [
    {
      id: 'aud-seed-1',
      auditHash: '#AUD-9101',
      ts: oct10Iso,
      actor: 'Asha',
      learnerId: 'learner-asha',
      type: 'scored',
      attemptId: 'att-asha-verified-code',
      details:
        'Asha passed all 13 tests (3 visible + 10 hidden boundary tests) and Stage 4 Explain-Back on Fix calculateTotal(items) in Checkout Service (Score: 100/100).',
    },
    {
      id: 'aud-seed-2',
      auditHash: '#AUD-9102',
      ts: oct10Iso,
      actor: 'Asha',
      learnerId: 'learner-asha',
      type: 'consent_on',
      details:
        'Asha enabled "Allow NxtMove recruiters to search and view my profile".',
    },
    {
      id: 'aud-seed-3',
      auditHash: '#AUD-9103',
      ts: oct09Iso,
      actor: 'Asha',
      learnerId: 'learner-asha',
      type: 'appeal_opened',
      attemptId: 'att-asha-appeal-case-b',
      details:
        'Appeal Submitted by Asha: "My solution handled decimals correctly; please inspect test #4 precision."',
    },
    {
      id: 'aud-seed-4',
      auditHash: '#AUD-9104',
      ts: oct10Iso,
      actor: 'System Integrity Guard',
      learnerId: 'learner-vikram',
      type: 'flagged',
      attemptId: 'att-shortcut-case-a',
      details:
        'Integrity Alert: Hardcoded Return Suspected (if (price === 10) return 25). Passed 3/3 visible tests, failed 9/10 hidden tests. Score Withheld.',
    },
  ];

  return {
    activeLearnerId: 'learner-asha',
    profiles,
    attempts,
    appeals,
    auditEvents,
    activePitchPreset: 1,
    simulateAiDisagreement: false,
  };
}

class LocalStorageRepository implements IRepository {
  private state: PersistedState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): PersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && parsed.profiles && parsed.attempts) {
          for (const lid of Object.keys(parsed.profiles)) {
            const lAttempts = parsed.attempts.filter(
              (a) => a.learnerId === lid
            );
            parsed.profiles[lid].competencies =
              computeCompetenciesFromAttempts(lAttempts);
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to seed state
    }
    const seeded = buildInitialSeedState();
    this.persist(seeded);
    return seeded;
  }

  private persist(nextState: PersistedState = this.state): void {
    this.state = nextState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore quota errors
    }
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): PersistedState {
    return this.state;
  }

  getActiveLearner(): Profile {
    return (
      this.state.profiles[this.state.activeLearnerId] ||
      this.state.profiles['learner-asha']
    );
  }

  setActiveLearner(learnerId: string): Profile {
    if (this.state.profiles[learnerId]) {
      this.state.activeLearnerId = learnerId;
      this.persist();
    }
    return this.getActiveLearner();
  }

  registerNewLearner(name: string, college: string): Profile {
    const id = `learner-${Date.now()}`;
    const newProfile: Profile = {
      learnerId: id,
      name: name.trim() || 'New Learner',
      college: college.trim() || 'Student College',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      disqualified: false,
      competencies: {
        debugging: { level: 'Not assessed', score: 0, confidence: 'pending', recency: 'None' },
        code_reading: { level: 'Not assessed', score: 0, confidence: 'pending', recency: 'None' },
        algorithmic_thinking: { level: 'Not assessed', score: 0, confidence: 'pending', recency: 'None' },
        communication: { level: 'Not assessed', score: 0, confidence: 'pending', recency: 'None' },
      },
    };
    this.state.profiles[id] = newProfile;
    this.state.activeLearnerId = id;
    this.persist();
    return newProfile;
  }

  updateLearnerIdentity(
    learnerId: string,
    name: string,
    college: string
  ): Profile {
    const existing = this.state.profiles[learnerId];
    if (!existing) return this.getActiveLearner();
    const updated: Profile = {
      ...existing,
      name: name.trim() || existing.name,
      college: college.trim() || existing.college,
    };
    this.state.profiles[learnerId] = updated;
    this.persist();
    return updated;
  }

  getAllProfiles(): Profile[] {
    return Object.values(this.state.profiles);
  }

  getProfileById(learnerId: string): Profile | undefined {
    return this.state.profiles[learnerId];
  }

  saveProfile(profile: Profile): void {
    this.state.profiles[profile.learnerId] = profile;
    this.persist();
  }

  getAttempts(): Attempt[] {
    return [...this.state.attempts].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getAttemptById(attemptId: string): Attempt | undefined {
    return this.state.attempts.find((a) => a.id === attemptId);
  }

  getAttemptsByLearner(learnerId: string): Attempt[] {
    return this.state.attempts
      .filter((a) => a.learnerId === learnerId)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
  }

  getAttemptsByStage(learnerId: string, stageId: string): Attempt[] {
    return this.state.attempts
      .filter((a) => a.learnerId === learnerId && a.stageId === stageId)
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
  }

  createAttemptWithEvidence(
    attempt: Attempt,
    events: AuditEvent[]
  ): { attempt: Attempt; profile: Profile } {
    this.state.attempts = [...this.state.attempts, attempt];
    this.state.auditEvents = [...events, ...this.state.auditEvents];

    const learnerAttempts = this.state.attempts.filter(
      (a) => a.learnerId === attempt.learnerId
    );
    const existingProfile = this.state.profiles[attempt.learnerId];
    const updatedProfile: Profile = {
      ...existingProfile,
      competencies: computeCompetenciesFromAttempts(learnerAttempts),
    };
    this.state.profiles[attempt.learnerId] = updatedProfile;
    this.persist();
    return { attempt, profile: updatedProfile };
  }

  updateAttempt(attempt: Attempt, newEvents: AuditEvent[] = []): Profile {
    this.state.attempts = this.state.attempts.map((a) =>
      a.id === attempt.id ? attempt : a
    );
    if (newEvents.length > 0) {
      this.state.auditEvents = [...newEvents, ...this.state.auditEvents];
    }

    const learnerAttempts = this.state.attempts.filter(
      (a) => a.learnerId === attempt.learnerId
    );
    const existingProfile = this.state.profiles[attempt.learnerId];
    const updatedProfile: Profile = {
      ...existingProfile,
      competencies: computeCompetenciesFromAttempts(learnerAttempts),
    };
    this.state.profiles[attempt.learnerId] = updatedProfile;
    this.persist();
    return updatedProfile;
  }

  getAppeals(): Appeal[] {
    return [...this.state.appeals].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getAppealByAttemptId(attemptId: string): Appeal | undefined {
    return this.state.appeals.find((ap) => ap.attemptId === attemptId);
  }

  createAppeal(
    appeal: Appeal,
    updatedAttempt: Attempt,
    event: AuditEvent
  ): void {
    this.state.appeals = [appeal, ...this.state.appeals];
    this.updateAttempt(updatedAttempt, [event]);
  }

  resolveAppeal(
    appeal: Appeal,
    updatedAttempt: Attempt,
    event: AuditEvent
  ): Profile {
    this.state.appeals = this.state.appeals.map((ap) =>
      ap.id === appeal.id ? appeal : ap
    );
    return this.updateAttempt(updatedAttempt, [event]);
  }

  getAuditEvents(learnerId?: string): AuditEvent[] {
    const all = [...this.state.auditEvents].sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
    if (!learnerId) return all;
    return all.filter((e) => e.learnerId === learnerId);
  }

  appendAuditEvent(event: AuditEvent): void {
    this.state.auditEvents = [event, ...this.state.auditEvents];
    this.persist();
  }

  getActivePitchPreset(): number {
    return this.state.activePitchPreset || 1;
  }

  /**
   * Executes one of the 4 Global Pitch Controller Presets deterministically.
   */
  runPitchPreset(preset: 1 | 2 | 3 | 4): {
    targetAttemptId?: string;
    summary: string;
  } {
    this.state.activePitchPreset = preset;
    const oct10Iso = '2026-10-10T08:50:00.000Z';

    if (preset === 1) {
      // Preset 1 (Fair Pass): Sets Asha to clean code, passes all 13 tests, completes Stage 4 pseudocode, score 100/100, verified profile updated.
      const cleanAttempt: Attempt = {
        id: 'att-asha-verified-code',
        bundleId: 'bundle-cart-total',
        stageId: 'cart-stage-1-debug',
        stageType: 'debug_code',
        competency: 'debugging',
        learnerId: 'learner-asha',
        answer: CLEAN_VERIFIED_CART_CODE,
        starterCodeSnapshot: STARTER_BUGGY_CART_CODE,
        explainBackText: CLEAN_VERIFIED_EXPLAIN_BACK,
        testResults: buildAll13PassedTestResults(),
        seed: 482910,
        submittedAt: oct10Iso,
        lineResults: [
          {
            criterionId: 'normal',
            label: 'Handles normal carts',
            weight: 3,
            passed: true,
            reason: 'All 1 visible test case(s) for "Handles normal carts" passed (30%).',
          },
          {
            criterionId: 'empty',
            label: 'Empty cart',
            weight: 2,
            passed: true,
            reason: 'All 1 visible test case(s) for "Empty cart" passed (20%).',
          },
          {
            criterionId: 'decimals',
            label: 'Decimals',
            weight: 2,
            passed: true,
            reason: 'All 1 visible test case(s) for "Decimals" passed (20%).',
          },
          {
            criterionId: 'hidden',
            label: 'Hidden boundary carts',
            weight: 3,
            passed: true,
            reason: 'All 10/10 randomized hidden boundary tests passed (30%).',
          },
        ],
        score: 100,
        status: 'scored',
        rubricVersion: 'v1',
        aiUsed: false,
        telemetryLabel: '📋 Telemetry: Natural Keystrokes (No Bulk Paste)',
        confidence: 'higher',
        confidenceReason:
          'Verified by 13 deterministic sandbox tests (3 visible + 10 hidden fuzz tests)',
        feedbackShown: {
          ruleReasonsShown: true,
          aiHintRequested: false,
          aiSecondOpinionUsed: true,
        },
      };

      // Remove any temporary shortcut attempt on Asha so her latest debugging attempt is the clean 100/100 pass
      this.state.attempts = [
        ...this.state.attempts.filter(
          (a) =>
            a.id !== 'att-asha-verified-code' &&
            a.id !== 'att-asha-shortcut-demo'
        ),
        cleanAttempt,
      ];

      const ashaAttempts = this.state.attempts.filter(
        (a) => a.learnerId === 'learner-asha'
      );
      this.state.profiles['learner-asha'] = {
        ...this.state.profiles['learner-asha'],
        consent: true,
        disqualified: false,
        competencies: computeCompetenciesFromAttempts(ashaAttempts),
      };

      this.state.auditEvents = [
        {
          id: `aud-preset1-${Date.now()}`,
          auditHash: '#AUD-9101',
          ts: new Date().toISOString(),
          actor: 'Asha',
          learnerId: 'learner-asha',
          type: 'scored',
          attemptId: 'att-asha-verified-code',
          details:
            'Preset 1 (Fair Pass): Asha passed all 13 tests (3 visible + 10 hidden boundary tests) and Stage 4 Explain-Back. Score: 100/100 Verified.',
        },
        ...this.state.auditEvents,
      ];

      this.persist();
      return {
        targetAttemptId: 'att-asha-verified-code',
        summary:
          'Preset 1 (Fair Pass): Clean loop fix loaded, 13/13 tests passed, Stage 4 explain-back verified, and Asha profile updated to 100/100.',
      };
    }

    if (preset === 2) {
      // Preset 2 (Caught Shortcut): Loads hardcoded `if (price === 10) return 25`. Passes visible tests but fails 9/10 hidden tests. Flags Integrity Alert: Hardcoded Return Suspected, score Withheld.
      const shortcutAttempt: Attempt = {
        id: 'att-shortcut-case-a',
        bundleId: 'bundle-cart-total',
        stageId: 'cart-stage-1-debug',
        stageType: 'debug_code',
        competency: 'debugging',
        learnerId: 'learner-vikram',
        answer: HARDCODED_SHORTCUT_CART_CODE,
        starterCodeSnapshot: STARTER_BUGGY_CART_CODE,
        testResults: buildHardcodedShortcutTestResults(),
        seed: 910400,
        submittedAt: new Date().toISOString(),
        lineResults: [
          {
            criterionId: 'normal',
            label: 'Handles normal carts',
            weight: 3,
            passed: true,
            reason: 'Passed visible test via hardcoded if (price === 10) return 25.',
          },
          {
            criterionId: 'empty',
            label: 'Empty cart',
            weight: 2,
            passed: true,
            reason: 'Passed visible empty cart check.',
          },
          {
            criterionId: 'decimals',
            label: 'Decimals',
            weight: 2,
            passed: true,
            reason: 'Passed visible test via hardcoded if (price === 19.99) return 59.97.',
          },
          {
            criterionId: 'hidden',
            label: 'Hidden boundary carts',
            weight: 3,
            passed: false,
            reason:
              'Failed 9/10 hidden boundary tests (hardcoded literal return detected).',
          },
        ],
        score: 0,
        status: 'flagged',
        reviewCaseType: 'cheating_shortcut',
        flagReason: 'hardcode_suspected',
        flagMessage:
          '⚠️ Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
        rubricVersion: 'v1',
        aiUsed: false,
        telemetryLabel: '⚠️ Telemetry: Hardcoded Branch Literals Detected',
        confidence: 'pending',
        confidenceReason:
          'Integrity Alert: Hardcoded Return Suspected — Score Withheld',
        auditHash: '#AUD-9104',
        feedbackShown: { ruleReasonsShown: true, aiHintRequested: false },
      };

      this.state.attempts = [
        ...this.state.attempts.filter((a) => a.id !== 'att-shortcut-case-a'),
        shortcutAttempt,
      ];

      this.state.auditEvents = [
        {
          id: `aud-preset2-${Date.now()}`,
          auditHash: '#AUD-9104',
          ts: new Date().toISOString(),
          actor: 'System Integrity Guard',
          learnerId: 'learner-vikram',
          type: 'flagged',
          attemptId: 'att-shortcut-case-a',
          details:
            'Preset 2 (Caught Shortcut): Hardcoded `if (price === 10) return 25` passed 3/3 visible tests but failed 9/10 hidden tests. Flagged Integrity Alert: Hardcoded Return Suspected (Score Withheld).',
        },
        ...this.state.auditEvents,
      ];

      this.persist();
      return {
        targetAttemptId: 'att-shortcut-case-a',
        summary:
          'Preset 2 (Caught Shortcut): Hardcoded return 25 passed 3 visible tests, failed 9/10 hidden tests. Flagged as Integrity Alert — Score Withheld.',
      };
    }

    if (preset === 3) {
      // Preset 3 (Reviewer Action): Ensures the shortcut attempt is present in the Reviewer queue ready to inspect or confirm disqualification
      const existingShortcut = this.state.attempts.find(
        (a) => a.id === 'att-shortcut-case-a'
      );
      if (!existingShortcut) {
        this.runPitchPreset(2);
      }
      this.state.activePitchPreset = 3;
      this.persist();
      return {
        targetAttemptId: 'att-shortcut-case-a',
        summary:
          'Preset 3 (Reviewer Action): Opened Reviewer Console on Case A (Hardcoded Return Detected). Click "Confirm Disqualification (Withhold Score)" to stamp #AUD-9104.',
      };
    }

    // Preset 4 (Recruiter Portal): Ensures Asha is verified (100/100) and shared with NxtMove, while the shortcut candidate is disqualified & excluded.
    this.runPitchPreset(1);
    this.state.activePitchPreset = 4;
    if (this.state.profiles['learner-vikram']) {
      this.state.profiles['learner-vikram'] = {
        ...this.state.profiles['learner-vikram'],
        disqualified: true,
        disqualificationReason:
          'Disqualified (#AUD-9104): Hardcoded Return Confirmed',
      };
    }
    this.persist();
    return {
      targetAttemptId: 'att-asha-verified-code',
      summary:
        'Preset 4 (Recruiter Portal): Switched to NxtMove Recruiter view. Asha is surfaced under Junior Backend Engineer with 100/100 verified evidence; disqualified candidate is excluded.',
    };
  }

  setSimulateAiDisagreement(val: boolean): void {
    this.state.simulateAiDisagreement = val;
    this.persist();
  }

  getSimulateAiDisagreement(): boolean {
    return Boolean(this.state.simulateAiDisagreement);
  }
}

export const repository: IRepository = new LocalStorageRepository();
