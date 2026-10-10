import {
  GeneratorName,
  PredictCaseInput,
  Stage,
  TestExecutionResult,
} from '../types';

/**
 * Deterministic seeded PRNG (Mulberry32)
 * Same seed always produces the exact same sequence of numbers in [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Named input generators for hidden tests and predict_output stages.
 * Returns an array of argument arrays (each test calls fn(...args)).
 */
export function generateInputs(
  generatorName: GeneratorName,
  seed: number,
  count: number = 10,
  mode: 'hidden' | 'predict' = 'hidden'
): unknown[][] {
  const rand = createSeededRandom(seed);

  const randInt = (min: number, max: number) =>
    Math.floor(rand() * (max - min + 1)) + min;

  if (generatorName === 'randomCarts') {
    if (mode === 'predict') {
      // 2 readable carts for code reading
      const cases: unknown[][] = [];
      for (let c = 0; c < count; c++) {
        const len = c === 0 ? randInt(2, 3) : randInt(1, 3);
        const cart: { price: number; qty: number }[] = [];
        for (let i = 0; i < len; i++) {
          const useDecimal = rand() > 0.5;
          const price = useDecimal
            ? Math.round((randInt(5, 50) + (rand() > 0.5 ? 0.5 : 0.25)) * 100) / 100
            : randInt(5, 40);
          const qty = randInt(1, 4);
          cart.push({ price, qty });
        }
        cases.push([cart]);
      }
      return cases;
    }

    // Hidden tests: 10 carts, always include empty cart and single-item cart
    const inputs: unknown[][] = [];
    // Edge case 1: empty cart
    inputs.push([[]]);
    // Edge case 2: single-item cart
    inputs.push([
      [
        {
          price: Math.round((0.5 + rand() * 499.5) * 100) / 100,
          qty: randInt(1, 9),
        },
      ],
    ]);

    for (let idx = 2; idx < count; idx++) {
      const itemCount = randInt(0, 6);
      const cart: { price: number; qty: number }[] = [];
      for (let j = 0; j < itemCount; j++) {
        const rawPrice = 0.5 + rand() * 499.5;
        const price = Math.round(rawPrice * 100) / 100;
        const qty = randInt(1, 9);
        cart.push({ price, qty });
      }
      inputs.push([cart]);
    }
    return inputs;
  }

  if (generatorName === 'randomRatingLists') {
    if (mode === 'predict') {
      const cases: unknown[][] = [];
      // Case 1: 2 to 4 ratings
      const len1 = randInt(2, 4);
      const list1: number[] = [];
      for (let i = 0; i < len1; i++) list1.push(randInt(1, 5));
      cases.push([list1]);

      // Case 2: either empty (25% chance) or 2-5 ratings
      if (rand() < 0.25) {
        cases.push([[]]);
      } else {
        const len2 = randInt(2, 5);
        const list2: number[] = [];
        for (let i = 0; i < len2; i++) list2.push(randInt(1, 5));
        cases.push([list2]);
      }
      return cases;
    }

    // Hidden tests: 10 rating lists, always include empty list and 1-item list
    const inputs: unknown[][] = [];
    inputs.push([[]]);
    inputs.push([[randInt(1, 5)]]);
    for (let idx = 2; idx < count; idx++) {
      const len = randInt(0, 10);
      const list: number[] = [];
      for (let j = 0; j < len; j++) {
        list.push(randInt(1, 5));
      }
      inputs.push([list]);
    }
    return inputs;
  }

  if (generatorName === 'randomUsernames') {
    const alphaLower = 'abcdefghijklmnopqrstuvwxyz';
    const alphaUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const validChars = alphaLower + alphaUpper + digits + '_';
    const invalidChars = '- !@#$%.';

    const makeStr = (len: number, pool: string, firstPool?: string) => {
      if (len <= 0) return '';
      let out = (firstPool || pool)[randInt(0, (firstPool || pool).length - 1)];
      for (let i = 1; i < len; i++) {
        out += pool[randInt(0, pool.length - 1)];
      }
      return out;
    };

    // Always include boundary lengths 2, 3, 15, 16, empty, leading digit, uppercase, symbol
    const inputs: unknown[][] = [
      [makeStr(2, validChars, alphaLower)], // boundary length 2 (invalid)
      [makeStr(3, validChars, alphaUpper)], // boundary length 3 with uppercase (valid)
      [makeStr(15, validChars, alphaLower + '_')], // boundary length 15 (valid)
      [makeStr(16, validChars, alphaLower)], // boundary length 16 (invalid)
      [''], // empty (invalid)
      [digits[randInt(0, 9)] + makeStr(randInt(4, 8), validChars)], // leading digit (invalid)
      [makeStr(randInt(4, 10), alphaUpper + '_') + digits[randInt(0, 9)]], // uppercase + underscore + digit (valid)
      [
        makeStr(randInt(3, 6), alphaLower) +
          invalidChars[randInt(0, invalidChars.length - 1)] +
          makeStr(2, alphaLower),
      ], // symbol/space (invalid)
    ];

    while (inputs.length < count) {
      const len = randInt(0, 20);
      const useInvalid = rand() < 0.35;
      const pool = useInvalid ? validChars + invalidChars : validChars;
      inputs.push([makeStr(len, pool)]);
    }

    return inputs.slice(0, count);
  }

  return [];
}

