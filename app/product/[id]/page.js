'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FaStar, FaShoppingCart, FaFacebook, FaTwitter, FaChevronLeft, FaChevronRight, FaGift, FaTruck, FaHeadset } from 'react-icons/fa';
import { CiHeart, CiCreditCard1 } from 'react-icons/ci';
import { FaCopy, FaPinterest } from 'react-icons/fa6';
import { MdMoneyOff, MdAttachMoney } from 'react-icons/md';
import Navbar from '../../Cx/Layout/Navbar';
import Footer from '../../Cx/Layout/Footer';
import { openSans } from '../../Cx/Font/font';
import { useCart } from '../../Cx/Providers/CartProvider';
import { API_BASE } from '../../lib/apiBase';

const DEFAULT_MEMORY_OPTIONS = ['8GB Unified Memory', '16GB Unified Memory', '24GB Unified Memory'];
const DEFAULT_DISPLAY_OPTIONS = ['13-inch Retina Display', '14-inch Liquid Retina XDR', '16-inch Liquid Retina XDR'];
const DEFAULT_STORAGE_OPTIONS = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'];

const CATALOG_TYPES = ['bed', 'accessory', 'furniture', 'sofacumbed'];

const SPEC_PLACEHOLDER = '—';

/** Map DB category labels to API `type` (e.g. "Accessories" → accessory). */
const normalizeToCatalogType = (raw) => {
  if (typeof raw !== 'string') return null;
  const n = raw.trim().toLowerCase();
  if (CATALOG_TYPES.includes(n)) return n;
  if (n === 'accessories' || n === 'pillows' || n === 'pillow') return 'accessory';
  if (n === 'matteress' || n === 'mattress' || n === 'beds') return 'bed';
  if (n.includes('sofa')) return 'sofacumbed';
  if (n === 'furniture') return 'furniture';
  return null;
};

const catalogFallbackImage = (type) => {
  switch (type) {
    case 'bed':
      return '/headphone-category.png';
    case 'accessory':
      return '/headphone-category.png';
    case 'furniture':
      return '/toner-category.jpg';
    case 'sofacumbed':
      return '/mnk-category.png';
    default:
      return '/headphone-category.png';
  }
};

/** Case-insensitive pick of first non-empty column (Postgres often returns lowercase keys). */
const pickCatalogColumn = (item, ...candidateNames) => {
  if (!item || typeof item !== 'object') return null;
  const keyByLower = {};
  for (const k of Object.keys(item)) {
    keyByLower[k.toLowerCase()] = k;
  }
  for (const name of candidateNames) {
    const orig = keyByLower[name.toLowerCase()];
    if (orig === undefined) continue;
    const v = item[orig];
    if (v === null || v === undefined) continue;
    if (typeof v === 'bigint') return String(v);
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
    const s = typeof v === 'string' ? v.trim() : String(v).trim();
    if (s !== '') return s;
  }
  return null;
};

const specRow = (label, raw) => ({
  label,
  value: raw != null && String(raw).trim() !== '' ? String(raw).trim() : SPEC_PLACEHOLDER,
});

/** Normalize `image_urls` jsonb / array / JSON string to a list of URL strings (matches Supabase DDL). */
const normalizeImageUrlList = (raw) => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((u) => {
        if (typeof u === 'string') return u.trim();
        if (typeof u === 'number' && Number.isFinite(u)) return String(u);
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return normalizeImageUrlList(parsed);
    } catch {
      /* single URL */
    }
    return [t];
  }
  return [];
};

/**
 * Curated specs aligned with public.beds / accessories / furniture / sofacumbed (Cloudynap DDL).
 * Always shown; missing values → — .
 */
