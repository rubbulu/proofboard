import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Zap,
  ArrowRight,
  UserCheck,
  Building2,
  Lock,
  Radio,
} from 'lucide-react';
import { PersonaMode } from '../types';

export interface AuthPortalProps {
  onLogin: (
    persona: PersonaMode,
    userData?: { name: string; collegeOrCompany: string }
  ) => void;
  onEnterJudgeMode: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLogin,
  onEnterJudgeMode,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<
    'learner' | 'recruiter' | 'reviewer'
  >('learner');

  // Learner form state
  const [learnerIsRegister, setLearnerIsRegister] = useState(false);
  const [learnerName, setLearnerName] = useState('Asha Sharma');
  const [learnerCollege, setLearnerCollege] = useState(
    'Vindhya Institute of Technology, Bhopal'
  );
  const [learnerEmail, setLearnerEmail] = useState('asha.sharma@vitbhopal.ac.in');

  // Recruiter form state
  const [recruiterIsRegister, setRecruiterIsRegister] = useState(false);
  const [recruiterName, setRecruiterName] = useState('Vikram Rao');
  const [recruiterCompany, setRecruiterCompany] = useState('NxtMove Talent Partner');
  const [recruiterEmail, setRecruiterEmail] = useState('vikram@nxtmove.io');

  return (
    <div className="min-h-screen bg-[#0B1B3A] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2E6FD8] flex items-center justify-center font-bold text-lg text-white shadow-md">
            PB
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white font-display">
              ProofBoard
            </div>
            <div className="text-[11px] text-slate-400">
              Nyeras Proof-of-Skill Sandbox → NxtMove Verified Talent
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEnterJudgeMode}
          className="text-xs px-3.5 py-1.5 rounded-lg bg-[#F2B705]/20 hover:bg-[#F2B705]/30 text-[#F2B705] border border-[#F2B705]/50 flex items-center gap-1.5 transition-colors font-semibold"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>🎙️ Hackathon Judge Demo Mode</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto my-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In or Create an Account
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            A fair, verifiable bridge between online learning and hiring. Select your portal below.
          </p>

