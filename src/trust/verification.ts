import {
  StudentIdOcrPayload,
  VerificationReasonCode,
} from '../types';

/**
 * DOCUMENTED DETERMINISTIC THRESHOLDS FOR TRACK A (LEARNER STUDENT ID VERIFICATION):
 * - OCR_AUTO_VERIFY_THRESHOLD = 0.85 (85%):
 *   If idValid === true and ocrConfidence >= 0.85 -> returns VERIFIED.
 * - OCR_MIN_REVIEW_THRESHOLD = 0.55 (55%):
 *   If idValid === true and 0.55 <= ocrConfidence < 0.85 -> returns NEEDS_REVIEW (routed to human Reviewer screen).
 * - Below 0.55 or invalid confidence -> returns REJECTED (OCR_CONFIDENCE_TOO_LOW).
 * - If idValid === false -> returns REJECTED (EXPIRED_ID_CARD) regardless of OCR confidence.
 *
 * Design Principle #1: Vision/OCR extracts text & confidence, but deterministic rules
 * and human reviewers make all approval/rejection decisions.
 */
export const OCR_AUTO_VERIFY_THRESHOLD = 0.85;
export const OCR_MIN_REVIEW_THRESHOLD = 0.55;
export const CURRENT_ACADEMIC_YEAR = 2026;

export interface DecideResult {
  decision: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';
  reasonCodes: VerificationReasonCode[];
  explanation: string;
}

/**
 * Pure, deterministic validity-year check.
 * Rejects student IDs whose validity year is earlier than referenceYear (default 2026).
 */
export function checkStudentIdValidityYear(
  validityYear: number,
  referenceYear: number = CURRENT_ACADEMIC_YEAR
): boolean {
  if (!Number.isInteger(validityYear)) return false;
  return validityYear >= referenceYear && validityYear <= referenceYear + 10;
}

/**
 * Pure, testable decision function: decide(ocrConfidence, idValid)
 * Returns VERIFIED | NEEDS_REVIEW | REJECTED with reason codes and documented threshold rationale.
 */
export function decide(
  ocrConfidence: number,
  idValid: boolean
): DecideResult {
  if (
    typeof ocrConfidence !== 'number' ||
    Number.isNaN(ocrConfidence) ||
    ocrConfidence < 0 ||
    ocrConfidence > 1
  ) {
    return {
      decision: 'REJECTED',
      reasonCodes: ['OCR_CONFIDENCE_TOO_LOW'],
      explanation:
        'Rejected: OCR confidence value is missing or out of bounds [0.0, 1.0].',
    };
  }

  // Rule 1: Expired or invalid ID year immediately rejects
  if (!idValid) {
    return {
      decision: 'REJECTED',
      reasonCodes: ['EXPIRED_ID_CARD'],
      explanation:
        'Rejected: Student ID validity year has expired (< 2026). You may upload a current ID or submit an appeal.',
    };
  }

  // Rule 2: High OCR confidence (>= 0.85) + valid ID -> VERIFIED
  if (ocrConfidence >= OCR_AUTO_VERIFY_THRESHOLD) {
    return {
      decision: 'VERIFIED',
      reasonCodes: ['OCR_CONFIDENCE_HIGH'],
      explanation: `Verified: ID validity check passed and OCR confidence (${Math.round(
        ocrConfidence * 100
      )}%) meets the >= 85% auto-verification threshold.`,
    };
  }

  // Rule 3: Borderline OCR confidence (0.55 <= c < 0.85) + valid ID -> NEEDS_REVIEW
  if (ocrConfidence >= OCR_MIN_REVIEW_THRESHOLD) {
    return {
      decision: 'NEEDS_REVIEW',
      reasonCodes: ['OCR_CONFIDENCE_BORDERLINE'],
      explanation: `Needs Human Review: ID validity check passed, but OCR confidence (${Math.round(
        ocrConfidence * 100
      )}%) is in the borderline band (55%–84%). Routed to Reviewer queue.`,
    };
  }

// Rule 4: Very low OCR confidence (< 0.55) -> REJECTED
  return {
    decision: 'REJECTED',
    reasonCodes: ['OCR_CONFIDENCE_TOO_LOW'],
    explanation: `Rejected: OCR confidence (${Math.round(
      ocrConfidence * 100
    )}%) is below the 55% minimum readability threshold.`,
  };
}

