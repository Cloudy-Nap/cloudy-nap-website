'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPlusCircle,
  FiUploadCloud,
  FiTrash2,
  FiLayers,
  FiPackage,
  FiGrid,
  FiMaximize2,
} from 'react-icons/fi';
import { API_BASE } from '../../../lib/apiBase';

const CLOUDYNAP_TYPES = ['bed', 'accessory', 'furniture', 'sofacumbed'];

const isCloudynapCategory = (value) => CLOUDYNAP_TYPES.includes(value);

const GENERAL_FIELD_CONFIG = {
  bed: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: 'Cloudynap Ortho Comfort 6"' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '85000' },
  ],
  accessory: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: 'Memory foam pillow — medium' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '4500' },
  ],
  furniture: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: 'Velvet accent chair — teal' },
    {
      id: 'price',
      label: 'Price (display text)',
      type: 'text',
      placeholder: 'PKR 32,000 or Contact for quote',
    },
  ],
  sofacumbed: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: '3-seater sofa cum bed — grey' },
    {
      id: 'price',
      label: 'Price (display text)',
      type: 'text',
      placeholder: 'PKR 125,000',
    },
  ],
};

const bedSpecs = [
  { id: 'length', label: 'Length (cm)', placeholder: '198' },
  { id: 'width', label: 'Width (cm)', placeholder: '152' },
  { id: 'height', label: 'Height (cm)', placeholder: '25' },
  { id: 'series', label: 'Series / line', placeholder: 'Ortho Comfort' },
  { id: 'features', label: 'Features', placeholder: 'Cool-gel foam, anti-mite cover' },
  { id: 'benefits', label: 'Benefits', placeholder: 'Spinal support, motion isolation' },
  { id: 'firmness', label: 'Firmness', placeholder: 'Medium-firm' },
  { id: 'fabric', label: 'Fabric / cover', placeholder: 'Knit bamboo blend' },
  { id: 'warranty', label: 'Warranty', placeholder: '10 years' },
];

const accessorySpecs = [
  { id: 'series', label: 'Series / line', placeholder: 'SleepWell' },
  { id: 'features', label: 'Features', placeholder: 'Cooling gel layer' },
  { id: 'benefits', label: 'Benefits', placeholder: 'Neck support' },
  { id: 'firmness', label: 'Firmness / feel', placeholder: 'Medium' },
  { id: 'fabric', label: 'Fabric / cover', placeholder: 'Cotton removable cover' },
  { id: 'warranty', label: 'Warranty', placeholder: '1 year' },
];

const furnitureSpecs = [
  { id: 'length', label: 'Length', placeholder: 'e.g. 198 cm or 6 ft 6 in' },
  { id: 'width', label: 'Width', placeholder: 'e.g. 92 cm' },
  { id: 'height', label: 'Height', placeholder: 'e.g. 85 cm' },
  { id: 'structure', label: 'Structure', placeholder: 'Frame type, joinery, support system' },
  { id: 'fabric', label: 'Fabric / upholstery', placeholder: 'Velvet, leather, linen blend' },
  { id: 'seats', label: 'Seats / configuration', placeholder: '3-seater' },
  { id: 'material', label: 'Material', placeholder: 'Solid wood, metal legs' },
  { id: 'warranty', label: 'Warranty', placeholder: '2 years' },
];

const sofaCumBedSpecs = [
  { id: 'series', label: 'Series / line', placeholder: 'Lounge Plus' },
  { id: 'features', label: 'Features', placeholder: 'Storage, easy fold mechanism' },
  { id: 'benefits', label: 'Benefits', placeholder: 'Guest-ready, space-saving' },
  { id: 'firmness', label: 'Mattress firmness', placeholder: 'Medium' },
  { id: 'fabric', label: 'Fabric', placeholder: 'Linen blend' },
  { id: 'warranty', label: 'Warranty', placeholder: '5 years frame, 2 years mattress' },
];

const categoryMeta = {
  bed: { label: 'Mattresses & beds', icon: FiLayers, specTitle: 'Mattress details' },
  accessory: { label: 'Accessories & pillows', icon: FiPackage, specTitle: 'Accessory details' },
  furniture: { label: 'Furniture', icon: FiGrid, specTitle: 'Furniture details' },
  sofacumbed: { label: 'Sofa cum bed', icon: FiMaximize2, specTitle: 'Sofa cum bed details' },
};

