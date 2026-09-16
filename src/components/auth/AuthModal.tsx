import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from '../../lib/webauthn';
import { Shield, User, Lock, KeyRound, Fingerprint, Eye, EyeOff, Loader2, Zap, UserX } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signUp, loginWithPassword, loginWithFIDO2, loginAsDemo, loginAsGuest, isAuthenticating, isFirstTimeUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    // Auto-detect: if no users exist, start on signup
    return isFirstTimeUser === true ? 'signup' : 'login';
  });

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enableFIDO2, setEnableFIDO2] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [error, setError] = useState('');
  const [fido2Supported, setFido2Supported] = useState(false);

  React.useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setFido2Supported);
  }, []);

  // Switch to signup when first-time user is confirmed
  React.useEffect(() => {
    if (isFirstTimeUser === true) {
      setMode('signup');
    }
  }, [isFirstTimeUser]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginUsername || !loginPassword || loginPin.length !== 6) {
      setError('All fields required. PIN must be 6 digits.');
      return;
    }
    const success = await loginWithPassword(loginUsername, loginPassword, loginPin);
    if (!success) setError('Invalid credentials. Please try again.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signupUsername || !signupEmail || signupPassword.length < 8) {
      setError('Username, email, and password (min 8 chars) required.');
      return;
    }
    if (signupPin.length !== 6 || signupPin !== confirmPin) {
      setError('PIN must be 6 digits and match confirmation.');
      return;
    }
    try {
      await signUp(signupUsername, signupEmail, signupPassword, signupPin, enableFIDO2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    }
  };

  const handleFIDO2Login = async () => {
    setError('');
    const success = await loginWithFIDO2();
    if (!success) setError('FIDO2 authentication failed.');
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      await loginAsDemo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-label="Authentication">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Unlock Vault' : 'Create Vault'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zero-backend encrypted authentication
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="px-6 pt-4 pb-2 space-y-2">
          <button
            onClick={handleDemoLogin}
            disabled={isAuthenticating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isAuthenticating ? 'Setting up...' : '1-Click Dev Demo Login'}
          </button>
          <button
            onClick={loginAsGuest}
            disabled={isAuthenticating}
            className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <UserX className="w-4 h-4" />
            Continue as Local Guest
          </button>
        </div>

        {/* Divider */}
        <div className="px-6 py-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or sign in with credentials</span>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'login'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'signup'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">6-Digit 2FA PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none tracking-[0.5em] text-center"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isAuthenticating ? 'Authenticating...' : 'Unlock Vault'}
              </button>

              {fido2Supported && (
                <button
                  type="button"
                  onClick={handleFIDO2Login}
                  disabled={isAuthenticating}
                  className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Fingerprint className="w-4 h-4" />
                  Sign in with Biometrics
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={e => setSignupUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Choose a username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Master Password (min 8 chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">6-Digit 2FA PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={signupPin}
                    onChange={e => setSignupPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none tracking-[0.5em] text-center"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Confirm PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none tracking-[0.5em] text-center"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>

              {fido2Supported && (
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={enableFIDO2} onChange={e => setEnableFIDO2(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Enable Biometric Passkey</span>
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {isAuthenticating ? 'Creating Vault...' : 'Create Encrypted Vault'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
            All data encrypted locally with WebCrypto AES-256-GCM. No data leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}
