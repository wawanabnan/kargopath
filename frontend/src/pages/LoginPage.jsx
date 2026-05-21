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
  // Detect context: came from quote flow = first-timer likely, else returning user
  const fromQuote  = location.state?.from === '/dashboard' || !!location.state?.quotePending;

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
      
      // Auto-submit pending quote if any
      const pending = localStorage.getItem('kargopath_pending_quote');
      if (pending) {
        try {
          const data = JSON.parse(pending);
          const req = await quotationRequestAPI.submit(data);
          localStorage.removeItem('kargopath_pending_quote');
          navigate('/dashboard', { replace: true, state: { quoteSubmitted: true, reference: req.reference_no } });
          return;
        } catch (apiErr) {
          console.error("Auto-submit pending quote failed:", apiErr);
        }
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-blue-700 to-sky-500 rounded-b-[80px] z-0"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl z-0"></div>

      <div className="w-full max-w-md z-10">
        {/* Back to home */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-blue-900/20 mb-5 hover:scale-105 transition-transform">
            <Package className="w-8 h-8 text-blue-600" />
          </Link>

          {/* Dynamic greeting */}
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Sign in to KargoPath
          </h1>
          <p className="text-blue-100 font-medium">
            New here?{' '}
            <Link to="/register" className="text-white font-bold underline underline-offset-2 hover:text-blue-200 transition-colors">
              Create a free account
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-5 h-5" /></div>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" autoComplete="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-sm font-bold text-blue-600 hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-5 h-5" /></div>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Signing in...</span>
                : <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">Create one for free →</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-blue-200 mt-6">
          By signing in, you agree to KargoPath's{' '}
          <a href="#" className="underline">Terms of Service</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
