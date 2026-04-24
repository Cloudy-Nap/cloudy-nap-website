'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPercent,
  FiSave,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheck,
} from 'react-icons/fi';
import { API_BASE } from '../../lib/apiBase';

const CATEGORIES = [
  { id: 'bed', label: 'Beds (Mattresses)' },
  { id: 'accessory', label: 'Accessories' },
  { id: 'sofacumbed', label: 'Sofa cum bed' },
  { id: 'furniture', label: 'Furniture' },
];

const emptyForm = {
  discount_percent: '',
  start_immediate: true,
  starts_at: '',
  ends_at: '',
};

const CmsDiscountsPage = () => {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('bed');
  const [forms, setForms] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, { ...emptyForm }])),
  );
  const [stored, setStored] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      if (parsed.role !== 'admin' && !parsed.accesspages.includes('discounts')) {
        router.replace('/cms/dashboard');
        return;
      }
    } catch {
      router.replace('/cms/auth/login');
    }
  }, [router]);

  const loadDiscounts = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/cms/discounts`);
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        const hint =
          res.status === 404
            ? ' API route not found. In local dev, run Express (`npm run server` on port 3001) and use same-origin API (no NEXT_PUBLIC_API_URL) or set NEXT_PUBLIC_API_URL to that server.'
            : '';
        throw new Error(
          (typeof data?.error === 'string' && data.error) ||
            `Request failed (${res.status}).${hint}`,
        );
      }

      const byCat = {};
      const nextForms = Object.fromEntries(CATEGORIES.map((c) => [c.id, { ...emptyForm }]));

      for (const row of data.discounts || []) {
        const cat = row.category;
        if (!cat) continue;
        byCat[cat] = row;
        const start = row.starts_at ? new Date(row.starts_at) : null;
        const end = row.ends_at ? new Date(row.ends_at) : null;
        nextForms[cat] = {
          discount_percent: row.discount_percent != null ? String(row.discount_percent) : '',
          start_immediate: false,
          starts_at: start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 16) : '',
          ends_at: end && !Number.isNaN(end.getTime()) ? end.toISOString().slice(0, 16) : '',
        };
      }

      setStored(byCat);
      setForms(nextForms);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e.message || 'Could not load discounts.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const selected = CATEGORIES.find((c) => c.id === selectedId) || CATEGORIES[0];
  const form = forms[selected.id] || { ...emptyForm };

  const setField = (field, value) => {
    setForms((prev) => ({
      ...prev,
      [selected.id]: { ...prev[selected.id], [field]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const pct = Number(form.discount_percent);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      setMessage({ type: 'error', text: 'Enter a discount between 0.01 and 100.' });
      setSaving(false);
      return;
    }

    let endsAt = form.ends_at;
    if (!endsAt) {
      setMessage({ type: 'error', text: 'End date is required.' });
      setSaving(false);
      return;
    }

    if (!form.start_immediate && !form.starts_at) {
      setMessage({ type: 'error', text: 'Choose a start date or “Start immediately”.' });
      setSaving(false);
      return;
    }

    if (!form.start_immediate) {
      endsAt = new Date(form.ends_at).getTime();
      const starts = new Date(form.starts_at).getTime();
      if (endsAt <= starts) {
        setMessage({ type: 'error', text: 'End must be after start.' });
        setSaving(false);
        return;
      }
    } else {
      const ends = new Date(form.ends_at).getTime();
      if (ends <= Date.now()) {
        setMessage({ type: 'error', text: 'End date must be in the future.' });
        setSaving(false);
        return;
      }
    }

    const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
    const body = {
      discount_percent: pct,
      start_immediate: form.start_immediate,
      ends_at: new Date(form.ends_at).toISOString(),
    };
    if (!form.start_immediate) {
      body.starts_at = new Date(form.starts_at).toISOString();
    }

    try {
      const res = await fetch(`${API_BASE}/api/cms/discounts/${selected.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CMS-User-Id': String(cmsUser.id || ''),
          'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
          'X-CMS-User-Role': String(cmsUser.role || ''),
        },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Save failed');
      setMessage({ type: 'success', text: `Saved discount for ${selected.label}.` });
      await loadDiscounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(`Remove batch discount for ${selected.label}?`)) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
    try {
      const res = await fetch(`${API_BASE}/api/cms/discounts/${selected.id}`, {
        method: 'DELETE',
        headers: {
          'X-CMS-User-Id': String(cmsUser.id || ''),
          'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
          'X-CMS-User-Role': String(cmsUser.role || ''),
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Delete failed');
      setForms((prev) => ({
        ...prev,
        [selected.id]: { ...emptyForm, start_immediate: true },
      }));
      setMessage({ type: 'success', text: 'Discount removed.' });
      await loadDiscounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const row = stored[selected.id];
  let statusLabel = 'No promotion saved';
  if (row) {
    const start = new Date(row.starts_at);
    const end = new Date(row.ends_at);
    const pct = Number(row.discount_percent);
    if (now < start) statusLabel = `Scheduled: ${pct}% off from ${start.toLocaleString()} → ${end.toLocaleString()}`;
    else if (now > end) statusLabel = `Expired (${pct}% ended ${end.toLocaleString()})`;
    else statusLabel = `Live now: ${pct}% off until ${end.toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2"
            >
              <FiArrowLeft /> Dashboard
            </Link>
            <h1 className="text-3xl font-semibold text-white flex items-center gap-2">
              <FiPercent className="text-[#00aeef]" /> Batch discounts
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Apply a percentage off every product in a category for a date range. The storefront shows a badge and
              strikethrough pricing when the promotion is active.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDiscounts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold hover:bg-white/10"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-400 px-2">Category</p>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${
                  selectedId === c.id
                    ? 'bg-[#00aeef]/20 border-[#00aeef]/50 text-white'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            {loading ? (
              <p className="text-slate-400 text-sm">Loading…</p>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-4">{statusLabel}</p>
                <form onSubmit={handleSave} className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Discount %</span>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={form.discount_percent}
                      onChange={(e) => setField('discount_percent', e.target.value)}
                      className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white"
                      placeholder="e.g. 25"
                    />
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.start_immediate}
                      onChange={(e) => setField('start_immediate', e.target.checked)}
                      className="rounded border-white/40"
                    />
                    <span className="text-sm text-slate-200">Start immediately</span>
                  </label>

                  {!form.start_immediate && (
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Start date</span>
                      <input
                        type="datetime-local"
                        value={form.starts_at}
                        onChange={(e) => setField('starts_at', e.target.value)}
                        className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white"
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">End date</span>
                    <input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e) => setField('ends_at', e.target.value)}
                      className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white"
                    />
                  </label>

                  {message.text && (
                    <div
                      className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg border ${
                        message.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'
                          : 'bg-red-500/10 border-red-400/40 text-red-200'
                      }`}
                    >
                      {message.type === 'success' ? <FiCheck className="mt-0.5 shrink-0" /> : <FiAlertTriangle className="mt-0.5 shrink-0" />}
                      {message.text}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-[#00aeef] to-[#0284c7] text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <FiSave /> {saving ? 'Saving…' : 'Save promotion'}
                    </button>
                    {row && (
                      <button
                        type="button"
                        onClick={handleClear}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-400/50 text-red-200 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-60"
                      >
                        <FiTrash2 /> Clear
                      </button>
                    )}
                  </div>
                </form>

                <p className="text-xs text-slate-500 mt-6">
                  Create table <code className="text-slate-400">category_batch_discounts</code> in Supabase if saves
                  fail — see <code className="text-slate-400">supabase/category_batch_discounts.sql</code>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CmsDiscountsPage;
