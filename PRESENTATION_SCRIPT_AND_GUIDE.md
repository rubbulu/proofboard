# ProofBoard × NxtMove (Samartha) — Hackathon Presentation Master Guide & 8-Minute Script

---

## 1. Brief Description: What Is ProofBoard? (30-Second Elevator Pitch)

**ProofBoard (Samartha)** is an **anti-gamified, evidence-backed engineering competency and talent verification platform** built for **NxtMove**.

Today, early-career technical hiring is broken by two extremes:
1. **Gamified Noise:** Students farm daily streaks, XP badges, and memorized LeetCode puzzles that do not reflect real-world software engineering.
2. **AI & Resume Distrust:** Recruiters are flooded with AI-generated resumes and copy-pasted assessment scores they cannot trust—causing genuinely skilled engineers from Tier-2 and Tier-3 colleges to be filtered out by resume pedigree.

**What ProofBoard Does Differently:**
- **4-Stage Real Engineering Incident (Not Toy Puzzles):** Learners solve one cohesive production incident across 4 stages in the **Task Sandbox**:
  - **Stage 1 — Bug Diagnosis (`debug_triage`):** Diagnose the root cause of a production bug from logs and code context.
  - **Stage 2 — Code Fix (`coding_fix`):** Write and test the fix against visible tests, hidden edge-case tests, and adversarial mutation tests.
  - **Stage 3 — Complexity & System Reasoning (`system_design`):** Justify algorithmic complexity and distributed systems trade-offs.
  - **Stage 4 — PR Review & Critique (`pr_review`):** Audit a flawed pull request for regression and concurrency risks.
- **Learner-Controlled Safe Publication:** Learners can practice, make mistakes, and retry stages privately as **Sandbox Drafts**. Only after completing all 4 stages—and choosing their desired attempt per stage—does clicking **Publish Solved Problem** upload their evidence to their **Competency Profile** and **NxtMove Recruiters**.
- **Dual-Track Identity Verification & 4-Layer Consent Guard:**
  - **Track A (Learner Identity):** Student ID & institutional domain verification (`VERIFIED`) required before official scoring and profile sharing.
  - **Track B (Recruiter Identity):** Corporate domain validation (blocks free emails like `@gmail.com`), **6-Digit Corporate Email OTP / Magic Link**, **WebAuthn MFA Passkey**, and **Instant Session Token Revocation**.
- **Explainable Anti-Cheat + Human-in-the-Loop Appeals:** Instead of silent auto-bans, suspicious telemetry (e.g., high paste burst + zero test runs + shallow rationale) triggers a transparent `FLAGGED` hold. Learners can file a **Fairness Appeal**, and a **Reviewer** inspects the unified code diff and telemetry before clearing or disqualifying.

---

## 2. Scoring Matrix Strategy (How to Win All 40 Weight Points)

Notice from your judging rubric that **Prototype / Technical Achievement (10)** + **Solution Effectiveness (8)** + **Innovation (5)** + **Requirement Fulfilment (5)** account for **70% of your entire score (28 / 40 points)**. Do not spend 5 minutes on static slides—spend **70% of your time inside the live prototype**.

