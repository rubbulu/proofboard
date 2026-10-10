import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Gavel,
  Briefcase,
  ArrowRight,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';
import { repository } from '../data/repository';
import { NavigationTabId } from '../types';

export interface DemoViewProps {
  onTriggerPitchPreset: (preset: 1 | 2 | 3 | 4) => void;
  onNavigateTab: (tab: NavigationTabId) => void;
}

export const DemoView: React.FC<DemoViewProps> = ({
  onTriggerPitchPreset,
  onNavigateTab,
}) => {
  const activePreset = repository.getActivePitchPreset();

  const presets = [
    {
      id: 1 as const,
      title: 'Preset 1: Fair Pass (Asha — 100/100 Verified)',
      subtitle: 'Clean loop fix · 13/13 sandbox tests · Stage 4 Explain-Back',
      description:
        'Sets Asha to the clean loop fix, passes all 3 visible + 10 hidden boundary tests, verifies Stage 4 pseudocode explain-back, and updates her Competency Profile to 100/100 Verified.',
      actionTab: 'learner_profile' as NavigationTabId,
      actionLabel: 'Inspect Asha’s Verified Profile',
      Icon: CheckCircle2,
    },
    {
      id: 2 as const,
      title: 'Preset 2: Caught Shortcut (Hardcoded return 25)',
      subtitle: 'Passes 3/3 visible · Fails 9/10 hidden · Score Withheld',
      description:
        'Loads hardcoded `if (price === 10) return 25` into Stage 2. Passes the 3 visible tests, fails 9/10 unseen boundary tests, triggers Integrity Alert: Hardcoded Return Suspected, and withholds the score.',
      actionTab: 'learner_sandbox' as NavigationTabId,
      actionLabel: 'View Caught Shortcut in Sandbox',
      Icon: ShieldAlert,
    },
    {
      id: 3 as const,
      title: 'Preset 3: Reviewer Governance (#AUD-9104 & #AUD-9208)',
      subtitle: 'Strict separation of cheating vs. legitimate student appeals',
      description:
        'Opens the Reviewer Console. Case A (Cheating) only allows Confirm Disqualification (Withhold Score). Case B (Asha’s precision appeal) requires a numeric score and >= 15-char rationale.',
      actionTab: 'reviewer_queue' as NavigationTabId,
      actionLabel: 'Open Reviewer Console',
      Icon: Gavel,
    },
    {
      id: 4 as const,
      title: 'Preset 4: NxtMove Recruiter Portal (Consent & Integrity Gated)',
      subtitle: 'Asha surfaced for Junior Backend Engineer · Cheater excluded',
      description:
        'Switches to the NxtMove Hiring Partner view filtered for Junior Backend Engineer & Debugging >= 80%. Asha’s verified evidence is inspectable; disqualified candidates never appear.',
      actionTab: 'recruiter_search' as NavigationTabId,
      actionLabel: 'Open NxtMove Talent Search',
      Icon: Briefcase,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <div className="text-xs font-bold text-[#2E6FD8]">
          🎙️ Samartha Hackathon Judge &amp; Presenter Guide
        </div>
        <h1 className="text-2xl font-bold text-[#0B1B3A]">
          3-Minute Pitch Walkthrough &amp; Governance Architecture
        </h1>
        <p className="text-xs text-slate-600 max-w-3xl">
          Use the top 3-Minute Pitch Controller bar from any screen—or click any
          preset card below—to walk judges through the complete Nyeras Learning
          Sandbox to NxtMove Recruiter verification loop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          const Icon = p.Icon;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl p-6 border flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'border-2 border-[#0B1B3A] shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6FD8]">
                    <Icon className="w-4 h-4" />
                    <span>{p.subtitle}</span>
                  </span>
                  {isActive && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F2B705] text-[#0B1B3A]">
                      Active Preset
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-[#0B1B3A]">{p.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onTriggerPitchPreset(p.id)}
                  className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-[#0B1B3A] hover:bg-slate-800 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Activate Preset {p.id}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab(p.actionTab)}
                  className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-[#0B1B3A] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {p.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Plan & Prototype Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
            <ClipboardCheck className="w-4 h-4 text-[#1E8E5A]" />
            <h3>Deterministic Scoring &amp; Governance Guarantees</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc ps-5">
            <li>
              <strong>Zero AI Grading Authority:</strong> Deterministic unit
              tests and explicit concept rules set every score. AI never sets or
              changes a score.
            </li>
            <li>
              <strong>Anti-Hardcoding Fuzzing:</strong> Every code submission
              runs against 3 visible tests + 10 seeded randomized boundary tests
              inside an isolated 2000ms Web Worker.
            </li>
            <li>
              <strong>Strict Consent &amp; Integrity Gating:</strong> Recruiter
              queries pass exclusively through{' '}
              <code className="font-mono">getVisibleProfiles()</code>, blocking
              unconsented and disqualified candidates.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3A]">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <h3>Prototype Scope &amp; Production Hardening</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc ps-5">
            <li>
              <strong>Sandbox Execution:</strong> In this browser-only
              hackathon prototype, hidden test generators run inside a client
              Web Worker; production deployments isolate hidden test suites in a
              server container.
            </li>
            <li>
              <strong>Experimental Notice:</strong> All candidate records are
              synthetic. Scores represent task-level rubric evidence, never a
              single overall human ranking or validated hiring predictor.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
