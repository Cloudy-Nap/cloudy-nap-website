'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiGift,
  FiEdit2,
  FiX,
} from 'react-icons/fi';
import { API_BASE } from '../../lib/apiBase';

const CATALOG_OPTIONS = [
  { id: 'bed', label: 'Mattresses / beds' },
  { id: 'accessory', label: 'Accessories & pillows' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'sofacumbed', label: 'Sofa cum bed' },
];

const SUB_FOR_TYPE = {
  bed: 'matteress',
  accessory: 'accessories',
  furniture: 'furniture',
  sofacumbed: 'sofa-cum-bed',
};

const emptyLine = () => ({
  catalog_type: 'bed',
  product_id: '',
  quantity: 1,
  is_free: false,
  label: '',
});

const CmsDealsPage = () => {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState([emptyLine()]);
  const [pickerOptions, setPickerOptions] = useState({});
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [coverExisting, setCoverExisting] = useState('');

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
      if (parsed.role !== 'admin' && !parsed.accesspages.includes('deals')) {
        router.replace('/cms/dashboard');
      }
    } catch {
      router.replace('/cms/auth/login');
    }
  }, [router]);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/cms/deals`);
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setDeals(Array.isArray(data.deals) ? data.deals : []);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e.message || 'Could not load deals.' });
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const loadPickerForLine = useCallback(async (lineIndex, catalogType) => {
    const sub = SUB_FOR_TYPE[catalogType];
    if (!sub) return;
    const key = `${lineIndex}-${catalogType}`;
    setPickerOptions((prev) => ({ ...prev, [key]: { loading: true, list: prev[key]?.list || [] } }));
    try {
      const url = new URL(`${API_BASE}/api/products`);
      url.searchParams.set('subcategory', sub);
      const res = await fetch(url.toString());
      const payload = await res.json();
      const list = Array.isArray(payload)
        ? payload.map((p) => ({
            id: p.id != null ? String(p.id) : '',
            name: p.name || `Product ${p.id}`,
          }))
        : [];
      setPickerOptions((prev) => ({ ...prev, [key]: { loading: false, list } }));
    } catch {
      setPickerOptions((prev) => ({ ...prev, [key]: { loading: false, list: [] } }));
    }
  }, []);

  const lineKeys = lines.map((l, i) => `${i}:${l.catalog_type}`).join('|');
  useEffect(() => {
    lines.forEach((line, i) => {
      if (SUB_FOR_TYPE[line.catalog_type]) {
        loadPickerForLine(i, line.catalog_type);
      }
    });
  }, [lineKeys, loadPickerForLine]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDealPrice('');
    setSortOrder('0');
    setIsActive(true);
    setLines([emptyLine()]);
    setPickerOptions({});
    setExistingImages([]);
    setNewFiles([]);
    setCoverExisting('');
  };

  const startEdit = (deal) => {
    setEditingId(deal.id);
    setTitle(deal.title || '');
    setDescription(typeof deal.description === 'string' ? deal.description : '');
    setDealPrice(deal.deal_price != null ? String(deal.deal_price) : '');
    setSortOrder(deal.sort_order != null ? String(deal.sort_order) : '0');
    setIsActive(Boolean(deal.is_active));
    const rawItems = Array.isArray(deal.items) ? deal.items : [];
    setLines(
      rawItems.length
        ? rawItems.map((it) => ({
            catalog_type: it.catalog_type || 'bed',
            product_id: it.product_id != null ? String(it.product_id) : '',
            quantity: Math.max(1, Number(it.quantity) || 1),
            is_free: Boolean(it.is_free),
            label: typeof it.label === 'string' ? it.label : '',
          }))
        : [emptyLine()],
    );
    setPickerOptions({});
    const imgs = Array.isArray(deal.image_urls) ? deal.image_urls.filter(Boolean) : [];
    const list = imgs.length ? imgs : deal.image ? [deal.image] : [];
    setExistingImages(list);
    const cover = deal.image && list.includes(deal.image) ? deal.image : list[0] || '';
    setCoverExisting(cover);
    setNewFiles([]);
    setMessage({ type: '', text: '' });
  };

  const cmsHeaders = () => {
    const cmsUser = JSON.parse(typeof window !== 'undefined' ? window.localStorage.getItem('cmsUser') || '{}' : '{}');
    return {
      'X-CMS-User-Id': String(cmsUser.id || ''),
      'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
      'X-CMS-User-Role': String(cmsUser.role || ''),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    const priceNum = Number(dealPrice);
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required.' });
      setSaving(false);
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setMessage({ type: 'error', text: 'Enter a valid deal price (PKR).' });
      setSaving(false);
      return;
    }
    const builtItems = lines
      .filter((l) => l.product_id)
      .map((l) => ({
        catalog_type: l.catalog_type,
        product_id: String(l.product_id),
        quantity: Math.max(1, Math.floor(Number(l.quantity) || 1)),
        is_free: Boolean(l.is_free),
        ...(l.label.trim() ? { label: l.label.trim() } : {}),
      }));
    if (!builtItems.length) {
      setMessage({ type: 'error', text: 'Add at least one catalog product to the package.' });
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('deal_price', String(priceNum));
    formData.append('sort_order', String(Math.floor(Number(sortOrder) || 0)));
    formData.append('is_active', isActive ? 'true' : 'false');
    formData.append('items', JSON.stringify(builtItems));
    if (editingId) {
      formData.append('existingImages', JSON.stringify(existingImages));
      if (coverExisting) {
        formData.append('coverExisting', coverExisting);
      }
    }
    newFiles.forEach((f) => formData.append('images', f));

    try {
      const url = editingId
        ? `${API_BASE}/api/cms/deals/${encodeURIComponent(editingId)}`
        : `${API_BASE}/api/cms/deals`;
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: cmsHeaders(),
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Save failed');
      setMessage({ type: 'success', text: editingId ? 'Deal updated.' : 'Deal created.' });
      resetForm();
      await loadDeals();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deal?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/cms/deals/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: cmsHeaders(),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Delete failed');
      if (editingId === id) resetForm();
      await loadDeals();
      setMessage({ type: 'success', text: 'Deal removed.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete failed.' });
    }
  };

  const updateLine = (index, patch) => {
    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    if (patch.catalog_type !== undefined) {
      const ct = patch.catalog_type;
      setPickerOptions((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${index}-`)) delete next[k];
        });
        return next;
      });
      loadPickerForLine(index, ct);
    }
  };

  const onProductSelect = (index, productId) => {
    const line = lines[index];
    const key = `${index}-${line.catalog_type}`;
    const opt = (pickerOptions[key]?.list || []).find((p) => p.id === productId);
    updateLine(index, {
      product_id: productId,
      label: opt?.name || '',
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <FiArrowLeft />
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <FiGift className="text-[#38bdf8] text-xl" />
            <h1 className="text-xl font-semibold text-white">Deal packages</h1>
          </div>
          <button
            type="button"
            onClick={loadDeals}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {message.text && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-500/15 text-red-200 border border-red-500/30'
                : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              {editingId ? 'Edit deal' : 'Create deal'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
              >
                <FiX />
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Title</span>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Queen mattress + 2 pillows"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Deal price (PKR)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-white"
                  value={dealPrice}
                  onChange={(e) => setDealPrice(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">Description</span>
              <textarea
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-white min-h-[88px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What the customer gets in this bundle…"
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Sort order</span>
                <input
                  type="number"
                  className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-white"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 mt-6 sm:mt-8">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-white/30"
                />
                <span className="text-sm text-slate-200">Active on storefront</span>
              </label>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Package items</p>
              <div className="space-y-3">
                {lines.map((line, index) => {
                  const key = `${index}-${line.catalog_type}`;
                  const picker = pickerOptions[key] || { loading: true, list: [] };
                  return (
                    <div
                      key={index}
                      className="flex flex-wrap gap-3 items-end p-4 rounded-xl bg-slate-950/80 border border-white/10"
                    >
                      <label className="space-y-1 min-w-[160px]">
                        <span className="text-xs text-slate-500">Category</span>
                        <select
                          className="w-full rounded-lg bg-slate-900 border border-white/15 px-2 py-2 text-sm text-white"
                          value={line.catalog_type}
                          onChange={(e) =>
                            updateLine(index, { catalog_type: e.target.value, product_id: '', label: '' })
                          }
                        >
                          {CATALOG_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id} className="text-black">
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 flex-1 min-w-[200px]">
                        <span className="text-xs text-slate-500">Product</span>
                        <select
                          className="w-full rounded-lg bg-slate-900 border border-white/15 px-2 py-2 text-sm text-white"
                          value={line.product_id}
                          onChange={(e) => onProductSelect(index, e.target.value)}
                        >
                          <option value="">{picker.loading ? 'Loading…' : 'Select product'}</option>
                          {picker.list.map((p) => (
                            <option key={p.id} value={p.id} className="text-black">
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 w-24">
                        <span className="text-xs text-slate-500">Qty</span>
                        <input
                          type="number"
                          min="1"
                          className="w-full rounded-lg bg-slate-900 border border-white/15 px-2 py-2 text-sm text-white"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                        />
                      </label>
                      <label className="flex items-center gap-2 pb-2">
                        <input
                          type="checkbox"
                          checked={line.is_free}
                          onChange={(e) => updateLine(index, { is_free: e.target.checked })}
                        />
                        <span className="text-xs text-slate-300">Free add-on</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLines((prev) => {
                            const next = prev.filter((_, i) => i !== index);
                            return next.length ? next : [emptyLine()];
                          });
                        }}
                        className="p-2 rounded-lg text-red-300 hover:bg-red-500/10"
                        aria-label="Remove line"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="mt-3 inline-flex items-center gap-2 text-sm text-[#38bdf8] hover:underline"
              >
                <FiPlus />
                Add line
              </button>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Images (optional)</p>
              {editingId && existingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {existingImages.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setCoverExisting(url)}
                      className={`text-xs px-2 py-1 rounded border ${
                        coverExisting === url ? 'border-[#38bdf8] bg-[#38bdf8]/20' : 'border-white/20'
                      }`}
                    >
                      Cover
                    </button>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                className="text-sm text-slate-300"
              />
              {newFiles.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">{newFiles.length} new file(s)</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00aeef] hover:bg-[#0099d9] text-white font-medium disabled:opacity-50"
            >
              <FiSave />
              {saving ? 'Saving…' : editingId ? 'Update deal' : 'Create deal'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">All deals</h2>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : deals.length === 0 ? (
            <p className="text-slate-400 text-sm">No deals yet. Create one above.</p>
          ) : (
            <ul className="space-y-3">
              {deals.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{d.title}</p>
                    <p className="text-xs text-slate-400">
                      PKR {Number(d.deal_price || 0).toLocaleString('en-PK')} ·{' '}
                      {d.is_active ? 'Active' : 'Hidden'} · {Array.isArray(d.items) ? d.items.length : 0} items
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(d)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 text-sm hover:bg-white/10"
                    >
                      <FiEdit2 />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 text-sm hover:bg-red-500/10"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-slate-500">
          Storefront:{' '}
          <Link href="/all-products?subcategory=deals" className="text-[#38bdf8] hover:underline">
            /all-products?subcategory=deals
          </Link>
          . Run <code className="text-slate-400">supabase/catalog_deals.sql</code> if the table is missing.
        </p>
      </main>
    </div>
  );
};

export default CmsDealsPage;
