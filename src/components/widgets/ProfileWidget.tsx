import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, LogOut, User, ChevronDown, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileWidgetProps {
  className?: string;
}

export function ProfileWidget({ className = '' }: ProfileWidgetProps) {
  const { currentUser, isVaultUnlocked, isGuestMode, lockVault, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser
    ? currentUser.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 min-h-[44px] rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Profile and Security"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isVaultUnlocked
            ? 'bg-gradient-to-br from-primary to-accent text-white'
            : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
          {initials}
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <Shield className={`w-3.5 h-3.5 ${isVaultUnlocked ? 'text-emerald-500' : 'text-slate-400'}`} />
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                isVaultUnlocked
                  ? 'bg-gradient-to-br from-primary to-accent text-white'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {currentUser?.username || 'Guest'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser?.email || 'Not signed in'}
                </p>
              </div>
            </div>
            {/* Security Status */}
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              isGuestMode
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : isVaultUnlocked
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {isGuestMode ? (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Guest Mode (Dev)</span>
                </>
              ) : isVaultUnlocked ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Vault Unlocked</span>
                  {currentUser?.authMethod === 'fido2_passkey' && <Fingerprint className="w-3.5 h-3.5 ml-auto" />}
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Vault Locked</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            {isVaultUnlocked && (
              <button
                onClick={() => { lockVault(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <Lock className="w-4 h-4" />
                Lock Vault
              </button>
            )}
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
