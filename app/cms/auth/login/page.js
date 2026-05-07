'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiLogIn, FiShield, FiArrowRightCircle } from 'react-icons/fi';
import Link from 'next/link';
import { API_BASE } from '../../../lib/apiBase';

const CmsLoginPage = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedSession = window.localStorage.getItem('cmsSession');
    const storedUser = window.localStorage.getItem('cmsUser');

    if (storedSession && storedUser) {
      router.replace('/cms/dashboard');
    }
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError('Please enter both identifier and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/cms/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          password: trimmedPassword,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
      setError(payload.error || 'Unable to log in. Please check your credentials.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cmsSession', JSON.stringify(payload.session));
      window.localStorage.setItem('cmsUser', JSON.stringify(payload.user));
    }

    setSuccess('Login successful. You may proceed to the CMS dashboard.');
    setPassword('');
    
    // Redirect based on user's access pages
    const user = payload.user;
    const accessPages = user.accesspages || [];
    
    // Admin users go to dashboard, others go to their first accessible page
    if (user.role === 'admin' || accessPages.includes('dashboard')) {
      router.replace('/cms/dashboard');
    } else if (accessPages.length > 0) {
      const firstPage = accessPages[0];
      const pageMap = {
        products: '/cms/products',
        orders: '/cms/orders',
        inventory: '/cms/inventory',
        customers: '/cms/customers',
        discounts: '/cms/discounts',
        deals: '/cms/deals',
        settings: '/cms/settings',
      };
      const redirectPath = pageMap[firstPage] || '/cms/dashboard';
      router.replace(redirectPath);
    } else {
      router.replace('/cms/dashboard');
    }
    } catch (err) {
      console.error('CMS login error:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent flex items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/80 overflow-hidden">
        <div className="hidden lg:flex flex-col justify-between bg-linear-to-br from-blue-600 via-blue-700 to-blue-900 text-white px-10 py-12 border-r border-blue-500/30">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-blue-100">
              <FiShield className="text-white" />
              Secure Access
            </p>
            <h1 className="mt-4 text-3xl font-bold">CMS Control Center</h1>
            <p className="mt-3 text-sm text-blue-100 leading-relaxed">
              Manage products, orders, and inventory across your hi-tech storefront with a single, powerful dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <FiLock />
              </span>
              <div>
                <p className="text-sm font-semibold">Enterprise grade security</p>
                <p className="text-xs text-blue-100">Protected with service-role credentials and auditing.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <FiArrowRightCircle />
              </span>
              <div>
                <p className="text-sm font-semibold">Fast workflows</p>
                <p className="text-xs text-blue-100">Jump into dashboards the moment you authenticate.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 sm:px-10 py-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-xs uppercase tracking-[0.25em] text-blue-800">
              <FiLogIn className="text-blue-600" />
              Sign in
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Welcome back, Administrator</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use your CMS credentials to continue. Need access? Contact your hi-tech platform owner.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700">
                Email or Username
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  disabled={loading}
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-lg px-4 py-3 pr-12 text-sm placeholder:text-slate-400 text-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="admin@example.com"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <FiShield />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-lg px-4 py-3 pr-12 text-sm placeholder:text-slate-400 text-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <FiLock />
                </span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-500 text-center leading-5">
            Ensure that your CMS user exists in the <code className="text-slate-700 bg-slate-100 px-1 rounded">cmsusers</code> table with accurate credentials.
            {` `}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
              Return to storefront
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CmsLoginPage;