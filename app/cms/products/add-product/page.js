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
  bed: [{ id: 'name', label: 'Product name', type: 'text', placeholder: 'Cloudynap Ortho Comfort 6"' }],
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
  sofacumbed: [{ id: 'name', label: 'Product name', type: 'text', placeholder: '3-seater sofa cum bed — grey' }],
};

const bedSpecs = [
  { id: 'brand', label: 'Brand', placeholder: 'Englander, Citi Foam, or Diamond' },
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
  const [bedVariants, setBedVariants] = useState([{ width: '', height: '', length: '', price: '' }]);
  const [sofaVariants, setSofaVariants] = useState([{ price: '', fabric: '' }]);
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
    if (category === 'bed') {
      setBedVariants([{ width: '', height: '', length: '', price: '' }]);
    }
    if (category === 'sofacumbed') {
      setSofaVariants([{ price: '', fabric: '' }]);
    }
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

  const updateBedVariant = (index, field, value) => {
    setBedVariants((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addBedVariantRow = () => {
    setBedVariants((prev) => [...prev, { width: '', height: '', length: '', price: '' }]);
  };

  const removeBedVariantRow = (index) => {
    setBedVariants((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateSofaVariant = (index, field, value) => {
    setSofaVariants((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addSofaVariantRow = () => {
    setSofaVariants((prev) => [...prev, { price: '', fabric: '' }]);
  };

  const removeSofaVariantRow = (index) => {
    setSofaVariants((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleReset = () => {
    setDetails({
      name: '',
      price: '',
      description: '',
    });
    setSpecs({});
    setBedVariants([{ width: '', height: '', length: '', price: '' }]);
    setSofaVariants([{ price: '', fabric: '' }]);
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

    if (category === 'bed') {
      const priced = bedVariants.filter((v) => String(v.price || '').trim() !== '');
      if (!priced.length) {
        setStatus({ type: 'error', message: 'Add at least one mattress size with a price (PKR).' });
        return;
      }
    } else if (category === 'sofacumbed') {
      const priced = sofaVariants.filter((v) => String(v.price || '').trim() !== '');
      if (!priced.length) {
        setStatus({ type: 'error', message: 'Add at least one fabric option with a price (PKR).' });
        return;
      }
    } else if (!details.price.trim()) {
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
      const specsPayload =
        category === 'bed'
          ? {
              ...specs,
              variants: bedVariants.filter((v) => String(v.price || '').trim() !== ''),
            }
          : category === 'sofacumbed'
            ? {
                ...specs,
                variants: sofaVariants.filter((v) => String(v.price || '').trim() !== ''),
              }
            : specs;
      formData.append('specs', JSON.stringify(specsPayload));

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

  const fieldLabelClass = 'text-sm font-medium text-slate-700 mb-2';
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25';

  return (
    <div className="relative min-h-screen text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-400">
              <FiPlusCircle className="text-blue-600" /> Cloudynap catalog
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Add product</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              List mattresses, furniture, sofa cum beds, and accessories. Fields match your storefront. Upload clear
              photos before publishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cms/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white/90 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition"
            >
              <FiArrowLeft /> Back to products
            </Link>
            <button
              type="button"
              onClick={() => router.push('/cms/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-blue-800"
            >
              Dashboard
            </button>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm space-y-10"
        >
          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,280px),1fr] gap-8">
            <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/95 to-sky-50/40 p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FiPlusCircle className="text-blue-600" />
                Category
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Pick the catalog section. Specification fields update for mattresses, furniture, sofa cum beds, or
                accessories.
              </p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="flex flex-col">
                  <span className={fieldLabelClass}>Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={`${inputClass} appearance-none`}
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
                  <span className={fieldLabelClass}>Description</span>
                  <textarea
                    name="description"
                    value={details.description}
                    onChange={handleGeneralChange}
                    rows={4}
                    placeholder="Short description for the product page and cards."
                    className={`${inputClass} resize-none min-h-28`}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {(GENERAL_FIELD_CONFIG[category] || GENERAL_FIELD_CONFIG.bed).map((field) => (
                  <label key={field.id} className="flex flex-col">
                    <span className={fieldLabelClass}>{field.label}</span>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      value={details[field.id] ?? ''}
                      onChange={handleGeneralChange}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <SpecIcon className="text-blue-600" />
                  {categoryMeta[category]?.specTitle || 'Details'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  These values appear on the public product page in the specification area.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specFields.map((field) => (
                <label
                  key={field.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {field.label}
                  </span>
                  <input
                    name={field.id}
                    value={specs[field.id] || ''}
                    onChange={handleSpecChange}
                    placeholder={field.placeholder}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </label>
              ))}
            </div>
          </section>

          {category === 'bed' && (
            <section className="space-y-6 pt-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Mattress sizes &amp; prices</p>
                <p className="text-xs text-slate-600 mt-1">
                  Each row is one stock keeping size (L × W × H in inches). PKR is required per row.
                </p>
              </div>
              <div className="space-y-4">
                {bedVariants.map((row, index) => (
                  <div
                    key={`bed-var-${index}`}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 mb-1">Length (in.)</span>
                      <input
                        value={row.length}
                        onChange={(e) => updateBedVariant(index, 'length', e.target.value)}
                        placeholder="78"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 mb-1">Width (in.)</span>
                      <input
                        value={row.width}
                        onChange={(e) => updateBedVariant(index, 'width', e.target.value)}
                        placeholder="60"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 mb-1">Height (in.)</span>
                      <input
                        value={row.height}
                        onChange={(e) => updateBedVariant(index, 'height', e.target.value)}
                        placeholder="12"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 mb-1">Price (PKR)</span>
                      <input
                        value={row.price}
                        onChange={(e) => updateBedVariant(index, 'price', e.target.value)}
                        placeholder="85000"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>
                    <div className="flex gap-2 justify-end lg:justify-start">
                      <button
                        type="button"
                        onClick={() => addBedVariantRow()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-2"
                      >
                        <FiPlusCircle className="inline mr-1" />
                        Add size
                      </button>
                      {bedVariants.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeBedVariantRow(index)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-2"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {category === 'sofacumbed' && (
            <section className="space-y-6 pt-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Fabric options &amp; prices</p>
                <p className="text-xs text-slate-600 mt-1">
                  Each row is one upholstery option. PKR is required per row.
                </p>
              </div>
              <div className="space-y-4">
                {sofaVariants.map((row, index) => (
                  <div
                    key={`sofa-var-${index}`}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <label className="flex flex-col sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-600 mb-1">Fabric</span>
                      <input
                        value={row.fabric}
                        onChange={(e) => updateSofaVariant(index, 'fabric', e.target.value)}
                        placeholder="e.g. Grey velvet"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 mb-1">Price (PKR)</span>
                      <input
                        value={row.price}
                        onChange={(e) => updateSofaVariant(index, 'price', e.target.value)}
                        placeholder="125000"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>
                    <div className="flex gap-2 justify-end lg:justify-start">
                      <button
                        type="button"
                        onClick={() => addSofaVariantRow()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-2"
                      >
                        <FiPlusCircle className="inline mr-1" />
                        Add option
                      </button>
                      {sofaVariants.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSofaVariantRow(index)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-2"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FiUploadCloud className="text-blue-600" />
                  Product images
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Multiple angles or room shots. The first image is the cover unless you change it when editing.
                </p>
              </div>
            </div>

            <label
              htmlFor="product-images"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 transition cursor-pointer text-center hover:border-blue-400 hover:bg-blue-50/40"
            >
              <FiUploadCloud className="text-3xl text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Click to upload images</p>
                <p className="text-xs text-slate-600 mt-1">PNG, JPG up to 8MB each. Multi-select supported.</p>
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
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt={item.file.name} className="h-44 w-full object-cover" />
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-600">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition"
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
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-linear-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CmsAddProductPage;
