'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, AlertTriangle, CheckCircle, Save, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialProfile, setInitialProfile] = useState<{ firstName: string; lastName: string; phone: string }>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile();
      if (data) {
        const f = data.firstName || '';
        const l = data.lastName || '';
        const p = data.phone || '';
        setFirstName(f);
        setLastName(l);
        setPhone(p);
        setInitialProfile({ firstName: f, lastName: l, phone: p });
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      toast.error(err.message || 'Failed to load profile details');
      setFirstName('');
      setLastName('');
      setPhone('');
      setInitialProfile({ firstName: '', lastName: '', phone: '' });
    } finally {
      setLoading(false);
    }
  };

  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const pNum = phone.trim();
    if (pNum && !/^\+?[0-9\s\-()]{7,15}$/.test(pNum)) {
      setPhoneError('Please enter a valid phone number (e.g. +91 98765 43210).');
      toast.error('Please enter a valid phone number.');
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload: any = {};
    const fName = firstName.trim();
    if (fName !== initialProfile.firstName) payload.firstName = fName;

    const lName = lastName.trim();
    if (lName !== initialProfile.lastName) payload.lastName = lName;

    if (pNum !== initialProfile.phone) payload.phone = pNum;

    if (Object.keys(payload).length === 0) {
      toast.info('No changes were made.');
      setSaving(false);
      return;
    }

    try {
      await api.updateProfile(payload);
      setInitialProfile({ firstName: fName, lastName: lName, phone: pNum });
      toast.success('Profile updated successfully!');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      toast.success('Account deleted');
      await logout();
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your identity, personal details, and account security.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            {user?.appRole === 'admin' ? 'Administrator' : 'Standard Account'}
          </span>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" /> Personal Details
          </h2>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  First Name <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. John"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Last Name <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'user@vehiclix.local'}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Email address is governed by your authentication provider.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Phone Number <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 transition-all ${
                    phoneError
                      ? 'border-rose-500/80 bg-rose-500/5 focus:ring-rose-500/20'
                      : 'border-slate-800 focus:ring-emerald-500'
                  }`}
                  placeholder="+91 98765 43210"
                />
              </div>
              {phoneError && (
                <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Danger Zone
              </h3>
              <p className="text-sm text-slate-400 max-w-xl">
                Permanently delete your Vehiclix account and all associated vehicles, service logs, and expense records. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 active:scale-[0.98] transition-all"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Account?</h3>
                <p className="text-xs text-slate-400">All data will be permanently wiped.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete your Vehiclix account? Your garage, fuel logs, maintenance history, and trip records will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50 shadow-lg shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