const CmsAddProductPage = () => {
  const router = useRouter();
  const [category, setCategory] = useState('bed');
  const [details, setDetails] = useState({
    name: '',
    price: '',
    description: '',
  });
  const [specs, setSpecs] = useState({});
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const specFields = useMemo(() => {
    if (category === 'bed') return bedSpecs;
    if (category === 'accessory') return accessorySpecs;
    if (category === 'furniture') return furnitureSpecs;
    return sofaCumBedSpecs;
  }, [category]);

  const SpecIcon = categoryMeta[category]?.icon || FiLayers;

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

  useEffect(() => {
    setSpecs({});
  }, [category]);

  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [images]);

  const handleGeneralChange = (event) => {
    const { name, value } = event.target;
    setDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSpecChange = (event) => {
    const { name, value } = event.target;
    setSpecs((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    setImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}`,
      }));
    });
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const handleReset = () => {
    setDetails({
      name: '',
      price: '',
      description: '',
    });
    setSpecs({});
    setStatus({ type: '', message: '' });
    setImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!details.name.trim()) {
      setStatus({ type: 'error', message: 'Product name is required.' });
      return;
    }

    if (!details.price.trim()) {
      setStatus({ type: 'error', message: 'Please provide a price.' });
      return;
    }

    if (!images.length) {
      setStatus({ type: 'error', message: 'Upload at least one product image.' });
      return;
    }

    if (!isCloudynapCategory(category)) {
      setStatus({ type: 'error', message: 'Invalid category.' });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      images.forEach((item) => {
        formData.append('images', item.file);
      });
      formData.append('category', category);
      Object.entries(details).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });
      formData.append('specs', JSON.stringify(specs));

      const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');

      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: {
          'X-CMS-User-Id': String(cmsUser.id || ''),
          'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
          'X-CMS-User-Role': String(cmsUser.role || ''),
        },
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save product.');
      }

      handleReset();
      setStatus({
        type: 'success',
        message: 'Product created successfully and synced to your Cloudynap catalog.',
      });
    } catch (error) {
      console.error('Add product error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to create the product. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="bg-linear-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cloudynap catalog</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Add product</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              List mattresses, furniture, sofa cum beds, and accessories. Fields match your storefront. Upload clear
              photos before publishing.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/cms/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
            >
              <FiArrowLeft /> Back to products
            </Link>
            <button
              type="button"
              onClick={() => router.push('/cms/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#00aeef] to-[#0284c7] hover:from-[#0891b2] hover:to-[#0369a1] text-sm font-semibold text-white rounded-lg shadow-lg shadow-[#00aeef]/25"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-10 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl px-6 sm:px-10 py-10"
        >
          <section className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <FiPlusCircle className="text-[#00aeef]" />
                Category
              </p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pick the catalog section. Specification fields update for mattresses, furniture, sofa cum beds, or
                accessories.
              </p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]/60"
                  >
                    <option className="text-black" value="bed">
                      Mattresses & beds
                    </option>
                    <option className="text-black" value="accessory">
                      Accessories & pillows
                    </option>
                    <option className="text-black" value="furniture">
                      Furniture
                    </option>
                    <option className="text-black" value="sofacumbed">
                      Sofa cum bed
                    </option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">Description</span>
                  <textarea
                    name="description"
                    value={details.description}
                    onChange={handleGeneralChange}
                    rows={4}
                    placeholder="Short description for the product page and cards."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]/60 resize-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(GENERAL_FIELD_CONFIG[category] || GENERAL_FIELD_CONFIG.bed).map((field) => (
                  <label key={field.id} className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                      {field.label}
                    </span>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      value={details[field.id] ?? ''}
                      onChange={handleGeneralChange}
                      placeholder={field.placeholder}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/60"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <SpecIcon className="text-[#00aeef]" />
                  {categoryMeta[category]?.specTitle || 'Details'}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  These values appear on the public product page in the specification area.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specFields.map((field) => (
                <label key={field.id} className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">{field.label}</span>
                  <input
                    name={field.id}
                    value={specs[field.id] || ''}
                    onChange={handleSpecChange}
                    placeholder={field.placeholder}
                    className="bg-transparent border border-white/20 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <FiUploadCloud className="text-[#00aeef]" />
                  Product images
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Multiple angles or room shots. The first image is the cover unless you change it when editing.
                </p>
              </div>
            </div>

            <label
              htmlFor="product-images"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-2xl px-6 py-10 bg-white/5 hover:border-[#00aeef]/60 transition cursor-pointer text-center"
            >
              <FiUploadCloud className="text-3xl text-[#00aeef]" />
              <div>
                <p className="text-sm font-semibold text-white">Click to upload images</p>
                <p className="text-xs text-slate-300 mt-1">PNG, JPG up to 8MB each. Multi-select supported.</p>
              </div>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white/10 border border-white/15 rounded-xl overflow-hidden shadow-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt={item.file.name} className="h-44 w-full object-cover" />
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-white truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-300">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-red-300 hover:text-red-200 transition"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {status.message && (
            <div
              className={`text-sm px-4 py-3 rounded-lg border ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'
                  : 'bg-red-500/10 border-red-400/40 text-red-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-linear-to-r from-[#00aeef] to-[#0284c7] hover:from-[#0891b2] hover:to-[#0369a1] text-sm font-semibold text-white rounded-lg shadow-lg shadow-[#00aeef]/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CmsAddProductPage;
