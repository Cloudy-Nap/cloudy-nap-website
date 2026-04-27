'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import { API_BASE } from '../../../lib/apiBase';

const CLOUDYNAP_CSV_HEADER_HINTS = {
  bed: 'name, description, price, length, width, height, series, features, benefits, firmness, fabric, warranty, image, image_urls',
  accessory:
    'name, price, description, series, features, benefits, firmness, fabric, warranty, image, image_urls',
  furniture:
    'name, price, description, seats, material, warranty, image, image_urls, width, length, height, structure, fabric',
  sofacumbed:
    'name, description, price, series, features, benefits, firmness, fabric, warranty, image, image_urls',
};

const BulkAddProductsPage = () => {
  const router = useRouter();
  const [category, setCategory] = useState('bed');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = window.localStorage.getItem('cmsUser');
    const storedSession = window.localStorage.getItem('cmsSession');

    if (!storedUser || !storedSession) {
      router.replace('/cms/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      
      // Ensure accesspages is an array
      if (!Array.isArray(parsedUser.accesspages)) {
        parsedUser.accesspages = [];
      }
      
      // Admin users always have access, others need products in accesspages
      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('products')) {
          router.replace('/cms/auth/login');
          return;
        }
      }
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  const handleFileChange = (event) => {
    setError(null);
    setResult(null);
    const selected = event.target?.files?.[0];
    setFile(selected || null);
    setFileName(selected?.name || '');
  };

  const resetState = () => {
    setFile(null);
    setFileName('');
    setIsSubmitting(false);
    setFileInputKey(Date.now());
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please choose a CSV file before uploading.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setResult(null);

      // Get CMS user info for activity logging
      const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
      
      const formData = new FormData();
      formData.append('category', category);
      formData.append('file', file);

      const base = (API_BASE || '').replace(/\/$/, '');
      const path = `${base}/api/products/bulk/csv?${new URLSearchParams({ category })}`;
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'X-CMS-User-Id': cmsUser.id || '',
          'X-CMS-User-Name': cmsUser.username || cmsUser.name || '',
          'X-CMS-User-Role': cmsUser.role || '',
          'X-Bulk-Category': category,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to process file.');
      }

      setResult(payload);
      resetState();
    } catch (err) {
      console.error('Bulk upload error:', err);
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,174,239,0.2),transparent_55%)] opacity-90 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/cms/products"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-400"
            >
              <FiArrowLeft className="text-[#00aeef]" /> Back to Products
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-white">Bulk CSV import</h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Import multiple catalog rows from a CSV. Choose the table that matches your file (beds, accessories,
              furniture, sofa cum bed) or a legacy laptop, printer, or scanner file. You can also add products one at a time
              via{' '}
              <Link href="/cms/products/add-product" className="text-[#00aeef] hover:underline">
                Add product
              </Link>
              .
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-8">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-white uppercase tracking-wide block mb-3">
                    CSV target (table)
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]/60"
                    >
                      <optgroup className="text-slate-900" label="Cloudynap catalog">
                        <option value="bed">Beds (mattresses)</option>
                        <option value="accessory">Accessories</option>
                        <option value="furniture">Furniture</option>
                        <option value="sofacumbed">Sofa cum bed</option>
                      </optgroup>
                      <optgroup className="text-slate-900" label="Legacy electronics">
                        <option value="laptop">Laptop (legacy)</option>
                        <option value="printer">Printer (legacy)</option>
                        <option value="scanner">Scanner (legacy)</option>
                      </optgroup>
                    </select>
                    <FiInfo className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#00aeef]" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white uppercase tracking-wide block mb-3">
                    Upload CSV
                  </label>
                  <div className="relative flex flex-col items-center justify-center gap-4 border border-dashed border-white/20 rounded-2xl px-6 py-10 bg-white/5 hover:border-[#00aeef]/60 transition">
                    <FiUpload className="text-3xl text-[#00aeef]" />
                    <div className="text-center text-sm text-slate-300">
                      Drag & drop a <code className="text-slate-200">.csv</code> file here, or click to browse.
                    </div>
                    {fileName ? (
                      <div className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-slate-200">
                        {fileName}
                      </div>
                    ) : null}
                    <input
                      key={fileInputKey}
                      type="file"
                      accept=".csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-[#00aeef] font-semibold uppercase tracking-wide">
                    <FiInfo /> Quick tips
                  </div>
                  <p>
                    - Use column names that match your Supabase table. Cloudynap files use snake_case (e.g.{' '}
                    <code>image_urls</code>), not the legacy <code>brand</code> field.
                  </p>
                  {CLOUDYNAP_CSV_HEADER_HINTS[category] ? (
                    <p className="wrap-break-word text-slate-200/90">
                      <span className="text-[#00aeef] font-medium">Expected headers: </span>
                      {CLOUDYNAP_CSV_HEADER_HINTS[category]}
                    </p>
                  ) : (
                    <p>
                      - Legacy files: <code>name</code>, <code>price</code>, <code>brand</code>, plus optional spec
                      columns (see your legacy template).
                    </p>
                  )}
                  <p>
                    - Each row needs <code>name</code>, <code>price</code>, and a cover (column <code>image</code> or
                    at least one URL in <code>image_urls</code>). Separate multiple image URLs with commas or
                    semicolons; the first is the main image.
                  </p>
                  <p>- Use one target table per upload (do not mix beds and furniture in the same file).</p>
                </div>

                <div className="rounded-2xl border border-[#f97316]/30 bg-[#f97316]/10 p-5 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-amber-300">
                    <FiAlertCircle /> Validation
                  </div>
                  <p>
                    The upload runs detailed validation. You will get a summary of any rows that
                    fail so you can fix them and try again.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-300">
              {['laptop', 'printer', 'scanner'].includes(category) ? (
                <>
                  Need a sample?{' '}
                  <Link
                    href="/bulk-products-template.csv"
                    className="text-[#00aeef] hover:underline font-semibold"
                  >
                    Legacy bulk template
                  </Link>
                </>
              ) : (
                <span className="text-slate-400">
                  Create a UTF-8 CSV with the headers shown in Quick tips (no legacy template for Cloudynap).
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href="/cms/products"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-linear-to-r from-[#00aeef] to-[#0284c7] text-sm font-semibold text-white shadow-lg shadow-[#00aeef]/30 hover:from-[#0891b2] hover:to-[#0369a1] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing…' : 'Process Upload'}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-400/40 bg-red-950/40 p-6 text-sm text-red-100 space-y-3">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-red-200 text-xs">
              <FiAlertCircle className="text-base" /> Upload failed
            </div>
            <p>{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-950/30 p-6 text-sm text-emerald-100 space-y-4">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-emerald-200 text-xs">
              <FiCheckCircle className="text-base" /> Upload summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.attempted ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Rows in file</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.processed ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Validated</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.inserted ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Inserted</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.failed ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Issues</div>
              </div>
            </div>

            {result?.rowValidationErrors?.length ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 space-y-2 text-xs">
                <div className="font-semibold uppercase text-amber-200 tracking-wide">
                  Validation issues
                </div>
                <ul className="space-y-1">
                  {result.rowValidationErrors.map((issue, index) => (
                    <li key={`validation-${index}`} className="text-amber-100/90">
                      Row {issue.row}: {issue.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result?.insertionErrors?.length ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 space-y-2 text-xs">
                <div className="font-semibold uppercase text-red-200 tracking-wide">
                  Insert errors
                </div>
                <ul className="space-y-1">
                  {result.insertionErrors.map((issue, index) => (
                    <li key={`insertion-${index}`} className="text-red-100/90">
                      Row {issue.row}: {issue.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BulkAddProductsPage;
