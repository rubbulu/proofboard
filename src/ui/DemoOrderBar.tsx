import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ActiveRoleView } from '../types';

export interface DemoOrderBarProps {
  currentStep: number;
  onSelectStep: (step: number, targetView: ActiveRoleView) => void;
}

const DEMO_STEPS: Array<{
  step: number;
  label: string;
  targetView: ActiveRoleView;
  hint: string;
}> = [
  {
    step: 1,
    label: '1. Pass',
    targetView: 'learner',
    hint: 'Submit working solution & score 100',
  },
  {
    step: 2,
    label: '2. Caught shortcut',
    targetView: 'demo',
    hint: 'Trigger hard-code / stuffing / injection flag',
  },
  {
    step: 3,
    label: '3. Appeal',
    targetView: 'reviewer',
    hint: 'Submit appeal & resolve in Reviewer queue',
  },
  {
    step: 4,
    label: '4. Profile update',
    targetView: 'profile',
    hint: 'Inspect updated profile & toggle Recruiter consent',
  },
];

export const DemoOrderBar: React.FC<DemoOrderBarProps> = ({
  currentStep,
  onSelectStep,
}) => {
  return (
    <div
      className="bg-[#0B1B3A] text-white border-b border-slate-800 px-4 py-2"
      role="region"
      aria-label="Presenter Demo Flow Order"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-300 shrink-0">
          <span>Demo order:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {DEMO_STEPS.map((item, idx) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;

            return (
              <React.Fragment key={item.step}>
                <button
                  type="button"
                  onClick={() => onSelectStep(item.step, item.targetView)}
                  title={item.hint}
                  className={`min-h-[32px] px-3 py-1 rounded-md font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#F2B705] text-[#0B1B3A] font-bold'
                      : isDone
                      ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {isDone && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{item.label}</span>
                </button>
                {idx < DEMO_STEPS.length - 1 && (
                  <ArrowRight
                    className="w-3.5 h-3.5 text-slate-500 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