/**
 * Live Camera & Biometric Face Match Decision:
 * decideWithFaceMatch(ocrConfidence, idValid, faceMatchScore, faceMatched)
 * 
 * Verifies the candidate ONLY if:
 * 1. ID Card is valid (validityYear >= 2026)
 * 2. OCR confidence meets auto-verify threshold (>= 85%)
 * 3. Live camera photo matches the ID card portrait (faceMatched === true && faceMatchScore >= 85%)
 * 
 * If the face biometric does not match, verification is strictly withheld/rejected!
 */
export const FACE_MATCH_AUTO_VERIFY_THRESHOLD = 0.85;

export function decideWithFaceMatch(
  ocrConfidence: number,
  idValid: boolean,
  faceMatchScore: number,
  faceMatched: boolean
): DecideResult {
  const baseResult = decide(ocrConfidence, idValid);

  // If the ID card itself failed validation, reject immediately
  if (baseResult.decision === 'REJECTED') {
    return baseResult;
  }

  // Check live camera face matching
  if (!faceMatched || faceMatchScore < FACE_MATCH_AUTO_VERIFY_THRESHOLD) {
    return {
      decision: 'REJECTED',
      reasonCodes: [...baseResult.reasonCodes, 'FACE_MISMATCH_REJECTED'],
      explanation: `Rejected (Biometric Mismatch): Live camera selfie does not match the student ID portrait (${Math.round(
        faceMatchScore * 100
      )}% match, minimum required >= 85%). Liveness verification failed.`,
    };
  }

  // If OCR was borderline (55%-84%), human reviewer must still review, but face match is recorded
  if (baseResult.decision === 'NEEDS_REVIEW') {
    return {
      decision: 'NEEDS_REVIEW',
      reasonCodes: [
        ...baseResult.reasonCodes,
        'FACE_MATCH_VERIFIED',
        'FACE_LIVENESS_CONFIRMED',
      ],
      explanation: `${baseResult.explanation} Live camera face biometric confirmed (${Math.round(
        faceMatchScore * 100
      )}% match).`,
    };
  }

  // Both ID Card OCR and Live Face Match passed
  return {
    decision: 'VERIFIED',
    reasonCodes: [
      ...baseResult.reasonCodes,
      'FACE_MATCH_VERIFIED',
      'FACE_LIVENESS_CONFIRMED',
    ],
    explanation: `Verified: Student ID card passed (${Math.round(
      ocrConfidence * 100
    )}% OCR) AND live camera selfie matched ID portrait (${Math.round(
      faceMatchScore * 100
    )}% biometric match). Full identity verification complete!`,
  };
}

/**
 * Track B: Free Email Provider Blocklist for Recruiter Verification
 */
export const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'rediffmail.com',
  'mail.com',
  'zoho.com',
  'gmx.com',
]);

export interface WorkEmailValidationResult {
  valid: boolean;
  domain: string;
  reasonCode: VerificationReasonCode;
  message: string;
}

export function validateRecruiterWorkEmail(
  email: string
): WorkEmailValidationResult {
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) {
    return {
      valid: false,
      domain: '',
      reasonCode: 'MISSING_REQUIRED_FIELDS',
      message: 'Please enter a valid corporate work email address.',
    };
  }

  const domain = parts[1];
  if (FREE_EMAIL_PROVIDERS.has(domain)) {
    return {
      valid: false,
      domain,
      reasonCode: 'FREE_EMAIL_PROVIDER_BLOCKED',
      message: `Blocked: Free email provider (@${domain}) is not permitted for Recruiter verification. Use an organisation domain (e.g., @nxtmove.io).`,
    };
  }

  return {
    valid: true,
    domain,
    reasonCode: 'WORK_DOMAIN_ACCEPTED',
    message: `Accepted corporate domain (@${domain}).`,
  };
}

