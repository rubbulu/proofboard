import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import {
  Attempt,
  AttemptStatus,
  ConfidenceLevel,
  ProficiencyLevel,
  RecencyLevel,
  Stage,
} from '../types';

export const CONFIDENCE_TRUST_DISCLAIMER =
  'Confidence shows how much to trust a result. It is not a hiring decision.';

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '10 Oct 2026';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '10 Oct 2026';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '10 Oct 2026';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '10 Oct 2026';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const CriterionStatusIndicator: React.FC<{
  passed: boolean;
  needsReview?: boolean;
  pending?: boolean;
}> = ({ passed, needsReview, pending }) => {
  if (needsReview) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B3A] bg-[#F2B705]/25 px-2.5 py-1 rounded-md shrink-0">
        <Eye className="w-3.5 h-3.5 text-[#0B1B3A]" aria-hidden="true" />
        <span>Needs review</span>
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
        <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        <span>Pending</span>
      </span>
    );
  }
  if (passed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E8E5A] bg-[#1E8E5A]/10 px-2.5 py-1 rounded-md shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E5A]" aria-hidden="true" />
        <span>Passed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C8102E] bg-[#C8102E]/10 px-2.5 py-1 rounded-md shrink-0">
      <XCircle className="w-3.5 h-3.5 text-[#C8102E]" aria-hidden="true" />
      <span>Not passed</span>
    </span>
  );
};

export const AttemptStatusIndicator: React.FC<{
  status: AttemptStatus;
  score: number;
  flagReason?: string;
}> = ({ status, score }) => {
  if (status === 'disqualified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C8102E] bg-[#C8102E]/10 px-2.5 py-1 rounded-md shrink-0">
        <Ban className="w-3.5 h-3.5 text-[#C8102E]" aria-hidden="true" />
        <span>Disqualified (Score Withheld)</span>
      </span>
    );
  }

  if (status === 'flagged') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C8102E] bg-red-50 border border-red-200 px-2.5 py-1 rounded-md shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-[#C8102E]" aria-hidden="true" />
        <span>Integrity Alert (Score Withheld)</span>
      </span>
    );
  }

  if (status === 'under_appeal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B3A] bg-[#F2B705]/30 px-2.5 py-1 rounded-md shrink-0">
        <Eye className="w-3.5 h-3.5 text-[#0B1B3A]" aria-hidden="true" />
        <span>Appeal Pending Review</span>
      </span>
    );
  }

  if (score === 100) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E8E5A] bg-[#1E8E5A]/10 px-2.5 py-1 rounded-md shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E5A]" aria-hidden="true" />
        <span>Verified (100/100)</span>
      </span>
    );
  }

  if (score >= 80) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E8E5A] bg-[#1E8E5A]/10 px-2.5 py-1 rounded-md shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E5A]" aria-hidden="true" />
        <span>Passed ({score}/100)</span>
      </span>
    );
  }

  if (score >= 50) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B3A] bg-[#F2B705]/25 px-2.5 py-1 rounded-md shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#0B1B3A]" aria-hidden="true" />
        <span>Developing ({score}/100)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C8102E] bg-[#C8102E]/10 px-2.5 py-1 rounded-md shrink-0">
      <XCircle className="w-3.5 h-3.5 text-[#C8102E]" aria-hidden="true" />
      <span>Not passed</span>
    </span>
  );
};

export const ProficiencyBadge: React.FC<{ level: ProficiencyLevel }> = ({
  level,
}) => {
  if (level === 'Verified' || level === 'Proficient') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1E8E5A] px-2.5 py-1 rounded-md shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{level}</span>
      </span>
    );
  }
  if (level === 'Developing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B3A] bg-[#F2B705] px-2.5 py-1 rounded-md shrink-0">
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Developing</span>
      </span>
    );
  }
  if (level === 'Beginner') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-600 px-2.5 py-1 rounded-md shrink-0">
        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Beginner</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-300 bg-white px-2.5 py-1 rounded-md shrink-0">
      <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      <span>Not assessed</span>
    </span>
  );
};