| # | Judging Criterion | Weight | Share | Exact Feature to Show & Mention Live |
| :- | :--- | :---: | :---: | :--- |
| **1** | **Prototype / Technical Achievement** | **10** | **25.0%** | Live **4-Stage Task Sandbox**, **Mutation + Hidden Test Runner**, **Unified Git-Style Code Diff**, **Multi-Language Conceptual AI Hints (English/Hindi/Telugu/Tamil/Kannada with Zero Code Leakage)**, **Corporate Email OTP + WebAuthn MFA**, and **SHA-256 Tamper-Evident Audit Log**. |
| **2** | **Solution Effectiveness** | **8** | **20.0%** | Show the **NxtMove Recruiter View** and **Evidence Drawer Modal**: prove how a hiring partner can verify a candidate's exact code diff, test matrix, and root-cause reasoning in **under 15 seconds** instead of reading a fake resume. |
| **3** | **Innovation & Differentiation** | **5** | **12.5%** | Emphasize **4 breakthroughs**: (1) **Zero-Gamification** (no streaks/XP/leaderboards), (2) **Learner-Controlled 4-Stage Publish Gate** (psychological safety to fail in drafts), (3) **Adversarial Mutation Testing**, and (4) **Instant Recruiter Token Revocation**. |
| **4** | **Requirement Fulfilment** | **5** | **12.5%** | Demonstrate the **3 Role Logins** (`Learner`, `Recruiter`, `Demo User`) and all **4 Workspace Views** (`Learner`, `Recruiter`, `Reviewer` [Read-Only for Learner/Recruiter, Admin in Demo], and `Demo Control Center`). |
| **5** | **Usability / User Experience** | **3** | **7.5%** | Highlight the clean **4-Stage Progress Bar**, **Desired Attempt Selector**, **Confidence Indicators (`High/Medium/Low`)**, and **1-Click Scenario Triggers** in the Demo Control Center. |
| **6** | **Scalability / Applicability** | **3** | **7.5%** | Highlight the **Pluggable Task Catalog** (Order Total Bug, Sliding-Window Rate Limiter, Idempotent Webhook Processor, Inventory Reservation Race), **Versioned Rubrics (`v2.4.0`)**, and **Firebase Firestore Security Rules** (`firestore.rules`). |
| **7** | **Validation / Evidence** | **3** | **7.5%** | Show the pre-verified multi-candidate cohort (`Asha Verma`, `Rohan Nair`, `Meera Iyer`, `Dev Kulkarni`, `Kabir Sharma`) and the **Evidence Hash (`ev_sha256_...`)** attached to every attempt. |
| **8** | **Q&A / Technical Defence** | **2** | **5.0%** | Use the **Q&A Defense Cheat Sheet** (Section 6 below) to defend deterministic rubric grading, mutation testing, false-positive appeal handling, and Firestore zero-trust rules. |
| **9** | **Pitch & Communication** | **1** | **2.5%** | Follow the timed **8-minute choreography** below with crisp transitions between the **Fresh Learner/Recruiter Flow** and the **Demo User Showcase**. |

---

## 3. Seven Must-Mention Key Points (Judges' Checklist)

Make sure you speak these **7 core points** out loud during your talk:

1. **Proof-of-Skill Over Self-Reported Resumes:** Recruiters never rely on an opaque percentage or resume keyword; every competency score links directly to an immutable **Evidence Packet** (code diff, visible/hidden tests, mutation tests, and rubric breakdown).
2. **Cohesive 4-Stage Production Incident:** Instead of isolated multiple-choice questions, one incident evaluates **Debugging Diagnosis (Stage 1)**, **Code Fix Implementation (Stage 2)**, **Complexity & Trade-off Reasoning (Stage 3)**, and **PR Code Review (Stage 4)**.
3. **Psychological Safety via Learner-Controlled Publishing:** When a learner logs in, their stages and competency profile start clean at `0`. All work in the Sandbox remains a **private draft** until they complete all 4 stages, pick their best attempt for each stage, and explicitly click **Publish Solved Problem**.
4. **Adversarial Mutation Testing (Anti-Hardcoding):** Passing unit tests isn't enough—ProofBoard injects **broken mutant implementations** into the learner's test assertions to verify they didn't hardcode return values (`if (input === X) return Y`).
5. **Multi-Signal Integrity + Human-in-the-Loop Appeals:** We never auto-ban a student based on a single metric. An attempt is only `FLAGGED` when **multiple risk signals** align (e.g., high paste burst + zero test runs + shallow explanation), and the learner can submit an **Appeal** to the **Reviewer Console**.
6. **Dual-Track Identity & 4-Layer Consent Guard:** Both sides of the marketplace are verified: **Track A** verifies the learner's Student ID (`VERIFIED`), and **Track B** verifies the NxtMove Recruiter (`APPROVED`) via corporate domain check, **6-Digit Email OTP**, and **WebAuthn MFA Passkey**—with **Instant Token Revocation**.
7. **Role-Scoped Read-Only Transparency:** Learners and Recruiters can inspect the **Reviewer Console** in **Read-Only Audit Mode** for transparency, while only authorized Reviewers/Demo Admins can execute verification approvals, appeal overrides, or recruiter suspensions.

---

## 4. Complete 8-Minute Presentation Script & Live Demo Choreography

### Minute 0:00 – 1:00 | Part 1: The Hook & Problem Definition
*(Screen: Start on the **ProofBoard Login Screen** showing the 3 role cards: `Learner`, `Recruiter`, `Demo User`)*

