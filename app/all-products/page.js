'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { CiSearch } from 'react-icons/ci';
import { FaTimes, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { CiHeart, CiShoppingCart } from 'react-icons/ci';
import { FaRegEye } from 'react-icons/fa6';
import { openSans } from '../Cx/Font/font';
import ProductModal from '../Cx/Components/ProductModal';
import { useCart } from '../Cx/Providers/CartProvider';
import { useImagePreloader } from '../Cx/hooks/useImagePreloader';
import { API_BASE, createApiUrl } from '../lib/apiBase';
import { applyCategoryDiscount, discountsArrayToMap } from '../lib/categoryDiscounts';
import { getCategoryPlaceholderImage } from '../lib/categoryPlaceholders';

/** Mattress / product height filter (inches). Mattress variant dimensions in API are stored as inch values; furniture often uses text with units. */
const HEIGHT_INCH_STOPS = [6, 8, 12, 16, 20, 24, 28, 32];
/** Grid pagination — aligned across /all-products, Matteress, furniture routes, etc. */
const PRODUCTS_PER_PAGE = 50;
const CM_TO_INCH = 1 / 2.54;

/**
 * @param {unknown} raw
 * @param {string} catalogType product.type
 * @returns {number|null} height in inches
 */
const parseProductHeightInches = (raw, catalogType) => {
  if (raw === null || raw === undefined || raw === '') return null;
  const type = (catalogType || '').toLowerCase();
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();

  const inchQuoted = s.match(/(\d+(?:\.\d+)?)\s*(?:in(?:ch|ches)?|")/i);
  if (inchQuoted) {
    const n = Number(inchQuoted[1]);
    return Number.isFinite(n) ? n : null;
  }

  const cmMatch = s.match(/(\d+(?:\.\d+)?)\s*cm\b/i);
  if (cmMatch) {
    const n = Number(cmMatch[1]);
    return Number.isFinite(n) ? n * CM_TO_INCH : null;
  }

  const ftMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|')\b/i);
  if (ftMatch) {
    const n = Number(ftMatch[1]);
    return Number.isFinite(n) ? n * 12 : null;
  }

  const plain = s.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!plain) return null;
  const n = Number(plain[1]);
  if (!Number.isFinite(n)) return null;

  if (type === 'bed') {
    return n * CM_TO_INCH;
  }

  if (n > 45) {
    return n * CM_TO_INCH;
  }
  return n;
};

/** Sidebar category label → API `subcategory` query value */
const SUBCATEGORY_SLUGS = {
  Matteress: 'matteress',
  Pillows: 'pillows',
  Accessories: 'accessories',
  'Sofa Cum Bed': 'sofa-cum-bed',
  Furniture: 'furniture',
  Deals: 'deals',
};

const SLUG_TO_LABEL = {
  matteress: 'Matteress',
  pillows: 'Pillows',
  accessories: 'Accessories',
  'sofa-cum-bed': 'Sofa Cum Bed',
  furniture: 'Furniture',
  deals: 'Deals',
};

/** URL ?brand= slug → must match `beds.brand` text (case-insensitive). */
const MATTRESS_BRAND_OPTIONS = [
  { slug: '', label: 'All brands' },
  { slug: 'englander', label: 'Englander' },
  { slug: 'citi-foam', label: 'Citi Foam' },
  { slug: 'diamond', label: 'Diamond' },
  /** Matches `beds.brand` (case-insensitive), e.g. Dolce Vita promos */
  { slug: 'dolcevita', label: 'DolceVita' },
];

const MATTRESS_BRAND_LABEL_BY_SLUG = MATTRESS_BRAND_OPTIONS.reduce((acc, o) => {
  if (o.slug) acc[o.slug] = o.label;
  return acc;
}, {});

function mattressBrandSlugMatchesProduct(slug, productBrand) {
  if (!slug) return true;
  const expected = MATTRESS_BRAND_LABEL_BY_SLUG[slug];
  if (!expected) return true;
  return String(productBrand || '').trim().toLowerCase() === expected.toLowerCase();
}

export const ProductsPage = ({ searchParams: initialSearchParams = {}, restrictToType = null, pageTitle = 'All Products', showCategoryFilter = true } = {}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const PRICE_MIN = 0;
  const PRICE_MAX = 500000;

  const searchFromUrl = searchParams?.get('search') || '';
  const searchFromProps = initialSearchParams?.search || '';
  const searchParam = searchFromUrl || searchFromProps;

  const categoryFromUrl = searchParams?.get('category') || '';
  const categoryFromProps = initialSearchParams?.category || '';
  const categoryParam = categoryFromUrl || categoryFromProps;

  const subcategoryFromUrl = searchParams?.get('subcategory') || '';
  const subcategoryFromProps =
    typeof initialSearchParams?.subcategory === 'string'
      ? initialSearchParams.subcategory
      : '';
  /** URL wins; parent page can pass default (e.g. `/laptops` → matteress) before hydration. */
  const effectiveSubcategory = subcategoryFromUrl || subcategoryFromProps;

  const initialCategory = () => {
    if (restrictToType === 'laptop') return 'Laptops';
    if (restrictToType === 'printer') return 'Printers';
    if (restrictToType === 'scanner') return 'Scanners';
    return SLUG_TO_LABEL[effectiveSubcategory] || 'All Products';
  };

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [priceRange, setPriceRange] = useState({ min: PRICE_MIN, max: PRICE_MAX });

  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  /** '' = no bound; otherwise string key matching HEIGHT_INCH_STOPS */
  const [heightMinIn, setHeightMinIn] = useState('');
  const [heightMaxIn, setHeightMaxIn] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParam);

  const [products, setProducts] = useState([]);
  const [discountMap, setDiscountMap] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  /** Below `lg`, filters toggle so products stay usable; desktop always shows the sidebar. */
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/discounts`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDiscountMap(discountsArrayToMap(d.discounts));
      })
      .catch(() => {
        if (!cancelled) setDiscountMap({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParam) {
      setSearchTerm(searchParam);
      setCurrentPage(1);
    }
  }, [searchParam]);

  useEffect(() => {
    if (restrictToType) return;
    if (!effectiveSubcategory) {
      setSelectedCategory('All Products');
      return;
    }
    const label = SLUG_TO_LABEL[effectiveSubcategory];
    if (label) setSelectedCategory(label);
  }, [effectiveSubcategory, restrictToType]);

  useEffect(() => {
    if (categoryParam) {
      const normalizedCategory = categoryParam.toLowerCase().trim();
      if (normalizedCategory === 'laptop' || normalizedCategory === 'laptops') {
        setSelectedCategory('Laptops');
      } else if (normalizedCategory === 'printer' || normalizedCategory === 'printers') {
        setSelectedCategory('Printers');
      } else if (normalizedCategory === 'scanner' || normalizedCategory === 'scanners') {
        setSelectedCategory('Scanners');
      }
    }
  }, [categoryParam]);

  const handleCategoryChange = useCallback(
    (category) => {
      setSelectedCategory(category);
      setCurrentPage(1);
      if (restrictToType) return;
      const params = new URLSearchParams(searchParams.toString());
      if (category === 'All Products') {
        params.delete('subcategory');
        params.delete('brand');
      } else {
        const slug = SUBCATEGORY_SLUGS[category];
        if (slug) params.set('subcategory', slug);
        if (category !== 'Matteress') {
          params.delete('brand');
        }
      }
      router.push(`/all-products?${params.toString()}`);
    },
    [router, searchParams, restrictToType],
  );

  const handleMattressBrandChange = useCallback(
    (slug) => {
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      if (!slug) {
        params.delete('brand');
      } else {
        params.set('brand', slug);
      }
      router.push(`/all-products?${params.toString()}`);
    },
    [router, searchParams],
  );

  const mattressBrandQuery = searchParams?.get('brand');
  const mattressBrandSlug = useMemo(() => {
    const raw = typeof mattressBrandQuery === 'string' ? mattressBrandQuery.trim().toLowerCase() : '';
    if (!raw) return '';
    return ['englander', 'citi-foam', 'diamond', 'dolcevita'].includes(raw) ? raw : '';
  }, [mattressBrandQuery]);

  const clampPrice = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return PRICE_MIN;
    return Math.min(Math.max(numeric, PRICE_MIN), PRICE_MAX);
  };

  const parsePriceRangeOption = (value) => {
    if (!value) return null;
    const normalized = value.toString().trim().toLowerCase();
    if (normalized === 'all' || normalized === 'custom') {
      return null;
    }
    const parts = normalized.split('-');
    if (parts.length !== 2) return null;
    const min = clampPrice(Number(parts[0]));
    const max = clampPrice(Number(parts[1]));
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return {
      min: Math.min(min, max),
      max: Math.max(min, max),
    };
  };

  const setCustomPriceRange = (changes) => {
    setSelectedPriceRange('custom');
    setPriceRange((prev) => {
      const draft = {
        min: clampPrice(changes.min !== undefined ? changes.min : prev.min),
        max: clampPrice(changes.max !== undefined ? changes.max : prev.max),
      };

      if (draft.min > draft.max) {
        if (changes.min !== undefined && changes.max === undefined) {
          draft.max = draft.min;
        } else if (changes.max !== undefined && changes.min === undefined) {
          draft.min = draft.max;
        } else {
          const baseline = clampPrice(Math.min(draft.min, draft.max));
          draft.min = baseline;
          draft.max = baseline;
        }
      }

      return draft;
    });
    setCurrentPage(1);
  };

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? fallback : num;
  };

  const extractImageArray = (item) => {
    if (!item) return [];
    let urls = [];
    if (Array.isArray(item.imageUrls)) urls = item.imageUrls;
    else if (Array.isArray(item.image_urls)) urls = item.image_urls;
    else if (Array.isArray(item.images)) urls = item.images;
    else if (Array.isArray(item.imageurls)) urls = item.imageurls;

    const normalized = (Array.isArray(urls) ? urls : [])
      .map((url) => (typeof url === 'string' ? url.trim() : ''))
      .filter((url) => url);

    const single =
      typeof item.image === 'string' && item.image.trim() !== '' ? item.image.trim() : '';

    if (!normalized.length && single) return [single];
    if (single && !normalized.includes(single)) return [single, ...normalized];
    return normalized;
  };

  const normalizeProduct = (item, type) => {
    if (!item) return null;
    const placeholder = getCategoryPlaceholderImage(type === 'deal' ? 'deal' : type);
    const rawImages = extractImageArray(item);
    const rawCover =
      typeof item.image === 'string' && item.image.trim() !== '' ? item.image.trim() : '';
    let gallery = rawImages;
    if (rawCover) {
      const idx = gallery.indexOf(rawCover);
      if (idx > 0) {
        gallery = [rawCover, ...gallery.filter((u) => u !== rawCover)];
      } else if (idx === -1) {
        gallery = [rawCover, ...gallery];
      }
    }
    const primaryImage = rawCover || gallery[0] || item.image || placeholder;
    const imageArray = gallery.length ? gallery : [primaryImage];
    const hasId = item.id !== null && item.id !== undefined;
    const rawId = hasId ? item.id.toString() : '';
    const computedName = (item.name ||
      [item.brand, item.series, item.model].filter(Boolean).join(' ').trim() ||
      (type === 'printer'
        ? 'Printer'
        : ['bed', 'accessory', 'furniture', 'sofacumbed', 'deal'].includes(type)
          ? 'Product'
          : 'Laptop')).trim();
    const rawDescription =
      typeof item.description === 'string' ? item.description.trim() : '';
    const computedDescription =
      rawDescription ||
      (type === 'printer'
        ? [item.resolution, item.copyfeature, item.scanfeature, item.duplex]
            .filter(Boolean)
            .join(' • ')
        : item.processor || item.graphics || '') ||
      computedName;
    let parsedPrice = parseNumeric(item.price);
    const firstVariant = Array.isArray(item.variants) && item.variants.length ? item.variants[0] : null;
    const variantsLookCatalog =
      firstVariant &&
      typeof firstVariant === 'object' &&
      (firstVariant.product_id != null || firstVariant.furniture_id != null);
    if (
      Array.isArray(item.variants) &&
      item.variants.length &&
      variantsLookCatalog &&
      (!Number.isFinite(parsedPrice) || parsedPrice <= 0)
    ) {
      const nums = item.variants.map((v) => parseNumeric(v?.price, 0)).filter((n) => n > 0);
      if (nums.length) parsedPrice = Math.min(...nums);
    }
    const hasPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;

    const categoryTitle =
      type === 'printer'
        ? 'Printers'
        : type === 'scanner'
          ? 'Scanners'
          : type === 'bed'
            ? 'Matteress'
            : type === 'accessory'
              ? 'Accessories'
              : type === 'sofacumbed'
                ? 'Sofa Cum Bed'
                : type === 'furniture'
                  ? 'Furniture'
                  : type === 'deal'
                    ? 'Deals'
                    : 'Laptops';

    return {
      ...item,
      id: rawId,
      sourceId: item.id,
      type,
      category: categoryTitle,
      brand: typeof item.brand === 'string' ? item.brand.trim() : '',
      cartId: hasId ? `${type}-${rawId}` : undefined,
      dealItems: type === 'deal' && Array.isArray(item.items) ? item.items : undefined,
      price: hasPrice ? parsedPrice : 0,
      hasPrice,
      rating: parseNumeric(item.rating, 4.5),
      reviews: parseNumeric(item.reviews, 0),
      name: computedName,
      description: computedDescription,
      image: primaryImage,
      imageUrls: imageArray,
      image_urls: imageArray,
      images: imageArray,
      featured: ['true', 't', '1', true, 1].includes(item?.featured),
    };
  };

  const resolveSortParam = (value) => {
    if (!value) return '';
    const normalized = value.toString().trim().toLowerCase();
    if (
      normalized === 'price: low to high' ||
      normalized === 'price low to high' ||
      normalized === 'price - low to high' ||
      normalized === 'price_low_to_high'
    ) {
      return 'price_asc';
    }
    if (
      normalized === 'price: high to low' ||
      normalized === 'price high to low' ||
      normalized === 'price - high to low' ||
      normalized === 'price_high_to_low'
    ) {
      return 'price_desc';
    }
    return '';
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      setFetchError('');

      try {
        const sortParam = resolveSortParam(sortBy);
        const url = createApiUrl('/api/products');
        if (sortParam) {
          url.searchParams.set('sort', sortParam);
        }
        if (restrictToType) {
          url.searchParams.set('category', restrictToType);
        }
        const subForApi = effectiveSubcategory || subcategoryFromUrl;
        if (subForApi) {
          url.searchParams.set('subcategory', subForApi);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const payload = await response.json();
        if (!isMounted) return;

        const normalized = (Array.isArray(payload) ? payload : [])
          .map((item) => {
            let inferredType = item?.type ? String(item.type).toLowerCase() : '';
            if (!inferredType && typeof item?.category === 'string') {
              const categoryLower = item.category.toLowerCase();
              if (categoryLower.includes('printer')) {
                inferredType = 'printer';
              } else if (categoryLower.includes('scanner')) {
                inferredType = 'scanner';
              } else if (
                categoryLower.includes('matteress') ||
                categoryLower.includes('mattress') ||
                categoryLower.includes('bed')
              ) {
                inferredType = 'bed';
              } else if (categoryLower.includes('sofa')) {
                inferredType = 'sofacumbed';
              } else if (categoryLower.includes('furniture')) {
                inferredType = 'furniture';
              } else if (categoryLower.includes('accessor') || categoryLower.includes('pillow')) {
                inferredType = 'accessory';
              } else {
                inferredType = 'bed';
              }
            }
            return normalizeProduct(item, inferredType || 'bed');
          })
          .filter(Boolean);

        setProducts(normalized);
        setCurrentPage(1);
        setFetchError('');
      } catch (error) {
        if (!isMounted) return;
        console.error('products fetch error:', error);
        setProducts([]);
        setCurrentPage(1);
        setFetchError(error.message || 'Failed to load products. Please try again.');
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [sortBy, restrictToType, effectiveSubcategory, subcategoryFromUrl]);

  useEffect(() => {
    if (restrictToType === 'laptop') {
      setSelectedCategory('Laptops');
    } else if (restrictToType === 'printer') {
      setSelectedCategory('Printers');
    }
  }, [restrictToType]);

  useEffect(() => {
    if (!selectedPriceRange || selectedPriceRange === 'custom') {
      return;
    }

    if (selectedPriceRange === 'all') {
      setPriceRange((prev) => {
        if (prev.min === PRICE_MIN && prev.max === PRICE_MAX) {
          return prev;
        }
        return { min: PRICE_MIN, max: PRICE_MAX };
      });
      setCurrentPage(1);
      return;
    }

    const parsed = parsePriceRangeOption(selectedPriceRange);
    if (parsed) {
      setPriceRange((prev) => {
        if (prev.min === parsed.min && prev.max === parsed.max) {
          return prev;
        }
        return parsed;
      });
      setCurrentPage(1);
    }
  }, [selectedPriceRange]);

  const mergeProductDiscount = useCallback(
    (p) => {
      const d = applyCategoryDiscount(p.type, p.price, discountMap);
      if (!d) return { ...p, discountBadge: null, originalListPrice: null };
      if (d.badgeOnly) return { ...p, discountBadge: d.badgeText, originalListPrice: null };
      return {
        ...p,
        discountBadge: d.badgeText,
        originalListPrice: d.original,
        price: d.discounted,
        hasPrice: true,
      };
    },
    [discountMap],
  );

  const filteredProducts = useMemo(() => {
    if (!products.length) return [];

    const withDiscounts = products.map(mergeProductDiscount);

    const applyPriceFilter = Boolean(selectedPriceRange) && selectedPriceRange !== 'all';
    const applySearchFilter = Boolean(searchTerm && searchTerm.trim());
    const minPrice = clampPrice(priceRange?.min ?? PRICE_MIN);
    const maxPriceCandidate = clampPrice(priceRange?.max ?? PRICE_MAX);
    const maxPrice = Math.max(minPrice, maxPriceCandidate);
    const normalizedSearchTerm = applySearchFilter ? searchTerm.trim().toLowerCase() : '';

    const legacyLaptopFilter = restrictToType === 'laptop';
    const legacyPrinterFilter = restrictToType === 'printer';

    return withDiscounts.filter((product) => {
      if (legacyLaptopFilter && product.category !== 'Laptops') {
        return false;
      }
      if (legacyPrinterFilter && product.category !== 'Printers') {
        return false;
      }
      if (restrictToType === 'scanner' && product.category !== 'Scanners') {
        return false;
      }

      const mattressViewActive =
        !restrictToType && (effectiveSubcategory === 'matteress' || selectedCategory === 'Matteress');
      if (
        mattressViewActive &&
        mattressBrandSlug &&
        (product.type || '').toLowerCase() === 'bed' &&
        !mattressBrandSlugMatchesProduct(mattressBrandSlug, product.brand)
      ) {
        return false;
      }

      if (applySearchFilter) {
        const searchableFields = [
          product.name || '',
          product.brand || '',
          product.model || '',
          product.series || '',
          product.description || '',
          product.sku || '',
          product.category || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableFields.includes(normalizedSearchTerm)) {
          return false;
        }
      }

      if (applyPriceFilter) {
        const numericPrice = Number(product.price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
          return false;
        }
        if (!(numericPrice >= minPrice && numericPrice <= maxPrice)) {
          return false;
        }
      }

      const heightMinNum = heightMinIn === '' ? null : Number(heightMinIn);
      const heightMaxNum = heightMaxIn === '' ? null : Number(heightMaxIn);
      const heightFilterActive =
        (heightMinNum !== null && Number.isFinite(heightMinNum)) ||
        (heightMaxNum !== null && Number.isFinite(heightMaxNum));

      if (heightFilterActive && (product.type || '').toLowerCase() !== 'deal') {
        const hIn = parseProductHeightInches(product.height, product.type);
        if (hIn === null || !Number.isFinite(hIn)) {
          return false;
        }
        if (heightMinNum !== null && Number.isFinite(heightMinNum) && hIn < heightMinNum) {
          return false;
        }
        if (heightMaxNum !== null && Number.isFinite(heightMaxNum) && hIn > heightMaxNum) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    mergeProductDiscount,
    restrictToType,
    effectiveSubcategory,
    selectedCategory,
    mattressBrandSlug,
    selectedPriceRange,
    priceRange,
    searchTerm,
    heightMinIn,
    heightMaxIn,
  ]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)),
    [filteredProducts.length],
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage((p) => {
      const tp = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
      return p > tp ? tp : p;
    });
  }, [filteredProducts.length]);

  const formatCurrency = (value) =>
    (Number(value) || 0).toLocaleString('en-PK');

  const formatNumber = (value) =>
    (Number(value) || 0).toLocaleString('en-US');

  const categories = useMemo(() => {
    if (!showCategoryFilter) {
      return [];
    }
    if (restrictToType === 'laptop') {
      return ['Laptops'];
    }
    if (restrictToType === 'printer') {
      return ['Printers'];
    }
    return [
      'All Products',
      'Matteress',
      'Pillows',
      'Accessories',
      'Sofa Cum Bed',
      'Furniture',
      'Deals',
    ];
  }, [restrictToType, showCategoryFilter]);

  const priceRanges = [
    { label: 'All Price', value: 'all' },
    { label: 'Under PKR 25,000', value: '0-25000' },
    { label: 'PKR 25,000 to PKR 50,000', value: '25000-50000' },
    { label: 'PKR 50,000 to PKR 100,000', value: '50000-100000' },
    { label: 'PKR 100,000 to PKR 200,000', value: '100000-200000' },
    { label: 'PKR 200,000 to PKR 400,000', value: '200000-400000' },
    { label: 'PKR 400,000+', value: '400000-500000' },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="text-gray-300">☆</span>);
    }
    return stars;
  };

  const renderProductImage = (
    src,
    alt,
    className,
    size = { width: 160, height: 160 },
    fallbackSrc,
  ) => {
    const resolved = src || fallbackSrc || getCategoryPlaceholderImage('bed');
    if (resolved?.startsWith('http')) {
      return (
        <img
          src={resolved}
          alt={alt}
          className={className}
          style={{ width: size.width, height: size.height }}
        />
      );
    }
    return (
      <Image
        src={resolved}
        alt={alt}
        width={size.width}
        height={size.height}
        className={className}
      />
    );
  };

  const ProductCard = ({ product, onPreview, onAddToCart }) => {
    const productType = (product.type || 'bed').toLowerCase();
    const productId = product.id ? encodeURIComponent(product.id) : '';
    const productHref = productId ? `/product/${productId}?type=${encodeURIComponent(productType)}` : '#';
    const productDescription = product.description || 'Specifications coming soon.';
    const hasPrice = product.hasPrice || (Number.isFinite(product.price) && product.price > 0);
    const images = Array.isArray(product.imageUrls) && product.imageUrls.length
      ? product.imageUrls
      : [product.image || getCategoryPlaceholderImage(productType === 'deal' ? 'deal' : productType, product.category)];
    useImagePreloader(images);
    const [activeImage, setActiveImage] = useState(0);

    const handlePrev = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveImage((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNext = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveImage((prev) => (prev + 1) % images.length);
    };

    const handleDotSelect = (event, index) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveImage(index);
    };

    return (
      <Link
        href={productHref}
        className="relative bg-white border border-gray-300 rounded-sm overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col"
      >
        {productType === 'deal' ? (
          <div className="absolute top-2 left-2 z-20 bg-amber-500 text-white text-[10px] sm:text-xs font-extrabold px-2 py-1 rounded shadow">
            Bundle
          </div>
        ) : product.discountBadge ? (
          <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-[10px] sm:text-xs font-extrabold px-2 py-1 rounded shadow">
            {product.discountBadge}
          </div>
        ) : null}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <div className="bg-white rounded-full p-2 hover:bg-gray-100">
            <CiHeart className="text-lg" />
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onAddToCart?.(product);
            }}
            className="bg-white rounded-full p-2 hover:bg-gray-100"
          >
            <CiShoppingCart className="text-lg" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onPreview?.(product);
            }}
            className="bg-white rounded-full p-2 hover:bg-gray-100"
          >
            <FaRegEye className="text-lg" />
          </button>
        </div>

        <div className="relative w-full h-40 flex items-center justify-center p-4 bg-white">
          {renderProductImage(
            images[activeImage],
            `${product.name} preview ${activeImage + 1}`,
            'object-contain transition-opacity duration-200 max-h-full max-w-full',
            { width: 160, height: 160 },
            getCategoryPlaceholderImage(productType === 'deal' ? 'deal' : productType, product.category),
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 hover:bg-white"
                aria-label="Previous product image"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 hover:bg-white"
                aria-label="Next product image"
              >
                <FaChevronRight className="text-xs" />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 rounded-full px-2 py-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(event) => handleDotSelect(event, index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === activeImage ? 'bg-[#00aeef]' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Show image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1 text-yellow-400 mb-2 text-sm">
            {renderStars(product.rating)}
            <span className="text-gray-600 text-xs ml-1">({formatNumber(product.reviews)})</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">{productDescription}</p>
          <div className="flex items-baseline gap-2 mt-auto flex-wrap">
            <span className="text-base font-bold text-blue-500">
              {hasPrice ? `Rs. ${formatCurrency(product.price)}` : 'Price on request'}
            </span>
            {product.originalListPrice ? (
              <span className="text-sm text-gray-400 line-through">
                Rs. {formatCurrency(product.originalListPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${openSans.className}`}>
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 bg-white">
        {/* Breadcrumbs */}
        <div className="bg-gray-100 border-b border-gray-200 py-5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center px-4 gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-[#00aeef] transition">Home</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{pageTitle}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:gap-6 gap-4">
            <button
              type="button"
              className="lg:hidden flex w-full items-center justify-between rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((open) => !open)}
            >
              <span>Filters</span>
              <FaChevronDown
                className={`text-gray-600 transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>

            {/* Left Sidebar - Filters (collapsible on small screens; unchanged layout from lg up) */}
            <div
              className={`w-full lg:w-64 lg:shrink-0 space-y-4 lg:sticky lg:top-4 lg:h-fit ${
                mobileFiltersOpen ? 'block' : 'hidden'
              } lg:block`}
            >
              {/* Category */}
              {showCategoryFilter && categories.length > 0 && (
                <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">CATEGORY</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={() => handleCategoryChange(category)}
                          className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef]"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showCategoryFilter && selectedCategory === 'Matteress' && (
                <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">MATTRESS BRAND</h3>
                  <p className="text-xs text-gray-500 mb-3">Show mattresses from one supplier only.</p>
                  <label className="block">
                    <span className="sr-only">Mattress brand</span>
                    <select
                      value={mattressBrandSlug}
                      onChange={(e) => handleMattressBrandChange(e.target.value)}
                      className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00aeef] focus:outline-none focus:ring-1 focus:ring-[#00aeef]"
                    >
                      {MATTRESS_BRAND_OPTIONS.map((o) => (
                        <option key={o.slug || 'all'} value={o.slug}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Price Range */}
              <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">PRICE RANGE</h3>
                <div className="space-y-4">
                  {/* Price Range Slider */}
                  <div className="px-2">
                    <div className="relative h-8">
                      <div className="absolute w-full h-2 bg-gray-200 rounded-sm top-3"></div>
                      <div
                        className="absolute h-2 bg-[#00aeef] rounded-sm top-3"
                        style={{
                          left: `${(priceRange.min / PRICE_MAX) * 100}%`,
                          width: `${((priceRange.max - priceRange.min) / PRICE_MAX) * 100}%`
                        }}
                      ></div>
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step="10000"
                        value={priceRange.min}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (Number.isFinite(val)) {
                            setCustomPriceRange({ min: val });
                          }
                        }}
                        className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-20"
                      />
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step="10000"
                        value={priceRange.max}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (Number.isFinite(val)) {
                            setCustomPriceRange({ max: val });
                          }
                        }}
                        className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-30"
                      />
                      <div 
                        className="absolute top-2 w-4 h-4 bg-[#00aeef] rounded-full border-2 border-white shadow pointer-events-none"
                        style={{ left: `calc(${(priceRange.min / PRICE_MAX) * 100}% - 8px)` }}
                      ></div>
                      <div 
                        className="absolute top-2 w-4 h-4 bg-[#00aeef] rounded-full border-2 border-white shadow pointer-events-none"
                        style={{ left: `calc(${(priceRange.max / PRICE_MAX) * 100}% - 8px)` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                      <span>PKR {(priceRange.min / 1000).toFixed(0)}K</span>
                      <span>PKR {(priceRange.max / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomPriceRange({ min: Number.isFinite(val) ? val : PRICE_MIN });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Min price"
                    />
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomPriceRange({ max: Number.isFinite(val) ? val : PRICE_MAX });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Max price"
                    />
                  </div>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range.value}
                          checked={selectedPriceRange === range.value}
                          onChange={(e) => setSelectedPriceRange(e.target.value)}
                          className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef]"
                        />
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                    
                  </div>
                </div>
              </div>

              {/* Height (inches) */}
              <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">HEIGHT (INCHES)</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Filter by product height. Mattress heights use inches in the catalog.
                </p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="height-min-in" className="block text-xs font-medium text-gray-600 mb-1">
                      From
                    </label>
                    <select
                      id="height-min-in"
                      value={heightMinIn}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHeightMinIn(v);
                        setCurrentPage(1);
                        if (v !== '' && heightMaxIn !== '' && Number(v) > Number(heightMaxIn)) {
                          setHeightMaxIn(v);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                    >
                      <option value="">Any</option>
                      {HEIGHT_INCH_STOPS.map((n) => (
                        <option key={`hmin-${n}`} value={String(n)}>
                          {n}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="height-max-in" className="block text-xs font-medium text-gray-600 mb-1">
                      To
                    </label>
                    <select
                      id="height-max-in"
                      value={heightMaxIn}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHeightMaxIn(v);
                        setCurrentPage(1);
                        if (v !== '' && heightMinIn !== '' && Number(v) < Number(heightMinIn)) {
                          setHeightMinIn(v);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                    >
                      <option value="">Any</option>
                      {HEIGHT_INCH_STOPS.map((n) => (
                        <option key={`hmax-${n}`} value={String(n)}>
                          {n}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side - Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Search and Filters Bar */}
              <div className="bg-white rounded-sm p-3 sm:p-4 mb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full md:max-w-md">
                    <div className="flex rounded overflow-hidden border border-gray-300">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for anything..."
                        className="flex-1 px-4 py-2 text-gray-900 bg-white focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const params = new URLSearchParams(window.location.search);
                            if (searchTerm.trim()) {
                              params.set('search', searchTerm.trim());
                            } else {
                              params.delete('search');
                            }
                            router.push(`/all-products?${params.toString()}`);
                          }
                        }}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            const params = new URLSearchParams(window.location.search);
                            params.delete('search');
                            router.push(`/all-products?${params.toString()}`);
                          }}
                          className="bg-white text-gray-700 px-3 hover:bg-gray-100 transition"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams(window.location.search);
                          if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                          } else {
                            params.delete('search');
                          }
                          router.push(`/all-products?${params.toString()}`);
                        }}
                        className="bg-white text-gray-700 px-4 hover:bg-gray-100 transition"
                      >
                        <CiSearch className="text-xl" />
                      </button>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto shrink-0">
                    <span className="text-sm text-gray-700 whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full md:w-auto min-w-0 px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                    >
                      <option value="">Select sorting option</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                    </select>
                    
                  </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600">
                  {loadingProducts
                    ? 'Loading results...'
                    : (() => {
                        const total = filteredProducts.length;
                        if (total === 0) return '0 results found.';
                        if (totalPages <= 1) {
                          return `${total} ${total === 1 ? 'result' : 'results'} found.`;
                        }
                        const from = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
                        const to = Math.min(currentPage * PRODUCTS_PER_PAGE, total);
                        return `${total} ${total === 1 ? 'result' : 'results'} found · Showing ${from}–${to} · Page ${currentPage} of ${totalPages}`;
                      })()}
                </div>
              </div>

            

              {/* Product Grid — extra inset matches sidebar gutter from lg only */}
              <div className="mb-6 lg:pl-4">
                {loadingProducts ? (
                  <div className="py-12 text-sm text-gray-600 text-center">Loading products...</div>
                ) : fetchError ? (
                  <div className="py-12 text-sm text-red-600 text-center">{fetchError}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-sm text-gray-600 text-center">No products available yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.cartId || `${product.type}-${product.id}`}
                        product={product}
                        onPreview={(item) => {
                          setPreviewProduct(item);
                          setPreviewOpen(true);
                        }}
                        onAddToCart={(item) => {
                          if (!item) return;
                          addToCart({
                            id: item.cartId || item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            type: item.type,
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {!loadingProducts && !fetchError && filteredProducts.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-auto pt-6 sm:pt-8 px-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-2.5 sm:px-3 sm:py-3 rounded-full border-blue-400 border-2 text-blue-400 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <FaChevronLeft className="text-sm" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm transition shrink-0 ${
                      currentPage === page
                        ? 'bg-[#00aeef] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {String(page).padStart(2, '0')}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-2.5 sm:px-3 sm:py-3 border-2 border-blue-400 text-blue-400 rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ProductModal
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewProduct(null);
        }}
        product={previewProduct}
      />
    </div>
  );
}

/** `useSearchParams()` must be under Suspense for static generation / Vercel build. */
export default function AllProductsPage() {
  return (
    <Suspense
      fallback={
        <div className={`min-h-screen flex items-center justify-center bg-white text-gray-600 ${openSans.className}`}>
          Loading products…
        </div>
      }
    >
      <ProductsPage />
    </Suspense>
  );
}
