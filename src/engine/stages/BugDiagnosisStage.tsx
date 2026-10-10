import React from 'react';
import { Bug, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';
import { Stage } from '../../types';

export interface BugDiagnosisStageProps {
  stage: Stage;
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
}

export const BugDiagnosisStage: React.FC<BugDiagnosisStageProps> = ({
  stage,
  selectedOptionId,
  onSelectOption,
}) => {
  const example = stage.failingCaseExample;
  if (!example) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
          <Bug className="w-4 h-4 text-[#C8102E]" aria-hidden="true" />
          <span>Inspect Failing Checkout Test Case &amp; Buggy Starter Code</span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Checkout Service · v1
        </span>
      </div>

      {/* Failing Test Case Trace Box */}
      <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#C8102E]">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Failing Test Case in CI Pipeline</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-white border border-red-200 text-[#0B1B3A]">
            <div className="text-[11px] font-sans font-semibold text-slate-500">
              Input Call
            </div>
            <div className="mt-0.5 break-all">{example.call}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-red-200 text-[#0B1B3A]">
            <div className="text-[11px] font-sans font-semibold text-slate-500">
              Expected Return
            </div>
            <div className="mt-0.5 text-[#1E8E5A] font-semibold">
              {example.expected}
            </div>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0B1B3A] text-red-300 font-mono text-xs">
          <span className="text-slate-400">Actual Output: </span>
          {example.actualBuggyOutput}
        </div>
      </div>

      {/* Buggy Starter Code Inspection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Terminal className="w-3.5 h-3.5 text-[#2E6FD8]" aria-hidden="true" />
          <span>Buggy Starter Implementation (checkoutService.js)</span>
        </div>
        <pre className="p-4 rounded-xl bg-[#0B1B3A] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          {stage.starterCode}
        </pre>
      </div>

      {/* Root-Cause Diagnosis Options */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-[#0B1B3A]">
          Select the exact root-cause diagnosis to unlock full Stage 1 credit:
        </h4>
        <div className="space-y-2" role="radiogroup" aria-label="Bug diagnosis options">
          {example.bugOptions.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <label
                key={opt.id}
                onClick={() => onSelectOption(opt.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'border-[#2E6FD8] bg-blue-50/60 text-[#0B1B3A] font-medium'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="bug-diagnosis-option"
                  checked={isSelected}
                  onChange={() => onSelectOption(opt.id)}
                  className="mt-0.5 w-4 h-4 text-[#2E6FD8] focus:ring-[#2E6FD8]"
                />
                <span className="leading-relaxed flex-1">{opt.text}</span>
                {isSelected && (
                  <CheckCircle2
                    className="w-4 h-4 text-[#2E6FD8] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