> **Speaker Script:**
> "Good morning/afternoon judges. Early-career engineering hiring today suffers from a massive trust gap.
>
> Students spend months grinding gamified coding streaks and memorizing toy puzzles, while recruiters are overwhelmed by AI-generated resumes and inflated test scores they cannot verify. The biggest losers in this system are genuinely skilled engineers from Tier-2 and Tier-3 colleges who have real debugging and problem-solving talent, but get filtered out by resume keywords.
>
> We built **ProofBoard (Samartha)** for **NxtMove**—an **anti-gamified, evidence-backed engineering competency platform**. Instead of asking *'How many daily streaks does this student have?'*, ProofBoard proves *'Can this engineer diagnose a production bug, write a clean code fix that survives adversarial mutation testing, justify system trade-offs, and review a pull request?'*"

---

### Minute 1:00 – 3:15 | Part 2: Fresh Learner & Recruiter Zero-Trust Onboarding
*(Targets: Requirement Fulfilment [5 pts], Innovation [5 pts], Usability [3 pts])*

**[Demo Action 1: On the Login Screen, click `Learner`, enter name/email, and click Sign In]**
> **Speaker Script:**
> "Let's start by logging in as a brand-new **Learner**.
> Notice three immediate design decisions:
> 1. **Zero Gamification:** There are no leaderboards, no XP bars, and no streak counters.
> 2. **Clean Slate & Verification Gate:** A new learner starts as **Unverified** with all 4 stages marked *Not started* and their Competency Profile completely empty at `0/100`. If they try to submit an official scored attempt before verifying their identity, the **Track A Verification Gate** intercepts them.
> 3. **Read-Only Transparency:** Notice in the header that a Learner only sees **Learner** and a **Read-Only Reviewer view**—they cannot tamper with verification queues or recruiter controls."

**[Demo Action 2: Click `Verify Student ID` tab -> Click `Instant Demo Verification (1-Click)` -> Return to `Task Sandbox`]**
> **Speaker Script:**
> "Let's verify our Student ID under **Track A**—which validates institutional domains like `.ac.in` or `.edu`, roll number format, and ID artifact hashes.
>
> Now inside the **Task Sandbox**, our assessment is structured as a **4-Stage Cohesive Production Incident**:
> - **Stage 1 (Bug Diagnosis):** Identifying the root cause from production symptoms.
> - **Stage 2 (Code Fix):** Writing the actual JavaScript fix, running visible and hidden unit tests, and surviving **Adversarial Mutation Testing** so hardcoded answers fail. Learners can also request a **Conceptual Hint** in 5 Indian languages (*English, Hindi, Telugu, Tamil, Kannada*) that explains the concept with **zero code leakage**.
> - **Stage 3 (Complexity & System Reasoning):** Explaining time/space complexity and architectural edge cases.
> - **Stage 4 (PR Review & Critique):** Auditing a flawed pull request."

**[Demo Action 3: Point to the `Publish Solved Problem to Profile & Recruiter` panel in the Task Sandbox]**
> **Speaker Script:**
> "Here is one of our favorite learner-centric features: **Learner-Controlled Safe Publication**.
> While a learner is working through Stages 1 to 4, every submission is stored privately as a **Sandbox Draft**. If a student makes a mistake or wants to retry Stage 2 to get a cleaner code diff, recruiters **never** see their rough drafts.
> Only after completing all 4 stages can the learner select their desired attempt for each stage and click **Publish Solved Problem**—which simultaneously populates their **Competency Profile** and unlocks recruiter visibility."

---

### Minute 3:15 – 5:15 | Part 3: Live Recruiter Verification (OTP + MFA) & Demo Showcase Mode
*(Targets: Prototype / Technical Achievement [10 pts], Solution Effectiveness [8 pts])*

**[Demo Action 4: Click `Sign Out` -> Select `Demo User` on the Login Screen -> Sign In]**
> **Speaker Script:**
> "Now let's switch to **Demo User Mode**, which loads our full multi-candidate engineering cohort (`Asha Verma`, `Rohan Nair`, `Meera Iyer`, `Dev Kulkarni`, `Kabir Sharma`) and unlocks all **4 Personas**: **Learner**, **Recruiter**, **Reviewer**, and **Demo Control Center**."

