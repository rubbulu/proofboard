import { Bundle, CompetencyKey } from '../types';

export const STARTER_BUGGY_CART_CODE = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price;
  }
  return total;
}`;

export const CLEAN_VERIFIED_CART_CODE = `function calculateTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].qty;
  }
  return Math.round(total * 100) / 100;
}`;

export const HARDCODED_SHORTCUT_CART_CODE = `function calculateTotal(items) {
  if (items.length === 0) return 0;
  if (items[0] && items[0].price === 10) return 25;
  if (items[0] && items[0].price === 19.99) return 59.97;
  return 25;
}`;

export const CLEAN_VERIFIED_EXPLAIN_BACK = `1. Start with a running total set to 0 (if the cart is empty, return 0 immediately).
2. Loop through every item in the cart from index 0 to items.length - 1.
3. For each item, multiply item.price by item.qty and add that subtotal to the running total.
4. Round the final total to 2 decimals using Math.round(total * 100) / 100 and return the result so floating-point precision issues never corrupt the checkout bill.`;

export const COMPETENCY_META: Record<
  CompetencyKey,
  { label: string; displayTitle: string; shortLabel: string; description: string }
> = {
  debugging: {
    label: 'Debugging',
    displayTitle: 'Debugging & Edge-Case Handling',
    shortLabel: 'Debugging',
    description:
      'Locating off-by-one defects, missing quantity multipliers, and floating-point rounding bugs verified against 3 visible + 10 hidden fuzz tests.',
  },
  code_reading: {
    label: 'Bug Diagnosis & Code Reading',
    displayTitle: 'Bug Diagnosis & Trace Analysis',
    shortLabel: 'Bug Diagnosis',
    description:
      'Inspecting failing stack traces and diagnosing root-cause defects before modifying production checkout logic.',
  },
  algorithmic_thinking: {
    label: 'Algorithmic Thinking',
    displayTitle: 'Algorithmic Step Sequencing',
    shortLabel: 'Step Sequencing',
    description:
      'Ordering initialization, empty-cart guard clauses, loop accumulation, and final rounding in valid precedence order.',
  },
  communication: {
    label: 'Communication & Explain-Back',
    displayTitle: 'Written Pseudocode & Explain-Back',
    shortLabel: 'Explain-Back',
    description:
      'Articulating the fix in structured pseudocode verified by deterministic concept rules and opt-in AI semantic second opinion.',
  },
};

export const BUNDLES: Bundle[] = [
  {
    id: 'bundle-cart-total',
    title: 'Fix calculateTotal(items) in Checkout Service',
    role: 'Junior Backend Engineer',
    description:
      'Guided 4-stage proof-of-skill assessment: diagnose the failing checkout test case, implement and verify the code fix against 13 tests, sequence the algorithm steps, and write the explain-back pseudocode.',
    version: 'v1',
    stages: [
      {
        id: 'cart-stage-1-diagnosis',
        stageNumber: 1,
        type: 'bug_diagnosis',
        competency: 'code_reading',
        title: 'Stage 1: Bug Diagnosis (Inspect failing test case)',
        shortTitle: '1. Bug Diagnosis',
        instructions:
          'Inspect the failing production test case and starter implementation of calculateTotal(items) in the Checkout Service. Identify the defects causing the runtime crash and incorrect cart totals.',
        rubricVersion: 'v1',
        functionName: 'calculateTotal',
        starterCode: STARTER_BUGGY_CART_CODE,
        failingCaseExample: {
          call: 'calculateTotal([{ price: 10, qty: 2 }, { price: 5, qty: 1 }])',
          expected: '25 (and 59.97 for [{ price: 19.99, qty: 3 }])',
          actualBuggyOutput:
            'TypeError: Cannot read properties of undefined (reading "price") at i = 2 (also ignores item.qty and 2-decimal rounding)',
          bugOptions: [
            {
              id: 'diag-opt-correct',
              text: 'Loop condition uses i <= items.length (out-of-bounds), adds price without multiplying by qty, and omits 2-decimal rounding.',
              isCorrect: true,
              explanation:
                'Exact match: i <= items.length reads items[items.length] which is undefined, items[i].qty is never multiplied, and floating-point totals are not rounded to 2 decimals.',
            },
            {
              id: 'diag-opt-wrong-1',
              text: 'The function should return a string formatted with a currency symbol instead of a number.',
              isCorrect: false,
              explanation:
                'calculateTotal(items) must return a numeric value rounded to 2 decimals, not a formatted string.',
            },
            {
              id: 'diag-opt-wrong-2',
              text: 'JavaScript arrays are 1-indexed, so the loop should start at let i = 1.',
              isCorrect: false,
              explanation:
                'JavaScript arrays are 0-indexed; starting at 1 would skip the first cart item.',
            },
          ],
        },
        rubric: [
          {
            id: 'diag_root_cause',
            label: 'Identifies off-by-one boundary & missing qty multiplier',
            weight: 100,
            percentageLabel: '100%',
            description:
              'Pinpoints why the starter loop crashes on items[items.length] and miscalculates multi-quantity and decimal carts.',
          },
        ],
      },
      {
        id: 'cart-stage-1-debug',
        stageNumber: 2,
        type: 'debug_code',
        competency: 'debugging',
        title: 'Stage 2: Code Fix & Test Runner',
        shortTitle: '2. Code Fix & Runner',
        instructions:
          'Fix calculateTotal(items) so it returns the sum of price * qty rounded to 2 decimals, and 0 for an empty cart. Run Practice Tests to check the 3 visible cases, then Submit for Scoring to run all 3 visible + 10 randomized unseen boundary tests.',
        rubricVersion: 'v1',
        functionName: 'calculateTotal',
        starterCode: STARTER_BUGGY_CART_CODE,
        referenceCode: `function calculateTotal(items){ const t = items.reduce((s,i)=>s+i.price*i.qty,0); return Math.round(t*100)/100; }`,
        generatorName: 'randomCarts',
        hiddenCriterionId: 'hidden',
        visibleTests: [
          {
            id: 'vis-cart-1',
            name: 'Handles normal multi-item cart',
            input: [
              [
                { price: 10, qty: 2 },
                { price: 5, qty: 1 },
              ],
            ],
            expected: 25,
            criterionId: 'normal',
          },
          {
            id: 'vis-cart-2',
            name: 'Empty cart returns 0',
            input: [[]],
            expected: 0,
            criterionId: 'empty',
          },
          {
            id: 'vis-cart-3',
            name: 'Decimals rounded to 2 places',
            input: [[{ price: 19.99, qty: 3 }]],
            expected: 59.97,
            criterionId: 'decimals',
          },
        ],
        rubric: [
          {
            id: 'normal',
            label: 'Handles normal carts',
            weight: 3,
            percentageLabel: '30%',
            description:
              'Multiplies price by qty and sums accurately across standard multi-item carts.',
          },
          {
            id: 'empty',
            label: 'Empty cart',
            weight: 2,
            percentageLabel: '20%',
            description: 'Returns 0 safely when the cart array is empty.',
          },
          {
            id: 'decimals',
            label: 'Decimals',
            weight: 2,
            percentageLabel: '20%',
            description:
              'Rounds floating-point totals to 2 decimal places (e.g. 19.99 * 3 -> 59.97).',
          },
          {
            id: 'hidden',
            label: 'Hidden boundary carts',
            weight: 3,
            percentageLabel: '30%',
            description:
              'Passes 10 randomized unseen boundary carts executed in the Web Worker sandbox.',
          },
        ],
      },
      {
        id: 'cart-stage-3-arrange',
        stageNumber: 3,
        type: 'arrange_steps',
        competency: 'algorithmic_thinking',
        title: 'Stage 3: Step Sequencing (Order the logical steps)',
        shortTitle: '3. Step Sequencing',
        instructions:
          'Order the logical steps of calculateTotal(items) using drag-and-drop or the Up/Down keyboard buttons. Partial credit is computed deterministically using step precedence rules.',
        rubricVersion: 'v1',
        steps: [
          'Return the total rounded to 2 decimals',
          'If the cart is empty, return 0',
          'For each item, add price times quantity to the total',
          'Start with total = 0',
        ],
        rubric: [
          {
            id: 'init_before_loop',
            label: 'Starts the total before adding',
            weight: 40,
            percentageLabel: '40%',
            description:
              '"Start with total = 0" is placed before "For each item, add price times quantity to the total".',
            pairs: [{ before: 3, after: 2 }],
          },
          {
            id: 'empty_before_loop',
            label: 'Handles empty cart before the loop',
            weight: 30,
            percentageLabel: '30%',
            description:
              '"If the cart is empty, return 0" is checked before iterating through items.',
            pairs: [{ before: 1, after: 2 }],
          },
          {
            id: 'return_at_end',
            label: 'Returns only at the end',
            weight: 30,
            percentageLabel: '30%',
            description:
              'Both initializing the total and looping through items occur before returning the rounded total.',
            pairs: [
              { before: 2, after: 0 },
              { before: 3, after: 0 },
            ],
          },
        ],
      },
      {
        id: 'cart-stage-4-pseudocode',
        stageNumber: 4,
        type: 'pseudocode',
        competency: 'communication',
        title: 'Stage 4: Written Pseudocode & Explain-Back',
        shortTitle: '4. Pseudocode & Explain-Back',
        instructions:
          'Write your pseudocode and plain-language explain-back describing how your calculateTotal(items) fix works and why rounding is required. Evaluated by deterministic concept matching rules plus optional AI semantic second opinion.',
        rubricVersion: 'v1',
        minLines: 3,
        rubric: [
          {
            id: 'pc_start_zero',
            label: 'Starts running total at 0',
            weight: 25,
            percentageLabel: '25%',
            description:
              'Initializes running total/sum to 0 (and handles empty cart).',
            groups: [
              ['total', 'sum', 'running'],
              ['0', 'zero', 'start', 'empty'],
            ],
          },
          {
            id: 'pc_loop_items',
            label: 'Loops through cart',
            weight: 25,
            percentageLabel: '25%',
            description:
              'Iterates through every item in the cart array.',
            groups: [
              ['each', 'every', 'loop', 'for', 'repeat', 'go through', 'iterate'],
              ['item', 'items', 'product', 'cart'],
            ],
          },
          {
            id: 'pc_multiply',
            label: 'Multiplies price by qty',
            weight: 25,
            percentageLabel: '25%',
            description:
              'Multiplies item.price by item.qty (or quantity) and adds to total.',
            groups: [
              ['price'],
              ['qty', 'quantity', 'times', 'multiply', '*'],
            ],
          },
          {
            id: 'pc_round_return',
            label: 'Rounds to 2 decimals',
            weight: 25,
            percentageLabel: '25%',
            description:
              'Rounds the final total to 2 decimal places and returns it.',
            groups: [
              ['round', '2 decimal', 'two decimal', '100'],
              ['return', 'output', 'result', 'give back'],
            ],
          },
        ],
      },
    ],
  },
];

export function getBundleById(bundleId: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === bundleId) || BUNDLES[0];
}

export function getStageById(
  bundleId: string,
  stageId: string
): { bundle: Bundle; stage: Bundle['stages'][0]; index: number } | undefined {
  const bundle = getBundleById(bundleId);
  if (!bundle) return undefined;
  const index = bundle.stages.findIndex((s) => s.id === stageId);
  if (index === -1) {
    return { bundle, stage: bundle.stages[0], index: 0 };
  }
  return { bundle, stage: bundle.stages[index], index };
}
