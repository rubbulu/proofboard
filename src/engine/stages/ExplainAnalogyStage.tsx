import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { countWords } from '../written';
import { Stage } from '../../types';

export interface ExplainAnalogyStageProps {
  stage: Stage;
  text: string;
  onChange: (next: string) => void;
  aiSecondOpinionOptIn: boolean;
  onToggleAiSecondOpinion: (next: boolean) => void;
}

export const ExplainAnalogyStage: React.FC<ExplainAnalogyStageProps> = ({
  stage,
  text,
  onChange,
  aiSecondOpinionOptIn,
  onToggleAiSecondOpinion,
}) => {
  const minWords = stage.minWords || 40;
  const currentWords = countWords(text);
  const meetsStructure = currentWords >= minWords;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`explain-input-${stage.id}`}
          className="flex items-center gap-2 text-sm font-medium text-[#0B1B3A]"
        >
          <MessageSquareText
            className="w-4 h-4 text-[#2E6FD8]"
            aria-hidden="true"
          />
          <span>Real-Life Explanation (English, Telugu, or Hindi)</span>
        </label>
        <span
          className={`text-xs font-mono tabular-nums font-semibold ${
            meetsStructure ? 'text-[#1E8E5A]' : 'text-slate-600'
          }`}
        >
          {currentWords} of {minWords} words minimum
        </span>
      </div>

      <textarea
        id={`explain-input-${stage.id}`}
        rows={7}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Explain clearly to a non-technical person using a real-life example (at least 40 words)..."
        className="w-full p-4 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1B3A] placeholder:text-slate-400 focus:border-[#2E6FD8] leading-relaxed"
      />

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer text-xs text-[#0B1B3A]">
          <input
            type="checkbox"
            checked={aiSecondOpinionOptIn}
            onChange={(e) => onToggleAiSecondOpinion(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2E6FD8] focus:ring-[#2E6FD8]"
          />
          <span>
            <strong className="font-semibold">
              Allow an AI second opinion on my written answer
            </strong>{' '}
            (only the text you typed is sent, never your name or profile).
          </span>
        </label>
        <p className="text-xs text-slate-600 pl-7">
          Answers in Telugu or Hindi are never guessed by English rules—they are
          automatically routed to a human reviewer so a person can read them.
        </p>
      </div>
    </div>
  );
};
