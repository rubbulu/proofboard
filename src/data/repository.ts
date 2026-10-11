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
  FaceVerificationData,
  FirestoreUserRecord,
  LearnerVerificationDecision,
  Profile,
  RecruiterApplicationPayload,
  RecruiterVerificationStatus,
  StudentIdOcrPayload,
  TestExecutionResult,
  VerificationRecord,
} from '../types';
import {
  checkStudentIdValidityYear,
  decide,
  decideWithFaceMatch,
  DEMO_STUDENT_ID_SAMPLES,
  validateRecruiterWorkEmail,
} from '../trust/verification';

const STORAGE_KEY = 'proofboard_samartha_v6_state';

export interface PersistedState {
  activeLearnerId: string;
  activeRecruiterUid: string;
  profiles: Record<string, Profile>;
  attempts: Attempt[];
  appeals: Appeal[];
  auditEvents: AuditEvent[];
  users: Record<string, FirestoreUserRecord>;
  verifications: VerificationRecord[];
  autoApproveDemoRecruiter: boolean;
  activePitchPreset: number;
  simulateAiDisagreement: boolean;
  isDemoShowcaseMode?: boolean;
}

export interface IRepository {
  getState(): PersistedState;
  getActiveLearner(): Profile;
  setActiveLearner(learnerId: string): Profile;
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
  getUsers(): FirestoreUserRecord[];
  getUserByUid(uid: string): FirestoreUserRecord | undefined;
  getActiveRecruiterUser(): FirestoreUserRecord;
  setActiveRecruiterStatus(status: RecruiterVerificationStatus): void;
  getVerifications(): VerificationRecord[];
  submitLearnerVerification(
    learnerId: string,
    ocrPayload: StudentIdOcrPayload,
    faceData?: FaceVerificationData
  ): VerificationRecord;
  submitRecruiterVerification(
    recruiterPayload: RecruiterApplicationPayload
  ): VerificationRecord;
  resolveVerificationByReviewer(params: {
    verificationId: string;
    decision: 'VERIFIED' | 'APPROVED' | 'REJECTED';
    reviewerNote: string;
  }): VerificationRecord | undefined;
  getPublishedAttemptsByLearner(learnerId: string): Attempt[];
  publishLearnerAssessment(
    learnerId: string,
    selectedAttemptIdsByStage?: Record<string, string>
  ): Profile;
  unpublishLearnerAssessment(learnerId: string): Profile;
  verifyRecruiterEmailOtp(
    email: string,
    otpCode: string
  ): { verified: boolean; message: string };
  verifyRecruiterMfaPasskey(): { verified: boolean; sessionToken: string };
  suspendRecruiterAccess(
    reason: string,
    targetRecruiterUid?: string
  ): FirestoreUserRecord;
  reinstateRecruiterAccess(targetRecruiterUid?: string): FirestoreUserRecord;
  getAutoApproveDemoRecruiter(): boolean;
  setAutoApproveDemoRecruiter(val: boolean): void;
  updateActiveRecruiterIdentity(displayName: string, email: string): void;
  initLearnerFreshSession(username: string): void;
  initRecruiterUnverifiedSession(displayName: string, email: string): void;
  loadDemoShowcaseState(): void;
  resetToUnverifiedZeroState(): void;
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
      published: true,
      publishedAt: oct10Iso,
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
      published: true,
      publishedAt: oct10Iso,
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
      published: true,
      publishedAt: oct10Iso,
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
      published: true,
      publishedAt: oct10Iso,
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
      published: true,
      publishedAt: oct08Iso,
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
    verificationStatus: LearnerVerificationDecision;
    studentIdNumber?: string;
    validityYear?: number;
    disqualified?: boolean;
    disqualificationReason?: string;
  }> = [
    {
      learnerId: 'learner-asha',
      name: 'Asha',
      college: 'Vindhya Institute of Technology, Bhopal',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      verificationStatus: 'VERIFIED',
      studentIdNumber: 'VIT-BPL-2023-CS042',
      validityYear: 2027,
      disqualified: false,
    },
    {
      learnerId: 'learner-rohan',
      name: 'Rohan Deshmukh',
      college: 'Sahyadri College of Engineering, Nashik',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      verificationStatus: 'VERIFIED',
      studentIdNumber: 'SCE-NSK-2023-IT088',
      validityYear: 2027,
      disqualified: false,
    },
    {
      learnerId: 'learner-kiran',
      name: 'Kiran Verma',
      college: 'Vindhya Institute of Technology, Bhopal',
      roleTarget: 'Junior Backend Engineer',
      consent: false,
      verificationStatus: 'NEEDS_REVIEW',
      studentIdNumber: 'VIT-BPL-2024-EC118',
      validityYear: 2028,
      disqualified: false,
    },
    {
      learnerId: 'learner-vikram',
      name: 'Vikram Rathore',
      college: 'Chambal Polytechnic & Engineering, Kota',
      roleTarget: 'Junior Backend Engineer',
      consent: true,
      verificationStatus: 'VERIFIED',
      studentIdNumber: 'CPE-KOT-2023-CS012',
      validityYear: 2027,
      disqualified: true,
      disqualificationReason:
        'Integrity Violation: Hardcoded Return Detected (Failed 9/10 hidden tests)',
    },
  ];

  const profiles: Record<string, Profile> = {};
  for (const bp of baseProfiles) {
    const publishedAttempts = attempts.filter(
      (a) => a.learnerId === bp.learnerId && a.published === true
    );
    profiles[bp.learnerId] = {
      learnerId: bp.learnerId,
      name: bp.name,
      college: bp.college,
      roleTarget: bp.roleTarget,
      consent: bp.consent,
      verificationStatus: bp.verificationStatus,
      studentIdNumber: bp.studentIdNumber,
      validityYear: bp.validityYear,
      disqualified: bp.disqualified,
      disqualificationReason: bp.disqualificationReason,
      hasPublishedAssessment: publishedAttempts.length > 0,
      publishedAt: publishedAttempts.length > 0 ? oct10Iso : undefined,
      competencies: computeCompetenciesFromAttempts(publishedAttempts),
    };
  }

  // Seed Firestore `users` collection for Demo Showcase state
  const users: Record<string, FirestoreUserRecord> = {
    'learner-asha': {
      uid: 'learner-asha',
      role: 'learner',
      displayName: 'Asha',
      verificationStatus: 'VERIFIED',
      institutionOrOrg: 'Vindhya Institute of Technology, Bhopal',
      updatedAt: oct10Iso,
    },
    'learner-rohan': {
      uid: 'learner-rohan',
      role: 'learner',
      displayName: 'Rohan Deshmukh',
      verificationStatus: 'VERIFIED',
      institutionOrOrg: 'Sahyadri College of Engineering, Nashik',
      updatedAt: oct08Iso,
    },
    'learner-kiran': {
      uid: 'learner-kiran',
      role: 'learner',
      displayName: 'Kiran Verma',
      verificationStatus: 'NEEDS_REVIEW',
      institutionOrOrg: 'Vindhya Institute of Technology, Bhopal',
      updatedAt: oct10Iso,
    },
    'recruiter-priya': {
      uid: 'recruiter-priya',
      role: 'recruiter',
      displayName: 'Priya Nair',
      email: 'priya.nair@nxtmove.io',
      designation: 'Lead Technical Recruiter',
      verificationStatus: 'APPROVED',
      institutionOrOrg: 'NxtMove Talent Partners',
      emailOtpVerified: true,
      mfaVerified: true,
      activeSessionToken: 'tok_nxt_live_9f8a4b2c',
      suspended: false,
      updatedAt: oct10Iso,
    },
    'recruiter-arjun': {
      uid: 'recruiter-arjun',
      role: 'recruiter',
      displayName: 'Arjun Mehta',
      email: 'arjun.mehta@infosys-campus.in',
      designation: 'University Hiring Partner',
      verificationStatus: 'PENDING',
      institutionOrOrg: 'Infosys Campus Hiring',
      updatedAt: oct10Iso,
    },
    'reviewer-isro': {
      uid: 'reviewer-isro',
      role: 'reviewer',
      displayName: 'Dr. S. Kulkarni (ISRO / Faculty Auditor)',
      verificationStatus: 'VERIFIED',
      institutionOrOrg: 'ProofBoard Governance Board',
      updatedAt: oct10Iso,
    },
  };

  // Seed Firestore `verifications` collection (includes NEEDS_REVIEW learner and PENDING recruiters for ReviewerQueue!)
  const verifications: VerificationRecord[] = [
    {
      id: 'ver-kiran-borderline',
      uid: 'learner-kiran',
      userName: 'Kiran Verma',
      track: 'learner_track_a',
      decision: 'NEEDS_REVIEW',
      reasonCodes: ['OCR_CONFIDENCE_BORDERLINE'],
      ocrPayload: DEMO_STUDENT_ID_SAMPLES[1],
      timestamp: oct10Iso,
      auditHash: '#AUD-9105',
    },
    {
      id: 'ver-priya-recruiter',
      uid: 'recruiter-priya',
      userName: 'Priya Nair',
      track: 'recruiter_track_b',
      decision: 'PENDING',
      reasonCodes: ['WORK_DOMAIN_ACCEPTED', 'PENDING_HUMAN_REVIEW'],
      recruiterPayload: {
        workEmail: 'priya.nair@nxtmove.io',
        companyName: 'NxtMove Talent Partners',
        designation: 'Lead Technical Recruiter',
        proofLink: 'https://linkedin.com/company/nxtmove-talent',
      },
      timestamp: oct10Iso,
      auditHash: '#AUD-9099',
    },
    {
      id: 'ver-arjun-pending',
      uid: 'recruiter-arjun',
      userName: 'Arjun Mehta',
      track: 'recruiter_track_b',
      decision: 'PENDING',
      reasonCodes: ['WORK_DOMAIN_ACCEPTED', 'PENDING_HUMAN_REVIEW'],
      recruiterPayload: {
        workEmail: 'arjun.mehta@infosys-campus.in',
        companyName: 'Infosys Campus Hiring',
        designation: 'University Hiring Partner',
        proofLink: 'https://infosys.com/careers/campus-verification',
      },
      timestamp: oct10Iso,
      auditHash: '#AUD-9106',
    },
  ];

  const auditEvents: AuditEvent[] = [
    {
      id: 'aud-seed-ver-1',
      auditHash: '#AUD-9098',
      ts: oct10Iso,
      actor: 'Verification Engine (Track A)',
      learnerId: 'learner-asha',
      type: 'verification_decision',
      details:
        'Track A Student ID Verification for Asha (VIT-BPL-2023-CS042, valid 2027, OCR 94%): VERIFIED [OCR_CONFIDENCE_HIGH].',
    },
    {
      id: 'aud-seed-ver-2',
      auditHash: '#AUD-9105',
      ts: oct10Iso,
      actor: 'Verification Engine (Track A)',
      learnerId: 'learner-kiran',
      type: 'verification_submitted',
      details:
        'Track A Student ID Verification for Kiran Verma (VIT-BPL-2024-EC118, valid 2028, OCR 68%): NEEDS_REVIEW [OCR_CONFIDENCE_BORDERLINE] — routed to Reviewer Queue.',
    },
    {
      id: 'aud-seed-ver-3',
      auditHash: '#AUD-9106',
      ts: oct10Iso,
      actor: 'Arjun Mehta (Recruiter Track B)',
      type: 'verification_submitted',
      details:
        'Track B Recruiter Verification submitted (arjun.mehta@infosys-campus.in · Infosys Campus Hiring): PENDING human Reviewer approval.',
    },
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
    activeRecruiterUid: 'recruiter-priya',
    profiles,
    attempts,
    appeals,
    auditEvents,
    users,
    verifications,
    autoApproveDemoRecruiter: false,
    activePitchPreset: 1,
    simulateAiDisagreement: false,
    isDemoShowcaseMode: true,
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
            const publishedAttempts = parsed.attempts.filter(
              (a) => a.learnerId === lid && a.published === true
            );
            parsed.profiles[lid].competencies =
              computeCompetenciesFromAttempts(publishedAttempts);
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

  getPublishedAttemptsByLearner(learnerId: string): Attempt[] {
    return this.getAttemptsByLearner(learnerId).filter(
      (a) => a.published === true
    );
  }

  createAttemptWithEvidence(
    attempt: Attempt,
    events: AuditEvent[]
  ): { attempt: Attempt; profile: Profile } {
    const savedAttempt: Attempt = {
      ...attempt,
      published: Boolean(attempt.published),
    };
    this.state.attempts = [...this.state.attempts, savedAttempt];
    this.state.auditEvents = [...events, ...this.state.auditEvents];

    // Only published attempts update the learner's Competency Profile & Recruiter Portal
    const publishedLearnerAttempts = this.state.attempts.filter(
      (a) => a.learnerId === savedAttempt.learnerId && a.published === true
    );
    const existingProfile = this.state.profiles[savedAttempt.learnerId];
    const updatedProfile: Profile = {
      ...existingProfile,
      competencies: computeCompetenciesFromAttempts(publishedLearnerAttempts),
    };
    this.state.profiles[savedAttempt.learnerId] = updatedProfile;
    this.persist();
    return { attempt: savedAttempt, profile: updatedProfile };
  }

  updateAttempt(attempt: Attempt, newEvents: AuditEvent[] = []): Profile {
    this.state.attempts = this.state.attempts.map((a) =>
      a.id === attempt.id ? attempt : a
    );
    if (newEvents.length > 0) {
      this.state.auditEvents = [...newEvents, ...this.state.auditEvents];
    }

    const publishedLearnerAttempts = this.state.attempts.filter(
      (a) => a.learnerId === attempt.learnerId && a.published === true
    );
    const existingProfile = this.state.profiles[attempt.learnerId];
    const updatedProfile: Profile = {
      ...existingProfile,
      competencies: computeCompetenciesFromAttempts(publishedLearnerAttempts),
    };
    this.state.profiles[attempt.learnerId] = updatedProfile;
    this.persist();
    return updatedProfile;
  }

  publishLearnerAssessment(
    learnerId: string,
    selectedAttemptIdsByStage?: Record<string, string>
  ): Profile {
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const learnerAttempts = this.state.attempts.filter(
      (a) => a.learnerId === learnerId
    );

    // Determine the desired attempt ID per stage
    const chosenIds = new Set<string>();
    const byStage = new Map<string, Attempt[]>();
    for (const att of learnerAttempts) {
      const list = byStage.get(att.stageId) || [];
      list.push(att);
      byStage.set(att.stageId, list);
    }

    for (const [stageId, stageAttempts] of byStage.entries()) {
      const explicitId = selectedAttemptIdsByStage?.[stageId];
      if (explicitId && stageAttempts.some((a) => a.id === explicitId)) {
        chosenIds.add(explicitId);
      } else {
        // Pick the latest non-disqualified/non-flagged attempt, or latest overall
        const ordered = [...stageAttempts].sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        const bestClean =
          ordered.find(
            (a) => a.status !== 'disqualified' && a.status !== 'flagged'
          ) || ordered[0];
        if (bestClean) {
          chosenIds.add(bestClean.id);
        }
      }
    }

    this.state.attempts = this.state.attempts.map((a) => {
      if (a.learnerId !== learnerId) return a;
      if (chosenIds.has(a.id)) {
        return {
          ...a,
          published: true,
          publishedAt: nowIso,
        };
      }
      return {
        ...a,
        published: false,
        publishedAt: undefined,
      };
    });

    const publishedAttempts = this.state.attempts.filter(
      (a) => a.learnerId === learnerId && a.published === true
    );
    const existingProfile = this.state.profiles[learnerId];
    const updatedProfile: Profile = {
      ...existingProfile,
      hasPublishedAssessment: publishedAttempts.length > 0,
      publishedAt: publishedAttempts.length > 0 ? nowIso : undefined,
      competencies: computeCompetenciesFromAttempts(publishedAttempts),
    };
    this.state.profiles[learnerId] = updatedProfile;

    const pubEvent: AuditEvent = {
      id: `aud-pub-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: updatedProfile.name,
      learnerId,
      type: 'assessment_published',
      details: `${updatedProfile.name} published ${publishedAttempts.length} stage attempt(s) to Competency Profile and NxtMove Recruiter Portal.`,
    };
    this.state.auditEvents = [pubEvent, ...this.state.auditEvents];
    this.persist();
    return updatedProfile;
  }

  unpublishLearnerAssessment(learnerId: string): Profile {
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;

    this.state.attempts = this.state.attempts.map((a) =>
      a.learnerId === learnerId
        ? { ...a, published: false, publishedAt: undefined }
        : a
    );

    const existingProfile = this.state.profiles[learnerId];
    const updatedProfile: Profile = {
      ...existingProfile,
      hasPublishedAssessment: false,
      publishedAt: undefined,
      competencies: computeCompetenciesFromAttempts([]),
    };
    this.state.profiles[learnerId] = updatedProfile;

    const unpubEvent: AuditEvent = {
      id: `aud-unpub-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: updatedProfile.name,
      learnerId,
      type: 'assessment_unpublished',
      details: `${updatedProfile.name} unpublished their assessment attempts from Competency Profile and NxtMove Recruiter Portal.`,
    };
    this.state.auditEvents = [unpubEvent, ...this.state.auditEvents];
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

  getUsers(): FirestoreUserRecord[] {
    return Object.values(this.state.users || {});
  }

  getUserByUid(uid: string): FirestoreUserRecord | undefined {
    return this.state.users?.[uid];
  }

  getActiveRecruiterUser(): FirestoreUserRecord {
    const uid = this.state.activeRecruiterUid || 'recruiter-priya';
    return (
      this.state.users?.[uid] || {
        uid: 'recruiter-priya',
        role: 'recruiter',
        displayName: 'Priya Nair',
        email: 'priya.nair@nxtmove.io',
        designation: 'Lead Technical Recruiter',
        verificationStatus: 'APPROVED',
        institutionOrOrg: 'NxtMove Talent Partners',
        updatedAt: new Date().toISOString(),
      }
    );
  }

  setActiveRecruiterStatus(status: RecruiterVerificationStatus): void {
    const rec = this.getActiveRecruiterUser();
    const updated: FirestoreUserRecord = {
      ...rec,
      verificationStatus: status,
      updatedAt: new Date().toISOString(),
    };
    this.state.users[rec.uid] = updated;
    this.persist();
  }

  updateActiveRecruiterIdentity(displayName: string, email: string): void {
    const rec = this.getActiveRecruiterUser();
    const updated: FirestoreUserRecord = {
      ...rec,
      displayName: displayName.trim() || rec.displayName,
      email: email.trim() || rec.email,
      updatedAt: new Date().toISOString(),
    };
    this.state.users[rec.uid] = updated;
    this.persist();
  }

  initLearnerFreshSession(username: string): void {
    const cleanName = username.trim() || 'Asha';
    const nowIso = new Date().toISOString();

    this.state.isDemoShowcaseMode = false;
    this.state.activePitchPreset = 0;

    // Clear all attempts, appeals, verifications, and audit events for learner-asha so everything starts at 0
    this.state.attempts = this.state.attempts.filter(
      (a) => a.learnerId !== 'learner-asha'
    );
    this.state.appeals = this.state.appeals.filter(
      (ap) => ap.learnerId !== 'learner-asha'
    );
    this.state.verifications = (this.state.verifications || []).filter(
      (v) => v.uid !== 'learner-asha'
    );
    this.state.auditEvents = (this.state.auditEvents || []).filter(
      (ev) => ev.learnerId !== 'learner-asha'
    );

    const existingAsha = this.state.profiles['learner-asha'];
    this.state.profiles['learner-asha'] = {
      ...(existingAsha || {
        learnerId: 'learner-asha',
        college: 'Vindhya Institute of Technology, Bhopal',
        roleTarget: 'Junior Backend Engineer',
      }),
      name: cleanName,
      consent: false,
      verificationStatus: 'UNVERIFIED',
      disqualified: false,
      hasPublishedAssessment: false,
      publishedAt: undefined,
      competencies: computeCompetenciesFromAttempts([]),
    };

    if (this.state.profiles['learner-rohan']) {
      this.state.profiles['learner-rohan'] = {
        ...this.state.profiles['learner-rohan'],
        consent: false,
      };
    }

    this.state.users['learner-asha'] = {
      uid: 'learner-asha',
      role: 'learner',
      displayName: cleanName,
      verificationStatus: 'UNVERIFIED',
      institutionOrOrg:
        this.state.profiles['learner-asha'].college ||
        'Vindhya Institute of Technology, Bhopal',
      updatedAt: nowIso,
    };

    // Ensure recruiter also starts unverified (PENDING) outside Demo Mode
    const rec = this.getActiveRecruiterUser();
    this.state.users[rec.uid] = {
      ...rec,
      verificationStatus: 'PENDING',
      emailOtpVerified: false,
      mfaVerified: false,
      activeSessionToken: undefined,
      suspended: false,
      suspensionReason: undefined,
      updatedAt: nowIso,
    };

    this.persist();
  }

  initRecruiterUnverifiedSession(displayName: string, email: string): void {
    const nowIso = new Date().toISOString();

    // If we were in Demo Showcase Mode (meaning the user hasn't logged in as Learner yet),
    // clear Demo Showcase pre-populated learner scores so only real Learner session progress is shown
    if (this.state.isDemoShowcaseMode) {
      this.initLearnerFreshSession(
        this.state.profiles['learner-asha']?.name || 'Asha'
      );
    }

    const rec = this.getActiveRecruiterUser();
    this.state.users[rec.uid] = {
      ...rec,
      displayName: displayName.trim() || rec.displayName,
      email: email.trim() || rec.email,
      verificationStatus: 'PENDING',
      emailOtpVerified: false,
      mfaVerified: false,
      activeSessionToken: undefined,
      suspended: false,
      suspensionReason: undefined,
      updatedAt: nowIso,
    };

    this.persist();
  }

  loadDemoShowcaseState(): void {
    const demoState = buildInitialSeedState();
    this.persist(demoState);
  }

  resetToUnverifiedZeroState(): void {
    this.initLearnerFreshSession(this.getActiveLearner().name || 'Asha');
  }

  getVerifications(): VerificationRecord[] {
    return [...(this.state.verifications || [])].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  submitLearnerVerification(
    learnerId: string,
    ocrPayload: StudentIdOcrPayload,
    faceData?: FaceVerificationData
  ): VerificationRecord {
    const idValid = checkStudentIdValidityYear(ocrPayload.validityYear);
    const decisionOut = faceData
      ? decideWithFaceMatch(
          ocrPayload.ocrConfidence,
          idValid,
          faceData.faceMatchScore,
          faceData.matched
        )
      : decide(ocrPayload.ocrConfidence, idValid);
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;

    const record: VerificationRecord = {
      id: `ver-a-${Date.now()}`,
      uid: learnerId,
      userName: ocrPayload.fullName,
      track: 'learner_track_a',
      decision: decisionOut.decision,
      reasonCodes: decisionOut.reasonCodes,
      ocrPayload,
      faceData,
      timestamp: nowIso,
      auditHash,
    };

    // Update profile & Firestore users record
    const existingProfile = this.state.profiles[learnerId];
    if (existingProfile) {
      this.state.profiles[learnerId] = {
        ...existingProfile,
        name: ocrPayload.fullName,
        college: ocrPayload.institution,
        studentIdNumber: ocrPayload.studentIdNumber,
        validityYear: ocrPayload.validityYear,
        verificationStatus: decisionOut.decision,
        consent:
          decisionOut.decision === 'VERIFIED' ? true : existingProfile.consent,
      };
    }

    const existingUser = this.state.users[learnerId];
    this.state.users[learnerId] = {
      uid: learnerId,
      role: 'learner',
      displayName: ocrPayload.fullName,
      verificationStatus: decisionOut.decision,
      institutionOrOrg: ocrPayload.institution,
      updatedAt: nowIso,
      ...(existingUser ? {} : {}),
    };

    this.state.verifications = [
      record,
      ...this.state.verifications.filter((v) => v.uid !== learnerId),
    ];

    const submittedEvent: AuditEvent = {
      id: `aud-ver-sub-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: ocrPayload.fullName,
      learnerId,
      type: 'verification_submitted',
      details: `Track A Student ID submitted by ${ocrPayload.fullName} (ID: ${
        ocrPayload.studentIdNumber
      }, Validity: ${ocrPayload.validityYear}, OCR Confidence: ${Math.round(
        ocrPayload.ocrConfidence * 100
      )}%).`,
    };

    const decisionEvent: AuditEvent = {
      id: `aud-ver-dec-${Date.now() + 1}`,
      auditHash,
      ts: nowIso,
      actor: 'Verification Engine (decide)',
      learnerId,
      type: 'verification_decision',
      details: `Track A decision for ${ocrPayload.fullName}: ${
        decisionOut.decision
      } [${decisionOut.reasonCodes.join(', ')}] — ${decisionOut.explanation}`,
    };

    this.state.auditEvents = [
      decisionEvent,
      submittedEvent,
      ...this.state.auditEvents,
    ];
    this.persist();
    return record;
  }

  submitRecruiterVerification(
    recruiterPayload: RecruiterApplicationPayload
  ): VerificationRecord {
    const emailCheck = validateRecruiterWorkEmail(recruiterPayload.workEmail);
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const activeRec = this.getActiveRecruiterUser();

    const decision: 'APPROVED' | 'PENDING' | 'REJECTED' = !emailCheck.valid
      ? 'REJECTED'
      : this.state.autoApproveDemoRecruiter
      ? 'APPROVED'
      : 'PENDING';

    const reasonCodes = !emailCheck.valid
      ? [emailCheck.reasonCode]
      : this.state.autoApproveDemoRecruiter
      ? [emailCheck.reasonCode, 'AUTO_APPROVED_DEMO_MODE' as const]
      : [emailCheck.reasonCode, 'PENDING_HUMAN_REVIEW' as const];

    const record: VerificationRecord = {
      id: `ver-b-${Date.now()}`,
      uid: activeRec.uid,
      userName: activeRec.displayName,
      track: 'recruiter_track_b',
      decision,
      reasonCodes,
      recruiterPayload,
      timestamp: nowIso,
      auditHash,
    };

    this.state.users[activeRec.uid] = {
      ...activeRec,
      email: recruiterPayload.workEmail,
      institutionOrOrg: recruiterPayload.companyName,
      designation: recruiterPayload.designation,
      emailOtpVerified:
        recruiterPayload.emailOtpVerified ?? activeRec.emailOtpVerified,
      mfaVerified: recruiterPayload.mfaVerified ?? activeRec.mfaVerified,
      activeSessionToken:
        decision === 'APPROVED'
          ? activeRec.activeSessionToken || 'tok_nxt_live_9f8a4b2c'
          : activeRec.activeSessionToken,
      suspended: false,
      suspensionReason: undefined,
      verificationStatus: decision,
      updatedAt: nowIso,
    };

    this.state.verifications = [record, ...this.state.verifications];

    const event: AuditEvent = {
      id: `aud-rec-ver-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: `${activeRec.displayName} (${recruiterPayload.workEmail})`,
      type:
        decision === 'APPROVED'
          ? 'verification_decision'
          : 'verification_submitted',
      details: `Track B Recruiter Verification (${recruiterPayload.workEmail} · ${
        recruiterPayload.companyName
      }): ${decision} [${reasonCodes.join(', ')}].`,
    };

    this.state.auditEvents = [event, ...this.state.auditEvents];
    this.persist();
    return record;
  }

  verifyRecruiterEmailOtp(
    email: string,
    otpCode: string
  ): { verified: boolean; message: string } {
    const emailCheck = validateRecruiterWorkEmail(email);
    if (!emailCheck.valid) {
      return { verified: false, message: emailCheck.message };
    }
    const cleanOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return {
        verified: false,
        message: 'Please enter the 6-digit corporate mailbox OTP code.',
      };
    }

    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const activeRec = this.getActiveRecruiterUser();

    this.state.users[activeRec.uid] = {
      ...activeRec,
      email: email.trim(),
      emailOtpVerified: true,
      updatedAt: nowIso,
    };

    const event: AuditEvent = {
      id: `aud-rec-otp-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: `${activeRec.displayName} (${email.trim()})`,
      type: 'recruiter_otp_verified',
      details: `Corporate mailbox ownership verified via 6-digit OTP / Magic Link for ${email.trim()} (${auditHash}).`,
    };
    this.state.auditEvents = [event, ...this.state.auditEvents];
    this.persist();

    return {
      verified: true,
      message: `Corporate mailbox ownership verified for ${email.trim()} via one-time OTP / Magic Link (${auditHash}).`,
    };
  }

  verifyRecruiterMfaPasskey(): { verified: boolean; sessionToken: string } {
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const activeRec = this.getActiveRecruiterUser();
    const sessionToken = `tok_nxt_${Math.random().toString(36).slice(2, 10)}`;

    this.state.users[activeRec.uid] = {
      ...activeRec,
      mfaVerified: true,
      activeSessionToken: sessionToken,
      updatedAt: nowIso,
    };

    const event: AuditEvent = {
      id: `aud-rec-mfa-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: `${activeRec.displayName} (${activeRec.email || 'recruiter'})`,
      type: 'recruiter_mfa_verified',
      details: `WebAuthn Hardware Passkey / MFA second factor verified for ${activeRec.displayName}. Active token issued: ${sessionToken}.`,
    };
    this.state.auditEvents = [event, ...this.state.auditEvents];
    this.persist();

    return { verified: true, sessionToken };
  }

  suspendRecruiterAccess(
    reason: string,
    targetRecruiterUid?: string
  ): FirestoreUserRecord {
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const uid =
      targetRecruiterUid || this.state.activeRecruiterUid || 'recruiter-priya';
    const targetRec = this.state.users[uid] || this.getActiveRecruiterUser();
    const cleanReason =
      reason.trim() ||
      'Security Admin revoked APPROVED recruiter token and terminated session.';

    const updated: FirestoreUserRecord = {
      ...targetRec,
      verificationStatus: 'REJECTED',
      suspended: true,
      suspensionReason: cleanReason,
      activeSessionToken: undefined,
      revokedAt: nowIso,
      updatedAt: nowIso,
    };
    this.state.users[uid] = updated;

    // Also update any matching verification records to REJECTED with RECRUITER_TOKEN_REVOKED
    this.state.verifications = (this.state.verifications || []).map((v) =>
      v.uid === uid && v.track === 'recruiter_track_b'
        ? {
            ...v,
            decision: 'REJECTED',
            reasonCodes: Array.from(
              new Set([...v.reasonCodes, 'RECRUITER_TOKEN_REVOKED' as const])
            ),
            reviewerNote: cleanReason,
            timestamp: nowIso,
            auditHash,
          }
        : v
    );

    const event: AuditEvent = {
      id: `aud-rec-susp-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: 'Reviewer / Security Governance',
      type: 'recruiter_suspended',
      details: `Instant Recruiter Suspension & Token Revocation for ${targetRec.displayName} (${targetRec.email}): Status set to REJECTED/SUSPENDED. Reason: "${cleanReason}"`,
    };
    this.state.auditEvents = [event, ...this.state.auditEvents];
    this.persist();
    return updated;
  }

  reinstateRecruiterAccess(targetRecruiterUid?: string): FirestoreUserRecord {
    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const uid =
      targetRecruiterUid || this.state.activeRecruiterUid || 'recruiter-priya';
    const targetRec = this.state.users[uid] || this.getActiveRecruiterUser();
    const newToken = `tok_nxt_${Math.random().toString(36).slice(2, 10)}`;

    const updated: FirestoreUserRecord = {
      ...targetRec,
      verificationStatus: 'APPROVED',
      suspended: false,
      suspensionReason: undefined,
      activeSessionToken: newToken,
      revokedAt: undefined,
      updatedAt: nowIso,
    };
    this.state.users[uid] = updated;

    this.state.verifications = (this.state.verifications || []).map((v) =>
      v.uid === uid && v.track === 'recruiter_track_b'
        ? {
            ...v,
            decision: 'APPROVED',
            reasonCodes: Array.from(
              new Set([
                ...v.reasonCodes.filter((c) => c !== 'RECRUITER_TOKEN_REVOKED'),
                'REVIEWER_APPROVED' as const,
              ])
            ),
            reviewerNote: 'Reinstated recruiter session and issued new token.',
            timestamp: nowIso,
            auditHash,
          }
        : v
    );

    const event: AuditEvent = {
      id: `aud-rec-rein-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: 'Reviewer / Security Governance',
      type: 'recruiter_reinstated',
      details: `Recruiter access reinstated for ${targetRec.displayName} (${targetRec.email}). New active session token issued: ${newToken}.`,
    };
    this.state.auditEvents = [event, ...this.state.auditEvents];
    this.persist();
    return updated;
  }

  resolveVerificationByReviewer(params: {
    verificationId: string;
    decision: 'VERIFIED' | 'APPROVED' | 'REJECTED';
    reviewerNote: string;
  }): VerificationRecord | undefined {
    const { verificationId, decision, reviewerNote } = params;
    const target = this.state.verifications.find(
      (v) => v.id === verificationId
    );
    if (!target) return undefined;

    const nowIso = new Date().toISOString();
    const auditHash = `#AUD-${Math.floor(1000 + Math.random() * 8999)}`;
    const nextReasonCode =
      decision === 'REJECTED' ? 'REVIEWER_REJECTED' : 'REVIEWER_APPROVED';

    const updatedRecord: VerificationRecord = {
      ...target,
      decision,
      reasonCodes: [...target.reasonCodes, nextReasonCode],
      reviewerId: 'reviewer-isro',
      reviewerNote: reviewerNote.trim(),
      timestamp: nowIso,
      auditHash,
    };

    this.state.verifications = this.state.verifications.map((v) =>
      v.id === verificationId ? updatedRecord : v
    );

    if (target.track === 'learner_track_a') {
      const learnerDecision: LearnerVerificationDecision =
        decision === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
      if (this.state.profiles[target.uid]) {
        this.state.profiles[target.uid] = {
          ...this.state.profiles[target.uid],
          verificationStatus: learnerDecision,
        };
      }
      if (this.state.users[target.uid]) {
        this.state.users[target.uid] = {
          ...this.state.users[target.uid],
          verificationStatus: learnerDecision,
          updatedAt: nowIso,
        };
      }
    } else {
      const recruiterDecision: RecruiterVerificationStatus =
        decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
      if (this.state.users[target.uid]) {
        this.state.users[target.uid] = {
          ...this.state.users[target.uid],
          verificationStatus: recruiterDecision,
          updatedAt: nowIso,
        };
      }
    }

    const overrideEvent: AuditEvent = {
      id: `aud-ver-rev-${Date.now()}`,
      auditHash,
      ts: nowIso,
      actor: 'Reviewer (ISRO / Faculty Auditor)',
      learnerId:
        target.track === 'learner_track_a' ? target.uid : undefined,
      type: 'verification_override',
      details: `Reviewer decided ${target.track} for ${
        target.userName
      }: ${decision}. Note: "${reviewerNote.trim()}"`,
    };

    this.state.auditEvents = [overrideEvent, ...this.state.auditEvents];
    this.persist();
    return updatedRecord;
  }

  getAutoApproveDemoRecruiter(): boolean {
    return Boolean(this.state.autoApproveDemoRecruiter);
  }

  setAutoApproveDemoRecruiter(val: boolean): void {
    this.state.autoApproveDemoRecruiter = val;
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
        published: true,
        publishedAt: oct10Iso,
      };

      // Remove any temporary shortcut attempt on Asha so her latest debugging attempt is the clean 100/100 pass
      this.state.attempts = [
        ...this.state.attempts
          .filter(
            (a) =>
              a.id !== 'att-asha-verified-code' &&
              a.id !== 'att-asha-shortcut-demo'
          )
          .map((a) =>
            a.learnerId === 'learner-asha' && a.status === 'scored'
              ? { ...a, published: true, publishedAt: oct10Iso }
              : a
          ),
        cleanAttempt,
      ];

      const ashaAttempts = this.state.attempts.filter(
        (a) => a.learnerId === 'learner-asha' && a.published === true
      );
      this.state.profiles['learner-asha'] = {
        ...this.state.profiles['learner-asha'],
        consent: true,
        verificationStatus: 'VERIFIED',
        disqualified: false,
        hasPublishedAssessment: true,
        publishedAt: oct10Iso,
        competencies: computeCompetenciesFromAttempts(ashaAttempts),
      };
      if (this.state.users['learner-asha']) {
        this.state.users['learner-asha'] = {
          ...this.state.users['learner-asha'],
          verificationStatus: 'VERIFIED',
          updatedAt: new Date().toISOString(),
        };
      }

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

    // Preset 4 (Recruiter Portal): Ensures Asha is verified (100/100) and shared with NxtMove, Recruiter is APPROVED, while the shortcut candidate is disqualified & excluded.
    this.runPitchPreset(1);
    this.setActiveRecruiterStatus('APPROVED');
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
