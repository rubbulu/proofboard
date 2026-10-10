import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Gavel,
  Briefcase,
  Radio,
} from 'lucide-react';

export interface PitchControllerBarProps {
  activePreset: number;
  onTriggerPreset: (preset: 1 | 2 | 3 | 4) => void;
}

const PITCH_PRESETS: Array<{
  id: 1 | 2 | 3 | 4;
  label: string;
  subtitle: string;
  Icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 1,
    label: 'Preset 1 (Fair Pass)',
    subtitle: 'Clean code · 13/13 tests · 100/100 Verified',
    Icon: CheckCircle2,
  },
  {
    id: 2,
    label: 'Preset 2 (Caught Shortcut)',
    subtitle: 'Hardcoded return 25 · Fails 9/10 hidden · Withheld',
    Icon: ShieldAlert,
  },
  {
    id: 3,
    label: 'Preset 3 (Reviewer Action)',
    subtitle: 'Reviewer Console · Confirm Disqualification · #AUD-9104',
    Icon: Gavel,
  },
  {
    id: 4,
    label: 'Preset 4 (Recruiter Portal)',
    subtitle: 'NxtMove Search · Asha Surfaced · Cheater Excluded',
    Icon: Briefcase,
  },
];

export const PitchControllerBar: React.FC<PitchControllerBarProps> = ({
  activePreset,
  onTriggerPreset,
}) => {
  return (
    <div
      className="bg-[#0B1B3A] text-white border-b border-slate-800 px-4 sm:px-6 py-2.5"
      role="region"
      aria-label="Global 4-Step 3-Minute Pitch Controller"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <Radio
            className="w-4 h-4 text-[#F2B705] shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs font-bold tracking-tight text-white">
            3-Minute Pitch Controller:
          </span>
          <span className="text-[11px] text-slate-300 hidden sm:inline">
            One-click live hackathon walkthrough presets
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PITCH_PRESETS.map(({ id, label, subtitle, Icon }) => {
            const isActive = activePreset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTriggerPreset(id)}
                className={`min-h-[42px] px-3 py-1.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#F2B705] text-[#0B1B3A] border-[#F2B705] font-bold'
                    : 'bg-slate-800/90 text-slate-100 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#0B1B3A]' : 'text-[#F2B705]'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{label}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-[#0B1B3A]/85' : 'text-slate-400'
                    }`}
                  >
                    {subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