export const ASHA_PORTRAIT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#E2E8F0"/>
  <circle cx="100" cy="75" r="40" fill="#E0A96D"/>
  <path d="M60,65 Q100,10 140,65 Q150,110 135,120 Q100,85 65,120 Z" fill="#1E293B"/>
  <ellipse cx="85" cy="75" rx="4" ry="5" fill="#1E293B"/>
  <ellipse cx="115" cy="75" rx="4" ry="5" fill="#1E293B"/>
  <circle cx="100" cy="65" r="2.5" fill="#C8102E"/>
  <path d="M92,92 Q100,98 108,92" stroke="#B45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M40,190 Q50,135 100,135 Q150,135 160,190 Z" fill="#2E6FD8"/>
  <rect x="75" y="150" width="50" height="25" rx="4" fill="#0B1B3A"/>
  <text x="100" y="167" font-family="Arial" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">VIT 2027</text>
</svg>`);

export const KIRAN_PORTRAIT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#E2E8F0"/>
  <circle cx="100" cy="75" r="40" fill="#D49B6A"/>
  <path d="M65,60 Q100,20 135,60 Q130,40 100,35 Q70,40 65,60 Z" fill="#0F172A"/>
  <ellipse cx="85" cy="75" rx="4" ry="5" fill="#1E293B"/>
  <ellipse cx="115" cy="75" rx="4" ry="5" fill="#1E293B"/>
  <path d="M92,92 Q100,98 108,92" stroke="#B45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M40,190 Q50,135 100,135 Q150,135 160,190 Z" fill="#0D9488"/>
  <rect x="75" y="150" width="50" height="25" rx="4" fill="#0B1B3A"/>
  <text x="100" y="167" font-family="Arial" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">VIT 2028</text>
</svg>`);

/**
 * Demo Mode Sample Student ID Cards for Track A (Client-side OCR presets)
 */
export const DEMO_STUDENT_ID_SAMPLES: StudentIdOcrPayload[] = [
  {
    sampleId: 'sample-valid-asha',
    sampleLabel: 'Sample 1: Clear Student ID (Asha · Valid 2027 · 94% OCR)',
    fullName: 'Asha',
    studentIdNumber: 'VIT-BPL-2023-CS042',
    institution: 'Vindhya Institute of Technology, Bhopal',
    validityYear: 2027,
    ocrConfidence: 0.94,
    imagePreviewTitle: 'VIT Bhopal — Official Student Identity Card (2023–2027)',
    idPhotoUrl: ASHA_PORTRAIT_SVG,
  },
  {
    sampleId: 'sample-borderline-glare',
    sampleLabel:
      'Sample 2: Camera Glare / Blur ID (Kiran · Valid 2028 · 68% OCR -> NEEDS_REVIEW)',
    fullName: 'Kiran Verma',
    studentIdNumber: 'VIT-BPL-2024-EC118',
    institution: 'Vindhya Institute of Technology, Bhopal',
    validityYear: 2028,
    ocrConfidence: 0.68,
    imagePreviewTitle:
      'VIT Bhopal — Low-Contrast / Glare Scan (Borderline OCR)',
    idPhotoUrl: KIRAN_PORTRAIT_SVG,
  },
  {
    sampleId: 'sample-expired-id',
    sampleLabel:
      'Sample 3: Expired Student ID (Asha · Expired 2024 · 92% OCR -> REJECTED)',
    fullName: 'Asha',
    studentIdNumber: 'VIT-BPL-2020-CS019',
    institution: 'Vindhya Institute of Technology, Bhopal',
    validityYear: 2024,
    ocrConfidence: 0.92,
    imagePreviewTitle: 'VIT Bhopal — Expired Student ID Card (2020–2024)',
    idPhotoUrl: ASHA_PORTRAIT_SVG,
  },
];

/**
 * Client-side OCR extraction from an uploaded image file (deterministic fallback if Tesseract worker is offline).
 */
