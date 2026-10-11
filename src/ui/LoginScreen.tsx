import React, { useState } from 'react';
import {
  User,
  Briefcase,
  FlaskConical,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { AuthSession, LoginRole } from '../types';

export interface LoginScreenProps {
  onLogin: (session: AuthSession) => void;
}

const ROLE_DEFAULTS: Record<
  LoginRole,
  {
    label: string;
    subtitle: string;
    allowedViewsSummary: string;
    defaultUsername: string;
    defaultEmail: string;
    defaultPassword: string;
  }
> = {
  learner: {
    label: 'Learner',
    subtitle: 'Student completing proof-of-skill tasks',
    allowedViewsSummary: 'Unlocks: Learner UI · Reviewer UI (Read-Only)',
    defaultUsername: 'Asha',
    defaultEmail: 'asha.student@gmail.com',
    defaultPassword: '••••••••',
  },
  recruiter: {
    label: 'Recruiter',
    subtitle: 'Hiring partner inspecting consented evidence',
    allowedViewsSummary:
      'Unlocks: Learner UI · Recruiter UI · Reviewer UI (Read-Only)',
    defaultUsername: 'Priya Nair',
    defaultEmail: 'priya.nair@nxtmove.io',
    defaultPassword: '••••••••',
  },
  demo: {
    label: 'Demo User',
    subtitle: 'Full walkthrough & verification sandbox evaluator',
    allowedViewsSummary:
      'Unlocks All 4: Learner · Recruiter · Reviewer · Demo',
    defaultUsername: 'Demo Evaluator',
    defaultEmail: 'demo.user@gmail.com',
    defaultPassword: '••••••••',
  },
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<LoginRole>('learner');
  const [username, setUsername] = useState<string>(
    ROLE_DEFAULTS.learner.defaultUsername
  );
  const [email, setEmail] = useState<string>(
    ROLE_DEFAULTS.learner.defaultEmail
  );
  const [password, setPassword] = useState<string>('proofboard123');
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = (role: LoginRole) => {
    setSelectedRole(role);
    setUsername(ROLE_DEFAULTS[role].defaultUsername);
    setEmail(ROLE_DEFAULTS[role].defaultEmail);
    if (!password) {
      setPassword('proofboard123');
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setError('Please enter your username.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email ID.');
      return;
    }
    if (!trimmedPass) {
      setError('Please enter your password.');
      return;
    }

    onLogin({
      username: trimmedUser,
      email: trimmedEmail,
      loginRole: selectedRole,
      loggedInAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#EEF1F7] text-[#0B1B3A]">
      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-[#0B1B3A] font-display">
              ProofBoard
            </span>
            <span className="text-xs text-slate-500">
              · Proof-of-Skill Sandbox &amp; Identity Verification
            </span>
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1E8E5A]" />
            <span>Role-Scoped Access &amp; Deterministic Verification</span>
          </div>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#2E6FD8]">
              Sign In to ProofBoard
            </div>
            <h1 className="text-2xl font-bold text-[#0B1B3A]">
              Select Your Role &amp; Sign In
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose <strong>Learner</strong>, <strong>Recruiter</strong>, or{' '}
              <strong>Demo User</strong> and sign in with your username, email
              ID, and password to load your role-scoped workspace.
            </p>
          </div>

          {/* 3 Role Selection Cards: Learner, Recruiter, Demo User */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0B1B3A]">
              1. Choose Login Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  {
                    id: 'learner' as const,
                    Icon: User,
                    activeBorder: 'border-[#2E6FD8] bg-blue-50/50',
                    iconColor: 'text-[#2E6FD8]',
                  },
                  {
                    id: 'recruiter' as const,
                    Icon: Briefcase,
                    activeBorder: 'border-[#1E8E5A] bg-emerald-50/50',
                    iconColor: 'text-[#1E8E5A]',
                  },
                  {
                    id: 'demo' as const,
                    Icon: FlaskConical,
                    activeBorder: 'border-[#0B1B3A] bg-slate-100',
                    iconColor: 'text-[#0B1B3A]',
                  },
                ] as const
              ).map(({ id, Icon, activeBorder, iconColor }) => {
                const isSelected = selectedRole === id;
                const meta = ROLE_DEFAULTS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectRole(id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-colors flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? activeBorder
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3A]">
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                        <span>{meta.label}</span>
                      </span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#0B1B3A] bg-[#0B1B3A]'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {meta.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Role Access Summary Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#0B1B3A]">
                <Eye className="w-3.5 h-3.5 text-[#2E6FD8]" />
                <span>{ROLE_DEFAULTS[selectedRole].allowedViewsSummary}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Reviewer UI is read-only for Learner &amp; Recruiter
              </span>
            </div>
          </div>

          {/* Login Form: Username, Email ID, Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-[#0B1B3A] mb-1"
              >
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name (e.g., Asha)"
                  className="w-full min-h-[42px] pl-10 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-[#0B1B3A] focus:outline-none focus:border-[#2E6FD8]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-[#0B1B3A] mb-1"
              >
                Email ID (Gmail or Corporate Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com or name@company.com"
                  className="w-full min-h-[42px] pl-10 pr-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-[#0B1B3A] focus:outline-none focus:border-[#2E6FD8]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-[#0B1B3A] mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full min-h-[42px] pl-10 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-[#0B1B3A] focus:outline-none focus:border-[#2E6FD8]"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#C8102E]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] px-5 py-2.5 text-xs font-bold text-white bg-[#0B1B3A] hover:bg-slate-800 rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Sign In as {ROLE_DEFAULTS[selectedRole].label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p className="font-medium text-[#0B1B3A]">
            Synthetic data. Scores are experimental, not validated hiring
            predictors.
          </p>
          <p className="text-slate-500">
            ProofBoard Sandbox · Track A &amp; B Identity Verification
          </p>
        </div>
      </footer>
    </div>
  );
};
