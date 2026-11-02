import React, { useEffect, useRef, useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { User, UserRole } from '../types';

type GoogleIdentity = { accounts?: { id?: { initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: object) => void } } };

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  allUsers: User[];
  initialUsername?: string;
  defaultRole?: UserRole;
  onOpenRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, initialUsername = '', defaultRole, onOpenRegister }) => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pendingPasswordSetup, setPendingPasswordSetup] = useState<{ email: string; token: string } | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setUsername(initialUsername); }, [initialUsername]);
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setVerificationEmail('');
      setVerificationCode('');
      setIsRequestingReset(false);
      setPasswordResetEmail('');
      setResetCode('');
      setNewPassword('');
      setPendingPasswordSetup(null);
    }
  }, [isOpen]);

  const completeLogin = (user: User) => {
    if (defaultRole && user.role !== defaultRole) { setError('Choose the login option for this account type.'); return; }
    onSuccess(user); onClose();
  };

  const handleGoogleCredential = async (credential: string) => {
    setError(''); setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
      const result = await response.json();
      if (response.ok && result.success) completeLogin(result.user);
      else setError(result.error || 'Google sign-in failed.');
    } catch { setError('Google sign-in failed.'); }
    finally { setIsSubmitting(false); }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) { setError('Enter the six-digit code sent to your email.'); return; }
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.passwordSetupToken) {
        setVerificationEmail('');
        setVerificationCode('');
        setNewPassword('');
        setPendingPasswordSetup({ email: verificationEmail, token: String(result.passwordSetupToken) });
      } else setError(result.error || 'Unable to verify this email address.');
    } catch { setError('Network error while verifying your email.'); }
    finally { setIsSubmitting(false); }
  };

  const setInitialPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingPasswordSetup || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/password-setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingPasswordSetup.email, token: pendingPasswordSetup.token, password: newPassword }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.user) {
        setPendingPasswordSetup(null);
        setNewPassword('');
        completeLogin(result.user);
      } else setError(result.error || 'Unable to save your password. Please try again.');
    } catch { setError('Network error while saving your password.'); }
    finally { setIsSubmitting(false); }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const result = await response.json();
      setError(response.ok && result.success ? 'A new verification code has been sent.' : result.error || 'Unable to resend the verification code.');
    } catch { setError('Network error while resending the verification code.'); }
    finally { setIsSubmitting(false); }
  };

  const requestPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = passwordResetEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter the Gmail address registered with your account.'); return; }
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setPasswordResetEmail(email);
        setIsRequestingReset(false);
        setResetCode('');
        setNewPassword('');
        setError('');
      } else setError(result.error || 'Unable to send a password-reset code.');
    } catch { setError('Network error while requesting a password-reset code.'); }
    finally { setIsSubmitting(false); }
  };

  const confirmPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(resetCode)) { setError('Enter the six-digit code sent to your email.'); return; }
    if (newPassword.length < 6) { setError('Your new password must be at least 6 characters.'); return; }
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: passwordResetEmail, code: resetCode, password: newPassword }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setUsername(passwordResetEmail);
        setPassword('');
        setPasswordResetEmail('');
        setResetCode('');
        setNewPassword('');
        setError('Your password was changed. Sign in with your new password.');
      } else setError(result.error || 'Unable to change your password.');
    } catch { setError('Network error while changing your password.'); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    if (!isOpen || verificationEmail || isRequestingReset || passwordResetEmail || pendingPasswordSetup || !googleButtonRef.current) return;
    let disposed = false;
    const loadGoogleButton = async () => {
      const configResponse = await fetch('/api/auth/google-config');
      const { clientId } = await configResponse.json();
      const googleIdentity = () => (window as unknown as { google?: GoogleIdentity }).google;
      if (!clientId || disposed) return;
      if (!googleIdentity()?.accounts?.id) await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
        script.onload = () => resolve(); script.onerror = () => reject(); document.head.appendChild(script);
      }).catch(() => undefined);
      if (!disposed && googleIdentity()?.accounts?.id && googleButtonRef.current) {
        googleButtonRef.current.replaceChildren();
        googleIdentity()!.accounts!.id!.initialize({ client_id: clientId, callback: (response) => void handleGoogleCredential(response.credential) });
        googleIdentity()!.accounts!.id!.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
      }
    };
    void loadGoogleButton();
    return () => { disposed = true; };
  }, [isOpen, verificationEmail, isRequestingReset, passwordResetEmail, pendingPasswordSetup]);

  if (!isOpen) return null;

  if (pendingPasswordSetup) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E1D8] bg-white p-6"><div><h2 className="text-xl font-bold text-[#2D2926]">Create your password</h2><p className="mt-1 text-xs text-[#8C867E]">Your email is verified. Set a password to finish signing in.</p></div><button type="button" onClick={onClose} className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div><form onSubmit={setInitialPassword} className="space-y-4 p-6">{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}<label className="block text-xs font-bold text-[#423E3B]">New password<input autoFocus required type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 6 characters" className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm" /></label><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Create password and sign in'}</button></form></div></div>;
  }

  if (passwordResetEmail) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E1D8] bg-white p-6"><div><h2 className="text-xl font-bold text-[#2D2926]">Set a new password</h2><p className="mt-1 text-xs text-[#8C867E]">Enter the six-digit code sent to {passwordResetEmail}.</p></div><button type="button" onClick={onClose} className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div><form onSubmit={confirmPasswordReset} className="space-y-4 p-6">{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}<label className="block text-xs font-bold text-[#423E3B]">OTP code<input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em]" /></label><label className="block text-xs font-bold text-[#423E3B]">New password<input required type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm" /></label><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Change password'}</button><button type="button" disabled={isSubmitting} onClick={() => { setPasswordResetEmail(''); setIsRequestingReset(true); setError(''); }} className="w-full text-xs font-bold text-[#8B5E3C] disabled:opacity-50">Send a new code</button></form></div></div>;
  }

  if (isRequestingReset) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E1D8] bg-white p-6"><div><h2 className="text-xl font-bold text-[#2D2926]">Forgot password?</h2><p className="mt-1 text-xs text-[#8C867E]">We’ll send a six-digit OTP to your registered Gmail address.</p></div><button type="button" onClick={onClose} className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div><form onSubmit={requestPasswordReset} className="space-y-4 p-6">{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}<label className="block text-xs font-bold text-[#423E3B]">Registered Gmail address<input required type="email" autoFocus autoComplete="email" value={passwordResetEmail} onChange={(event) => setPasswordResetEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm" /></label><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'Sending...' : 'Send OTP'}</button><button type="button" disabled={isSubmitting} onClick={() => { setIsRequestingReset(false); setError(''); }} className="w-full text-xs font-bold text-[#8B5E3C] disabled:opacity-50">Back to sign in</button></form></div></div>;
  }

  if (verificationEmail) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E1D8] bg-white p-6"><div><h2 className="text-xl font-bold text-[#2D2926]">Verify your email</h2><p className="mt-1 text-xs text-[#8C867E]">Enter the six-digit code sent to {verificationEmail}.</p></div><button type="button" onClick={onClose} className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div><form onSubmit={handleVerifyEmail} className="space-y-4 p-6">{error && <p className={`rounded-xl border p-3 text-xs ${error.startsWith('A new') ? 'border-[#D2E0D0] bg-[#EBF2EA] text-[#5C6E58]' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</p>}<label className="block text-xs font-bold text-[#423E3B]">Verification code<input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em]" /></label><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'Verifying...' : 'Verify and sign in'}</button><button type="button" disabled={isSubmitting} onClick={handleResendVerification} className="w-full text-xs font-bold text-[#8B5E3C] disabled:opacity-50">Resend code</button></form></div></div>;
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) { setError('Enter your username and password.'); return; }
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) });
      const result = await response.json();
      if (response.ok && result.success) {
        completeLogin(result.user);
      } else if (result.requiresEmailVerification && result.email) {
        // Registration may have completed in an earlier session. Take the user
        // to the OTP screen, where they can also request a fresh code.
        setVerificationEmail(String(result.email));
        setVerificationCode('');
        setError('');
      } else {
        setError(result.error || 'Unable to sign in.');
      }
    } catch { setError('Network error during login.'); }
    finally { setIsSubmitting(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E1D8] bg-white p-6"><div><span className="rounded-full border border-[#D2E0D0] bg-[#EBF2EA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C6E58]">Karmyogi Auth</span><h2 className="mt-1 text-xl font-bold text-[#2D2926]">Log In to Your Account</h2></div><button onClick={onClose} className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div><form onSubmit={handleLogin} className="space-y-4 p-6">{error && <div className={`rounded-xl border p-3 text-xs ${error.startsWith('Your password was changed') ? 'border-[#D2E0D0] bg-[#EBF2EA] text-[#5C6E58]' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</div>}{defaultRole && <p className="rounded-lg bg-[#EBF2EA] px-3 py-2 text-xs font-semibold text-[#5C6E58]">Signing in as: {defaultRole === 'worker' ? 'Worker' : 'Hire a worker'}</p>}<div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#423E3B]">Username</label><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-[#E5E1D8] bg-white px-3.5 py-2.5 text-sm" /></div><div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#423E3B]">Password</label><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#E5E1D8] bg-white px-3.5 py-2.5 text-sm" /><button type="button" onClick={() => { setIsRequestingReset(true); setPasswordResetEmail(username.includes('@') ? username : ''); setError(''); }} className="mt-2 text-xs font-bold text-[#8B5E3C]">Forgot password?</button></div><button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50"><LogIn className="h-4 w-4" />{isSubmitting ? 'Please wait...' : 'Sign In'}</button><div ref={googleButtonRef} className="flex justify-center" /><div className="border-t border-[#E5E1D8] pt-3 text-center text-xs text-[#8C867E]">New to Karmyogi? <button type="button" onClick={() => { onClose(); onOpenRegister(); }} className="font-bold text-[#8B5E3C]">Register</button></div></form></div></div>;
};
