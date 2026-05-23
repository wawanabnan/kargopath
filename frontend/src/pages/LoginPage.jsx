import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI } from '../api';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);

      const draftKey = localStorage.getItem('kargopath_draft_key');
      if (draftKey) {
        try {
          const req = await quotationRequestAPI.submitDraft(draftKey);
          localStorage.removeItem('kargopath_draft_key');
          navigate('/dashboard', { replace: true, state: { quoteSubmitted: true, reference: req.reference_no } });
          return;
        } catch {
          localStorage.removeItem('kargopath_draft_key');
        }
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans overflow-x-hidden">

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Package className="w-5 h-5 text-blue-600" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">KargoPath</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <h1 className="text-sm font-bold text-slate-900">Sign In</h1>
            <p className="text-xs text-slate-500 mt-0.5">Access your logistics dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Password
                </label>
                <a href="#" className="text-xs text-blue-600 hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          By signing in you agree to our{' '}
          <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
