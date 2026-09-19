'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Car, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { Input, Button } from '../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) {
      toast.error('Please resolve the highlighted errors.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      toast.success('Account created successfully! Welcome to Vehiclix.');
      router.push('/garage');
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-[18px] border border-white/[0.08] bg-slate-900/70 p-8 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
            <Car className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Create Vehiclix Account</h2>
          <p className="mt-1 text-sm text-slate-400">Join the vehicle and fuel intelligence platform</p>
        </div>

        {error && (
          <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            label="Email"
            required
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={fieldErrors.email}
            placeholder="user@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />

          <Input
            label="Password"
            required
            type="password"
            showPasswordToggle
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            placeholder="At least 6 characters"
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            loadingText="Creating Account..."
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Get Started Free
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
