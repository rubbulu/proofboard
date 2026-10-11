import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  IdCard,
  Briefcase,
  ShieldCheck,
  Clock,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { repository } from '../data/repository';
import { VerificationRecord } from '../types';
import { formatDateTime } from './StatusComponents';

export interface ReviewerQueueProps {
  readOnly?: boolean;
  onDataChanged: () => void;
  onNotify: (msg: string) => void;
}

export const ReviewerQueue: React.FC<ReviewerQueueProps> = ({
  readOnly = false,
  onDataChanged,
  onNotify,
}) => {
  const verifications = repository.getVerifications();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pendingItems = verifications.filter(
    (v) => v.decision === 'NEEDS_REVIEW' || v.decision === 'PENDING'
  );
  const resolvedItems = verifications.filter(
    (v) => v.decision !== 'NEEDS_REVIEW' && v.decision !== 'PENDING'
  );

  const handleDecision = (
    item: VerificationRecord,
    decision: 'VERIFIED' | 'APPROVED' | 'REJECTED'
  ) => {
    if (readOnly) {
      onNotify(
        'Read-Only Reviewer Mode: Learners and Recruiters can inspect the queue, but only an authorized Reviewer / Demo User can approve or reject.'
      );
      return;
    }
    const note =
      notes[item.id]?.trim() ||
      (decision === 'REJECTED'
        ? 'Rejected after manual Reviewer inspection.'
        : 'Approved after manual Reviewer inspection.');
    repository.resolveVerificationByReviewer({
      verificationId: item.id,
      decision,
      reviewerNote: note,
    });
    onDataChanged();
    onNotify(
      `Reviewer override recorded for ${item.userName}: ${decision}. Logged to immutable audit trail.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <div className="text-xs font-bold text-[#0B1B3A]">
          Human-in-the-Loop Identity Verification Queue (Track A &amp; Track B)
        </div>
        <h2 className="text-lg font-bold text-[#0B1B3A]">
          NEEDS_REVIEW Learners &amp; PENDING Recruiters ({pendingItems.length}{' '}
          open)
        </h2>
        <p className="text-xs text-slate-600">
          Borderline Student ID OCR scans (55%–84% confidence) and new Recruiter
          organisation requests are decided here by a human Reviewer. Every
          decision writes a <code className="font-mono">verification_override</code>{' '}
          event to the audit log.
        </p>
      </div>

      {/* Open Queue Items */}
      {pendingItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-1">
          <p className="text-sm font-bold text-[#0B1B3A]">
            All NEEDS_REVIEW learners and PENDING recruiters have been resolved!
          </p>
          <p className="text-xs text-slate-500">
            You can submit a new borderline Student ID in Track A or a PENDING
            Recruiter in Track B to test this queue again.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pendingItems.map((item) => {
            const isLearnerTrack = item.track === 'learner_track_a';
            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#F2B705] rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-[#F2B705]/30 text-[#0B1B3A]">
                      {isLearnerTrack ? (
                        <>
                          <IdCard className="w-3.5 h-3.5" />
                          <span>Track A · NEEDS_REVIEW Learner</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Track B · PENDING Recruiter</span>
                        </>
                      )}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {item.auditHash} · {formatDateTime(item.timestamp)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#0B1B3A]">
                      {item.userName}
                    </h3>
                    <div className="text-xs font-mono text-amber-900 mt-0.5">
                      Reason Codes: {item.reasonCodes.join(', ')}
                    </div>
                  </div>

                  {isLearnerTrack && item.ocrPayload && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">
                          STUDENT ID
                        </span>
                        <strong>{item.ocrPayload.studentIdNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">
                          VALIDITY YEAR
                        </span>
                        <strong className="text-[#1E8E5A]">
                          {item.ocrPayload.validityYear} (Valid)
                        </strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">
                          INSTITUTION
                        </span>
                        <strong>{item.ocrPayload.institution}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">
                          OCR CONFIDENCE
                        </span>
                        <strong className="text-amber-800">
                          {Math.round(item.ocrPayload.ocrConfidence * 100)}%
                          (Borderline 55%–84% band)
                        </strong>
                      </div>
                    </div>
                  )}

                  {!isLearnerTrack && item.recruiterPayload && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500">Work Email: </span>
                        <strong className="font-mono text-[#1E8E5A]">
                          {item.recruiterPayload.workEmail}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Organisation: </span>
                        <strong>{item.recruiterPayload.companyName}</strong> (
                        {item.recruiterPayload.designation})
                      </div>
                      {item.recruiterPayload.proofLink && (
                        <div className="flex items-center gap-1 text-[#2E6FD8] font-mono text-[11px] truncate">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span>{item.recruiterPayload.proofLink}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reviewer Note (logged to audit trail)
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={notes[item.id] || ''}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        readOnly
                          ? 'Read-Only Mode (Learner / Recruiter View)'
                          : isLearnerTrack
                          ? 'e.g., Visually confirmed VIT Bhopal ID card number...'
                          : 'e.g., Confirmed corporate domain & partner roster...'
                      }
                      className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-[#0B1B3A] disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {readOnly ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl">
                      <Eye className="w-4 h-4 text-[#2E6FD8]" />
                      <span>
                        Read-Only View: Approval &amp; Rejection Locked for
                        Learner / Recruiter
                      </span>
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDecision(
                            item,
                            isLearnerTrack ? 'VERIFIED' : 'APPROVED'
                          )
                        }
                        className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-[#1E8E5A] hover:bg-[#177348] rounded-xl inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isLearnerTrack
                            ? 'Approve Learner (VERIFIED)'
                            : 'Approve Recruiter (APPROVED)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision(item, 'REJECTED')}
                        className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-[#C8102E] hover:bg-red-800 rounded-xl inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject (REJECTED)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved Verification History */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#0B1B3A]">
          Resolved Identity Verifications ({resolvedItems.length})
        </h3>
        <div className="divide-y divide-slate-200">
          {resolvedItems.map((item) => {
            const isRecruiterTrack = item.track === 'recruiter_track_b';
            return (
              <div
                key={item.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#0B1B3A]">
                    {item.userName}{' '}
                    <span className="font-mono font-normal text-slate-500">
                      ({item.track} · {item.auditHash})
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Reason Codes: {item.reasonCodes.join(', ')}{' '}
                    {item.reviewerNote ? `— Note: "${item.reviewerNote}"` : ''}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isRecruiterTrack && !readOnly && (
                    item.decision === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => {
                          repository.suspendRecruiterAccess(
                            'Revoked by Reviewer from Identity Queue.',
                            item.uid
                          );
                          onDataChanged();
                          onNotify(
                            `Revoked token and suspended recruiter ${item.userName}.`
                          );
                        }}
                        className="min-h-[30px] px-2.5 py-1 rounded-md font-bold text-white bg-[#C8102E] hover:bg-red-800 transition-colors"
                      >
                        Revoke Token &amp; Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          repository.reinstateRecruiterAccess(item.uid);
                          onDataChanged();
                          onNotify(
                            `Reinstated recruiter ${item.userName} and issued new session token.`
                          );
                        }}
                        className="min-h-[30px] px-2.5 py-1 rounded-md font-bold text-white bg-[#1E8E5A] hover:bg-[#177348] transition-colors"
                      >
                        Reinstate Recruiter
                      </button>
                    )
                  )}

                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-md ${
                      item.decision === 'VERIFIED' ||
                      item.decision === 'APPROVED'
                        ? 'bg-emerald-50 text-[#1E8E5A]'
                        : item.decision === 'REJECTED'
                        ? 'bg-red-50 text-[#C8102E]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.decision === 'VERIFIED' ||
                    item.decision === 'APPROVED' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{item.decision}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