**[Demo Action 5: Click `Verify Recruiter` tab (or switch to `Recruiter` -> `Verify Recruiter`)]**
> **Speaker Script:**
> "Before any recruiter at NxtMove can view a single student profile, they must pass **Track B Corporate Verification**. We didn't leave security safeguards as theoretical placeholders—we built them live into the prototype:
> 1. First, our **Domain Validator** blocks personal emails like `@gmail.com` or `@yahoo.com`.
> 2. Second, the recruiter must click **Send 6-Digit OTP & Magic Link** to verify corporate mailbox ownership, and complete a **WebAuthn MFA Passkey** challenge, which issues a cryptographic session token (`tok_nxt_...`).
> 3. Third, look at the **Instant Recruiter Suspension & Token Revocation** control: if an admin clicks **Revoke Token & Suspend**, the recruiter's session token is immediately invalidated and visible learner profiles drop to **zero** in real time."

**[Demo Action 6: Switch to `Recruiter` persona -> `Talent Search & Filters` -> Click `Inspect Code Diff & Tests` on `Asha Verma`]**
> **Speaker Script:**
> "Once the recruiter is `APPROVED`, our **4-Layer Consent Guard** returns only candidates who are (1) Track A Verified, (2) have Published their 4-stage assessment, (3) have consented to share with NxtMove, and (4) have no disqualified attempts.
>
> Look at how **Solution Effectiveness** works for the recruiter: instead of guessing from a resume, the recruiter clicks **Inspect Code Diff & Tests** on **Asha Verma** and in **10 seconds** sees:
> - Her **Unified Git-Style Code Diff** (`-` buggy lines removed, `+` fix added),
> - Her **Visible, Hidden, and Adversarial Mutation Test Matrix**,
> - Her **Stage-by-Stage Rubric Breakdown (`v2.4.0`)**, and
> - Her **Cryptographic Evidence Hash (`ev_sha256_...`)**."

---

### Minute 5:15 – 6:45 | Part 4: Anti-Cheat Telemetry, Appeals & Reviewer Governance
*(Targets: Validation / Evidence [3 pts], Innovation [5 pts])*

**[Demo Action 7: Switch to `Reviewer` persona -> `Reviewer Console`]**
> **Speaker Script:**
> "What happens when someone tries to game the system by pasting an AI-generated solution?
> Let's open the **Reviewer Console** and inspect **Rohan Nair's** flagged attempt (`att-shortcut-case-a`).
>
> Instead of an unfair black-box AI detector, our **Multi-Signal Integrity Engine** flags an attempt only when multiple behavioral indicators align—here, Rohan pasted **420 characters in 14 seconds**, ran **zero pre-submit tests**, and wrote a shallow 4-word explanation.
>
> Crucially, ProofBoard sets the status to **`FLAGGED`**, not auto-banned. If a genuine student was falsely flagged, they can file a **Fairness Appeal**, and a human Reviewer can inspect the code diff and telemetry side-by-side to either **Approve Appeal (Clear Flag)** or **Reject Appeal (Disqualify)**—with every decision recorded in our **Global Audit Log**."

---

### Minute 6:45 – 7:45 | Part 5: Scalability, Architecture & Closing Summary
*(Targets: Scalability / Applicability [3 pts], Pitch & Communication [1 pt])*

**[Demo Action 8: Click `Demo` persona -> `Demo Control Center` showing the Architecture Blueprint & Risk Table]**
> **Speaker Script:**
> "Finally, in our **Demo Control Center**, judges can trigger any end-to-end state transition in one click and inspect our production **Firebase Firestore Security Rules** (`firestore.rules`) and **System Architecture**.
>
> Why does ProofBoard scale effortlessly for NxtMove?
> 1. **Pluggable Task Catalog & Versioned Rubrics:** New engineering incidents (Payments, Rate Limiting, Concurrency, SQL, or Frontend) are added as declarative JSON Task Bundles stamped with a `rubricVersion` (`v2.4.0`), so historical scores never break.
> 2. **Zero-Trust Security Enforcement:** Both our repository layer and `firestore.rules` enforce Track A Learner Verification, Learner Publish State, Explicit Consent, and Track B Recruiter Approval + Non-Suspension at the query level.
>
> **In conclusion:** ProofBoard eliminates resume filtering and leaderboard gaming—giving learners a safe, fair place to prove what they can build, and giving NxtMove recruiters verifiable engineering evidence in seconds. Thank you, and we welcome your questions!"

