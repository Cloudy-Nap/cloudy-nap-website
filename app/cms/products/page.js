'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiBox,
  FiLayers,
  FiPackage,
  FiGrid,
  FiMaximize2,
  FiTrendingUp,
  FiRefreshCw,
  FiSearch,
  FiAlertTriangle,
  FiArrowLeft,
  FiUploadCloud,
  FiTrash2,
  FiEdit2,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { API_BASE } from '../../lib/apiBase';
import { getCategoryPlaceholderImage } from '../../lib/categoryPlaceholders';

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
  const image = images[0] || item.image || getCategoryPlaceholderImage(resolvedType);

  const desc =
    typeof item.description === 'string' && item.description.trim()
      ? item.description.trim()
      : [item.series, item.features].filter(Boolean).join(' · ') || 'No description yet.';

  let priceNumeric = 0;
  let priceLabel = 'Price on request';
  if (resolvedType === 'furniture' || resolvedType === 'sofacumbed') {
    const s = item.price !== null && item.price !== undefined ? String(item.price).trim() : '';
    priceLabel = s || 'Price on request';
    priceNumeric = parseNumeric(s, 0);
  } else {
    priceNumeric = parseNumeric(item.price, 0);
    priceLabel = priceNumeric > 0 ? `PKR ${priceNumeric.toLocaleString('en-PK')}` : 'Price on request';
  }

  return {
    ...item,
    id: item.id?.toString?.() ?? item.id,
    type: resolvedType,
    name: item.name || 'Untitled product',
    brand: item.series || 'Cloudynap',
    description: desc,
    price: priceNumeric,
    priceLabel,
    image,
    images,
    category: categoryLabel(resolvedType),
    stock: null,
    rating: parseNumeric(item.rating, 0),
    reviews: parseNumeric(item.reviews, 0),
    featured: false,
  };
};

const renderProductImage = (src, alt, catalogType = 'bed') => {
  const fallback = getCategoryPlaceholderImage(catalogType);
  if (src?.startsWith?.('http')) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-28 w-full object-contain transition-transform duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <img
      src={src || fallback}
      alt={alt}
      className="h-28 w-full object-contain transition-transform duration-300 group-hover:scale-105"
    />
  );
};

const EDIT_GENERAL_FIELD_CONFIG = {
  bed: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: 'Cloudynap Ortho Comfort' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '85000' },
  ],
  accessory: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: 'Memory foam pillow' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '4500' },
  ],
  furniture: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: 'Accent chair' },
    { id: 'price', label: 'Price (display text)', type: 'text', placeholder: 'PKR 32,000' },
  ],
  sofacumbed: [
    { id: 'name', label: 'Product name', type: 'text', placeholder: '3-seater sofa cum bed' },
    { id: 'price', label: 'Price (display text)', type: 'text', placeholder: 'PKR 125,000' },
  ],
};

const BED_SPEC_FIELDS = [
  { id: 'length', label: 'Length (cm)', sourceKey: 'length', placeholder: '198' },
  { id: 'width', label: 'Width (cm)', sourceKey: 'width', placeholder: '152' },
  { id: 'height', label: 'Height (cm)', sourceKey: 'height', placeholder: '25' },
  { id: 'series', label: 'Series / line', sourceKey: 'series', placeholder: 'Ortho Comfort' },
  { id: 'features', label: 'Features', sourceKey: 'features', placeholder: 'Cool-gel foam' },
  { id: 'benefits', label: 'Benefits', sourceKey: 'benefits', placeholder: 'Spinal support' },
  { id: 'firmness', label: 'Firmness', sourceKey: 'firmness', placeholder: 'Medium-firm' },
  { id: 'fabric', label: 'Fabric / cover', sourceKey: 'fabric', placeholder: 'Bamboo knit' },
  { id: 'warranty', label: 'Warranty', sourceKey: 'warranty', placeholder: '10 years' },
];