export const RecencyDisplay: React.FC<{
  recency: RecencyLevel;
  lastDate: string | null;
}> = ({ recency, lastDate }) => {
  if (recency === 'None' || !lastDate) {
    return (
      <span className="text-xs text-slate-500">No assessment date yet</span>
    );
  }

  const colorClass =
    recency === 'Fresh'
      ? 'text-[#1E8E5A] font-semibold'
      : recency === 'Aging'
      ? 'text-amber-700 font-semibold'
      : 'text-[#C8102E] font-semibold';

  return (
    <span className="text-xs text-slate-600">
      Recency: <span className={colorClass}>{recency}</span> ·{' '}
      <span className="tabular-nums font-medium text-[#0B1B3A]">
        {formatShortDate(lastDate)}
      </span>
    </span>
  );
};

export const ConfidenceDisplay: React.FC<{
  confidence: ConfidenceLevel;
  confidenceReason: string;
  telemetryLabel?: string;
  compact?: boolean;
}> = ({ confidence, confidenceReason, telemetryLabel, compact }) => {
  const barSegments =
    confidence === 'higher' ? 3 : confidence === 'lower' ? 2 : 1;
  const barColor =
    confidence === 'higher'
      ? 'bg-[#1E8E5A]'
      : confidence === 'lower'
      ? 'bg-[#F2B705]'
      : 'bg-slate-400';

  const labelWord =
    confidence === 'higher'
      ? 'Higher confidence'
      : confidence === 'lower'
      ? 'Lower confidence'
      : 'Pending confidence';

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-1"
          aria-label={`Confidence level: ${labelWord}`}
        >
          {[1, 2, 3].map((seg) => (
            <span
              key={seg}
              className={`w-4 h-2 rounded-xs ${
                seg <= barSegments ? barColor : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-[#0B1B3A] inline-flex items-center gap-1">
          {confidence === 'higher' ? (
            <ShieldCheck
              className="w-3.5 h-3.5 text-[#1E8E5A]"
              aria-hidden="true"
            />
          ) : confidence === 'lower' ? (
            <AlertTriangle
              className="w-3.5 h-3.5 text-amber-700"
              aria-hidden="true"
            />
          ) : (
            <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          )}
          <span>{labelWord}</span>
        </span>
        {telemetryLabel && (
          <span className="text-[11px] font-medium text-[#1E8E5A] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            {telemetryLabel}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-700">{confidenceReason}</p>
      {!compact && (
        <p className="text-[11px] text-slate-500">
          {CONFIDENCE_TRUST_DISCLAIMER}
        </p>
      )}
    </div>
  );
};

export function formatAttemptAnswerForDisplay(
  attempt: Attempt,
  stage?: Stage
): string {
  if (typeof attempt.answer === 'string') {
    return attempt.answer;
  }
  if (attempt.stageType === 'predict_output' && Array.isArray(attempt.answer)) {
    const cases = attempt.predictCases || [];
    return attempt.answer
      .map((ans, idx) => {
        const c = cases[idx];
        return c
          ? `Case ${idx + 1}: ${c.inputDisplay} -> Predicted: ${ans} (Expected: ${JSON.stringify(
              c.expectedOutput
            )})`
          : `Case ${idx + 1}: Predicted: ${ans}`;
      })
      .join('\n');
  }
  if (attempt.stageType === 'arrange_steps' && Array.isArray(attempt.answer)) {
    const steps = stage?.steps || [];
    return attempt.answer
      .map(
        (stepIdx, pos) =>
          `${pos + 1}. [${stepIdx}] ${steps[Number(stepIdx)] || `Step ${stepIdx}`}`
      )
      .join('\n');
  }
  return JSON.stringify(attempt.answer, null, 2);
}
