import React from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { PredictCaseInput, Stage } from '../../types';

export interface PredictOutputStageProps {
  stage: Stage;
  seed: number;
  cases: PredictCaseInput[];
  answers: string[];
  onChangeAnswers: (next: string[]) => void;
  onRegenerateCases: () => void;
}

export const PredictOutputStage: React.FC<PredictOutputStageProps> = ({
  stage,
  seed,
  cases,
  answers,
  onChangeAnswers,
  onRegenerateCases,
}) => {
  const handleInput = (idx: number, val: string) => {
    const next = [...answers];
    next[idx] = val;
    onChangeAnswers(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0B1B3A]">
          <Eye className="w-4 h-4 text-[#2E6FD8]" aria-hidden="true" />
          <span>Read Reference Code &amp; Predict Output</span>
        </div>
        <button
          type="button"
          onClick={onRegenerateCases}
          className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New random inputs (seed #{seed})</span>
        </button>
      </div>

      {/* Reference snippet */}
      <div className="bg-[#0B1B3A] text-slate-100 rounded-xl p-4 font-mono text-sm overflow-x-auto border border-slate-800">
        <pre className="leading-relaxed">{stage.referenceCode}</pre>
      </div>

      {/* Generated cases */}
      <div className="space-y-3">
        {cases.map((c, idx) => (
          <div
            key={c.criterionId}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2"
          >
            <label
              htmlFor={`predict-case-${idx}`}
              className="block text-xs font-semibold text-[#0B1B3A]"
            >
              Case {idx + 1} ({c.label})
            </label>
            <div className="font-mono text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-[#0B1B3A] overflow-x-auto">
              {c.inputDisplay}
            </div>
            <div className="pt-1">
              <input
                id={`predict-case-${idx}`}
                type="text"
                value={answers[idx] || ''}
                onChange={(e) => handleInput(idx, e.target.value)}
                placeholder="Type exact return value (e.g. 25 or 4.5)"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-[#0B1B3A] placeholder:text-slate-400 focus:border-[#2E6FD8]"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        Note: Practice mode is disabled on code reading stages so expected
        outputs are not revealed prior to submission. Each retry generates fresh
        random inputs.
      </p>
    </div>
  );
};