---

## 5. Pre-Demo Preparation Checklist (30 Seconds Before You Present)

1. **Start on the Login Screen** (click `Sign Out` in the top-right header before your turn begins so the judges see the 3 clean login options: `Learner`, `Recruiter`, `Demo User`).
2. **Follow the 2-Step Demo Flow**:
   - **Step A (90 seconds):** Log in as **Learner** first -> show that stages and profile start at `0` and `Unverified` -> verify in 1 click -> point out the 4 stages and the **Publish Solved Problem** gate -> Sign Out.
   - **Step B (3.5 minutes):** Log in as **Demo User** -> show the **Recruiter OTP + MFA + Suspension** controls -> show **Asha Verma's Evidence Drawer (Code Diff + Mutation Tests)** -> show **Rohan Nair's Flagged Telemetry & Appeal** in the Reviewer Console -> finish on **Demo Control Center**.

---

## 6. High-Impact Q&A / Technical Defence Cheat Sheet (Weight: 2 Points)

### Q1: "How do you prevent a student from just asking ChatGPT/Claude for the code and typing it in slowly to bypass paste detection?"
- **Winning Answer:** "That is exactly why our task is a **4-Stage Cohesive Incident**, not a standalone coding box. Even if a student manually re-types Stage 2 code, they still have to:
  1. Diagnose the exact production symptom in **Stage 1**,
  2. Justify the time/space complexity and architectural trade-offs of *their specific implementation* in **Stage 3**, and
  3. Catch concurrency/regression bugs in a related pull request in **Stage 4**.
  Furthermore, when a NxtMove recruiter opens the **Evidence Drawer**, they see the student's Stage 2 code diff right next to their Stage 3 & 4 reasoning—making any mismatch between code sophistication and engineering explanation immediately obvious."

### Q2: "Why did you add a manual 'Publish Solved Problem' step instead of updating the profile automatically after each stage?"
- **Winning Answer:** "Real engineering involves experimentation and failed test runs. If every failed trial immediately lowered a learner's recruiter-facing profile score, learners would be afraid to experiment—or worse, they would cheat just to avoid a bad first score. By keeping all attempts as **private Sandbox Drafts** until all 4 stages are completed and the learner explicitly selects their desired attempts and clicks **Publish**, we give learners **psychological safety** while ensuring recruiters only evaluate complete, intentional 4-stage submissions."

### Q3: "What is 'Adversarial Mutation Testing' in Stage 2, and why is it better than standard hidden test cases?"
- **Winning Answer:** "In standard coding platforms, candidates often pass tests by hardcoding edge cases (`if (amount === 100) return 90`). Our **Mutation Test Runner** flips the evaluation: it takes broken 'mutant' versions of the business logic (e.g., an off-by-one boundary mutant or a mutated tax order mutant) and verifies that the candidate's logic and test suite actively catch and kill those mutants. If a mutant survives, the candidate's score is capped and flagged."

### Q4: "Why is the Reviewer tab Read-Only when logged in as a Learner or Recruiter, and editable in Demo mode?"
- **Winning Answer:** "This enforces **Role-Based Access Control (RBAC) with Audit Transparency**. In production, a Learner or Recruiter should never be able to approve their own identity verification or clear their own anti-cheat flag—so their view of the Reviewer Console is strictly **Read-Only** (`Read-Only View` badge). However, allowing them to view the audit structure proves how fairness rules work. When logged in as the **Demo User** (or an authorized Reviewer), full administrative actions—like approving verifications, resolving appeals, or revoking a recruiter's token—are unlocked."

### Q5: "How does your system protect student privacy if a recruiter leaves their company or acts maliciously?"
- **Winning Answer:** "Every recruiter session requires a verified corporate domain, **6-Digit Email OTP**, and **WebAuthn MFA Passkey** tied to a revocable session token (`tok_nxt_...`). If a recruiter leaves their organization or violates platform policy, an admin clicks **Revoke Token & Suspend** in the Reviewer Console or Verify Recruiter page. Our `getVisibleProfiles()` Consent Guard checks `!recruiterUser.suspended` on every query, dropping their candidate visibility to **zero** instantaneously."