export interface RunnerOutput {
  timedOut: boolean;
  syntaxOrRuntimeError?: string;
  testResults: TestExecutionResult[];
}

/**
 * Runs learner code and tests inside a Web Worker created from a Blob.
 * Terminates the worker after 2000 ms. Never uses eval on the main thread.
 */
export async function runDebugCodeInWorker(
  stage: Stage,
  learnerCode: string,
  includeHidden: boolean,
  seed: number
): Promise<RunnerOutput> {
  const visibleTests = stage.visibleTests || [];
  const hiddenInputs =
    includeHidden && stage.generatorName
      ? generateInputs(stage.generatorName, seed, 10, 'hidden')
      : [];

  const workerPayload = {
    functionName: stage.functionName || '',
    learnerCode,
    referenceCode: stage.referenceCode || '',
    visibleTests: visibleTests.map((t) => ({
      id: t.id,
      name: t.name,
      input: t.input,
      expected: t.expected,
      criterionId: t.criterionId,
      hidden: false,
    })),
    hiddenInputs: hiddenInputs.map((input, idx) => ({
      id: `hid-${stage.id}-${idx + 1}`,
      name: `Hidden test ${idx + 1}`,
      input,
      criterionId: stage.hiddenCriterionId || 'hidden',
      hidden: true,
    })),
  };

  const workerScript = `
    function deepEqual(a, b) {
      if (a === b) return true;
      if (typeof a === 'number' && typeof b === 'number') {
        if (Number.isNaN(a) && Number.isNaN(b)) return false;
        return Math.abs(a - b) < 1e-9;
      }
      if (typeof a !== typeof b || a === null || b === null) return false;
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
      }
      if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const k of keysA) {
          if (!deepEqual(a[k], b[k])) return false;
        }
        return true;
      }
      return false;
    }

    function friendlyError(err) {
      if (!err) return 'Unknown error while running your code.';
      const msg = err.message || String(err);
      if (err.name === 'SyntaxError') {
        return 'Syntax error in your code: ' + msg + '. Check brackets, parentheses, and quotes.';
      }
      if (err.name === 'ReferenceError') {
        return 'Name error: ' + msg + '. Check that every variable name is spelled right.';
      }
      if (err.name === 'TypeError') {
        return 'Runtime error: ' + msg + '. Check for undefined items or out-of-bounds loop indices.';
      }
      return 'Error: ' + msg;
    }

    self.onmessage = function(e) {
      const { functionName, learnerCode, referenceCode, visibleTests, hiddenInputs } = e.data;
      let learnerFn;
      let refFn;

      try {
        const factory = new Function(learnerCode + '\\n; return typeof ' + functionName + ' !== "undefined" ? ' + functionName + ' : null;');
        learnerFn = factory();
        if (typeof learnerFn !== 'function') {
          self.postMessage({
            syntaxOrRuntimeError: 'Could not find function "' + functionName + '". Please keep the function name unchanged.',
            testResults: []
          });
          return;
        }
      } catch (err) {
        self.postMessage({
          syntaxOrRuntimeError: friendlyError(err),
          testResults: []
        });
        return;
      }

      try {
        const refFactory = new Function(referenceCode + '\\n; return ' + functionName + ';');
        refFn = refFactory();
      } catch (err) {
        self.postMessage({
          syntaxOrRuntimeError: 'Internal reference error: ' + String(err),
          testResults: []
        });
        return;
      }

      const results = [];

      // 1. Run visible tests
      for (const test of visibleTests) {
        try {
          const clonedInput = JSON.parse(JSON.stringify(test.input));
          const actual = learnerFn.apply(null, clonedInput);
          const passed = deepEqual(actual, test.expected);
          results.push({
            id: test.id,
            name: test.name,
            hidden: false,
            passed,
            criterionId: test.criterionId,
            inputDisplay: JSON.stringify(test.input[0]),
            expectedDisplay: JSON.stringify(test.expected),
            actualDisplay: actual === undefined ? 'undefined' : JSON.stringify(actual),
            error: passed ? undefined : 'Returned ' + (actual === undefined ? 'undefined' : JSON.stringify(actual)) + ' instead of ' + JSON.stringify(test.expected)
          });
        } catch (err) {
          results.push({
            id: test.id,
            name: test.name,
            hidden: false,
            passed: false,
            criterionId: test.criterionId,
            inputDisplay: JSON.stringify(test.input[0]),
            expectedDisplay: JSON.stringify(test.expected),
            actualDisplay: 'Error',
            error: friendlyError(err)
          });
        }
      }

      // 2. Run hidden tests against reference solution
      for (const hTest of hiddenInputs) {
        try {
          const refInput = JSON.parse(JSON.stringify(hTest.input));
          const expected = refFn.apply(null, refInput);
          const learnerInput = JSON.parse(JSON.stringify(hTest.input));
          const actual = learnerFn.apply(null, learnerInput);
          const passed = deepEqual(actual, expected);
          results.push({
            id: hTest.id,
            name: hTest.name,
            hidden: true,
            passed,
            criterionId: hTest.criterionId,
            error: passed ? undefined : 'Did not match reference output on unseen input'
          });
        } catch (err) {
          results.push({
            id: hTest.id,
            name: hTest.name,
            hidden: true,
            passed: false,
            criterionId: hTest.criterionId,
            error: friendlyError(err)
          });
        }
      }

      self.postMessage({
        testResults: results
      });
    };
  `;

  return new Promise<RunnerOutput>((resolve) => {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve({
          timedOut: true,
          syntaxOrRuntimeError: 'Your code took too long and was stopped.',
          testResults: [],
        });
      }
    }, 2000);

    worker.onmessage = (event) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve({
          timedOut: false,
          syntaxOrRuntimeError: event.data.syntaxOrRuntimeError,
          testResults: event.data.testResults || [],
        });
      }
    };

    worker.onerror = (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve({
          timedOut: false,
          syntaxOrRuntimeError:
            err.message || 'Syntax or runtime error in your code.',
          testResults: [],
        });
      }
    };

    worker.postMessage(workerPayload);
  });
}

