import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Mail, Lock, ArrowRight, AlertCircle, Shield, Zap, Globe } from 'lucide-react';
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
      
      // Auto-submit pending draft quote if any
      const draftKey = localStorage.getItem('kargopath_draft_key');
      if (draftKey) {
        try {
          const req = await quotationRequestAPI.submitDraft(draftKey);
          localStorage.removeItem('kargopath_draft_key');
          navigate('/dashboard', { replace: true, state: { quoteSubmitted: true, reference: req.reference_no } });
          return;
        } catch (apiErr) {
          console.error("Auto-submit draft failed:", apiErr);
          localStorage.removeItem('kargopath_draft_key');
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
    <div className="min-h-screen bg-white font-sans flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center rounded-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-bold text-white">KargoPath</span>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
              Sign In to KargoPath
            </h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Manage your shipments, quotations, and tracking in one place.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="space-y-6">
            {[
              { icon: Zap, title: 'Instant Quotations', desc: 'Get freight quotes in 2-4 hours' },
              { icon: Globe, title: 'Global Network', desc: '50+ countries, 200+ partners' },
              { icon: Shield, title: 'Secure & Compliant', desc: 'Licensed PPJK customs broker' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">{item.title}</h3>
                  <p className="text-blue-300 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Trusted By</p>
          <div className="flex flex-wrap gap-4 opacity-60">
            {['IATA', 'FIATA', 'GAFEKSI', 'BEA CUKAI'].map(badge => (
              <div key={badge} className="px-4 py-2 border border-white/20 rounded text-white text-xs font-bold tracking-wider">
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">KargoPath</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-slate-600">
              Access your logistics dashboard
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" 
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white outline-none transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-sm font-bold text-blue-600 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white outline-none transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-600"
              />
              <label htmlFor="remember" className="ml-2 text-sm font-medium text-slate-700">
                Remember me for 30 days
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Create a free account →
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Secure Login</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your connection is encrypted. We never store your password in plain text.
              </p>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-slate-500 mt-6">
            By signing in, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