const buildCuratedCatalogSpecs = (item, productType) => {
  if (!item) return [];
  switch (productType) {
    case 'bed':
      return [
        specRow('Length', pickCatalogColumn(item, 'length', 'length_cm', 'length_in', 'length_mm', 'l')),
        specRow('Width', pickCatalogColumn(item, 'width', 'width_cm', 'width_in', 'w')),
        specRow('Height', pickCatalogColumn(item, 'height', 'height_cm', 'height_in', 'thickness', 'h')),
        specRow('Firmness', pickCatalogColumn(item, 'firmness', 'firmness_level', 'firmness_rating')),
        specRow('Fabric', pickCatalogColumn(item, 'fabric', 'fabric_type', 'upholstery', 'material', 'textile')),
        specRow('Series', pickCatalogColumn(item, 'series')),
        specRow('Warranty', pickCatalogColumn(item, 'warranty')),
        specRow('Features', pickCatalogColumn(item, 'features')),
        specRow('Benefits', pickCatalogColumn(item, 'benefits')),
      ];
    case 'sofacumbed':
    case 'accessory':
      return [
        specRow(
          'Firmness',
          pickCatalogColumn(item, 'firmness', 'firmness_level', 'firmness_rating', 'softness'),
        ),
        specRow(
          'Fabric',
          pickCatalogColumn(item, 'fabric', 'fabric_type', 'upholstery', 'material', 'textile'),
        ),
        specRow('Series', pickCatalogColumn(item, 'series')),
        specRow('Warranty', pickCatalogColumn(item, 'warranty')),
        specRow('Features', pickCatalogColumn(item, 'features')),
        specRow('Benefits', pickCatalogColumn(item, 'benefits')),
      ];
    case 'furniture':
      return [
        specRow('Seats', pickCatalogColumn(item, 'seats', 'seat', 'seat_count', 'seating_capacity')),
        specRow(
          'Material',
          pickCatalogColumn(item, 'material', 'wood', 'finish', 'frame_material', 'fabric'),
        ),
        specRow('Warranty', pickCatalogColumn(item, 'warranty')),
      ];
    default:
      return [];
  }
};

const sanitizeSpecValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
};

