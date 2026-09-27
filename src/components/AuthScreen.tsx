import React, { useState } from 'react';
import { CalScanLogo } from './CalScanLogo';
import { ShieldCheck, LogIn, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onSignInWithGoogle: () => Promise<void>;
  onContinueAsGuest: () => Promise<void>;
  errorMessage?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignInWithGoogle,
  onContinueAsGuest,
  errorMessage,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoadingGoogle(true);
      await onSignInWithGoogle();
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuest = async () => {
    try {
      setLoadingGuest(true);
      await onContinueAsGuest();
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#FF6B5B]/20">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center pt-8">
        <div className="mb-4">
          <CalScanLogo size={80} />
        </div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-white">
          Cal Scan
        </h1>
        <p className="text-xs uppercase tracking-widest text-neutral-400 mt-1 font-mono">
          Optical AI Calorie & Nutrition Scanner
        </p>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-4 my-auto">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <ShieldCheck className="w-4 h-4 text-[#FF6B5B]" />
            Secure Private Storage
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Sign in with your Google Account for real-time synchronization across devices and verified cloud database security rules.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loadingGoogle || loadingGuest}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-[#FF6B5B] text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition shadow-xs disabled:opacity-50"
        >
          {loadingGoogle ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {/* Google G icon */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.8h6.887C18.2 16.16 15.6 18.06 12.24 18.06c-3.35 0-6.06-2.72-6.06-6.06s2.71-6.06 6.06-6.06c1.47 0 2.82.52 3.87 1.39l2.7-2.7C17.15 3.03 14.86 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.96 0 9.87-4.19 9.87-10.05 0-.68-.07-1.34-.19-1.95H12.24z" />
              </svg>
              Sign In with Google
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleGuest}
          disabled={loadingGoogle || loadingGuest}
          className="w-full py-3 px-4 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300/70 dark:hover:bg-neutral-700 transition"
        >
          {loadingGuest ? 'Starting Session...' : 'Continue with Local Session'}
        </button>
      </div>

      <div className="w-full max-w-sm mx-auto text-center">
        <span className="text-[11px] text-neutral-400">
          Estimate based on standard formulas. Not medical advice.
        </span>
      </div>
    </div>
  );
};