const ACCESSORY_SPEC_FIELDS = [
  { id: 'series', label: 'Series / line', sourceKey: 'series', placeholder: 'SleepWell' },
  { id: 'features', label: 'Features', sourceKey: 'features', placeholder: 'Cooling gel' },
  { id: 'benefits', label: 'Benefits', sourceKey: 'benefits', placeholder: 'Neck support' },
  { id: 'firmness', label: 'Firmness / feel', sourceKey: 'firmness', placeholder: 'Medium' },
  { id: 'fabric', label: 'Fabric / cover', sourceKey: 'fabric', placeholder: 'Cotton cover' },
  { id: 'warranty', label: 'Warranty', sourceKey: 'warranty', placeholder: '1 year' },
];

const FURNITURE_SPEC_FIELDS = [
  { id: 'length', label: 'Length', sourceKey: 'length', placeholder: '198 cm' },
  { id: 'width', label: 'Width', sourceKey: 'width', placeholder: '92 cm' },
  { id: 'height', label: 'Height', sourceKey: 'height', placeholder: '85 cm' },
  { id: 'structure', label: 'Structure', sourceKey: 'structure', placeholder: 'Frame / structure' },
  { id: 'fabric', label: 'Fabric / upholstery', sourceKey: 'fabric', placeholder: 'Velvet' },
  { id: 'seats', label: 'Seats / configuration', sourceKey: 'seats', placeholder: '3-seater' },
  { id: 'material', label: 'Material', sourceKey: 'material', placeholder: 'Solid wood, velvet' },
  { id: 'warranty', label: 'Warranty', sourceKey: 'warranty', placeholder: '2 years' },
];

const SOFA_SPEC_FIELDS = [
  { id: 'series', label: 'Series / line', sourceKey: 'series', placeholder: 'Lounge Plus' },
  { id: 'features', label: 'Features', sourceKey: 'features', placeholder: 'Storage, fold mechanism' },
  { id: 'benefits', label: 'Benefits', sourceKey: 'benefits', placeholder: 'Guest-ready' },
  { id: 'firmness', label: 'Mattress firmness', sourceKey: 'firmness', placeholder: 'Medium' },
  { id: 'fabric', label: 'Fabric', sourceKey: 'fabric', placeholder: 'Linen blend' },
  { id: 'warranty', label: 'Warranty', sourceKey: 'warranty', placeholder: '5 years' },
];

const specFieldsForType = (type) => {
  if (type === 'bed') return BED_SPEC_FIELDS;
  if (type === 'accessory') return ACCESSORY_SPEC_FIELDS;
  if (type === 'furniture') return FURNITURE_SPEC_FIELDS;
  return SOFA_SPEC_FIELDS;
};

const specSectionTitle = (type) => {
  if (type === 'bed') return 'Mattress details';
  if (type === 'accessory') return 'Accessory details';
  if (type === 'furniture') return 'Furniture details';
  return 'Sofa cum bed details';
};

const CategoryBadgeIcon = ({ type }) => {
  if (type === 'bed') return <FiLayers className="text-[#00aeef]" />;
  if (type === 'accessory') return <FiPackage className="text-[#00aeef]" />;
  if (type === 'furniture') return <FiGrid className="text-[#00aeef]" />;
  if (type === 'sofacumbed') return <FiMaximize2 className="text-[#00aeef]" />;
  return <FiBox />;
};

const CmsProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editDetails, setEditDetails] = useState({
    name: '',
    brand: '',
    model: '',
    series: '',
    sku: '',
    price: '',
    stock: '',
    description: '',
    featured: false,
  });
  const [editSpecs, setEditSpecs] = useState({});
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editNewImages, setEditNewImages] = useState([]);
  const [editCover, setEditCover] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const editSubmittingRef = useRef(editSubmitting);

  useEffect(() => {
    editSubmittingRef.current = editSubmitting;
  }, [editSubmitting]);

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
        console.error('CMS products fetch error:', err);
        setError(err.message || 'Failed to load products.');
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
      const matchesSearch = searchTerm
        ? product.name.toLowerCase().includes(q) ||
          product.brand.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q)
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  const stats = useMemo(() => {
    const total = products.length;
    const byType = (t) => products.filter((product) => product.type === t).length;
    const numericForAverage = products.filter((p) => p.type === 'bed' || p.type === 'accessory');
    const averagePrice =
      numericForAverage.length > 0
        ? Math.round(
            numericForAverage.reduce((sum, product) => sum + (Number.isFinite(product.price) ? product.price : 0), 0) /
              numericForAverage.length,
          )
        : 0;

    return {
      total,
      beds: byType('bed'),
      accessories: byType('accessory'),
      furniture: byType('furniture'),
      sofas: byType('sofacumbed'),
      averagePrice,
    };
  }, [products]);

  const closeEditModal = useCallback(() => {
    if (editSubmittingRef.current) return;
    setEditModalOpen(false);
    setEditTarget(null);
    setEditDetails({
      name: '',
      brand: '',
      model: '',
      series: '',
      sku: '',
      price: '',
      stock: '',
      description: '',
      featured: false,
    });
    setEditSpecs({});
    setEditExistingImages([]);
    setEditNewImages((prev) => {
      prev.forEach((item) => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
    setEditCover(null);
    setEditError('');
    setEditMessage('');
    setEditLoading(false);
    setEditSubmitting(false);
    editSubmittingRef.current = false;
  }, [editSubmittingRef]);

  const openEditModal = useCallback(async (product) => {
    setEditTarget(product);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError('');
    setEditMessage('');
    setEditExistingImages([]);
    setEditNewImages((prev) => {
      prev.forEach((item) => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
    setEditCover(null);

    try {
      const response = await fetch(`${API_BASE}/api/catalog/${product.type}/${product.id}`);
      if (!response.ok) {
        throw new Error('Failed to load product details.');
      }

      const data = await response.json();

      setEditDetails({
        name: data.name || '',
        brand: '',
        model: '',
        series: data.series || '',
        sku: '',
        price: data.price !== null && data.price !== undefined ? String(data.price) : '',
        stock: '',
        description: typeof data.description === 'string' ? data.description : '',
        featured: false,
      });

      const specFields = specFieldsForType(product.type);
      const nextSpecs = specFields.reduce((acc, field) => {
        const rawValue = data[field.sourceKey];
        acc[field.id] = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
        return acc;
      }, {});
      setEditSpecs(nextSpecs);

      const existingImages = extractImageArray(data);
      const normalizedImages = existingImages.length
        ? Array.from(new Set(existingImages))
        : data.image
          ? [data.image]
          : [];
      setEditExistingImages(normalizedImages);

      const coverImage =
        (typeof data.image === 'string' && data.image.trim() && normalizedImages.includes(data.image.trim())
          ? data.image.trim()
          : normalizedImages[0]) || null;
      setEditCover(coverImage ? { kind: 'existing', value: coverImage } : null);
    } catch (err) {
      console.error('Failed to open edit modal:', err);
      setEditError(err.message || 'Failed to load product details.');
    } finally {
      setEditLoading(false);
    }
  }, []);

  const handleEditDetailChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setEditDetails((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleEditSpecChange = useCallback((event) => {
    const { name, value } = event.target;
    setEditSpecs((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEditNewImageChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      let firstNewId = null;
      const newItems = files.map((file, index) => {
        const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
        if (firstNewId === null) firstNewId = id;
        return {
          id,
          file,
          preview: URL.createObjectURL(file),
        };
      });

      setEditNewImages((prev) => [...prev, ...newItems]);

      if (!editCover && newItems.length) {
        setEditCover({ kind: 'new', id: firstNewId });
      }

      event.target.value = '';
    },
    [editCover],
  );

  const handleEditExistingImageRemove = useCallback(
    (url) => {
      setEditExistingImages((prev) => {
        const updated = prev.filter((item) => item !== url);
        if (editCover?.kind === 'existing' && editCover.value === url) {
          if (updated.length) {
            setEditCover({ kind: 'existing', value: updated[0] });
          } else if (editNewImages.length) {
            setEditCover({ kind: 'new', id: editNewImages[0].id });
          } else {
            setEditCover(null);
          }
        }
        return updated;
      });
    },
    [editCover, editNewImages],
  );

  const handleEditNewImageRemove = useCallback(
    (id) => {
      setEditNewImages((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target?.preview) URL.revokeObjectURL(target.preview);
        const updated = prev.filter((item) => item.id !== id);
        if (editCover?.kind === 'new' && editCover.id === id) {
          if (updated.length) {
            setEditCover({ kind: 'new', id: updated[0].id });
          } else if (editExistingImages.length) {
            setEditCover({ kind: 'existing', value: editExistingImages[0] });
          } else {
            setEditCover(null);
          }
        }
        return updated;
      });
    },
    [editCover, editExistingImages],
  );

  const setCoverToExisting = useCallback((url) => {
    setEditCover({ kind: 'existing', value: url });
  }, []);

  const setCoverToNew = useCallback((id) => {
    setEditCover({ kind: 'new', id });
  }, []);

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editTarget) return;

    setEditError('');
    setEditMessage('');

    if (!editDetails.name.trim()) {
      setEditError('Product name is required.');
      return;
    }

    if (!editDetails.price.trim()) {
      setEditError('Price is required.');
      return;
    }

    const totalImages = editExistingImages.length + editNewImages.length;
    if (!totalImages) {
      setEditError('Please retain or upload at least one product image.');
      return;
    }

    try {
      setEditSubmitting(true);
      editSubmittingRef.current = true;

      const formData = new FormData();
      Object.entries(editDetails).forEach(([key, value]) => {
        if (key === 'featured') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value ?? '');
        }
      });

      formData.append('specs', JSON.stringify(editSpecs));
      formData.append('existingImages', JSON.stringify(editExistingImages));

      if (editCover?.kind === 'existing') {
        formData.append('coverExisting', editCover.value);
      } else if (editCover?.kind === 'new') {
        const newIndex = editNewImages.findIndex((item) => item.id === editCover.id);
        if (newIndex !== -1) {
          formData.append('coverNewIndex', String(newIndex));
        }
      }

      editNewImages.forEach((item) => {
        formData.append('images', item.file);
      });

      const cmsUserLocal = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');

      formData.append('cmsUserId', String(cmsUserLocal.id || ''));
      formData.append('cmsUserName', String(cmsUserLocal.username || cmsUserLocal.user_name || ''));
      formData.append('cmsUserRole', String(cmsUserLocal.role || ''));

      const categorySlug = editTarget.type;
      const response = await fetch(`${API_BASE}/api/products/${categorySlug}/${editTarget.id}`, {
        method: 'PATCH',
        headers: {
          'X-CMS-User-Id': String(cmsUserLocal.id || ''),
          'X-CMS-User-Name': String(cmsUserLocal.username || cmsUserLocal.user_name || ''),
          'X-CMS-User-Role': String(cmsUserLocal.role || ''),
        },
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update product.');
      }

      const updatedRaw = payload.product;
      const sanitized = sanitizeProduct(updatedRaw);
      if (sanitized) {
        setProducts((prev) =>
          prev.map((item) => (item.id === sanitized.id && item.type === sanitized.type ? sanitized : item)),
        );
      }
      setEditMessage('Product updated successfully.');

      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (err) {
      console.error('Edit product submit error:', err);
      setEditError(err.message || 'Failed to update product.');
    } finally {
      setEditSubmitting(false);
      editSubmittingRef.current = false;
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,174,239,0.18),transparent_55%)] opacity-90 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-400">
              <FiBox className="text-[#00aeef]" /> Cloudynap
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Product catalogue</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Manage mattresses, furniture, sofa cum beds, and accessories synced with your storefront Supabase tables.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
            >
              <FiArrowLeft />
              Back to dashboard
            </Link>
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#00aeef] to-[#0284c7] hover:from-[#0891b2] hover:to-[#0369a1] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#00aeef]/25"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => (window.location.href = '/cms/products/add-product')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#00aeef] to-[#0284c7] hover:from-[#0891b2] hover:to-[#0369a1] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#00aeef]/25"
            >
              Add product
            </button>
            <button
              onClick={() => (window.location.href = '/cms/products/bulk-add-product')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Bulk CSV (legacy)
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white/10 bg-linear-to-br from-[#00aeef] to-[#0284c7] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-wide text-white/90">Total SKUs</p>
            <p className="mt-3 text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/80 mt-1">All Cloudynap catalog items</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Mattresses & beds</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.beds}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-[#00aeef]/20 flex items-center justify-center text-[#00aeef]">
                <FiLayers />
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Accessories</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.accessories}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-[#00aeef]">
                <FiPackage />
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Furniture</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.furniture}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-[#00aeef]">
                <FiGrid />
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Sofa cum bed</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.sofas}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-[#00aeef]">
                <FiMaximize2 />
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Avg. price (beds & accessories)</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {stats.averagePrice > 0 ? `PKR ${stats.averagePrice.toLocaleString('en-PK')}` : 'n/a'}
                </p>
              </div>
              <span className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-[#00aeef]">
                <FiTrendingUp />
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <FiSearch className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, description, or category…"
                className="bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none w-full min-w-0"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'all', label: 'All' },
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
                <p className="text-sm">Loading catalogue…</p>
              </div>
            )}

            {error && !loading && (
              <div className="col-span-full border border-red-400/30 bg-red-500/10 text-red-100 rounded-2xl p-6 flex gap-3 items-start">
                <FiAlertTriangle className="mt-1 text-xl" />
                <div>
                  <p className="text-sm font-semibold">Unable to load products</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="col-span-full border border-white/10 bg-white/5 text-white/80 rounded-2xl p-6">
                <p className="text-sm font-semibold">No products match your filters.</p>
                <p className="text-xs mt-1">Try adjusting search or add items from Add product.</p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredProducts.map((product) => (
                <article
                  key={`${product.type}-${product.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditModal(product)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEditModal(product);
                    }
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-[#00aeef]/40 hover:bg-white/10 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-white/5 opacity-60 pointer-events-none" />
                  <div className="relative p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                        <CategoryBadgeIcon type={product.type} />
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-4 h-36">
                      {renderProductImage(product.image, product.name, product.type)}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-white line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-white/70 line-clamp-3 min-h-[48px]">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span className="font-semibold text-white">{product.priceLabel}</span>
                      <span className="text-xs text-white/50">Tap to edit</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/40 border border-white/10 px-3 py-1 text-xs text-white/80">
                    <FiEdit2 />
                    Edit
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeEditModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 shadow-[0_40px_120px_rgba(15,23,42,0.6)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-900/95 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/10">
                    <CategoryBadgeIcon type={editTarget?.type} />
                  </span>
                  Edit {categoryLabel(editTarget?.type)}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {editDetails.name || editTarget?.name || 'Untitled product'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ID #{editTarget?.id} • {editTarget?.category || categoryLabel(editTarget?.type)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-60"
                disabled={editSubmitting}
              >
                <FiX className="text-lg" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {editLoading ? (
              <div className="px-6 py-16 text-center text-slate-200">
                <FiRefreshCw className="mx-auto mb-4 text-2xl animate-spin" />
                Loading product details…
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {(EDIT_GENERAL_FIELD_CONFIG[editTarget?.type] || EDIT_GENERAL_FIELD_CONFIG.bed).map((field) => (
                    <label key={field.id} className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                        {field.label}
                      </span>
                      <input
                        type={field.type}
                        name={field.id}
                        value={editDetails[field.id] ?? ''}
                        onChange={handleEditDetailChange}
                        placeholder={field.placeholder}
                        disabled={editSubmitting}
                        className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/60 disabled:opacity-60"
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <label className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">Description</span>
                    <textarea
                      name="description"
                      value={editDetails.description}
                      onChange={handleEditDetailChange}
                      rows={4}
                      placeholder="Marketing copy and highlights."
                      disabled={editSubmitting}
                      className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/60 disabled:opacity-60 resize-none"
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">{specSectionTitle(editTarget?.type)}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specFieldsForType(editTarget?.type).map((field) => (
                      <label key={field.id} className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-4">
                        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                          {field.label}
                        </span>
                        <input
                          name={field.id}
                          value={editSpecs[field.id] ?? ''}
                          onChange={handleEditSpecChange}
                          placeholder={field.placeholder}
                          disabled={editSubmitting}
                          className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/50 disabled:opacity-60"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FiUploadCloud className="text-[#00aeef]" />
                        Product images
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">Update gallery or set a new cover image.</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      Total: {editExistingImages.length + editNewImages.length} image
                      {editExistingImages.length + editNewImages.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <label
                    htmlFor="edit-product-images"
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-2xl px-6 py-10 bg-white/5 hover:border-[#00aeef]/60 transition cursor-pointer text-center"
                  >
                    <FiUploadCloud className="text-3xl text-[#00aeef]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Click to upload images</p>
                      <p className="text-xs text-slate-300 mt-1">PNG, JPG up to 8MB each.</p>
                    </div>
                    <input
                      id="edit-product-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleEditNewImageChange}
                      disabled={editSubmitting}
                    />
                  </label>

                  {editExistingImages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">Current images</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editExistingImages.map((url) => {
                          const isCover = editCover?.kind === 'existing' && editCover.value === url;
                          return (
                            <div
                              key={url}
                              className={`relative overflow-hidden rounded-xl border ${
                                isCover ? 'border-[#00aeef]' : 'border-white/15'
                              } bg-white/5`}
                            >
                              <img src={url} alt="Existing product" className="h-40 w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-between text-xs text-white">
                                <span className="truncate pr-2">{url.split('/').slice(-1)[0]}</span>
                                {isCover ? (
                                  <span className="inline-flex items-center gap-1 text-[#00aeef]">
                                    <FiCheck /> Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setCoverToExisting(url)}
                                    className="text-white/80 hover:text-white"
                                    disabled={editSubmitting}
                                  >
                                    Set cover
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEditExistingImageRemove(url)}
                                disabled={editSubmitting}
                                className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                              >
                                <FiTrash2 />
                                <span className="sr-only">Remove image</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {editNewImages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">New images</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editNewImages.map((item, index) => {
                          const isCover = editCover?.kind === 'new' && editCover.id === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`relative overflow-hidden rounded-xl border ${
                                isCover ? 'border-[#00aeef]' : 'border-white/15'
                              } bg-white/5`}
                            >
                              <img src={item.preview} alt={`New upload ${index + 1}`} className="h-40 w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-between text-xs text-white">
                                <span className="truncate pr-2">{item.file.name}</span>
                                {isCover ? (
                                  <span className="inline-flex items-center gap-1 text-[#00aeef]">
                                    <FiCheck /> Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setCoverToNew(item.id)}
                                    className="text-white/80 hover:text-white"
                                    disabled={editSubmitting}
                                  >
                                    Set cover
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEditNewImageRemove(item.id)}
                                disabled={editSubmitting}
                                className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                              >
                                <FiTrash2 />
                                <span className="sr-only">Remove image</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {editError && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {editError}
                  </div>
                )}

                {editMessage && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {editMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editSubmitting}
                    className="px-5 py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-linear-to-r from-[#00aeef] to-[#0284c7] text-sm font-semibold text-white shadow-lg shadow-[#00aeef]/30 hover:from-[#0891b2] hover:to-[#0369a1] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {editSubmitting ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsProductsPage;