const ProductPage = () => {
  const params = useParams();
  const productId = params?.id;
  const searchParams = useSearchParams();
  const requestedType = searchParams?.get('type');
  const requestedTypeLower = typeof requestedType === 'string' ? requestedType.toLowerCase() : '';
  const initialType = CATALOG_TYPES.includes(requestedTypeLower)
    ? requestedTypeLower
    : requestedTypeLower === 'printer'
      ? 'printer'
      : requestedTypeLower === 'scanner'
        ? 'scanner'
        : 'laptop';
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('space-gray');
  const [selectedMemory, setSelectedMemory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addMessage, setAddMessage] = useState('');
  const { addToCart } = useCart();
  const thumbnailScrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('description');

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'bigint') {
      const n = Number(value);
      return Number.isNaN(n) ? fallback : n;
    }
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? fallback : num;
  };

  const extractImageArray = (item, type = 'laptop') => {
    if (!item) return [];
    const candidates = [
      item.imageUrls,
      item.image_urls,
      item.images,
      item.imageurls,
    ];
    for (const candidate of candidates) {
      const fromList = normalizeImageUrlList(candidate);
      if (fromList.length) return fromList;
    }
    const singleImageKeys = [
      'image',
      'image_url',
      'imageurl',
      'thumbnail',
      'thumbnail_url',
      'photo',
      'cover_image',
      'img',
      'picture',
      'main_image',
    ];
    for (const key of singleImageKeys) {
      const v = item[key];
      if (typeof v === 'string' && v.trim()) {
        return [v.trim()];
      }
    }
    const placeholder =
      type === 'printer'
        ? '/printer-category.png'
        : CATALOG_TYPES.includes(type)
          ? catalogFallbackImage(type)
          : '/big-laptop.png';
    return [placeholder];
  };

  const resolveProductType = (data, fallback = initialType) => {
    const fromType = normalizeToCatalogType(data?.type);
    if (fromType) return fromType;
    const fromCategory = normalizeToCatalogType(data?.category);
    if (fromCategory) return fromCategory;

    const rawType = data?.type || data?.category;
    if (typeof rawType === 'string') {
      const normalized = rawType.toLowerCase();
      if (CATALOG_TYPES.includes(normalized)) return normalized;
      if (normalized.includes('printer')) return 'printer';
      if (normalized.includes('scanner')) return 'scanner';
      if (normalized.includes('laptop')) return 'laptop';
    }
    return fallback;
  };

  const renderProductImage = (src, alt, className, size, fallback) => {
    if (src?.startsWith?.('http')) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={
            size
              ? { width: size.width, height: size.height, maxWidth: '100%', maxHeight: '100%' }
              : { maxWidth: '100%', maxHeight: '100%' }
          }
        />
      );
    }
    const width = size?.width || 600;
    const height = size?.height || 500;
    return (
      <Image
        src={src || fallback}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      setError('');

      try {
        let endpointType = initialType;
        const buildUrl = (type) => {
          if (CATALOG_TYPES.includes(type)) {
            return `${API_BASE}/api/catalog/${type}/${productId}`;
          }
          if (type === 'printer') return `${API_BASE}/api/printers/${productId}`;
          if (type === 'scanner') return `${API_BASE}/api/scanners/${productId}`;
          return `${API_BASE}/api/laptops/${productId}`;
        };

        let response = await fetch(buildUrl(endpointType));

        if (response.status === 404) {
          // Try fallback types (do not hop Cloudynap tables by id — ids may collide across tables)
          const fallbackTypes = CATALOG_TYPES.includes(endpointType)
            ? []
            : endpointType === 'printer'
            ? ['scanner', 'laptop']
            : endpointType === 'scanner'
              ? ['printer', 'laptop']
              : ['printer', 'scanner'];
          
          for (const fallbackType of fallbackTypes) {
            const fallbackResponse = await fetch(buildUrl(fallbackType));
            if (fallbackResponse.ok) {
              response = fallbackResponse;
              endpointType = fallbackType;
              break;
            }
          }
        }

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found.');
          }
          throw new Error('Failed to load product details. Please try again.');
        }

        const data = await response.json();
        const resolvedType = resolveProductType(data, endpointType);
        const imageArray = extractImageArray(data, resolvedType);
        const placeholder =
          resolvedType === 'printer'
            ? '/printer-category.png'
            : resolvedType === 'scanner'
              ? '/printer-category.png'
              : CATALOG_TYPES.includes(resolvedType)
                ? catalogFallbackImage(resolvedType)
                : '/big-laptop.png';
        const images = imageArray.length ? imageArray : [placeholder];
        const rawId =
          data.id !== null && data.id !== undefined && data.id.toString
            ? data.id.toString()
            : data.id;
        const computedName =
          (data.name ||
            (resolvedType === 'printer'
              ? [data.brand, data.series].filter(Boolean).join(' ').trim()
              : [data.brand, data.model || data.series].filter(Boolean).join(' ').trim())) || '';
        const finalName = computedName.trim()
          ? computedName.trim()
          : resolvedType === 'printer'
            ? 'Printer'
            : 'Product';
        const normalizedDescription =
          typeof data.description === 'string' ? data.description.trim() : '';
        const computedDescription =
          normalizedDescription ||
          (resolvedType === 'printer'
            ? [data.resolution, data.copyfeature, data.scanfeature, data.duplex]
                .filter(Boolean)
                .join(' • ')
            : data.processor || data.graphics || '') ||
          finalName;

        const normalized = {
          ...data,
          id: rawId,
          type: resolvedType,
          category:
            data.category ||
            (resolvedType === 'printer'
              ? 'Printers'
              : resolvedType === 'scanner'
                ? 'Scanners'
                : resolvedType === 'bed'
                  ? 'Matteress'
                  : resolvedType === 'accessory'
                    ? 'Accessories'
                    : resolvedType === 'sofacumbed'
                      ? 'Sofa Cum Bed'
                      : resolvedType === 'furniture'
                        ? 'Furniture'
                        : 'Laptops'),
          cartId: rawId ? `${resolvedType}-${rawId}` : undefined,
          name: finalName,
          description: computedDescription,
          price: parseNumeric(data.price, 0),
          hasPrice: parseNumeric(data.price, 0) > 0,
          rating: parseNumeric(data.rating, 4.7) || 4.7,
          reviews: parseNumeric(data.reviews, 0),
          brand: data.brand || 'Unknown',
          model: data.model || data.series || `SKU-${data.id}`,
          image: images[0] || placeholder,
          imageUrls: images,
          image_urls: images,
          images,
        };
        setProduct(normalized);
        if (
          normalized.type === 'printer' ||
          normalized.type === 'scanner' ||
          CATALOG_TYPES.includes(normalized.type)
        ) {
          setSelectedMemory('');
          setSelectedSize('');
          setSelectedStorage('');
        } else {
          const memoryValue = sanitizeSpecValue(normalized.memory);
          const displayValue = sanitizeSpecValue(normalized.display);
          const storageValue = sanitizeSpecValue(normalized.storage);
          setSelectedMemory(memoryValue || DEFAULT_MEMORY_OPTIONS[0]);
          setSelectedSize(displayValue || DEFAULT_DISPLAY_OPTIONS[0]);
          setSelectedStorage(storageValue || DEFAULT_STORAGE_OPTIONS[0]);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err.message || 'Failed to load product details.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, initialType]);

  const images = React.useMemo(() => {
    if (!product) return [];
    return extractImageArray(product, product.type || initialType);
  }, [product, initialType]);

  useEffect(() => {
    if (selectedImage > 0 && selectedImage >= images.length) {
      setSelectedImage(0);
    }
  }, [images.length, selectedImage]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-[#00aeef] fill-current" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-[#00aeef] fill-current opacity-50" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FaStar key={i} className="text-gray-300" />);
    }
    
    return stars;
  };

  const scrollThumbnailsLeft = () => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollThumbnailsRight = () => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  const productTypeResolved = product?.type || initialType;
  const isPrinter = productTypeResolved === 'printer';
  const isScanner = productTypeResolved === 'scanner';
  const isCatalog = CATALOG_TYPES.includes(productTypeResolved);
  /** Only legacy laptop SKUs use RAM / display / storage variant UI. */
  const showLaptopVariantUi = productTypeResolved === 'laptop';

  const memoryOptions = useMemo(() => {
    if (!product || isPrinter || isScanner || isCatalog) return [];
    const value = sanitizeSpecValue(product.memory);
    if (value) return [value];
    return DEFAULT_MEMORY_OPTIONS;
  }, [product, isPrinter, isCatalog]);

  const displayOptions = useMemo(() => {
    if (!product || isPrinter || isScanner || isCatalog) return [];
    const value = sanitizeSpecValue(product.display);
    if (value) return [value];
    return DEFAULT_DISPLAY_OPTIONS;
  }, [product, isPrinter, isCatalog]);

  const storageOptions = useMemo(() => {
    if (!product || isPrinter || isScanner || isCatalog) return [];
    const value = sanitizeSpecValue(product.storage);
    if (value) return [value];
    return DEFAULT_STORAGE_OPTIONS;
  }, [product, isPrinter, isCatalog]);

  const effectiveMemory = selectedMemory || memoryOptions[0] || '';
  const effectiveDisplay = selectedSize || displayOptions[0] || '';
  const effectiveStorage = selectedStorage || storageOptions[0] || '';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${openSans.className}`}>
        <div className="text-gray-600">Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col ${openSans.className}`}>
        <Navbar />
        <div className="grow flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">Product Unavailable</h1>
            <p className="text-gray-600">{error}</p>
            <Link
              href="/all-products"
              className="inline-flex items-center justify-center rounded-xs bg-[#00aeef] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0099d9] transition"
            >
              Back to Products
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK').format(price);
  };

  const productTitle = product.name || 'Product';
  const productBrand = product.brand || 'Unknown';
  const productModel = product.model || `SKU-${product.id}`;
  const availability = 'In Stock';
  const rating = product.rating || 4.7;
  const reviews = product.reviews || 125;
  const categoryLabel =
    product.category ||
    (product.type === 'printer'
      ? 'Printers'
      : product.type === 'scanner'
        ? 'Scanners'
        : product.type === 'bed'
          ? 'Matteress'
          : product.type === 'accessory'
            ? 'Accessories'
            : product.type === 'furniture'
              ? 'Furniture'
              : product.type === 'sofacumbed'
                ? 'Sofa Cum Bed'
                : 'Laptops');

  const handleAddToCart = () => {
    if (!product) return;
    const cartId = product.cartId || (product.type ? `${product.type}-${product.id}` : product.id);
    const imageSrc =
      product.image ||
      (product.type === 'printer' || product.type === 'scanner'
        ? '/printer-category.png'
        : CATALOG_TYPES.includes(product.type)
          ? catalogFallbackImage(product.type)
          : '/big-laptop.png');
    addToCart(
      {
        id: cartId,
        productId: product.id,
        type: product.type,
        category: product.category,
        name: product.name,
        price: product.price,
        image: imageSrc,
        brand: product.brand,
        model: product.model,
      },
      quantity,
    );
    setAddMessage('Product added to cart.');
    setTimeout(() => setAddMessage(''), 2500);
  };


  const productType = product.type || initialType;
  const specListRaw =
    CATALOG_TYPES.includes(productType)
      ? buildCuratedCatalogSpecs(product, productType)
      : productType === 'printer'
        ? [
            { label: 'Brand', value: product.brand },
            { label: 'Series', value: product.series },
            { label: 'Memory', value: product.memory },
            { label: 'Paper Input', value: product.paperinput },
            { label: 'Paper Output', value: product.paperoutput },
            { label: 'Paper Types', value: product.papertypes },
            { label: 'Dimensions', value: product.dimensions },
            { label: 'Weight', value: product.weight },
            { label: 'Power', value: product.power },
            { label: 'Duplex', value: product.duplex },
            { label: 'Resolution', value: product.resolution },
            { label: 'Copy Feature', value: product.copyfeature },
            { label: 'Scan Feature', value: product.scanfeature },
            { label: 'Wireless', value: product.wireless },
          ]
        : productType === 'scanner'
          ? [
              { label: 'Brand', value: product.brand },
              { label: 'Series', value: product.series },
              { label: 'Model', value: product.model },
              { label: 'Memory', value: product.memory },
              { label: 'Paper Types', value: product.paper_types },
              { label: 'Paper Size', value: product.paper_size },
              { label: 'Dimensions', value: product.dimensions },
              { label: 'Weight', value: product.weight },
              { label: 'Power', value: product.power },
              { label: 'Duplex', value: product.duplex },
              { label: 'Resolution', value: product.resolution },
              { label: 'Color Scan', value: product.color_scan },
              { label: 'Wireless', value: product.wireless },
            ]
          : [
              { label: 'Processor', value: product.processor },
              { label: 'Graphics', value: product.graphics },
              { label: 'Display', value: product.display },
              { label: 'Memory', value: product.memory },
              { label: 'Storage', value: product.storage },
              { label: 'Adapter', value: product.adapter },
              { label: 'Wi-Fi', value: product.wifi },
              { label: 'Bluetooth', value: product.bluetooth },
              { label: 'Camera', value: product.camera },
              { label: 'Ports', value: product.port },
              { label: 'Operating System', value: product.os },
              { label: 'Microphone', value: product.mic },
              { label: 'Battery', value: product.battery },
            ];
  const specList = CATALOG_TYPES.includes(productType)
    ? specListRaw
    : specListRaw.filter((spec) => spec.value);

  const isCatalogProduct = CATALOG_TYPES.includes(productType);
  const primaryImageFallback =
    product.type === 'printer' || product.type === 'scanner'
      ? '/printer-category.png'
      : CATALOG_TYPES.includes(product.type)
        ? catalogFallbackImage(product.type)
        : '/big-laptop.png';

  return (
    <div className={`min-h-screen flex flex-col bg-white ${openSans.className}`}>
      {/* Navbar */}
      <Navbar />

      {/* Sticky Breadcrumb */}
      <div className={`sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm ${openSans.className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">
              Home
            </Link>
            <span className="text-gray-900">›</span>
            <Link href="/all-products" className="text-gray-600 hover:text-[#00aeef] transition">
              {categoryLabel}
            </Link>
            <span className="text-gray-900">›</span>
            <span className="text-blue-500">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div className="mb-4 relative bg-white border border-gray-300 rounded-sm overflow-hidden flex items-center justify-center h-[340px] sm:h-[400px] lg:h-[460px]">
              {renderProductImage(
                images[selectedImage] || product.image,
                product.name,
                'h-full w-auto max-h-full max-w-full object-contain',
                { width: 600, height: 500 },
                primaryImageFallback,
              )}
            </div>

            {/* Thumbnail Carousel */}
            <div className="relative flex items-center gap-2">
              {/* Left Arrow */}
              <button
                onClick={scrollThumbnailsLeft}
                className="shrink-0 w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full flex items-center justify-center transition z-10"
                aria-label="Scroll thumbnails left"
              >
                <FaChevronLeft className="text-sm" />
              </button>

              {/* Thumbnail Container */}
              <div 
                ref={thumbnailScrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 border-2 rounded-sm overflow-hidden transition ${
                      selectedImage === index ? 'border-[#00aeef]' : 'border-gray-200'
                    }`}
                  >
                    {renderProductImage(
                      img,
                      `Thumbnail ${index + 1}`,
                      'w-20 h-20 object-contain',
                      { width: 80, height: 80 },
                      primaryImageFallback,
                    )}
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={scrollThumbnailsRight}
                className="shrink-0 w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full flex items-center justify-center transition z-10"
                aria-label="Scroll thumbnails right"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4">
            {/* Rating and Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {renderStars(rating)}
                </div>
                <span className="text-sm text-black font-bold">{rating} Star Rating</span>
                <span className="text-sm text-gray-600">({formatPrice(reviews)} User feedback)</span>
              </div>
              <h1 className="text-xl text-gray-900 mb-4">
                {productTitle}
              </h1>
            </div>

            {/* SKU and Brand */}
            <div className='flex flex-col sm:flex-row justify-between gap-4'>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Sku: <span className="font-bold text-black">{productModel}</span></p>
                <p>Brand: <span className="font-bold text-black">{productBrand}</span></p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-gray-600 font-medium">Availability: <span className="font-bold text-green-500">{availability}</span></p>
                <p className="text-gray-600">Category: <span className="font-bold text-black">{categoryLabel}</span></p>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-[#00aeef]">
                {product.price > 0 ? `PKR ${formatPrice(product.price)}` : 'Price on request'}
              </span>
            </div>

            {isCatalogProduct && specList.length > 0 && (
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Product details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {specList.map((row) => (
                    <React.Fragment key={row.label}>
                      <dt className="text-gray-600">{row.label}</dt>
                      <dd className="font-medium text-gray-900">{row.value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}

            {showLaptopVariantUi && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'space-gray', label: 'Space Gray' },
                      { id: 'silver', label: 'Silver' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedColor(option.id)}
                        className={`px-4 py-2 text-sm border rounded-sm transition ${
                          selectedColor === option.id
                            ? 'border-[#00aeef] text-[#00aeef]'
                            : 'border-gray-300 text-gray-600 hover:border-[#00aeef]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Memory
                  </label>
                  <select
                    value={effectiveMemory}
                    onChange={(e) => setSelectedMemory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                    disabled={memoryOptions.length <= 1}
                  >
                    {memoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showLaptopVariantUi && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                  value={effectiveDisplay}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                  disabled={displayOptions.length <= 1}
                  >
                  {displayOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage
                  </label>
                  <select
                  value={effectiveStorage}
                    onChange={(e) => setSelectedStorage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                  disabled={storageOptions.length <= 1}
                  >
                  {storageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-12 border border-gray-300 rounded-sm hover:bg-gray-100 flex items-center justify-center text-gray-700"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity.toString().padStart(2, '0')}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-12 text-center border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef] text-gray-900"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-12 border border-gray-300 rounded-sm hover:bg-gray-100 flex items-center justify-center text-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 flex-wrap'>
              <button
                onClick={handleAddToCart}
                className="flex-1 min-w-[160px] bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-sm font-bold py-3 flex items-center justify-center gap-2 transition"
              >
                <FaShoppingCart />
                ADD TO CART
              </button>
              <button className="flex-1 min-w-[160px] bg-white border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white rounded-sm font-bold py-3 transition">
                BUY NOW
              </button>
              {addMessage && (
                <div className="basis-full text-sm font-medium text-green-600 mt-2">
                  {addMessage}
                </div>
              )}
            </div>

            {/* Add to Wishlist and Share Product */}
            <div className='flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200'>
              <button className='text-sm font-medium text-gray-700 hover:text-[#00aeef] transition flex items-center gap-2'>
                <CiHeart className="text-lg" />
                Add to Wishlist
              </button>
              <div className='flex items-center gap-2'>
                <p className="text-sm font-medium text-gray-700">Share product:</p>
                <div className="flex items-center gap-3">
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Copy link">
                    <FaCopy className="text-xl" />
                  </button>
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Share on Facebook">
                    <FaFacebook className="text-xl" />
                  </button>
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Share on Twitter">
                    <FaTwitter className="text-xl" />
                  </button>
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Share on Pinterest">
                    <FaPinterest className="text-xl" />
                  </button>
                </div>
              </div>
            </div>

            {/* Safe Checkout */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">100% Guarantee Safe Checkout</p>
              <div className="flex items-center gap-3 flex-wrap">
                <Image src="/visa-black.png" alt="Visa" width={50} height={30} className="object-contain" />
                <Image src="/mastercard.png" alt="Mastercard" width={30} height={30} className="object-contain" />
                <Image src="/easypaisa.png" alt="EasyPaisa" width={20} height={20} className="object-contain" />
                <Image src="/sadapay.png" alt="SadaPay" width={20} height={30} className="object-contain" />
                <Image src="/nayapay.png" alt="NayaPay" width={25} height={30} className="object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-12 max-w-7xl mx-auto px-4">
          {/* Wrapper with border */}
          <div className="border border-gray-200 rounded-sm bg-white">
            {/* Tabs */}
            <div className="flex justify-center border-b border-gray-200">
              <div className="flex flex-wrap">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'additional', label: 'Additional Information' },
                  { id: 'specs', label: 'Specification' },
                  { id: 'reviews', label: 'Review' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'text-gray-900 border-b-2 border-[#00aeef]'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'description' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 pr-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                    <div className="text-sm text-gray-600 space-y-3">
                      {product.description ? (
                        product.description.split('\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                      ) : (
                        <p>
                          Detailed description for this product will be available soon.
                          Please review the specifications for more information about
                          performance and features.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-3 px-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Feature</h3>
                    <div className="space-y-4 text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        <FaGift className="text-2xl text-[#00aeef]" />
                        <span>Free 1 Year Warranty</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaTruck className="text-2xl text-[#00aeef]" />
                        <span>Free Shipping &amp; Fast Delivery</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MdAttachMoney className="text-2xl text-[#00aeef]" />
                        <span>100% Money-back guarantee</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaHeadset className="text-2xl text-[#00aeef]" />
                        <span>24/7 Customer support</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CiCreditCard1 className="text-2xl text-[#00aeef]" />
                        <span>Secure payment method</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-3 border-l border-gray-200 pl-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Shipping Information
                    </h3>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>Courier: 2-4 days, free shipping</p>
                      <p>Local Shipping: up to one week</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'additional' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">Brand</p>
                      <p>{productBrand}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Model</p>
                      <p>{productModel}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Availability</p>
                      <p>{availability}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Category</p>
                      <p>{categoryLabel}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Specification
                  </h3>
                  {specList.length === 0 ? (
                    <p>Specifications will be available soon.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {specList.map((spec) => (
                        <div key={spec.label}>
                          <p className="font-bold text-gray-900">{spec.label}</p>
                          <p>{spec.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                  <p>Reviews will be available soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products — legacy laptop placeholders only when viewing a laptop SKU */}
        <div className="mt-16 max-w-7xl mx-auto px-4">
          {!showLaptopVariantUi ? (
            <div className="rounded-sm border border-gray-200 bg-gray-50 px-6 py-10 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">More products</h3>
              <p className="text-sm text-gray-600 mb-4">
                Browse the full catalog for beds, furniture, accessories, and more.
              </p>
              <Link
                href="/all-products"
                className="inline-flex items-center justify-center rounded-sm bg-[#00aeef] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0099d9] transition"
              >
                View all products
              </Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Column 1 - Related Product */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">RELATED PRODUCT</h3>
              <div className="space-y-3">
                <Link href="/product/hp-elitebook-840" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/laptop-category.jpg" alt="HP Elitebook 840" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">HP Elitebook 840 Core i5</p>
                    <p className="text-xs text-gray-600 mb-2">16GB RAM 512GB SSD</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 150,000</p>
                  </div>
                </Link>
                <Link href="/product/dell-victus" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/laptop-category.jpg" alt="DELL VICTUS" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">DELL VICTUS Core i7 13th Gen</p>
                    <p className="text-xs text-gray-600 mb-2">32GB RAM, 1TB SSD</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 200,000</p>
                  </div>
                </Link>
                <Link href="/product/macbook-m3" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/laptop-category.jpg" alt="Macbook M3" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Macbook M3</p>
                    <p className="text-xs text-gray-600 mb-2">Latest M3 Chip</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 300,000</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 2 - Product Accessories */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">PRODUCT ACCESSORIES</h3>
              <div className="space-y-3">
                <Link href="/product/logitech-b100" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/mnk-category.png" alt="Logitech B100 Mouse" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Logitech B100 Mouse</p>
                    <p className="text-xs text-gray-600 mb-2">Wired Mouse</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 1,500</p>
                  </div>
                </Link>
                <Link href="/product/gaming-mouse" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/mnk-category.png" alt="Gaming Mouse" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Gaming Mouse</p>
                    <p className="text-xs text-gray-600 mb-2">RGB Gaming Mouse</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 10,500</p>
                  </div>
                </Link>
                <Link href="/product/wireless-gaming-mouse" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/mnk-category.png" alt="Wireless Gaming Mouse" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Wireless Gaming Mouse</p>
                    <p className="text-xs text-gray-600 mb-2">Wireless RGB Mouse</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 25,500</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 3 - Apple Product */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">APPLE PRODUCT</h3>
              <div className="space-y-3">
                <Link href="/product/macbook-pro-2023" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/big-laptop.png" alt="2023 Macbook Pro" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">2023 Macbook Pro</p>
                    <p className="text-xs text-gray-600 mb-2">M2 Pro Chip</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 121,500</p>
                  </div>
                </Link>
                <Link href="/product/macbook-air-2020" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/big-laptop.png" alt="2020 Macbook Air" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">2020 Macbook Air</p>
                    <p className="text-xs text-gray-600 mb-2">M1 Chip</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 121,500</p>
                  </div>
                </Link>
                <Link href="/product/macbook-m3-shadow" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/big-laptop.png" alt="Macbook M3 Shadow Black" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Macbook M3 Shadow Black</p>
                    <p className="text-xs text-gray-600 mb-2">M3 Chip, Space Black</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 221,500</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 4 - Featured Products */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">FEATURED PRODUCTS</h3>
              <div className="space-y-3">
                <Link href="/product/lcd-screen-55" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/monitor-category.png" alt="55 Inch LCD Screen" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">55" Wide LCD Screen</p>
                    <p className="text-xs text-gray-600 mb-2">Smart TV Display</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 165,500</p>
                  </div>
                </Link>
                <Link href="/product/sony-headphones" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/headphone-category.png" alt="Sony Headphones" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Sony DSCHXB Wireless Headphones</p>
                    <p className="text-xs text-gray-600 mb-2">Wireless Over-Ear</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 60,500</p>
                  </div>
                </Link>
                <Link href="/product/dell-optiplex-i5" className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white">
                  <Image src="/laptop-category.jpg" alt="Dell Optiplex" width={80} height={80} className="object-contain" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Dell Optiplex Core i5 11th Gen</p>
                    <p className="text-xs text-gray-600 mb-2">16GB 512 GB</p>
                    <p className="text-sm font-bold text-[#00aeef]">PKR 115,500</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Hide scrollbar for webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ProductPage;