/**
 * Generates the 2 predict_output test cases from a seed and evaluates the reference
 * solution inside a Blob Web Worker so expected outputs are always worker-computed.
 */
export async function generatePredictCasesInWorker(
  stage: Stage,
  seed: number
): Promise<PredictCaseInput[]> {
  if (!stage.generatorName || !stage.referenceCode || !stage.functionName) {
    return [];
  }

  const rawInputs = generateInputs(stage.generatorName, seed, 2, 'predict');
  const workerScript = `
    self.onmessage = function(e) {
      const { functionName, referenceCode, rawInputs } = e.data;
      try {
        const refFactory = new Function(referenceCode + '\\n; return ' + functionName + ';');
        const refFn = refFactory();
        const outputs = rawInputs.map(args => refFn.apply(null, JSON.parse(JSON.stringify(args))));
        self.postMessage({ outputs });
      } catch (err) {
        self.postMessage({ outputs: [] });
      }
    };
  `;

  return new Promise<PredictCaseInput[]>((resolve) => {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve([]);
      }
    }, 2000);

    worker.onmessage = (event) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        const outputs: unknown[] = event.data.outputs || [];
        const cases: PredictCaseInput[] = rawInputs.map((args, idx) => {
          const criterion = stage.rubric[idx] || {
            id: `case_${idx + 1}`,
            label: `Case ${idx + 1} correct`,
          };
          return {
            caseIndex: idx,
            criterionId: criterion.id,
            label: criterion.label,
            inputArgs: args,
            inputDisplay: `${stage.functionName}(${JSON.stringify(args[0])})`,
            expectedOutput: outputs[idx],
          };
        });
        resolve(cases);
      }
    };

    worker.postMessage({
      functionName: stage.functionName,
      referenceCode: stage.referenceCode,
      rawInputs,
    });
  });
}
