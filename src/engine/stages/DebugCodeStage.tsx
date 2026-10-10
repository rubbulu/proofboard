import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import {
  CheckCircle2,
  XCircle,
  Terminal,
  Sparkles,
  RotateCcw,
  Wand2,
  ShieldAlert,
} from 'lucide-react';
import { Stage, TestExecutionResult } from '../../types';

export interface DebugCodeStageProps {
  stage: Stage;
  code: string;
  onChange: (nextCode: string) => void;
  practiceResults: TestExecutionResult[] | null;
  practiceError?: string;
  isRunning: boolean;
  onLoadCleanFix: () => void;
  onLoadShortcutDemo: () => void;
  onResetStarter: () => void;
}

export const DebugCodeStage: React.FC<DebugCodeStageProps> = ({
  stage,
  code,
  onChange,
  practiceResults,
  practiceError,
  onLoadCleanFix,
  onLoadShortcutDemo,
  onResetStarter,
}) => {
  const visibleTests = stage.visibleTests || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
          <Terminal className="w-4 h-4 text-[#2E6FD8]" aria-hidden="true" />
          <span>Code Editor: {stage.functionName}(items)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onLoadCleanFix}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#1E8E5A] bg-emerald-50 hover:bg-emerald-100 border border-[#1E8E5A]/30 rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Load Verified Clean Fix</span>
          </button>
          <button
            type="button"
            onClick={onLoadShortcutDemo}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0B1B3A] bg-[#F2B705]/25 hover:bg-[#F2B705]/40 border border-[#F2B705] rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-800" aria-hidden="true" />
            <span>Load Hardcoded Shortcut (return 25)</span>
          </button>
          <button
            type="button"
            onClick={onResetStarter}
            className="min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Buggy</span>
          </button>
        </div>
      </div>

      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
        <CodeMirror
          value={code}
          height="230px"
          extensions={[javascript()]}
          onChange={(val) => onChange(val)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
          aria-label={`Code editor for ${stage.title}`}
        />
      </div>

      {/* 3 Visible Test Cases */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-[#0B1B3A]">
            3 Visible Test Cases (Practice &amp; Submit)
          </h4>
          <span className="text-xs font-medium text-[#2E6FD8]">
            Submit runs these 3 visible + 10 randomized unseen boundary tests
          </span>
        </div>
        <div className="divide-y divide-slate-200">
          {visibleTests.map((vt) => {
            const runMatch = practiceResults?.find((r) => r.id === vt.id);
            return (
              <div
                key={vt.id}
                className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#0B1B3A]">{vt.name}</div>
                  <div className="font-mono text-slate-600">
                    Input: {JSON.stringify(vt.input[0])} → Expected:{' '}
                    {JSON.stringify(vt.expected)}
                  </div>
                </div>
                {runMatch && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {runMatch.passed ? (
                      <span className="inline-flex items-center gap-1 text-[#1E8E5A] font-semibold">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#C8102E] font-semibold">
                        <XCircle className="w-4 h-4" aria-hidden="true" />
                        <span>Not passed ({runMatch.actualDisplay})</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {practiceError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-[#C8102E]/30 text-sm text-[#C8102E] flex items-start gap-2.5"
        >
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Code execution stopped</p>
            <p className="text-xs mt-0.5 text-red-900">{practiceError}</p>
          </div>
        </div>
      )}

      {practiceResults && !practiceError && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-[#2E6FD8]/30 text-xs text-[#0B1B3A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className="w-4 h-4 text-[#2E6FD8] shrink-0"
              aria-hidden="true"
            />
            <span>
              <strong>Practice Tests Result:</strong>{' '}
              {practiceResults.filter((r) => r.passed).length} of{' '}
              {practiceResults.length} visible tests passed. Click{' '}
              <strong>Submit for Scoring</strong> to run all 3 visible + 10
              unseen boundary tests.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