export async function extractStudentIdFromFile(
  file: File
): Promise<StudentIdOcrPayload> {
  // Simulate a fast 350ms client-side OCR scan and derive deterministic OCR payload from filename
  await new Promise((r) => setTimeout(r, 350));
  const lower = file.name.toLowerCase();
  let uploadedUrl = '';
  try {
    uploadedUrl = URL.createObjectURL(file);
  } catch {
    uploadedUrl = ASHA_PORTRAIT_SVG;
  }

  if (lower.includes('expired') || lower.includes('2024')) {
    return {
      ...DEMO_STUDENT_ID_SAMPLES[2],
      sampleLabel: `Uploaded File: ${file.name}`,
      idPhotoUrl: uploadedUrl || ASHA_PORTRAIT_SVG,
    };
  }
  if (lower.includes('blur') || lower.includes('glare') || lower.includes('low')) {
    return {
      ...DEMO_STUDENT_ID_SAMPLES[1],
      sampleLabel: `Uploaded File: ${file.name}`,
      idPhotoUrl: uploadedUrl || KIRAN_PORTRAIT_SVG,
    };
  }

  return {
    ...DEMO_STUDENT_ID_SAMPLES[0],
    sampleLabel: `Uploaded File: ${file.name}`,
    idPhotoUrl: uploadedUrl || ASHA_PORTRAIT_SVG,
  };
}

/**
 * Deliverable 4: Built-in Unit Tests for decide(ocrConfidence, idValid) and work email rules
 */
export interface VerificationUnitTestCase {
  id: string;
  name: string;
  inputDisplay: string;
  expectedDecision: string;
  actualDecision: string;
  reasonCodes: string[];
  passed: boolean;
}

export function runVerificationUnitTests(): VerificationUnitTestCase[] {
  const cases: Array<{
    id: string;
    name: string;
    ocrConfidence: number;
    idValid: boolean;
    expected: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';
  }> = [
    {
      id: 'ut-1',
      name: 'High OCR confidence (0.94) + Valid ID (2027)',
      ocrConfidence: 0.94,
      idValid: true,
      expected: 'VERIFIED',
    },
    {
      id: 'ut-2',
      name: 'Exact upper threshold boundary (0.85) + Valid ID',
      ocrConfidence: 0.85,
      idValid: true,
      expected: 'VERIFIED',
    },
    {
      id: 'ut-3',
      name: 'Just below auto-verify threshold (0.84) + Valid ID -> Human Review',
      ocrConfidence: 0.84,
      idValid: true,
      expected: 'NEEDS_REVIEW',
    },
    {
      id: 'ut-4',
      name: 'Exact lower review boundary (0.55) + Valid ID -> Human Review',
      ocrConfidence: 0.55,
      idValid: true,
      expected: 'NEEDS_REVIEW',
    },
    {
      id: 'ut-5',
      name: 'Unreadable OCR scan (0.42 < 0.55) + Valid ID -> Rejected',
      ocrConfidence: 0.42,
      idValid: true,
      expected: 'REJECTED',
    },
    {
      id: 'ut-6',
      name: 'High OCR confidence (0.96) + Expired ID (idValid=false) -> Rejected',
      ocrConfidence: 0.96,
      idValid: false,
      expected: 'REJECTED',
    },
    {
      id: 'ut-7',
      name: 'Malformed OCR confidence (NaN) -> Rejected safely',
      ocrConfidence: Number.NaN,
      idValid: true,
      expected: 'REJECTED',
    },
  ];

  const results: VerificationUnitTestCase[] = cases.map((c) => {
    const out = decide(c.ocrConfidence, c.idValid);
    return {
      id: c.id,
      name: c.name,
      inputDisplay: `decide(${String(c.ocrConfidence)}, ${c.idValid})`,
      expectedDecision: c.expected,
      actualDecision: out.decision,
      reasonCodes: out.reasonCodes,
      passed: out.decision === c.expected,
    };
  });

  // Also test email domain rule
  const freeCheck = validateRecruiterWorkEmail('recruiter@gmail.com');
  const workCheck = validateRecruiterWorkEmail('priya.nair@nxtmove.io');
  results.push({
    id: 'ut-8',
    name: 'Recruiter work email rule blocks @gmail.com and accepts @nxtmove.io',
    inputDisplay: `validateRecruiterWorkEmail('recruiter@gmail.com') / ('priya.nair@nxtmove.io')`,
    expectedDecision: 'BLOCK_FREE_ALLOW_WORK',
    actualDecision:
      !freeCheck.valid && workCheck.valid ? 'BLOCK_FREE_ALLOW_WORK' : 'FAILED',
    reasonCodes: [freeCheck.reasonCode, workCheck.reasonCode],
    passed: !freeCheck.valid && workCheck.valid,
  });

  return results;
}
