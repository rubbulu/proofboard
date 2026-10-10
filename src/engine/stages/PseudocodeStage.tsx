import React from 'react';
import { FileCode2, Wand2 } from 'lucide-react';
import { countNonEmptyLines } from '../written';
import { Stage } from '../../types';

export interface PseudocodeStageProps {
  stage: Stage;
  text: string;
  onChange: (next: string) => void;
  aiSecondOpinionOptIn: boolean;
  onToggleAiSecondOpinion: (next: boolean) => void;
  onLoadSamplePseudocode: () => void;
}

export const PseudocodeStage: React.FC<PseudocodeStageProps> = ({
  stage,
  text,
  onChange,
  aiSecondOpinionOptIn,
  onToggleAiSecondOpinion,
  onLoadSamplePseudocode,
}) => {
  const minLines = stage.minLines || 3;
  const currentLines = countNonEmptyLines(text);
  const meetsStructure = currentLines >= minLines;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`pseudocode-input-${stage.id}`}
          className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]"
        >
          <FileCode2 className="w-4 h-4 text-[#2E6FD8]" aria-hidden="true" />
          <span>Written Pseudocode &amp; Explain-Back</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSamplePseudocode}
            className="min-h-[34px] px-2.5 py-1 text-xs font-semibold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 border border-[#1E8E5A]/30 rounded-lg inline-flex items-center gap-1 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Fill Verified Explain-Back</span>
          </button>
          <span
            className={`text-xs font-mono tabular-nums font-semibold ${
              meetsStructure ? 'text-[#1E8E5A]' : 'text-slate-600'
            }`}
          >
            {currentLines} of {minLines} lines minimum
          </span>
        </div>
      </div>

      <textarea
        id={`pseudocode-input-${stage.id}`}
        rows={7}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Write your pseudocode / plain-language fix:\n1. Start with a running total = 0 (return 0 if cart is empty)\n2. Loop through every item in the cart\n3. Multiply item.price by item.qty and add to the running total\n4. Round the total to 2 decimals and return the result`}
        className="w-full p-4 text-sm font-mono bg-white border border-slate-300 rounded-xl text-[#0B1B3A] placeholder:text-slate-400 focus:border-[#2E6FD8] leading-relaxed"
      />

      {/* Automatic Telemetry + AI Second Opinion Toggle */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <span className="text-xs font-semibold text-[#1E8E5A] bg-emerald-50 border border-[#1E8E5A]/30 px-3 py-1 rounded-lg">
            📋 Telemetry: Natural Keystrokes (No Bulk Paste)
          </span>
          <span className="text-xs text-slate-500">
            Automatic keystroke cadence verification active
          </span>
        </div>

        <label className="flex items-start gap-3 cursor-pointer text-xs text-[#0B1B3A]">
          <input
            type="checkbox"
            checked={aiSecondOpinionOptIn}
            onChange={(e) => onToggleAiSecondOpinion(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2E6FD8] focus:ring-[#2E6FD8]"
          />
          <span>
            <strong className="font-semibold">
              Allow an AI second opinion on written answer
            </strong>{' '}
            <span className="text-slate-600">
              (Raises confidence when deterministic rules and AI semantic
              analysis agree).
            </span>
          </span>
        </label>
      </div>
    </div>
  );
};
