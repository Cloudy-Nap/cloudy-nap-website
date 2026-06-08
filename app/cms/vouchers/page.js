'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiTag,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheck,
  FiCopy,
} from 'react-icons/fi';
import { API_BASE } from '../../lib/apiBase';

const emptyForm = {
  name: '',
  code: '',
  discount_percent: '',
  notes: '',
};

const cmsHeaders = () => {
  if (typeof window === 'undefined') return {};
  const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
  return {
    'Content-Type': 'application/json',
    'X-CMS-User-Id': String(cmsUser.id || ''),
    'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
    'X-CMS-User-Role': String(cmsUser.role || ''),
  };
};

const CmsVouchersPage = () => {
  const router = useRouter();
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = window.localStorage.getItem('cmsUser');
    const storedSession = window.localStorage.getItem('cmsSession');
    if (!storedUser || !storedSession) {
      router.replace('/cms/auth/login');
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (!Array.isArray(parsed.accesspages)) parsed.accesspages = [];
      if (parsed.role !== 'admin' && !parsed.accesspages.includes('vouchers')) {
        router.replace('/cms/dashboard');
      }
    } catch {
      router.replace('/cms/auth/login');
    }
  }, [router]);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/cms/vouchers`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load vouchers (${res.status})`);
      }
      setVouchers(Array.isArray(data.vouchers) ? data.vouchers : []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Could not load vouchers.' });
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/cms/vouchers`, {
        method: 'POST',
        headers: cmsHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create voucher.');
      }
      setForm({ ...emptyForm });
      setMessage({
        type: 'success',
        text: `Voucher "${data.voucher?.code}" created. Share this one-time code with your customer.`,
      });
      await loadVouchers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create voucher.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (voucher) => {
    if (!voucher?.id) return;
    if (voucher.is_used) return;
    if (!window.confirm(`Delete unused voucher ${voucher.code}?`)) return;

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/cms/vouchers/${voucher.id}`, {
        method: 'DELETE',
        headers: cmsHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Delete failed.');
      }
      setMessage({ type: 'success', text: 'Voucher deleted.' });
      await loadVouchers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Could not copy to clipboard.' });
    }
  };

  const availableCount = vouchers.filter((v) => !v.is_used).length;
  const usedCount = vouchers.filter((v) => v.is_used).length;

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-2"
            >
              <FiArrowLeft /> Dashboard
            </Link>
            <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-2">
              <FiTag className="text-blue-600" /> Vouchers
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Create one-time discount codes with a custom name and percentage off. Each code works once at checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={loadVouchers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 transition disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
              message.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {message.type === 'error' ? <FiAlertTriangle className="mt-0.5 shrink-0" /> : <FiCheck className="mt-0.5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <FiPlus className="text-blue-600" /> New voucher
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. VIP Customer — Summer"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Code</span>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. VIP20OFF"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 font-mono uppercase"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Discount %</span>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.discount_percent}
                  onChange={(e) => setForm((prev) => ({ ...prev, discount_percent: e.target.value }))}
                  placeholder="e.g. 20"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Notes (optional)</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Who is this for?"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create voucher'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500 uppercase">Total</p>
                <p className="text-2xl font-bold text-slate-900">{vouchers.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs text-emerald-700 uppercase">Available</p>
                <p className="text-2xl font-bold text-emerald-800">{availableCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500 uppercase">Used</p>
                <p className="text-2xl font-bold text-slate-700">{usedCount}</p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 text-sm">
                Loading vouchers…
              </div>
            ) : vouchers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 text-sm">
                No vouchers yet. Create one on the left to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {vouchers.map((voucher) => (
                  <article
                    key={voucher.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{voucher.name}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            voucher.is_used
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {voucher.is_used ? 'Used' : 'Available'}
                        </span>
                      </div>
                      <p className="font-mono text-lg font-bold text-blue-700 tracking-wide">{voucher.code}</p>
                      <p className="text-sm text-slate-600">
                        {Number(voucher.discount_percent)}% off • one-time use
                      </p>
                      {voucher.notes && <p className="text-xs text-slate-500">{voucher.notes}</p>}
                      {voucher.is_used && voucher.used_at && (
                        <p className="text-xs text-slate-400">
                          Redeemed{' '}
                          {new Date(voucher.used_at).toLocaleString('en-PK', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                          {voucher.used_by_order_id ? ` • Order #${voucher.used_by_order_id}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyCode(voucher.code)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <FiCopy />
                        {copiedCode === voucher.code ? 'Copied' : 'Copy code'}
                      </button>
                      {!voucher.is_used && (
                        <button
                          type="button"
                          onClick={() => handleDelete(voucher)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CmsVouchersPage;
