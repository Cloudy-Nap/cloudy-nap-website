'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowLeft,
  FiAlertTriangle,
  FiTag,
  FiLayers,
  FiGrid,
  FiMaximize2,
} from 'react-icons/fi';
import { API_BASE } from '../../lib/apiBase';

const CLOUDYNAP_TYPES = new Set(['bed', 'accessory', 'furniture', 'sofacumbed']);

const parseNumeric = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const extractImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value.imageUrls)) return value.imageUrls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.image_urls)) return value.image_urls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.images)) return value.images.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.imageurls)) return value.imageurls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (typeof value.image === 'string' && value.image.trim() !== '') return [value.image.trim()];
  return [];
};

const categoryLabel = (type) => {
  switch (type) {
    case 'bed':
      return 'Mattresses & beds';
    case 'accessory':
      return 'Accessories';
    case 'furniture':
      return 'Furniture';
    case 'sofacumbed':
      return 'Sofa cum bed';
    default:
      return 'Product';
  }
};

const sanitizeProduct = (item) => {
  if (!item) return null;
  const resolvedType = item.type || 'bed';
  if (!CLOUDYNAP_TYPES.has(resolvedType)) return null;

  const images = extractImageArray(item);
  const image = images[0] || item.image || '/mnk-category.png';

  let priceLabel = 'Price on request';
  if (resolvedType === 'furniture' || resolvedType === 'sofacumbed') {
    const s = item.price !== null && item.price !== undefined ? String(item.price).trim() : '';
    priceLabel = s || 'Price on request';
  } else {
    const n = parseNumeric(item.price, 0);
    priceLabel = n > 0 ? `PKR ${n.toLocaleString('en-PK')}` : 'Price on request';
  }

  return {
    ...item,
    id: item.id?.toString?.() ?? item.id,
    type: resolvedType,
    name: item.name || 'Untitled product',
    priceLabel,
    image,
    category: categoryLabel(resolvedType),
  };
};

const CategoryIcon = ({ type }) => {
  if (type === 'bed') return <FiLayers />;
  if (type === 'accessory') return <FiPackage />;
  if (type === 'furniture') return <FiGrid />;
  if (type === 'sofacumbed') return <FiMaximize2 />;
  return <FiPackage />;
};

const CmsInventoryPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

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

      if (!Array.isArray(parsedUser.accesspages)) {
        parsedUser.accesspages = [];
      }

      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('inventory')) {
          router.replace('/cms/auth/login');
          return;
        }
      }
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error('Failed to load catalog.');
        const data = await res.json();
        const sanitized = (Array.isArray(data) ? data : [])
          .map((item) => sanitizeProduct(item))
          .filter(Boolean);
        setProducts(sanitized);
      } catch (err) {
        console.error('CMS inventory fetch error:', err);
        setError(err.message || 'Failed to load inventory.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === 'all' ? true : product.type === filter;
      const q = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q) : true;
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,174,239,0.18),transparent_55%)] opacity-90 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-400">
              <FiPackage className="text-[#00aeef]" /> Inventory
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Catalog overview</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Cloudynap listings (mattresses, furniture, sofa cum beds, accessories). Stock counts are not stored in
              Supabase for this catalog—use the product list to manage what appears on the site.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
            >
              <FiArrowLeft />
              Back to dashboard
            </Link>
            <Link
              href="/cms/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#00aeef] to-[#0284c7] hover:from-[#0891b2] hover:to-[#0369a1] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#00aeef]/25"
            >
              Edit products
            </Link>
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <FiSearch className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or category…"
                className="bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none w-full min-w-0"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition inline-flex items-center gap-2 ${
                  filter === 'all'
                    ? 'bg-linear-to-r from-[#00aeef] to-[#0284c7] text-white shadow-lg shadow-[#00aeef]/25'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <FiFilter />
                All
              </button>
              {[
                { id: 'bed', label: 'Beds' },
                { id: 'accessory', label: 'Accessories' },
                { id: 'furniture', label: 'Furniture' },
                { id: 'sofacumbed', label: 'Sofa cum bed' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    filter === id
                      ? 'bg-linear-to-r from-[#00aeef] to-[#0284c7] text-white shadow-lg shadow-[#00aeef]/25'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading && (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-slate-200">
                <FiRefreshCw className="animate-spin text-2xl" />
                <p className="text-sm">Loading…</p>
              </div>
            )}

            {error && !loading && (
              <div className="col-span-full border border-red-400/30 bg-red-500/10 text-red-100 rounded-2xl p-6 flex gap-3 items-start">
                <FiAlertTriangle className="mt-1 text-xl" />
                <div>
                  <p className="text-sm font-semibold">Unable to load inventory</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="col-span-full border border-white/10 bg-white/5 text-white/80 rounded-2xl p-6">
                <p className="text-sm font-semibold">No products match your filters.</p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredProducts.map((product) => (
                <article
                  key={`${product.type}-${product.id}`}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl transition transform hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-white/5 opacity-50 pointer-events-none" />
                  <div className="relative p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                        <CategoryIcon type={product.type} />
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-4 h-36">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-26 w-full object-contain transition-transform duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-white line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span className="inline-flex items-center gap-2">
                          <FiTag />
                          {product.priceLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CmsInventoryPage;