          {/* Portal Switcher Tabs */}
          <div className="inline-flex p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mt-6 shadow-inner gap-1">
            <button
              type="button"
              onClick={() => setActivePortalTab('learner')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activePortalTab === 'learner'
                  ? 'bg-[#2E6FD8] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Learner Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePortalTab('recruiter')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activePortalTab === 'recruiter'
                  ? 'bg-[#1E8E5A] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Recruiter Portal (NxtMove)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePortalTab('reviewer')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activePortalTab === 'reviewer'
                  ? 'bg-[#F2B705] text-[#0B1B3A] shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Reviewer Console</span>
            </button>
          </div>
        </div>

        {/* Portal Cards */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xs">
          {/* 1. LEARNER PORTAL */}
          {activePortalTab === 'learner' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#2E6FD8]" />
                    Student & Learner Access
                  </h2>
                  <p className="text-xs text-slate-400">
                    Solve real tasks, generate immutable competency evidence, and control recruiter visibility.
                  </p>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLearnerIsRegister(false)}
                    className={`px-3 py-1 rounded-md font-medium ${
                      !learnerIsRegister ? 'bg-[#2E6FD8] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearnerIsRegister(true)}
                    className={`px-3 py-1 rounded-md font-medium ${
                      learnerIsRegister ? 'bg-[#2E6FD8] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {learnerIsRegister ? (
                /* Registration Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onLogin('learner', { name: learnerName, collegeOrCompany: learnerCollege });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={learnerName}
                        onChange={(e) => setLearnerName(e.target.value)}
                        required
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2E6FD8]"
                        placeholder="e.g. Asha Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        College / University
                      </label>
                      <input
                        type="text"
                        value={learnerCollege}
                        onChange={(e) => setLearnerCollege(e.target.value)}
                        required
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2E6FD8]"
                        placeholder="e.g. Vindhya Institute of Technology"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Student Email ID
                    </label>
                    <input
                      type="email"
                      value={learnerEmail}
                      onChange={(e) => setLearnerEmail(e.target.value)}
                      required
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2E6FD8]"
                      placeholder="e.g. student@college.edu.in"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#2E6FD8] hover:bg-blue-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Register & Enter Sandbox</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Sign In Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email or Student ID
                    </label>
                    <input
                      type="email"
                      defaultValue="asha.sharma@vitbhopal.ac.in"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2E6FD8]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onLogin('learner', { name: learnerName, collegeOrCompany: learnerCollege })
                    }
                    className="w-full py-2.5 rounded-xl bg-[#2E6FD8] hover:bg-blue-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Sign In to Sandbox</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quick Demo Login Option */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Judges & Evaluators: Skip typing with 1-click preset
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onLogin('learner', {
                      name: 'Asha Sharma',
                      collegeOrCompany: 'Vindhya Institute of Technology, Bhopal',
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-[#60A5FA] border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Login: Asha (Student)</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. RECRUITER PORTAL */}
          {activePortalTab === 'recruiter' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#1E8E5A]" />
                    NxtMove Employer & Recruiter Access
                  </h2>
                  <p className="text-xs text-slate-400">
                    Search talent based on verified task diffs, test logs, and consented candidate evidence.
                  </p>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setRecruiterIsRegister(false)}
                    className={`px-3 py-1 rounded-md font-medium ${
                      !recruiterIsRegister ? 'bg-[#1E8E5A] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecruiterIsRegister(true)}
                    className={`px-3 py-1 rounded-md font-medium ${
                      recruiterIsRegister ? 'bg-[#1E8E5A] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register Company
                  </button>
                </div>
              </div>

              {recruiterIsRegister ? (
                /* Recruiter Registration Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onLogin('recruiter', {
                      name: recruiterName,
                      collegeOrCompany: recruiterCompany,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Recruiter / Hiring Lead Name
                      </label>
                      <input
                        type="text"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        required
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1E8E5A]"
                        placeholder="e.g. Vikram Rao"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={recruiterCompany}
                        onChange={(e) => setRecruiterCompany(e.target.value)}
                        required
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1E8E5A]"
                        placeholder="e.g. Swiggy / TechCorp"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={recruiterEmail}
                      onChange={(e) => setRecruiterEmail(e.target.value)}
                      required
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1E8E5A]"
                      placeholder="e.g. hiring@company.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1E8E5A] hover:bg-emerald-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Register Company & Access Talent Pool</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Recruiter Sign In */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      defaultValue="vikram@nxtmove.io"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1E8E5A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onLogin('recruiter', {
                        name: recruiterName,
                        collegeOrCompany: recruiterCompany,
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-[#1E8E5A] hover:bg-emerald-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Sign In to NxtMove Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quick Demo Login Option */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Judges & Evaluators: Inspect candidate profiles with 1-click
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onLogin('recruiter', {
                      name: 'Vikram Rao',
                      collegeOrCompany: 'NxtMove Partner',
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[#34D399] border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Login: NxtMove Recruiter</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. REVIEWER CONSOLE (INSTITUTIONAL ACCESS ONLY) */}
          {activePortalTab === 'reviewer' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#F2B705]" />
                    Academic Reviewer & Auditor Portal
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-[#F2B705] border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Institutional Access Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Public self-registration is disabled for reviewers. Evaluators are vetted and provisioned by partner universities, Nyeras, and ISRO auditors to guarantee academic integrity.
                </p>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F2B705]/20 border border-[#F2B705]/40 flex items-center justify-center font-bold text-[#F2B705]">
                    DT
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Prof. D. Naga Chandra Teja
                    </div>
                    <div className="text-xs text-slate-300">
                      Lead Technical Auditor · NavQriti / ISRO HQ
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      ✓ Active Institutional Credentials Verified
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onLogin('reviewer', {
                      name: 'D. Naga Chandra Teja',
                      collegeOrCompany: 'ISRO HQ / NavQriti',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#F2B705] hover:bg-yellow-400 text-[#0B1B3A] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticate & Enter Console</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F2B705] shrink-0" />
                <span>
                  All actions taken inside the Reviewer Console are immutably signed to the Global Audit Log (#AUD-9104).
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 py-3 border-t border-slate-800/80">
        Samartha Hackathon 2026 · Theme: "Where Indian Ingenuity Meets AI" · Team AV_062 · Vidyora
      </div>
    </div>
  );
};
